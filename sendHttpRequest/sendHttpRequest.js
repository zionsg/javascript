const utils = (function () {
    /**
     * Self reference - all public properties/methods are stored here and returned as public API
     *
     * Methods arranged in alphabetical order except for getter-setter pairs.
     *
     * @public
     * @type {object}
     */
    let self = {};

    /**
     * Create new empty response with standard API response format
     *
     * Put in a function so that a new object is always returned. If put in a variable,
     * even with Object.create() or Object.assign(), the properties in the `meta` key for the
     * original variable will be modified.
     *
     * Types for properties must be consistent. All properties must be set if parent property
     * is not null.
     *
     * @public
     * @link https://blog.intzone.com/designing-developer-friendly-json-for-api-responses/
     * @returns {object}
     *   @property {(null|object)} data - Result from success response, null if error response.
     *     @property {object} body - Parsed body of response as JSON object.
     *   @property {(null|object)} error - Error information, null if success response.
     *     @property {string} error.message - Error message.
     *     @property {string} error.body - Original raw body of response.
     *     @property {(null|object)} error.parsedBody - Parsed body of response as JSON object.
     *   @property {(null|object)} meta - Metadata for response.
     *     @property {int} meta.statusCode - HTTP status code of response.
     *     @property {(null|object)} meta.headers - HTTP headers for response.
     *     @property {int} meta.timeTakenMs - Time taken in milliseconds for response to return.
     */
    self.createApiResponse = function () {
        return {
            data: null,
            error: null,
            meta: {
                statusCode: 0,
                headers: null,
                timeTakenMs: 0
            }
        };
    };

    /**
     * Send HTTP request
     *
     * Compatible with IE11.
     * Method parameters ordered according to frequency of usage.
     *
     * @public
     * @link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
     * @param {string} url
     * @param {function(ApiResponse): void} callback - Callback listener to receive response which
     *                                                 is same type as the return result from
     *                                                 createApiResponse().
     * @param {boolean} withCredentials - Default=false. Whether to set
     *                                    XMLHttpRequest.withCredentials to true. Should only be
     *                                    true for API calls that need to send cookies.
     * @param {string} method - Default=GET. HTTP method. Possible values: GET, POST.
     * @param {object} body - Default=null. Request body in JSON, typically for POST requests.
     * @param {object} headers - Default=null. Request headers using header-value pairs.
     * @returns {void}
     */
    self.sendHttpRequest = function (url, callback, withCredentials, method, body, headers) {
        // Resolve defaults as IE11 does not support default parameters
        callback = (undefined === callback) ? null : callback;
        withCredentials = (undefined === withCredentials) ? false : withCredentials;
        method = (undefined === method) ? 'GET' : method;
        body = (undefined === body) ? null : body;
        headers = (undefined === headers) ? null : headers;

        // Init request, response and timer
        let request = new XMLHttpRequest();
        let response = self.createApiResponse();
        let res2 = self.createApiResponse();
        let startTime = Date.now(); // milliseconds

        request.onreadystatechange = function () {
            if (XMLHttpRequest.DONE === request.readyState) {
                // Store status code and compute time taken
                response.meta.statusCode = parseInt(request.status);
                response.meta.timeTakenMs = Date.now() - startTime;

                // Get the raw header string, convert to array and save in response
                let responseHeaders = request.getAllResponseHeaders();
                if (responseHeaders) {
                    let arr = responseHeaders.trim().split(/[\r\n]+/);
                    response.meta.headers = {}; // init to empty object
                    arr.forEach(function (line) {
                        let parts = line.split(': ');
                        let header = parts.shift();
                        let value = parts.join(': ');
                        response.meta.headers[header] = value;
                    });
                }

                // Try to parse body of response as JSON
                let body = request.response;
                let parsedBody = null;
                let parseErrorMessage = '';
                try {
                    // Parse manually cos IE11 don't support responseType
                    parsedBody = JSON.parse(body);
                } catch (err) {
                    parsedBody = null;
                    parseErrorMessage = err.message;
                }

                // Check if success or error response
                if (parsedBody && response.meta.statusCode < 400) {
                    // Success response
                    response.error = null;
                    response.data = {
                        body: parsedBody
                    };
                } else {
                    // Error response
                    response.data = null;
                    response.error = {
                        message: parseErrorMessage || request.statusText,
                        body: body, // raw body
                        parsedBody: parsedBody
                    };
                }

                // Pass response to callback
                if ('function' === typeof callback) {
                    callback(response);
                }

                return;
            }
        };

        // Open request
        // request.responseType = 'json'; // IE11 does not support this
        request.open(method, url, true);
        request.withCredentials = withCredentials; // true to enable use of cookies

        // Set request headers
        // Cannot set Content-Type header else will result in extra OPTIONS preflight request before
        // actual GET request. See "simple request" in
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#Simple_requests
        if (null === headers) {
            headers = {};
        }
        headers['Accept'] = 'application/json';
        Object.keys(headers).forEach(function (key) {
            request.setRequestHeader(key, headers[key]);
        });

        // Send request
        try {
            request.send(JSON.stringify(body));
        } catch (err) {
            // Return response object even if error at this point
            response.data = null;
            response.error = {
                message: err.message,
                body: '',
                parsedBody: null
            };

            if ('function' === typeof callback) {
                callback(response);
            }
        }
    };

    // Return public API of IIFE
    return self;
})();
