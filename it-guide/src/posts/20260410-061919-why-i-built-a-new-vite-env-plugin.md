The four problems with plain Vite environment variables — and the plugin I wrote to fix them.

This is what environment variables look like in a Vite project:

```ts
import.meta.env.VITE_PORT     // "5173" — string, not number
import.meta.env.VITE_DARK     // "true" — string, not boolean
import.meta.env.VITE_API_URL  // string | undefined — no validation
```

Every value is a raw string. There's no validation, no server/client
boundary, no leak detection. The only way to get types is a
`vite-env.d.ts` you write and maintain by hand.

Four problems. I built a plugin that fixes all of them.

## Problem 1: Everything is a string

You coerce values yourself. A forgotten `Number()` or a
`=== true` on a string is a quiet bug that passes every check until
it doesn't.

## Problem 2: No server/client boundary

Variables prefixed with `VITE_` go to the client. Everything else
stays server-side. That's the convention. There's no enforcement,
no explicit split, no warning if you cross the line.

```ts
// shared/config.ts — imported in both server and client code
export const db = process.env.DATABASE_URL // silently bundled
```

If server and client code share a module, secrets travel with it.

## Problem 3: No leak detection

Even careful code can leak. Bundlers inline values. After
tree-shaking and minification, the literal string value of a server
secret can appear inside a client chunk — no import reference, just
the raw value embedded in compiled output. Nothing checks for this.

## Problem 4: Manual type maintenance

```ts
// vite-env.d.ts — written and updated by hand
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_PORT: string
  // someone added VITE_FEATURE_FLAG last week and forgot this file
}
```

These drift. The variable is in `.env`. TypeScript doesn't complain.
The mismatch goes unnoticed.

## What already exists

Two tools address parts of this.

**[@julr/vite-plugin-validate-env](https://github.com/Julien-R44/vite-plugin-validate-env)**
validates env at build time and injects values into `import.meta.env`.
Supports Standard Schema (Zod, Valibot, ArkType) and a lightweight
built-in validator. Zero runtime overhead. It does exactly what it
promises — validation. It doesn't split server/client variables,
doesn't provide virtual modules, and doesn't detect leaks.

**[@t3-oss/env-core](https://github.com/t3-oss/t3-env)** validates
at import time and provides runtime server/client protection via a
Proxy. Platform presets for Vercel, Railway, Netlify, and others.
The `extends` system works well for monorepos. The trade-offs:
`runtimeEnv` requires listing every variable twice, there's no
build-time leak detection, and it's framework-agnostic — it can't
hook into Vite's build pipeline.

Both are good tools. Neither solves all four problems for Vite.

## One file, everything derived

[`@vite-env/core`](https://github.com/pyyupsk/vite-env). One
`env.ts` file. The plugin handles validation, virtual modules, type
generation, and leak detection from it.

```ts
// env.ts
import { defineEnv } from '@vite-env/core'
import { z } from 'zod'

export default defineEnv({
  server: {
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string().min(32),
    DB_POOL_SIZE: z.coerce.number().int().default(10),
  },
  client: {
    VITE_API_URL: z.url(),
    VITE_APP_NAME: z.string().min(1),
    VITE_DEBUG: z.stringbool().default(false),
    VITE_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  },
})
```

```ts
// vite.config.ts
import ViteEnv from '@vite-env/core/plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [ViteEnv()],
})
```

That's the entire setup.

**Validation** runs at build start. Missing or malformed variables
fail immediately with a list of every problem at once. During dev,
`.env` changes revalidate — terminal warning, no crash.

**Virtual modules** enforce the split:

```ts
// Client code
import { env } from 'virtual:env/client'
env.VITE_API_URL   // string
env.VITE_DEBUG     // boolean — coerced, not "true"
env.DATABASE_URL   // TypeScript error — doesn't exist here

// Server/SSR code
import { env } from 'virtual:env/server'
env.DATABASE_URL   // string
env.JWT_SECRET     // string
env.VITE_API_URL   // also available
```

**Leak detection** scans every client chunk at `generateBundle` for
the literal string values of server variables. If `DATABASE_URL`'s
value appears anywhere in the browser bundle, the build fails with
the chunk name.

**Type generation** writes `vite-env.d.ts` on every build start.
Add a variable to `env.ts`, the declaration file updates. Nothing
to maintain by hand.

**Runtime access protection** uses Vite 8's Environment API. If
client code imports `virtual:env/server`, the plugin intercepts it
during the build. Three modes: `'error'` (hard fail), `'warn'`
(default — logs and exits with code 1), `'stub'` (returns a module
that throws at access time, useful for isomorphic framework files).
The default changes to `'error'` in 1.0.0 — set it explicitly now
if you're already using the plugin.

## Standard Schema

If you prefer Valibot, ArkType, or any other Standard Schema
validator:

```ts
import { defineStandardEnv } from '@vite-env/core'
import * as v from 'valibot'

export default defineStandardEnv({
  server: {
    DATABASE_URL: v.pipe(v.string(), v.url()),
  },
  client: {
    VITE_API_URL: v.pipe(v.string(), v.url()),
    VITE_APP_NAME: v.pipe(v.string(), v.minLength(1)),
  },
})
```

Same plugin, same virtual modules, same leak detection. The generated
`.d.ts` types are less specific than with Zod — Standard Schema
doesn't expose the same type introspection — but everything else
works identically.

## Platform presets

```ts
import { defineEnv } from '@vite-env/core'
import { vercel } from '@vite-env/core/presets'
import { z } from 'zod'

export default defineEnv({
  presets: [vercel],
  server: {
    DATABASE_URL: z.url(),
  },
  client: {
    VITE_API_URL: z.url(),
  },
})
```

Available: `vercel`, `railway`, `netlify`. Your definitions take
precedence over preset values.

## What I chose not to do

**No runtime Proxy.** t3-env throws at runtime when you access a
server variable from the client. I chose build-time enforcement
instead. Virtual modules and TypeScript catch it before the code
runs. If you bypass TypeScript deliberately, there's no runtime
throw — that's the trade-off, and I think it's the right one for
a build tool.

**No `runtimeEnv` mapping.** t3-env needs this because Next.js
tree-shakes `process.env` access and requires explicit references
to include variables in the bundle. Vite doesn't have this problem.
The plugin calls `loadEnv()` directly and serves everything through
virtual modules. You define a variable once.

**No framework adapters.** This is Vite-specific. It uses
`configResolved`, `buildStart`, `resolveId`, `load`,
`generateBundle`, `configureServer`, and Vite 8's Environment API.
If you're on Next.js or Nuxt without Vite, t3-env is the right
tool.

## The CLI

```bash
# Validate without starting the dev server
npx vite-env check

# Generate .env.example from your schema
npx vite-env generate

# Regenerate vite-env.d.ts manually
npx vite-env types
```

`vite-env generate` is the most useful one onboarding-wise. Run it
once and new developers get a documented `.env.example` with types,
defaults, and required markers — all from the same schema.

## Where to find it

- GitHub: [pyyupsk/vite-env](https://github.com/pyyupsk/vite-env)
- Docs: [pyyupsk.github.io/vite-env](https://pyyupsk.github.io/vite-env/)

```bash
pnpm add @vite-env/core zod
```

If something doesn't work or the docs are unclear, open an issue.


---
원문: [https://dev.to/pyyupsk/why-i-built-a-new-vite-env-plugin-3c8f](https://dev.to/pyyupsk/why-i-built-a-new-vite-env-plugin-3c8f)
수집일: 2026-04-10 06:19:19
