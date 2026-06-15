/**
 * `[picture src="…" alt="…" caption="…" variation="…"]` — the render-time
 * rich-form image: carries a caption and an optional Wondo design variation.
 * Authors do not type this by hand; the PortableText image renderer emits
 * it when the underlying PT image block carries `caption` / `variation`
 * props (Section 7a).
 *
 * Variations (Wondo design-system reserved):
 *   "full-bleed" — break out of the prose column
 *   "side"       — align to the column edge with caption beside
 *   default      — centered, captioned below
 */
export function Picture({
	src,
	alt,
	caption,
	variation,
}: {
	src?: string;
	alt?: string;
	caption?: string;
	variation?: string;
}) {
	if (!src) return null;
	const figureClass =
		variation === "full-bleed"
			? "my-6 -mx-4 md:-mx-12"
			: variation === "side"
				? "my-4 max-w-md mx-auto md:float-right md:ml-6"
				: "my-6 mx-auto max-w-2xl";
	return (
		<figure className={figureClass}>
			<img
				src={src}
				alt={alt ?? ""}
				loading="lazy"
				className="block w-full h-auto rounded-sm"
			/>
			{caption && (
				<figcaption className="text-base-content/70 text-sm mt-2 text-center italic">
					{caption}
				</figcaption>
			)}
		</figure>
	);
}
