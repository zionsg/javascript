# autoload.js

_Problem:_

You inherited 100 webpages/webviews of legacy code and they are loading the same set of javascript files,
with some pages loading additional scripts. 
This is run client-side and there is no server-side code to enforce use of templates. 
Do you duplicate the `<script>` tags for every page, like below? And what if you have a new dependency?
```
  <script src="jquery.js"></script>
  <script src="a.js"></script>
  <script src="b.js"></script>
```

_Solution:_

This is a simple script loader - load just this file instead of duplicating multiple `<script>` tags on every page. 
You only need `autoload.js` - the other files in this repo are just for demo purposes.
Yes, some would point to RequireJS, but that was an overkill for my use case 
and I wasn't going to rewrite all the scripts as modules :P
