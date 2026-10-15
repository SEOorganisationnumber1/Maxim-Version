// On Netlify, Astro.locals.netlify.context is the function's context (waitUntil, geo, ...).
// It is missing while pages prerender, so it is optional here.
declare namespace App {
  interface Locals extends Partial<import('@astrojs/netlify').NetlifyLocals> {}
}
