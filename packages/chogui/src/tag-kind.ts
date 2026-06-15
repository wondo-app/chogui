// The inline-tag kind — a pure string union, deliberately React-free.
//
// It lives in its own module (rather than `./contract`, which carries the
// React-typed render context) so the React-free `./manifest` and `./props`
// entries can reference it without dragging React into their `.d.ts`. The
// contract re-exports it as the canonical name.

/**
 * A "void" tag takes no inner content (`[picture …]`); a "paired" tag wraps
 * children (`[highlight]…[/highlight]`). The renderer uses this to decide how to
 * rewrite the square-bracket source into a custom element before parsing.
 */
export type InlineTagKind = "void" | "paired";
