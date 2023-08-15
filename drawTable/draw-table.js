/**
 * Draw ASCII table
 *
 * @example drawTable([['A', 'B'], [1, 2], [3, 45], ['ccc', '']], { rows_per_section: 0 }) returns
 *     +-----+----+
 *     | A   | B  |
 *     +-----+----+
 *     | 1   | 2  |
 *     | 3   | 45 |
 *     +-----+----+
 *     | ccc |    |
 *     +-----+----+
 * @param {array[]} rows - Array of same-length arrays, e.g. [ ['A', 'B'], ['cc', ''] ].
 * @param {object} options - Options for drawing table.
 * @param {boolean} options.has_header_row=true - Whether table has header row.
 * @param {boolean} options.has_footer_row=true - Whether table has footer row.
 * @param {int} options.rows_per_section=1 - Rows per section. Divider will be
 *     inserted after every section.
 * @param {int[]} options.max_column_widths=[] - Maximum width for each column,
 *     used for padding columns in each row. Will be computed if unspecified.
 *     E.g. [3, 2] would mean that max width for 1st column (index 0) is
 *     3 characters, and max width for 2nd column (index 1) is 2 characters.
 * @returns {string}
 */
function drawTable(rows, options) {
    let opts = Object.assign(
        {
            has_header_row: true,
            has_footer_row: true,
            rows_per_section: 1,
            max_column_widths: [],
        },
        options || {}
    );

    // Get max width for each column if not provided
    if (0 === Object.keys(opts.max_column_widths || {}).length) {
        rows.forEach((row, rowIndex) => {
            row.forEach((col, colIndex) => {
                opts.max_column_widths[colIndex] = Math.max(
                    (col ?? '').toString().length,
                    opts.max_column_widths[colIndex] ?? 0
                );
            });
        });
    }

    // Divider line
    let resultRows = [];
    let dividerRow = [];
    let divider = '';
    opts.max_column_widths.forEach((colWidth, colIndex) => {
        dividerRow.push('-'.repeat(colWidth || 0));
    })
    divider = '+-' + dividerRow.join('-+-') + '-+';

    let rowCnt = rows.length;
    let currRow = [];
    resultRows.push(divider);
    rows.forEach((row, rowIndex) => {
        currRow = [];
        row.forEach((col, colIndex) => {
            currRow.push((col ?? '').toString().padEnd(opts.max_column_widths[colIndex] ?? 0, ' '));
        });
        resultRows.push('| ' + currRow.join(' | ') + ' |');

        // Insert divider
        if (
            (opts.has_header_row && 0 === rowIndex) // header row
            || (opts.has_footer_row && (rowCnt - 1) === (rowIndex + 1)) // row before footer row
            || (opts.rows_per_section > 0 && (0 === rowIndex % opts.rows_per_section)) // section
        ) {
            resultRows.push(divider);
        }
    });
    if (resultRows[resultRows.length - 1] !== divider) {
        resultRows.push(divider);
    }

    return resultRows.join('\n');
}
