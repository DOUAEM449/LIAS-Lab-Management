/*
 * Marque LIAS — le « L » du logotype tracé comme une piste de circuit imprimé,
 * clin d'œil au cerveau connecté du logo du laboratoire.
 *
 * Dessinée en SVG plutôt qu'importée en image : elle reste nette à toute taille,
 * suit la couleur courante et ne coûte aucune requête. Pour basculer sur le
 * fichier officiel du laboratoire, déposer le PNG dans `public/` et remplacer le
 * corps de ce composant par une balise <img> — c'est le seul point à changer,
 * tous les écrans passant par ici.
 */
export default function BrandMark({ size = 36, className = '' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="LIAS"
    >
      <rect width="48" height="48" rx="11" className="fill-lias-navy-deep" />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 12v20h13" />
        <path d="M17 19h-5" opacity=".5" />
        <path d="M17 26h-5" opacity=".5" />
      </g>
      <g fill="currentColor">
        <circle cx="17" cy="12" r="2.6" />
        <circle cx="30" cy="32" r="2.6" />
        <circle cx="11" cy="19" r="1.7" opacity=".5" />
        <circle cx="11" cy="26" r="1.7" opacity=".5" />
      </g>
      <rect
        x="31"
        y="14"
        width="7"
        height="7"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity=".65"
      />
    </svg>
  );
}
