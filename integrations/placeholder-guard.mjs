// @ts-check
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Bracketed placeholders carried over from the design: [X], [CLIENT NAME], [€ PRICE], [+X%],
 * and bracketed emails such as [hello@youragency.com]. Markdown links like [Home](...) do not match.
 */
const PLACEHOLDER = /\[[A-Z€$+][A-Z0-9 €$%+.,:;'’/()&-]*\]|\[[\w.+-]+@[\w-]+(?:\.[\w-]+)+\]/g;
const SCANNED = /\.(html|txt|xml|json|webmanifest)$/;
/** Code in pages (scripts other than JSON-LD, styles) is not copy: regexes and selectors live there. */
const CODE = /<script(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>|<style[^>]*>[\s\S]*?<\/style>/gi;

/** @param {string} dir @returns {Promise<string[]>} */
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    }),
  );
  return files.flat();
}

/**
 * Fails the build when a placeholder would reach a page, so a half-filled site never deploys.
 * Content that is not ready belongs in src/data as null or an empty list, which hides it.
 * @returns {import('astro').AstroIntegration}
 */
export default function placeholderGuard() {
  return {
    name: 'placeholder-guard',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const found = [];
        for (const file of await walk(root)) {
          if (!SCANNED.test(file)) continue;
          let text = await readFile(file, 'utf8');
          if (file.endsWith('.html')) text = text.replace(CODE, '');
          const hits = [...new Set(text.match(PLACEHOLDER) ?? [])];
          if (hits.length) found.push(`  ${relative(root, file)}: ${hits.join(' ')}`);
        }
        if (found.length) {
          throw new Error(
            `Placeholders would ship. Fill them in, or set them to null in src/data so the section hides:\n${found.join('\n')}`,
          );
        }
        logger.info('No placeholders in the built output.');
      },
    },
  };
}
