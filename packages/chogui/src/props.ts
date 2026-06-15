// Declarative prop schema + string→typed coercion for inline tags.
//
// Inline tags author their attributes as strings (`[block width="50%"]`). A tag
// MAY declare a `props` schema (attribute name → descriptor). When it does, the
// reader coerces the authored strings to the declared types *before* calling
// `render`, validates them, and surfaces structured warnings. The same schema
// is the single source the craft validator, the Ladle controls, and the docs
// catalog's prop tables all read from — declare it once, never hand-author the
// derived views.
//
// This module is React-free (it imports nothing) so the compiler/validator
// (wondo-ink) can import it via the `./props` subpath without pulling React
// into its build graph — the same extractability discipline as `./manifest`.
//
// Coercion never throws: an unparseable value falls back to the descriptor's
// `default` (or is omitted) and is reported as a warning. Tags WITHOUT a schema
// are untouched — they keep receiving the raw `attribs` map unchanged, so the
// `props` field is purely additive.

/** The value kinds an attribute can be coerced to. */
export type PropType = "string" | "number" | "boolean" | "enum";

/** Declaration for a single authored attribute. */
export interface PropDescriptor {
  type: PropType;
  /** Value used when the attribute is absent, or when coercion fails. */
  default?: string | number | boolean;
  /** Warn (never block) when the attribute is absent. */
  required?: boolean;
  /** Allowed values for `type: "enum"`. Ignored for the other types. */
  enum?: readonly string[];
  /** Human-readable summary — feeds Ladle controls and the docs prop tables. */
  description?: string;
}

/** A tag's full prop schema: attribute name → descriptor. */
export type PropSchema = Record<string, PropDescriptor>;

/** A coerced attribute value. Schema-less tags never produce these. */
export type CoercedValue = string | number | boolean;

export type PropWarningCode = "unknown-attrib" | "invalid-value" | "missing-required";

/** A non-fatal coercion/validation finding for one attribute. */
export interface PropWarning {
  code: PropWarningCode;
  /** The attribute the warning is about. */
  prop: string;
  message: string;
}

export interface CoerceResult {
  /** Coerced values, keyed by the declared attribute name. */
  props: Record<string, CoercedValue>;
  warnings: PropWarning[];
}

type CoerceOutcome =
  | { status: "ok"; value: CoercedValue }
  | { status: "error"; message: string };

function coerceValue(name: string, raw: string, descriptor: PropDescriptor): CoerceOutcome {
  switch (descriptor.type) {
    case "string":
      return { status: "ok", value: raw };
    case "number": {
      const trimmed = raw.trim();
      const n = Number(trimmed);
      if (trimmed !== "" && Number.isFinite(n)) return { status: "ok", value: n };
      return { status: "error", message: `Attribute "${name}" expects a number, got "${raw}".` };
    }
    case "boolean": {
      const trimmed = raw.trim().toLowerCase();
      if (trimmed === "true") return { status: "ok", value: true };
      if (trimmed === "false") return { status: "ok", value: false };
      return {
        status: "error",
        message: `Attribute "${name}" expects "true" or "false", got "${raw}".`,
      };
    }
    case "enum": {
      const allowed = descriptor.enum ?? [];
      if (allowed.length === 0 || allowed.includes(raw)) return { status: "ok", value: raw };
      const list = allowed.map((v) => `"${v}"`).join(", ");
      return { status: "error", message: `Attribute "${name}" expects one of ${list}, got "${raw}".` };
    }
  }
}

/**
 * Coerce a raw attribute map against a schema. Returns the typed values plus a
 * list of warnings (missing-required, invalid-value, unknown-attrib). Never
 * throws: invalid values fall back to the descriptor `default` when present.
 */
export function coerceProps(
  attribs: Record<string, string>,
  schema: PropSchema,
): CoerceResult {
  const props: Record<string, CoercedValue> = {};
  const warnings: PropWarning[] = [];

  for (const [name, descriptor] of Object.entries(schema)) {
    const raw = attribs[name];
    if (raw === undefined) {
      if (descriptor.required) {
        warnings.push({
          code: "missing-required",
          prop: name,
          message: `Required attribute "${name}" is missing.`,
        });
      }
      if (descriptor.default !== undefined) props[name] = descriptor.default;
      continue;
    }
    const outcome = coerceValue(name, raw, descriptor);
    if (outcome.status === "ok") {
      props[name] = outcome.value;
    } else {
      warnings.push({ code: "invalid-value", prop: name, message: outcome.message });
      if (descriptor.default !== undefined) props[name] = descriptor.default;
    }
  }

  for (const name of Object.keys(attribs)) {
    if (name in schema) continue;
    warnings.push({
      code: "unknown-attrib",
      prop: name,
      message: `Unknown attribute "${name}".`,
    });
  }

  return { props, warnings };
}
