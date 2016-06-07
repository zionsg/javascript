/**
 * Calculate local time in a different timezone
 *
 * @link   https://github.com/zionsg/javascript/tree/master/getDateInTimezone for repository
 * @link   http://www.techrepublic.com/article/convert-the-local-time-to-another-time-zone-with-this-javascript/
 * @link   http://jj09.net/javascript-date-a-bad-part/
 * @param  Date        localDate         Note: new Date() uses the timezone of the client browser
 * @param  int|string  timezoneOffset    Eg. 8, UTC+08:00, GMT+0800, +05:30
 * @param  bool        returnAsISOString Default=false. Whether to return as ISO 8601 formatted string or Date object
 * @return Date|string localDate is returned if timezoneOffset is invalid
 */
function getDateInTimezone(localDate, timezoneOffset, returnAsISOString) {
    // Normalize different timezoneOffset formats into (label, sign, hours, minutes) - GMT+08:00, UTC+0800, 8
    var timezoneOffset = ' ' + timezoneOffset, // cast to string in case number is passed in
        matches = timezoneOffset.trim().match(/^(UTC|GMT)?\s*([+\-])?(\d{1,2}):?(\d{2})?$/i);

    if (!matches) {
        return localDate;
    }

    // Calculate offset in hours accounting for fractional offsets like in Indian Standard Time UTC+05:30
    var tzSign = ('-' === matches[2] ? -1 : 1),
        tzHours = parseInt(matches[3]) || 0,
        tzMinutes = parseInt(matches[4]) || 0,
        offsetHours = tzSign * (tzHours + (tzMinutes / 60));

    // getTime() returns ms, getTimezoneOffset() returns result in minutes. Timezones "west" of UTC, eg. Canada,
    // returns positive values while those "east" of UTC, eg. Singapore, returns negative values
    var utc = localDate.getTime() + (localDate.getTimezoneOffset() * 60000), // local time in UTC
        date = new Date(utc + (offsetHours * 3600000)); // 1 hour = 3600s = 3600000ms

    if (returnAsISOString !== true) {
        return date;
    }

    var pad = function (val) { return (val < 10 ? '0' + val : val); },
        dateString = date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
                   + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds())
                   + '.' + date.getMilliseconds()
                   + (-1 === tzSign ? '-' : '+') + pad(tzHours) + ':' + pad(tzMinutes);

    return dateString;
}
