/**
 * Parse Git diff for package-lock.json from running of `npm audit fix`
 *
 * Assuming the commit hash that changed the file is befb97f, run the following
 * to get tmp.diff.txt (prefix with "tmp." as .gitignore would ignore it):
 *     git diff befb97f^! -- ./package-lock.json > tmp.diff.txt
 *
 * This only runs in Node.js and not in the browser due to use of git and fs.
 */

let diff = require('fs').readFileSync('tmp.diff.txt');

let lines = diff.toString().split('\n');
let diffStarted = false;
let matches = [];
let package = '';
let action = '';
let oldVersion = '';
let newVersion = '';
let indent = ' '.repeat(8);
let changes = [
    '### Security',
    '- Run `npm audit fix`.',
    '    + `package-lock.json`: Updated packages.',
];

lines.forEach((line, lineIndex) => {
    if (
        '--- a/package-lock.json' === line
        && '+++ b/package-lock.json' === lines[lineIndex + 1]
    ) {
        diffStarted = true;
    }
    if (!diffStarted) {
        return;
    }

    // There may be lines in the diff containing packages without changes,
    // hence cater for overriding of package name
    matches = line.match(/^(\-|\+)*[ ]+"node_modules\/([^"]+)"/); // don't trim line else spaces in front gone
    if (matches) {
        package = matches[2];
        if (matches[1]) {
            action = ('-' === matches[1]) ? 'remove' : 'add';
        } else {
            action = 'update';
        }
    }
    if (!package) {
        return;
    }

    matches = line.match(/^(\-|\+)[ ]+"version": "([^"]+)"/);
    if (matches) {
        if ('-' === matches[1]) {
            oldVersion = matches[2];
        } else { // +
            newVersion = matches[2];
        }
    }

    let log = '';
    if ('remove' === action && oldVersion) {
        log = `${indent}* \`${package}\`: Removed ${oldVersion}.`;
    } else if ('add' === action && newVersion) {
        log = `${indent}* \`${package}\`: Added ${newVersion}.`;
    } else if ('update' === action && oldVersion && newVersion) {
        log = `${indent}* \`${package}\`: From ${oldVersion} to ${newVersion}.`;
    }

    if (!log) {
        return;
    }

    changes.push(log);
    package = '';
    oldVersion = '';
    newVersion = '';
});

console.log(changes.join('\n'));
