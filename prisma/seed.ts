import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  }),
});

function hoyALaHora(horas: number, minutos = 0): Date {
  const d = new Date();
  d.setHours(horas, minutos, 0, 0);
  return d;
}

function ayerALaHora(horas: number, minutos = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(horas, minutos, 0, 0);
  return d;
}

async function main() {
  console.log("Limpiando base de datos...");
  await prisma.metricaUsabilidad.deleteMany();
  await prisma.reserva.deleteMany();
  await prisma.publicacion.deleteMany();
  await prisma.usuario.deleteMany();

  const passwordHash = await bcrypt.hash("kilocero2026", 10);

  console.log("Creando usuarios de Santa Cruz de la Sierra...");
  const carmen = await prisma.usuario.create({
    data: {
      nombre: "Carmen Quispe",
      email: "carmen@abasto.bo",
      passwordHash,
      rol: "COMERCIANTE",
      telefono: "+591 71023456",
      mercado: "Mercado Abasto",
      puesto: "Pasillo 2, Puesto 14",
      estadoVerificacion: "VERIFICADO",
      direccion: "Av. Piraí y 3er Anillo Interno",
      lat: -17.7958,
      lng: -63.1965,
    },
  });

  const mateo = await prisma.usuario.create({
    data: {
      nombre: "Mateo Vargas",
      email: "mateo@mutualista.bo",
      passwordHash,
      rol: "COMERCIANTE",
      telefono: "+591 72198765",
      mercado: "Mercado Mutualista",
      puesto: "Sector Panadería, Puesto 7",
      estadoVerificacion: "VERIFICADO",
      direccion: "Av. Mutualista y 3er Anillo",
      lat: -17.7689,
      lng: -63.1642,
    },
  });

  const rosaura = await prisma.usuario.create({
    data: {
      nombre: "Rosaura Mamani",
      email: "rosaura@lospozos.bo",
      passwordHash,
      rol: "COMERCIANTE",
      telefono: "+591 76045123",
      mercado: "Mercado Los Pozos",
      puesto: "Galpón Central, Puesto 31",
      estadoVerificacion: "VERIFICADO",
      direccion: "Calle Suárez Arana y Campero",
      lat: -17.7782,
      lng: -63.1783,
    },
  });

  const comedorCotoca = await prisma.usuario.create({
    data: {
      nombre: "Lucía Méndez",
      email: "comedor@cotoca.bo",
      passwordHash,
      rol: "RECEPTOR",
      telefono: "+591 70911223",
      organizacion: "Comedor Popular Virgen de Cotoca",
      estadoVerificacion: "VERIFICADO",
      direccion: "Barrio Villa 1ro de Mayo, Calle 4",
      lat: -17.788,
      lng: -63.151,
    },
  });

  const hogarTeresa = await prisma.usuario.create({
    data: {
      nombre: "Marco Antonio Justiniano",
      email: "hogar@teresa.bo",
      passwordHash,
      rol: "RECEPTOR",
      telefono: "+591 75544332",
      organizacion: "Hogar Teresa de los Andes",
      estadoVerificacion: "VERIFICADO",
      direccion: "Zona Norte, Av. Banzer Km 4",
      lat: -17.749,
      lng: -63.179,
    },
  });

  // Receptores pendientes para demostrar aprobación/rechazo en el panel Admin
  await prisma.usuario.create({
    data: {
      nombre: "Elena Rojas",
      email: "ollacomun@plan3000.bo",
      passwordHash,
      rol: "RECEPTOR",
      telefono: "+591 78122334",
      organizacion: "Olla Común Barrio San Juan (Plan 3000)",
      estadoVerificacion: "PENDIENTE",
      direccion: "Av. Paurito, Rotonda Plan 3000",
      lat: -17.835,
      lng: -63.138,
    },
  });

  await prisma.usuario.create({
    data: {
      nombre: "Carlos Suárez",
      email: "manoamiga@ong.bo",
      passwordHash,
      rol: "RECEPTOR",
      telefono: "+591 73399881",
      organizacion: "Fundación Mano Amiga SCZ",
      estadoVerificacion: "PENDIENTE",
      direccion: "Barrio Equipetrol, Calle 6 Este",
      lat: -17.764,
      lng: -63.195,
    },
  });

  await prisma.usuario.create({
    data: {
      nombre: "Admin Kilo Cero",
      email: "admin@kilocero.bo",
      passwordHash,
      rol: "ADMIN",
      telefono: "+591 70000001",
      organizacion: "Equipo HCI - UCB Santa Cruz",
      estadoVerificacion: "VERIFICADO",
      direccion: "UCB Campus Santa Cruz",
      lat: -17.752,
      lng: -63.175,
    },
  });

  console.log("Creando publicaciones de excedentes...");
  // 1. Disponibles hoy
  await prisma.publicacion.create({
    data: {
      comercianteId: carmen.id,
      categoria: "VERDURAS",
      cantidadAproximada: "MUCHO",
      descripcion: "Tomate perita maduro y cebolla morada, 2 cajas listas para llevar.",
      mercado: "Mercado Abasto",
      direccionTexto: "Mercado Abasto - Pasillo 2, Puesto 14",
      lat: -17.7958,
      lng: -63.1965,
      ventanaInicio: hoyALaHora(17, 0),
      ventanaFin: hoyALaHora(19, 30),
      estado: "DISPONIBLE",
    },
  });

  await prisma.publicacion.create({
    data: {
      comercianteId: carmen.id,
      categoria: "FRUTAS",
      cantidadAproximada: "MEDIO",
      descripcion: "Plátanos de freír bien maduros y 6 papayas.",
      mercado: "Mercado Abasto",
      direccionTexto: "Mercado Abasto - Pasillo 2, Puesto 14",
      lat: -17.7962,
      lng: -63.1959,
      ventanaInicio: hoyALaHora(17, 15),
      ventanaFin: hoyALaHora(19, 0),
      estado: "DISPONIBLE",
    },
  });

  await prisma.publicacion.create({
    data: {
      comercianteId: mateo.id,
      categoria: "PANIFICACION",
      cantidadAproximada: "MEDIO",
      descripcion: "Pan casero, marraquetas y cuñapés horneados hoy.",
      mercado: "Mercado Mutualista",
      direccionTexto: "Mercado Mutualista - Sector Panadería, Puesto 7",
      lat: -17.7689,
      lng: -63.1642,
      ventanaInicio: hoyALaHora(17, 30),
      ventanaFin: hoyALaHora(19, 30),
      estado: "DISPONIBLE",
    },
  });

  await prisma.publicacion.create({
    data: {
      comercianteId: rosaura.id,
      categoria: "COMIDA_PREPARADA",
      cantidadAproximada: "POCO",
      descripcion: "8 porciones de majadito de charque en envases limpios.",
      mercado: "Mercado Los Pozos",
      direccionTexto: "Mercado Los Pozos - Galpón Central, Puesto 31",
      lat: -17.7782,
      lng: -63.1783,
      ventanaInicio: hoyALaHora(17, 0),
      ventanaFin: hoyALaHora(18, 45),
      estado: "DISPONIBLE",
    },
  });

  // 2. Publicación reportada para moderación en Admin
  await prisma.publicacion.create({
    data: {
      comercianteId: rosaura.id,
      categoria: "LACTEOS",
      cantidadAproximada: "POCO",
      descripcion: "Queso criollo sin refrigeración desde mediodía.",
      mercado: "Mercado Los Pozos",
      direccionTexto: "Mercado Los Pozos - Galpón Central, Puesto 31",
      lat: -17.7785,
      lng: -63.1779,
      ventanaInicio: hoyALaHora(17, 0),
      ventanaFin: hoyALaHora(19, 0),
      estado: "DISPONIBLE",
      reportada: true,
      motivoReporte: "Posible ruptura de cadena de frío reportada por receptor.",
    },
  });

  // 3. Publicación reservada (para probar confirmación doble)
  const pubReservada = await prisma.publicacion.create({
    data: {
      comercianteId: mateo.id,
      categoria: "PANIFICACION",
      cantidadAproximada: "POCO",
      descripcion: "Empanadas de queso sobrantes de la tarde.",
      mercado: "Mercado Mutualista",
      direccionTexto: "Mercado Mutualista - Sector Panadería, Puesto 7",
      lat: -17.7691,
      lng: -63.1645,
      ventanaInicio: hoyALaHora(17, 0),
      ventanaFin: hoyALaHora(19, 0),
      estado: "RESERVADO",
    },
  });

  await prisma.reserva.create({
    data: {
      publicacionId: pubReservada.id,
      receptorId: comedorCotoca.id,
      codigoRetiro: "KC-4821",
      ventanaRetiroInicio: hoyALaHora(17, 30),
      ventanaRetiroFin: hoyALaHora(18, 30),
      estado: "ACTIVA",
    },
  });

  // 4. Publicaciones ya confirmadas (para métricas de impacto iniciales en Admin)
  const pubConfirmada1 = await prisma.publicacion.create({
    data: {
      comercianteId: carmen.id,
      categoria: "VERDURAS",
      cantidadAproximada: "MUCHO",
      descripcion: "Papa harinosa, zanahoria y zapallo.",
      mercado: "Mercado Abasto",
      direccionTexto: "Mercado Abasto - Pasillo 2, Puesto 14",
      lat: -17.7958,
      lng: -63.1965,
      ventanaInicio: ayerALaHora(17, 0),
      ventanaFin: ayerALaHora(19, 0),
      estado: "CONFIRMADO",
    },
  });

  await prisma.reserva.create({
    data: {
      publicacionId: pubConfirmada1.id,
      receptorId: comedorCotoca.id,
      ventanaRetiroInicio: ayerALaHora(17, 30),
      ventanaRetiroFin: ayerALaHora(18, 15),
      estado: "COMPLETADA",
      confirmadoReceptor: true,
      confirmadoComerciante: true,
      confirmadoReceptorAt: ayerALaHora(18, 5),
      confirmadoComercianteAt: ayerALaHora(18, 6),
    },
  });

  const pubConfirmada2 = await prisma.publicacion.create({
    data: {
      comercianteId: mateo.id,
      categoria: "FRUTAS",
      cantidadAproximada: "MEDIO",
      descripcion: "Naranjas y mandarinas de Yapacaní.",
      mercado: "Mercado Mutualista",
      direccionTexto: "Mercado Mutualista - Sector Frutas, Puesto 3",
      lat: -17.7689,
      lng: -63.1642,
      ventanaInicio: ayerALaHora(17, 0),
      ventanaFin: ayerALaHora(19, 0),
      estado: "CONFIRMADO",
    },
  });

  await prisma.reserva.create({
    data: {
      publicacionId: pubConfirmada2.id,
      receptorId: hogarTeresa.id,
      codigoRetiro: "KC-1904",
      ventanaRetiroInicio: ayerALaHora(17, 45),
      ventanaRetiroFin: ayerALaHora(18, 30),
      estado: "COMPLETADA",
      confirmadoReceptor: true,
      confirmadoComerciante: true,
      confirmadoReceptorAt: ayerALaHora(18, 10),
      confirmadoComercianteAt: ayerALaHora(18, 12),
    },
  });

  console.log("Cargando métricas iniciales de usabilidad HCI...");
  await prisma.metricaUsabilidad.createMany({
    data: [
      { tipo: "TIEMPO_PUBLICACION", rol: "COMERCIANTE", valor: 12.4 },
      { tipo: "TIEMPO_PUBLICACION", rol: "COMERCIANTE", valor: 15.1 },
      { tipo: "TIEMPO_PUBLICACION", rol: "COMERCIANTE", valor: 13.8 },
      { tipo: "ENCUESTA_SUS", rol: "RECEPTOR", valor: 5, puntajeSecundario: 4 },
      { tipo: "ENCUESTA_SUS", rol: "COMERCIANTE", valor: 5, puntajeSecundario: 5 },
    ],
  });

  console.log("Seed completado con éxito.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
