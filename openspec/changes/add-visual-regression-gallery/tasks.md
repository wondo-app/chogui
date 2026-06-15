# Tasks — Visual regression keyframe gallery

## 1. Browser-mode scaffolding

- [ ] Add `@vitest/browser-playwright` and `vitest-browser-react` as devDependencies; install Playwright Chromium.
- [ ] Add a `browser` project to `vitest.config.ts` alongside the existing `node` project (multi-project config); set provider to `@vitest/browser-playwright`, headless Chromium, fixed viewport + `deviceScaleFactor` for stable PNGs.
- [ ] Confirm `vitest run` runs both projects and the existing `node` unit tests are unaffected.
- [ ] Establish the `__screenshots__/{reader,auth,route}/` layout and a naming convention; add a smoke test that captures one trivial frame end-to-end.

## 2. Reader gallery (mocked engine)

- [ ] Author a fixture Ink story and capture real `AtramentBridge` output (breakpoints, scope trails, list variables) once; freeze as `reader-frames` fixtures.
- [ ] Write `makeFakeBridge(fixture)` exposing the full getter/emitter/flag/lifecycle surface `ReaderCore` touches, returning canned data.
- [ ] `vi.mock` `atrament-bridge` / `atrament/init` / `session-manager`; mount `StoryReader` / `ReaderCore`.
- [ ] Tier 1 — capture `loading`, `error`, `mismatch` (drive via props + the inline `#wondo-story-map` script).
- [ ] Tier 2 — capture `scene-prose`, `continue`, `choices`, `end-of-story`, `paywall`, `bottom-strip-pills`.
- [ ] Tier 3 — seed `setReaderBusState` and capture `menu-history`, `menu-state`, `menu-checkpoints`, `menu-settings`, `menu-reset`.

## 3. Auth gallery (mocked boundary)

- [ ] Helper to `vi.mock` `fetch` per endpoint and `vi.mock` `@simplewebauthn/browser`.
- [ ] `AuthForm` — capture `signin-email`, `waiting-new`, `waiting-returning`, `profile`, `expired`.
- [ ] `VerifyTab` — capture `verify-starting`, `verify-registering`, `verify-submitting`, `verify-success` (mocked credential), and errors `missing-token` / `invalid` / `expired` / `user-cancelled` / `passkey-unsupported` / `network`.
- [ ] Confirm the conditional-UI ceremony no-ops headless and does not block `signin-email` capture.

## 4. App-route gallery (live navigation)

- [ ] Setup helper: `POST /_emdash/api/auth/dev-bypass`, retain the session cookie for the suite.
- [ ] Add an island-hydration wait helper (await mount, not just DOMContentLoaded) for `client:only` routes.
- [ ] Pre-auth — capture `route-signin`, `route-verify`, `route-home`, `route-404`.
- [ ] Authed empty/onboarding — capture `route-me-empty`, `route-me-settings`, `route-me-stories-empty`, `route-me-discussions-empty`.

## 5. Wiring + docs

- [ ] Commit the generated baselines as the gallery; add a short README in `__screenshots__/` explaining regeneration and the research purpose.
- [ ] Add an npm script (e.g. `test:visual` and `test:visual:update`) and document the `emdash dev` prerequisite for the route suite.
- [ ] Record the deferred role-30/data-seeding open question where future contributors will find it (design.md already holds it; cross-link from the README).
