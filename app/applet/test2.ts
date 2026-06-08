import DOMPurify from "isomorphic-dompurify";
console.log("sanitized:", DOMPurify.sanitize("سلام خوبی؟", { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }));
