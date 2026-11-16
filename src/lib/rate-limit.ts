const intentos = new Map<string, { n: number; hasta: number }>();
const MAX = 5;
const VENTANA_MS = 15 * 60 * 1000;

export function bloqueado(clave: string): number {
  const e = intentos.get(clave);
  if (!e) return 0;
  if (Date.now() > e.hasta) {
    intentos.delete(clave);
    return 0;
  }
  return e.n >= MAX ? Math.ceil((e.hasta - Date.now()) / 60000) : 0;
}

export function registrarFallo(clave: string) {
  const e = intentos.get(clave);
  if (!e || Date.now() > e.hasta) {
    intentos.set(clave, { n: 1, hasta: Date.now() + VENTANA_MS });
  } else {
    e.n += 1;
  }
}

export function limpiar(clave: string) {
  intentos.delete(clave);
}
