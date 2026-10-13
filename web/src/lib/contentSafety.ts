import sanitizeHtml from "sanitize-html";

const allowedTags = [
  "p", "br", "strong", "em", "ul", "ol", "li", "blockquote",
  "h2", "h3", "table", "thead", "tbody", "tr", "th", "td", "a", "img",
];

export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return "";
  return sanitizeHtml(input, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      a: ["http", "https", "mailto"],
      img: ["http", "https"],
    },
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
  });
}
