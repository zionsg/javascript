/**
 * Output date in local timezone with ISO 8601 format
 *
 * @param {Date} date
 * @returns {string}
 */
function toIsoStringLocal(date) {
    let tz = 0 - date.getTimezoneOffset();
    let sign = (tz >= 0) ? '+' : '-';
    let tzAbs = Math.abs(tz);
    let pad = function (num, padLen = 2) {
        return ('0'.repeat(padLen - num.toString().length) + num);
    };

    return date.getFullYear()
        + '-' + pad(date.getMonth() + 1)
        + '-' + pad(date.getDate())
        + 'T' + pad(date.getHours())
        + ':' + pad(date.getMinutes())
        + ':' + pad(date.getSeconds())
        + '.' + pad(date.getMilliseconds(), 3)
        + sign + pad(Math.floor(tzAbs / 60))
        + ':' + pad(tzAbs % 60);
}
