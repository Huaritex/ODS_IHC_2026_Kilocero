# Kilo Cero — MVP HCI (UCB Santa Cruz)

Aplicación web responsive para conectar el excedente diario de alimentos de mercados de Santa Cruz de la Sierra (**Abasto, Mutualista y Los Pozos**) con comedores populares, hogares vulnerables y ONGs antes del cierre (17:00–19:00).

## Requisitos previos y puesta en marcha

1. **Variables de entorno**
   Copiá `.env.example` a `.env` (usa SQLite local en `prisma/dev.db`, sin servicios externos):
   ```bash
   cp .env.example .env
   ```
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   AUTH_SECRET="tu-secreto-largo"
   ```

2. **Instalar dependencias, sincronizar esquema y cargar datos de Santa Cruz**
   ```bash
   nvm use            # Node 24 (ver .nvmrc)
   npm install
   npx prisma generate
   npx prisma db push
   npm run db:seed
   npm run dev
   ```

3. **Cuentas de demostración (clave: `kilocero2026`)**
   - **Comerciante:** `carmen@abasto.bo` (Mercado Abasto) / `mateo@mutualista.bo` / `rosaura@lospozos.bo`
   - **Receptor verificado:** `comedor@cotoca.bo` / `hogar@teresa.bo`
   - **Receptor pendiente (para probar aprobación):** `ollacomun@plan3000.bo`
   - **Admin:** `admin@kilocero.bo`

## Decisiones de diseño y heurísticas de Nielsen por pantalla

- **Login / Registro (`/login`, `/registro`):** Separación clara de roles y botones de acceso demo para reducir fricción en pruebas de usabilidad (*Flexibilidad y eficiencia de uso*).
- **Comerciante — Mis avisos (`/comerciante`):** Barra inferior fija en la zona del pulgar (≥48x48 px), estado siempre visible con ícono+texto+borde (*Visibilidad del estado del sistema*) y cola local visible ("Pendiente de envío") cuando falla la red. Confirmación modal únicamente al cerrar una publicación de forma irreversible (*Prevención de errores*).
- **Comerciante — Publicar (`/comerciante/publicar`):** Optimizada para <20 segundos con una mano: selección visual por íconos grandes de categoría y cantidad aproximada ("Poco / Medio / Mucho", sin pedir peso exacto) + puesto prellenado (*Reconocimiento antes que recuerdo*).
- **Receptor — Explorar (`/receptor`):** Toggle Lista/Mapa (Leaflet + OpenStreetMap sin API keys) y filtros por categoría en la parte superior para decidir rápido según cercanía y horario (*Control y libertad del usuario*).
- **Receptor — Detalle y Reservas (`/receptor/publicaciones/[id]`, `/receptor/reservas`):** Flujo explícito `disponible → reservado → retirado → confirmado`, con doble confirmación de entrega y modal de confirmación solo al cancelar una reserva (*Prevención de errores*).
- **Admin (`/admin`, `/admin/receptores`, `/admin/publicaciones`, `/admin/locales`, `/admin/auditoria`):** Menú adaptable (barra superior en móvil, lateral en escritorio), tarjetas en móvil y tablas semánticas en pantallas grandes, skip-link, landmarks ARIA y navegación por teclado; métricas de impacto calculadas desde entregas confirmadas, aprobación de receptores por lote, suspensión de locales e historial de auditoría.

## CRUD y persistencia local

| Operación | Dónde |
|---|---|
| Crear | Publicar excedente, reservar, registro |
| Consultar | Mis avisos, Explorar (lista y mapa con filtros), Mis reservas, listados del admin |
| Editar | Editar aviso (alimento, cantidad, nota, foto, mercado, ubicación y hora de retiro); verificar, rechazar y suspender (admin) |
| Eliminar | Eliminar aviso; el admin elimina publicaciones y receptores (se protege el historial de entregas) |

La persistencia es **local con SQLite (Prisma)** en `prisma/dev.db`: sobrevive a recargas y reinicios, no requiere servicios externos y funciona como solución equivalente a JSON Server. El "servicio de datos" son las rutas `src/app/api`, que corren junto al frontend (`npm run dev`).

## Organización del código

- `src/app/(admin|comerciante|receptor|auth)`: páginas por rol (route groups).
- `src/components`: componentes reutilizables (`ui/`, `publicar/`, `comerciante/`, `receptor/`).
- `src/lib`: acceso a la API (`api-client`), utilidades (`formato`, `ventanas`, `lugar`, `explorar`), reglas de negocio (`admin-acciones`, `expiracion`, `privacidad`) y cola offline.
- `prisma/schema.prisma` y `prisma/seed.ts`: modelo de datos y datos de Santa Cruz.

## Verificación rápida (checklist)

```bash
npm run lint     # comprobación de tipos (tsc)
npm run build    # compilación de producción
```

## Notas de despliegue

Este MVP corre con SQLite local (`prisma/dev.db`) para demostración inmediata sin dependencias externas. Si más adelante querés subirlo a un entorno serverless como Vercel, solo cambiás `provider = "sqlite"` en `prisma/schema.prisma` por un Postgres administrado.
