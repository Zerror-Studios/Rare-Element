/**
 * JSON-LD serialisation (PRD-002 SF-10)
 *
 * `JSON.stringify` output placed in a `<script>` can close the tag
 * (`</script>`) when a value contains `<`. Escaping `<`, `>`, `&` and the
 * JS line separators keeps the JSON identical for parsers and inert for
 * the HTML tokenizer.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/utils/json-ld.util.js`
 * and `zcom-backend/packages/core/src/utils/sanitize-html.ts` (PRD-002
 * RMAINT-7).
 */

const LINE_SEPARATOR_PATTERN = new RegExp("\\u2028", "g");
const PARAGRAPH_SEPARATOR_PATTERN = new RegExp("\\u2029", "g");

export const toJsonLd = (data) =>
  JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(LINE_SEPARATOR_PATTERN, "\\u2028")
    .replace(PARAGRAPH_SEPARATOR_PATTERN, "\\u2029");
