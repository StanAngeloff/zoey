build:
	compass compile --sass-dir="styles/zoey/" --css-dir="styles/zoey/" --images-dir="styles/zoey/" --environment="production" --output-style="compressed" --relative-assets --force
	cat scripts/vendor/zepto.js scripts/zoey.js | uglifyjs -o scripts/zoey.bundle.js
