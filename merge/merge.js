/**
 * Merge 2 objects recursively
 *
 * @param {Object} src - Source object. All properties will be copied over
 *     to result, including those that do not exist in `dst`.
 * @param {Object} dst - Destination object to be merged in. Properties that
 *     exist in `dst` but not in `src` will not be copied over to result.
 *     Values must be of the same type as in `src` and cannot be null.
 * @returns {Object}
 */
function merge(src, dst) {
    let result = {};

    Object.keys(src).forEach((key) => {
        let srcVal = src[key];
        let srcType = typeof srcVal;
        let dstVal = dst?.[key];
        let dstType = typeof dstVal;

        if ([undefined, null].includes(dstVal) || dstType !== srcType) {
            result[key] = srcVal;
        } else if (Array.isArray(srcVal) && Array.isArray(dstVal)) { // check as typeof returns 'object' for array
            result[key] = dstVal; // replace entire array
        } else if ('object' === srcType) {
            result[key] = merge(srcVal, dstVal); // don't allow null (typeof is object) to destroy srcVal structure
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
