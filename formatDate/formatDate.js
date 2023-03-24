/**
 * Format date and time
 *
 * This method has parameters for timezone conversion due to the following:
 *   - Dates are usually shown without timezone on websites and users would
 *     assume that those dates are in their local timezone, but dates in
 *     the database and API responses are usually in UTC timezone.
 *   - Users would key in dates on websites as per their local timezone,
 *     but when they are passed to a backend Node.js server or database,
 *     they are treated as being in the server's timezone which is usually
 *     UTC.
 *
 * @public
 * @example Example of showing a date stored as a UNIX timestamp in the database to a user in Singapore
 *     let timestamp = 1680287445123; // Fri 2023-03-31T18:30:45Z (UTC), Sat 2023-04-01T02:30:45+08:00 (SGT)
 *     let offset = 480; // Singapore (SGT) timezone offset is +08:00, i.e. 480 mins from UTC
 *     formatDate(timestamp, 'weekday-long', 'none'); // "Fri 31 Mar 2023 18:30" wrong for SGT user
 *     formatDate(timestamp, 'weekday-long', 'utc2local', offset); // "Sat 01 Apr 2023 02:30" correct for SGT user
 *     formatDate(timestamp, 'weekday-long', 'local2utc', offset); // "Fri 31 Mar 2023 10:30" wrong for SGT user
 * @example Example of a user in Singapore keying in a date and storing it as a UNIX timestamp in the database (DB)
 *     // Append "Z" to simulate SGT user keying in 01 Apr but treated as 01 Apr UTC when passed to backend server
 *     // This is needed as running `new Date('2023-04-01 02:30:45')` in the browser would already convert it to SGT
 *     let date = '2023-04-01T02:30:45Z';
 *     let offset = 480; // Singapore (SGT) timezone offset is +08:00, i.e. 480 mins from UTC
 *     formatDate(date, 'timestamp', 'none'); // 1680316245 wrong for DB
 *     formatDate(date, 'timestamp', 'utc2local', offset); // 1680345045 wrong for DB
 *     formatDate(date, 'timestamp', 'local2utc', offset); // 1680287445 correct for DB
 * @param {(int|string|Date)} dateValue - UNIX timestamp in seconds, UNIX
 *     timestamp in milliseconds, UNIX timestamp as string, ISO 8601
 *     formatted string or Date object.
 * @param {string} format="iso8601" - Return format (time portion uses 24 hr
 *     time and only has hours & mins), e.g.:
 *     british - "01/04/2023"
 *     date - "2023-04-01" (use this for <input type="date">)
 *     datetime - "2023-04-01T02:30" (use this for <input type="datetime-local">)
 *     iso8601 - "2023-04-01T02:30+08:00"
 *     long - "01 Apr 2023 02:30"
 *     object - Date object returned
 *     parts - Object with various parts of the date, e.g.
 *         {
 *             timestamp_ms: 1680287445123, // integer not string
 *             timestamp_sec: 1680287445, // integer not string
 *             weekday: 'Sat',
 *             year: '2023',
 *             month: '04',
 *             month_name: 'Apr',
 *             day: '01',
 *             hour: '02',
 *             minute: '30',
 *             second: '45',
 *             millisecond: '123',
 *             timezone: '+08:00',
 *         }
 *     short - "24 Mar 2023"
 *     timestamp - 1680287445, // integer not string, truncates milliseconds
 *     timezone - "+08:00"
 *     weekday-long - "Fri 24 Mar 2023 17:30"
 * @param {string} timezoneConversion="none" - Conversion of dateValue to
 *     timezone. Specify "none" to skip conversion of timezone,
 *     "utc2local" to convert date from UTC to local timezone,
 *     "local2utc" to convert date from local timezone to UTC.
 * @param {int} localTimezoneOffsetMins=0 - Client's local timezone offset
 *     from UTC in minutes, e.g. 480 if client is in Singapore timezone.
 *     Note that this value may be negative, e.g. -210 for Newfoundland.
 * @returns {(string|int|object|Date)} Empty string returned if dateValue
 *     cannot be converted to a Date object, else as per return format
 *     specified in `format`.
 */
function formatDate(
    dateValue,
    format = 'iso8601',
    timezoneConversion = 'none',
    localTimezoneOffsetMins = 0
) {
    let dateObj = null;
    let intVal = parseInt(dateValue);

    if (dateValue instanceof Date) {
        dateObj = dateValue;
    } else if (intVal == dateValue) { // assumed UNIX timestamp if numeric, == cos may be int/string
        // Guessing if UNIX timestamp is in seconds or milliseconds (0 taken as empty/invalid),
        // comparing with UNIX timestamp for 2000-01-01T00:00:00Z in milliseconds
        dateObj = (0 === intVal)
            ? null
            : new Date(intVal >= 946684800000 ? intVal : intVal * 1000);
    } else {
        // Assumed to be textual representation like ISO 8601 formatted string
        dateObj = new Date(dateValue);
    }
    if (!dateObj || 'Invalid Date' === dateObj.toString()) {
        return '';
    }

    let convertedDateObj = dateObj;
    if ('utc2local' === timezoneConversion) {
        convertedDateObj = new Date(dateObj.getTime() + (localTimezoneOffsetMins * 60000)); // +
    } else if ('local2utc' === timezoneConversion) {
        convertedDateObj = new Date(dateObj.getTime() - (localTimezoneOffsetMins * 60000)); // -
    }
    if ('object' === format) {
        return convertedDateObj; // exit early
    }

    // Resolve local timezone
    let tzSign = (localTimezoneOffsetMins < 0) ? '-' : '+'; // UTC is +00:00
    let tzHours = Math.floor(Math.abs(localTimezoneOffsetMins) / 60);
    let tzMinutes = Math.abs(localTimezoneOffsetMins) - (tzHours * 60);
    let timezone = tzSign + tzHours.toString().padStart(2, '0')
        + ':' + tzMinutes.toString().padStart(2, '0');

    // Parts - using getUTC<part> and not get<part> methods as the latter
    // will double apply the timezone offset on the converted date object
    // when running in the browser
    let weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    let parts = { // keys use the singular noun
        timestamp_ms: convertedDateObj.getTime(),
        timestamp_sec: Math.trunc(convertedDateObj.getTime() / 1000),
        weekday: weekdays[convertedDateObj.getUTCDay()],
        year: convertedDateObj.getUTCFullYear().toString(),
        month: (convertedDateObj.getUTCMonth() + 1).toString().padStart(2, '0'),
        month_name: months[convertedDateObj.getUTCMonth()],
        day: convertedDateObj.getUTCDate().toString().padStart(2, '0'),
        hour: convertedDateObj.getUTCHours().toString().padStart(2, '0'),
        minute: convertedDateObj.getUTCMinutes().toString().padStart(2, '0'),
        second: convertedDateObj.getUTCSeconds().toString().padStart(2, '0'),
        millisecond: convertedDateObj.getUTCMilliseconds().toString().padStart(3, '0'),
        timezone: timezone,
    };
    if ('parts' === format) {
        return parts; // exit early
    }

    switch (format) {
        case 'british': {
            return `${parts.day}/${parts.month}/${parts.year}`;
        }
        case 'date': {
            return `${parts.year}-${parts.month}-${parts.day}`;
        }
        case 'datetime': {
            return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
        }
        case 'iso8601': {
            return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}${parts.timezone}`;
        }
        case 'long': {
            return `${parts.day} ${parts.month_name} ${parts.year} ${parts.hour}:${parts.minute}`;
        }
        case 'short': {
            return `${parts.day} ${parts.month_name} ${parts.year}`;
        }
        case 'timestamp': {
            // Return w/o milliseconds so that it can be used directly in database column of
            // INT type (UNSIGNED is not supported in standard ANSI SQL and PostgreSQL)
            return parts.timestamp_sec;
        }
        case 'timezone': {
            return parts.timezone;
        }
        case 'weekday-long': {
            return `${parts.weekday} ${parts.day} ${parts.month_name} ${parts.year} ${parts.hour}:${parts.minute}`;
        }
        default: {
            return '';
        }
    }
}
