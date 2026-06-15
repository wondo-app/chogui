import { describe, expect, it } from "vitest";

import { coerceProps, type PropSchema } from "../props";

describe("coerceProps", () => {
  it("passes string attributes through unchanged", () => {
    const schema: PropSchema = { width: { type: "string" } };
    const { props, warnings } = coerceProps({ width: "50%" }, schema);
    expect(props).toEqual({ width: "50%" });
    expect(warnings).toEqual([]);
  });

  it("coerces a numeric attribute to a number", () => {
    const schema: PropSchema = { max: { type: "number" } };
    const { props, warnings } = coerceProps({ max: "100" }, schema);
    expect(props).toEqual({ max: 100 });
    expect(warnings).toEqual([]);
  });

  it("coerces boolean attributes case-insensitively", () => {
    const schema: PropSchema = { on: { type: "boolean" }, off: { type: "boolean" } };
    const { props, warnings } = coerceProps({ on: "TRUE", off: "false" }, schema);
    expect(props).toEqual({ on: true, off: false });
    expect(warnings).toEqual([]);
  });

  it("accepts an enum value within the allowed set", () => {
    const schema: PropSchema = {
      variation: { type: "enum", enum: ["full-bleed", "side"] },
    };
    const { props, warnings } = coerceProps({ variation: "side" }, schema);
    expect(props).toEqual({ variation: "side" });
    expect(warnings).toEqual([]);
  });

  it("falls back to the default and warns when a number fails to parse", () => {
    const schema: PropSchema = { max: { type: "number", default: 100 } };
    const { props, warnings } = coerceProps({ max: "lots" }, schema);
    expect(props).toEqual({ max: 100 });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({ code: "invalid-value", prop: "max" });
  });

  it("warns on an invalid number with no default and omits the prop", () => {
    const schema: PropSchema = { max: { type: "number" } };
    const { props, warnings } = coerceProps({ max: "" }, schema);
    expect(props).toEqual({});
    expect(warnings[0]).toMatchObject({ code: "invalid-value", prop: "max" });
  });

  it("warns and falls back to default on an invalid boolean", () => {
    const schema: PropSchema = { on: { type: "boolean", default: false } };
    const { props, warnings } = coerceProps({ on: "yes" }, schema);
    expect(props).toEqual({ on: false });
    expect(warnings[0]).toMatchObject({ code: "invalid-value", prop: "on" });
  });

  it("warns on an enum value outside the allowed set", () => {
    const schema: PropSchema = {
      variation: { type: "enum", enum: ["full-bleed", "side"] },
    };
    const { props, warnings } = coerceProps({ variation: "diagonal" }, schema);
    expect(props).toEqual({});
    expect(warnings[0]).toMatchObject({ code: "invalid-value", prop: "variation" });
  });

  it("accepts any value for an enum with an empty allowed list", () => {
    const schema: PropSchema = { variation: { type: "enum", enum: [] } };
    const { props, warnings } = coerceProps({ variation: "anything" }, schema);
    expect(props).toEqual({ variation: "anything" });
    expect(warnings).toEqual([]);
  });

  it("applies the default when an attribute is absent", () => {
    const schema: PropSchema = { max: { type: "number", default: 100 } };
    const { props, warnings } = coerceProps({}, schema);
    expect(props).toEqual({ max: 100 });
    expect(warnings).toEqual([]);
  });

  it("omits an absent optional attribute with no default", () => {
    const schema: PropSchema = { width: { type: "string" } };
    const { props, warnings } = coerceProps({}, schema);
    expect(props).toEqual({});
    expect(warnings).toEqual([]);
  });

  it("warns when a required attribute is missing", () => {
    const schema: PropSchema = { src: { type: "string", required: true } };
    const { props, warnings } = coerceProps({}, schema);
    expect(props).toEqual({});
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({ code: "missing-required", prop: "src" });
  });

  it("warns about unknown attributes not in the schema", () => {
    const schema: PropSchema = { width: { type: "string" } };
    const { props, warnings } = coerceProps({ width: "50%", bogus: "x" }, schema);
    expect(props).toEqual({ width: "50%" });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({ code: "unknown-attrib", prop: "bogus" });
  });

  it("never throws on a fully mismatched attrib map", () => {
    const schema: PropSchema = {
      max: { type: "number", default: 100 },
      variation: { type: "enum", enum: ["a", "b"] },
    };
    expect(() =>
      coerceProps({ max: "NaN-ish", variation: "z", extra: "1" }, schema),
    ).not.toThrow();
    const { props, warnings } = coerceProps(
      { max: "NaN-ish", variation: "z", extra: "1" },
      schema,
    );
    expect(props).toEqual({ max: 100 });
    expect(warnings.map((w) => w.code).sort()).toEqual([
      "invalid-value",
      "invalid-value",
      "unknown-attrib",
    ]);
  });
});
