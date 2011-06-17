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
var pageSequence = 0;
var pageHash;
var $fixedWidgets = [];
var SCROLLTOP = 'zoey:scroll-top';
function scrollTop(offset) {
  if (arguments.length) {
    document.body.scrollTop = document.documentElement.scrollTop = window.pageYOffset = offset;
  } else {
    return (document.body.scrollTop || document.documentElement.scrollTop || window.pageYOffset);
  }
};
self.showPage = function($page, options) {
  if ($visiblePage && $visiblePage.attr('id') === $page.attr('id')) {
    return self;
  }
  options || (options = {});
  ($hiddenPage && $hiddenPage.attr('id') !== $page.attr('id')) && $hiddenPage.trigger('pagebeforehide').trigger('pagehide');
  if (options.type === 'dialog') {
    $hiddenPage = $visiblePage;
    $visiblePage && $visiblePage.data(SCROLLTOP, scrollTop()).addClass('collapsed');
  } else {
    $hiddenPage = null;
    $visiblePage && $visiblePage.data(SCROLLTOP, scrollTop()).trigger('pagebeforehide').addClass('collapsed').trigger('pagehide');
  }
  $visiblePage = $page.trigger('pagebeforeshow').removeClass('collapsed').trigger('pageshow');
  setTimeout(function() {
    scrollTop($visiblePage.data(SCROLLTOP) || 0);
  }, 25);
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
    this.addClass('collapsed');
  },
  navigation: function() {
    var $children = this.children();
    $children.css({ width: (100 / $children.length) + '%' });
  }
};
self.role = function(role) {
  var $control = this;
  var widget = self.widgets[role];
  $control.hasClass('ui-' + role) || (widget && widget.call($control.addClass('ui-' + role)));
  ['theme', 'icon'].forEach(function(type) {
    $control.data(type) && $control.addClass('ui-has-' + type + ' ui-' + type + '-' + $control.data(type));
  });
};
self.initialize = function(scope, options) {
  options || (options = {});
  (scope || $('html')).find('[data-role], input[type="button"], input[type="submit"], button').each(function() {
    self.role.apply($(this), [$(this).data('role') || 'button']);
  });
  if ( ! scope) {
    $('html').addClass('ui-theme-' + (options.theme || 'c'));
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
