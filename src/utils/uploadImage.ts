export type ImageVariant = "thumb" | "medium" | "full";

const VARIANT_MAX_WIDTH: Record<ImageVariant, number> = {
  thumb: 300,
  medium: 800,
  full: 1600,
};

const VARIANT_QUALITY: Record<ImageVariant, number> = {
  thumb: 0.8,
  medium: 0.82,
  full: 1.0,
};

export async function convertToWebP(file: File, quality = 0.82): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("WebP conversion failed"))),
      "image/webp",
      quality
    );
  });

  const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([blob], name, { type: "image/webp" });
}

async function resizeToWebP(
  file: File,
  maxWidth: number,
  quality: number
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  let width = bitmap.width;
  let height = bitmap.height;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  const maxHeight = Math.round(maxWidth * 1.33);
  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("WebP conversion failed"))),
      "image/webp",
      quality
    );
  });
}

export type ImageVariants = {
  thumb: Blob;
  medium: Blob;
  full: Blob;
};

export async function generateImageVariants(file: File): Promise<ImageVariants> {
  const [thumb, medium, full] = await Promise.all([
    resizeToWebP(file, VARIANT_MAX_WIDTH.thumb, VARIANT_QUALITY.thumb),
    resizeToWebP(file, VARIANT_MAX_WIDTH.medium, VARIANT_QUALITY.medium),
    resizeToWebP(file, VARIANT_MAX_WIDTH.full, VARIANT_QUALITY.full),
  ]);
  return { thumb, medium, full };
}

export type UploadResult = {
  url: string;
  mediumUrl: string;
  thumbUrl: string;
};

export async function uploadProductImage(
  file: File,
  productId: string,
  slot: 1 | 2 | 3
): Promise<UploadResult> {
  const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
  const { storage } = await import("@/firebase");

  const variants = await generateImageVariants(file);

  const basePath = `products/${productId}/image${slot}`;
  const fullRef = ref(storage, `${basePath}.webp`);
  const mediumRef = ref(storage, `${basePath}-medium.webp`);
  const thumbRef = ref(storage, `${basePath}-thumb.webp`);

  await Promise.all([
    uploadBytes(fullRef, variants.full, { contentType: "image/webp" }),
    uploadBytes(mediumRef, variants.medium, { contentType: "image/webp" }),
    uploadBytes(thumbRef, variants.thumb, { contentType: "image/webp" }),
  ]);

  const [url, mediumUrl, thumbUrl] = await Promise.all([
    getDownloadURL(fullRef),
    getDownloadURL(mediumRef),
    getDownloadURL(thumbRef),
  ]);

  return { url, mediumUrl, thumbUrl };
}
