# Changesets

This repo uses [Changesets](https://github.com/changesets/changesets) to version
and publish **`chogui` and `chogui-three` together**.

- Add a changeset for any user-facing change: `pnpm changeset`. When a change
  spans both packages (e.g. a shared bump), include both in the changeset.
- `chogui` depends on `chogui-three` via `workspace:*`. On `changeset version` /
  `changeset publish`, that range is rewritten to the just-published
  `chogui-three` version, so a published `chogui` never points at an unpublished
  engine. `updateInternalDependencies: "patch"` bumps `chogui` when `chogui-three`
  changes.
- The two packages keep **independent version numbers** but are released in one
  coordinated `changeset publish` run (`chogui-three` first, then `chogui`).

See the root `README.md` for the "publish together" rule.
