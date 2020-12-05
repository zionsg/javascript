function isEmpty(value) {
    // (null == value) checks for both (null === value) and (undefined === value)
    // ('null' === value) is to cater for null in JSON cast to string "null"
    if (!value || null == value || 'null' === value) {
        return true;
    }

    // [] not considered empty, hence check length. Note that arrays are specialized objects.
    if (value instanceof Array) {
        return (0 === value.length);
    }

    // {} not considered empty, hence check number of keys
    if (value instanceof Object) {
        return (0 === Object.keys(value).length);
    }

    return false; // considered non-empty if cannot resolve
}
