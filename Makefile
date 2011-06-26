RELEASE_PATH=release
SCRIPTS_PATH=scripts
VENDOR_PATH=$(SCRIPTS_PATH)/vendor

ZEPTO_VERSION=0.6
ZOEY_VERSION=$(shell sed -n 's/var VERSION\s*=\s*\W*\([0-9.]*\).*/\1/p' scripts/zoey.js)

.PHONY: all
all: cleanup zepto styles minify
	@@echo 'Done. Zoey $(ZOEY_VERSION) built in $(RELEASE_PATH)/'

cleanup:
	@@echo 'Removing release files...'
	@@mkdir -p '$(RELEASE_PATH)/images'
	@@rm -f '$(RELEASE_PATH)/images/'*.png
	@@rm -f '$(RELEASE_PATH)/'*.js
	@@rm -f '$(RELEASE_PATH)/'*.css

zepto:
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

styles:
	@@echo 'Compiling default styles...'
	@@compass compile --quiet --css-dir=styles --sass-dir=styles --images-dir='styles/images' --environment=production --output-style=compressed --relative-assets --force
	@@java -jar _assets/yuicompressor-2.4.6.jar --type css --charset utf8 -o '$(RELEASE_PATH)/zoey-$(ZOEY_VERSION).min.css' 'styles/zoey.css'
	@@mkdir -p '$(RELEASE_PATH)/images'
	@@cp -f 'styles/images/'*.png '$(RELEASE_PATH)/images/'
	@@find '$(RELEASE_PATH)/images' -type f -name '*.png' -exec optipng -o7 {} &>/dev/null \;

minify:
	@@echo 'Minifying bundle...'
	@@cp -f scripts/zoey.js '$(RELEASE_PATH)/zoey.js'
	@@# Save ~250 bytes
	@@sed -i -e "s/'zoey:scroll-top'/C_SCROLL_TOP/g" -e "s/var VERSION/var C_SCROLL_TOP = 'zoey:scroll-top'; \0/" "$(RELEASE_PATH)/zoey.js"
	@@sed -i -e "s/'data-zoey:scroll-top'/'data-' + C_SCROLL_TOP/g" "$(RELEASE_PATH)/zoey.js"
	@@sed -i -e "s/'ui-highlight'/C_HIGHLIGHT/g" -e "s/'.ui-highlight'/'.' + C_HIGHLIGHT/g" -e "s/var VERSION/var C_HIGHLIGHT = 'ui-highlight'; \0/" "$(RELEASE_PATH)/zoey.js"
	@@sed -i -e "s/'ui-collapsed'/C_COLLAPSED/g" -e "s/var VERSION/var C_COLLAPSED = 'ui-collapsed'; \0/" "$(RELEASE_PATH)/zoey.js"
	@@sed -i -e "s/'<div>'/C_DIV/g" -e "s/var VERSION/var C_DIV = '<div>'; \0/" "$(RELEASE_PATH)/zoey.js"
	@@sed -i -e "s/'hashchange'/C_HASHCHANGE/g" -e "s/var VERSION/var C_HASHCHANGE = 'hashchange'; \0/" "$(RELEASE_PATH)/zoey.js"
	@@sed -i -e "s/\.hasClass(/[C_HAS_CLASS](/g" -e "s/var VERSION/var C_HAS_CLASS = 'hasClass'; \0/" "$(RELEASE_PATH)/zoey.js"
	@@sed -i -e "s/\.removeClass(/[C_REMOVE_CLASS](/g" -e "s/'removeClass'/C_REMOVE_CLASS/g" -e "s/var VERSION/var C_REMOVE_CLASS = 'removeClass'; \0/" "$(RELEASE_PATH)/zoey.js"
	@@sed -i -e "s/\.addClass(/[C_ADD_CLASS](/g" -e "s/'addClass'/C_ADD_CLASS/g" -e "s/var VERSION/var C_ADD_CLASS = 'addClass'; \0/" "$(RELEASE_PATH)/zoey.js"
	@@sed -i -e "s/\.data(/[C_DATA](/g" -e "s/var VERSION/var C_DATA = 'data'; \0/" "$(RELEASE_PATH)/zoey.js"
	@@sed -i -e "s/\.attr(/[C_ATTR](/g" -e "s/var VERSION/var C_ATTR = 'attr'; \0/" "$(RELEASE_PATH)/zoey.js"
	@@sed -i -e "s/'ui-/C_UI + '/g" -e "s/var C_SCROLL_TOP/var C_UI = 'ui-'; \0/" "$(RELEASE_PATH)/zoey.js"
	@@sed -i -e "s/'icon-/C_ICON + '/g" -e "s/var VERSION/var C_ICON = 'icon-'; \0/" "$(RELEASE_PATH)/zoey.js"
	@@sed -i -e "s/'\[data-role/C_ROLE + '/g" -e "s/var VERSION/var C_ROLE = '[data-role'; \0/" "$(RELEASE_PATH)/zoey.js"
	@@sed -i -e "s/+ '' +/+/g" "$(RELEASE_PATH)/zoey.js"
	@@uglifyjs -o '$(RELEASE_PATH)/zoey-$(ZOEY_VERSION).min.js' '$(RELEASE_PATH)/zoey.js'
	@@cat '$(VENDOR_PATH)/zepto-$(ZEPTO_VERSION).js' '$(RELEASE_PATH)/zoey.js' | uglifyjs -o '$(RELEASE_PATH)/zoey-$(ZOEY_VERSION).bundle.min.js'
	@@rm -f '$(RELEASE_PATH)/zoey.js'

watch:
	@@compass watch --css-dir=styles --sass-dir=styles --images-dir='styles/images' --environment=development --relative-assets --force

compare-scripts:
	@@echo "BEFORE: `du -b '$(RELEASE_PATH)/zoey-0.2.min.js' | cut -f1`"
	@@$(MAKE) -s -B minify
	@@echo "AFTER:  `du -b '$(RELEASE_PATH)/zoey-0.2.min.js' | cut -f1`"

compare-styles:
	@@echo "BEFORE: `du -b '$(RELEASE_PATH)/zoey-$(ZOEY_VERSION).min.css' | cut -f1`"
	@@$(MAKE) -s -B styles
	@@echo "AFTER:  `du -b '$(RELEASE_PATH)/zoey-$(ZOEY_VERSION).min.css' | cut -f1`"
