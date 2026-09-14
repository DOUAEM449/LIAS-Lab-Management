/*
 * Traduction d'affichage des libellés du journal d'audit.
 *
 * Le backend rédige ces libellés en anglais et les stocke tels quels dans la
 * table d'audit : ils font partie de la trace et ne doivent pas être réécrits
 * côté serveur. La traduction est donc purement présentationnelle — la donnée
 * conservée reste l'originale.
 *
 * Toute chaîne non reconnue est renvoyée inchangée : une règle qui ne
 * s'applique pas laisse le texte d'origine visible plutôt que de le déformer.
 */

/** Règles ordonnées : la première qui correspond gagne. */
const RULES = [
  [/^Successful login$/i, () => 'Connexion réussie'],
  [/^Failed login attempt$/i, () => 'Tentative de connexion échouée'],
  [/^Member archived \(soft delete\)$/i, () => 'Membre archivé (suppression logique)'],
  [/^Member restored$/i, () => 'Membre restauré'],
  [/^Member archived$/i, () => 'Membre archivé'],
  [/^Profile updated$/i, () => 'Profil mis à jour'],
  [/^Mandate ended$/i, () => 'Mandat clôturé'],
  [
    /^Mandate auto-ended: (.+)$/i,
    (m) => `Mandat clôturé automatiquement : ${motifFr(m[1])}`,
  ],
  [
    /^Assigned ([A-Z_]+) to member (.+)$/,
    (m) => `Attribution du mandat ${mandatFr(m[1])} au membre ${court(m[2])}`,
  ],
  [/^Status changed: (.*)$/i, (m) => `Changement de statut : ${m[1] || '—'}`],
  [
    /^Member left the laboratory: (.*)$/i,
    (m) => `Départ du laboratoire : ${m[1] || '—'}`,
  ],
];

const MANDAT_FR = {
  DIRECTOR: 'Directeur',
  VICE_DIRECTOR: 'Vice-directeur',
  TEAM_LEADER: "Chef d'équipe",
};

const MOTIF_FR = {
  'member archived': 'membre archivé',
  'member left the laboratory': 'départ du laboratoire',
};

const mandatFr = (r) => MANDAT_FR[r] ?? r;
const court = (id) => (id && id.length > 12 ? `${id.slice(0, 8)}…` : id);

const STATUT_FR = {
  PERMANENT: 'permanent',
  ASSOCIATE: 'associé',
  PHD_STUDENT: 'doctorant',
  RETIRED: 'retraité',
  FORMER: 'ancien membre',
};

function motifFr(raw) {
  const cle = raw.trim().toLowerCase();
  if (MOTIF_FR[cle]) return MOTIF_FR[cle];
  /* On compare en minuscules mais on relit le code de statut sur la chaîne
     d'origine, sans quoi « RETIRED » ressortirait en « retired ». */
  const statut = raw.trim().match(/^member status became (.+)$/i);
  if (statut) {
    const code = statut[1].trim();
    return `statut devenu ${STATUT_FR[code.toUpperCase()] ?? code}`;
  }
  return raw;
}

/** Traduit un libellé d'audit pour l'affichage ; laisse passer l'inconnu. */
export function auditDetailsFr(details) {
  if (!details) return '—';
  for (const [pattern, build] of RULES) {
    const m = details.match(pattern);
    if (m) return build(m);
  }
  return details;
}
