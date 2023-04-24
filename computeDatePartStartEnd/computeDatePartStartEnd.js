/**
 * Compute start/end of date part for specified date
 *
 * Factor in differences in timezone offset for the same region due to
 * Daylight Saving Time (DST) when running this method on a timestamp
 * from summer and validating the answer via third party tools such as
 * https://www.epochconverter.com/ during winter, and vice versa. See notes
 * on DST at
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
 * for more info.
 *
 * @example Given timestamp of 1677609045123
 *      (Tue 28 Feb 2023 18:30:45.123 UTC, Wed 01 Mar 2023 02:30:45.123 SGT),
 *      this method will yield the following:
 *      - When run in JavaScript on a browser in Singapore timezone +08:00
 *        (timestamp, 'year', 'start'):  Sun 01 Jan 2023 00:00:00.000 SGT
 *        (timestamp, 'year', 'end'):    Sun 31 Dec 2023 23:59:59.999 SGT
 *        (timestamp, 'month', 'start'): Wed 01 Mar 2023 00:00:00.000 SGT
 *        (timestamp, 'month', 'end'):   Fri 31 Mar 2023 23:59:59.999 SGT
 *        (timestamp, 'day', 'start'):   Wed 01 Mar 2023 00:00:00.000 SGT
 *        (timestamp, 'day', 'end'):     Wed 01 Mar 2023 23:59:59.999 SGT
 *      - When run in Node.js on a server set to UTC timezone +00:00
 *        (timestamp, 'year', 'start'):  Sun 01 Jan 2023 00:00:00.000 UTC
 *        (timestamp, 'year', 'end'):    Sun 31 Dec 2023 23:59:59.999 UTC
 *        (timestamp, 'month', 'start'): Wed 01 Feb 2023 00:00:00.000 UTC
 *        (timestamp, 'month', 'end'):   Tue 28 Feb 2023 23:59:59.999 UTC
 *        (timestamp, 'day', 'start'):   Tue 28 Feb 2023 00:00:00.000 UTC
 *        (timestamp, 'day', 'end'):     Tue 28 Feb 2023 23:59:59.999 UTC
 * @param {int} timestampMs - UNIX timestamp in milliseconds.
 * @param {string="year","month","day"} datePart - Date part to compute.
 * @param {string="start","end"} alignment - Alignment of date part.
 * @returns {int} UNIX timestamp in milliseconds.
 */
function computeDatePartStartEnd(timestampMs, datePart, alignment) {
    let dateObj = new Date();
    let localTimezoneOffsetMins = 0 - dateObj.getTimezoneOffset(); // e.g. Singapore is +08:00, +480 mins from UTC

    // Add timezone offset before computing else year/monthIndex/day would be wrong,
    // e.g. 1677609045123 (28 Feb 2023 18:30:45 UTC, 01 Mar 2023 02:30:45 SGT) would yield
    // (year 2023, monthIndex 1 which is Feb, day 28) when this method is run in a browser
    // in Singapore timezone +08:00
    dateObj.setTime(timestampMs + (localTimezoneOffsetMins * 60 * 1000));

    // Using getUTC<part> and not get<part> methods as the latter will
    // apply the timezone offset when running in the browser (or when timezone
    // of host machine is not UTC)
    let year = dateObj.getUTCFullYear();
    let monthIndex = dateObj.getUTCMonth(); // value is 0 for January not 1
    let day = dateObj.getUTCDate();

    // Using Date.UTC() not (new Date()).getTime() as the latter will
    // apply the timezone offset when running in the browser (or when timezone
    // of host machine is not UTC)
    let computedTimestamp = timestampMs;
    let isStart = ('start' === alignment);
    if ('year' === datePart) {
        computedTimestamp = isStart
            ? Date.UTC(year, 0, 1, 0, 0, 0, 0) // 1st Jan of the same year
            : Date.UTC(year, 11, 31, 23, 59, 59, 999); // 31 Dec of the same year
    } else if ('month' === datePart) {
        computedTimestamp = isStart
            ? Date.UTC(year, monthIndex, 1, 0, 0, 0, 0) // 1st day of the same month
            : Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999); // last day of the same month
    } else if ('day' === datePart) {
        computedTimestamp = isStart
            ? Date.UTC(year, monthIndex, day, 0, 0, 0, 0) // 00:00 of the same day
            : Date.UTC(year, monthIndex, day, 23, 59, 59, 999); // 23:59 of the same day
    }

    // Subtract off timezone offset after computing else time portion would be wrong,
    // e.g. 1677609045123 (28 Feb 2023 18:30:45 UTC, 01 Mar 2023 02:30:45 SGT) would yield
    // 01 Mar 2023 08:00:00 SGT for start of day when this method is run in a browser
    // in Singapore timezone +08:00
    return (computedTimestamp - (localTimezoneOffsetMins * 60 * 1000));
}
