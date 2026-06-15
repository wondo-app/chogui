import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// The zero-config precompiled stylesheet (Tailwind v4 + DaisyUI baked in). A host
// with no Tailwind toolchain imports just this. Re-theming instead would use
// `@import "@wondo-app/choui/preset"` in a host Tailwind build — see the README.
import "@wondo-app/choui/css";

import { App } from "./App";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<div data-theme="light" style={{ minHeight: "100vh", padding: "2rem" }}>
			<App />
		</div>
	</StrictMode>,
);
