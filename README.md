# Police Bagage

**Système d'embarquement et de lutte anti-fraude bagages pour aéroport.**

Le système relie chaque bagage à un passager réellement enregistré et intercepte
les colis non déclarés **avant** qu'ils partent en soute — avec alerte du
superviseur en temps réel.

Conçu pour l'Aéroport International de Kinshasa (FIH), sur les vols Air Congo / Ethiopian.

---

## Le problème

Au comptoir d'enregistrement, une étiquette bagage peut être émise sur un passager
qui n'a déclaré aucun bagage. Le colis — non déclaré, non contrôlé — part alors en
soute. C'est une faille de sûreté et une porte ouverte à la fraude.

## La solution

À la porte d'embarquement, deux contrôles se croisent :

1. **Enregistrement** — l'agent scanne le boarding pass du passager. Le système lit
   le nombre de bagages réellement déclarés.
2. **Bagages** — l'agent scanne chaque étiquette sur le tapis. Le système vérifie
   qu'elle correspond à un passager enregistré, avec un quota de bagages disponible.

Toute étiquette qui ne colle pas — passager inconnu, zéro bagage déclaré, quota
dépassé — est **rejetée** et déclenche une **alerte immédiate** au superviseur, qui
envoie intercepter le colis sur le tapis.

L'agent bagages n'est jamais fautif : il scanne ce qui arrive sur le tapis. La fraude
vient du comptoir d'enregistrement, et le système la voit en temps réel.

---

## Les applications

| Application | Pour qui | Rôle |
|---|---|---|
| **Mobile** (PDA Zebra) | Agents terrain | Scan des boarding pass et des étiquettes bagage |
| **Dashboard web** | Superviseurs & admins | Suivi temps réel, alertes fraude, rapports, gestion des comptes |
| **Tableau des vols** | Voyageurs (public) | Vols du jour, statuts et ouverture de l'enregistrement en direct |

---

## En un coup d'œil

- Interception des bagages non déclarés **avant la soute**
- Alertes fraude **en temps réel** au poste superviseur
- **5 règles de contrôle** strictes et non contournables
- Rôles cloisonnés : agent, superviseur, admin
- Rapports de journée exportables

---

## Statut

Les portails publics voyageurs sont **en ligne** ; le cœur embarquement
(application mobile agents + supervision) est en cours de mise en service terrain.

---

## Pour les développeurs

- Installation, commandes et architecture technique → [DEVELOPMENT.md](./DEVELOPMENT.md)
- Spécification fonctionnelle complète → [CLAUDE.md](./CLAUDE.md)
