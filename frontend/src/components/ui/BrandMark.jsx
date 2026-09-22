/*
 * Marque LIAS — asset officiel du laboratoire.
 *
 * Deux déclinaisons, choisies selon le fond :
 *   - `icon` (défaut) : cerveau + circuit détourés, sans le texte. C'est la
 *     variante des fonds sombres et des espaces étroits (barre latérale), où
 *     le logotype complet serait illisible (son texte est noir) ou écrasé.
 *   - `full` : le logotype officiel complet, réservé aux fonds clairs.
 *
 * Les deux pointent sur le fichier fourni par le laboratoire : rien n'est
 * redessiné ni réinterprété ici.
 */
export default function BrandMark({ variant = 'icon', height = 36, className = '' }) {
  const src = variant === 'full' ? '/lias-logo.png' : '/lias-icon.png';
  return (
    <img
      src={src}
      alt="LIAS"
      height={height}
      style={{ height }}
      className={`w-auto select-none shrink-0 ${className}`}
    />
  );
}
