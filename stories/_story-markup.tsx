// Catalog binding of the library markup renderer.
//
// The standalone-repo twin of a host's `StoryMarkup` wrapper. It builds the
// renderer with the library's *neutral* default prefix (a host like Wondo passes
// its own, e.g. `wondo-`) and the default library registry — into which
// `./_bootstrap` has registered every built-in pack. Importing `_bootstrap` here
// guarantees the packs are composed before the renderer queries the registry.
//
// ⚠️ CLIENT-ONLY: the renderer uses html-react-parser (needs the DOM). Ladle
// renders in the browser, so this is fine in the sandbox.

import { createStoryMarkup, type StoryMarkupProps } from "chogui/markup";

import "./_bootstrap";

export type { StoryMarkupProps };

export const StoryMarkup = createStoryMarkup();
