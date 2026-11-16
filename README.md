# Kilo Cero — MVP HCI (UCB Santa Cruz)

Aplicación web responsive para conectar el excedente diario de alimentos de mercados de Santa Cruz de la Sierra (**Abasto, Mutualista y Los Pozos**) con comedores populares, hogares vulnerables y ONGs antes del cierre (17:00–19:00).

## Sobre el proyecto

- **Materia:** Interacción Humano-Computador (IHC / ISW-231), Universidad Católica Boliviana (UCB), Santa Cruz de la Sierra, semestre 2-2026.
- **Problema:** parte de los alimentos que sobran al cierre de los mercados se desperdicia, mientras comedores y hogares vulnerables los necesitan. Se alinea con el **ODS 2 (Hambre cero)** y el **ODS 12 (Producción y consumo responsables)**.
- **Actores:** *comerciante* (publica el excedente), *receptor* (comedor/ONG verificado que reserva y retira) y *administrador* (verifica receptores, modera y audita).
- **Flujo principal:** el comerciante publica un aviso → el receptor lo explora (lista o mapa) y lo reserva → retiro en el puesto → doble confirmación de entrega → métricas de impacto.
- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 7 + SQLite (better-sqlite3) · Leaflet/OpenStreetMap · autenticación con JWT (`jose`) y `bcryptjs`.
- **Equipo:** Huaritex, Brandon Kevin y Ricky (ver historial de commits).

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
- **Comerciante — Mis avisos (`/comerciante`):** Acción principal "Publicar excedente" fija en la parte superior y con objetivo táctil grande (≥48x48 px), estado siempre visible con ícono+texto+borde (*Visibilidad del estado del sistema*) y cola local visible ("Pendiente de envío") cuando falla la red. Confirmación modal únicamente al cerrar una publicación de forma irreversible (*Prevención de errores*).
- **Comerciante — Publicar (`/comerciante/publicar`):** Optimizada para <20 segundos con una mano: selección visual por íconos grandes de categoría y cantidad aproximada ("Poco / Medio / Mucho", sin pedir peso exacto) + puesto prellenado (*Reconocimiento antes que recuerdo*).
- **Comerciante — Editar (`/comerciante/editar/[id]`):** Permite corregir un aviso mientras esté disponible (alimento, cantidad, nota, foto, mercado, ubicación y hora de retiro) sin tener que borrarlo (*Control y libertad del usuario*).
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

- `src/app/(admin|comerciante|receptor|auth)`: páginas por rol (route groups). Cada `page.tsx` solo maneja estado y compone componentes.
- `src/app/api`: rutas del "servicio de datos" (controladores finos: sesión, validación y despacho).
- `src/components`: UI reutilizable (`ui/`, `admin/`, `auth/`, `publicar/`, `comerciante/`, `receptor/`).
- `src/hooks`: hooks compartidos (`useCarga` para listados con estado de carga/error).
- `src/lib`: acceso a la API (`api-client`), reglas de negocio (`publicaciones-acciones`, `admin-acciones`, `expiracion`, `privacidad`, `rate-limit`, `fotos`), utilidades (`formato`, `ventanas`, `lugar`, `explorar`) y cola offline.
- `src/proxy.ts`: guardia de rutas por rol.
- `prisma/schema.prisma` y `prisma/seed.ts`: modelo de datos y datos de Santa Cruz.

## Seguridad y privacidad

- Sesión con cookie firmada (JWT) y contraseñas con hash `bcrypt`.
- Los receptores deben ser **verificados por el admin** antes de reservar; los locales pueden ser **suspendidos** (con motivo visible) y toda acción del admin queda en la **auditoría**.
- Límite de peticiones (`rate-limit`) y datos de contacto expuestos solo cuando corresponde (`privacidad`).
- Fotos de avisos validadas y comprimidas en el cliente antes de subirse.

## Verificación rápida (checklist)

```bash
npm run lint     # comprobación de tipos (tsc)
npm run build    # compilación de producción
```

## Notas de despliegue

Este MVP corre con SQLite local (`prisma/dev.db`) para demostración inmediata sin dependencias externas. Si más adelante querés subirlo a un entorno serverless como Vercel, solo cambiás `provider = "sqlite"` en `prisma/schema.prisma` por un Postgres administrado.
