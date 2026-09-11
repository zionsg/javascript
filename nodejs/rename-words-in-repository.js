/**
 * Rename words in source code repository, preserving case and zero/single character word separators
 *
 * @example Given "Organization Admin" for `oldWords` and "Organisation User"
 *     for `newWords` (note American vs British spelling), the following
 *     replacements will be made across all files in all subfolders (except
 *     those specified in `excludeFolders`) with extensions matching
 *     `fileExtensions` (not exhaustive):
 *       - "Organization Admin" to "Organisation User"
 *           + "organization admin" to "organisation user"
 *           + "ORGANIZATION ADMIN" to "ORGANISATION USER"
 *       - OrganizationAdmin to OrganisationUser
 *       - organizationAdmin to organisationUser
 *       - organization.admin to organisation.user
 *       - organization-admin to organisation-user
 *       - ORGANIZATION_ADMIN to ORGANISATION_USER
 *       - Organization/Admin to Organisation/User
 * @param {string} oldWords - Old words to be replaced, separated by spaces.
 * @param {string} newWords - New words to be replaced, separated by spaces.
 *     The number of words should be the same as `oldWords`.
 * @param {string} repositoryPath - Absolute path to source code repository.
 * @param {string[]} fileExtensions=['.md', '.css', '.js', '.html'] - Files
 *     with specified extensions will be checked. Extension should include "."
 *     character.
 * @param {string[]} excludeFolders=['.git', 'node_modules', 'tmp'] - Folders
 *     to exclude in search.
 * @returns {object} A temporary folder with the modified files will be created
 *     in the same folder as this script. The original files in `repositoryPath`
 *     will not be modified. Format of result object:
 *         {
 *             path_with_updated_files: <path to temp dir with updated files>,
 *             occurrences: [
 *                 {
 *                   "path": "src/api/database/actor.table.js",
 *                   "line": 123,
 *                   "column": 45,
 *                   "text": "OrganizationAdmin"
 *                 },
 *             ]
 *         }
 * @throws Error if number of old and new words differ.
 * @throws Error if unsupported case for word found. Only lower, UPPER
 *     and Sentence case supported.
 */
function renameWordsInRepository(
    oldWords,
    newWords,
    repositoryPath,
    fileExtensions = ['.md', '.css', '.js', '.html'],
    excludeFolders = ['.git', 'node_modules', 'tmp']
) {
    const fs = require('node:fs');
    const path = require('node:path');

    let oldWordArray = oldWords.trim().split(' ').map((word) => word.trim());
    let newWordArray = newWords.trim().split(' ').map((word) => word.trim());
    if (newWordArray.length !== oldWordArray.length) {
        throw new Error('Number of old and new words differ.');
    }

    let oldWordLowerCaseArray = oldWordArray.map((word) => word.toLowerCase());
    let oldWordUpperCaseArray = oldWordArray.map((word) => word.toUpperCase());
    let oldWordSentenceCaseArray = oldWordArray.map((word) =>
        (word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase())
    );
    let newWordLowerCaseArray = newWordArray.map((word) => word.toLowerCase());
    let newWordUpperCaseArray = newWordArray.map((word) => word.toUpperCase());
    let newWordSentenceCaseArray = newWordArray.map((word) =>
        (word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase())
    );

    let regex = new RegExp(
        oldWordArray.map((word) => `(${word.toLowerCase()})`).join('(.?)'),
        'gi'
    );
    let groupCount = oldWordArray.length + (oldWordArray.length - 1); // words + separators

    let tmpPath = 'tmp.rename-words.'
        + (new Date()).toISOString().replaceAll('-', '').replaceAll(':', '');
    fs.mkdirSync(tmpPath, {
        recursive: true,
    });

    const walkPath = async function (startPath, occurrences) {
        let entries = fs.readdirSync(startPath, { withFileTypes: true });
        for (const entry of entries) {
            let currPath = startPath + '/' + entry.name;
            let relativePath = currPath.slice(repositoryPath.length + 1); // include directory slash

            if (entry.isDirectory()) {
                if (excludeFolders.includes(entry.name)) {
                    continue;
                }

                walkPath(currPath, occurrences);
                continue;
            }

            if (entry.isFile()) {
                if (!fileExtensions.includes(path.extname(entry.name))) {
                    continue;
                }

                let contents = fs.readFileSync(currPath).toString();
                let matches = contents.matchAll(regex);
                let matchCnt = 0;
                let lastMatchIndex = -1;
                let lastMatchLength = -1;
                let updatedContents = '';
                for (const match of matches) { // may have multiple matches in a file
                    let textBeforeMatch = contents.slice(0, match.index);
                    let lines = textBeforeMatch.split('\n');
                    let lineNumber = lines.length;
                    let columnNumber = lines[lines.length - 1].length + 1;
                    matchCnt++;

                    let oldText = '';
                    let newText = '';
                    for (let i = 1; i <= groupCount; i++) {
                        let word = match[i];
                        oldText += word;

                        // Separators are between words in even-numbered groups
                        if (0 === i % 2) {
                            newText += word;
                            continue;
                        }

                        // Words are in odd-numbered groups
                        let wordIndex = Math.floor(i / 2);
                        if (word === oldWordLowerCaseArray[wordIndex]) {
                            newText += newWordLowerCaseArray[wordIndex];
                        } else if (word === oldWordUpperCaseArray[wordIndex]) {
                            newText += newWordUpperCaseArray[wordIndex];
                        } else if (word === oldWordSentenceCaseArray[wordIndex]) {
                            newText += newWordSentenceCaseArray[wordIndex];
                        } else {
                            throw new Error(`Unsupported case for word "${word}" at ${location}`);
                        }
                    }

                    if (-1 === lastMatchIndex) {
                        updatedContents += contents.slice(0, match.index) + newText;
                    } else {
                        updatedContents += contents.slice(lastMatchIndex + lastMatchLength, match.index) + newText;
                    }

                    lastMatchIndex = match.index;
                    lastMatchLength = oldText.length;
                    matchCnt++;
                    occurrences.push({
                        path: relativePath,
                        line: lineNumber,
                        column: columnNumber,
                        text: oldText,
                    });
                } // end for matches

                // Write updated contents to file
                if (lastMatchIndex !== -1) {
                    updatedContents += contents.slice(lastMatchIndex + lastMatchLength);

                    let newFilePath = tmpPath + '/' + relativePath;
                    fs.mkdirSync(path.dirname(newFilePath), {
                        recursive: true,
                    });
                    fs.writeFileSync(newFilePath, updatedContents);
                }
            } // end file entry
        } // end for entries
    }; // end function walkPath()

    let occurrenceArray = [];
    walkPath(repositoryPath, occurrenceArray);
    occurrenceArray.sort((a, b) => {
        // Compare paths
        if (a.path < b.path) {
            return -1;
        } else if (a.path > b.path) {
            return 1;
        }

        // Same path - compare line number
        if (a.line < b.line) {
            return -1;
        } else if (a.line > b.line) {
            return 1;
        }

        // Same line - compare column number
        if (a.column < b.column) {
            return -1;
        } else if (a.column > b.column) {
            return 1;
        }

        return 0;
    });

    return {
        path_with_updated_files: __dirname + '/' + tmpPath,
        occurrences: occurrenceArray,
    };
}
