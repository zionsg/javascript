/**
 * Generate list of Singaporean car plate numbers with checksum
 *
 * @example
 *     let startPlate = 'SNX6835B';
 *     let endPlate = 'SNX7321K';
 *     let result = listCarPlates(startPlate, endPlate, false, ['Z'], [42]);
 *     let favorites = result.filter((row) => row.includes('checksum'));
 *     console.log(favorites.join('\n'));
 * @link https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Singapore
 * @link Enquire Vehicle Numbers Assigned by LTA:
 *     https://vrl.lta.gov.sg/lta/vrl/action/enquireHighestSysNo?FUNCTION_ID=F0103007ET
 * @param {string} startPlate - Start plate, e.g. SNX6835B.
 * @param {string} endPlate - Start plate, e.g. SNX7321K.
 * @param {boolean} listAll=true - Whether to list all generated car plates
 *     or only those that match favoriteChecksums or favoriteNumbers.
 * @param {string[]} favoriteChecksums=[] - List of favorite checksums to check
 *     if car plates end with them.
 * @param {string[]} favoriteNumbers=[] - List of favorite numbers to check if
 *     car plates contain them.
 * @returns {string[]}
 * @throws If any of the method parameters fail validation.
 */
function listCarPlates(startPlate, endPlate, listAll = true, favoriteChecksums = [], favoriteNumbers = []) {
    let result = [];

    if (startPlate.length !== endPlate.length) {
        throw new Error('Start plate must be of same length as end plate.');
    }
    if (startPlate > endPlate) {
        throw new Error('Start plate must be smaller than end plate.');
    }

    let regex = /^([A-Z]+)(\d+)[A-Z]?$/;
    let startMatches = startPlate.match(regex);
    let endMatches = endPlate.match(regex);
    if (!startMatches || !endMatches) {
        throw new Error('Invalid format for start/end plates.');
    }

    let startPrefix = startMatches[1];
    let endPrefix = endMatches[1];
    let startNum = parseInt(startMatches[2]);
    let endNum = parseInt(endMatches[2]);
    if (startPrefix.length !== endPrefix.length) {
        throw new Error('Start plate has different prefix length from end plate.');
    }
    if (startPrefix.length !== 3) {
        throw new Error('Program only works with plates with 3-letter prefix, e.g. SNX.');
    }
    if (startPrefix.substring(0, 1) !== endPrefix.substring(0, 1)) {
        throw new Error('Start plate prefix has different first letter from end plate.');
    }

    let startDigits = [];
    let endDigits = [];
    let platePrefix = startPrefix.substring(0, 1);
    for (let i = 1; i <= 2; i++) { // take last 2 letters of prefix and convert to digit: A=1, B=2, etc.
        startDigits.push(startPrefix.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
        endDigits.push(endPrefix.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    startDigits.push(startNum);
    endDigits.push(endNum);

    let multipliers = [9, 4, 5, 4, 3, 2];
    let checkDigits = [
        'A', 'Z', 'Y', 'X', 'U', 'T', 'S', 'R', 'P', 'M',
        'L', 'K', 'J', 'H', 'G', 'E', 'D', 'C', 'B'
    ];
    for (let a = startDigits[0]; a <= endDigits[0]; a++) {
        for (let b = startDigits[1]; b <= endDigits[1]; b++) {
            for (let c = startDigits[2]; c <= endDigits[2]; c++) {
                let numStr = c.toString().padStart(4, 0);
                let plate = platePrefix + String.fromCharCode(a + 'A'.charCodeAt(0) - 1)
                    + String.fromCharCode(b + 'A'.charCodeAt(0) - 1)
                    + numStr;
                let sum = (a * multipliers[0])
                    + (b * multipliers[1]);

                let digitSum = 0;
                for (let i = 0; i < numStr.length; i++) {
                    sum += parseInt(numStr.substring(i, i + 1)) * multipliers[2 + i];
                    digitSum += parseInt(numStr.substring(i, i + 1));
                }

                let checksum = checkDigits[sum % checkDigits.length];
                plate += checksum;

                let comments = [];
                if (favoriteChecksums.includes(checksum)) {
                    comments.push(`checksum ${checksum}`);
                }
                favoriteNumbers.forEach((num) => {
                    if (plate.includes(num.toString())) {
                        comments.push(`contains ${num}`);
                    }
                });

                if (digitSum === ('Y'.charCodeAt(0) - 'A'.charCodeAt(0) + 1)) { // SNX Y Z
                    comments.push(numStr.split('').join('+') + '=Y');
                }

                let output = plate + (comments.length ? ` (${comments.join(', ')})` : '');
                if (listAll) {
                    result.push(output);
                } else if (comments.length) {
                    result.push(output);
                }
            }
        }
    }

    return result;
}
