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
var VERSION = '0.2.1';
var self = this;
var $loading;
var $topPage;
var $visiblePage;
var $previousPage;
var $cachedPages = {};
var pageSequence = 0;
var pageHash;
function uiScrollTop(offset) {
  if (arguments.length) {
    document.body.scrollTop = document.documentElement.scrollTop = window.pageYOffset = offset;
  } else {
    return (document.body.scrollTop || document.documentElement.scrollTop || window.pageYOffset);
  }
};
function uiPersistScroll($page) {
  $page && ($page.data('zoey:scroll-top') === undefined) && $page.data('zoey:scroll-top', uiScrollTop());
};
function uiRestoreScroll($page) {
  $page && setTimeout(function() {
    uiScrollTop($page.data('zoey:scroll-top') || 0);
    $page.removeAttr('data-zoey:scroll-top');
  }, 75);
};
self.loading = function(display) {
  if (display) {
    if ( ! $loading) {
      $loading = $('<div>').addClass('ui-loading').append($('<div>').addClass('ui-spinner'));
      $(document.body).append($loading);
      $(window).trigger('resize');
    }
  } else {
    $loading && $loading.remove();
    $loading = null;
  }
};
self.showPage = function($page, options) {
  var id = $page.attr('id');
  if ( ! $visiblePage || $visiblePage.attr('id') !== id) {
    options || (options = {});
    ($previousPage && $previousPage.attr('id') !== id) && $previousPage.trigger('pagebeforehide').trigger('pagehide');
    uiPersistScroll($visiblePage);
    if (options.type === 'dialog') {
      $previousPage = $visiblePage;
      $visiblePage && $visiblePage.addClass('ui-collapsed');
    } else {
      $previousPage = null;
      $visiblePage && $visiblePage.trigger('pagebeforehide').addClass('ui-collapsed').trigger('pagehide');
    }
    $visiblePage && $visiblePage.find('.ui-highlight').removeClass('ui-highlight');
    $page.find('[href="#' + id + '"]').addClass('ui-highlight');
    $page.trigger('pagebeforeshow').removeClass('ui-collapsed').trigger('pageshow');
    uiRestoreScroll($page);
    $visiblePage = $page;
    $page.get(0).focus();
  }
};
self.createPages = function(html, options) {
  var $result = $('<div>').html(html);
  var $pages = $result.find('[data-role="page"]');
  var target = options.target;
  var id;
  $pages.length || ($pages = $('<div>'));
  if ($cachedPages[target]) {
    $cachedPages[target].remove();
    delete $cachedPages[target];
  }
  for (var i = 0, length = $pages.length, $page; $page = $($pages.get(i)), i < length; i ++) {
    id = $page.attr('id');
    if ( ! id || $('#' + id).length) {
      $page.attr({ id: 'page-' + (++ pageSequence) });
    }
    self.role($page, 'page');
    if ($page.data('cache') === 'true') {
      $cachedPages[target] = $page;
    } else {
      (function($this) {
        $this.bind('pagehide', function() {
          $this.remove();
        });
      })($page);
    }
    self.initialize($page, options);
    $(document.body).append($page);
  }
  self.loading(false);
  self.changePage($.extend(options, { target: $pages.first() }));
  if (options.type !== 'dialog') {
    pageHash = target;
    location.hash = pageHash;
  }
};
self.changePage = function(options) {
  var $page;
  options || (options = {});
  var event = options.event;
  var target = options.target;
  var method = options.method;
  if (typeof (target) === 'string') {
    target = target.replace(/^#/, '');
    $('[data-role="page"]').each(function() {
      if ($(this).attr('id') === target) {
        $page = $(this);
        pageHash = target;
      }
    });
    if ( ! $page) {
      if ($cachedPages[target] && method !== 'POST') {
        self.changePage($.extend(options, { target: $cachedPages[target] }));
      } else {
        self.loading(true);
        $.ajax({
          dataType: 'html',
          data:     options.data,
          type:     (method && method.toUpperCase()) || 'GET',
          url:      target,
          success:  function(html, code, xhr) {
            self.createPages(html, options);
          },
          error: function(xhr, code, exception) {
            self.loading(false);
            alert('Whoops! We failed to load the requested page from the server. Please make sure you are connected to the internet and try again.\n\n[' + xhr.status + '] ' + (exception || xhr.statusText));
          }
        });
        event && event.stopPropagation();
      }
    }
  } else {
    $page = target;
  }
  if ($page) {
    event && event.stopPropagation();
    self.showPage($page, options);
  } else {
    event && event.preventDefault();
  }
};
self.closeDialog = function() {
  self.changePage({
    target: $previousPage
  });
}
self.serialize = function(form) {
  var data = {};
  var normalize = function(element) { return (element.value || '').replace(/\r\n|\r|\n/g, '\n'); };
  for (var i = 0, element; element = form.elements[i], i < form.elements.length; i ++) {
    if (element.name && ! element.disabled) {
      if (element.tagName === 'SELECT') {
        data[element.name] = element.options[element.selectedIndex].value;
      } else if (element.tagName === 'INPUT') {
        if (element.type === 'checkbox' || element.type === 'radio') {
          if (element.checked) {
            data[element.name] = (element.value || 'on');
          }
        } else {
          data[element.name] = normalize(element);
        }
      } else if (element.tagName === 'TEXTAREA') {
        data[element.name] = normalize(element);
      }
    }
  }
  return data;
};
self.widgets = {
  page: function() {
    this.delegate('.ui-button', 'touchstart', function(event) {
      var $this = $(this);
      var onTouchEnd = function() {
        $this.unbind('touchend', onTouchEnd).removeClass('ui-pressed');
      };
      $this.addClass('ui-pressed').bind('touchend', onTouchEnd);
    }).delegate('a', 'click', function(event) {
      var $this = $(this);
      if ($this.data('ajax') === 'false' || $this.attr('rel') === 'external') {
        return true;
      }
      if ($this.hasClass('ui-disabled')) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
      var href = $this.attr('href');
      if (href.indexOf('mailto:') === 0 || href.indexOf('sms:') === 0) {
        return true;
      }
      var type = $this.data('rel');
      if (type === 'back') {
        if ($previousPage) {
          self.closeDialog();
        } else {
          uiPersistScroll($visiblePage);
          history.back();
        }
        event.preventDefault();
      } else {
        self.changePage({
          event:  event,
          target: href,
          type:   type
        });
      }
    }).delegate('.ui-button:not(a)', 'click', function(event) {
      (this === event.target) && $(this).children('a').trigger('click', event);
    }).delegate('form', 'submit', function(event) {
      var $this = $(this);
      if ($this.data('ajax') === 'false') {
        return true;
      }
      var type = $this.data('rel');
      self.changePage({
        event:  event,
        target: $this.attr('action'),
        method: $this.attr('method'),
        data:   self.serialize(this),
        type:   type
      });
    });
    $topPage || ($topPage = this);
    this.addClass('ui-collapsed');
  },
  navigation: function() {
    var $children = this.children();
    $children.addClass('ui-size-' + String.fromCharCode(97 /* 'a' */ + $children.length - 1));
  },
  list: function() {
    this.children().each(function() {
      self.role(this, 'button');
    });
  },
  group: function() {
    var orientation = this.data('orientation');
    this.addClass('ui-orientation-' + (orientation || 'horizontal'));
    (orientation === 'vertical') || self.widgets.navigation.call(this);
    var $children = this.find('input');
    this.delegate('input', 'change', function() {
      $children.each(function() {
        $(this).closest('[data-role]')[this.checked ? 'addClass' : 'removeClass']('ui-highlight');
      });
    });
    $children.first().trigger('change');
  },
  collapsible: function() {
    var $this = this;
    var $first = $this.children().first();
    var icons = ['arrow-d', 'arrow-r'];
    ($this.data('collapsed') === 'true') && $this.addClass('ui-closed');
    self.role($first.data('icon', $this.hasClass('ui-closed') ? icons[1] : icons[0]), 'button');
    $first.bind('click', function() {
      $this.toggleClass('ui-closed');
      if ($this.hasClass('ui-closed')) {
        $first.removeClass('ui-icon-' + icons[0]).addClass('ui-icon-' + icons[1]);
      } else {
        $first.removeClass('ui-icon-' + icons[1]).addClass('ui-icon-' + icons[0]);
      }
    });
  }
};
self.role = function(element, role) {
  var $widget = $(element);
  var block = self.widgets[role];
  $widget.hasClass('ui-' + role) || (block && block.call($widget));
  $widget.addClass('ui-widget ui-' + role);
  ['theme', 'icon', 'icon-position', 'size'].forEach(function(type) {
    $widget.data(type) && $widget.addClass('ui-has-' + type + ' ui-' + type + '-' + $widget.data(type));
  });
  var themeRegExp = /\bui-theme-(\w+)\b/;
  var getTheme = function() { var list = themeRegExp.exec(this.className); return (list && list[1]); };
  var parent = $widget.get(0);
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
  inheritedTheme && $widget.addClass('ui-inherit-theme-' + inheritedTheme);
};
self.initialize = function(scope, options) {
  var $html = $('html');
  options || (options = {});
  scope || $html.addClass('ui-theme-' + (options.theme || 'c'));
  (scope || $html).find('[data-role], input[type="button"], input[type="submit"], button').each(function() {
    self.role(this, $(this).data('role') || 'button');
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
    }).trigger('hashchange').bind('resize scroll orientationchange', function() {
      var width = window.innerWidth;
      var height = window.innerHeight;
      $loading && $loading.css({
        width:  width + 'px',
        height: document.body.scrollHeight + 'px'
      }).children().css({
        top:  (uiScrollTop() + Math.round(height / 2)) + 'px',
        left: Math.round(width / 2) + 'px'
      });
    });
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
    $html.removeClass('ui-splash');
  }
};
$(document).ready(function() {
  self.preventInitialize || self.initialize();
});
}).apply(this.Zoey = {}, [window, document, location]);
