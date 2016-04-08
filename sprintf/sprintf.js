/**
 * Utility functions wrapped using Module pattern
 * Private variables/functions are prefixed with _ to indicate visibility
 */
var utils = (function () {
    /**
     * Self reference - all public vars/methods will be stored in here and returned as public interface
     *
     * @var object
     */
    var self = {};

    /**
     * Simple string replacement function
     *
     * @example sprintf('<img src="%s" class="%s" />', 'a.png', 'beta') => <img src="a.png" class="beta" />
     * @param   string format    Use "%s" as placeholder
     * @param   ...    arguments Add as many arguments as there are %s after the format
     * @return  string
     */
    self.sprintf = function (format) {
        for (var i=1; i < arguments.length; i++) {
            format = format.replace(/%s/, arguments[i]);
        }

        return format;
    }

    // Return public interface
    return self;
})();
