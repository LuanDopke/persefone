import { useState } from 'react';
import { Icon } from './Icon';

const ASPECTS = { card: 'aspect-[4/3]', square: 'aspect-square', detail: 'aspect-video' };

export default function MediaFrame({ src, alt, aspect = 'card', fit = 'cover', fallback, className = '' }) {
  const [failed, setFailed] = useState(false);
  const unavailable = !src || failed;
  return (
    <div className={`relative flex overflow-hidden border-4 border-charcoal bg-gray-200 ${ASPECTS[aspect] || ASPECTS.card} ${className}`}>
      {unavailable ? (fallback || <div role="img" aria-label="Imagem indisponível" className="flex h-full w-full items-center justify-center gap-2 font-bold text-charcoal/60"><Icon name="collection" /><span>Imagem indisponível</span></div>) : <img src={src} alt={alt} onError={() => setFailed(true)} className={`h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'}`} />}
    </div>
  );
}
