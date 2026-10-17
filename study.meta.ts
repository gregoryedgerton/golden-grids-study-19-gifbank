import { readFileSync } from "node:fs";
import type { Plugin } from "vite";

/**
 * Every page of a study says what it is in its metadata, from one source.
 * `src/study.json` holds the study's parody name, the one-sentence notice
 * and a label for each HTML entry; this plugin writes them into every
 * entry's <head>, in development and in the build:
 *
 *   <title>      {Brand} - a Golden Grids layout study, with the page's
 *                label in front when the study has more than one page
 *   description  the notice, word for word, which is also the sticky banner
 *   og:*         the same title and notice, and the share card og.png
 *   icons        favicon.svg, favicon-96.png and apple-touch-icon.png: the
 *                letters GIF in the study's colours. The raster ones are
 *                there because share sheets and iOS do not read an SVG icon
 *                and otherwise borrow whatever icon the host last served.
 *
 * Whatever title, description or icon an entry's HTML already carries is
 * replaced, so the entries cannot drift from each other or from the banner.
 */
interface StudyMeta { number: string; name: string; brand?: string; notice: string; pages?: Record<string, string>; repo?: string }
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function studyTitle(study: StudyMeta, file: string): string {
  const site = `${study.brand ?? study.name} - a Golden Grids layout study`;
  const page = study.pages?.[file];
  return page && Object.keys(study.pages ?? {}).length > 1 ? `${page} · ${site}` : site;
}

/** Where the study is published, from its repository: https://github.com/owner/repo → https://owner.github.io/repo/. */
function siteUrl(study: StudyMeta): string | null {
  const m = study.repo?.match(/github\.com\/([^/]+)\/([^/]+)/);
  return m ? `https://${m[1]}.github.io/${m[2]}/` : null;
}

export function studyMeta(): Plugin {
  const study: StudyMeta = JSON.parse(readFileSync(new URL("./src/study.json", import.meta.url), "utf8"));
  return {
    name: "study-meta",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        const file = ctx.path.replace(/^.*\//, "").replace(/\.html$/, "") || "index";
        const title = studyTitle(study, file);
        const site = siteUrl(study);
        const cleaned = html
          .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
          .replace(/<meta\s+name="(description|twitter:card)"[^>]*>\s*/gi, "")
          .replace(/<meta\s+property="og:[a-z_:]+"[^>]*>\s*/gi, "")
          .replace(/<link\s+rel="(icon|apple-touch-icon)"[^>]*>\s*/gi, "")
          .replace(/<!--\s*STUDY:[\s\S]*?-->\s*/g, "");
        const head = [
          `<title>${esc(title)}</title>`,
          `<meta name="description" content="${esc(study.notice)}" />`,
          `<meta property="og:title" content="${esc(title)}" />`,
          `<meta property="og:description" content="${esc(study.notice)}" />`,
          `<meta property="og:type" content="website" />`,
          `<meta property="og:site_name" content="${esc(study.brand ?? study.name)}" />`,
          ...(site ? [
            `<meta property="og:url" content="${site}${file === "index" ? "" : `${file}.html`}" />`,
            `<meta property="og:image" content="${site}og.png" />`,
            `<meta property="og:image:width" content="1200" />`,
            `<meta property="og:image:height" content="630" />`,
            `<meta property="og:image:alt" content="${esc(`${study.brand ?? study.name}, a Golden Grids layout study`)}" />`,
          ] : []),
          `<meta name="twitter:card" content="summary_large_image" />`,
          `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`,
          `<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png" />`,
          `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`,
        ].join("\n    ");
        return cleaned.replace(/<\/head>/i, `    ${head}\n  </head>`);
      },
    },
  };
}
