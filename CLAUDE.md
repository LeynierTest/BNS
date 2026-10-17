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
- Lint: `oxlint` (plugins `react`, `typescript`, `oxc`)

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
npx prisma generate         # genera el cliente tipado (requiere red hacia
                             # binaries.prisma.sh; si falla por red, los
                             # errores de tipo de PrismaService son falsos
                             # positivos, no bugs reales)
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
cd backend && npm run lint && npm run test && npm run test:e2e
cd frontend && npm run lint && npm run build   # tsc -b && vite build
```

Notas de arranque:
- El backend **no arranca** si faltan las variables `SMTP_*` en `backend/.env`,
  aunque sean valores de ejemplo — deben estar presentes siempre.
- Las dos terminales (backend y frontend) deben quedar corriendo en paralelo;
  no son pasos secuenciales que terminan.
- La subida de foto de perfil se guarda en `backend/uploads/` (se crea sola,
  ya está en `.gitignore`).
- **Nunca** escribir valores reales de `DATABASE_URL`, `JWT_SECRET`, `SMTP_*`,
  el hash del admin o cualquier credencial en este archivo, en commits, o en
  cualquier archivo trackeado por git — solo en `.env` local (ya gitignoreado
  en ambos paquetes). Esto no es una restricción de estilo: es lo que permite
  que este archivo viva en el repo público sin exponer nada.

## Estado conocido / cosas a verificar antes de "arreglar" nada

- **El Prisma Client requiere generación local** (`npx prisma generate`) antes
  de que `tsc` compile sin errores. En entornos sin acceso a
  `binaries.prisma.sh` (como este sandbox), `tsc --noEmit` reporta decenas de
  falsos positivos (`Property 'team' does not exist on type 'PrismaService'`,
  `Module has no exported member 'Prisma'`, etc.). **No son bugs reales** —
  antes de tocar algo que parezca un error de tipos en servicios de Prisma,
  correr `npx prisma generate` y volver a chequear.
- El frontend sí compila y tipa limpio (`tsc -b` sin errores).
- `oxlint` en frontend reporta el mismo warning repetido en ~11 páginas/forms
  (`react/set-state-in-effect`: se llama `setState` de forma síncrona dentro
  de un `useEffect`). Es un patrón repetido, no un caso aislado — si se
  corrige, conviene resolverlo de forma consistente en todos los archivos
  afectados (`PhasesPage`, `MatchForm`, `CoachesPage`, `StadiumsPage`,
  `DashboardPage`, `CoachForm`, `StadiumForm`, `TeamsPage`, `PhaseForm`,
  `PlayersPage`, `UsersPage`, `MatchesPage`), siguiendo el mismo criterio en
  todos (derivar el valor en el render o mover la actualización al evento que
  la origina, según corresponda a cada caso).
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
