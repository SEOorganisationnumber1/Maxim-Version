// The small part of opentype.js used by src/lib/og.ts (the package ships no type definitions).
// Its ESM build is imported by path: the package's default entry is a UMD bundle.
declare module 'opentype.js/dist/opentype.mjs' {
  export interface Path {
    toPathData(decimalPlaces?: number): string;
  }
  export interface Glyph {
    advanceWidth?: number;
    getPath(x: number, y: number, fontSize: number): Path;
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
