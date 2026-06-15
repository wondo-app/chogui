/**
 * `[img src="…" alt="…"]` — the render-time bare-form image. Authors do not
 * type this by hand; the PortableText image renderer emits it (see Section
 * 7a). Always pair with descriptive alt text — the translator surfaces alt
 * from the PT image block's accessibility field.
 */
export function Img({ src, alt }: { src?: string; alt?: string }) {
	if (!src) return null;
	return (
		<img
			src={src}
			alt={alt ?? ""}
			loading="lazy"
			className="block max-w-full h-auto mx-auto my-4 rounded-sm"
		/>
	);
}
