export function EncabezadoAdmin({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion: string;
}) {
  return (
    <div>
      <h2 className="text-2xl font-black text-slate-950">{titulo}</h2>
      <p className="text-sm font-semibold text-slate-700">{descripcion}</p>
    </div>
  );
}
