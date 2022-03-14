const utils = (function () {
    /** @type {object} Public properties/methods stored here & returned as public interface. */
    const self = {};

    /** @type {int} Max. concurrent AJAX requests allowed, e.g. 5 calls every 1000ms. */
    const AJAX_REQUEST_LIMIT_COUNT = 5;
    const AJAX_REQUEST_LIMIT_PERIOD_MS = 1000;

    /** @type {mixed} For keeping track of current AJAX requests. */
    let ajaxRequestQueue = [];
    let ajaxRequestCompleted = [];
    let ajaxRequestInflight = 0;

    /**
     * Proxy to JavaScript fetch() that implements throttling
     *
     * @public
     * @link https://developer.mozilla.org/en-US/docs/Web/API/fetch
     * @param {(string|Request)} resource - Resource to be fetched, typically a URL.
     *     See link for more info.
     * @param {object} init - Custom settings to apply to request. See link for more info.
     * @param {function(): void} startFunction - Optional function (not in JavaScript specs)
     *     to call when request is actually sent out, e.g. for logging purposes.
     * @returns {Promise<Response>}
     */
    self.fetch = function (resource, init, startFunction = null) {
        // Return a Promise like the original fetch() which actually queues the request
        return new Promise((resolve, reject) => {
            ajaxRequestQueue.push({
                type: 'fetch',
                caller: null, // must set to null else cannot work, cos no instance of anything
                fn: fetch,
                args: [resource, init],
                resolve: resolve,
                reject: reject,
                startFunction: startFunction,
            });

            ajaxProcessQueue();
        });
    };

    /**
     * Proxy to JavaScript XMLHttpRequest that implements throttling
     *
     * @public
     * @link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
     * @param {function(): void} startFunction - Optional function (not in JavaScript specs)
     *     to call when request is actually sent out, e.g. for logging purposes.
     * @returns {XMLHttpRequest}
     */
    self.XMLHttpRequest = function (startFunction = null) {
        // Return a XMLHttpRequest with send() overridden to actually queue the request
        let xhr = new XMLHttpRequest();
        xhr.send = function (body) {
            // Have to return Promise else queue cannot resolve result
            return new Promise((resolve, reject) => {
                ajaxRequestQueue.push({
                    type: 'xhr',
                    caller: xhr, // must pass itself else cannot work
                    fn: XMLHttpRequest.prototype.send, // original send
                    args: [body],
                    resolve: resolve,
                    reject: reject,
                    startFunction: startFunction,
                });

                ajaxProcessQueue();
            });
        };

        return xhr;
    };

    /**
     * Process AJAX request queue
     *
     * As per link, other throttle mechanisms limit the rate of invocation
     * while this implementation limits using the completion time of
     * invocation.
     *
     * @private
     * @link This function and the proxies to fetch() and XMLHttpRequest are
     *     adapted from https://github.com/rhashimoto/promise-throttle repo.
     * @returns {void}
     */
    function ajaxProcessQueue() {
        // Remove completed entries
        let now = Date.now();
        while (
            ajaxRequestCompleted.length
            && ajaxRequestCompleted[0] <= (now - AJAX_REQUEST_LIMIT_PERIOD_MS)
        ) {
            ajaxRequestCompleted.shift();
        }

        // Make calls from the queue that fit within the limit
        while (
            ajaxRequestQueue.length
            && (ajaxRequestCompleted.length + ajaxRequestInflight) < AJAX_REQUEST_LIMIT_COUNT
        ) {
            let request = ajaxRequestQueue.shift();
            ajaxRequestInflight++;

            let startFn = request.startFunction;
            if (startFn && 'function' === typeof startFn) {
                startFn();
            }

            // Set up AbortController to abort Fetch request after 1 hour, else if browser disconnects
            // resulting in ECONNREST error on server side, the caller will be left hanging
            // See https://developer.mozilla.org/en-US/docs/Web/API/AbortController
            let requestTimeoutId = 0;
            if ('fetch' === request.type) {
                let abortController = new AbortController();
                requestTimeoutId = window.setTimeout(() => abortController.abort(), 60 * 60 * 1000);
                request.args[1].signal = abortController.signal; // modify options for Fetch
            }

            // Call the deferred function, fulfilling the wrapper Promise
            // with whatever results and logging the completion time
            let p = request.fn.apply(request.caller, request.args);
            Promise.resolve(p)
                .then(
                    (result) => {
                        if (requestTimeoutId) {
                            window.clearTimeout(requestTimeoutId);
                        }

                        request.resolve(result);
                    },
                    (error) => {
                        if (requestTimeoutId) {
                            console.error('ajaxProcessQueue().then', error, 'Pushing request back to queue');
                            window.clearTimeout(requestTimeoutId);
                            ajaxRequestQueue.push(request); // put request back in queue
                            window.setTimeout(ajaxProcessQueue, AJAX_REQUEST_LIMIT_PERIOD_MS); // schedule next check
                        } else {
                            console.error('ajaxProcessQueue().then', error);
                            request.reject(error);
                        }
                    }
                )
                .then(() => {
                    ajaxRequestInflight--;
                    ajaxRequestCompleted.push(Date.now());

                    if (ajaxRequestQueue.length && 1 === ajaxRequestCompleted.length) {
                        window.setTimeout(ajaxProcessQueue, AJAX_REQUEST_LIMIT_PERIOD_MS); // schedule next check
                    }
                })
                .catch((err) => {
                    if (requestTimeoutId) {
                        console.error('ajaxProcessQueue().catch', err, 'Pushing request back to queue');
                        window.clearTimeout(requestTimeoutId);
                        ajaxRequestQueue.push(request); // put request back in queue
                    } else {
                        console.error('ajaxProcessQueue().catch', err);
                        request.reject(err);
                    }

                });
        } // end while

        // Check the queue on the next expiration
        if (ajaxRequestQueue.length && ajaxRequestCompleted.length) {
            window.setTimeout( // schedule next check
                ajaxProcessQueue,
                ajaxRequestCompleted[0] + AJAX_REQUEST_LIMIT_PERIOD_MS - now
            );
        }
    }

    // Return public inteface of IIFE
    return self;
})();
