export interface AvatarFrame {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export const STARTER_FRAME_ID = 'osito-lazos';

export const AVATAR_FRAMES: AvatarFrame[] = [{
  id: STARTER_FRAME_ID,
  name: 'Osito de lazos',
  description: 'Tu primer diseño: ositos, lazos de cuadros y pequeñas estrellas.',
  price: 300,
  image: `${import.meta.env.BASE_URL}frames/osito-lazos.png`,
}];

export function findFrame(id: string | null): AvatarFrame | undefined {
  return AVATAR_FRAMES.find((frame) => frame.id === id);
}
