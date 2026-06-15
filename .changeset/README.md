# Changesets

This repo uses [Changesets](https://github.com/changesets/changesets) to version
and publish **`choui` and `choui-three` together**.

- Add a changeset for any user-facing change: `pnpm changeset`. When a change
  spans both packages (e.g. a shared bump), include both in the changeset.
- `choui` depends on `choui-three` via `workspace:*`. On `changeset version` /
  `changeset publish`, that range is rewritten to the just-published
  `choui-three` version, so a published `choui` never points at an unpublished
  engine. `updateInternalDependencies: "patch"` bumps `choui` when `choui-three`
  changes.
- The two packages keep **independent version numbers** but are released in one
  coordinated `changeset publish` run (`choui-three` first, then `choui`).

See the root `README.md` for the "publish together" rule.
