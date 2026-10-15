// The small part of opentype.js used by src/lib/og.ts (the package ships no type definitions).
// Its ESM build is imported by path: the package's default entry is a UMD bundle.
declare module 'opentype.js/dist/opentype.mjs' {
  /** One outline command in font units (y points up). */
  export interface PathCommand {
    type: 'M' | 'L' | 'Q' | 'C' | 'Z';
    x?: number;
    y?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  }
  export interface Glyph {
    advanceWidth?: number;
    path: { commands: PathCommand[] };
  }
  export interface Font {
    unitsPerEm: number;
    ascender: number;
    descender: number;
    charToGlyph(char: string): Glyph;
    charToGlyphIndex(char: string): number;
    getKerningValue(left: Glyph, right: Glyph): number;
  }
  export function parse(buffer: ArrayBuffer): Font;
}
