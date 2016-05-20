function isEmpty(x) {
    // (null == x) checks for both (null === x) and (undefined === x)
    // ('null' === x) is to cater for null in JSON cast to "null"
    if (!x || null == x || 'null' === x) {
        return true;
    }

    if (x instanceof Array) {
        return (0 === x.length);
    }

    if (typeof x === 'object') {
        for (var prop in x) {
            if (x.hasOwnProperty(prop)) {
                return false;
            }
        }

        return true;
    }

    return false;
}
