import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { EstadoVerificacion, Rol } from "./types";
import { ROL_HOME } from "./constants";

export const SESSION_COOKIE_NAME = "kilocero_session";

export interface SessionPayload {
  userId: string;
  email: string;
  nombre: string;
  rol: Rol;
  estadoVerificacion: EstadoVerificacion;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET debe definirse (mínimo 32 caracteres).");
    }
    return new TextEncoder().encode(
      "kilo-cero-solo-desarrollo-no-usar-en-produccion"
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.nombre !== "string" ||
      typeof payload.rol !== "string" ||
      typeof payload.estadoVerificacion !== "string"
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      email: payload.email,
      nombre: payload.nombre,
      rol: payload.rol as Rol,
      estadoVerificacion: payload.estadoVerificacion as EstadoVerificacion,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireRole(allowedRoles: Rol[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!allowedRoles.includes(session.rol)) {
    redirect(ROL_HOME[session.rol]);
  }
  return session;
}
