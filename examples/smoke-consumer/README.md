# choui smoke consumer

A throwaway Vite + React app that installs the **published** `choui` from npm —
with **no host Tailwind** — to smoke-test a release (the `choui-smoke-install`
task). It is intentionally **outside** the pnpm workspace (the workspace only
globs `packages/*`), so `npm install` here resolves the real published packages,
not the workspace sources.

Run it **after** `choui`/`choui-three` are published:

```bash
cd examples/smoke-consumer
npm install            # pulls published choui + choui-three from npm
npm run dev            # vendors choui-three assets → public/, starts Vite
```

What it proves:

1. A component imported from the `choui` barrel renders (`Icon`).
2. `<StoryMarkup>` (`choui/markup`) renders authored bracket markup with the
   built-in packs registered.
3. The precompiled `choui/css` stylesheet styles it with **no Tailwind in this
   app** (the zero-config path). Swap to `@import "choui/preset"` in a Tailwind
   host to re-theme.
4. The `[dice]` tag lazy-loads `choui-three` and tumbles dice from
   `/assets/choui-three/` (vendored by the `dev`/`build` script).
