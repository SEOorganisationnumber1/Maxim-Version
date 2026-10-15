// Share images (1200 x 630) and app icons, drawn as SVG and rasterised with sharp. Build-time only:
// every caller is a prerendered endpoint. Text is set in the site's own fonts and turned into
// outlines, so the result never depends on fonts installed on the build machine.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { parse, type Font, type Glyph } from 'opentype.js/dist/opentype.mjs';
import { ribbonPath } from '../scripts/hero-ribbons';
import { site } from '../data/site';
import type { OgCard } from '../data/og';

const INK = '#0A1128';
const INK_2 = '#3D4763';
const PAPER = '#F5FAFC';
const TEAL = '#089FB3';
const TEAL_INK = '#077A8A';
const CYAN = '#1CCAD8';

const LOGO_PATH = 'M6 8 C 14 2, 26 8, 18 15 C 10 22, 20 28, 25 22';
const LOGO_GRADIENT = `<linearGradient id="logo" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#22D3DD"/><stop offset="0.55" stop-color="#2F8CF6"/><stop offset="1" stop-color="#5B4FE9"/></linearGradient>`;

/** Art colours per card tone, from the page heroes. */
const TONES: Record<OgCard['tone'], { blob: string; ribbon: string[]; accent: boolean }> = {
  cyan: { blob: '#DFF6F9', ribbon: ['#22D3DD', '#2FB4F0', '#2F8CF6'], accent: true },
  blue: { blob: '#E4EEFF', ribbon: ['#22D3DD', '#2F8CF6', '#5B4FE9'], accent: false },
  violet: { blob: '#EAE8FF', ribbon: ['#5B4FE9', '#2F8CF6', '#22D3DD'], accent: false },
};

// ---------- Fonts ----------

/** A face is the latin file plus its latin-ext companion, used for characters the first lacks. */
type Face = Font[];

const fontsource = (pkg: string, file: string): Font => {
  const buf = readFileSync(join(process.cwd(), 'node_modules', pkg, 'files', file));
  return parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer);
};

let cached: { display: Face; bold: Face; mono: Face } | undefined;
const fonts = () =>
  (cached ??= {
    display: ['latin', 'latin-ext'].map((s) => fontsource('@fontsource/outfit', `outfit-${s}-800-normal.woff`)),
    bold: ['latin', 'latin-ext'].map((s) => fontsource('@fontsource/outfit', `outfit-${s}-700-normal.woff`)),
    mono: ['latin', 'latin-ext'].map((s) => fontsource('@fontsource/jetbrains-mono', `jetbrains-mono-${s}-500-normal.woff`)),
  });

const num = (v: number) => String(Math.round(v * 100) / 100);

/**
 * SVG path data for one glyph, origin at (x, y) on the baseline, built from the glyph's own commands
 * in font units. Glyph.getPath() in opentype.js 2.0 sometimes emits NaN coordinates after earlier
 * calls (seen on "Products,"), which cuts the rest of the word off; this does the plain transform.
 */
function outline(glyph: Glyph, x: number, y: number, scale: number): string {
  const X = (v: number) => num(x + v * scale);
  const Y = (v: number) => num(y - v * scale);
  let d = '';
  for (const c of glyph.path.commands) {
    if (c.type === 'Z') d += 'Z';
    else if (c.type === 'M' || c.type === 'L') d += `${c.type}${X(c.x!)} ${Y(c.y!)}`;
    else if (c.type === 'Q') d += `Q${X(c.x1!)} ${Y(c.y1!)} ${X(c.x!)} ${Y(c.y!)}`;
    else if (c.type === 'C') d += `C${X(c.x1!)} ${Y(c.y1!)} ${X(c.x2!)} ${Y(c.y2!)} ${X(c.x!)} ${Y(c.y!)}`;
  }
  return d;
}

/**
 * Outlines for one line of text, baseline at y. Glyphs are placed one by one with pair kerning and
 * tracking (in em): opentype.js cannot apply Outfit's contextual substitutions, which the
 * site's copy does not need.
 */
function setText(face: Face, text: string, x: number, y: number, size: number, tracking = 0) {
  let pen = x;
  let d = '';
  let prev: { font: Font; glyph: Glyph } | undefined;
  for (const char of text) {
    const font = face.find((f) => f.charToGlyphIndex(char) > 0) ?? face[0]!;
    const glyph = font.charToGlyph(char);
    const scale = size / font.unitsPerEm;
    if (prev?.font === font) pen += font.getKerningValue(prev.glyph, glyph) * scale;
    d += outline(glyph, pen, y, scale);
    pen += (glyph.advanceWidth ?? 0) * scale + tracking * size;
    prev = { font, glyph };
  }
  return { d, width: pen - x - (text ? tracking * size : 0) };
}

const measure = (face: Face, text: string, size: number, tracking = 0) => setText(face, text, 0, 0, size, tracking).width;

const escapeXml = (s: string) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!);

// ---------- Share image ----------

const W = 1200;
const H = 630;
const LEFT = 72;
const TITLE = { size: 76, lineHeight: 80.5, tracking: -0.02, maxWidth: 680 };
/** The site's .highlight: 0.16em of padding on each side, 0.08em corner radius. */
const HIGHLIGHT_PAD = 0.16;

type Token = { text: string; mark?: 'highlight' | 'accent'; width: number };

/** Title runs as tokens: words, except highlights, which stay whole like the site's inline-block. */
function tokens(card: OgCard, face: Face): Token[] {
  const { size, tracking } = TITLE;
  return card.title.flatMap((run) => {
    const parts = run.mark === 'highlight' ? [run.text.trim()] : run.text.split(/\s+/).filter(Boolean);
    return parts.map((text) => ({
      text,
      mark: run.mark,
      width: measure(face, text, size, tracking) + (run.mark === 'highlight' ? 2 * HIGHLIGHT_PAD * size : 0),
    }));
  });
}

/** Greedy line breaking within the title column. */
function lines(list: Token[], space: number): Token[][] {
  const out: Token[][] = [];
  let line: Token[] = [];
  let width = 0;
  for (const token of list) {
    const next = line.length ? width + space + token.width : token.width;
    if (line.length && next > TITLE.maxWidth) {
      out.push(line);
      line = [token];
      width = token.width;
    } else {
      line.push(token);
      width = next;
    }
  }
  if (line.length) out.push(line);
  return out;
}

function art(tone: OgCard['tone']): string {
  const t = TONES[tone];
  const stops = t.ribbon.map((c, i) => `<stop offset="${i / (t.ribbon.length - 1)}" stop-color="${c}"/>`).join('');
  // The Home hero's left art, mirrored so it sits on the right edge.
  return `<defs><linearGradient id="ribbon" x1="0" y1="0" x2="400" y2="640" gradientUnits="userSpaceOnUse">${stops}</linearGradient><linearGradient id="accent" x1="0" y1="440" x2="220" y2="660" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2F8CF6"/><stop offset="1" stop-color="#5B4FE9"/></linearGradient></defs>
<svg x="780" y="0" width="420" height="630" viewBox="0 0 400 640" preserveAspectRatio="xMinYMid slice"><g transform="translate(400 0) scale(-1 1)">
<path d="${ribbonPath('left-blob')}" fill="${t.blob}"/>
<path d="${ribbonPath('left-ribbon')}" fill="none" stroke="url(#ribbon)" stroke-width="78" stroke-linecap="round"/>
${t.accent ? `<path d="${ribbonPath('left-accent')}" fill="none" stroke="url(#accent)" stroke-width="104" stroke-linecap="round"/>` : ''}
</g></svg>`;
}

/** The share image for one card, as PNG bytes. `origin` is the site's address, e.g. https://example.com. */
export async function renderOgImage(card: OgCard, origin: URL): Promise<Uint8Array<ArrayBuffer>> {
  const f = fonts();
  const { size, lineHeight, tracking } = TITLE;
  const space = measure(f.display, ' ', size) + tracking * size;
  const rows = lines(tokens(card, f.display), space);

  // Vertical metrics of a CSS line box, so the highlight block matches the site's.
  const font = f.display[0]!;
  const ascent = (font.ascender / font.unitsPerEm) * size;
  const descent = (-font.descender / font.unitsPerEm) * size;
  const halfLeading = (lineHeight - ascent - descent) / 2;

  const SUB_GAP = 18;
  const SUB_SIZE = 24;
  const blockHeight = rows.length * lineHeight + (card.sub ? SUB_GAP + SUB_SIZE * 1.3 : 0);
  const top = Math.round(330 - blockHeight / 2);

  let title = '';
  rows.forEach((row, i) => {
    const lineTop = top + i * lineHeight;
    const baseline = lineTop + halfLeading + ascent;
    let x = LEFT;
    row.forEach((token, j) => {
      if (j > 0) x += space;
      if (token.mark === 'highlight') {
        const pad = HIGHLIGHT_PAD * size;
        title += `<rect x="${x.toFixed(1)}" y="${lineTop.toFixed(1)}" width="${token.width.toFixed(1)}" height="${lineHeight}" rx="${(0.08 * size).toFixed(1)}" fill="${TEAL}"/>`;
        title += `<path d="${setText(f.display, token.text, x + pad, baseline, size, tracking).d}" fill="#FFFFFF"/>`;
      } else {
        const fill = token.mark === 'accent' ? TEAL : INK;
        title += `<path d="${setText(f.display, token.text, x, baseline, size, tracking).d}" fill="${fill}"/>`;
      }
      x += token.width;
    });
  });

  const sub = card.sub
    ? `<path d="${setText(f.mono, card.sub, LEFT, top + rows.length * lineHeight + SUB_GAP + SUB_SIZE, SUB_SIZE).d}" fill="${TEAL_INK}"/>`
    : '';
  const address = `${origin.host}${card.path === '/' ? '' : card.path}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<title>${escapeXml(site.name)}</title>
<defs>${LOGO_GRADIENT}</defs>
<rect width="${W}" height="${H}" fill="${PAPER}"/>
${art(card.tone)}
<svg x="${LEFT}" y="60" width="44" height="44" viewBox="0 0 30 30"><path d="${LOGO_PATH}" fill="none" stroke="url(#logo)" stroke-width="6" stroke-linecap="round"/></svg>
<path d="${setText(f.bold, site.name, LEFT + 58, 93, 32).d}" fill="${INK}"/>
${title}
${sub}
<rect x="${LEFT}" y="551" width="40" height="4" rx="2" fill="${CYAN}"/>
<path d="${setText(f.mono, address, LEFT + 56, 561, 22).d}" fill="${INK_2}"/>
</svg>`;

  // A bad number in path data makes the renderer drop the rest of the shape: fail the build instead.
  if (/NaN|Infinity|undefined/.test(svg)) throw new Error(`Share image ${card.path}: invalid coordinates in the SVG.`);
  return new Uint8Array(await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer());
}

// ---------- Icons ----------

/** The logo mark on a square, as PNG. `background` fills the square (iOS and Android need it opaque). */
export async function renderIcon(size: number, { background, inset = 0.18 }: { background?: string; inset?: number } = {}) {
  const box = size * (1 - 2 * inset);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<defs>${LOGO_GRADIENT}</defs>
${background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : ''}
<svg x="${size * inset}" y="${size * inset}" width="${box}" height="${box}" viewBox="0 0 30 30"><path d="${LOGO_PATH}" fill="none" stroke="url(#logo)" stroke-width="6" stroke-linecap="round"/></svg>
</svg>`;
  return new Uint8Array(await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer());
}

/** A .ico file holding PNG images, which every current browser and crawler reads. */
export function toIco(images: { size: number; png: Uint8Array }[]): Uint8Array<ArrayBuffer> {
  const header = 6 + 16 * images.length;
  const total = header + images.reduce((n, i) => n + i.png.length, 0);
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type: icon
  view.setUint16(4, images.length, true);
  let offset = header;
  images.forEach(({ size, png }, i) => {
    const at = 6 + 16 * i;
    view.setUint8(at, size >= 256 ? 0 : size);
    view.setUint8(at + 1, size >= 256 ? 0 : size);
    view.setUint16(at + 4, 1, true); // colour planes
    view.setUint16(at + 6, 32, true); // bits per pixel
    view.setUint32(at + 8, png.length, true);
    view.setUint32(at + 12, offset, true);
    out.set(png, offset);
    offset += png.length;
  });
  return out;
}
