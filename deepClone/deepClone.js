/**
 * Create deep clone of object
 *
 * This is needed as JSON.parse(JSON.stringify(obj)) removes functions.
 * Note that this does not handle circular dependencies.
 *
 * @param {object} obj
 * @returns {object}
 */
function deepClone(obj) {
    if (typeof obj !== 'object' || [null, undefined].includes(obj)) {
        return obj; // do not return {} as this is called recursively on child properties
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
