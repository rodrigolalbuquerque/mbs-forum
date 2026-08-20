// Redimensiona uma imagem para um quadrado (recorte central "cover") de `size`px
// e devolve um Blob leve (WebP, com fallback JPEG). Sem bibliotecas — usa canvas.
// Em caso de falha, devolve o arquivo original para não bloquear o upload.
export async function resizeImageToSquare(
  file: File,
  size = 256,
  quality = 0.85,
): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // "cover": escala para preencher o quadrado e centraliza (corta o excesso).
    const scale = Math.max(size / bitmap.width, size / bitmap.height);
    const w = bitmap.width * scale;
    const h = bitmap.height * scale;
    ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
    bitmap.close?.();

    const toBlob = (type: string) =>
      new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, type, quality),
      );

    return (await toBlob("image/webp")) ?? (await toBlob("image/jpeg")) ?? file;
  } catch {
    return file;
  }
}
