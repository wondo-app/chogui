import { type DependencyList, type RefObject, useEffect, useRef, useState } from "react";

// Shared scaffolding for a 3D device tag (the second-3D-tag wrapper): the SSR guard,
// the lazy dynamic `import("chogui-three")` (so `three`/`cannon-es` stay out of the
// SSR + main bundle), mounting via the `build` callback, cleanup, and graceful
// failure — when the engine can't load/render, `failed` flips and the caller renders
// a non-3D fallback that still performs the tag's function.
//
// Reduced-motion is detected once in the hook and passed as `immediate` to the
// build callback so callers don't each check `matchMedia`.

type ChouiThree = typeof import("chogui-three");

export interface Disposable {
  dispose(): void;
}

export interface BuildOpts {
  /** True when the user prefers reduced motion — show the outcome instantly. */
  immediate: boolean;
}

export interface Use3DDeviceResult {
  containerRef: RefObject<HTMLDivElement | null>;
  failed: boolean;
}

export function use3DDevice(
  build: (mod: ChouiThree, container: HTMLElement, opts: BuildOpts) => Disposable | null,
  deps: DependencyList,
): Use3DDeviceResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);
  const genRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const container = containerRef.current;
    if (!container) return;

    let handle: Disposable | null = null;
    let cancelled = false;
    // Generation counter: if deps change while the dynamic import is in
    // flight, the old `.then()` sees a stale generation and skips `build()`.
    // This prevents two Stages from coexisting during rapid dep churn.
    const gen = ++genRef.current;

    const immediate =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    import("chogui-three")
      .then((mod) => {
        if (cancelled || gen !== genRef.current || !containerRef.current) return;
        handle = build(mod, containerRef.current, { immediate });
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("[choui] 3D device failed to load; showing fallback.", err);
        setFailed(true);
      });

    return () => {
      cancelled = true;
      handle?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { containerRef, failed };
}
