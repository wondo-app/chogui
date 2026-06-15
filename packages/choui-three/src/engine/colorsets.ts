// Wondo-palette colorsets shared across devices (board, dice, spintop).
// Each entry maps a named variant to its body/foreground hex pair.

export interface WondoColorset {
  background: string;
  foreground: string;
}

export const WONDO_COLORSETS: Record<string, WondoColorset> = {
  bone:  { background: "#F9ECDD", foreground: "#13280E" },
  ink:   { background: "#13280E", foreground: "#F9ECDD" },
  sage:  { background: "#66BA53", foreground: "#13280E" },
  amber: { background: "#DF8E00", foreground: "#311D01" },
  coral: { background: "#F47190", foreground: "#36161D" },
  sky:   { background: "#8498FF", foreground: "#1A1F3B" },
};
