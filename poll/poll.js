/**
 * Poll a user-defined function till it returns true
 *
 * This can be used to poll the state of a resource after creation to ensure
 * that it has finished provisioning, before creating other resources
 * dependent on it.
 *
 * Note that the poll function is not executed immediately on invocation
 * of this method as it is assumed that it will not return true that fast.
 *
 * Exponential backoff with Full Jitter algorithm used as per
 * https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
 * which does not need to keep track of previous interval as in the case
 * of Decorrelated Jitter.
 *
 * @public
 * @link https://en.wikipedia.org/wiki/Exponential_backoff
 * @link https://exponentialbackoffcalculator.com/
 * @param {function(): Promise<boolean>} pollFunction - Async function
 *     to execute for polling. The polling stops when the function returns
 *     true or when `maxAttempts` is reached.
 * @param {int} maxAttempts=-1 - Maximum no. of polling attempts. Set
 *     to -1 for infinite no. of attempts.
 * @param {int} baseIntervalMs=1000 - No. of milliseconds from method
 *     invocation to 1st attempt, used as a base for computing intervals for
 *     subsequent attempts.
 * @param {int} maxIntervalMs=8000 - Maximum no. of milliseconds to wait
 *     till next attempt. On average, the no. of milliseconds between each
 *     attempt will be approximately half of this value.
 * @returns {Promise<void>}
 * @throws {Error} if invalid poll function, error executing poll function,
 *     or maximum attempts exceeded.
 */
async function poll(
    pollFunction,
    maxAttempts = -1,
    baseIntervalMs = 1000,
    maxIntervalMs = 8000
) {
    if (typeof pollFunction !== 'function') {
        throw new Error('Invalid poll function.');
    }

    let attemptFunction = async function (resolveFunction, rejectFunction, attempts = 0) {
        if (maxAttempts > 0 && attempts >= maxAttempts) {
            rejectFunction(`Poll exceeded maximum attempts of ${maxAttempts}.`);
            return;
        }

        // Insist on boolean to avoid poll functions mistakenly returning API responses
        let pollResult = false;
        try {
            pollResult = await pollFunction();
        } catch (err) {
            rejectFunction(`Error executing poll function: ${err.message}.`);
            return;
        }
        if (true === pollResult) {
            resolveFunction();
            return;
        }

        let newAttemptCnt = attempts + 1;
        let newIntervalMs = Math.min(maxIntervalMs, Math.pow(2, newAttemptCnt) * baseIntervalMs);
        if (!Number.isFinite(newIntervalMs)) { // ensure not NaN and not Infinity (e.g. 1024^1024)
            newIntervalMs = maxIntervalMs;
        }

        let newIntervalMsWithJitter = Math.floor(Math.random() * newIntervalMs);
        setTimeout(
            async function () {
                await attemptFunction(resolveFunction, rejectFunction, newAttemptCnt);
            },
            newIntervalMsWithJitter
        );
    };

    // Delayed execution for 1st attempt
    return new Promise((resolve, reject) => {
        setTimeout(
            async function () {
                await attemptFunction(resolve, reject);
            },
            baseIntervalMs
        );
    });
}
