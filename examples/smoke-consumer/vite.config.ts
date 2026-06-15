import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// No Tailwind here on purpose: this consumer imports chogui's *precompiled*
// stylesheet (`chogui/css`), proving the zero-config path works for a host with
// no Tailwind toolchain.
export default defineConfig({
	plugins: [react()],
});
