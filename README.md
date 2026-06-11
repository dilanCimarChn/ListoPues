# Listo Pues

Plataforma SaaS boliviana para vender y agendar por WhatsApp.

- **Lite**: vitrina online + carrito + checkout por WhatsApp + bot de administracion por WhatsApp.
- **Pro**: todo lo de Lite + **LAIA**, asistente con IA (Claude) que atiende clientes 24/7, concreta ventas, agenda citas y cobra con Wallbit.

## Stack

| Capa | Tecnologia |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Base de datos | PostgreSQL (Supabase) + Prisma ORM |
| Auth | NextAuth.js v5 (credenciales) |
| Estilos | Tailwind CSS v4 |
| Estado del carrito | Zustand (persistido en localStorage) |
| Validacion | Zod |
| Pagos | Wallbit API |
| WhatsApp | Evolution API (instancias `lite` y `pro`) |
| IA (LAIA) | Claude API (`claude-sonnet-4-6`) |
| Imagenes | Vercel Blob |
| Deploy | Vercel |

> Nota Next.js 16: el archivo de middleware ahora se llama `src/proxy.ts` (export `proxy`), y `params` / `searchParams` / `cookies()` / `headers()` son asincronos.

## 1. Setup local paso a paso

```bash
# 1. Clona el repositorio e instala dependencias
git clone <tu-repo> && cd ListoPues
npm install

# 2. Copia las variables de entorno y completa los valores (ver seccion 2)
#    El archivo .env.local ya contiene todos los placeholders necesarios.

# 3. Genera el cliente de Prisma y crea las tablas en Supabase
npm run db:generate
npm run db:push

# 4. Levanta el servidor de desarrollo
npm run dev
```

Abre `http://localhost:3000`, crea tu cuenta en `/registro` y tu vitrina quedara disponible en `http://localhost:3000/[slug-de-tu-negocio]`.

Scripts utiles:

| Comando | Que hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de produccion |
| `npm run db:push` | Sincroniza el schema con la DB |
| `npm run db:studio` | Prisma Studio (explorador de datos) |
| `npm run db:migrate` | Crea una migracion |

## 2. Como obtener cada API key

### Supabase (DATABASE_URL y DIRECT_URL)

1. Crea un proyecto en [supabase.com](https://supabase.com) (region mas cercana, ej. Sao Paulo).
2. Ve a **Project Settings → Database → Connection string**.
3. Copia la URI en modo **Transaction pooler** para `DATABASE_URL` y la **Direct connection** para `DIRECT_URL`.
4. Reemplaza `[PASSWORD]` con la contrasena del proyecto y `[PROJECT-REF]` con la referencia del proyecto.

### NextAuth (NEXTAUTH_SECRET)

Genera un secret aleatorio de 32+ caracteres:

```bash
openssl rand -base64 32
# o en PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

En produccion cambia `NEXTAUTH_URL` por tu dominio (`https://listopues.com`).

### Vercel Blob (BLOB_READ_WRITE_TOKEN)

1. En tu proyecto de Vercel, abre la pestana **Storage → Create → Blob**.
2. Crea el store y copia el token `BLOB_READ_WRITE_TOKEN` que aparece en **.env.local** sugerido.
3. En local pegalo en tu `.env.local`; en Vercel queda vinculado automaticamente.

### Wallbit (WALLBIT_API_KEY y WALLBIT_WEBHOOK_SECRET)

1. Crea una cuenta de comercio en Wallbit y solicita acceso a la API.
2. En el panel de desarrollador genera tu `API Key` (`WALLBIT_API_KEY`).
3. Registra el webhook `https://tu-dominio.com/api/pagos/wallbit/webhook` y copia el secret de firma como `WALLBIT_WEBHOOK_SECRET`.

### Evolution API (EVOLUTION_API_URL y EVOLUTION_API_KEY)

Evolution API es un gateway open source de WhatsApp. Puedes auto-hospedarlo:

```bash
docker run -d --name evolution \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=tu-api-key-segura \
  atendai/evolution-api:latest
```

- `EVOLUTION_API_URL`: URL publica de tu instancia (ej. `https://evolution.tudominio.com`).
- `EVOLUTION_API_KEY`: el valor de `AUTHENTICATION_API_KEY` que definiste.

### Anthropic / Claude (ANTHROPIC_API_KEY)

1. Crea una cuenta en [console.anthropic.com](https://console.anthropic.com).
2. Ve a **API Keys → Create Key** y copia el valor en `ANTHROPIC_API_KEY`.
3. LAIA usa el modelo `claude-sonnet-4-6`; asegurate de tener creditos activos.

## 3. Configurar Evolution API (bot Lite y LAIA Pro)

Se usan **dos instancias** de WhatsApp: una para el bot del dueno (Lite) y otra para LAIA (Pro).

### Instancia Lite — bot del dueno

1. Crea la instancia:

```bash
curl -X POST "$EVOLUTION_API_URL/instance/create" \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "listopues-lite", "qrcode": true}'
```

2. Escanea el QR con el WhatsApp **de la plataforma** (numero del bot).
3. Configura el webhook hacia tu app:

```bash
curl -X POST "$EVOLUTION_API_URL/webhook/set/listopues-lite" \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://tu-dominio.com/api/whatsapp/webhook",
    "events": ["MESSAGES_UPSERT"]
  }'
```

4. El dueno del negocio escribe a ese numero desde el WhatsApp registrado en su cuenta. Comandos disponibles:

```
Agregar: Torta de chocolate | Precio: 150 | Stock: 5
Modificar A1B2C3: precio 120
Stock A1B2C3: 25
Eliminar A1B2C3
Agotar A1B2C3
Inventario
Cupos
```

El `[ID]` es el codigo corto que devuelve el comando `Inventario`.

### Instancia Pro — LAIA

1. Crea la instancia `listopues-pro` (mismo comando, cambiando el nombre).
2. Escanea el QR con el numero de WhatsApp **que atendera a los clientes** del negocio Pro.
3. Configura el webhook **incluyendo el slug del negocio**:

```bash
curl -X POST "$EVOLUTION_API_URL/webhook/set/listopues-pro" \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://tu-dominio.com/api/laia/webhook?negocio=mi-negocio",
    "events": ["MESSAGES_UPSERT"]
  }'
```

4. En el dashboard (`/dashboard/laia`) el dueno personaliza el prompt, el tono y las FAQs. El catalogo, precios y stock se inyectan automaticamente en cada conversacion.

Ambos webhooks validan el header `apikey` contra `EVOLUTION_API_KEY` antes de procesar.

## 4. Primer deploy a Vercel

1. Sube el repositorio a GitHub.
2. En [vercel.com](https://vercel.com) crea un **New Project** e importa el repo (framework: Next.js, sin configuracion extra).
3. En **Settings → Environment Variables** agrega todas las variables de `.env.local` (cambia `NEXTAUTH_URL` y `NEXT_PUBLIC_APP_URL` por tu dominio de Vercel).
4. Crea el Blob store en **Storage → Blob** para vincular `BLOB_READ_WRITE_TOKEN`.
5. Haz deploy. El `vercel.json` ya configura los timeouts de las funciones:
   - `/api/laia/webhook`: 30 s (llamadas a Claude)
   - `/api/whatsapp/webhook`: 15 s
6. Despues del primer deploy, ejecuta `npm run db:push` desde tu maquina (apuntando a Supabase) si aun no creaste las tablas.
7. Actualiza los webhooks de Evolution API y Wallbit con la URL definitiva.

## 5. Dominio propio para negocios Pro

Los negocios Pro pueden usar su dominio (ej. `dulcesmaria.com`) apuntando a su vitrina:

1. En Vercel, **Settings → Domains → Add** y agrega el dominio del cliente.
2. El cliente configura en su DNS:
   - Apex (`dulcesmaria.com`): registro `A` hacia `76.76.21.21`.
   - `www`: registro `CNAME` hacia `cname.vercel-dns.com`.
3. Guarda el dominio en el campo `domain` del negocio (tabla `Business`).
4. Crea una redireccion o rewrite en `next.config.ts` si quieres mapear el dominio directo al slug, por ejemplo respondiendo `/{slug}` cuando el host coincida con `Business.domain` (puede resolverse en `src/proxy.ts` leyendo el header `host` y reescribiendo a `/[slug]`).

## Estructura del proyecto

```
src/
├── app/
│   ├── (marketing)/          # Landing
│   ├── (auth)/               # Login y registro
│   ├── (dashboard)/dashboard # Panel del negocio (13 vistas)
│   ├── [slug]/               # Vitrina publica con SEO + JSON-LD
│   └── api/                  # REST + webhooks
├── components/
│   ├── ui/                   # Button, Card, Input, Badge, Modal, Table
│   ├── marketing/            # Hero, Pricing, Features, Navbar, Footer
│   ├── dashboard/            # Sidebar, Header, StatsCard, ProductForm...
│   └── storefront/           # ProductCard, Cart, CartDrawer, Checkout
├── lib/                      # db, auth, whatsapp, whatsapp-bot, ai-agent, wallbit
├── store/cart.ts             # Carrito Zustand persistido
├── types/                    # Tipos globales
└── proxy.ts                  # Proteccion de /dashboard (Next 16)
```

## Seguridad

- `/dashboard/*` exige sesion (proxy + verificacion en cada Server Component).
- Toda API valida que el recurso pertenezca al negocio del usuario autenticado.
- Los webhooks validan firma/secret: Evolution (`apikey`), Wallbit (HMAC SHA-256), calendario (`x-webhook-secret`).
- Los precios de las ventas siempre se leen de la base de datos, nunca del cliente.
