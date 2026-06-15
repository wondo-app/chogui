// Catalog bootstrap — composes the library's tag packs for the Ladle sandbox.
//
// The `chogui` barrel is side-effect-free: importing it registers nothing. This
// module is the catalog's *bootstrap*, the standalone-repo twin of a host's own
// bootstrap (Wondo's `src/lib/story/tags.ts`). Importing it composes the packs in
// a representative order — core first, then the sample community packs that can
// override it — so the stories render the full built-in vocabulary without
// naming each pack. It registers only library-owned packs; it deliberately knows
// nothing about any host's runtime scene processors.

import {
	coreInlineTags,
	daisyDisplayPack,
	daisyMotionPack,
	daisySequencePack,
	gamePack,
	kbdPack,
	phoneChatPack,
	registerInlineTags,
	registerSampleRuntimePacks,
} from "chogui";

let bootstrapped = false;

export function bootstrapCatalogTags(): void {
	if (bootstrapped) return;
	bootstrapped = true;
	registerInlineTags(coreInlineTags);
	// Sample community packs register after core so they can override it.
	registerInlineTags(kbdPack);
	registerInlineTags(phoneChatPack);
	registerInlineTags(daisyDisplayPack);
	registerInlineTags(daisySequencePack);
	registerInlineTags(daisyMotionPack);
	registerInlineTags(gamePack);
	// The package's sample runtime pack (`fx`) — appended last, mirroring the
	// documented preview-mode → pause → community order a host would use.
	registerSampleRuntimePacks();
}

// Register on import so any module that pulls the catalog helpers gets the
// built-ins composed (the side effect the host bootstrap also performs).
bootstrapCatalogTags();

export { getInlineTag, getInlineTagNames, getRegisteredTagStyles } from "chogui";
