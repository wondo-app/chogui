# Design — Visual regression keyframe gallery

## Context

Usability research wants a reproducible catalog of every keyframe Wondo can render. The
naive approach — point Playwright at the live app and click through every state — founders on
two surfaces that are state machines with **no injection seam**:

- `ReaderCore` constructs `AtramentBridge` at module scope (`new Narrator(...)` inside a boot
  effect); there is no prop/context to set its state. Reaching "choices" or "paywall" live
  means executing a real Ink story to that beat.
- `AuthForm` / `VerifyTab` hold their phase in internal `useState`, advanced by real
  `fetch` + WebAuthn ceremonies. Reaching `waiting`/`profile`/`verify:success` live means a
  real magic-link email, a 15-minute TTL, and a platform authenticator.

Both are non-deterministic and slow. The insight that makes this tractable: **these surfaces
are pure functions of a small boundary** (the bridge's getters; `fetch` + the dynamically
imported `@simplewebauthn/browser`). Mock the boundary, render the real component, and the
state appears deterministically. Plain app routes have no such component to mount, so they
stay on live navigation — but their auth gate is solved cleanly by EmDash's dev-bypass.

## Goals / Non-goals

- **Goal**: a committed, browsable gallery of ~33 keyframes, regenerated on demand, with
  regression diffs as a free byproduct.
- **Goal**: hermetic capture for reader + auth (no server); native `toMatchScreenshot()` only.
- **Non-goal**: CI gating, third-party VR tooling, new app injection seams, role/data seeding
  for populated author frames, production-build capture.

## Three capture modes

```
   MODE 1  reader      vi.mock(atrament-bridge) + render(<StoryReader/>)   hermetic
   MODE 2  auth        vi.mock(fetch, @simplewebauthn/browser) + render    hermetic
   MODE 3  route       dev-bypass session + page.goto(emdash dev)          live server
```

### Mode 1 — reader (mocked engine)

`vi.mock` the three engine modules (`atrament-bridge`, `atrament/init`, `session-manager`). The
fake bridge exposes the full surface `ReaderCore` touches, all canned:

- emitters (`onDidContinue`, `onDidContinueUntilBreakpoint`, `onChoiceMake`, `onStoryStart`)
  with no-op `register`/`unregister`;
- synchronous getters returning fixture data — `getBreakpoints({getPending})` is the whole
  frame; plus `getCurrentChoices`, `getVariables`, `getListVariables`,
  `getListDefinitionTotals`, `getCurrentKnotName`; `listCheckpoints` resolves a fixture array;
- flags `isWaitingPlayerInput`, `didEnd`;
- no-op lifecycle (`start`, `restart`, `save`, `load`, `destroy`, `choose`,
  `continueUntilBreakpoint`).

The twelve states split into three tiers by how much they need:

```
   TIER 1  StoryReader shell only (no engine): loading · error · mismatch
   TIER 2  ReaderCore + fake bridge: scene-prose · continue · choices ·
           end-of-story · paywall · bottom-strip-pills
   TIER 3  MenuIsland + seeded reader-bus (no bridge): menu-{history,state,
           checkpoints,settings,reset}
```

Tier 3 is the quiet win — five frames render purely off `setReaderBusState`, the most
deterministic of the set.

**Fixture faithfulness.** The canned breakpoint arrays / scope trails are captured once from a
*real* `AtramentBridge` run against a fixture Ink story (the existing
`renderToStaticMarkup` tests already instantiate the real bridge), then frozen. This is the
Route-A/A′ hybrid: fake at runtime, but seeded with provably real-shaped data, so the gallery
can't quietly lie.

### Mode 2 — auth (mocked boundary)

`AuthForm` phases are reached by mocking `fetch` (`/api/auth/begin` → `waiting`; `/api/auth/me`
→ `profile`) and remounting for `expired`. The opportunistic conditional-UI WebAuthn ceremony
silently no-ops headless (`browserSupportsWebAuthnAutofill()` → false), so `email` captures
cleanly.

`VerifyTab` is the only real-registration surface, but its ceremony is a **dynamic
`import("@simplewebauthn/browser")`** — so `vi.mock` that module to return a canned credential
and we reach `submitting`/`success` with **no Playwright virtual authenticator**. Error reasons
are reached by mocking `fetch` (410 → expired, bad body → invalid, reject → network) or making
the mocked `startRegistration` throw (`NotAllowedError` → user-cancelled; else
passkey-unsupported). `missing-token` is just `token=""`.

Note: `?_preview=1` on the auth fetches is inert — grep of `src/pages/api/auth/*.ts` shows the
endpoints don't branch on it, so there is no free server-side preview mode; mocking is required.

### Mode 3 — route (live navigation)

`POST /_emdash/api/auth/dev-bypass` (dev-only, `import.meta.env.DEV`) sets an app-wide session
cookie that Wondo's `/me` soft-auth accepts. Setup posts once; the cookie rides along to every
authed nav. Capture order is cheap-first:

```
   PRE-AUTH        /signin · /verify · / · /404
   AUTHED EMPTY    /me · /me/settings · /me/stories · /me/discussions
   (DEFERRED)      populated lists, /me/stories/edit/[slug], /[author]/[story] variants
```

`client:only` islands (`/signin`, `/verify`) render empty HTML until hydration, so route
capture must wait for the island to mount before screenshotting.

## Decisions

- **`@vitest/browser-playwright` as provider.** Vitest browser mode requires a real browser
  engine; Playwright is the chosen provider. This is the single accepted dependency. Native
  `toMatchScreenshot()` handles diffing/baselines — no VR library.
- **Mock boundaries, don't add seams.** We deliberately avoid refactoring `StoryReader` /
  `AuthForm` / `VerifyTab` to accept injected engines/phases. `vi.mock` at the module edge
  keeps the change additive (config + test tree only) and keeps the captured component real.
- **Multi-project vitest config.** A `browser` project sits beside the untouched `node`
  project so unit tests and visual capture share one runner without cross-contamination.
- **Gallery, not gate.** Baselines are committed as the research artifact; no blocking CI job.

## Risks / open questions

- **Fake drift (mitigated).** A fake bridge can diverge from the real one; mitigated by
  capturing fixtures from a real bridge run.
- **`client:only` hydration timing.** Route + auth captures must await island mount, not just
  DOMContentLoaded, or they photograph empty shells.
- **Dev-server dependency for Mode 3.** Route capture needs `emdash dev` up; reader/auth do
  not. CI ergonomics (if ever gated) differ per mode.
- **OPEN — role/data shaping (deferred).** The dev-bypass user is role 50 with no profile/slug.
  Populated author-identity frames need a role-30 author + seeded stories/discussions. Recorded,
  not resolved; this change ships empty/onboarding route frames only.
