/**
 * Simple script loader - load just this file instead of duplicating multiple <script> tags on every page
 */

/**
 * List of scripts to load in sequence
 *
 * @var array
 */
var scripts = [
    'script01.js',
    'script02.js'
];

/**
 * Load scripts in order at the end of document body
 */
var autoload = (function (scripts) {
    scripts.forEach(function (url) {
        var script = document.createElement('script');

        script.src = url;
        script.async = false; // see http://www.html5rocks.com/en/tutorials/speed/script-loading/#toc-dom-rescue
        document.body.appendChild(script);
    });
})(scripts);
