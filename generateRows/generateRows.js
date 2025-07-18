/**
 * Generate rows of computed values for records
 *
 * @param {object[]} columns - Configuration for columns in each row.
 * @param {string} columns[].title - Title for column.
 * @param {function(object, object[], object): string|number} columns[].valueFunction - Function
 *     used to compute value for the column, taking in (record, child records for record, metadata)
 *     and returning a value. This is ignored if `columns[].childAggregateFunction` is set.
 * @param {function(object, object, object): string|number} columns[].childValueFunction - Function
 *     used to compute value for a child record, taking in (record, child record, metadata)
 *     and returning a value. The value will be aggregated with computed values for the other
 *     child records using `columns[].childAggregateFunction` to compute value for the column.
 *     This is ignored if `columns[].valueFunction` is set.
 * @param {function(number[]): number} columns[].childAggregateFunction - Function used to
 *     aggregate computed values of child records (each computed by `columns[].childValueFunction`),
 *     taking in those computed values and returning a value. This is ignored if
 *     `columns[].valueFunction` is set.
 * @param {function(number[]): number} columns[].summaryFunction - Function used to aggregate
 *     values from all data rows for the column, taking in those values and returning a value.
 *     The value will be used for the column in the summary row.
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
        valueFunction: null, // function (record, childRecords, metadata) { return ''; }
        childValueFunction: null, // function (record, childRecord, metadata) { return ''; }
        childAggregateFunction: null, // function (values) { return values.reduce((sum, value) => (sum + value), 0); }
        summaryFunction: null, // function (rowValues) { return rowValues.reduce((sum, value) => (sum + value), 0); }
    };

    let headerRow = [];
    let dataRowTemplate = [];
    let summaryRow = [];
    let hasSummaryFunction = false;
    columns.forEach((column) => {
        column = Object.assign({}, columnTemplate, column);
        headerRow.push(column.title);
        dataRowTemplate.push('function' === typeof column.childValueFunction ? [] : '');

        if ('function' === typeof column.summaryFunction) {
            hasSummaryFunction = true;
            summaryRow.push([]);
        } else {
            summaryRow.push('');
        }
    });

    let getDataRow = function (record, childRecords) {
        let row = structuredClone(dataRowTemplate);

        childRecords.forEach((childRecord) => {
            columns.forEach((column, columnIndex) => {
                if ('function' === typeof column.childValueFunction) {
                    row[columnIndex].push(column.childValueFunction(record, childRecord, metadata));
                } // no need for else as there is already a default value
            });
        });

        columns.forEach((column, columnIndex) => {
            if ('function' === typeof column.childAggregateFunction) {
                row[columnIndex] = column.childAggregateFunction(row[columnIndex]);
            } else if ('function' === typeof column.valueFunction) {
                row[columnIndex] = column.valueFunction(record, childRecords, metadata);
            } // no need for else as there is already a default value

            if (Array.isArray(summaryRow[columnIndex])) {
                summaryRow[columnIndex].push(row[columnIndex]);
            }
        });

        return row;
    };

    let rows = [headerRow];
    records.forEach((record) => {
        rows.push(
            getDataRow(record, childRecordsByRecordId?.[record[recordIdProperty]] ?? [])
        );
    });

    if (hasSummaryFunction) {
        columns.forEach((column, columnIndex) => {
            if ('function' === typeof column.summaryFunction) {
                summaryRow[columnIndex] = column.summaryFunction(summaryRow[columnIndex]);
            }
        });
    }
    rows.push(summaryRow);

    return rows;
}
