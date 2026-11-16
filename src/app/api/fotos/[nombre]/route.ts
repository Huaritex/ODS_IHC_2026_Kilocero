import { getSession } from "@/lib/auth";
import { leerFoto } from "@/lib/fotos";

const TIPOS: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _req: Request,
  context: { params: Promise<{ nombre: string }> }
) {
  if (!(await getSession())) {
    return new Response("No autenticado", { status: 401 });
  }
  const { nombre } = await context.params;
  const data = await leerFoto(nombre);
  if (!data) return new Response("No encontrada", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": TIPOS[nombre.split(".").pop() ?? ""] ?? "image/jpeg",
      "Cache-Control": "private, max-age=86400, immutable",
    },
  });
}
