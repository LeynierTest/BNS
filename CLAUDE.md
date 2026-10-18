# BNS — Baseball Nacional Series Manager

Sistema de gestión de la Serie Nacional de Béisbol (proyecto académico, INDER).
Monorepo con dos paquetes independientes: `backend/` y `frontend/`. Ver el
enunciado completo del proyecto en `README.md` — es la fuente de verdad para
reglas de negocio (fases, reportes, validaciones de fechas, etc.).

## Rol y metodología de trabajo

Actúa como arquitecto de software sénior — ingeniería de requisitos,
algoritmos, estructuras de datos, bases de datos, seguridad y desarrollo web —
con el objetivo de mantener BNS como un sistema **robusto, mantenible,
verificable y escalable**. Esto aplica a cualquier tarea sobre este repo, no
solo a features nuevas.

**Antes de escribir código**
- Analiza requisitos funcionales y no funcionales contra el enunciado en
  `README.md` y las reglas de negocio ya documentadas en este archivo (rangos
  de fecha por fase, 8/4/2 equipos activos, roles 1/Administrador y
  2/Usuario, etc.). No inventes requisitos que el enunciado no pida.
- Identifica actores, restricciones y casos excepcionales (datos vacíos,
  duplicados, inconsistentes, concurrencia, fallos de conexión a la BD).
- Para lógica no trivial (cálculo de promedios, selección del equipo
  todos-estrellas, porcentaje de audiencia, validación de rango de fechas por
  fase), especifica el algoritmo en pseudocódigo antes de implementarlo:
  entradas, salidas, precondiciones, postcondiciones e invariantes.
- Antes de modificar código existente, inspecciona el módulo afectado y sus
  consumidores (controller → service → DTO, y el consumo desde
  `frontend/src/api/`) para evaluar el impacto y evitar regresiones.

**Al implementar**
- Respeta la arquitectura por capas y el patrón de módulo ya descritos en
  este archivo — no la rediseñes sin justificación explícita.
- Validación en **ambas puntas**: DTOs con `class-validator` en el backend,
  validación de formulario en el frontend antes de llamar a la API. Ninguna
  de las dos reemplaza a la otra.
- Integridad de datos a nivel de base: restricciones, relaciones, integridad
  referencial y transacciones (`$transaction`) donde una operación afecte más
  de una tabla — no dejar estados parciales ante un error a mitad de camino.
- Seguridad: autenticación JWT + autorización por rol ya existentes
  (`JwtAuthGuard`, `RolesGuard`, `@Roles()`) se mantienen en todo endpoint
  nuevo salvo que se marque `@Public()` explícitamente y con razón. Usar
  siempre Prisma parametrizado (nunca interpolar strings en `$queryRaw`),
  sanitizar cualquier output que se renderice como HTML, y validar origen en
  mutaciones (protección CSRF/XSS aplicable al flujo cookie+JWT actual).
- Aplica SOLID, bajo acoplamiento y alta cohesión **solo cuando aporten
  valor real** a este proyecto — no por dogma ni para añadir abstracciones
  que nadie va a reutilizar.
- Convenciones de nombres, manejo de excepciones (`NotFoundException`,
  `BadRequestException`, etc.) y configuración por variables de entorno ya
  establecidas en este archivo son de cumplimiento obligatorio.
- Trabaja con ramas: no commitear directo sobre `main`. Una rama por
  tarea/módulo, con commits pequeños y descriptivos.

**Pruebas y verificación**
- Toda funcionalidad nueva o corregida lleva prueba: unitaria (service),
  de integración/e2e donde cruce capas, y casos límite (entradas inválidas,
  fechas fuera de rango de fase, equipos ya eliminados, conexión caída).
- Antes de dar algo por terminado: verifica que compila (`tsc`), que pasa
  lint (`oxlint`), que las migraciones de Prisma corren limpias, y que el
  comportamiento real coincide con lo especificado — no asumas que algo
  funciona porque "debería".
- Si Prisma Client no está generado en el entorno (ver sección de estado
  conocido más abajo), acláralo explícitamente en vez de reportar un falso
  error de tipos como si fuera un bug del código.

**Si algo falla**
- Identifica la causa raíz antes de parchear el síntoma. Corrige, vuelve a
  correr las pruebas afectadas, y documenta qué cambió y por qué.
- No prometas ausencia absoluta de errores — demuestra la calidad con
  validaciones, pruebas automatizadas y evidencia verificable (output real
  de comandos, no suposiciones).

**Comunicación**
- Trabaja de forma incremental: analiza → diseña → implementa → prueba →
  documenta cada módulo antes de pasar al siguiente, en vez de tocar todo el
  sistema a la vez.
- Explica decisiones técnicas no triviales y el porqué detrás de cada una,
  de modo que el sistema no solo funcione sino que se pueda entender,
  mantener y ampliar.
- Mantén este `CLAUDE.md` y la documentación técnica actualizados cuando una
  decisión de arquitectura cambie.

## Stack

**Requisito**: Node.js `>=20.19` (recomendado 22 o 24 LTS). Con Node 18 fallan
vite, oxlint, rolldown y Prisma 7.

**Backend** (`backend/`)
- NestJS 12 + TypeScript (strict)
- Prisma 7 (`@prisma/adapter-pg`) sobre PostgreSQL — **sin** `@prisma/client`
  clásico generado por engine binario; usa el adapter driver
- Auth: JWT (`@nestjs/jwt`) + guards (`JwtAuthGuard`, `RolesGuard`) + decorators
  (`@Public()`, `@Roles()`)
- Validación: `class-validator` + `class-transformer` sobre DTOs
- Extras: `pdfkit` (reportes PDF), `nodemailer` (envío de reportes por email),
  `sharp` (procesamiento de imágenes para fotos de usuario)
- Lint: `oxlint --type-aware` · Formato: `prettier` (single quotes, trailing
  commas) · Tests: `jest` (unit + e2e)

**Frontend** (`frontend/`)
- React 19 + TypeScript + Vite
- Routing: `react-router-dom` v7, rutas protegidas por rol
  (`protected-route.tsx`, `role-protected-route.tsx`)
- HTTP: `axios` (`src/api/client.ts` centraliza el cliente)
- i18n: `i18next` / `react-i18next` (`src/i18n/`)
- Estilos: CSS plano por componente (`Component.tsx` + `Component.css`
  co-ubicados), tokens globales en `src/styles/tokens.css`
- Lint: `oxlint` (plugins `react`, `typescript`, `oxc`) · Tests: Vitest 4.1
  + happy-dom + Testing Library (`npm test`, archivos `src/**/*.test.ts(x)`;
  `src/test/render-as.tsx` monta un componente con sesión de Administrator o
  User). Vitest 5 exigiría Node 22: no subirlo sin subir el mínimo de Node.

## Arquitectura backend — patrón obligatorio por módulo

Cada entidad de negocio (`teams`, `players`, `coaches`, `matches`, `stadiums`,
`phases`, `users`, ...) sigue esta estructura fija bajo `backend/src/<entidad>/`:

```
<entidad>/
  <entidad>.module.ts      # registra controller + providers, importa PrismaModule
  <entidad>.controller.ts  # rutas HTTP, guards/decorators, delega todo al service
  <entidad>.service.ts     # lógica de negocio + acceso a datos vía PrismaService
  <entidad>-events.service.ts   # (si existe) lógica de eventos/side-effects separada del CRUD
  dto/
    create-<entidad>.dto.ts
    update-<entidad>.dto.ts
```

Reglas al tocar o crear un módulo:
- **No mezclar capas**: el controller nunca llama a Prisma directamente; solo
  el service. El controller no contiene lógica de negocio ni validación más
  allá de los decorators/guards.
- **DTOs tipados con `class-validator`** para todo input — nunca `any` en el
  body de un endpoint.
- Acceso a datos centralizado en `PrismaService` (`backend/src/prisma/`),
  inyectado por constructor, nunca instanciado manualmente.
- Reportes derivados (`matches-by-date`, `matches-by-teams`,
  `stadium-attendance`, `standings`, `top-coaches`, `team-status`,
  `all-star-team`) son módulos de **solo lectura**: no exponen create/update,
  solo construyen las consultas (`$queryRaw` o builder) descritas en el
  enunciado del README.
- Nombres de módulos, archivos y rutas en kebab-case; nombres de modelos
  Prisma y columnas en snake_case (así está el schema: `app_user`,
  `team_member_id`, etc.) — no renombrar a camelCase sin actualizar el schema
  y las migraciones.

Piezas transversales (no repetir su lógica en cada módulo):
- `src/app.setup.ts` (`configureApp`): cookies, estáticos, CORS y
  `ValidationPipe` global. Lo usan `main.ts` **y** las pruebas e2e; cualquier
  pipe, filtro o middleware global va aquí para que los tests lo ejerciten.
- `src/common/`: `@IsDateOnly()` para fechas en DTOs y `ParseDateOnlyPipe`
  para fechas en rutas/query. Toda fecha de negocio viaja como `YYYY-MM-DD`
  (nunca `@IsDateString`, que acepta horas y fechas imposibles).
- Query params: numéricos con `ParseIntPipe({ optional: true })`; booleanos u
  otros casos con un DTO de query (el `ValidationPipe` global con
  `transform: true` convierte los primitivos *antes* que las pipes de
  parámetro, p. ej. cualquier texto distinto de `'true'` → `false`).
- Errores de base de datos: `PrismaExceptionFilter` (global, en `PrismaModule`)
  traduce P2000/P2020 → 400, P2002/P2003 → 409, P2025 → 404 y las excepciones
  de triggers (`P0001`) → 400 con su mensaje. Es la red de seguridad para
  carreras y límites de tipo: los servicios siguen validando antes con
  mensajes propios.
- Seguridad: `OriginGuard` (primer `APP_GUARD`) exige que las mutaciones con
  cookie de sesión vengan de un origen de `FRONTEND_ORIGIN` (CSRF);
  `JwtAuthGuard` y `RolesGuard` son globales, así que todo endpoint exige
  sesión salvo `@Public()`.
- Límites de intentos (`common/rate-limit/fixed-window-limiter.ts`, en
  memoria; con varias instancias del backend haría falta un almacén
  compartido): el login se bloquea (429, incluso con la contraseña correcta)
  tras 5 fallos por usuario e IP o 30 por IP en 15 minutos; cada usuario
  puede pedir 5 reportes por correo cada 10 minutos.
- Reportes por correo: un User solo puede enviarlos a su propio correo (403
  si pide otro, y es el destino por defecto); un Administrator, a cualquiera.
- Invariante de usuarios: siempre debe quedar al menos un Administrator
  activo (`UsersService.assertKeepsAnActiveAdministrator`, con bloqueo de
  filas para operaciones concurrentes).
- Posiciones de peloteros: lista canónica en `players/player-positions.ts`,
  igual a la de `PlayerForm`; `isPitcherPosition` replica la regla del trigger
  `validate_player_stats`.
- **Estadísticas de lanzador** — decisiones del equipo (2026-10-18):
  - El lanzador registra entradas lanzadas, carreras permitidas (cuentan como
    carreras limpias), hits permitidos, bases por bolas, ponches, jonrones
    permitidos y pelotazos: obligatorios en lanzadores y prohibidos en el
    resto (DTO, `PlayersService` y trigger). No lleva promedio de bateo: su
    "promedio" es el ERA, que se calcula.
  - Entradas lanzadas en notación de béisbol (90.2 = 90 ⅔; solo .0, .1, .2):
    `players/innings-pitched.ts` (espejo en `frontend/src/types/player.ts`),
    CHECK `player_innings_pitched_notation_ck` (`NOT VALID`) y
    `innings_to_decimal()` en SQL.
  - `get_pitching_stats()` calcula ERA, WHIP, K/9, BB/9 y FIP (la constante
    del FIP sale de los totales de la liga). `get_all_star_team()` elige al
    lanzador por menor ERA (desempate: más entradas, luego nombre); las demás
    estadísticas son informativas. Sin entradas, o con una fila antigua en
    décimas, no hay estadísticas y el lanzador no compite. No hay mínimo de
    entradas: un lanzador con pocas entradas y ERA bajo puede ganar.
- Promedio de bateo: nunca se escribe. El trigger `compute_batting_average`
  lo calcula en cada alta o edición como `round(hits / at_bats, 3)` (vacío sin
  turnos al bate y en el lanzador); la API rechaza `batting_average` y exige
  hits <= at_bats (también CHECK `player_hits_le_at_bats_ck`, `NOT VALID`).
  `computeBattingAverage` (`frontend/src/types/player.ts`) es el espejo para
  la vista previa del formulario.
- **Regla 8/4/2 (equipos activos por fase)** — decisiones del equipo
  (2026-10-18):
  - Las fases son exactamente las del enunciado, una vez cada una y en orden
    cronológico: `phases/series-phases.ts` (`SERIES_PHASES`), espejo en
    `frontend/src/types/phase.ts`. En la base: `phase_name_uq` y
    `phase_name_ck` (`NOT VALID`: no rechaza filas antiguas, pero sí que se
    modifiquen sin pasar a un nombre válido).
  - Primera Ronda la juegan todos los equipos; Segunda Ronda, Play Off y
    Final, los 8, 4 y 2 con más puntos **de la fase anterior** (1 por
    victoria, sin contar desempates).
  - Empate en el corte: series de desempate de 3 partidos a ganar 2 entre
    los empatados (`match.tiebreaker`). Con más de dos empatados, el que
    pierde una serie queda fuera hasta que quedan tantos como plazas. La
    fase siguiente queda bloqueada mientras el corte no esté decidido. La
    tabla general (reporte 1) sí cuenta los desempates como victorias.
  - Los partidos de un equipo eliminado se rechazan (no solo se marcan).
  - Algoritmo puro y especificado en `qualification/series-qualification.ts`.
    Toda escritura que pueda alterarlo (partidos, fases, equipos) pasa por
    `QualificationService.runConsistentWrite`: transacción con
    `pg_advisory_xact_lock`, simula el cambio y lo rechaza (400) si deja
    inválido algún partido. Las violaciones previas a la regla (datos
    antiguos) no bloquean otros cambios. `GET /qualification` expone el
    estado por fase.

## Arquitectura frontend — patrón obligatorio por módulo

- `src/api/<entidad>.ts`: funciones tipadas que llaman al backend vía
  `client.ts` (axios). Un archivo por entidad, espejo de los módulos del
  backend.
- `src/types/<entidad>.ts`: interfaces que reflejan los DTOs/respuestas del
  backend.
- `src/pages/<Entidad>Page.tsx` + `.css`: una página por entidad, usa los
  componentes de `src/components/ui/` (`DataTable`, `Modal`, `ConfirmDialog`,
  formularios `*Form.tsx`, etc.) en vez de reinventar UI.
- `src/components/layout/`: shell de la app (sidebar, layout) — no duplicar
  navegación fuera de `sidebar-navigation.ts`.
- Protección de rutas: toda página que requiera sesión o rol específico se
  envuelve con `ProtectedRoute` / `RoleProtectedRoute`, nunca con checks ad
  hoc dentro del componente.
- Carga de datos en páginas: la petición vive **dentro** del `useEffect`, con
  un flag `ignore` en el cleanup para descartar respuestas obsoletas
  (recargas encadenadas, StrictMode, desmontaje). Las recargas (SSE, tras
  guardar/borrar) incrementan un contador `reloadCount` que es dependencia del
  effect; el reintento explícito pone `loading`/`error` en su propio handler.
  Nunca `setState` síncrono dentro de un effect (`react/set-state-in-effect`).
  Ver `PhasesPage.tsx` como referencia.
- Búsquedas: la página guarda los filtros aplicados en `appliedFilters`
  (null = lista completa), que también es dependencia del effect, así que
  toda recarga repite la misma consulta; `hasSearched` se deriva de ahí.
  Tras crear, editar o borrar se recarga (`reloadCount`) en vez de modificar
  la lista a mano, y "Limpiar filtros" vuelve a pedir la lista completa.
- Formularios: el estado se inicializa desde las props en `useState` y el
  padre pasa `key` por identidad de la entidad (p. ej.
  `key={editingPhase?.phase_id ?? 'create-phase-form'}`); no sincronizar
  props → estado con effects (borraban lo editado al re-renderizar el padre).
- Fechas `DATE` del backend: formatear cortando `YYYY-MM-DD` o con
  `timeZone: 'UTC'`; en hora local (America/Havana, UTC-4) salen un día antes.
- Regla 8/4/2 en la interfaz: `components/ui/match-form-rules.ts` replica la
  validación del backend para `MatchForm` (funciones puras que devuelven
  clave de traducción + valores); `PhaseQualificationPanel` (en
  `PhasesPage`) muestra el estado de `GET /qualification`.

## Arranque local completo

Asume que `backend/.env` y `frontend/.env` **ya existen y están poblados**
(variables reales, no los placeholders de `.env.example`). Si al ejecutar
cualquier comando de esta sección falta una variable o la conexión a
PostgreSQL falla, no hay que inventar valores ni pedirlos interactivamente:
avisar qué variable falta y detenerse ahí — el usuario la completa en su
`.env`, que nunca se versiona.

```bash
# ── Terminal 1: backend ──────────────────────────────────────
cd backend
npm install
npx prisma migrate deploy   # crea/actualiza las tablas contra DATABASE_URL
                             # (también siembra los roles 1 y 2)
npx prisma generate         # genera el cliente tipado en
                             # node_modules/@prisma/client (Prisma 7.10 no
                             # necesitó red para esto)
npm run start:dev           # queda sirviendo en http://localhost:3000

# ── Seed del primer usuario administrador (una sola vez) ────
# role_id = 1 → Administrador · role_id = 2 → Usuario
# No hay registro público; el primer admin se crea a mano:
node -e "console.log(require('bcrypt').hashSync('<password>', 10))"
psql "$DATABASE_URL" -c "INSERT INTO app_user (username, email, password_hash, active, role_id) VALUES ('<username>', '<email>', '<hash_generado_arriba>', true, 1);"

# ── Terminal 2: frontend ─────────────────────────────────────
cd frontend
npm install
npm run dev                 # queda sirviendo en http://localhost:5173

# ── Lint / tests (cualquier terminal) ────────────────────────
# Las e2e necesitan una base PROPIA (se vacía en cada ejecución); su nombre
# debe contener "test" o "e2e" o la suite se niega a correr:
createdb bns_test
cd backend && npm run lint && npm run test
TEST_DATABASE_URL="postgresql://<usuario>@localhost/bns_test" npm run test:e2e
cd frontend && npm run lint && npm test && npm run build   # tsc -b && vite build
```

CI: `.github/workflows/ci.yml` ejecuta lo mismo en cada push a `main` y en
cada pull request (Node 22, PostgreSQL 16 efímero, `npm ci`). Por eso los dos
`package-lock.json` están versionados: si se cambian dependencias, hay que
commitear el lockfile actualizado.

Notas de arranque:
- El backend **no arranca** si faltan las variables `SMTP_*` en `backend/.env`,
  aunque sean valores de ejemplo — deben estar presentes siempre.
- Las dos terminales (backend y frontend) deben quedar corriendo en paralelo;
  no son pasos secuenciales que terminan.
- La subida de foto de perfil se guarda en `backend/uploads/` (se crea sola,
  ya está en `.gitignore`).
- `FRONTEND_ORIGIN` (opcional, por defecto `http://localhost:5173`; admite
  varios separados por comas) define el origen permitido para CORS y para las
  mutaciones con cookie. Si el frontend se sirve en otra URL, hay que
  definirla o las mutaciones responderán 403.
- Si `backend/node_modules` quedó a medias (instalación interrumpida),
  `npm install` no lo repara: hay que reinstalar desde cero (`npm ci` con un
  lockfile sano, o apartar `node_modules` y reinstalar). Síntomas vistos:
  `Cannot find package .../pathe/index.js` en `prisma generate` y
  `Bus error (core dumped)` al lanzar jest (binario nativo truncado).
- Los tests de jest deben lanzarse con los scripts de npm (`npm run test`,
  `npm run test:e2e`): NestJS 12 es ESM y requiere
  `node --experimental-vm-modules`; `npx jest` a secas falla.
- **Nunca** escribir valores reales de `DATABASE_URL`, `JWT_SECRET`, `SMTP_*`,
  el hash del admin o cualquier credencial en este archivo, en commits, o en
  cualquier archivo trackeado por git — solo en `.env` local (ya gitignoreado
  en ambos paquetes). Esto no es una restricción de estilo: es lo que permite
  que este archivo viva en el repo público sin exponer nada.

## Estado conocido / cosas a verificar antes de "arreglar" nada

- **El Prisma Client requiere generación local** (`npx prisma generate`) antes
  de que `tsc` compile sin errores. Sin cliente generado, `tsc --noEmit`
  reporta decenas de falsos positivos (`Property 'team' does not exist on type
  'PrismaService'`, `Module has no exported member 'Prisma'`, etc.). **No son
  bugs reales** — antes de tocar algo que parezca un error de tipos en
  servicios de Prisma, correr `npx prisma generate` y volver a chequear.
- Estado verificado (2026-10-18): backend y frontend compilan con `tsc` y
  pasan `oxlint` sin warnings; backend con 117 pruebas unitarias y 107 e2e;
  frontend con 39 pruebas (Vitest).
  Los 12 `react/set-state-in-effect` del frontend están resueltos (ver el
  patrón de carga de datos en la sección de arquitectura frontend).
- Migración `00000000000000_baseline`: es un `pg_dump` 18 adaptado a mano para
  Prisma (sin `\restrict`, sin `SET transaction_timeout`, sin vaciar
  `search_path`, seed de roles con `OVERRIDING SYSTEM VALUE`). No regenerarlo
  sin repetir esos ajustes. En bases donde se marcó como aplicado con la
  versión antigua: `migrate deploy`/`status` funcionan igual; `migrate dev`
  pedirá reset salvo que se actualice el checksum
  (`UPDATE _prisma_migrations SET checksum = '<sha256 del archivo>' WHERE
  migration_name = '00000000000000_baseline';`). Si esa base se restauró con
  `psql` usando el archivo antiguo, los roles 1/2 no se sembraron: comprobarlo.
- Migración `20261018120000_add_phase_qualification`: falla en
  `phase_name_uq` si la base tiene dos fases con el mismo nombre (sin dejar
  nada aplicado). Corregir el dato y ejecutar `npx prisma migrate resolve
  --rolled-back 20261018120000_add_phase_qualification` y `npx prisma migrate
  deploy`. Las fases antiguas con un nombre libre siguen ahí, pero la regla
  8/4/2 las ignora y no se pueden editar sin renombrarlas a una de la lista.
- Migración `20261018180000_add_pitching_stats`: los lanzadores anteriores
  quedan con los cinco campos nuevos vacíos. Siguen compitiendo por ERA,
  pero para editarlos hay que completarlos. Si alguno usó décimas en las
  entradas (p. ej. 45.5), queda fuera de las estadísticas hasta corregirlo.
- Los comandos de Prisma (`migrate deploy/status/diff`) leen `backend/.env`
  a través de `prisma.config.ts`: para trabajar sobre una base de pruebas hay
  que fijar `DATABASE_URL` en el mismo comando, o se aplicarán en la base de
  desarrollo.
- `backend/.oxlintrc.json` tiene `typescript/no-floating-promises: error` —
  cualquier promesa sin `await`/`.catch()` debe tratarse como error de lint,
  no ignorarse.

## Reglas generales de calidad (aplican a ambos paquetes)

- Seguir siempre `prettier`/`oxlint` existentes — no introducir reglas ni
  estilos nuevos sin justificarlo.
- Validar inputs en la capa DTO (backend) o antes de llamar a la API
  (frontend), nunca confiar en que el dato ya viene limpio.
- Mantener el principio de un módulo = una responsabilidad: si una entidad
  necesita lógica de eventos o reportes derivados, va en su propio
  service/módulo (ver patrón `*-events.service.ts` y los módulos de reporte),
  no mezclado en el CRUD base.
- Los manejos de errores HTTP deben usar las excepciones de Nest
  (`NotFoundException`, `BadRequestException`, etc.), no lanzar errores
  genéricos ni devolver `null`/`undefined` silenciosamente.
- Las reglas de negocio del enunciado (rango de fechas de partido dentro de
  la fase, cantidad de equipos activos por fase: 8/4/2, cálculo de
  promedio/porcentaje en reportes) son invariantes del dominio — cualquier
  "arreglo" que las contradiga es un bug, no una mejora.
