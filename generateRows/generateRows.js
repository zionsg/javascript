/**
 * Generate rows of computed values for records
 *
 * @param {object[]} columns - Configuration for columns in each row.
 * @param {string} columns[].title - Title for column.
 * @param {string} columns[].tag - Tag for column. If specified, it must be unique among all the
 *     tags for all columns. This is mainly used for `columns[].rowFunction` where an object
 *     containing tag-columnIndex pairs is passed in for quick reference to computed values for
 *     specific columns in the row data.
 * @param {(string|number)} columns[].value - Value for column. This is used first if specified.
 * @param {function(object, object[], object, string|number[]): string|number} columns[].valueFunction - Function
 *     used to compute value for the column in a data row, taking in
 *     (record, child records for record, metadata, computed values for child records)
 *     and returning a value.
 * @param {function(object, object, object): string|number} columns[].childValueFunction - Function
 *     used to compute value for a child record for the column in a data row, taking in
 *     (record, child record, metadata) and returning a value. The computed values for all the
 *     child records using will be passed to `columns[].valueFunction` which will decide how those
 *     value are aggregated.
 * @param {function(mixed[], int, object): string|number} columns[].rowFunction - Function that
 *     takes in (a data row of computed values, index for this column, tag-columnIndex pairs)
 *     and returns a value which will override the current computed value for the column. This can
 *     be used to compute the value for a column which depends on the computed values of other
 *     columns.
 * @param {function(string|number[]): string|number} columns[].summaryFunction - Function used to
 *     aggregate values from all data rows for the column, taking in those values and returning a
 *     value. The value will be used for the column in the summary row.
 * @param {object[]} records - List of records.
 * @param {object} childRecordsByRecordId=null - Key-value pairs where key is the record ID as per
 *     `recordIdProperty` and value is list of child records belonging to the record.
 * @param {object} metadata=null - Additional key-value pairs which will be passed in to the
 *     functions in `columns`, e.g. related information for each record.
 * @param {string} recordIdProperty="id" - Property in each record of `records` where the record ID
 *     is stored.
 * @returns {array[]} List of rows. The 1st row will always be the header row comprising the
 *     column titles and the last row will always be the summary row comprising aggregate values
 *     for data rows. Sample result:
 *     [
 *         ['Company', 'Founded On', 'Founded By', 'No. of Regions', 'Total No. of Offices'], // header row
 *         ['Acme Corporation', 'Thu Jan 01 1920', 'John Doe', 2, 9], // data row
 *         ['Wayne Enterprises', 'Mon Jan 01 1979', 'Patrick and Laura Wayne', 1, 1], // data row
 *         ['', '', '', 3, 10] // summary row
 *     ]
 */
function generateRows(columns, records, childRecordsByRecordId = null, metadata = null, recordIdProperty = 'id') {
    let columnTemplate = {
        title: '',
        tag: '',
        value: undefined, // needs to be undefined and not ""
        valueFunction: null, // function (record, childRecords, metadata, childValues) { return ''; }
        childValueFunction: null, // function (record, childRecord, metadata) { return ''; }
        rowFunction: null, // function (row, columnIndex, tagColumnIndices) { return row[columnIndex]; }
        summaryFunction: null, // function (rowValues) { return rowValues.reduce((sum, value) => (sum + value), 0); }
    };

    let headerRow = [];
    let dataRowTemplate = [];
    let summaryRow = [];
    let tagColumnIndices = {}; // key-value pairs where key is column.tag and value is column index
    let functionColumnIndices = {
        childValueFunction: [],
        rowFunction: [],
        summaryFunction: [],
    };
    columns.forEach((column, columnIndex) => {
        column = Object.assign({}, columnTemplate, column);
        headerRow.push(column.title);

        if (column.tag) {
            tagColumnIndices[column.tag] = columnIndex;
        }

        if ('function' === typeof column.childValueFunction) {
            dataRowTemplate.push([]);
            functionColumnIndices.childValueFunction.push(columnIndex);
        } else {
            dataRowTemplate.push('');
        }

        if ('function' === typeof column.rowFunction) {
            functionColumnIndices.rowFunction.push(columnIndex);
        }

        if ('function' === typeof column.summaryFunction) {
            summaryRow.push([]);
            functionColumnIndices.summaryFunction.push(columnIndex);
        } else {
            summaryRow.push('');
        }
    });

    let getDataRow = function (dataRowIndex, record, childRecords) {
        let row = structuredClone(dataRowTemplate);
        let fn = null;

        if (functionColumnIndices.childValueFunction.length !== 0) {
            childRecords.forEach((childRecord) => {
                // The columns without the function will retain their default values
                functionColumnIndices.childValueFunction.forEach((columnIndex) => {
                    fn = columns[columnIndex].childValueFunction;
                    row[columnIndex].push(fn(record, childRecord, metadata));
                });
            });
        }

        columns.forEach((column, columnIndex) => {
            if (column.value !== undefined) {
                row[columnIndex] = column.value;
            } else if ('function' === typeof column.valueFunction) {
                row[columnIndex] = column.valueFunction(
                    record,
                    childRecords,
                    metadata,
                    Array.isArray(row[columnIndex]) ? row[columnIndex] : []
                );
            } // no need for else as there is a default value

            if (Array.isArray(summaryRow[columnIndex])) {
                summaryRow[columnIndex][dataRowIndex] = row[columnIndex];
            }
        });

        if (functionColumnIndices.rowFunction.length !== 0) {
            functionColumnIndices.rowFunction.forEach((columnIndex) => {
                fn = columns[columnIndex].rowFunction;
                row[columnIndex] = fn(row, columnIndex, tagColumnIndices);

                // Update summary values on value for column in row
                if (Array.isArray(summaryRow[columnIndex])) {
                    summaryRow[columnIndex][dataRowIndex] = row[columnIndex];
                }
            });
        }

        return row;
    };

    let rows = [headerRow];
    records.forEach((record, recordIndex) => {
        rows.push(
            getDataRow(
                recordIndex,
                record,
                childRecordsByRecordId?.[record[recordIdProperty]] ?? []
            )
        );
    });

    if (functionColumnIndices.summaryFunction.length !== 0) {
        let fn = null;

        functionColumnIndices.summaryFunction.forEach((columnIndex) => {
            fn = columns[columnIndex].summaryFunction;
            summaryRow[columnIndex] = fn(summaryRow[columnIndex]);
        });
    }
    rows.push(summaryRow);

    return rows;
}
