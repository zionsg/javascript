/**
 * Simple encryption/decryption using the one-time pad technique in classical cryptography
 *
 * Suitable for end-of-life arrangements for passing on login usernames and passwords to loved ones
 * who may not be so tech-savvy as to handle password managers or perform modern day cryptography.
 *   - This technique can be done manually by hand assuming an ASCII table is readily available.
 *   - The encrypted text can be stored as a QR code on a piece of paper (just scan and paste).
 *   - The encryption key can be written down on a separate piece of paper.
 *   - The ASCII table can be printed on a piece of paper.
 *   - This code can be printed on a piece of paper. And as the code is in plain Javascript,
 *     it can be typed out and saved using any text editor and run in any browser, without having
 *     to install any special software or library dependencies.
 *   - Digital media such as thumbdrives can be lost, damaged or outdated (no one can be sure
 *     that laptops can still read USB thumbdrives in the future). Paper can be laminated and read
 *     without use of technology.
 *
 * Example:
 *   Plain text: Morning!
 *   Encryption key: AB.12
 *
 * Encryption:
 *   Plaintext:  M   o   r   n   i   n   g   !
 *   Text ASCII: 77  111 114 110 105 110 103 33
 *   Key repeat: A   B   .   1   2   A   B   .
 *   Key ASCII:  65  66  46  49  50  65  66  46
 *   ASCII Sum:  142 177 160 159 155 175 169 79
 *   Sum in hex: 8E  B1  A0  9F  9B  AF  A9  4F
 *   Result:     8EB1A09F9BAFA94F (this is the encrypted ciphertext)
 *
 * Decryption:
 *   Ciphertext: 8E  B1  A0  9F  9B  AF  A9  4F
 *   Text ASCII: 142 177 160 159 155 175 169 79
 *   Key repeat: A   B   .   1   2   A   B   .
 *   Key ASCII:  65  66  46  49  50  65  66  46
 *   ASCII Diff: 77  111 114 110 105 110 103 33
 *   ASCII code: M   o   r   n   i   n   g   !
 *   Result:     Morning! (this is the decrypted plaintext)
 *
 * @link http://www.asciitable.com/
 * @link https://en.wikipedia.org/wiki/One-time_pad
 * @link https://en.wikipedia.org/wiki/Classical_cipher
 */

function encrypt(plaintext, encryptionKey) {
    plaintext = plaintext.trim();
    encryptionKey = encryptionKey.trim();

    var result = [];
    var keyArray = encryptionKey.split('');
    var keyArrayLength = keyArray.length;
    var textArray = plaintext.split('');
    var keyCode, charCode, hexCode;

    textArray.forEach(function (element, index) {
        keyCode = (0 === keyArrayLength)
            ? 0
            : keyArray[index % keyArrayLength].charCodeAt(0);
        charCode = element.charCodeAt(0) + keyCode;
        hexCode = parseInt(charCode, 10).toString(16).toUpperCase();
        result.push((1 === hexCode.length) ? '0' + hexCode : hexCode);
    });

    return result.join('');
}

function decrypt(ciphertext, encryptionKey) {
    ciphertext = ciphertext.trim();
    encryptionKey = encryptionKey.trim();

    var result = [];
    var keyArray = encryptionKey.split('');
    var keyArrayLength = keyArray.length;
    var textLength = ciphertext.length;
    var keyCode, hexCode, charCode;

    for (i = 0; i < textLength; i += 2) {
        keyCode = (0 === keyArrayLength)
            ? 0
            : keyArray[(i / 2) % keyArrayLength].charCodeAt(0);
        hexCode = ciphertext.substr(i, 2);
        charCode = parseInt(hexCode, 16) - keyCode;
        result.push(String.fromCharCode(charCode));
    }

    return result.join('');
}

function prettyPrint(text) {
    var result;

    try {
        result = JSON.stringify(JSON.parse(text), null, 2);
    } catch (error) {
        result = text;
    }

    document.write('<pre>' +  result + '</pre>');
}
