/**
 * Export form fields to JSON
 *
 * The use case for this function is to aid in documentation, e.g. document down the values
 * keyed in for each field in a form, hence:
 *   - Hidden and disabled fields will not be included.
 *   - Only the label for each field will be included, not the id/name/class attributes as these
 *     are not normally visible to the user. The label is derived based on best effort as some
 *     forms such as those on AWS do not use <label> to label the fields.
 *   - For checkbox and radio buttons, value is that which is visible to the user and may not be
 *     the actual value for the field. E.g. forms on AWS may set the value of "on" for all radio
 *     buttons in a group and the final value of a selected radio button is "on" which is
 *     meaningless - the label for the radio button should be used in this case instead.
 *
 * This will not be able to capture all fields in a complex form such as those on AWS, especially
 * for sections where users can add/remove rows.
 *
 * @example To use, go to the webpage with the form, get the form ID (or add one), copy the entire
 *          function to the console and run in console: formToJson('myFormId', false);
 * @param {(string|HTMLElement)} formIdOrString - Either the ID or the element containing all the
 *                                                form elements, could be <form> or <div> as some
 *                                                sites like AWS don't use <form>.
 * @param {boolean} returnJson - Default=true. Return JSON if true, text if false.
 * @returns {object[]} [{<label> => <value>}]
 */
function formToJson(formIdOrString, returnAsJson = true) {
    let result = [];

    // Get form elements
    let elements = [];
    let form = ('string' === typeof formIdOrString)
        ? document.getElementById(formIdOrString)
        : formIdOrString;
    if ('form' === form.tagName) {
        elements = form.elements;
    } else {
        elements = form.querySelectorAll('input, select, textarea');
    }

    // Get <label> elements with "for" attribute set
    let labels = []; // <label for attribute> => <label text>
    let labelElements = form.querySelectorAll('label[for]');
    for (let i = 0; i < labelElements.length; i++) {
        let labelElement = labelElements[i];
        labels[labelElement.getAttribute('for')] = labelElement.innerText;
    }

    // Function to get label for element/group
    let getLabel = function (element, forGroup = false) {
        let label = '';

        if (!forGroup) {
            label = labels[element.id] || labels[element.name] || '';
        }

        if (!label) {
            // Hardcode for forms on AWS
            let ancestorElement = element.closest('td');
            let labelElement = ancestorElement
                ? ancestorElement.querySelector('.gwt-HTML')
                : null;
            label = labelElement ? labelElement.innerText : '';
        }

        // Remove linefeeds in labels
        label = label.replace(/<br>|[\r\n]/g, ' ').trim();

        return (label || '');
    }

    // Go thru form elements
    let currResultIndex = -1; // current index in result, not next index
    let groups = { // <type> => [<group name> => <index in result>]
        'checkbox': [],
        'radio': [],
    };
    for (let i = 0; i < elements.length; i++) {
        let element = elements[i];

        // Don't include hidden/disabled elements - capture only visible fields for documentation
        let isHidden = ('hidden' === element.type)
            || ('none' === element.style.display) || ('hidden' === element.style.visibility)
            || (null === element.offsetParent); // element can be hidden if parent is hidden
        if (isHidden || element.disabled) {
            continue;
        }

        let elementTag = element.tagName.toLowerCase();
        let elementLabel = getLabel(element);
        let info = {
            label: elementLabel,
            value: element.value,
        };

        // Exclude <fieldset> - the child elements would already be listed in form.elements
        if ('fieldset' === elementTag) {
            continue;
        }

        // Note that some form elements have no name or id but may have class only, which happens
        // in forms on AWS where a user can add/remove rows. Nevertheless, still include.
        if (!element.name && !element.id) {
            // continue; // commented statement left for reference
        }

        // For checkboxes and radio buttons, collate 1 by 1 and group under same name in result
        // Value should be empty if nothing is checked/ticked. The original values would be put
        // under options - this would cater for checkbox groups with same name, e.g. x[].
        // A single checkbox would be treated as a checkbox group with just 1 member.
        if (['checkbox', 'radio'].includes(element.type)) {
            // Keep track of index in result array that inputs of same name is grouped in
            let groupIndex = groups[element.type][element.name];
            if (undefined === groupIndex) { // current input is 1st input for group
                info.label = getLabel(element, true);
                if (!info.label) { // no point in creating group if cannot resolve group label
                    continue;
                }

                info.value = ''; // clear else this would take on the value of the 1st input
                result.push(info);
                currResultIndex++;

                groupIndex = currResultIndex;
                groups[element.type][element.name] = groupIndex;
            }

            if (element.checked) {
                // Some sites like AWS set the value of all radio buttons in a radio group to
                // "on", making "value" meaningless, hence using the label of the selected value
                // for clarity.
                result[groupIndex].value = elementLabel;
            }

            // Group is created once in result upon hitting the 1st input in group,
            // hence continue, else will have multiple fields in result with same name
            continue;
        }

        // Set value for <select> to label of selected option
        if ('select' === elementTag) {
            info.value = (-1 === element.selectedIndex)
                ? ''
                : element.options[element.selectedIndex].label;
        }

        // No point showing a field where label cannot be resolved
        if (!info.label) {
            continue;
        }

        // Add to result
        result.push(info);
        currResultIndex++;
    } // end for loop over form elements

    if (!returnAsJson) {
        result = result.map(function (obj) {
            return `${obj.label}: ${obj.value}`;
        }).join("\n");
    }

    return result;
}
