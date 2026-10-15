// @ts-check
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** @typedef {{ package: string; css?: string }} FontsourceOptions */

/**
 * A font provider for Astro's Fonts API that reads installed Fontsource packages. Nothing is
 * fetched at build time, and every face keeps its subset name, so a layout can preload only the
 * latin file: <Font cssVariable="--font-body" preload={[{ subset: 'latin' }]} />.
 *
 * Family options: { package: '@fontsource-variable/outfit', css: 'index.css' }. The family's
 * `subsets` (default ['latin']) pick which faces are used; only the normal style is read.
 * @returns {import('astro').FontProvider<FontsourceOptions>}
 */
export function fontsourceFonts() {
  /** @type {URL} */
  let root;
  return {
    name: 'fontsource-local',
    init(context) {
      root = context.root;
    },
    resolveFont({ options, subsets }) {
      if (!options) throw new Error('fontsource-local: set options.package on the font family.');
      const file = (/** @type {string} */ path) => fileURLToPath(new URL(`node_modules/${options.package}/${path}`, root));
      const css = readFileSync(file(options.css ?? 'index.css'), 'utf8');
      // Fontsource writes one block per face, named in a comment: /* outfit-latin-ext-wght-normal */
      const faces = css.matchAll(/\/\* [\w-]+?-([a-z]+(?:-ext)?)-(?:wght|\d+)-normal \*\/\s*@font-face \{([^}]+)\}/g);
      const fonts = [];
      for (const [, subset = '', body = ''] of faces) {
        if (!subsets.includes(subset)) continue;
        const woff2 = /url\(\.\/files\/([^)]+\.woff2)\)/.exec(body)?.[1];
        const weight = /font-weight: ([^;]+);/.exec(body)?.[1];
        const range = /unicode-range: ([^;]+);/.exec(body)?.[1];
        if (!woff2 || !weight) continue;
        fonts.push({
          src: [{ url: file(`files/${woff2}`), format: 'woff2' }],
          weight,
          style: 'normal',
          unicodeRange: range?.split(',').map((r) => r.trim()),
          meta: { subset },
        });
      }
      // Latin first: Astro measures the metric-matched fallback on the first file, and only it has a-z.
      fonts.sort((a, b) => Number(a.meta.subset !== 'latin') - Number(b.meta.subset !== 'latin'));
      return { fonts };
    },
  };
}
