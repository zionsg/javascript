/**
 * Merge 2 objects recursively
 *
 * @param {Object} src - Source object. All properties will be copied over
 *     to result, including those that do not exist in `dst`.
 * @param {Object} dst - Destination object to be merged in. Properties that
 *     exist in `dst` but not in `src` will not be copied over to result.
 *     Values must be of the same type as in `src` and cannot be null.
 * @param {string[]} overrideProperties=[] - Properties in source object
 *     to override entirely by same properties in destination object,
 *     used especially when the value is an object containing arbitrary keys,
 *     E.g. merge({children:{}}, {children:{john:12, jane:9}}, ['children'])
 *     yields {children:{john:12, jane:9}} instead of {children:{}}.
 * @returns {Object}
 */
function merge(src, dst, overrideProperties = []) {
    let result = {};

    Object.keys(src).forEach((key) => {
        let srcVal = src[key];
        let srcType = typeof srcVal;
        let dstVal = dst?.[key];

        if (overrideProperties.includes(key)) {
            result[key] = dstVal; // replace entire value
        } else if ([undefined, null].includes(dstVal)) { // taken as dstVal is not set
            result[key] = srcVal;
        } else if (Array.isArray(srcVal) && Array.isArray(dstVal)) { // check as typeof returns 'object' for array
            result[key] = dstVal; // replace entire array as non-trivial to determine whether to append or override
        } else if ('object' === srcType) {
            // Don't allow null (typeof is object) to destroy srcVal structure
            result[key] = merge(srcVal, dstVal, overrideProperties);
        } else if ('function' === srcType) {
            result[key] = dstVal; // replace entire function
        } else if ('boolean' === srcType){
            result[key] = Boolean(dstVal);
        } else if ('number' === srcType) {
            result[key] = Number.isInteger(srcVal) ? parseInt(dstVal) : parseFloat(dstVal);
            result[key] = isNaN(result[key]) ? srcVal : result[key];
        } else { // default to string type
            result[key] = dstVal.toString();
        }
    });

    return result;
}
