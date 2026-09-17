// Fonction edge `push-fraud-alert` : envoie une notification Web Push aux
// superviseurs et admins du périmètre d'une alerte fraude.
//
// Appelée par le trigger `push_fraud_alert_trg` (pg_net) avec { alert_id }.
// Authentification par jeton partagé dans l'en-tête `x-push-secret`, comparé
// au secret Vault `push_webhook_secret` (pas de JWT : l'appelant est la base).
//
// Périmètre = même règle que la RLS `flight_in_scope` : compagnie du vol, et
// escale du profil parmi origine, destination ou escales intermédiaires.
//
// Déployée avec verify_jwt = false. Clés VAPID lues dans Vault via la RPC
// `push_secret` (service_role uniquement).

import { createClient } from 'npm:@supabase/supabase-js@2.47.10';
import webpush from 'npm:web-push@3.6.7';

interface AlertRow {
  id: string;
  flight_id: string | null;
  pnr: string | null;
  passenger_name: string | null;
  tag_number: string | null;
  declared_baggage_count: number | null;
  gate: string | null;
  reason: string | null;
  created_at: string;
}

interface FlightRow {
  id: string;
  flight_number: string;
  origin: string;
  destination: string;
  stops: string[] | null;
  airline_code: string | null;
}

interface SubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json(405, { error: 'POST attendu' });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  // ── Authentification de l'appelant ─────────────────────────
  const { data: expected } = await supabase.rpc('push_secret', { secret_name: 'push_webhook_secret' });
  const provided = req.headers.get('x-push-secret') ?? '';
  if (!expected || provided.length !== expected.length || provided !== expected) {
    return json(401, { error: 'Jeton invalide' });
  }

  let alertId = '';
  try {
    const body = (await req.json()) as { alert_id?: string };
    alertId = String(body.alert_id ?? '');
  } catch {
    return json(400, { error: 'Corps JSON attendu' });
  }
  if (!/^[0-9a-f-]{36}$/i.test(alertId)) return json(400, { error: 'alert_id invalide' });

  // ── Alerte et vol ──────────────────────────────────────────
  const { data: alert } = await supabase.from('fraud_alerts').select('*').eq('id', alertId).maybeSingle<AlertRow>();
  if (!alert) return json(404, { error: 'Alerte introuvable' });
  if (!alert.flight_id) return json(200, { sent: 0, reason: 'alerte sans vol' });

  const { data: flight } = await supabase
    .from('flights')
    .select('id, flight_number, origin, destination, stops, airline_code')
    .eq('id', alert.flight_id)
    .maybeSingle<FlightRow>();
  if (!flight) return json(404, { error: 'Vol introuvable' });

  // ── Destinataires : superviseurs et admins du périmètre ────
  const airports = [flight.origin, flight.destination, ...(flight.stops ?? [])].filter(Boolean);
  let profilesQuery = supabase
    .from('profiles')
    .select('id')
    .in('role', ['supervisor', 'admin'])
    .in('airport_code', airports);
  if (flight.airline_code) profilesQuery = profilesQuery.eq('airline_code', flight.airline_code);
  const { data: profiles } = await profilesQuery;
  const userIds = ((profiles as { id: string }[] | null) ?? []).map((p) => p.id);
  if (userIds.length === 0) return json(200, { sent: 0, reason: 'aucun profil dans le périmètre' });

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .in('user_id', userIds);
  const subscriptions = (subs as SubscriptionRow[] | null) ?? [];
  if (subscriptions.length === 0) return json(200, { sent: 0, reason: 'aucun abonnement' });

  // ── Contenu ────────────────────────────────────────────────
  // Une alerte n'identifie pas forcément un passager (règle 1 : étiquette
  // orpheline). On ne nomme quelqu'un que si l'alerte le porte déjà.
  const title = `Alerte fraude ${flight.flight_number}${alert.gate ? `, ${alert.gate}` : ''}`;
  const lines: string[] = [];
  if (alert.reason) lines.push(alert.reason);
  if (alert.tag_number) lines.push(`Étiquette ${alert.tag_number}`);
  if (alert.passenger_name) {
    lines.push(`${alert.passenger_name}${alert.pnr ? `, PNR ${alert.pnr}` : ''}`);
  }
  lines.push('Intercepter le bagage sur le tapis.');
  const payload = JSON.stringify({
    title,
    body: lines.join('\n'),
    url: `/dashboard?vol=${flight.id}`,
    tag: `fraud-${alert.id}`,
  });

  // ── Envoi ──────────────────────────────────────────────────
  const [{ data: publicKey }, { data: privateKey }] = await Promise.all([
    supabase.rpc('push_secret', { secret_name: 'vapid_public_key' }),
    supabase.rpc('push_secret', { secret_name: 'vapid_private_key' }),
  ]);
  if (!publicKey || !privateKey) return json(500, { error: 'Clés VAPID absentes de Vault' });
  webpush.setVapidDetails('mailto:contact@ats-handling-rdc.com', publicKey, privateKey);

  let sent = 0;
  let removed = 0;
  let failed = 0;
  const now = new Date().toISOString();

  await Promise.all(
    subscriptions.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { TTL: 600, urgency: 'high' },
        );
        sent += 1;
        await supabase.from('push_subscriptions').update({ last_success_at: now }).eq('id', s.id);
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        // 404 / 410 : abonnement expiré ou révoqué côté navigateur, on l'oublie.
        if (status === 404 || status === 410) {
          removed += 1;
          await supabase.from('push_subscriptions').delete().eq('id', s.id);
        } else {
          failed += 1;
          console.error('push failed', s.id, status, (e as Error).message);
        }
      }
    }),
  );

  return json(200, { sent, failed, removed, recipients: userIds.length });
});
