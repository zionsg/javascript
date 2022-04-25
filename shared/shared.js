/**
 * Example of JavaScript code that can be used client-side in the browser and server-side in Node.js
 *
 * Usage in browser:
 *     <script src="shared.js"></script>
 *     <script>
 *         console.log(shared.STATUS_SUCCESS, shared.test()); // note that shared.getTimestamp() won't work
 *     </script>
 *
 * Usage in Node.js:
 *     const shared = require('./shared.js');
 *     console.log(shared.STATUS_SUCCESS, shared.test()); // note that shared.getTimestamp() won't work
 */
(function () { // wrap in Immediately Invoked Function Expression (IIFE) to prevent pollution of global namespace
    /** @type {object} Self reference - all public properties/methods are stored here & returned as public interface. */
    const self = {
        /** @property {string} Constant to refer to success status. See https://github.com/zionsg/status for more. */
        STATUS_SUCCESS: 'success',
    };

    /**
     * Test method
     *
     * @public
     * @returns {string}
     */
    self.test = function () {
        return ('Hello World at ' + getTimestamp() + ' (^ v ^)');
    };

    /**
     * Get current timestamp in ISO 8601 format
     *
     * @private
     * @returns {string}
     */
    function getTimestamp() {
        return (new Date()).toISOString();
    }

    // Return public interface of IIFE for use in browser and server
    // Adapted from https://caolan.uk/notes/2010-07-01_writing_for_node_and_the_browser.cm
    if ('undefined' === typeof exports) { // cannot use `typeof module?.exports` cos module is not defined
        // `this` refers to the window object, the key is the variable name for the script,
        // e.g. if there is a public method y() and this['x'] is used, `x.y()` would be used to call it in the browser.
        this['shared'] = self; // for client-side use in browser
    } else {
        // Cannot use `exports = self` as it is `module.exports` that will be returned in the end
        // See https://stackoverflow.com/a/26451885
        module.exports = self; // for server-side use in Node.js
    }
})();
