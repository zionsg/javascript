/**
 * Compute start/end of date part for specified date
 *
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
