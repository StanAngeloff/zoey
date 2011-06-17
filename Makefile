RELEASE_PATH=release
SCRIPTS_PATH=scripts
VENDOR_PATH=$(SCRIPTS_PATH)/vendor

ZEPTO_VERSION=0.6
ZOEY_VERSION=$(shell sed -n 's/var VERSION\s*=\s*\W*\([0-9.]*\).*/\1/p' scripts/zoey.js)

build:
	@@echo 'Removing release files...'
	@@mkdir -p '$(RELEASE_PATH)'
	@@rm -f '$(RELEASE_PATH)/'*.js
	@@rm -f '$(RELEASE_PATH)/'*.css
	@@if [ ! -e '$(VENDOR_PATH)/zepto-$(ZEPTO_VERSION).js' ]; then \
		mkdir -p '$(VENDOR_PATH)' ; \
		echo 'Downloading zepto-$(ZEPTO_VERSION).zip...' ; \
		curl -s -L 'http://zeptojs.com/downloads/zepto-$(ZEPTO_VERSION).zip' > '$(VENDOR_PATH)/zepto-$(ZEPTO_VERSION).zip' ; \
		echo 'Unzipping...' ; \
		unzip -o -qq -d '$(VENDOR_PATH)' '$(VENDOR_PATH)/zepto-$(ZEPTO_VERSION).zip' ; \
		mv '$(VENDOR_PATH)/zepto-$(ZEPTO_VERSION)/dist/zepto.js' '$(VENDOR_PATH)/zepto-$(ZEPTO_VERSION).js' ; \
		echo 'Removing files...' ; \
		rm -f '$(VENDOR_PATH)/zepto-$(ZEPTO_VERSION).zip' ; \
		rm -Rf '$(VENDOR_PATH)/zepto-$(ZEPTO_VERSION)' ; \
	fi
	@@echo 'Compiling default styles...'
	@@compass compile --quiet --css-dir='$(RELEASE_PATH)/' --sass-dir=styles --images-dir=styles --environment=production --output-style=compressed --relative-assets --force
	@@mv '$(RELEASE_PATH)/zoey.css' '$(RELEASE_PATH)/zoey-$(ZOEY_VERSION).min.css'
	@@echo 'Minifying bundle...'
	@@uglifyjs -o '$(RELEASE_PATH)/zoey-$(ZOEY_VERSION).min.js' scripts/zoey.js
	@@cat '$(VENDOR_PATH)/zepto-$(ZEPTO_VERSION).js' scripts/zoey.js | uglifyjs -o '$(RELEASE_PATH)/zoey-$(ZOEY_VERSION).bundle.min.js'
	@@echo 'Done. Zoey $(ZOEY_VERSION) built in $(RELEASE_PATH)/'

benchmark:
	@@echo "BEFORE: `du -b release/zoey-0.2.min.js | cut -f1`"
	@@uglifyjs -o '$(RELEASE_PATH)/zoey-$(ZOEY_VERSION).min.js' scripts/zoey.js
	@@echo "AFTER:  `du -b release/zoey-0.2.min.js | cut -f1`"

.PHONY: build
