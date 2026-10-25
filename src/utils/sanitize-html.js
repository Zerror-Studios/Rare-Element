/**
 * Allowlist HTML sanitiser (PRD-002 SF-10)
 *
 * Product descriptions and additional-info blocks are tenant-authored HTML
 * rendered on the storefront origin, which also serves the same-origin API,
 * so a script in them could act for the shopper. This mirrors the admin's
 * `zcom-frontend/src/utils/sanitize-html.util.ts` policy, but is
 * server-safe: instead of `DOMParser` (browser only) it walks the
 * `domhandler` tree from `html-react-parser`'s `htmlToDOM`, which uses
 * htmlparser2 on the server and the browser parser on the client. No new
 * dependency.
 *
 * - drops dangerous elements with their content (script, style, iframe,
 *   object, form controls, svg, math, template…);
 * - unwraps any other unknown element, keeping its sanitised children;
 * - keeps only allowlisted attributes, so `on*`, `srcdoc`, `formaction`
 *   and friends never survive;
 * - `href` only http(s), mailto, tel and relative; `src` only http(s) and
 *   relative;
 * - drops inline styles that can load or run anything;
 * - forces `rel="noopener noreferrer"` on links with a `target`.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/utils/sanitize-html.util.js`
 * and `zcom-backend/packages/core/src/utils/sanitize-html.ts` (PRD-002
 * RMAINT-7; a shared package is an ADR-level decision).
 */

import { domToReact, htmlToDOM } from "html-react-parser";

// ─── Policy ───────────────────────────────────────────────────────────────

const DROPPED_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "frame",
  "frameset",
  "object",
  "embed",
  "applet",
  "link",
  "meta",
  "base",
  "title",
  "head",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "option",
  "optgroup",
  "datalist",
  "svg",
  "math",
  "template",
  "noscript",
  "noembed",
  "noframes",
  "xmp",
  "plaintext",
  "audio",
  "video",
  "source",
  "track",
  "canvas",
  "dialog",
  "portal",
]);

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "span",
  "div",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "s",
  "strike",
  "del",
  "ins",
  "mark",
  "a",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "td",
  "th",
  "caption",
  "colgroup",
  "col",
  "img",
  "blockquote",
  "pre",
  "code",
  "hr",
  "sub",
  "sup",
  "small",
  "figure",
  "figcaption",
]);

const GLOBAL_ATTRIBUTES = new Set([
  "class",
  "style",
  "title",
  "align",
  "dir",
  "lang",
  "width",
  "height",
  "colspan",
  "rowspan",
  "span",
]);

const TAG_ATTRIBUTES = {
  a: new Set(["href", "target", "rel", "name"]),
  img: new Set(["src", "alt"]),
  ol: new Set(["start", "type"]),
  ul: new Set(["type"]),
  li: new Set(["value"]),
};

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const SAFE_IMAGE_PROTOCOLS = new Set(["http:", "https:"]);
const UNSAFE_STYLE_PATTERN =
  /url\s*\(|expression\s*\(|javascript:|vbscript:|@import|behavior\s*:|-moz-binding|\\/i;
const URL_SCHEME_PATTERN = /^([a-z][a-z0-9+.-]*):/i;
// Browsers ignore control characters and whitespace inside a scheme.
// eslint-disable-next-line no-control-regex
const URL_IGNORED_CHARS_PATTERN = /[\u0000- \u007f-\u009f]/g;

// ─── Checks ───────────────────────────────────────────────────────────────

/** True when `value` is relative or uses an allowed protocol. */
export function isSafeUrl(value, kind) {
  const compact = String(value || "").replace(URL_IGNORED_CHARS_PATTERN, "");
  const scheme = compact.match(URL_SCHEME_PATTERN);
  if (!scheme) return true;

  const protocol = `${scheme[1].toLowerCase()}:`;
  const allowed = kind === "image" ? SAFE_IMAGE_PROTOCOLS : SAFE_LINK_PROTOCOLS;
  return allowed.has(protocol);
}

function sanitizeAttributes(node, tag) {
  const allowedForTag = TAG_ATTRIBUTES[tag];
  const clean = {};

  for (const [name, value] of Object.entries(node.attribs || {})) {
    const lower = name.toLowerCase();
    if (!GLOBAL_ATTRIBUTES.has(lower) && !allowedForTag?.has(lower)) continue;
    if (lower === "href" && !isSafeUrl(value, "link")) continue;
    if (lower === "src" && !isSafeUrl(value, "image")) continue;
    if (lower === "style" && UNSAFE_STYLE_PATTERN.test(value)) continue;
    clean[lower] = value;
  }

  if (tag === "a" && clean.target) clean.rel = "noopener noreferrer";
  node.attribs = clean;
}

// ─── Tree walk ────────────────────────────────────────────────────────────

/** Returns the sanitised copy of a `domhandler` node list. */
function sanitizeNodes(nodes, parent = null) {
  const result = [];

  for (const node of nodes || []) {
    if (node.type === "text") {
      node.parent = parent;
      result.push(node);
      continue;
    }

    // Comments, directives and CDATA never render.
    const isElement =
      node.type === "tag" || node.type === "script" || node.type === "style";
    if (!isElement) continue;

    const tag = String(node.name || "").toLowerCase();
    if (DROPPED_TAGS.has(tag)) continue;

    const children = sanitizeNodes(node.children, node);
    if (!ALLOWED_TAGS.has(tag)) {
      children.forEach((child) => {
        child.parent = parent;
      });
      result.push(...children);
      continue;
    }

    node.children = children;
    node.parent = parent;
    sanitizeAttributes(node, tag);
    result.push(node);
  }

  return result;
}

function textOf(nodes) {
  return (nodes || [])
    .map((node) => {
      if (node.type === "text") return node.data;
      if (DROPPED_TAGS.has(String(node.name || "").toLowerCase())) return "";
      return textOf(node.children);
    })
    .join(" ");
}

// ─── Public API ───────────────────────────────────────────────────────────

/** React elements for `html`, reduced to the allowlist; "" when empty. */
export function sanitizeHtmlToReact(html) {
  if (!html) return "";
  return domToReact(sanitizeNodes(htmlToDOM(String(html))));
}

/** Plain text of an HTML string (for meta descriptions and JSON-LD). */
export function htmlToPlainText(html) {
  if (!html) return "";
  return textOf(htmlToDOM(String(html)))
    .replace(/\s+/g, " ")
    .trim();
}
