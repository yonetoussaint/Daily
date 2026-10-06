/** Photos are shrunk in the browser and kept as small JPEG data URLs in the item itself. */
const MAX_SIDE = 640;
const QUALITY = 0.78;
export const MAX_IMAGE_CHARS = 400_000;

export const isImageValue = (v) => typeof v === "string" && v.length <= MAX_IMAGE_CHARS && (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(v) || /^https:\/\/\S+$/i.test(v));

export const MAX_IMAGES = 8;

/** All photos of an item, cover first. Older items only have a single `image`. */
export const itemImages = (item) => {
  const list = Array.isArray(item?.images) ? item.images.filter(isImageValue) : [];
  if (list.length) return list.slice(0, MAX_IMAGES);
  return item?.image && isImageValue(item.image) ? [item.image] : [];
};

/** File → downscaled JPEG data URL. Rejects if the file isn't a readable image. */
export function fileToThumb(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) return reject(new Error("That isn’t an image."));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff"; // transparent PNGs become white instead of black
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", QUALITY));
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Couldn’t read that image.")); };
    img.src = url;
  });
}
