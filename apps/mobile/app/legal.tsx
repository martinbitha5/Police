import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { ShieldCheck } from 'phosphor-react-native';
import {
  Divider,
  Header,
  IconBubble,
  Row,
  Screen,
  ScreenScroll,
  Spacer,
  Surface,
  Text,
  useTheme,
} from '@/ui';

const VERSION = Constants.expoConfig?.version ?? '1.0.0';
const UPDATED = 'Juin 2026';

export default function Legal() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <Header title="Mentions légales" onBack={() => router.back()} />

      <ScreenScroll>
        {/* Identité */}
        <View style={[styles.identity, { paddingVertical: theme.spacing.lg }]}>
          <IconBubble size={72} tone="neutral">
            <ShieldCheck size={theme.iconSize.xl} color={theme.colors.text} />
          </IconBubble>
          <Spacer size="base" />
          <Text variant="h1" align="center">
            Mentions légales & confidentialité
          </Text>
          <Text
            variant="body"
            color="textSecondary"
            align="center"
            style={{ marginTop: theme.spacing.xxs }}
          >
            Police Bagage · ATS Handling
          </Text>
          <Text
            variant="caption"
            color="textMuted"
            align="center"
            style={{ marginTop: theme.spacing.sm }}
          >
            Dernière mise à jour : {UPDATED}
          </Text>
        </View>

        <Divider spacing="lg" />

        {/* Conditions d'utilisation */}
        <Section title="Conditions d'utilisation">
          <Para>
            Police Bagage est un outil professionnel réservé aux agents et superviseurs autorisés
            d'ATS Handling. Son accès est strictement limité au personnel disposant d'un compte
            nominatif fourni par l'administrateur.
          </Para>
          <Para>
            L'application sert exclusivement au contrôle des boarding pass et des étiquettes bagage
            dans le cadre de la lutte contre la fraude bagages. Toute utilisation à d'autres fins est
            interdite.
          </Para>
          <Para>
            L'agent s'engage à préserver la confidentialité de ses identifiants et à ne pas les
            partager. Toute action réalisée depuis un compte engage la responsabilité de son
            titulaire.
          </Para>
        </Section>

        <Divider spacing="lg" />

        {/* Confidentialité */}
        <Section title="Confidentialité des données">
          <Para>
            Les données traitées (passagers, bagages, vols, alertes) proviennent des opérations
            d'embarquement et sont hébergées de façon sécurisée. Elles ne sont accessibles qu'aux
            personnes habilitées.
          </Para>
          <Para>
            L'application ne collecte aucune donnée personnelle de l'agent à des fins commerciales
            et n'intègre aucun traceur publicitaire. Les seules informations conservées sur
            l'appareil sont la session de connexion et les préférences locales (par ex. les
            vibrations).
          </Para>
          <Para>
            Les données de scan sont transmises au système central uniquement pour assurer le suivi
            anti-fraude et la génération des rapports destinés aux superviseurs.
          </Para>
        </Section>

        <Divider spacing="lg" />

        {/* Sécurité */}
        <Section title="Sécurité">
          <Para>
            Les échanges entre l'application et les serveurs sont chiffrés. En cas de perte ou de
            vol de l'appareil, prévenez immédiatement votre superviseur afin de révoquer l'accès du
            compte concerné.
          </Para>
          <Para>
            Déconnectez-vous à la fin de votre service. Toute tentative de contournement des règles
            anti-fraude est tracée et signalée.
          </Para>
        </Section>

        <Divider spacing="lg" />

        {/* Éditeur */}
        <Section title="Éditeur">
          <Surface
            elevation={0}
            bordered
            padding="none"
            style={{ paddingHorizontal: theme.spacing.base }}
          >
            <InfoRow label="Application" value="Police Bagage" />
            <Divider />
            <InfoRow label="Éditeur" value="African Transport Systems (ATS Handling)" />
            <Divider />
            <InfoRow label="Version" value={VERSION} />
          </Surface>
        </Section>

        <Spacer size="2xl" />

        <Text variant="caption" color="textMuted" align="center">
          © 2026 ATS Handling · Tous droits réservés
        </Text>
      </ScreenScroll>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View>
      <Text variant="h3">{title}</Text>
      <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.md }}>{children}</View>
    </View>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Text
      variant="body"
      color="textSecondary"
      // Lecture longue : interligne relâché, plutôt que le 1,5 du courant.
      style={{ lineHeight: Math.round(theme.fontSize.base * theme.lineHeight.relaxed) }}
    >
      {children}
    </Text>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <Row gap="base" style={{ paddingVertical: theme.spacing.base }}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <Text variant="body" align="right" style={{ flexShrink: 1 }}>
        {value}
      </Text>
    </Row>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center' },
});
