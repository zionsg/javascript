/**
 * Convert month name to number
 *
 * @param {string} monthName Name of month, e.g. Jan.
 * @returns {string} Number for month padded to 2 digits.
 */
function monthNameToNumber(monthName) {
    let monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let monthIndex = monthNames.map((val) => val.toLowerCase()) // case-insensitive search
        .indexOf(monthName.trim().substring(0, 3).toLowerCase());

    return (monthIndex <= 0 ? '00' : monthIndex.toString().padStart(2, '0'));
}
