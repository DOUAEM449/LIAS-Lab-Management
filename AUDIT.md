# Audit technique — LIAS

Audit de l'architecture, de la sécurité, des performances et de la qualité du code de la
plateforme LIAS : backend Spring Boot, frontend React, configuration, base de données.

| | |
|---|---|
| Date | 26 septembre 2026 |
| Point de départ | commit `be54d7d`, branche `feat/refonte-ui` |
| Méthode | lecture du code ; vérifications sur l'application en fonctionnement, contre la base réelle ; pour chaque défaut critique, un test écrit **avant** le correctif, vu en échec, puis vu en succès |
| Résultat | 5 défauts critiques, **tous corrigés et vérifiés** ; 6 élevés, 17 moyens et 7 faibles, laissés ouverts avec leur correctif recommandé |

Les vérifications sur l'application réelle se sont faites en lecture seule. Seules
exceptions : les connexions de contrôle, qui ont écrit leurs lignes d'audit normales
(`LOGIN`, et un `LOGIN_FAILED` volontaire), et un fichier de sonde placé puis supprimé sur
le disque local, sans passer par la base. Aucun profil, compte ou contenu n'a été modifié.

---

## Synthèse

| Priorité | Définition | Nombre | État |
|---|---|---|---|
| **P0 — critique** | Faille exploitable, perte de traces ou d'accès, règle du cahier des charges contournée, fonction inopérante | 5 | **Corrigés** |
| **P1 — élevé** | Risque réel mais conditionnel, ou défense en profondeur manquante | 6 | Ouverts |
| **P2 — moyen** | Performance, robustesse, maintenabilité | 17 | Ouverts |
| **P3 — faible** | Dette mineure, style | 7 | Ouverts |

---

## P0 — Critiques (corrigés)

### P0-1 · XSS stocké par l'upload d'avatar — prise de compte

**Constat.** Toute personne ayant un profil de membre pouvait déposer une page HTML comme
« avatar » et prendre le compte de quiconque ouvrait le lien, un directeur par exemple. La
chaîne complète :

1. `MemberService.uploadAvatar` vérifiait le `Content-Type`… déclaré par le client ;
2. `FileStorageService.store` conservait l'extension du nom fourni par le client (`.html`) ;
3. `/files/public/**` est servi **sans authentification**, avec un type MIME déduit de
   l'extension, donc `text/html` ;
4. le proxy Vite sert `/files` sur **la même origine que l'application**.

Le script s'exécutait donc comme une page de LIAS, et pouvait lire le jeton d'accès dans
`localStorage`.

**Preuve.** Un fichier `.html` placé sous `public/avatars/` est servi en `200`,
`Content-Type: text/html`, sans authentification.

**Correctif.**
- `MemberService` : le type d'image est reconnu à ses **premiers octets** (signatures
  JPEG, PNG, WEBP), et l'extension stockée vient de ce type réel, jamais du nom envoyé.
- `FileStorageService` : nouvelle surcharge `store(file, category, extension)` pour une
  extension choisie par l'appelant ; la surcharge historique n'accepte plus qu'une
  extension simple (`\.[A-Za-z0-9]{1,10}`).
- `SecurityConfig` : `Content-Security-Policy: sandbox` sur `/files/public/**`. Même un
  fichier qui échapperait aux contrôles d'upload n'y exécute aucun script et n'accède pas au
  stockage de l'origine.

**Vérification.** Tests `aPageDisguisedAsAnImageIsRefusedWhateverItsDeclaredType`,
`aRealImageIsStoredUnderTheExtensionOfItsContentNotOfItsName` (`MemberServiceTest`) et
`PublicFilesHeaderTest` — ce dernier en échec avant le correctif. Sur l'application :
l'en-tête `sandbox` est présent.

### P0-2 · Les membres archivés gardaient leur accès, et la restauration ne fonctionnait pas

**Constat.** Archiver un membre marque son profil `deleted = true`. Le filtre
`@SQLRestriction("deleted = false")` le rend alors invisible à toutes les requêtes, y compris
à `CustomUserDetailsService`. Son compte ressemblait donc à un compte technique sans profil,
qui reste actif : **la personne archivée pouvait toujours se connecter, avec son rôle**.

Symétriquement, `MemberService.restore` passait par `findById`, filtré de la même façon :
il ne trouvait **jamais** le membre à restaurer.

**Preuve.** Sur la base réelle, les 5 comptes de membres archivés étaient acceptés par
l'API : 4 doctorants et 1 membre permanent. `GET /members/{id}` renvoyait 404 pour chacun
des membres archivés testés, et `restore()` emprunte ce même chemin.

**Correctif.**
- `MemberRepository` : deux requêtes **natives**, documentées comme telles, qui voient les
  profils archivés — `countArchivedProfilesByUserId` et `findByIdIncludingArchived`.
- `CustomUserDetails` et `CustomUserDetailsService` : un compte dont le profil est archivé
  est désactivé, exactement comme un retraité ou un ancien membre. La règle est **dérivée**,
  elle ne modifie aucune donnée : les 5 comptes ont été bloqués sans migration, et une
  restauration rend l'accès automatiquement.
- `MemberService.restore` passe par `findByIdIncludingArchived` ; sur un membre non archivé,
  il ne fait rien.

**Vérification.** `MemberArchiveIntegrationTest` — Hibernate et H2 réels, 2 tests en échec
avant le correctif — et `CustomUserDetailsTest.archivedMemberIsRefusedEvenThoughNoProfileIsVisible`.
Sur l'application : 5 comptes acceptés avant, **0** après ; compte technique de la direction
et **10 membres actifs sur 10** toujours acceptés.

### P0-3 · Journal d'audit : des traces perdues, et des opérations bloquées

**Constat.** `AuditService.record(4 arguments)` appelait `record(6 arguments)` par `this`.
Or `@Transactional` agit par proxy, et un appel interne ne le traverse pas : le
`REQUIRES_NEW` était **ignoré pour 62 appels sur 65**. La ligne d'audit partageait donc la
transaction de l'opération auditée, avec deux conséquences :

1. **Traces perdues.** Quand l'opération échouait, sa trace était annulée avec elle. Aucun
   échec de connexion n'avait jamais été enregistré.
2. **Déni de service.** Quand la ligne d'audit ne pouvait pas s'écrire, c'est l'opération
   qui échouait. L'IP enregistrée est l'en-tête `X-Forwarded-For`, **fourni par le client**,
   dans une colonne de 64 caractères : n'importe qui pouvait faire échouer n'importe quelle
   opération auditée — la connexion comprise. Une chaîne de proxies légitime suffisait aussi.

La spécification exige pourtant que *« every important action must be traceable »*, et le
rapport (§3, §7) affirmait l'inverse de ce que faisait le code.

**Preuve.** Base réelle : 150 lignes `LOGIN`, **0** `LOGIN_FAILED`, alors que des connexions
avaient échoué. Une connexion aux identifiants **valides**, avec un `X-Forwarded-For` de
80 caractères : **409**.

**Correctif.**
- Nouveau bean `AuditLogWriter`, seul porteur du `REQUIRES_NEW` : l'appel traverse
  maintenant réellement un proxy.
- `AuditService.record` n'est plus transactionnel. Il borne chaque colonne à sa largeur
  (constantes partagées avec l'entité `AuditLog`), ne retient que le premier maillon de
  `X-Forwarded-For`, et intercepte toute erreur — y compris celle levée au commit.

**Vérification.** `AuditTrailIntegrationTest` — transactions réelles, 2 tests en échec avant
le correctif : une trace survit au rollback de son opération ; une trace trop longue
n'annule plus l'opération. `AuditServiceTest` : 4 tests. Sur l'application : la connexion
avec un en-tête de 80 caractères passe de 409 à **200** ; `LOGIN_FAILED` passe de 0 à **1**
après une tentative erronée.

### P0-4 · Doctorants : modules internes exposés par la recherche et le calendrier

**Constat.** Le cahier des charges (§2.2.C) ferme les modules internes — documents,
matériel, réunions — aux doctorants. Leurs contrôleurs l'appliquent, mais deux services
transverses, ouverts à tout compte connecté, ne le faisaient pas : la recherche globale
listait documents et matériel, le calendrier affichait les réunions.

**Preuve.** Avec un compte doctorant réel : `403` sur `/documents`, `/equipment` et
`/meetings`… mais **2 documents et 1 matériel** dans la recherche, **2 réunions** dans le
calendrier.

**Correctif.**
- `RoleName.canAccessInternalModules()` : une **liste blanche**, définie une seule fois, qui
  reprend les gardes des contrôleurs. Un rôle ajouté plus tard reste exclu tant qu'on ne
  l'autorise pas.
- `GlobalSearchService` et `CalendarService` reçoivent le rôle de l'appelant ; les
  repositories internes ne sont même plus interrogés sans droit d'accès.

**Vérification.** `GlobalSearchServiceTest` (3 tests), `CalendarServiceTest` (2 tests). Sur
l'application : plus aucun document, matériel ni réunion pour le doctorant ; les
événements, membres et publications qui lui sont ouverts restent visibles.

### P0-5 · Déploiement Docker impossible — régression introduite par `a8d2574`

**Constat.** Depuis que la clé de signature JWT n'a plus de valeur par défaut (commit
`a8d2574`), le backend refuse de démarrer sans `JWT_SECRET`. `docker-compose.yml` ne la
fournissait pas : le conteneur ne pouvait plus démarrer. La composition ne permettait pas non
plus de créer le premier administrateur sur sa base neuve.

**Correctif.** `docker-compose.yml` transmet `JWT_SECRET` avec
`${JWT_SECRET:?…}` — Compose s'arrête avec un message clair si elle manque, sans qu'aucun
secret soit écrit dans le fichier — et `BOOTSTRAP_ADMIN_PASSWORD`, vide par défaut.

**Vérification.** Syntaxe YAML validée. **Docker n'est pas installé sur la machine d'audit :
la composition n'a pas pu être exécutée.** À vérifier avec `docker compose up`.

### Également corrigés — documentation

| Constat | Correctif |
|---|---|
| **README faux et risqué** : il présentait un backend seul, citait un `./mvnw` absent du dépôt, et faisait écrire les identifiants de la base dans `application-dev.yml`, un fichier suivi par Git | Réécrit : architecture complète, configuration par variables d'environnement, lancement, premier administrateur, Docker, tests |
| **La commande de génération de la clé produisait une clé inutilisable.** `openssl rand -base64 72` coupe sa sortie en deux lignes (en `\r\n` sous Windows) : collée dans `.env`, la clé était tronquée ; passée par `$(…)`, elle contenait un saut de ligne que le décodeur refuse. Le serveur refusait alors de démarrer | `openssl rand -base64 72 \| tr -d '\r\n'` — vérifié : une ligne de 96 caractères, 72 octets au décodage strict. Corrigé dans `.env.example`, `application.yml`, le message d'erreur de `JwtService`, `docker-compose.yml` et le README |

---

## P1 — Élevés (ouverts)

| # | Constat | Emplacement | Correctif recommandé |
|---|---|---|---|
| P1-1 | **Aucune protection contre la force brute.** Pas de limitation de débit sur `/auth/login` ni `/auth/forgot-password`, pas de verrouillage. `failedLoginAttempts` est écrit dans la transaction du login — donc toujours annulé en cas d'échec — et n'est lu nulle part | `AuthService.login` (l. 58, 73) | Compteur écrit via un bean `REQUIRES_NEW` et verrouillage temporaire après N échecs ; limitation par IP (Bucket4j) |
| P1-2 | **Dépôt anonyme de fichiers sans limite.** La candidature publique accepte un CV jusqu'à 25 Mo, sans authentification, sans contrôle de type ni de fréquence : on peut saturer le disque | `MembershipRequestController.submit`, `MembershipRequestService` | Limiter les types (PDF), la taille (5 Mo) et la fréquence par IP |
| P1-3 | **CORS ouvert à toutes les origines, avec credentials.** La propriété `app.cors.allowed-origins` est déclarée mais jamais lue : l'exploitant croit avoir restreint les origines. Peu exploitable tant que le jeton passe par un en-tête, mais trompeur | `SecurityConfig` l. 108, 112 | Lire la propriété dans `corsConfigurationSource` |
| P1-4 | **IP d'audit falsifiable.** Bornée depuis P0-3, elle reste fournie par le client : `X-Forwarded-For` est pris sans vérifier qu'il vient d'un proxy de confiance | `AuditService.clientAddress` | `server.forward-headers-strategy` et liste de proxies de confiance ; sinon `getRemoteAddr()` seul |
| P1-5 | **Retour d'un membre sans garde.** `returnToLab` ouvre une période d'affiliation sans vérifier que le membre est parti ; appelé sur un membre actif, il en ouvre une seconde, et `leave()` échoue ensuite en 500 (`findByMemberIdAndEndDateIsNull` rend deux lignes). *Déduit du code, non exécuté* | `MemberService.returnToLab` (l. 311) | Refuser si le statut n'est pas RETIRED ou FORMER |
| P1-6 | **Rapport et présentation inexacts sur le code.** « Toutes les entités héritent de `BaseEntity` » : 16 sur 30. « Conversion par MapStruct » : aucun `@Mapper`, les mappers sont écrits à la main. Et depuis cet audit : 83 tests au lieu de 66, 5 défauts critiques de plus | `docs/report/sections/03-conception.tex` l. 54, `04-technologies.tex` l. 105, `05-backend.tex` l. 15 | Corriger les phrases et les chiffres avant la soutenance |

---

## P2 — Moyens (ouverts)

### Sécurité

| # | Constat | Emplacement |
|---|---|---|
| P2-1 | Le jeton d'accès est en `localStorage`, lisible par tout script de l'origine. Compromis connu du JWT côté client ; P0-1 fermait le principal vecteur | `frontend/src/services/api.js` |
| P2-2 | Le jeton de rafraîchissement (7 jours) n'est ni révocable ni à usage unique ; la déconnexion n'a aucun effet côté serveur | `AuthService.refresh` (l. 82) |
| P2-3 | Swagger UI et `/api-docs` sont publics dans tous les profils, production comprise | `SecurityConfig`, `PUBLIC_ENDPOINTS` |
| P2-4 | `markAsRead` ne vérifie pas que la notification appartient à l'appelant. Impact faible : identifiants UUID, simple drapeau | `NotificationService.markAsRead` (l. 119) |
| P2-5 | Les discussions d'équipe et d'événement sont lisibles, et ouvertes à l'écriture, pour tout compte connecté. Le cahier des charges ne dit pas s'il faut les restreindre : à trancher | `DiscussionService` |
| P2-6 | Un doctorant organisateur d'événement reçoit la notification `DOCUMENT_ADDED` avec le titre d'un document interne | `DocumentService` (l. 91) |
| P2-7 | Mot de passe de base par défaut `1234` dans la configuration de base : pas un vrai secret, mais une valeur devinable appliquée si `DB_PASSWORD` manque | `application.yml` l. 22 |
| P2-8 | Aucun volume Docker pour les fichiers déposés : documents et avatars sont perdus à chaque recréation du conteneur | `docker-compose.yml` |

### Performance

| # | Constat | Emplacement |
|---|---|---|
| P2-9 | **N+1 sur les listes** : `MemberMapper` charge l'équipe (relation paresseuse) membre par membre, `GovernanceMapper` fait de même pour le membre et l'équipe de chaque mandat. Aucun `@EntityGraph`, `join fetch` ni chargement par lots dans tout le projet | `MemberMapper` l. 18, `GovernanceMapper` |
| P2-10 | Créer un événement insère une notification par membre actif, de façon synchrone, dans la transaction de la requête | `EventService.create` |
| P2-11 | Le filtre JWT vérifie la signature du même jeton environ 4 fois par requête et reconstruit la clé à chaque appel | `JwtAuthenticationFilter`, `JwtService` |
| P2-12 | Deux requêtes SQL d'authentification par requête HTTP — utilisateur et profil —, une troisième pour les comptes sans profil depuis P0-2. C'est le prix, assumé, de la révocation immédiate | `CustomUserDetailsService` |
| P2-13 | Frontend livré en un seul paquet JavaScript de 563 Ko, sans découpage par route | `frontend/dist` |

### Qualité

| # | Constat | Emplacement |
|---|---|---|
| P2-14 | Aucune validation `endDate ≥ startDate` : un événement peut finir avant de commencer | `EventRequest` |
| P2-15 | `@SuperBuilder` ignore la valeur initiale de 7 champs (avertissements de compilation), dont `User.enabled = true` : un `User.builder()` sans `.enabled(true)` crée un compte désactivé. Les trois appels actuels le précisent ; piège pour le suivant | `User`, `BaseEntity`, `Mandate` |
| P2-16 | Tests : ni tests de repositories, ni tests du frontend, ni mesure de couverture | — |
| P2-17 | MapStruct est une dépendance déclarée mais inutilisée | `pom.xml` |

---

## P3 — Faibles (ouverts)

| # | Constat | Emplacement |
|---|---|---|
| P3-1 | Import inutilisé `SecurityContextLogoutHandler` | `JwtAuthenticationFilter` l. 13 |
| P3-2 | `@Value` en injection de champ, seule exception à l'injection par constructeur | `AuthService` l. 45 |
| P3-3 | Les créations répondent 200 au lieu de 201 | contrôleurs |
| P3-4 | `changeStatus` accepte le statut déjà en vigueur et ouvre une période en double | `MemberService.changeStatus` |
| P3-5 | Clés étrangères sans index : `messages.sender_id`, `discussions.created_by_member_id`, `password_reset_tokens.user_id` | `V1__init_schema.sql` |
| P3-6 | 6 avertissements oxlint (`react/only-export-components`) et 23 copies locales de `friendlyError` | `frontend/src` |
| P3-7 | `server.error.include-message: always` renvoie les messages d'exception quand le gestionnaire global n'intervient pas | `application.yml` l. 68 |

---

## Ce qui est solide

Un audit doit aussi dire ce qui tient :

- **Le rôle est dérivé, jamais saisi** (`UserRoleSyncService`) : historisé, réconcilié au
  démarrage de façon idempotente, avec priorité au statut gelé.
- **Les droits sont relus en base à chaque requête** : un compte gelé est coupé
  immédiatement, sans liste de révocation.
- **74 `@PreAuthorize`**, une matrice d'autorisation testée de bout en bout, et une
  distinction 401/403 correcte.
- **Les entités ne sont jamais sérialisées** : DTO partout, `open-in-view: false`.
- **Suppression logique**, quatre tables d'historique, verrouillage optimiste (`@Version`
  → 409).
- **Secrets externalisés** : clé JWT obligatoire et contrôlée au démarrage (≥ 64 octets,
  HS512), compte d'amorçage encadré.
- **Schéma versionné par Flyway**, que Hibernate se contente de valider.
- **Réinitialisation du mot de passe** : jeton aléatoire, valable une heure, à usage
  unique, sans énumération des comptes.
- **Aucune traversée de répertoire** : les fichiers sont stockés sous un nom UUID.

---

## Vérifications

| Contrôle | Résultat |
|---|---|
| `mvn clean package` | **BUILD SUCCESS — 83 tests, 0 échec** (66 avant l'audit) |
| Tests nouveaux | 17, dont 5 vus en échec sur le code d'origine avant d'être corrigés |
| `npm run build` | succès, 1 923 modules |
| `npx oxlint` | 0 erreur, 6 avertissements préexistants |
| Sondes sur l'application réelle | les 4 premiers défauts critiques reproduits avant correctif, disparus après ; aucune régression sur les comptes légitimes |
| Docker | **non exécuté** : Docker est absent de la machine d'audit |

### Tests ajoutés

| Classe | Tests | Type | Défaut |
|---|---|---|---|
| `AuditTrailIntegrationTest` | 2 | Intégration (Spring, H2) | P0-3 |
| `AuditServiceTest` | 4 | Unitaire | P0-3 |
| `MemberArchiveIntegrationTest` | 2 | Intégration (Spring, H2) | P0-2 |
| `CustomUserDetailsTest` | +1 | Unitaire | P0-2 |
| `GlobalSearchServiceTest` | 3 | Unitaire | P0-4 |
| `CalendarServiceTest` | 2 | Unitaire | P0-4 |
| `MemberServiceTest` | +2 | Unitaire | P0-1 |
| `PublicFilesHeaderTest` | 1 | Intégration (MockMvc) | P0-1 |

---

## Impact sur le rapport et la présentation

Le rapport (`docs/report/`) et le support de soutenance **n'ont pas été modifiés** par cet
audit. À mettre à jour :

- **66 → 83 tests**, 10 → 16 classes de test ;
- les cinq défauts P0 ci-dessus, à ajouter à la liste des défauts détectés et corrigés
  (§8.11.1) ;
- l'affirmation sur l'audit en transaction indépendante (§3, §7, diapositive 11), **devenue
  vraie** avec P0-3 ;
- les deux affirmations toujours inexactes : P1-6.
