import type { ReactNode } from "react";

export interface ColumnaAdmin {
  label: string;
  derecha?: boolean;
}

const CAJA = "rounded-2xl border-2 border-slate-900 bg-white";

/**
 * Listado responsivo del admin: tarjetas en móvil (`tarjetas`) y tabla
 * semántica en escritorio (`filas`). Resuelve en un solo lugar los estados
 * "cargando" y "vacío" de ambas vistas.
 */
export function ListadoAdmin({
  caption,
  columnas,
  cargando,
  vacio,
  mensajeCarga,
  mensajeVacio,
  tarjetas,
  filas,
}: {
  caption: string;
  columnas: ColumnaAdmin[];
  cargando: boolean;
  vacio: boolean;
  mensajeCarga: string;
  mensajeVacio: string;
  tarjetas: ReactNode;
  filas: ReactNode;
}) {
  const aviso = cargando ? mensajeCarga : vacio ? mensajeVacio : null;
  return (
    <>
      <div className="space-y-3 md:hidden">
        {aviso ? (
          <div className={`${CAJA} p-5 text-center font-bold`}>{aviso}</div>
        ) : (
          tarjetas
        )}
      </div>

      <div className={`hidden overflow-x-auto md:block ${CAJA}`}>
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b-2 border-slate-900 bg-slate-100 text-xs font-black uppercase text-slate-950">
            <tr>
              {columnas.map((c) => (
                <th
                  key={c.label}
                  scope="col"
                  className={`px-4 py-3 ${c.derecha ? "text-right" : ""}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {aviso ? (
              <tr>
                <td
                  colSpan={columnas.length}
                  className="px-4 py-6 text-center font-bold"
                >
                  {aviso}
                </td>
              </tr>
            ) : (
              filas
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
