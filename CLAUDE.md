# CLAUDE.md — Project Rules

## CRITICAL: STANDALONE React Native / Expo app
- INDEPENDENT app, NOT monorepo. Only import from node_modules or src/ (or app/)
- No @ai-factory/*, drizzle-orm, @libsql/client, better-sqlite3. Check package.json first
- Storage: use expo-secure-store (sensitive data) or AsyncStorage (non-sensitive). Never use better-sqlite3 (Node.js only) or localStorage (web only except Platform.OS === "web" fallback)
- ALWAYS check existing code before creating new files — avoid duplicates

## CRITICAL: Storage Pattern
- Auth tokens and sensitive data: use expo-secure-store via `@/lib/storage` wrapper (already exists)
- `@/lib/storage` handles Platform.OS === "web" fallback to localStorage automatically
- For structured local data: use expo-sqlite (if added) or in-memory/zustand store for MVP
- Never use Node.js fs, path, or better-sqlite3 in React Native code

## CRITICAL: expo-router Navigation
- File-based routing in app/ directory (expo-router v4)
- Screens: app/(tabs)/screen.tsx, app/(auth)/screen.tsx, etc.
- Navigation: use `import { router } from "expo-router"` — `router.push("/path")`, `router.replace("/path")`
- Protected routes: check auth in app/_layout.tsx and redirect with `router.replace()`
- Stack/Tab layouts defined in app/_layout.tsx and app/(tabs)/_layout.tsx
- Never use React Navigation directly — expo-router wraps it

## CRITICAL: React Native Patterns
- Use SafeAreaView from react-native-safe-area-context for screen wrappers
- Use FlatList/SectionList for long lists — never map() into ScrollView for large datasets
- Platform-specific code: use Platform.OS === "ios" / "android" / "web"
- Dimensions: use useWindowDimensions() hook, not fixed pixel values
- Keyboard: wrap forms in KeyboardAvoidingView with behavior="padding" (iOS) or "height" (Android)
- Touchables: use Pressable (preferred) or TouchableOpacity — never plain View with onPress

## Commands
- Install: `npm install`
- Dev server: `npm run dev` (expo start)
- Build: `npm run build` (expo export) or `npm run build:ios` / `npm run build:android` (EAS)
- Typecheck: `npm run typecheck` (npx tsc --noEmit) — fix ALL errors before finishing
- Test: `npm test` (vitest run)
- Native prebuild: `npx expo prebuild` (generates ios/ and android/ directories)

## Testing
- Write tests in src/__tests__/packet-{id}.test.ts alongside your implementation
- Use vitest: `import { describe, it, expect, beforeEach, afterEach } from "vitest"`
- Use @/ alias for imports (vitest resolves @/ → src/ via vitest.config.ts)
- Run `npm test` + `npm run typecheck` before finishing
- Note: This project uses vitest (not Jest) — configured in vitest.config.ts

### Test Best Practices (CRITICAL — follow these to avoid failures)
- Test isolation: Each test must create its own data — never depend on data from other tests
- Test isolation: Tests run in PARALLEL — use unique identifiers per test file (e.g., `test-p0001-${Date.now()}`)
- Unique data: Use unique IDs per test FILE to avoid constraint violations across parallel test files
- Never use hardcoded IDs in assertions — always use actual values returned from functions
- Async storage in tests: mock expo-secure-store or use in-memory mocks — native modules won't work in vitest
- Timestamps: Never rely on insertion order — use explicit sort keys with tiebreakers
- Pure logic tests: Prefer testing pure functions (validators, transformers, uuid) — avoid testing RN UI in vitest

## Auth Pattern
- Auth tokens stored via `@/lib/storage` (expo-secure-store on native, localStorage on web)
- Auth state managed by zustand store at `@/store/auth.ts`
- On app start, call `loadToken()` from `@/store/auth.ts` to restore session
- API calls attach token via `Authorization: Bearer <token>` header — see `@/lib/api.ts`
- For protected screens: check `useAuthStore().isAuthenticated` and redirect via expo-router
- If template auth already exists (`@/store/auth.ts`), use it — do NOT reimplement
- For protected screens: check auth in app/_layout.tsx with `router.replace("/(auth)/login")`

## Code Style
- TypeScript strict, React Native / Expo, all shared code in src/
- NativeWind for styling (className prop with Tailwind utilities) — no globals.css stylesheet rules
- All imports must resolve — verify with npm run typecheck

## Code Quality (CRITICAL — your code will be reviewed by AI)
- Single Responsibility: Each file/component should do ONE thing. If a component exceeds ~150 lines, extract sub-components.
- DRY: Before creating new helpers, check existing code in src/lib/ and src/components/. Import and reuse.
- Error Handling: Every fetch/API call must have try/catch. Show loading states (ActivityIndicator) during async ops. Show user-friendly error messages with retry option.
- TypeScript: Use explicit return types for exported functions. NEVER use `any` — use `unknown` and narrow with type guards.
- Naming: Descriptive names (getUserById not getData). Constants in UPPER_SNAKE_CASE. Components in PascalCase.
- No Magic Numbers: Extract into named constants (MAX_ITEMS = 10, DEBOUNCE_MS = 300).
- Accessibility: accessibilityLabel on icon-only Pressables. accessibilityRole on interactive elements.
- Performance: Avoid unnecessary re-renders (useCallback/useMemo where appropriate). Use FlatList for long lists. memo() for expensive components.
- Pattern Consistency: Match existing codebase patterns. Don't introduce new patterns when existing ones work.

## Common Build Error Prevention
- React Native does NOT support web HTML elements (div, span, p) — use View, Text, TouchableOpacity
- Images: use `<Image source={require('./asset.png')} />` or `{ uri: "..." }` — not next/image
- Fonts: load via expo-font or @expo-google-fonts — not CSS @font-face
- Icons: use lucide-react-native (already in package.json) — import named icons directly
- Env vars: use expo-constants (Constants.expoConfig.extra) — not process.env in RN code
- Missing types: check @types/ packages are in devDependencies

## Design System — NativeWind + "Linear meets Notion" aesthetic
Read `.claude/skills/frontend-design/SKILL.md` for full aesthetic direction.

### Component Library (ALWAYS use — never raw View/Text without styling)
```tsx
import { Button } from "@/components/ui/button"    // variant: default|secondary|ghost|destructive|outline
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"                    // Class merging: cn("base", conditional && "extra")
```
- Custom RN components live in src/components/ui/ — these use Pressable/View/Text, NOT web HTML
- Icons: `import { Dumbbell } from "lucide-react-native"` with size and color props

### Layout Rules (NativeWind)
- Screen wrapper: `<SafeAreaView className="flex-1 bg-bg">` then `<ScrollView className="flex-1">`
- Section padding: `className="px-4 py-6"` or `className="px-6 py-8"`
- Full-width items: `className="w-full"` — React Native is flex column by default
- Responsive: use `useWindowDimensions()` for breakpoint logic; or `flex-row` + `flex-1` for proportional splits

### NativeWind Styling Rules
- Use className prop with Tailwind utilities via nativewind
- No globals.css stylesheet overrides — styles come from className or StyleSheet.create()
- Theme tokens set in tailwind.config.js under `theme.extend.colors`
- For dynamic styles use cn() from @/lib/utils

### Colors (Tailwind config tokens — never hardcode hex)
- bg: bg-bg, bg-bg-elevated, bg-bg-card, bg-bg-input
- text: text-text, text-text-secondary, text-text-muted
- accent: bg-accent, text-accent
- border: border-border, border-border-hover
- semantic: bg-success-soft, bg-danger-soft, bg-warning-soft

### Anti-patterns
- Raw View/Text without styling — every interactive element needs active state + rounded corners
- Hardcoded pixel sizes — prefer flex layout and relative sizing
- Missing accessibilityLabel on icon-only buttons
- Inline styles (style={{}}) when a className utility exists

## File Structure
- Screens: app/ directory (expo-router file-based routing)
- Shared components: src/components/
- Utilities and models: src/lib/
- State stores: src/store/
- Tests: src/__tests__/
- Assets: assets/

## Navigation
- Every screen reachable from tab bar or stack navigator. Login<->Signup cross-linked.
- Tab layout at app/(tabs)/_layout.tsx — add new tabs here.
- Root layout at app/_layout.tsx — handles auth redirect and providers.

## Final Checklist (run before finishing)
1. `npm run typecheck` — zero errors
2. `npm test` — all tests pass
3. `npm run build` — builds successfully (or verify no critical errors)
4. No missing accessibilityLabel on interactive elements
5. No unresolved imports

## Pre-built Auth (DO NOT RECREATE)
- Login screen at app/(auth)/login.tsx — email + password form
- Auth store at src/store/auth.ts handles: login, logout, token persistence via expo-secure-store
- API client at src/lib/api.ts auto-attaches auth token to requests
- For protected screens: check `useAuthStore().isAuthenticated` in component or app/_layout.tsx
