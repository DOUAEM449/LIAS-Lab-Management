# Audit QA final du rapport LIAS

Contrôle mené sur le commit `36c918f`, branche `feat/finalisation-audit`.
Méthode : chaque affirmation du rapport a été recomptée dans le code courant ; chaque
capture a été inspectée visuellement ; aucune valeur n'a été conservée au motif qu'elle
figurait dans une version antérieure.

---

## 1. Vérification des chiffres — code courant contre rapport

| Élément | Rapport (avant) | Code réel | Verdict |
|---|---:|---:|---|
| Entités JPA | 31 | 31 | ✅ |
| Contrôleurs REST | 22 | 22 | ✅ |
| Services métier | 28 | 28 | ✅ |
| Repositories | 30 | 30 | ✅ |
| Énumérations métier | 10 | 10 | ✅ |
| Migrations Flyway | 3 | 3 | ✅ |
| Pages React | 21 | 21 | ✅ |
| Composants React | 27 | 27 | ✅ |
| Modules de design system | 7 | 7 | ✅ |
| Services frontend | 19 | 19 | ✅ |
| Tests automatisés | 48 | 48 | ✅ |
| Lignes SQL de migration | 750 | 750 | ✅ |
| Lignes Java de test | 863 | 863 | ✅ |
| **Tables relationnelles** | **29** | **30** | ❌ corrigé |
| **Tables créées par V1** | **27** | **28** | ❌ corrigé |
| **Lignes Java (`src/main`)** | **9 874** | **9 908** | ❌ corrigé |
| **Lignes JavaScript / JSX** | **13 049** | **13 112** | ❌ corrigé |
| **`@Valid` sur paramètres** | **17** | **35** | ❌ corrigé (17 = nombre d'imports, pas d'annotations) |

Comptages Jakarta EE revérifiés : `jakarta.persistence` **224**, `jakarta.validation` **70**,
`jakarta.servlet` **8** — conformes. Versions (Spring Boot 3.3.4, Java 21, Hibernate 6.5.3,
jjwt 0.12.6, MapStruct 1.6.2, springdoc 2.6.0, OpenPDF 1.3.43, React 19.2, Vite 8.2,
React Router 7.18, Tailwind 4.3) : toutes conformes.

### Affirmation Maven — vérifiée par clone frais

Le rapport écrit « une distribution est embarquée dans le dépôt ». Contrôle effectué :

- `mvnw`, `mvnw.cmd`, `.mvn/` : **absents** — le rapport ne les mentionne jamais ;
- `backend/.maven/apache-maven-3.9.16/` : **96 fichiers suivis par Git** (bin 6, boot 2, conf 3, lib 82 dont 51 jars) ;
- clone frais du dépôt → `mvn.cmd -v` répond `Apache Maven 3.9.16`.

**Affirmation exacte, aucune correction.**

### Formulation JEE / Jakarta EE — vérifiée

Le rapport ne présente jamais Spring Boot comme étant littéralement Jakarta EE. Il écrit
« il implémente ou intègre ces mêmes spécifications », et signale explicitement que la
couche web utilise **Spring MVC et non JAX-RS**. **Aucune correction.**

---

## 2. Audit des captures d'écran

27 captures inspectées une par une. Critère éliminatoire : présence d'un squelette
(`.lias-shimmer`) ou d'un spinner (`.animate-spin`).

| Figure | Écran | Rôle | Chargement complet | Données visibles | Lisibilité | Verdict | Action |
|---|---|---|---|---|---|---|---|
| 6.23 | Portail public | visiteur | ❌ 3 compteurs en placeholder | partiel | bonne | ❌ INVALID | remplacée |
| 6.24 | Candidature publique | visiteur | ✅ | s.o. (formulaire) | bonne | ✅ VALID | — |
| 6.1 | Connexion | visiteur | ✅ | s.o. | bonne | ✅ VALID | — |
| 6.2 | **Tableau de bord** | DIRECTOR | ❌ 5 KPI + 2 graphiques + 2 panneaux en squelette | non | bonne | ❌ INVALID | remplacée |
| 6.3 | Liste des membres | DIRECTOR | ✅ | ✅ 11/3/4/1 + table | bonne | ✅ VALID | — |
| C.1 | Fiche membre — Profil | DIRECTOR | ✅ | ✅ | bonne | ✅ VALID | — |
| 6.4 | Fiche membre — Gouvernance | DIRECTOR | ✅ | ✅ statut + mandats | bonne | ✅ VALID | — |
| 6.5 | Fiche membre — Historique | DIRECTOR | ✅ | ✅ 2 chronologies | bonne | ✅ VALID | — |
| 6.6 | Gouvernance — Structure | DIRECTOR | ❌ 3 KPI + organigramme vides | non | bonne | ❌ INVALID | remplacée |
| 6.7 | Gouvernance — Équipes | DIRECTOR | ✅ | ✅ 3 équipes | bonne | ✅ VALID | — |
| 6.8 | Gouvernance — Mandats | DIRECTOR | ✅ | ✅ table des mandats | bonne | ✅ VALID | — |
| 6.9 | Demandes d'adhésion | DIRECTOR | ✅ | ✅ 23/1/16/6 + dossier | bonne | ✅ VALID | — |
| 6.10 | Matériel — Inventaire | DIRECTOR | ✅ | ✅ 1/49/1/0 | bonne | ✅ VALID | — |
| 6.11 | Registre de distribution | DIRECTOR | ❌ « Chargement du registre… » | non | bonne | ❌ INVALID | remplacée |
| 6.12 | Documents | DIRECTOR | ✅ | ✅ 3 documents | bonne | ✅ VALID | — |
| 6.13 | Versions d'un document | DIRECTOR | ✅ | ✅ v1 + v2 | bonne | ✅ VALID | — |
| 6.14 | Événements | DIRECTOR | ✅ | ✅ 3 événements | bonne | ✅ VALID | — |
| 6.15 | Calendrier | DIRECTOR | ✅ | ✅ 2 événements | bonne | ✅ VALID | — |
| 6.16 | Publications | DIRECTOR | ❌ 4 KPI + liste en squelette | non | bonne | ❌ INVALID | remplacée |
| 6.17 | Réunions & PV | DIRECTOR | ✅ | ✅ 2 réunions | bonne | ✅ VALID | — |
| 6.18 | Conventions | DIRECTOR | ❌ 3 KPI + 6 blocs squelette | non | bonne | ❌ INVALID | remplacée |
| 6.19 | Notifications | ASSOCIATE | ✅ | ⚠️ données de test `__probe__` | bonne | ⚠️ À REMPLACER | remplacée |
| 6.20 | Journal d'audit | DIRECTOR | ✅ | ✅ 200 entrées | bonne | ✅ VALID | — |
| 6.21 | Rapports d'activité | DIRECTOR | ✅ | ⚠️ état périmé (1 rapport) | bonne | ⚠️ À REMPLACER | remplacée |
| 6.22 | Administration système | SYSTEM_ADMIN | ✅ | ✅ 18 comptes | bonne | ✅ VALID | — |
| C.2 | Espace personnel | DIRECTOR | ✅ | ⚠️ compte technique, sans profil | bonne | ⚠️ À REMPLACER | remplacée |
| 7.1 | Navigation doctorant | PHD_STUDENT | ❌ tableau de bord en squelette | non | bonne | ❌ INVALID | remplacée |

**Bilan : 17 conformes / 27 à l'entrée, 27 / 27 après correction.**

### Cause racine des captures en chargement

Le script de capture initial attendait un délai fixe (2,6 à 3 s). Les mesures faites
pendant cet audit montrent que les pages agrégeant plusieurs appels vers la base distante
demandent bien davantage :

| Page | Temps réel avant stabilisation |
|---|---:|
| Tableau de bord | 9 750 ms |
| Navigation doctorant | 7 383 ms |
| Publications | 6 164 ms |
| Espace personnel | 9 630 ms |
| Registre de distribution | 4 526 ms |

Le script de reprise n'utilise plus de temporisation : il attend l'absence totale de
`.lias-shimmer` et `.animate-spin` maintenue une seconde, puis contrôle après capture que
les deux compteurs valent bien zéro. Les dix reprises affichent `shimmer=0 spin=0`.

### Cohérence des rôles dans les captures

| Compte | Statut en base | Rôle en base | Mandat actif | Affichage conforme |
|---|---|---|---|---|
| `director@lias.ma` | — (compte technique) | DIRECTOR | — | ✅ |
| `admin@lias.ma` | — (compte technique) | SYSTEM_ADMIN | — | ✅ |
| `douaamoussaoui2@gmail.com` | ASSOCIATE | ASSOCIATE_MEMBER | aucun | ✅ conforme à l'invariant exigé |
| `douae.moussaoui@example.com` | PHD_STUDENT | PHD_STUDENT | aucun | ✅ |
| `amine.tazi@example.com` | PERMANENT | VICE_DIRECTOR | Chef d'équipe + Vice-directeur | ✅ |

La nouvelle figure C.2 (Amine Tazi) donne l'illustration la plus directe de la règle
centrale : **STATUT** Permanent, **RÔLE** Vice-directeur, **MANDAT** Chef d'équipe +
Vice-directeur — trois valeurs différentes affichées côte à côte.

---

## 3. Tableau des erreurs du rapport

| Gravité | Problème | Emplacement | Cause | Correction |
|---|---|---|---|---|
| **P0** | Figure 6.2 (tableau de bord) intégralement en état de chargement | ch. 6 | capture prise après 3 s au lieu des 9,75 s nécessaires | capture refaite avec attente déterministe |
| **P0** | 6 autres captures en squelette ou spinner | ch. 6, 7 | même cause | captures refaites |
| **P1** | « 29 tables » et « V1 : 27 tables » | §3.6 | recomptage jamais fait après V2 | 30 et 28 |
| **P1** | « `@Valid` sur 17 paramètres » | §4.1, tab. 4.1 | comptage des *imports*, pas des annotations | 35 |
| **P1** | Volumétrie Java / JS périmée | tab. 9.1 | code modifié depuis la rédaction | 9 908 / 13 112 |
| **P2** | Figure 6.19 affichant des données de test `__probe__` | ch. 6 | pollution de l'audit E2E précédent | 36 notifications supprimées, capture refaite |
| **P2** | Figure 6.21 périmée (1 rapport au lieu de 3) | ch. 6 | données enrichies depuis | capture refaite |
| **P2** | Figure C.2 montrant un compte technique sans profil | annexe C | compte DIRECTOR sans membre lié | recapturée avec un membre réel |
| **P2** | Figure 6.18 aux compteurs à zéro sans explication | ch. 6 | module peu alimenté | légende et texte précisant que l'état vide est normal |
| **P3** | Blancs en bas de page dans le ch. 6 | ch. 6 | placement `[H]` des figures | **non corrigé** : compromis assumé, la figure reste au contact de son explication |

---

## 4. Problème applicatif détecté pendant l'audit — non corrigé

**P1 — l'archivage d'un membre ne clôture pas ses mandats actifs.**

`MemberService.delete()` positionne la suppression logique et journalise, mais ne ferme
aucun mandat, contrairement au passage au statut RETIRED / FORMER qui, lui, les clôture.
Conséquence observée en base : un mandat `DIRECTOR` actif est détenu par un membre archivé.

Le membre archivé étant exclu par `@SQLRestriction`, `UserRoleSyncService.reconcileAll()`
ne le parcourt pas : son rôle `DIRECTOR` n'est jamais recalculé.

L'interface affiche donc « Direction en exercice — **Membre archivé** », visible dans cinq
figures (6.2, 6.6, 6.7, 6.8, 7.1) et comme auteur « Membre archivé » en 6.16.

Ce n'est pas un défaut du rapport mais de l'application, et sa correction sort du périmètre
de ce contrôle. Deux remèdes possibles, au choix du propriétaire :

- **immédiat, côté données** : clôturer le mandat depuis *Gouvernance → Mandats → Terminer*,
  ou restaurer le membre ;
- **de fond, côté code** : faire clôturer les mandats actifs par `MemberService.delete()`,
  comme le fait déjà le changement de statut.

Après l'un ou l'autre, les cinq figures concernées devront être reprises.

---

## 5. Contrôles de sécurité

| Contrôle | Résultat |
|---|---|
| Mot de passe base, hôte Neon, identifiant, clé JWT, mot de passe applicatif dans le PDF | **0 occurrence** (9 motifs recherchés) |
| Mêmes motifs dans le Markdown | **0 occurrence** |
| Champs de mot de passe dans les captures | vides ou masqués |
| Adresses email de membres visibles dans les figures | oui — contenu applicatif normal, pas un secret |
| Identifiants présentés sous forme de variables | `${DB_PASSWORD}`, `${MAIL_PASSWORD}`, etc. |

---

## 6. UML

Diagrammes confrontés au code final. Aucune entité, relation ni cardinalité n'a changé
depuis la rédaction. Vérification des énumérations :

| Énumération | Code | UML |
|---|---:|---:|
| RoleName | 9 | 9 |
| MemberStatus | 5 | 5 |
| MandateRoleType | 3 | 3 |
| NotificationType | 11 | 11 |
| AuditAction | 14 | 14 |
| DocumentCategory | 9 | 9 |
| EquipmentRequestStatus | 4 | 4 |
| EventType | 3 | 3 |
| DiscussionScope | 3 | 3 |

Compteurs du diagramme d'architecture (22 contrôleurs / 28 services / 30 repositories,
Flyway V1–V3) : conformes. **UML : PASS, aucune modification.**

---

## 7. Limites du rapport — contrôle d'honnêteté

| Limite déclarée | Toujours exacte |
|---|---|
| Thème sombre absent | ✅ aucune trace de thème sombre dans le code |
| Couverture de code non mesurée | ✅ aucun outil de couverture configuré |
| Pas de campagne de charge | ✅ aucune campagne menée |
| Pas d'audit WCAG formel | ✅ |
| Trois modules sans tests dédiés | ✅ discussions, partenariats, génération PDF |
| Bundle non découpé | ✅ un seul lot JavaScript |
| Historique Git à purger | ✅ toujours présent, identifiant mort depuis la rotation |

Aucune limite n'a été transformée en fonctionnalité satisfaite.

---

## 8. Régression finale

| Contrôle | Résultat |
|---|---|
| `mvn clean test` | **48 tests — 0 échec, 0 erreur, 0 ignoré** — BUILD SUCCESS |
| `npm run build` | succès |
| `npx oxlint` | 0 erreur, 6 avertissements préexistants |
| Compilation LaTeX (3 passes) | 0 erreur fatale, 0 référence non résolue |
| PDF | 82 pages A4, 35 figures, 19 tableaux |

---

## 9. Audit avant soutenance — suite

Un contrôle complémentaire, conduit après la remise du rapport, a mis au jour un
défaut fonctionnel supplémentaire et dressé un classement P0/P1/P2/P3 de l'état
de l'interface. Le détail figure dans `docs/FINAL_PRE_SOUTENANCE_AUDIT.md`.

### P0-01 — Formulaire de discussion proposé à un compte sans profil membre (corrigé)

| Rubrique | Contenu |
|---|---|
| **Cause** | `DiscussionController` exige un profil membre comme auteur d'un fil. `NotificationsPage` gardait le chargement des notifications mais rendait le formulaire « Nouvelle discussion » sans condition |
| **Impact** | 7 comptes sur 18 sont sans profil membre, dont `director@lias.ma`. L'utilisateur remplissait un formulaire voué à l'échec et recevait un message brut en anglais dans une interface française |
| **Correction** | Frontend seul : encart explicatif à la place du formulaire, garde défensive sur la soumission, états vides cohérents, helper d'erreurs partagé traduisant les messages backend connus. Backend, règles métier, permissions et base de données inchangés |
| **Validation** | Les deux branches exercées par interception réseau : sans profil membre, aucun `POST /discussions` n'est émis et aucun message anglais n'apparaît ; avec profil membre, le formulaire et l'appel fonctionnent. `npm run build` vert, `oxlint` inchangé, 55/55 tests backend |
| **Priorité** | P0 — visible en démonstration |

### P0-02 — Base de données injoignable (ouvert, hors code)

La résolution DNS de l'hôte Neon expire sur la machine de développement, y
compris via un résolveur public ; le domaine parent ne résout pas non plus alors
que le reste d'Internet répond. Le backend ne démarre plus. Il ne s'agit pas d'un
défaut applicatif mais d'un filtrage réseau à lever avant toute démonstration.

### Régression associée

| Contrôle | Résultat |
|---|---|
| `mvn test` | **55 tests — 0 échec, 0 erreur, 0 ignoré** — BUILD SUCCESS |
| `npm run build` | succès — 1 920 modules |
| `npx oxlint` | 0 erreur, 6 avertissements préexistants |
| Erreurs console navigateur | aucune sur les deux branches testées |
