/**
 * Compute dates for a yearly subscription
 *
 * This method works in the timezone where it is called, either in the
 * browser or on the server.
 *
 * Assuming the yearly subscription was started on 01 Mar 2022, its initial
 * end date would be 28 Feb 2023 (not 01 Mar 2023), and the date ranges for its
 * renewal in subsequent years would be 01 Mar 2023 to 29 Feb 2024,
 * 01 Mar 2024 to 28 Feb 2025, etc.
 *
 * @public
 * @example Given startTimestampSecs of 1646073045
 *      (Tue 28 Feb 2022 18:30:45 UTC, Wed 01 Mar 2022 02:30:45 SGT),
 *      renewalYear = '2023' and years = 1,
 *      this method will yield the following:
 *      - When run in JavaScript on a browser in Singapore timezone +08:00
 *        {
 *            original_start_date: '2022-03-01',
 *            original_start_timestamp: 1646073045,
 *            original_start_string: '2022-03-01T02:30:45+08:00',
 *            start_date: '2023-03-01',
 *            start_timestamp: 1677609045,
 *            start_date_string: '2023-03-01T02:30:45+08:00',
 *            end_date: '2024-02-29',
 *            end_timestamp: 1709145045,
 *            end_date_string: '2024-02-29T02:30:45+08:00',
 *        }
 *      - When run in Node.js on a server set to UTC timezone +00:00
 *        {
 *            original_start_date: '2022-02-28',
 *            original_start_string: '2022-02-28T18:30:45+00:00',
 *            original_start_timestamp: 1646073045,
 *            start_date: '2023-02-28',
 *            start_date_string: '2023-02-28T18:30:45+00:00',
 *            start_timestamp: 1677609045,
 *            end_date: '2024-02-27',
 *            end_date_string: '2024-02-27T18:30:45+00:00',
 *            end_timestamp: 1709058645
 *        }
 * @param {express.Request} request
 * @param {int} startTimestampSecs - Original start date of subscription, UNIX timestamp in seconds.
 * @param {string} renewalYear="" - Year to renew subscription, as 4-digit year string or "now" for
 *     current year. Original start date is used if value is empty. E.g. if start date is
 *     2022-03-01, renewal start date will be 2030-03-01 if value is "2030", but will be
 *     2025-03-01 is value is "now" (assuming now is the year 2025).
 * @param {int} years=1 - Number of years to renew subscription for.
 * @returns {object} See example above.
 */
function computeSubscriptionDates(startTimestampSecs, renewalYear = '', years = 1) {
    // For each Date object, add timezone offset before computing else year/monthIndex/day would be
    // wrong, e.g. 1646073045 (28 Feb 2022 18:30:45 UTC, 01 Mar 2022 02:30:45 SGT) would yield
    // (year 2022, monthIndex 1 which is Feb, day 28) when this method is run in a browser in
    // Singapore timezone +08:00.
    let currDateObj = new Date();
    let localTimezoneOffsetMins = 0 - currDateObj.getTimezoneOffset(); // e.g. Singapore is +08:00, +480 mins from UTC
    currDateObj.setTime(currDateObj.getTime() + (localTimezoneOffsetMins * 60 * 1000));

    let originalStartDateObj = new Date(startTimestampSecs * 1000);
    originalStartDateObj.setTime(originalStartDateObj.getTime() + (localTimezoneOffsetMins * 60 * 1000));

    // Using getUTC<part> and not get<part> methods as the latter will apply the timezone
    // offset when running in the browser (or when timezone of host machine is not UTC).
    // Same for use of setUTC<part> instead of set<part> methods.
    let year = originalStartDateObj.getUTCFullYear();
    let monthIndex = originalStartDateObj.getUTCMonth(); // value is 0 for January not 1
    let day = originalStartDateObj.getUTCDate();
    let hours = originalStartDateObj.getUTCHours();
    let minutes = originalStartDateObj.getUTCMinutes();
    let seconds = originalStartDateObj.getUTCSeconds();

    let startDateObj = new Date(originalStartDateObj.getTime()); // inherits timezone offset hence no need to add again
    if ('now' === renewalYear) {
        startDateObj.setUTCFullYear(currDateObj.getUTCFullYear());
    } else if (4 === renewalYear.toString().length) {
        startDateObj.setUTCFullYear(parseInt(renewalYear));
    }

    let endDateObj = new Date(startDateObj.getTime()); // inherits timezone offset hence no need to add again
    endDateObj.setUTCFullYear(startDateObj.getUTCFullYear() + parseInt(years));
    endDateObj.setUTCDate(day - 1); // minus 1 day while monthIndex stays the same

    // Subtract off timezone offset after computing else time portion would be wrong,
    // e.g. 1646073045 (28 Feb 2022 18:30:45 UTC, 01 Mar 2022 02:30:45 SGT) would yield
    // 01 Mar 2022 10:30:45 SGT when this method is run in a browser in Singapore timezone +08:00
    originalStartDateObj.setTime(originalStartDateObj.getTime() - (localTimezoneOffsetMins * 60 * 1000));
    startDateObj.setTime(startDateObj.getTime() - (localTimezoneOffsetMins * 60 * 1000));
    endDateObj.setTime(endDateObj.getTime() - (localTimezoneOffsetMins * 60 * 1000));

    let getIsoDate = function (dateObj, withTime = false, withTimezoneOffset = false) {
        // This uses get<part> instead of getUTC<part> so that the date shows correctly
        // for the timezone
        let result = dateObj.getFullYear()
            + '-' + (dateObj.getMonth() + 1).toString().padStart(2, '0')
            + '-' + dateObj.getDate().toString().padStart(2, '0');

        if (withTime) {
            result += 'T' + dateObj.getHours().toString().padStart(2, '0')
                + ':' + dateObj.getMinutes().toString().padStart(2, '0')
                + ':' + dateObj.getSeconds().toString().padStart(2, '0');
        }

        if (withTimezoneOffset) {
            let tzSign = (localTimezoneOffsetMins < 0) ? '-' : '+'; // UTC is +00:00
            let tzHours = Math.floor(Math.abs(localTimezoneOffsetMins) / 60);
            let tzMinutes = Math.abs(localTimezoneOffsetMins) - (tzHours * 60);
            result += tzSign + tzHours.toString().padStart(2, '0')
                + ':' + tzMinutes.toString().padStart(2, '0');
        }

        return result;
    };

    return {
        original_start_date: getIsoDate(originalStartDateObj),
        original_start_string: getIsoDate(originalStartDateObj, true, true),
        original_start_timestamp: parseInt(originalStartDateObj.getTime() / 1000),
        start_date: getIsoDate(startDateObj),
        start_date_string: getIsoDate(startDateObj, true, true),
        start_timestamp: parseInt(startDateObj.getTime() / 1000),
        end_date: getIsoDate(endDateObj),
        end_date_string: getIsoDate(endDateObj, true, true),
        end_timestamp: parseInt(endDateObj.getTime() / 1000),
    };
}
