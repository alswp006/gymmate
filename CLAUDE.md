# CLAUDE.md — Project Rules

## CRITICAL: STANDALONE Next.js app
- INDEPENDENT app, NOT monorepo. Only import from node_modules or src/
- No @ai-factory/*, drizzle-orm, @libsql/client. Check package.json first
- DB: use better-sqlite3, localStorage, or in-memory for MVP
- better-sqlite3 is a native module — NEVER change its version in package.json
- If you add new native modules (sharp, bcrypt, etc.), list them in dependencies so the pipeline can rebuild them
- ALWAYS check existing code before creating new files — avoid duplicates

## CRITICAL: Edge Runtime Restrictions
- middleware.ts runs in Edge Runtime — it CANNOT import anything that uses Node.js modules (fs, path, crypto, better-sqlite3, bcryptjs)
- middleware.ts should ONLY check cookies via request.cookies.get() — NEVER import from lib/auth.ts or lib/db.ts
- API routes and Server Components run in Node.js runtime — they CAN import anything
- If you need auth checks in middleware, use ONLY cookie-based checks, never DB queries

## CRITICAL: Next.js 15 Breaking Changes
- Route params are now async: `{ params }: { params: Promise<{ id: string }> }` then `const { id } = await params;`
- searchParams are also async: `{ searchParams }: { searchParams: Promise<{ q?: string }> }`
- NEVER use `params.id` directly — always await first
- Server Actions must be in files with "use server" or inline with "use server" directive

## CRITICAL: Client vs Server Components
- Hooks (useState, useEffect, useRef) require "use client" at the TOP of the file
- Event handlers (onClick, onChange, onSubmit) require "use client"
- Server Components CANNOT use hooks or event handlers
- When in doubt, add "use client" — it's safer than missing it

## Commands
- pnpm install --ignore-workspace / build / typecheck / test / dev
- IMPORTANT: Always use --ignore-workspace with pnpm to avoid monorepo interference
- Build: npx next build --experimental-app-only (verify it passes before finishing)
- IMPORTANT: Always use --experimental-app-only with next build to avoid Turbopack Pages Router errors in Next.js 15.5+
- Typecheck: npx tsc --noEmit (fix ALL errors before finishing)

## Testing
- Write tests in src/__tests__/packet-{id}.test.ts alongside your implementation
- Use vitest: import {describe,it,expect,beforeEach,afterEach} from "vitest"
- Use @/ alias for imports (vitest resolves @/ → src/)
- Run pnpm test + pnpm typecheck before finishing

### Test Best Practices (CRITICAL — follow these to avoid failures)
- DB cleanup: In afterEach/beforeEach, delete child tables BEFORE parent tables (foreign key order)
  Example: db.prepare("DELETE FROM posts").run(); THEN db.prepare("DELETE FROM categories").run();
- Test isolation: Each test must create its own test data — never depend on data from other tests
- Test isolation: Use user-scoped cleanup (WHERE userId = ?) instead of global DELETE FROM — tests run in PARALLEL so global deletes destroy other test files' data
- Test isolation: Each test within a describe block must set up its own data — never assume data from a prior test still exists
- Unique data: Use UNIQUE emails per test FILE (e.g., `test-p0001-${Date.now()}@example.com`) to avoid UNIQUE constraint violations across parallel test files
- Never use hardcoded IDs (e.g., "test-category-1") in raw SQL — always use actual IDs returned from create functions
- better-sqlite3: All DB calls are SYNCHRONOUS — use db.prepare().run(), NOT await db.prepare().run()
- Timestamps: Never rely on insertion order for "latest" queries — add `rowid DESC` as tiebreaker in ORDER BY clauses (e.g., ORDER BY createdAt DESC, rowid DESC)
- API route tests: Use new Request() with proper headers, test both success and error cases
- Auth in tests: Use createSessionToken(userId) from @/lib/auth — set it as cookie header in Request

## CRITICAL: Auth Cookie Pattern
- Cookie name is "session_token" — this is set by createSession() in src/lib/auth.ts
- Middleware checks cookies via request.cookies.get("session_token") — MUST match
- Signup returns status 201, Login returns status 200
- If template auth already exists (src/lib/auth.ts), use createSession()/destroySession() — do NOT reimplement
- For NEW API routes that need auth, read cookie from request headers:
  ```
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/session_token=([^;]+)/);
  const token = match?.[1] ?? null;
  // Then validate: import { getSessionUserId } from "@/lib/auth"
  const userId = token ? getSessionUserId(token) : null;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  ```
- NEVER change the cookie name — middleware.ts, auth.ts, and all API routes must agree on "session_token"
- For tests: use createSessionToken(userId) from @/lib/auth to create test sessions without cookies() API

## Code Style
- TypeScript strict, Next.js 15 App Router, all files in src/
- Tailwind CSS only (no inline styles), no .eslintrc files
- All imports must resolve — verify with pnpm typecheck

## Code Quality (CRITICAL — your code will be reviewed by AI)
- Single Responsibility: Each file/component should do ONE thing. If a component exceeds ~150 lines, extract sub-components.
- DRY: Before creating new helpers, check existing code in src/lib/ and src/components/. Import and reuse.
- Error Handling: Every fetch/API call must have try/catch. Show loading states (skeleton/spinner) during async ops. Show user-friendly error messages with retry option.
- TypeScript: Use explicit return types for exported functions. NEVER use `any` — use `unknown` and narrow with type guards.
- Naming: Descriptive names (getUserById not getData). Constants in UPPER_SNAKE_CASE. Components in PascalCase.
- No Magic Numbers: Extract into named constants (MAX_ITEMS = 10, DEBOUNCE_MS = 300).
- Accessibility: aria-label on icon-only buttons. Semantic HTML (nav, main, section, article). Link form labels to inputs.
- Performance: Avoid unnecessary re-renders (useCallback/useMemo where appropriate). Use dynamic imports for heavy components. Lazy-load images below fold.
- Pattern Consistency: Match existing codebase patterns. Don't introduce new patterns when existing ones work.

## Common Build Error Prevention
- Every 'use client' component that imports a Server Component will fail — restructure
- Dynamic imports with `import()` in client components must use next/dynamic
- Image component: use next/image with width+height or fill prop
- Link component: import from next/link, no nested <a> tags
- Forms: use native form + server action, or "use client" + fetch
- JSON imports: add "resolveJsonModule": true in tsconfig if needed
- Missing types: check @types/ packages are in devDependencies

## Design System — shadcn/ui + "Linear meets Notion" aesthetic
Read `.claude/skills/frontend-design/SKILL.md` for full aesthetic direction.

### Component Library (ALWAYS use — never raw HTML buttons/inputs/cards)
```tsx
import { Button } from "@/components/ui/button"    // variant: default|outline|ghost|secondary|destructive
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"       // variant: default|secondary|destructive|success|warning|outline
import { cn } from "@/lib/utils"                    // Class merging: cn("base", conditional && "extra")
```
- Button asChild pattern for links: `<Button asChild><Link href="/x" className="no-underline">Go</Link></Button>`
- Ghost nav links: `<Button variant="ghost" size="sm" asChild>`

### Layout Rules
- Page wrapper: NO max-width (full-bleed backgrounds)
- Each section: `<section className="w-full py-20"><div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">{content}</div></section>`
- Hero: min-h-[70vh] flex items-center, gradient bg spans full width
- ALL sections same max-w on wrapper; constrain inner content separately
- Responsive: grid-cols-1 md:grid-cols-2 lg:grid-cols-3, flex-col md:flex-row

### CRITICAL: CSS Specificity (Tailwind v4) — DO NOT VIOLATE
- `@import "tailwindcss"` puts utilities in `@layer utilities`
- Any CSS OUTSIDE `@layer` has HIGHER specificity → silently overrides ALL Tailwind utilities (pt-16, px-4, gap-6, mb-4, text-white, etc.)
- This means `* { padding: 0 }` outside @layer will BREAK EVERY LAYOUT IN THE APP
- ALWAYS wrap base/reset/element styles in `@layer base { }`
- ALWAYS wrap custom utility classes in `@layer components { }`
- ONLY `:root` (CSS variable declarations) and scrollbar pseudo-elements may be outside @layer
- If you edit globals.css: VERIFY every non-:root rule is inside an @layer block

### Colors (CSS vars ONLY — never hardcode hex)
- bg: var(--bg), var(--bg-elevated), var(--bg-card), var(--bg-input)
- text: var(--text), var(--text-secondary), var(--text-muted)
- accent: var(--accent), var(--accent-soft)
- border: var(--border), var(--border-hover)
- semantic: var(--success-soft), var(--danger-soft), var(--warning-soft)

### Anti-patterns
- Cramped layouts — generous whitespace, never tight micro-spacing
- Flat hierarchy — vary size, weight, and color
- Unstyled elements — every button/link needs rounded corners + hover state + transition
- Narrow trapped content — full-bleed sections with constrained inner content
- Raw HTML for buttons/inputs/cards — ALWAYS use shadcn components from @/components/ui/

## Navigation
- Every page reachable from header nav. Login<->Signup cross-linked.
- Layout at src/app/layout.tsx — UPDATE it, don't recreate.
- Nav component at src/components/ui/nav.tsx — add links for new pages here.

## Final Checklist (run before finishing)
1. pnpm typecheck — zero errors
2. pnpm test — all tests pass
3. npx next build — builds successfully
4. No "use client" missing warnings
5. No unresolved imports

## Preserved Template Rules


## Pre-built Auth (DO NOT RECREATE)
- Login screen at app/login.tsx — email + password form
- Auth store handles: login, signup, logout, token persistence
- API client auto-attaches auth token to requests
- For protected screens: check auth.isAuthenticated in component

## Navigation (already configured)
- Tab layout at app/(tabs)/_layout.tsx
- Stack navigation at app/_layout.tsx
- Add new tabs: create file in app/(tabs)/ + add to tab config
- Modal screens: create in app/(modal)/

