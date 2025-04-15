/**
 * Sanitize text
 *
 * @public
 * @param {string} text
 * @returns {string}
 */
function sanitizeText(text) {
    let result = (text ?? '').toString();
    if (!result.length) {
        return result;
    }

    // Replace with single space: \r, tab, no-break space, en space, em space, zero width space
    result = result.replace(/[\r\t\u2002\u2003\u200B]/g, ' ');

    // Reduce multiple consecutive spaces (not whitespace \s which includes newline) to a single space
    result = result.replace(/ {2,}/g, ' ');

    // Replace smart punctuation with normal ASCII forms
    // See https://www.w3.org/wiki/Common_HTML_entities_used_for_typography
    result = result.replace(/[\u201C\u201D\u2033]/g, '"') // “ ” ″
        .replace(/[\u2018\u2019\u2032]/g, "'") // ‘ ’ ′
        .replace(/[\u2010\u2013\u2014]/g, '-'); // ‐ — –
}
