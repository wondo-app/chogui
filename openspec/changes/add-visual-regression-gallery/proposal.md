## Why

Usability research on Wondo needs a complete, browsable catalog of every distinct
visual state the app can render — the reader's twelve states (loading, scene, choices,
paywall, the five menu tabs, …), the auth flow's phases (email / waiting / profile /
expired / verify states), and the authed app routes (`/me`, `/me/settings`,
`/me/stories`, …). Today that catalog is assembled by hand: a researcher clicks the app
into each state and screenshots it, which is slow, non-reproducible, and silently drifts
as the UI changes.

Vitest 4 ships native screenshot capture (`toMatchScreenshot()`) whose committed baseline
folder *is* a browsable gallery, regenerated on demand. Adopting it gives us (a) a
deterministic, version-controlled gallery of every keyframe for research, and (b)
regression diffs for free as a byproduct — without any third-party visual-regression
service or snapshot library. The capture problem (driving each surface into the state we
want to photograph) is the real work; the screenshot itself is one line.

The key architectural finding from exploration: the reader and the auth flow are both
**state machines with no injection seam** (the engine / phase live in module-scope
construction and internal `useState`). So their states are reached by **mocking the
boundary** (`vi.mock` the Atrament bridge; `vi.mock` `fetch` + `@simplewebauthn/browser`)
and rendering the *real* component — hermetic, no dev server. Plain app routes have no
mountable component, so they are captured by **live navigation** against `npx emdash dev`,
authenticated via EmDash's dev-bypass endpoint. Three capture modes, one gallery.

## What Changes

- **New test infrastructure — Vitest browser mode.** Add a `browser` project to
  `vitest.config.ts` (multi-project, alongside the existing `node` project) using
  `@vitest/browser-playwright` as the provider. The `node` project — existing
  `renderToStaticMarkup` unit tests — is untouched.
- **New dependency (single).** `@vitest/browser-playwright` (browser provider engine) plus
  `vitest-browser-react` (the `render()` helper for mounting React in-browser). Screenshot
  diffing uses Vitest's **native** `toMatchScreenshot()` — no `jest-image-snapshot`, no
  Percy/Chromatic, no Storybook.
- **Reader gallery (mocked engine).** A browser-mode suite that `vi.mock`s the
  `atrament-bridge` / `atrament/init` / `session-manager` modules with a fake bridge whose
  synchronous getters return canned fixture data, mounts the real `StoryReader` /
  `ReaderCore` / `MenuIsland`, and captures the twelve canonical states. Fixtures
  (storyMap + Portable Text + breakpoint arrays) are captured once from a real
  `AtramentBridge` run so the canned shapes are provably faithful.
- **Auth gallery (mocked boundary).** A browser-mode suite that `vi.mock`s `fetch` and the
  dynamically-imported `@simplewebauthn/browser` module to drive `AuthForm` and `VerifyTab`
  through every phase — including `verify:success`, which is reached by returning a canned
  credential from the mocked WebAuthn module (no Playwright virtual authenticator needed).
- **App-route gallery (live navigation).** A browser-mode suite that mints a session via
  `POST /_emdash/api/auth/dev-bypass` in setup, then navigates `npx emdash dev` to each
  authed/public route and captures it — leading with pre-auth and empty/onboarding states
  (cheap, high research value); seeded-data variants deferred.
- **Committed gallery.** Baselines land under `__screenshots__/{reader,auth,route}/…`,
  reviewed as the research artifact and diffed on re-run.
- **Run on demand, not CI-gated.** The gallery is regenerated/inspected when a researcher
  wants it; this change does not add a blocking CI screenshot job (a non-goal below).

## Capabilities

### Added Capabilities

- `visual-testing`: a new capability defining the three-mode keyframe-capture harness, the
  fixture-from-real-engine discipline for mocked captures, the dev-bypass session for live
  app-route captures, the native `toMatchScreenshot()` baseline-as-gallery contract, and the
  frame inventory across reader / auth / route surfaces.

## Impact

- **New code**: `vitest.config.ts` browser project; a `src/**/__visual__/` (or `test/visual/`)
  tree holding the three suites, the fake-bridge factory, the captured fixtures, the
  dev-bypass setup helper; the committed `__screenshots__/` gallery.
- **New dependency**: `@vitest/browser-playwright` + `vitest-browser-react` (devDependencies);
  Playwright's bundled Chromium download. No runtime/app dependency added.
- **Modified code**: `vitest.config.ts` only. No application source changes — the harness
  mocks at module boundaries and navigates the live app; it does not require new injection
  seams in `StoryReader`, `AuthForm`, or `VerifyTab`.
- **Operational**: the app-route suite requires `npx emdash dev` running (dev-bypass is gated
  on `import.meta.env.DEV`); the reader and auth suites are hermetic and need no server.
- **Untouched**: all application behavior, the `node` test project, `/api/*` contracts,
  EmDash schema, the Atrament bridge surface. This is additive test infrastructure.

## Non-goals

- **Not a CI regression gate.** The primary deliverable is a browsable research gallery; the
  regression diff is a free byproduct. This change does not wire a blocking screenshot job
  into CI. Promoting the gallery to a gate is a separate decision.
- **No author/role seeding (deferred).** The dev-bypass user is EmDash admin (role 50), not a
  typical author (role 30), and has no completed profile/slug. App-route capture leads with
  pre-auth and empty/onboarding states. Shaping a role-30 author + seeding stories/discussions
  for the *populated* author-identity frames is explicitly deferred — recorded as the one open
  question, not resolved here.
- **No new application injection seams.** The harness deliberately mocks module boundaries
  rather than refactoring `StoryReader`/`AuthForm`/`VerifyTab` to accept injected
  engines/phases. If a seam later proves cleaner, that is a separate change.
- **No third-party visual-regression tooling.** No Storybook, Percy, Chromatic, Loki, or
  `jest-image-snapshot`. Native `toMatchScreenshot()` only; Playwright is the sole accepted
  dependency, as the browser engine Vitest browser mode is built on.
- **No production-build capture.** Dev-bypass is dev-only, so the gallery runs against
  `emdash dev`. Capturing built/preview artifacts is out of scope.
- **No exhaustive narrative branch-walking.** The reader gallery captures the twelve canonical
  states (one representative frame each), not every choice path of a real story.
