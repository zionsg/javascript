/**
 * Generate list of visually similar variants for input text to prevent homograph attacks
 *
 * @link https://en.wikipedia.org/wiki/IDN_homograph_attack#Homographs_in_ASCII
 * @link https://security.stackexchange.com/a/128463
 * @example Given "D@BS" as input, results will be:
 *     ['DBS', 'DB5', 'D8S', 'D85', '0BS', '0B5', '08S', '085']
 * @param {string} input
 * @returns {string[]} Symbols and whitespace will be removed, digits 
 *     will be replaced by visually similar letters, and all letters 
 *     will be uppercased.
 */
function computeSimilarVariants(input) {
    // Map digits to similar looking letters
    let digitLetterMap = {
        '0': ['D', 'O'],
        '1': ['I', 'l'], // capital i and small L
        '2': ['Z'],
        '3': ['E'], // mirror
        '4': ['h'], // 4 written without the slant looks like inverted "h"
        '5': ['S'],
        '6': ['b', 'G'],
        '7': ['J', 'T'],
        '8': ['B'],
        '9': ['g', 'q'],
    };

    // Standardize to uppercase for all letters and construct reverse map
    let letterDigitMap = {};
    Object.keys(digitLetterMap).forEach((digit) => {
        digitLetterMap[digit].forEach((letter, letterIndex) => {
            letter = letter.toUpperCase();
            digitLetterMap[digit][letterIndex] = letter;

            if (!letterDigitMap[letter]) {
                letterDigitMap[letter] = [];
            }

            letterDigitMap[letter].push(digit.toString());
        });
    });

    let normalizedText = input.toUpperCase().replace(/[^a-z0-9]/gi, '');
    let results = ['']; // empty string as starting result
    normalizedText.split('').forEach((character) => {
        let similarChars = [];
        if (character == parseInt(character)) { // digit
            similarChars = digitLetterMap[character] ?? [];
        } else { // letter
            similarChars = letterDigitMap[character] ?? [];
        }

        let newResults = [];
        results.forEach((partialResult) => {
            newResults.push(partialResult + character);

            similarChars.forEach((similarChar) => {
                newResults.push(partialResult + similarChar);
            });
        });

        // Override
        results = newResults;
    });

    if (!results.includes(normalizedText)) {
        results.unshift(normalizedText);
    }

    return results;
}
