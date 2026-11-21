export async function prepareProfileImage(file: File, kind: 'avatar' | 'banner'): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Elige una imagen JPG, PNG o WebP. Si tu móvil usa HEIC, expórtala como JPG.');
  }
  if (file.size > 12 * 1024 * 1024) throw new Error('Elige una imagen de menos de 12 MB.');

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('No se ha podido leer la imagen. Prueba con otra foto.'));
      image.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40_000_000) {
      throw new Error('La imagen es demasiado grande. Prueba con una copia de menor resolución.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = kind === 'avatar' ? 400 : 1440;
    canvas.height = kind === 'avatar' ? 400 : 480;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Este navegador no permite preparar la imagen.');

    const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.fillStyle = '#faf5ee';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}
