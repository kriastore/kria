export type ImageVariant = "thumb" | "medium" | "full";

const VARIANT_MAX_WIDTH: Record<ImageVariant, number> = {
  thumb: 512,
  medium: 800,
  full: 1600,
};

const VARIANT_QUALITY: Record<ImageVariant, number> = {
  thumb: 0.85,
  medium: 0.82,
  full: 0.92,
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

export type ReviewImageResult = {
  url: string;
  thumbUrl: string;
};

export async function uploadReviewImage(
  file: File,
  reviewId: string,
  onProgress?: (fraction: number) => void
): Promise<ReviewImageResult> {
  const { ref, uploadBytesResumable, getDownloadURL } = await import("firebase/storage");
  const { storage } = await import("@/firebase");

  onProgress?.(0.05);
  const variants = await generateImageVariants(file);
  onProgress?.(0.4);

  const basePath = `reviews/${reviewId}`;
  const fullRef = ref(storage, `${basePath}.webp`);
  const thumbRef = ref(storage, `${basePath}-thumb.webp`);

  let fullProgress = 0;
  let thumbProgress = 0;
  const report = () => {
    onProgress?.(0.4 + 0.6 * ((fullProgress + thumbProgress) / 2));
  };

  const upload = (key: "full" | "thumb", storageRef: any, blob: Blob) =>
    new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, blob, { contentType: "image/webp" });
      task.on(
        "state_changed",
        (snap) => {
          const fraction = snap.totalBytes ? snap.bytesTransferred / snap.totalBytes : 1;
          if (key === "full") fullProgress = fraction;
          else thumbProgress = fraction;
          report();
        },
        reject,
        () => resolve(undefined)
      );
    });

  await Promise.all([
    upload("full", fullRef, variants.full),
    upload("thumb", thumbRef, variants.thumb),
  ]);
  onProgress?.(1);

  const [url, thumbUrl] = await Promise.all([
    getDownloadURL(fullRef),
    getDownloadURL(thumbRef),
  ]);

  return { url, thumbUrl };
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
