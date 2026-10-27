"use strict";

/**
 * fluent-kit/no-hardcoded-styles
 *
 * Flags hard-coded colors and hard-coded spacing/radius values so UI code
 * uses Fluent `tokens` instead.
 *
 * Reports:
 *  - hex colors, rgb()/hsl()/lab()/etc. in string or template literals
 *  - non-zero numbers or px/rem/em strings for spacing and radius properties
 *
 * Known limits: named colors ("red") and `border: "1px solid"` widths are not
 * checked. Exempt the brand ramp file with an ESLint override (see README).
 */

const COLOR_FN = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\s*\(/i;
const HEX_FULL = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const HEX_INLINE = /(?:^|[\s,(])#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})(?![0-9a-z_-])/i;
const LENGTH = /(?:^|[\s(,])-?\d*\.?\d+(?:px|rem|em)\b/i;

const SPACING_KEYS = new Set([
  "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "paddingBlock", "paddingInline", "paddingBlockStart", "paddingBlockEnd",
  "paddingInlineStart", "paddingInlineEnd",
  "margin", "marginTop", "marginRight", "marginBottom", "marginLeft",
  "marginBlock", "marginInline", "marginBlockStart", "marginBlockEnd",
  "marginInlineStart", "marginInlineEnd",
  "gap", "rowGap", "columnGap",
  "borderRadius", "borderTopLeftRadius", "borderTopRightRadius",
  "borderBottomLeftRadius", "borderBottomRightRadius",
]);

function keyName(prop) {
  if (prop.computed) return null;
  if (prop.key.type === "Identifier") return prop.key.name;
  if (prop.key.type === "Literal" && typeof prop.key.value === "string") return prop.key.value;
  return null;
}

/** @type {import("eslint").Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow hard-coded colors and spacing; use Fluent tokens from @fluentui/react-components",
    },
    schema: [],
    messages: {
      hardcodedColor:
        "Hard-coded color '{{value}}'. Use a token such as tokens.colorNeutralForeground1 or tokens.colorBrandBackground.",
      hardcodedSpacing:
        "Hard-coded value '{{value}}' for '{{key}}'. Use tokens.spacing* or tokens.borderRadius*.",
    },
  },

  create(context) {
    function checkColorText(node, text) {
      if (COLOR_FN.test(text)) {
        context.report({ node, messageId: "hardcodedColor", data: { value: text.trim().slice(0, 40) } });
        return true;
      }
      return false;
    }

    return {
      Literal(node) {
        if (typeof node.value !== "string") return;
        const text = node.value;
        if (checkColorText(node, text)) return;

        const parent = node.parent;
        if (HEX_FULL.test(text)) {
          // Skip import/export sources and obvious non-style attributes like href="#abc".
          if (parent.type === "ImportDeclaration" || parent.type === "ExportNamedDeclaration") return;
          if (parent.type === "JSXAttribute" && parent.name && ["href", "id", "to"].includes(parent.name.name)) return;
          context.report({ node, messageId: "hardcodedColor", data: { value: text } });
          return;
        }

        // Hex inside compound values, only when it is the value of an object property
        // (for example "1px solid #ccc" or a gradient).
        if (parent.type === "Property" && parent.value === node && HEX_INLINE.test(text)) {
          context.report({ node, messageId: "hardcodedColor", data: { value: text.trim().slice(0, 40) } });
        }
      },

      TemplateLiteral(node) {
        const text = node.quasis.map((q) => q.value.cooked || "").join(" ");
        if (COLOR_FN.test(text) || (node.parent.type === "Property" && HEX_INLINE.test(text))) {
          context.report({ node, messageId: "hardcodedColor", data: { value: text.trim().slice(0, 40) } });
        }
      },

      Property(node) {
        const key = keyName(node);
        if (!key || !SPACING_KEYS.has(key)) return;
        const v = node.value;

        if (v.type === "Literal") {
          if (typeof v.value === "number" && v.value !== 0) {
            context.report({ node: v, messageId: "hardcodedSpacing", data: { key, value: String(v.value) } });
          } else if (typeof v.value === "string" && LENGTH.test(v.value)) {
            context.report({ node: v, messageId: "hardcodedSpacing", data: { key, value: v.value } });
          }
        } else if (v.type === "TemplateLiteral") {
          const text = v.quasis.map((q) => q.value.cooked || "").join(" ");
          if (LENGTH.test(text)) {
            context.report({ node: v, messageId: "hardcodedSpacing", data: { key, value: text.trim() } });
          }
        }
      },
    };
  },
};

module.exports = {
  meta: { name: "eslint-plugin-fluent-kit" },
  rules: { "no-hardcoded-styles": rule },
};
