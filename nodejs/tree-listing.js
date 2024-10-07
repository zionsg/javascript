/**
 * Get directory and file listing for start path recursively to check which ones exceed
 * 260 character limit for full path length on Windows systems
 *
 * This only runs in Node.js and not in the browser due to the `tree` command.
 */
module.exports = (function () {
    const childProcess = require('child_process');
    const path = require('path');

    main();

    /**
     * @returns {void}
     */
    function main() {
        let startPath = process.argv[2];
        if (!startPath) {
            console.error('Please specify path to start from');
            return;
        }

        let absoluteStartPath = path.resolve(startPath);
        let json = getJson(absoluteStartPath);
        if (!json) {
            console.error('Could not parse JSON.');
            return;
        }

        let results = parse(json.tree);
        let fields = Object.keys(results[0]);
        let listing = fields.join('|') + '\n';
        let failDirCnt = 0;
        let failFileCnt = 0;
        results.forEach((item) => {
            listing += Object.values(item).join('|') + '\n';
            failDirCnt += ('directory' === item.type && item.failed_path);
            failFileCnt += ('file' === item.type && item.failed_path);
        });

        let dirCnt = json.report.directories;
        let fileCnt = json.report.files;
        let output = `Tree listing for ${absoluteStartPath}:\n`
            + `${dirCnt} directories (${dirCnt - failDirCnt} ok, ${failDirCnt} fail)\n`
            + `${fileCnt} files (${fileCnt - failFileCnt} ok, ${failFileCnt} fail)\n\n`
            + listing;

        console.log(output);
    }

    /**
     * @param {string} startPath - Absolute path for start path.
     * @returns {(null|object)} Null returned on error. Format:
     *     {
     *         report: <JSON for report in output from tree command>,
     *         tree: <JSON for directory listing in output from tree command>,
     *     }
     */
    function getJson(startPath) {
        let result = {
            report: null,
            tree: null,
        };

        let jsonArray = null;
        try {
            // If absolute path is given, all entries in contents will be absolute paths instead of starting with "./"
            let contents = childProcess.execSync(`tree --charset unicode --dirsfirst -a -f -n -J "${startPath}"`);
            jsonArray = JSON.parse(contents);
        } catch (err) {
            console.error(err);
            return null;
        }

        if (!Array.isArray(jsonArray)) {
            console.error('Invalid JSON array.');
            return null;
        }

        result.report = jsonArray.filter((item) => ('report' === item.type))[0] ?? null;
        result.tree = jsonArray.filter((item) => ('directory' === item.type))[0] ?? null;
        if (!result.report || !result.tree) {
            console.error('Invalid JSON format.');
            return null;
        }

        return result;
    }

    /**
     * @param {object} tree - JSON for directory listing from output of tree command.
     * @param {int} level - Directory nesting level.
     * @param {boolean} isExceeded=false - Whether the length for the full path of
     *     top-level directory in `tree` JSON exceeds max length of 260 characters
     *     on Windows systems.
     * @returns {object[]} See `entry` in code for format of each object.
     */
    function parse(tree, level = 0, isExceeded = false) {
        let results = [];
        let type = tree.type;
        let name = tree.name;

        let entryPath = name;
        if (name.startsWith('/mnt/c')) {
            entryPath = 'C:' + name.slice('/mnt/c'.length);
        }

        let entry = {
            type: type,
            level: level,
            path_length: entryPath.length,
            failed_path: isExceeded || (entryPath.length >= 260),
            // The following only applies if type is directory, -1 means unset
            dirs: -1, // total no. of nested dirs
            failed_dirs: -1, // no. nested dirs which fail path length check
            passed_dirs: -1, // no. nested dirs which pass path length check
            files: -1, // total no. of nested files
            failed_files: -1, // no. nested files which fail path length check
            passed_files: -1, // no. nested files which pass path length check
            // The entry path applies to all types, placed at the end as values are long
            path: entryPath,
        };

        let childResults = [];
        if ('directory' === type) {
            for (const item of (tree.contents || [])) {
                childResults.push(...parse(item, level + 1, entry.isExceeded));
            }

            let dirs = childResults.filter((item) => ('directory' === item.type));
            let files = childResults.filter((item) => ('file' === item.type));
            entry.dirs = dirs.length;
            entry.failed_dirs = dirs.filter((item) => item.failed_path).length;
            entry.passed_dirs = entry.dirs - entry.failed_dirs;
            entry.files = files.length;
            entry.failed_files = files.filter((item) => item.failed_path).length;
            entry.passed_files = entry.files - entry.failed_files;
        }

        results.push(entry);
        results.push(...childResults);

        return results;
    }
})();
