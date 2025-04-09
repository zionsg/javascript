let maxLevel = parseInt(process.argv[2]) || 0;
if (maxLevel < 1) {
    console.log('Syntax: node <script> <maximum no. of nesting levels>');
} else {
   createNestedFolders(maxLevel);
}

/**
 * Create nested folders for testing directory crawling code
 *
 * 26 folders and 26 files will be created at the 1st level based on alphabet.
 * This will be repeated inside the first folder of each level.
 *
 * @param {int} maxLevel - Maximum nesting level to avoid ENAMETOOLONG
 *     error with mkdir(), typically when path length exceeds 4096 characters.
 *     Testing shows error with value of 813, with value of 812 taking 2638 ms.
 * @returns {void}
 */
function createNestedFolders(maxLevel) {
    const fs = require('fs');
    const letters = [...Array('z'.charCodeAt(0) - 'a'.charCodeAt(0) + 1).keys()]
        .map((i) => String.fromCharCode(i + 'a'.charCodeAt(0))); // letters from a to z

    let padLen = maxLevel.toString().length;
    let fn = function (startPath, level = 1) {
        if (level > maxLevel) {
            return;
        }

        let levelStr = level.toString().padStart(padLen, '0');
        letters.forEach((letter, letterIndex) => {
            // Folders use uppercase letters so that they appear alphabetically before files using lowercase letters
            let folderPath = `${startPath}/${letter.toUpperCase()}${levelStr}`;
            let filePath = `${startPath}/${letter}${levelStr}.txt`;

            // Sync versions for fs methods used to reduce memory leak
            fs.writeFileSync(filePath, filePath);
            fs.mkdirSync(folderPath, { recursive: true });

            if (0 === letterIndex) {
                console.log(
                    (new Date()).toISOString(),
                    `Level: ${levelStr}`,
                    `(heap used: ${process.memoryUsage().heapUsed})`
                );

                // Only do for 1st folder else will take forever once level hits 5
                fn(folderPath, level + 1);
            }
        });
    };

    // Create container folder instead of polluting folder where script is run
    // The container folder itself is level 0
    let startTimeMs = Date.now();
    let containerPath = `tmp-max${maxLevel}-`
        + (new Date(startTimeMs)).toISOString().replace(/[^a-z0-9]/gi, '');

    fs.mkdirSync(containerPath, { recursive: true });
    fn(containerPath);

    console.log(
        `Created directory "${containerPath}" with ${maxLevel} nesting levels in `
        + (Date.now() - startTimeMs) + ' ms.'
    );
}
