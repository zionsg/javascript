/**
 * Compute start/end of date part for specified date
 *
 * @example Given timestamp of 1678816800000 (Tue 14 Mar 2023 18:00 UTC, Wed 15 Mar 2023 02:00 SGT),
 *      this method will yield the following:
 *      - When run in JavaScript on a browser in Singapore timezone +08:00
 *        (datePart = year, alignment = start): Sun 01 Jan 2023 00:00:00.000 SGT
 *        (year, end): Sun 31 Dec 2023 23:59:59.999 SGT
 *        (month, start): Wed 01 Mar 2023 00:00:00.000 SGT
 *        (month, end): Fri 31 Mar 2023 23:59:59.999 SGT
 *        (day, start): Wed 15 Mar 2023 00:00:00.000 SGT
 *        (day, end): Wed 15 Mar 2023 23:59:59.999 SGT
 *      - When run in Node.js on a server set to UTC timezone +00:00
 *        (datePart = year, alignment = start): Sun 01 Jan 2023 00:00:00.000 UTC
 *        (year, end): Sun 31 Dec 2023 23:59:59.999 UTC
 *        (month, start): Wed 01 Mar 2023 00:00:00.000 UTC
 *        (month, end): Fri 31 Mar 2023 23:59:59.999 UTC
 *        (day, start): Tue Mar 14 2023 00:00:00.000 UTC
 *        (day, end): Tue Mar 14 2023 23:59:59.999 UTC
 * @param {int} timestampMs - UNIX timestamp in milliseconds.
 * @param {string="year","month","day"} datePart - Date part to compute.
 * @param {string="start","end"} alignment - Alignment of date part.
 * @returns {int} UNIX timestamp in milliseconds.
 */
function computeDatePartStartEnd(timestampMs, datePart, alignment) {
    let dateObj = new Date(timestampMs);
    let localTimezoneOffsetMins = 0 - dateObj.getTimezoneOffset(); // e.g. Singapore is +08:00, +480 mins from UTC

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

    // Resolve timezone offset so that result is accurate especially when run in
    // the browser (or when timezone of host machine is not UTC)
    return ('day' === datePart)
        ? computedTimestamp + (2 * (localTimezoneOffsetMins * 60000))
        : (computedTimestamp - (localTimezoneOffsetMins * 60000));
}
