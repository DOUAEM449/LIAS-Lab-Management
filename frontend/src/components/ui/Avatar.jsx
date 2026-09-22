import { useState } from 'react';
import { User } from 'lucide-react';

/*
 * Avatar avec chaîne de repli complète : photo → initiales → silhouette.
 *
 * Les quatre points de rendu d'avatar affichaient la photo dans un <img> nu.
 * Quand le fichier est absent ou que le service de fichiers ne répond pas, le
 * navigateur montre son icône d'image cassée — visible à l'écran, et jusque
 * dans les captures. `onError` bascule désormais sur les initiales, et la
 * silhouette prend le relais quand on ne connaît même pas de nom.
 */

/*
 * Teintes autorisées pour les initiales.
 *
 * Balayer les 360° produisait des avatars mauves — une couleur bannie de
 * l'identité LIAS. Cette gamme fermée reste dans la famille de la charte
 * (ambre, vert, sarcelle, bleu du logo, rouge chaud) et évite la bande
 * violette (280–340°). Huit teintes suffisent à distinguer les personnes
 * d'une liste sans jamais sortir de la palette.
 */
const HUES = [25, 55, 145, 175, 200, 228, 242, 262];

/** Teinte déterministe tirée du nom, pour que chaque personne garde la sienne. */
function hueFromName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return HUES[Math.abs(hash) % HUES.length];
}

function initialsFrom(name, email) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return null;
}

export default function Avatar({ src, name = '', email = '', size = 36, className = '' }) {
  const [failed, setFailed] = useState(false);
  const initials = initialsFrom(name, email);
  const showImage = Boolean(src) && !failed;

  const base = `rounded-full shrink-0 overflow-hidden flex items-center justify-center
    text-white font-semibold ${className}`;
  const dims = { width: size, height: size };

  if (showImage) {
    return (
      <div className={`${base} bg-lias-surface-muted`} style={dims}>
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          /* Repli silencieux : l'image cassée ne doit jamais atteindre l'écran. */
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  if (initials) {
    return (
      <div
        className={base}
        /* L=48 % : à 58 % les initiales blanches devenaient illisibles sur les
           teintes claires (vert, cyan, jaune) de la roue. */
        style={{ ...dims, background: `oklch(48% 0.12 ${hueFromName(name || email)})`, fontSize: size * 0.34 }}
        aria-hidden="true"
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={`${base} bg-lias-navy-light`} style={dims} aria-hidden="true">
      <User size={Math.round(size * 0.5)} strokeWidth={2} />
    </div>
  );
}
