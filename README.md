Zoey, a mobile framework
========================

What is Zoey?
-------------

Zoey is a mobile framework on top on [zepto.js](http://zeptojs.com/) that aims to be small and fast. The golder rule is: don't generate any extra markup and do everything through progressive enhancements and CSS.

**[Demo](http://StanAngeloff.github.com/zoey/#demo)**

Why?
----
Size matters. At least when it comes to mobile downloads. Zoey tries to keep it simple and weights at only 10KB JavaScript + 30KB CSS.

For comparison, jQuery Mobile is 50KB JavaScript + 50KB CSS. This doesn't include the jQuery library which may or may not be available in the cache.

That's a few KBs off and a good improvement. To speed downloads even further, zepto.js is used instead of the full-blown desktop version of jQuery.

Styling
-------

You want your application to be unique. This is why Zoey uses [Compass](http://beta.compass-style.org/) to allow you to easily customise the default theme.

By overriding predefined variables, you can produce a unique theme of your own. You can even go further and completely re-design the default one, it's entirely up to you.

Platforms
---------

Zoey has been tested on modern mobile browsers and works on Android 2.2+ and iOS 4.2+. Earlier versions might be supported as well, but haven't been tested.

The default theme makes use of CSS3 goodies: multiple backgrounds, gradients, box sizing, etc. Some of these may not be available in previous Android/iOS builds.

Help & How-to
-------------

Since this is an early release, documentation has not been finalised yet. You can refer to [jQuery Mobile](http://jquerymobile.com/test/docs/)'s documentation as it has been the primary source of inspiration for this project.

Poke around the [source code](https://github.com/StanAngeloff/zoey/blob/gh-pages/scripts/zoey.js) as well to find out what's supported.

Contribute
----------

Zoey is very much a work in progress (hence no official release yet).

You can help in a lot of ways: adding documentation, writing tests, performing code reviews, testing on different OSes and versions, opening issues, creating new themes and anything you reckon will benefit the project in general.
