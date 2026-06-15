// Guard against drift between the manifest (pure data) and the live registry
// (React-side definitions). If a tag is added to a pack without a matching
// manifest entry, this test fails.

import { describe, expect, it } from "vitest";

import { coreInlineTags } from "../builtins";
import { INLINE_TAG_NAMES } from "../manifest";
import { ICON_NAMES } from "../markup/Icon";
import { daisyDisplayPack } from "../packs/daisy-display";
import { daisyMotionPack } from "../packs/daisy-motion";
import { daisySequencePack } from "../packs/daisy-sequence";
import { gamePack } from "../packs/game";
import { kbdPack } from "../packs/kbd";
import { phoneChatPack } from "../packs/phone-chat";
import {
  getInlineTagNames,
  registerInlineTags,
} from "../registry";

// Register all packs in the same order as the app bootstrap.
registerInlineTags(coreInlineTags);
registerInlineTags(kbdPack);
registerInlineTags(phoneChatPack);
registerInlineTags(daisyDisplayPack);
registerInlineTags(daisySequencePack);
registerInlineTags(daisyMotionPack);
registerInlineTags(gamePack);

const liveNames = [...getInlineTagNames()].sort();
const manifestNames = [...INLINE_TAG_NAMES].sort();

describe("enabled-tags-consistency", () => {
  it("every live-registered tag has a manifest entry", () => {
    const missing = liveNames.filter((n) => !manifestNames.includes(n));
    expect(missing).toEqual([]);
  });

  it("every manifest entry corresponds to a live-registered tag", () => {
    const stale = manifestNames.filter((n) => !liveNames.includes(n));
    expect(stale).toEqual([]);
  });

  it("ICON_NAMES in Icon.tsx matches the icon.name enum in the manifest", async () => {
    const { iconProps } = await import("../manifest");
    const manifestIconNames = (iconProps.name as { enum: readonly string[] }).enum;
    expect([...ICON_NAMES].sort()).toEqual([...manifestIconNames].sort());
  });
});
