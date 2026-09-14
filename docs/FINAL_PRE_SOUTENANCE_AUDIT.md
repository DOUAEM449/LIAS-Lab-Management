# Audit final avant soutenance — LIAS

Périmètre : 21 pages, 27 composants, 6 primitives de design system, 14 modales,
24 routes. Backend non modifié par cet audit.

Classification :

| Niveau | Critère |
|---|---|
| **P0** | Bloquant : visible en démonstration, ou empêche la démonstration |
| **P1** | Visible par le jury, corrigeable à risque maîtrisé |
| **P2** | Dette structurelle : gain réel, mais touche une grande partie de l'application |
| **P3** | Confort et cosmétique |

---

## P0 — Bloquants

### P0-01 — Formulaire de discussion proposé à un compte sans profil membre ✅ CORRIGÉ

**Cause.** `DiscussionController.currentMemberId()` résout le membre depuis le
compte authentifié et lève `ResourceNotFoundException("No member profile linked
to this account")` s'il n'en existe pas. `NotificationsPage` connaissait le cas
— `hasInbox` empêchait déjà le chargement des notifications — mais le formulaire
« Nouvelle discussion » était rendu sans condition, son bouton n'étant désactivé
que sur un titre vide.

**Impact.** 7 comptes sur 18 n'ont pas de profil membre, dont `director@lias.ma`
et `admin@lias.ma` — donc le compte utilisé dans toutes les captures du rapport.
L'utilisateur remplissait un formulaire complet, cliquait, et recevait
`No member profile linked to this account` : un message brut, en anglais, dans
une interface française. Défaut préexistant, antérieur aux travaux d'interface.

**Correction** (frontend uniquement) :

- `hasInbox` renommé `hasMemberProfile` — le prédicat `Boolean(user?.status)` est
  exactement celui appliqué par le serveur, `status` n'étant renseigné que si un
  profil membre vivant est lié au compte ;
- le formulaire est remplacé par un encart explicatif en français ;
- garde défensive en tête de `handleCreateDiscussion` : aucun chemin ne peut
  déclencher l'appel ;
- onglet Notifications : l'état vide n'annonce plus des alertes qui n'arriveront
  jamais ;
- état vide des discussions : l'invitation à « créer ci-dessus » disparaît quand
  le formulaire n'est pas rendu ;
- helper partagé `src/utils/errors.js` traduisant les messages backend connus.

Backend, règles métier, permissions, rôles, mandats, base de données et comptes
techniques : **inchangés**. Aucun profil membre fictif n'a été créé.

**Validation.** La base Neon étant injoignable au moment du test (voir P0-02),
les deux branches ont été exercées de façon déterministe en interceptant les
appels API au niveau réseau (CDP Fetch) — c'est précisément la branche modifiée,
le rendu selon `user.status`, qui est testée :

| Observation | `status = null` | `status = "PERMANENT"` |
|---|---|---|
| Formulaire rendu | non | **oui** |
| Encart explicatif | **oui** | non |
| Message anglais brut | non | non |
| `POST /discussions` | **aucun** | **déclenché** |
| Erreurs console | aucune | aucune |

`npm run build` vert (1920 modules), `oxlint` sans nouvel avertissement,
55/55 tests backend verts.

**Reste à faire.** Un test de fumée contre la vraie base, une fois P0-02 levé.

### P0-02 — Base de données injoignable depuis la machine de développement ⚠️ OUVERT

**Cause.** La résolution DNS de l'hôte Neon expire, y compris en interrogeant
explicitement un résolveur public. Le domaine parent `neon.tech` ne résout pas
davantage, alors que le reste d'Internet répond normalement : le DNS sortant est
filtré sur ce réseau (VPN ou pare-feu), ce n'est pas un défaut applicatif.

**Impact.** Le backend ne démarre plus (`UnknownHostException` sur Flyway). Un
processus antérieur répond encore sur le port 8080 et fait croire à un service
sain (`/actuator/health` = UP) alors que toute requête base retourne 500.
**Aucune démonstration live n'est possible dans cet état.**

**Correction.** Hors périmètre du code — action à mener côté réseau : désactiver
le VPN ou le filtrage DNS, ou basculer le résolveur. À vérifier impérativement
sur le poste et le réseau de la soutenance.

**Priorité.** P0 : à lever avant toute répétition de la présentation.

---

## P1 — Visibles par le jury

| # | Constat | Emplacement |
|---|---|---|
| **P1-01** | Colonne « Détails » tronquée au bord droit de l'écran | Journal d'audit |
| **P1-02** | Libellés d'audit en anglais dans une interface française — écrits côté Java, donc à mapper côté client plutôt qu'à traduire dans le backend | Journal d'audit |
| **P1-03** | Identifiants techniques bruts affichés (`Member #ceea0850`) au lieu du nom de l'entité | Journal d'audit |
| **P1-04** | Aucune pagination : les listes sont plafonnées à `size: 100`/`200` et rendues entières. `totalElements` est récupéré puis utilisé comme simple chiffre de tuile. L'API expose déjà `page`, `size`, `sort` — **aucune adaptation backend nécessaire** | Toutes les pages de liste |
| **P1-05** | Le détail d'un membre est une modale contenant un formulaire d'édition : consultation et édition confondues, pas d'URL, pas de lien profond. Aucune route de détail n'existe dans l'application | Membres |

---

## P2 — Dette structurelle

| # | Constat | Mesure |
|---|---|---|
| **P2-01** | `friendlyError` dupliqué dans **24 fichiers**, dont **6 ont divergé** (messages 403/409 spécifiques). Un remplacement global aurait silencieusement changé le comportement de ces 6 fichiers | Helper partagé créé (`src/utils/errors.js`) avec un paramètre `overrides` qui reproduit exactement chaque variante. **1 fichier migré** (`NotificationsPage`). Migration des 23 restants : à faire hors période de soutenance, fichier par fichier |
| **P2-02** | 12 primitives absentes du design system : `Pagination`, `Dropdown`, `Select`, `Tooltip`, `Breadcrumb`, `Avatar`, `Modal`, `Progress`, `Drawer`, `Stepper`, `Accordion`, tri de colonne | À arbitrer |
| **P2-03** | 5 `<select>` natifs, non alignés sur le style des autres champs | Dépend de P2-02 |
| **P2-04** | **15 pages sur 21** ouvrent par une rangée de 4 ou 5 `StatTile` identiques : les écrans ne se distinguent pas les uns des autres | Refonte de composition |
| **P2-05** | Aucun tri contrôlé par l'utilisateur ; le tri est figé en JavaScript après récupération | Dépend de P2-02 |
| **P2-06** | 14 modales ad hoc ; `Modal.jsx` vit hors du design system | À arbitrer |

---

## P3 — Confort

| # | Constat |
|---|---|
| **P3-01** | Page Matériel : 4 tuiles d'indicateurs décrivent un tableau d'**une seule ligne**, suivi d'environ 450 px de vide. L'architecture ne s'adapte pas au volume réel de données |
| **P3-02** | En-tête sous-employé : ni fil d'Ariane, ni titre de page — ce dernier vit dans le corps, d'où deux zones d'en-tête superposées |
| **P3-03** | `preconnect` déclaré vers `fonts.googleapis.com` mais pas vers `fonts.gstatic.com`, d'où un aller-retour supplémentaire au chargement des polices |

---

## Conséquence à arbitrer : les captures du rapport

Les 27 captures du rapport académique montrent l'interface antérieure aux
travaux visuels de la branche `feat/refonte-ui`. Toute fusion dans `main` avant
la soutenance rendrait le PDF non conforme à l'application démontrée.

Trois options : ne pas fusionner avant la soutenance ; refaire les 27 captures
et reconstruire le PDF ; ou fusionner après la remise.
