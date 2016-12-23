// This is the symbol that gets exported on the server
// the `sanitizeHtml` symbol also gets exported on the client, but it is different from this one and is defined in `editable_text_common.js`
sanitizeHtml = Npm.require('sanitize-html');