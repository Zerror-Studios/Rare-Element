/**
 * JSON-LD serialisation (PRD-002 SF-10): the kit's `serializeJsonLd`, which
 * escapes `<`, `>`, `&` and the JS line separators so a value can never
 * close the `<script>` tag.
 */

export { serializeJsonLd as toJsonLd } from "@zcom/storefront-kit/core";
