## ADDED Requirements

### Requirement: Three-mode keyframe capture harness

Wondo SHALL provide a Vitest browser-mode harness that captures every distinct visual state
of the app as a committed screenshot, using a capture mode matched to each surface's
architecture. The harness SHALL define exactly three modes: (1) **mocked-engine** for the
story reader, (2) **mocked-boundary** for the auth flow, and (3) **live-navigation** for plain
server-rendered app routes. The browser project SHALL be configured in `vitest.config.ts` as a
project distinct from the existing `node` project (which keeps the `renderToStaticMarkup` unit
tests unchanged), and SHALL use `@vitest/browser-playwright` as its provider. Screenshot
capture SHALL use Vitest's native `toMatchScreenshot()`; no third-party visual-regression
library or service SHALL be introduced.

#### Scenario: Browser project coexists with the node project
- **WHEN** `vitest run` executes
- **THEN** both the existing `node` project (unit tests) and the new `browser` project (visual
  capture) SHALL run, and the `node` project's environment and tests SHALL be unmodified.

#### Scenario: Native screenshot API only
- **WHEN** a visual suite captures a frame
- **THEN** it SHALL call Vitest's native `toMatchScreenshot()` and SHALL NOT depend on
  `jest-image-snapshot`, Percy, Chromatic, Storybook, or any other visual-regression tool;
  the only browser dependency SHALL be the Playwright provider engine.

### Requirement: Baseline folder is the gallery

The harness SHALL treat the `toMatchScreenshot()` baseline directory as the deliverable
browsable gallery. Baselines SHALL be committed under a `__screenshots__/` tree namespaced by
capture mode (`reader/`, `auth/`, `route/`), with one stably-named PNG per captured state. On
first run the baselines are generated (populating the gallery); on subsequent runs they are
diffed (yielding regression detection as a byproduct, not the goal).

#### Scenario: First run populates the gallery
- **WHEN** the visual suites run with no existing baselines
- **THEN** each captured state SHALL be written as a named PNG under
  `__screenshots__/{reader,auth,route}/` and these files SHALL be the committed research
  artifact.

#### Scenario: Re-run diffs against the gallery
- **WHEN** the visual suites run with baselines present and a captured frame differs
- **THEN** `toMatchScreenshot()` SHALL surface the diff; the gallery's purpose remains the
  research catalog, and the diff is an informational byproduct rather than a blocking gate.

### Requirement: Reader states captured by mocking the engine

The reader gallery SHALL capture the twelve canonical reader states by replacing the Atrament
engine at its module boundary — `vi.mock` of the `atrament-bridge`, `atrament/init`, and
`session-manager` modules — with a fake bridge whose synchronous getters
(`getBreakpoints`, `getCurrentChoices`, `getVariables`, `getListVariables`,
`getListDefinitionTotals`, `getCurrentKnotName`, `listCheckpoints`) and flags
(`isWaitingPlayerInput`, `didEnd`) return canned fixture data, and whose event emitters and
lifecycle methods are no-ops. The real `StoryReader` / `ReaderCore` / `MenuIsland` components
SHALL be mounted and rendered against the fake; no dev server SHALL be required. The canonical
states SHALL be: loading, error, mismatch, scene-prose, continue, choices, end-of-story,
paywall, bottom-strip-pills, and the menu tabs history / state / checkpoints / settings / reset
(menu-tab frames MAY be captured by seeding `setReaderBusState` directly, since the menu renders
from the reader bus rather than from reader props).

#### Scenario: A reader state is photographed without a running engine
- **WHEN** the reader suite mounts `ReaderCore` with the fake bridge primed to return a
  breakpoint array and `getCurrentChoices()` of length ≥ 2
- **THEN** the real render tree SHALL paint the choices state and `toMatchScreenshot("choices")`
  SHALL capture it, with no Atrament Core, no Ink execution, and no network.

#### Scenario: Menu-tab frames render from a seeded bus
- **WHEN** the suite calls `setReaderBusState(fixture)` and opens the MenuIsland dialog on the
  Checkpoints tab
- **THEN** the Checkpoints tab SHALL render the fixture's checkpoints and be captured as
  `menu-checkpoints`, without instantiating the bridge.

### Requirement: Reader fixtures captured from the real engine

The canned data driving the mocked reader gallery SHALL be captured once from a real
`AtramentBridge` run against a fixture Ink story, then frozen as fixtures — so the mocked
shapes (breakpoint arrays, scope trails, list variables) are provably faithful to what the real
engine emits, guarding against fake drift.

#### Scenario: Fixture shapes trace to a real bridge
- **WHEN** the reader fixtures are authored or updated
- **THEN** the breakpoint and list-variable shapes SHALL be derived from a real
  `AtramentBridge` execution (as the existing `renderToStaticMarkup` tests already do) rather
  than hand-fabricated.

### Requirement: Auth phases captured by mocking the boundary

The auth gallery SHALL capture every phase of `AuthForm` (email, waiting-new,
waiting-returning, profile, expired) and `VerifyTab` (starting, registering, submitting,
success, and each error reason: missing-token, invalid, expired, user-cancelled,
passkey-unsupported, network) by mocking `fetch` and the dynamically-imported
`@simplewebauthn/browser` module, then mounting the real components. The mocked WebAuthn module
SHALL return a canned credential so that the `verify:success` and `verify:submitting` states are
reachable without a Playwright virtual authenticator. No dev server and no real magic-link email
SHALL be required.

#### Scenario: Verify success captured without a real authenticator
- **WHEN** the auth suite mounts `VerifyTab` with a token, mocks `passkey-options` /
  `passkey-complete` `fetch` to succeed, and mocks `@simplewebauthn/browser`'s
  `startRegistration` to resolve a canned credential
- **THEN** `VerifyTab` SHALL advance to the `success` phase and be captured as `verify-success`.

#### Scenario: Email phase captured live-free
- **WHEN** the auth suite mounts `AuthForm` with default state
- **THEN** the `email` phase SHALL render and be captured as `signin-email`; the opportunistic
  conditional-UI WebAuthn ceremony SHALL silently no-op under the mocked/headless environment
  and SHALL NOT block capture.

### Requirement: App routes captured by authenticated live navigation

The app-route gallery SHALL capture server-rendered routes by navigating a running
`npx emdash dev` instance, authenticated by minting a session via
`POST /_emdash/api/auth/dev-bypass` in suite setup (dev-only; the session cookie is app-wide and
accepted by Wondo's `/me` soft-auth). The suite SHALL lead with pre-auth routes (`/signin`,
`/verify`, `/`, `/404`) and authed empty/onboarding states (`/me`, `/me/settings`, `/me/stories`,
`/me/discussions`). Populated author-identity variants that require role shaping or data seeding
are out of scope for this change.

#### Scenario: Authed route captured via dev-bypass session
- **WHEN** the route suite posts to `/_emdash/api/auth/dev-bypass`, then navigates to `/me`
- **THEN** the request SHALL carry the dev-bypass session cookie, `/me` SHALL render its
  authenticated (empty) dashboard, and it SHALL be captured as `route-me-empty`.

#### Scenario: Pre-auth route captured without a session
- **WHEN** the route suite navigates to `/signin` with no session
- **THEN** the page SHALL render and (after the `client:only` island hydrates) be captured as
  `route-signin`.
