# Procédure de gestion des incidents de sécurité

- Organisation : Police Bagage
- Référence : PGI-04
- Version : 0.1 (projet)
- Date : 2026-09-07
- Contrôle ISO/IEC 27001:2022 : A.5.24, A.5.25, A.5.26, A.5.27, A.5.28, A.6.8
- Statut : projet à valider

## Comment utiliser ce document

C'est la marche à suivre quand un problème de sécurité survient (compte compromis, appareil volé, fuite).

**À faire :**
- Le faire lire à toute l'équipe pour que les bons réflexes soient connus.
- Définir clairement le canal de signalement : qui appeler, comment.
- Faire une fois un exercice sur table, par exemple « un PDA a été volé ».

**Prochaine étape :** désigner qui reçoit les signalements et commencer à tenir le registre des incidents.

## 1. Objet

Définir comment un événement de sécurité est signalé, évalué, traité, tracé, puis
exploité pour éviter qu'il se reproduise.

## 2. Distinction importante

Une **alerte fraude** (bagage non déclaré intercepté) est un événement métier
normal, traité par le superviseur via le dashboard. Ce n'est **pas** un incident
de sécurité de l'information.

Un **incident de sécurité** concerne la confidentialité, l'intégrité ou la
disponibilité du système lui-même. Exemples :

- Fuite ou suspicion de fuite de la clé service_role.
- Compte administrateur ou superviseur compromis.
- Accès à des données d'une autre compagnie / d'un autre aéroport.
- PDA perdu ou volé contenant une session active.
- Anti-fraude contournée, alertes ou preuves altérées ou disparues.
- Indisponibilité anormale de l'API ou de la base pendant l'embarquement.
- Vulnérabilité critique exploitée sur une application.

## 3. Signalement (A.6.8)

Toute personne (agent, superviseur, admin) qui constate ou suspecte un incident
le signale **immédiatement** au responsable SMSI, par le canal défini (à définir :
téléphone, message dédié). Ne pas tenter de « réparer » seul un incident majeur.

Informations minimales à transmettre : quoi, quand, où (quel système, quel PDA,
quel compte), ce qui a été observé.

## 4. Classification et priorité (A.5.25)

| Gravité | Définition | Délai de prise en charge (proposé) |
|---|---|---|
| Critique | Données passagers exposées, secret compromis, anti-fraude contournée en prod | immédiat |
| Élevé | Compte sensible compromis, PDA volé, indisponibilité en embarquement | < 1 h |
| Moyen | Accès anormal contenu, vulnérabilité élevée non exploitée | < 24 h |
| Faible | Événement mineur, tentative bloquée | < 72 h |

## 5. Réponse (A.5.26)

Étapes types, à adapter :

1. **Contenir.** Limiter la propagation. Exemples : révoquer les sessions
   (rotation du mot de passe du compte concerné), retirer un accès, mettre une
   application en maintenance, faire tourner la clé service_role compromise.
2. **Préserver les preuves (A.5.28).** Avant toute correction, capturer les
   journaux pertinents (Supabase logs, logs API, `movement_log`), horodatés. Ne
   pas supprimer de données. Noter qui fait quoi et quand.
3. **Éradiquer.** Corriger la cause (correctif, changement de configuration,
   fermeture d'un accès).
4. **Rétablir.** Remettre le service en état vérifié, confirmer que l'incident
   est clos.
5. **Notifier.** Prévenir la direction ; si des données personnelles de passagers
   sont concernées, évaluer l'obligation de notification à l'autorité compétente
   et aux personnes (à cadrer avec le registre légal A.5.31).

### Fiches réflexes

- **Clé service_role fuitée :** générer une nouvelle clé dans Supabase, mettre à
  jour l'environnement de l'API (Hostinger) et des routes serveur web, invalider
  l'ancienne, vérifier les journaux d'accès récents.
- **PDA volé :** changer le mot de passe du compte agent concerné (révoque le
  refresh token), vérifier l'activité récente de ce compte, documenter l'appareil.
- **Compte admin/superviseur compromis :** rotation du mot de passe, activation
  MFA, revue des actions faites par ce compte via `movement_log`.

## 6. Journal des incidents

Chaque incident est consigné (registre à tenir), avec : identifiant, date de
détection, gravité, description, actions, date de clôture, enseignements.

| ID | Date | Gravité | Description | Actions | Clôture | Enseignements |
|---|---|---|---|---|---|---|
| | | | | | | |

## 7. Retour d'expérience (A.5.27)

Après tout incident élevé ou critique, une revue courte identifie la cause
racine et les mesures pour éviter la récidive. Les mesures alimentent le registre
des risques (RR-02) et, si besoin, la revue de direction (RD-05).

## 8. Test

La procédure est testée au moins une fois par an par un exercice sur table
(scénario simulé, ex. « PDA volé »), sans toucher à la production.
