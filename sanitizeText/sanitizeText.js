/**
 * Sanitize text
 *
 * @public
 * @param {string} text
 * @returns {string}
 */
function sanitizeText(text) {
    let result = (text ?? '').toString().trim(); // trim text
    if (!result.length) {
        return result;
    }

    // Remove \r, replace tabs with single spaces, reduce multiple consecutive spaces to a single space
    result = result.replace(/\r/g, '').replace(/\t/g, ' ').replace(/ {2,}/g, ' ');

    // Replace smart punctuation with normal ASCII forms
    // See https://www.w3.org/wiki/Common_HTML_entities_used_for_typography
    result = result.replace(/[“”″]/g, '"').replace(/[‘’′]/g, "'").replace(/[—–]/g, '-');

    return result;
}
