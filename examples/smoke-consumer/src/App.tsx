// Smoke test of the PUBLISHED choui package from a plain Vite+React host.
//
// Exercises the three things a real host relies on:
//   1. A React component imported from the barrel (`Icon`).
//   2. The `StoryMarkup` renderer (`choui/markup`) over authored bracket markup,
//      with the built-in packs registered exactly as a host bootstrap would.
//   3. The `[dice]` game tag, which lazy-loads `choui-three` and fetches its
//      runtime assets from `/assets/choui-three/` (vendored by the `dev`/`build`
//      script via choui-three's copy-assets).

import {
	coreInlineTags,
	createStoryMarkup,
	gamePack,
	Icon,
	registerInlineTags,
} from "choui";

registerInlineTags(coreInlineTags);
registerInlineTags(gamePack);

const StoryMarkup = createStoryMarkup();

const SOURCE = `Roll for initiative [dice notation="2d6"]. You found a [b]sword[/b].`;

export function App() {
	return (
		<div className="mx-auto max-w-xl text-base-content">
			<h1 className="text-2xl font-semibold">choui smoke consumer</h1>
			<p className="mt-2 flex items-center gap-2">
				<Icon name="dice" /> component import works.
			</p>
			<div className="mt-6 leading-relaxed">
				<StoryMarkup source={SOURCE} />
			</div>
		</div>
	);
}
