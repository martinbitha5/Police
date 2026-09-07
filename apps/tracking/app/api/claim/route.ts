import { NextResponse, type NextRequest } from 'next/server';
import { CLAIM_CATEGORY_LABEL, type ClaimCategory, type BaggageClaimResult } from '@police/shared';
import { createAdminClient } from '@/supabase/admin';
import { rateLimit, clientIp } from '@/lib/rateLimit';

const TAG_RE = /^\d{10}$/;
const MAX_MESSAGE = 2000;
const MAX_CONTACT = 200;

const reject = (message: string, status: number) =>
  NextResponse.json<BaggageClaimResult>({ status: 'rejected', message }, { status });

interface BagRow {
  id: string;
  flight_id: string;
  passenger_id: string;
}

export async function POST(request: NextRequest) {
  // Anti-spam : plafonne les envois de réclamation par IP.
  if (!rateLimit(`claim:${clientIp(request)}`, 8, 60_000)) {
    return reject('Trop de réclamations envoyées. Réessayez dans une minute.', 429);
  }

  let body: { tagNumber?: unknown; category?: unknown; message?: unknown; contact?: unknown };
  try {
    body = await request.json();
  } catch {
    return reject('Requête invalide.', 400);
  }

  const tag = typeof body.tagNumber === 'string' ? body.tagNumber.trim() : '';
  const category = typeof body.category === 'string' ? body.category : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const contact = typeof body.contact === 'string' ? body.contact.trim().slice(0, MAX_CONTACT) : '';

  if (!TAG_RE.test(tag)) return reject('Numéro d’étiquette invalide (10 chiffres).', 400);
  if (!(category in CLAIM_CATEGORY_LABEL)) return reject('Type de problème invalide.', 400);
  if (!message) return reject('Veuillez décrire le problème.', 400);
  if (message.length > MAX_MESSAGE) return reject('Description trop longue.', 400);

  const categoryLabel = CLAIM_CATEGORY_LABEL[category as ClaimCategory];
  const supabase = createAdminClient();

  // Le bagage doit exister. tag_number n'est unique que par (flight_id, tag_number) :
  // on prend la ligne passager la plus récente pour ce tag (E-02 : jamais
  // maybeSingle sur une colonne non unique, qui plantait sur une série recyclée).
  const { data: bagRows, error: bagErr } = await supabase
    .from('baggage')
    .select('id, flight_id, passenger_id')
    .eq('tag_number', tag)
    .eq('kind', 'passenger')
    .order('scanned_at', { ascending: false })
    .limit(1);
  if (bagErr) return reject('Erreur lors de la recherche du bagage.', 500);
  const bag = (bagRows as BagRow[] | null)?.[0];
  if (!bag) return reject('Aucun bagage trouvé pour ce numéro d’étiquette.', 404);

  // Bloc de réclamation horodaté, ajouté aux notes du dossier.
  const stamp = new Date().toLocaleString('fr-FR');
  const contactLine = contact ? `Contact : ${contact}\n` : '';
  const claimBlock = `[Réclamation passager du ${stamp}]\n${contactLine}Type : ${categoryLabel}\n${message}`;

  // E-02 : ne JAMAIS rouvrir un litige résolu depuis le canal public ni effacer
  // qui l'a résolu. On rattache la réclamation à un litige ACTIF s'il en existe
  // un (notes bornées), sinon on crée un nouveau dossier. Un superviseur ayant
  // résolu un litige ne le voit pas défait par une réclamation publique.
  const MAX_NOTES = 8000;
  const { data: active, error: activeErr } = await supabase
    .from('baggage_disputes')
    .select('id, notes')
    .eq('baggage_id', bag.id)
    .in('status', ['open', 'investigating'])
    .order('created_at', { ascending: false })
    .limit(1);
  if (activeErr) return reject('Erreur lors de l’enregistrement.', 500);

  const activeDispute = (active as { id: string; notes: string | null }[] | null)?.[0];
  if (activeDispute) {
    const merged = activeDispute.notes ? `${activeDispute.notes}\n\n${claimBlock}` : claimBlock;
    // Borne la taille des notes : on conserve la fin (les réclamations récentes).
    const newNotes = merged.length > MAX_NOTES ? merged.slice(merged.length - MAX_NOTES) : merged;
    const { error } = await supabase
      .from('baggage_disputes')
      .update({ notes: newNotes, from_passenger: true })
      .eq('id', activeDispute.id);
    if (error) return reject('Erreur lors de l’enregistrement.', 500);
  } else {
    const { error } = await supabase.from('baggage_disputes').insert({
      baggage_id: bag.id,
      flight_id: bag.flight_id,
      passenger_id: bag.passenger_id,
      tag_number: tag,
      status: 'open',
      reason: categoryLabel,
      notes: claimBlock.slice(0, MAX_NOTES),
      from_passenger: true,
      created_by: null,
    });
    if (error) return reject('Erreur lors de l’enregistrement.', 500);
  }

  return NextResponse.json<BaggageClaimResult>({
    status: 'accepted',
    message: 'Réclamation envoyée. Notre équipe va la traiter.',
  });
}
