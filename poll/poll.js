/**
 * Poll a user-defined function till it returns true
 *
 * This can be used to poll the state of a resource after creation to ensure
 * that it has finished provisioning, before creating other resources
 * dependent on it.
 *
 * Note that the poll function is not executed immediately on invocation
 * of this method.
 *
 * @public
 * @link https://en.wikipedia.org/wiki/Exponential_backoff
 * @link https://exponentialbackoffcalculator.com/
 * @param {function(): Promise<boolean>} pollFunction - Async function
 *     to execute for polling. The polling stops when the function returns
 *     true or when the maximum retries is reached.
 * @param {int} maximumAttempts=-1 - Maximum no. of polling attempts. Set
 *     to -1 for infinite no. of attempts.
 * @param {int} intervalMs=1000 - No. of milliseconds between each attempt.
 * @param {boolean} exponentialBackoffFactor=2 - Multiplicative factor
 *     applied on `intervalMs` with each attempt. E.g. if intervalMs=1000
 *     and this value is 2, the 1st attempt is made 1 second after
 *     this method is invoked, the 2nd attempt is made 2 seconds after
 *     the 1st attempt, 3rd attempt 4 secs later, 4th attempt 8 secs later,
 *     and so forth.
 * @returns {Promise<void>}
 * @throws {Error} if invalid poll function, maximum attempts exceeded,
 *     interval too long, etc.
 */
async function poll(
    pollFunction,
    maximumAttempts = -1,
    intervalMs = 1000,
    exponentialBackoffFactor = 2
) {
    if (typeof pollFunction !== 'function') {
        throw new Error('Poll function invalid.');
    }

    let attemptFunction = async function (resolveFunction, rejectFunction, attempts = 0) {
        if (maximumAttempts > 0 && attempts >= maximumAttempts) {
            rejectFunction(`Poll exceeded maximum attempts of ${maximumAttempts}.`);
            return;
        }

        // Insist on boolean to avoid poll functions mistakenly returning API responses
        let pollResult = await pollFunction();
        if (true === pollResult) {
            resolveFunction();
            return;
        }

        let newAttemptCnt = attempts + 1;
        let newIntervalMs = Math.pow(exponentialBackoffFactor, newAttemptCnt) * intervalMs;
        if (!Number.isFinite(newIntervalMs)) { // ensure not NaN and not Infinity (e.g. 1024^1024)
            rejectFunction(`Poll interval too large after ${newAttemptCnt} attempts.`);
            return;
        }

        setTimeout(
            async function () {
                await attemptFunction(resolveFunction, rejectFunction, newAttemptCnt);
            },
            newIntervalMs
        );
    };

    return new Promise((resolve, reject) => {
        setTimeout(
            async function () {
                await attemptFunction(resolve, reject);
            },
            intervalMs
        );
    });
}
