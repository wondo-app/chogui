# chogui smoke consumer

A throwaway Vite + React app that installs the **published** `chogui` from npm —
with **no host Tailwind** — to smoke-test a release (the `chogui-smoke-install`
task). It is intentionally **outside** the pnpm workspace (the workspace only
globs `packages/*`), so `npm install` here resolves the real published packages,
not the workspace sources.

Run it **after** `chogui`/`chogui-three` are published:

```bash
cd examples/smoke-consumer
npm install            # pulls published chogui + chogui-three from npm
npm run dev            # vendors chogui-three assets → public/, starts Vite
```

What it proves:

1. A component imported from the `chogui` barrel renders (`Icon`).
2. `<StoryMarkup>` (`chogui/markup`) renders authored bracket markup with the
   built-in packs registered.
3. The precompiled `chogui/css` stylesheet styles it with **no Tailwind in this
   app** (the zero-config path). Swap to `@import "chogui/preset"` in a Tailwind
   host to re-theme.
4. The `[dice]` tag lazy-loads `chogui-three` and tumbles dice from
   `/assets/chogui-three/` (vendored by the `dev`/`build` script).
