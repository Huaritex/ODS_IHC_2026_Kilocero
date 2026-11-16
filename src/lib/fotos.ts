import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const MAX_BYTES = 600_000;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
export const NOMBRE_FOTO_RE = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

/** Guarda una foto enviada como data URL y devuelve la URL pública (o null). */
export async function guardarFoto(dataUrl: string): Promise<string | null> {
  if (dataUrl.startsWith("/api/fotos/")) return dataUrl;
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(
    dataUrl
  );
  if (!m) return null;
  const buf = Buffer.from(m[2], "base64");
  if (buf.length === 0 || buf.length > MAX_BYTES) return null;
  const nombre = `${randomUUID()}.${EXT[m[1]]}`;
  await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(path.join(UPLOADS_DIR, nombre), buf);
  return `/api/fotos/${nombre}`;
}

export async function leerFoto(nombre: string) {
  if (!NOMBRE_FOTO_RE.test(nombre)) return null;
  try {
    return await readFile(path.join(UPLOADS_DIR, nombre));
  } catch {
    return null;
  }
}
