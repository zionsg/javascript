/**
 * Group items by specified property
 *
 * This can be used to group items for populating a child dropdown
 * that changes its list based on the value of a parent dropdown.
 *
 * @example Given items
 *     [{group:1,id:7,name:'a'}, {group:1,id:8,name:'b'}, {group:2,id:9,name:'c'}, {name:'d'}],
 *     groupItems(items, 'group', ['id', 'name']) will yield the following
 *     and `result?.[groupId] ?? []` can be used to retrieve the items
 *     for a particular group (the group will not appear in result if there
 *     are no items for that group, hence must coalesce to []):
 *     {
 *         '': [ // item did not have "group" property
 *             { id: '', name: 'd' } // item did not have "id" property
 *         ],
 *         '1': [
 *             { id: 7, name: 'a' },
 *             { id: 8, name: 'b' },
 *         ],
 *         '2': [
 *             { id: 9, name: 'c' },
 *         ],
 *     }
 * @param {object[]} items - Items to be grouped.
 * @param {string} groupProperty - Name of property in item to group it by.
 * @param {string[]} itemProperties=[] - Properties to extract for each item
 *     to put in result, e.g. ['id', 'name']. If set to [], entire item will
 *     be put in result.
 * @param {string} fallbackValue="" - Value to use as fallback if an item
 *     does not contain groupProperty or any property in itemProperties.
 * @returns {object} Format:
 *     {
 *         <group 1>: [
 *             <item with only properties specified in itemProperties>,
 *         ],
 *         <group 2>: [
 *             <item>,
 *         ],
 *     }
 */
function groupItems(items, groupProperty, itemProperties = [], fallbackValue = '') {
    let result = {};
    (items || []).forEach((item) => {
        let entry = item;
        if (itemProperties.length > 1) {
            entry = {};
            itemProperties.forEach((property) => {
                entry[property] = item?.[property] ?? fallbackValue;
            });
        }

        let groupValue = item?.[groupProperty] ?? fallbackValue;
        if (!result[groupValue]) {
            result[groupValue] = [];
        }

        result[groupValue].push(entry);
    });

    return result;
}
