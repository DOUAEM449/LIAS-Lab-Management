# Matrice de traçabilité — Cahier des charges → Implémentation → Preuve

Source : `docs/cahier_de_charges_jee.pdf` (21 sections) et `docs/specification.md`.
Chaque ligne a été vérifiée contre le code du commit `98edb17`, branche `feat/finalisation-audit`.
Cette matrice est la source de vérité du rapport : aucune affirmation du rapport ne doit
la contredire.

Légende du statut : **I** = implémenté et vérifié · **P** = partiel · **N** = non implémenté.

---

## 1. Couverture fonctionnelle

| § CdC | Fonctionnalité attendue | Implémentation backend | Interface | UML | Preuve | Statut |
|---|---|---|---|---|---|---|
| 1 | Centraliser, tracer, capitaliser, structurer, produire le rapport annuel | Transverse — 22 contrôleurs REST, 28 services, 31 entités JPA | 21 pages React | Fig. 3.1 | §9.2 | **I** |
| 2.1 | Visiteur : accès libre (labo, équipes, activités, publications) | `SecurityConfig` `PUBLIC_ENDPOINTS` + `GET` permitAll sur `/publications`, `/events`, `/teams`, `/partners`, `/public/**` ; `LaboratoryController`, `MemberController.listPublic` | `LandingPage`, `PublicLayout`, `PublicNavbar` | Fig. 2.1 | Fig. 6.23 | **I** |
| 2.2 A–E | 5 statuts de membre : permanent, associé, doctorant, retraité, ancien | `enum MemberStatus{PERMANENT, ASSOCIATE, PHD_STUDENT, RETIRED, FORMER}` ; `Member.currentStatus` | Badges `StatusBadge`, filtres `MembresPage` | Fig. 3.2, 3.7 | Fig. 6.3 | **I** |
| 2.2 C | Doctorant : ajout/consultation publications, **aucun accès aux modules internes** | `PublicationController` autorise `PHD_STUDENT` ; `DocumentController`, `EquipmentController`, `MeetingController` l'excluent au niveau classe | `INTERNAL_MODULE_ROLES` (`utils/roles.js`) + `RequireRole` | Fig. 2.1 | Fig. 7.1 ; test `internalModulesExcludePhdStudent` | **I** |
| 3 | Profil complet : photo, identité, statut, établissement, labo d'origine, biographie, centres d'intérêt, publications, équipe | Entité `Member` (11 champs métier) ; `MemberService.updateProfile` ; upload avatar `POST /members/me/avatar` | `MemberDetailsModal` onglet Profil, `ProfilePage` | Fig. 3.2 | Fig. 6.4 | **I** |
| 3 | Modification libre par le membre / consultation des autres / historisation | Règle « self ou PROFILE\_ADMIN\_ROLES » dans `MemberService` ; `MemberStatusHistory` | `canEdit` dans `MemberDetailsModal` | Fig. 3.2 | Fig. 6.5 | **I** |
| 4.1 | Date de création du laboratoire | `Laboratory.foundingDate` (migration V2) | `AdministrationPage`, portail public | Fig. 3.5 | Fig. 6.22 | **I** |
| 4.2 | Dates membre : naissance (confidentielle), embauche, affiliation | `Member.birthDate / hireDate / firstAffiliationDate` | Champ « confidentielle » annoté dans l'UI | Fig. 3.2 | Fig. 6.4 | **I** |
| 4.3 | Historique des affiliations : quitter puis revenir, chaque période datée | `AffiliationHistory` ; `MemberService.leave()` / `returnToLab()` ouvre une **nouvelle** période | `MemberDetailsModal` onglet Historique | Fig. 3.2, 3.7 | Fig. 6.5 | **I** |
| 5.1 | Administrateur système : comptes, paramétrage, maintenance | `UserAdministrationController` (`hasRole('SYSTEM_ADMIN')`) ; `LaboratoryController.update` | `AdministrationPage` | Fig. 2.1 | Fig. 6.22 | **I** |
| 5.2 | Directeur en mandat : validation adhésions/demandes, supervision, pilotage rapport | `MembershipRequestController` approve/reject `hasAnyRole('DIRECTOR')` ; `ReportController` | `DemandesPage`, `RapportsPage` | Fig. 2.1 | Fig. 6.9, 6.21 | **I** |
| 5.3 | Mandats : Directeur, Vice-directeur, Chef d'équipe ; historique complet conservé | `Mandate` + `enum MandateRoleType` ; `MandateService.assign/end` clôt sans supprimer | `GouvernancePage` onglet Mandats | Fig. 3.2, 3.6 | Fig. 6.8 | **I** |
| 6 | Adhésion : soumission en ligne avec CV + motivation ; acceptée → compte ; refusée → notification ; **décision réservée au directeur** | `MembershipRequest` ; `MembershipRequestService.approve()` crée `User`+`Member`+1re affiliation et envoie les identifiants ; `@PreAuthorize("hasAnyRole('DIRECTOR')")` | `PublicApplyPage` (public), `DemandesPage` (décision) | Fig. 2.1, 3.7 | Fig. 6.24, 6.9 | **I** |
| 7 | Rôles : Directeur, Vice-directeur, Chef d'équipe, Membre ; changement possible ; aucune perte ; historique complet | `enum RoleName` (9 valeurs) ; `UserRoleSyncService` **dérive** le rôle ; `UserRoleHistory` + `RoleChangeSource` | Onglet Gouvernance de la fiche membre | Fig. 3.2, 3.6 | Fig. 6.4 ; 17 tests | **I** |
| 8.1 | Retraité : compte gelé, historique conservé, aucun accès actif | `CustomUserDetails.isEnabled() = user.enabled && !isFrozen(status)` ; vérifié à **chaque** requête par `JwtAuthenticationFilter` | Bandeau « Compte inactif » | Fig. 3.7 | Tests `retiredMemberIsFrozen` | **I** |
| 8.2 | Ancien membre : compte désactivé, réactivable | `MemberStatus.FORMER` ; `MemberService.returnToLab()` | Section « Réactiver ce membre » | Fig. 3.7 | Fig. 6.5 | **I** |
| 9 | Événements : conférences, séminaires, workshops ; création, organisation, **archivage par édition**, affectation d'organisateurs | `Event` + `enum EventType` + `Event.editionNumber` ; `EventOrganizer`, `EventParticipant` ; `GET /events/editions` | `EventsPage`, `EventFormModal`, `EventParticipantsModal` | Fig. 3.3 | Fig. 6.14 | **I** |
| 10 | Archivage documentaire : par événement et par date ; 5 catégories ; upload, téléchargement, recherche, **historisation** | `DocumentEntity` + `DocumentVersion` + `enum DocumentCategory` (9 valeurs) ; `FileStorageService` partitionne `catégorie/aaaa/MM/jj` ; `Document.relatedEventId` | `DocumentsPage`, `DocumentVersionsModal` | Fig. 3.4 | Fig. 6.12, 6.13 | **I** |
| 11 | Rapport annuel : **génération automatique**, basé sur événements/publications/activités | `AnnualReport` ; `ReportService.generate()` ; `AnnualReportPdfGenerator` (OpenPDF) ; `AnnualReportScheduler` `@Scheduled(cron)` 1er janvier 02 h | `RapportsPage` (génération + téléchargement PDF) | Fig. 3.5 | Fig. 6.21 | **I** |
| 12 | Publications : ajout par membres **et doctorants** ; consultation globale ; classement auteur/année/équipe | `Publication` + `PublicationAuthor(authorOrder)` ; `PublicationRepository.search(year, teamId, authorId, search)` | `PublicationsPage` | Fig. 3.3 | Fig. 6.16 | **I** |
| 13 | Communication interne : discussions entre membres, par équipe, liées aux événements | `Discussion` + `enum DiscussionScope{GLOBAL, TEAM, EVENT}` + `Message` ; `DiscussionController` | `NotificationsPage` (3 portées), `DiscussionThreadModal` | Fig. 3.3 | Fig. 6.19 | **I** |
| 14 | Matériel : suivi des arrivages, distribution équitable, historique complet, **qui a reçu / qui n'a pas reçu** | `Equipment(quantity, availableQuantity)`, `EquipmentDistribution(returnedDate)` ; `getNonRecipients()` (requête JPQL dédiée) | `EquipmentPage`, `EquipmentDistributionModal` | Fig. 3.4 | Fig. 6.10, 6.11 ; 8 tests | **I** |
| 15 | Besoins en matériel : soumission, validation par la direction, historique | `EquipmentRequest` + `enum EquipmentRequestStatus` ; approve/reject `hasAnyRole('DIRECTOR','VICE_DIRECTOR')` | `EquipmentPage` onglet Demandes | Fig. 3.4 | Fig. 6.10 | **I** |
| 16 | Conventions : partenaires, conventions, archivage des documents, suivi | `Partner`, `Agreement` ; upload logo et document de convention | `PartenariatsPage`, `PartnerFormModal` | Fig. 3.4 | Fig. 6.18 | **I** |
| 17 | PV : création des réunions, ordre du jour, upload des PV, archivage | `Meeting(agenda)`, `MeetingMinutes` ; `POST /meetings/{id}/minutes`, `GET /meetings/minutes/{id}/download` | `ReunionsPage`, `MeetingFormModal` | Fig. 3.3 | Fig. 6.17 | **I** |
| 18 | Recherche globale : membres, documents, événements, publications | `GlobalSearchService` / `GET /api/v1/search?q=` (`isAuthenticated()`) | Champ de recherche du `Header` (présent sur toutes les pages) | — | Fig. 6.2 | **I** |
| 19 | Notifications : événements, validation de demandes, ajouts de documents | `Notification` + `enum NotificationType` (11) ; `NotificationService.notify / notifyAll / notifyGovernance / notifyActiveMembers` ; déclencheurs dans 4 services | Badge non-lus du `Header`, `NotificationsPage` | Fig. 3.5 | Fig. 6.19 ; 5 tests | **I** |
| 20 | Calendrier : visualisation des événements, navigation temporelle | `CalendarService.getItems(from,to)` agrège `Event` + `Meeting` | `CalendarPage` (navigation mois, panneau du jour) | — | Fig. 6.15 | **I** |
| 21 | Aucune perte de données ; tout historisé ; **séparation stricte statut / rôle** ; toute action traçable | Soft delete `BaseEntity` + `@SQLRestriction("deleted = false")` ; 4 tables d'historique ; `AuditLog` + `AuditService` (`REQUIRES_NEW`) ; `UserRoleSyncService` | `AuditLogPage`, onglets Historique | Fig. 3.5, 3.6 | Fig. 6.20 | **I** |

**Bilan : 21 / 21 sections du cahier des charges couvertes.**

---

## 2. Écarts assumés par rapport aux technologies *recommandées*

`docs/specification.md` propose une liste de technologies **recommandées** (non imposées par
le cahier des charges PDF). Les écarts suivants sont assumés et justifiés au chapitre 4.

| Recommandé | Retenu | Justification |
|---|---|---|
| MySQL | **PostgreSQL** (Neon Cloud) | Types `uuid` natifs, contraintes `CHECK` riches, hébergement managé gratuit |
| TypeScript | **JavaScript (ES2022)** | Périmètre du module JEE centré sur le backend ; typage assuré côté API par les DTO Java |
| Shadcn UI | **Design system interne** (`components/ui/`, 7 modules) | Aucune dépendance externe ; cohérence visuelle maîtrisée |
| Recharts | **Composant `Chart.jsx` interne** (SVG) | Un seul type de graphique nécessaire ; évite 200 ko de dépendance |
| Framer Motion | **Transitions CSS / Tailwind** | Micro-interactions suffisantes, budget de bundle préservé |

---

## 3. Exigences non fonctionnelles — état réel

| Exigence (`specification.md`) | État | Élément de preuve |
|---|---|---|
| Responsive design | **I** | Sidebar en tiroir < 1024 px, tables en `overflow-x`, grilles `sm/xl` |
| Interface professionnelle | **I** | Design system `components/ui/`, 21 pages homogènes |
| **Dark mode** | **N** | Non implémenté — déclaré comme limite (§9.4) |
| Accessibilité | **P** | `aria-label` sur les boutons-icônes, focus visible, fermeture des modales ; pas d'audit WCAG formel |
| Performance | **P** | `open-in-view: false`, pagination serveur, index SQL ; pas de campagne de charge |
| Sécurité | **I** | JWT + BCrypt(12) + RBAC méthode par méthode + gel des comptes + audit |
| Maintenabilité / Clean architecture | **I** | 18 packages métier, séparation contrôleur/service/repository/DTO |
| Composants réutilisables | **I** | 7 modules de design system, 27 composants |
| API REST | **I** | 22 contrôleurs sous `/api/v1`, documentés par springdoc-openapi |

---

## 4. Preuves de validation

| Nature | Volume | Résultat |
|---|---|---|
| Tests automatisés (`mvn clean test`) | 48 | 0 échec, 0 erreur, 0 ignoré |
| Compilation backend (`mvn clean compile`) | — | BUILD SUCCESS |
| Build frontend (`npm run build`) | 1 919 modules | succès |
| Lint frontend (`npx oxlint`) | — | 0 erreur, 6 avertissements préexistants |
| Audit E2E manuel | 21 routes, 9 rôles | matrice conforme, 0 dérive de rôle |
| Diagrammes UML vérifiés | 8 | conformes au code (2 erreurs de syntaxe corrigées) |
| Captures d'écran de la plateforme | 27 | 2 880 × 1 800 px, application réelle |

---

## 5. Volumétrie du code (commit `98edb17`)

| Élément | Quantité |
|---|---|
| Entités JPA | 31 |
| Services métier | 28 |
| Contrôleurs REST | 22 |
| Repositories Spring Data | 30 |
| Énumérations métier | 10 |
| Migrations Flyway | 3 (V1, V2, V3) |
| Tables relationnelles | 29 |
| Pages React | 21 |
| Composants React | 27 (+ 7 modules de design system) |
| Services frontend (Axios) | 19 |
| Lignes Java (`src/main`) | 9 874 |
| Lignes Java de test | 863 |
| Lignes JavaScript / JSX | 13 049 |
| Lignes SQL de migration | 750 |
