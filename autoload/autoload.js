/**
 * Simple script loader - load just this file instead of duplicating multiple <script> tags on every page
 */

// List of scripts to load in sequence
var scripts = [
    'js/script01.js',
    'js/script02.js'
];

// Load scripts in order at the end of document body
var autoload = (function (scripts) {
    // Look for a "data-autoload" script attribute, which allows individual pages to append page-specific scripts
    var scriptTags = document.getElementsByTagName('script'),
        autoloadScript;

    for (var i = 0; i < scriptTags.length; i++) {
        autoloadScript = scriptTags[i].getAttribute('data-autoload');
        if (autoloadScript) {
            scripts.push(autoloadScript);
            break;
        }
    }

    // Create <script> element for each script
    scripts.forEach(function (url) {
        var script = document.createElement('script');

        script.src = url;
        script.async = false; // see http://www.html5rocks.com/en/tutorials/speed/script-loading/#toc-dom-rescue
        document.body.appendChild(script);
    });
})(scripts);
