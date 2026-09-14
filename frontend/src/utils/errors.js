/*
 * Traduction des erreurs d'API en messages affichables.
 *
 * Cet helper existait en 24 copies collées dans les pages et les modales, dont
 * six avaient silencieusement divergé : chacune ajoutait ses propres messages
 * pour un 403 ou un 409, au-dessus d'une même chaîne de repli. La signature
 * ci-dessous reproduit exactement ce contrat — un dictionnaire `overrides`
 * remplace le `if (status === ...)` que chaque copie écrivait à la main — de
 * sorte qu'une migration ne change aucun comportement.
 *
 * Migration en cours : voir docs/FINAL_PRE_SOUTENANCE_AUDIT.md (P2-01).
 */

/** Message par défaut d'un refus d'autorisation, repris de la copie majoritaire. */
const DEFAULT_FORBIDDEN = "Vous n'avez pas les droits nécessaires pour cette action.";

/*
 * Le backend journalise et renvoie ses messages en anglais (ils servent aussi au
 * journal d'audit). L'interface étant française, on traduit ici les messages
 * réellement exposés à l'utilisateur, sans rien modifier côté serveur.
 */
const BACKEND_MESSAGE_FR = {
  'No member profile linked to this account':
    "Ce compte technique n'est associé à aucun profil membre : cette action est réservée aux membres du laboratoire.",
  'Your account has been frozen or disabled':
    'Votre compte a été gelé ou désactivé. Contactez la direction du laboratoire.',
  'Member has no active affiliation period':
    "Ce membre n'a aucune période d'affiliation en cours.",
};

/** Traduit un message backend connu ; laisse passer les autres tels quels. */
export function translateBackendMessage(message) {
  if (!message) return null;
  return BACKEND_MESSAGE_FR[message] ?? message;
}

/**
 * Transforme une erreur Axios en message affichable.
 *
 * @param err       l'erreur remontée par Axios
 * @param fallback  message utilisé si le serveur n'en fournit aucun
 * @param overrides messages par code HTTP, ex. { 409: 'Ce nom existe déjà.' }
 *                  — c'est l'équivalent des `if (status === 409)` que chaque
 *                  copie locale écrivait avant.
 */
export function friendlyError(err, fallback, overrides = {}) {
  const status = err?.response?.status;
  if (status && overrides[status]) return overrides[status];
  if (status === 403) return DEFAULT_FORBIDDEN;
  return translateBackendMessage(err?.response?.data?.message) || fallback;
}
