/**
 * Create deep clone of object
 *
 * This is needed as JSON.parse(JSON.stringify(obj)) removes functions.
 *
 * @param {object} obj
 * @returns {object}
 */
function deepClone(obj) {
    if (typeof obj !== 'object' || [null, undefined].includes(obj)) {
        return obj;
    }

    let clone = null;
    if (Array.isArray(obj)) { // (typeof []) returns "object"
        clone = [];
        for (let item of obj) {
            clone.push(deepClone(item));
        }
    } else {
        clone = {};
        for (let key in obj) {
            clone[key] = deepClone(obj[key]);
        }
    }

    return clone;
}
