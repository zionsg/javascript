/**
 * Extract ISO 8601 timestamp from filename
 *
 * Formatted string with hyphens and colons is returned for use in Date objects as strings like '20160809T113045'
 * cannot be parsed by `new Date()` or `Date.parse()`.
 *
 * Supported formats in filename:
 *   20160809 (filename must at least contain this - year alone or year with month will not be recognized)
 *   2016-08-09 (date portion can contain hyphens)
 *   20160809T11
 *   20160809T1130 (time portion should at least contain hours and minutes)
 *   20160809T113045
 *   20160809T113045+08
 *   20160809T090045+0530
 *   20160809T033045Z
 *   20160809T013045-0200
 *
 * @example If filename is "test_20160809T113045+0800_01.json", result is "2016-08-09T11:30:45+08:00"
 * @link    https://github.com/zionsg/javascript/tree/master/extractTimestampFromFilename for repository
 * @param   string filename
 * @return  false|string Return false if timestamp cannot be extracted
 */
function extractTimestampFromFilename(filename) {
    var pattern = /(\d{4})\-?(\d{2})\-?(\d{2})(T(\d{2})(\d{2})?(\d{2})?(Z|([+\-])(\d{2})(\d{2})?)?)?/,
        matches = filename.match(pattern);

    if (! matches) {
        return false;
    }

    var dateString = matches[1] + '-' + matches[2] + '-' + matches[3];

    var timeString = (undefined === matches[4])
                   ? ''
                   : 'T' + matches[5] + ':' + (matches[6] || '00') + ':' + (matches[7] || '00');

    var timezoneString = (undefined === matches[8])
                       ? ''
                       : ('Z' === matches[8] ? 'Z' : matches[9] + matches[10] + ':' + (matches[11] || '00'));

    return (dateString + timeString + timezoneString);
}
