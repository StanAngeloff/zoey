(function(window, document, location) {
/**
 * The MIT License
 *
 * Copyright (c) 2011 Stan Angeloff
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var VERSION = '0.2';
var self = this;
var $topPage;
var $visiblePage;
var $hiddenPage;
var $cachedPages = {};
var $highlight = [];
var pageSequence = 0;
var pageHash;
var $fixedWidgets = [];
function scrollTop(offset) {
  if (arguments.length) {
    document.body.scrollTop = document.documentElement.scrollTop = window.pageYOffset = offset;
  } else {
    return (document.body.scrollTop || document.documentElement.scrollTop || window.pageYOffset);
  }
};
self.showPage = function($page, options) {
  var id = $page.attr('id');
  if ($visiblePage && $visiblePage.attr('id') === id) {
    return self;
  }
  options || (options = {});
  ($hiddenPage && $hiddenPage.attr('id') !== id) && $hiddenPage.trigger('pagebeforehide').trigger('pagehide');
  if (options.type === 'dialog') {
    $hiddenPage = $visiblePage;
    $visiblePage && $visiblePage.data('zoey:scroll-top', scrollTop()).addClass('ui-collapsed');
  } else {
    $hiddenPage = null;
    $visiblePage && $visiblePage.data('zoey:scroll-top', scrollTop()).trigger('pagebeforehide').addClass('ui-collapsed').trigger('pagehide');
  }
  $highlight.length && $highlight.removeClass('ui-highlight');
  $highlight = $page.find('[href="#' + id + '"]').addClass('ui-highlight');
  $visiblePage = $page.trigger('pagebeforeshow').removeClass('ui-collapsed').trigger('pageshow');
  setTimeout(function() {
    scrollTop($visiblePage.data('zoey:scroll-top') || 0);
  }, 125);
  options.event && options.event.stopPropagation();
  $page.get(0).focus();
  return self;
};
self.changePage = function(options) {
  var $page;
  options || (options = {});
  if (typeof (options.target) === 'string') {
    options.target = options.target.replace(/^#/, '');
    $('[data-role="page"]').each(function() {
      if ($(this).attr('id') === options.target) {
        $page = $(this);
        pageHash = options.target;
      }
    });
    if ( ! $page) {
    }
  } else {
    $page = options.target;
  }
  if ($page) {
    self.showPage($page, options);
  } else {
    options.event && options.event.preventDefault();
  }
  return self;
};
self.widgets = {
  page: function() {
    this.delegate('a', 'click', function(event) {
    }).delegate('form', 'submit', function(event) {
    });
    $topPage || ($topPage = this);
    this.addClass('ui-collapsed');
  },
  navigation: function() {
    var $children = this.children();
    $children.addClass('ui-size-' + String.fromCharCode(97 /* 'a' */ + $children.length - 1));
  },
  content: function() {
  },
  list: function() {
  },
  group: function() {
  },
  collapsible: function() {
    var $this = this;
    var $first = $this.children().first();
    var icons = ['arrow-d', 'arrow-r'];
    ($this.data('collapsed') === 'true') && $this.addClass('ui-closed');
    self.role.call($first.data('icon', $this.hasClass('ui-closed') ? icons[1] : icons[0]), 'button');
    $first.bind('click', function() {
      $this.toggleClass('ui-closed');
      if ($this.hasClass('ui-closed')) {
        $first.removeClass('ui-icon-' + icons[0]).addClass('ui-icon-' + icons[1]);
      } else {
        $first.removeClass('ui-icon-' + icons[1]).addClass('ui-icon-' + icons[0]);
      }
    });
  },
  footer: function() {
  }
};
self.role = function(role) {
  var $control = this;
  var widget = self.widgets[role];
  $control.hasClass('ui-' + role) || (widget && widget.call($control));
  $control.addClass('ui-widget ui-' + role);
  ['theme', 'icon'].forEach(function(type) {
    $control.data(type) && $control.addClass('ui-has-' + type + ' ui-' + type + '-' + $control.data(type));
  });
  var themeRegExp = /\bui-theme-(\w+)\b/;
  var getTheme = function() { var list = themeRegExp.exec(this.className); return (list && list[1]); };
  var parent = $control.get(0);
  var inheritedTheme;
  do {
    inheritedTheme = $(parent).data('theme');
    if ( ! inheritedTheme && parent.className.indexOf('ui-theme-') >= 0) {
      inheritedTheme = getTheme.call(parent);
    }
    if (inheritedTheme) {
      break;
    }
  } while ((parent = parent.parentNode) && (parent !== document));
  inheritedTheme || (inheritedTheme = getTheme.call(document.documentElement));
  inheritedTheme && $control.addClass('ui-inherit-theme-' + inheritedTheme);
};
self.initialize = function(scope, options) {
  options || (options = {});
  scope || $('html').addClass('ui-theme-' + (options.theme || 'c'));
  (scope || $('html')).find('[data-role], input[type="button"], input[type="submit"], button').each(function() {
    self.role.apply($(this), [$(this).data('role') || 'button']);
  });
  if ( ! scope) {
    $(window).bind('hashchange', function(event) {
      var value = location.hash.replace(/^#/, '');
      if (pageHash !== value) {
        pageHash = value;
        self.changePage({
          event:  event,
          target: pageHash || $topPage
        });
      }
    }).trigger('hashchange');
    if ( ! window.onhashchange) {
      var last = location.hash;
      setInterval(function() {
        if (last !== location.hash) {
          $(window).trigger('hashchange');
          last = location.hash;
        }
      }, 50);
    }
    window.scrollTo(0, 0);
  }
};
$(document).ready(function() {
  self.preventInitialize || self.initialize();
});
}).apply(this.Zoey = {}, [window, document, location]);
