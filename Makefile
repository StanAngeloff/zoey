build:
	compass compile --sass-dir="styles/zoey/" --css-dir="styles/zoey/" --images-dir="styles/zoey/" --environment="production" --output-style="compressed" --relative-assets
	uglifyjs -o scripts/zoey.min.js scripts/zoey.js
