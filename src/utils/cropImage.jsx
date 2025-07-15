// src/utils/cropImage.jsx
export async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await new Promise((res, rej) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => res(img);
    img.onerror = rej;
  });

  const canvas = document.createElement('canvas');
  canvas.width  = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    pixelCrop.width, pixelCrop.height
  );

  return new Promise((res) =>
    canvas.toBlob(blob => {
      blob.name = 'avatar.jpeg';
      res(blob);
    }, 'image/jpeg')
  );
}