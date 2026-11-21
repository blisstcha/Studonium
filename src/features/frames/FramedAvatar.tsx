import { findFrame } from './frames.catalog';
import './frames.css';

interface FramedAvatarProps {
  src: string | null;
  name: string;
  frameId: string | null;
  decorative?: boolean;
}

export default function FramedAvatar({ src, name, frameId, decorative = false }: FramedAvatarProps) {
  const frame = findFrame(frameId);
  return (
    <span className={`studonium-framed-avatar ${frame ? 'has-frame' : ''}`} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : `${name}${frame ? ` con marco ${frame.name}` : ''}`} aria-hidden={decorative || undefined}>
      <span className="studonium-framed-avatar-photo">{src ? <img src={src} alt="" draggable={false} /> : <span>{name.slice(0, 1).toUpperCase()}</span>}</span>
      {frame && <img className="studonium-framed-avatar-art" src={frame.image} alt="" draggable={false} />}
    </span>
  );
}
