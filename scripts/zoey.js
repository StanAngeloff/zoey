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
var $loading;
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
  // DISABLED: $visiblePage.reflow();
  setTimeout(function() {
    scrollTop($visiblePage.data('zoey:scroll-top') || 0);
    // DISABLED: self.updateLayout();
  }, 125);
  options.event && options.event.stopPropagation();
  $page.get(0).focus();
  return self;
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
    self.role.call($page, 'page');
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
  if (typeof (options.target) === 'string') {
    options.target = options.target.replace(/^#/, '');
    $('[data-role="page"]').each(function() {
      if ($(this).attr('id') === options.target) {
        $page = $(this);
        pageHash = options.target;
      }
    });
    if ( ! $page) {
      if ($cachedPages[options.target] && options.method !== 'POST') {
        self.changePage($.extend(options, { target: $cachedPages[options.target] }));
      } else {
        self.loading(true);
        $.ajax({
          dataType: 'html',
          data:     options.data,
          type:     (options.method && options.method.toUpperCase()) || 'GET',
          url:      options.target,
          success:  function(html, code, xhr) {
            self.createPages(html, options);
          },
          error: function(xhr, code, exception) {
            self.loading(false);
            alert('Whoops! We failed to load the requested page from the server. Please make sure you are connected to the internet and try again.\n\n[' + xhr.status + '] ' + (exception || xhr.statusText));
          }
        });
      }
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
self.closeDialog = function() {
  self.changePage({
    target: $hiddenPage
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
// DISABLED: $.fn.reflow = function() {
// DISABLED:   this.find('[data-role="content"]').content();
// DISABLED: };
self.widgets = {
  page: function() {
    this.delegate('a', 'click', function(event) {
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
        if ($hiddenPage) {
          self.closeDialog();
        } else {
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
  header: function() {
    // DISABLED: if (this.data('position') === 'fixed') {
    // DISABLED:   this.addClass('ui-fixed');
    // DISABLED:   $fixedWidgets.push([this, this.parent('[data-role="page"]'), 'top']);
    // DISABLED: }
  },
  navigation: function() {
    var $children = this.children();
    $children.addClass('ui-size-' + String.fromCharCode(97 /* 'a' */ + $children.length - 1));
  },
  content: function() {
    // DISABLED: var top = 0, bottom = 0;
    // DISABLED: this.prev('[data-role="header"]').each(function() {
    // DISABLED:   var $this = $(this);
    // DISABLED:   if ($this.css('position') === 'absolute') {
    // DISABLED:     top = top + $this.height();
    // DISABLED:   }
    // DISABLED: });
    // DISABLED: this.next('[data-role="footer"]').each(function() {
    // DISABLED:   var $this = $(this);
    // DISABLED:   if ($this.css('position') === 'absolute') {
    // DISABLED:     bottom = bottom + $this.height();
    // DISABLED:   }
    // DISABLED: });
    // DISABLED: this.css({
    // DISABLED:   'padding-top':    top    + 'px',
    // DISABLED:   'padding-bottom': bottom + 'px'
    // DISABLED: });
  },
  list: function() {
    // DISABLED: var buttons = this.find('[data-role="button"]'),
    // DISABLED:     split   = this.data('split-icon'),
    // DISABLED:     icon    = this.data('icon');
    // DISABLED: this.addClass('ui-list-view').addClass('align-' + (this.data('iconpos') || 'right')).addTheme('d', true, false);
    // DISABLED: if (this.data('inset') === 'true') {
    // DISABLED:   this.addClass('ui-inset');
    // DISABLED: }
    // DISABLED: buttons.addTheme('d', false, false);
    // DISABLED: if (split) {
    // DISABLED:   buttons.addIcon(split);
    // DISABLED: }
    // DISABLED: this.find('li').each(function() {
    // DISABLED:   var $this = $(this), children = $this.children();
    // DISABLED:   $this.addIcon(icon);
    // DISABLED:   if (children.length && children[0].tagName === 'A') {
    // DISABLED:     $(children[0]).addClass('ui-a-block');
    // DISABLED:     $this.addClass('ui-li-block');
    // DISABLED:   }
    // DISABLED: });
  },
  group: function() {
    // DISABLED: var $children, type = this.data('type');
    // DISABLED: this.addClass('ui-control-group').addClass('orientation-' + (type || 'horizontal')).addTheme('d', true, true);
    // DISABLED: if (type !== 'vertical') {
    // DISABLED:   $children = this.children();
    // DISABLED:   $children.css({ width: (100 / $children.length) + '%' });
    // DISABLED: }
    // DISABLED: $children = this.find('input');
    // DISABLED: if ($children.length) {
    // DISABLED:   var self = this;
    // DISABLED:   this.delegate('input', 'change', function() {
    // DISABLED:     $children.each(function() {
    // DISABLED:       $(this).closest('[data-role="button"]')[this.checked ? 'addClass' : 'removeClass']('highlight');
    // DISABLED:     });
    // DISABLED:   });
    // DISABLED:   $children.first().trigger('change');
    // DISABLED: }
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
    // DISABLED: if (this.data('position') === 'fixed') {
    // DISABLED:   this.addClass('ui-fixed').css({ top: (window.innerHeight - this.height()) + 'px' });
    // DISABLED:   $fixedWidgets.push([this, this.parent('[data-role="page"]'), 'bottom']);
    // DISABLED: } else {
    // DISABLED:   $fixedWidgets.push([this, this.parent('[data-role="page"]'), 'bottom-if-needed']);
    // DISABLED: }
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
    }).trigger('hashchange').bind('resize scroll orientationchange', function() {
      // DISABLED: var top = scrollTop(), reflow = false;
      // DISABLED: for (var i = 0; i < $fixedWidgets.length; i ++) {
      // DISABLED:   var config = $fixedWidgets[i];
      // DISABLED:   if (config[1].hasClass('ui-collapsed')) {
      // DISABLED:     continue;
      // DISABLED:   }
      // DISABLED:   if (config[2] === 'top') {
      // DISABLED:     config[0].css({ top: top + 'px' });
      // DISABLED:   } else if (config[2] === 'bottom-if-needed') {
      // DISABLED:     if (document.body.scrollHeight - 5 <= window.innerHeight) {
      // DISABLED:       config[0].css({ position: 'absolute', bottom: '0px' });
      // DISABLED:     } else {
      // DISABLED:       config[0].css({ position: 'relative', bottom: 'auto' });
      // DISABLED:     }
      // DISABLED:     reflow = true;
      // DISABLED:   } else {
      // DISABLED:     config[0].css({ top: (top + window.innerHeight - config[0].height()) + 'px' });
      // DISABLED:   }
      // DISABLED: }
      // DISABLED: hidden = false;
      // DISABLED: if (reflow) {
      // DISABLED:   $visiblePage.reflow();
      // DISABLED: }
      $loading && $loading.css({
        width:  window.innerWidth + 'px',
        height: document.body.scrollHeight + 'px'
      }).children().css({
        top:  (scrollTop() + Math.round(window.innerHeight / 2)) + 'px',
        left: Math.round(window.innerWidth  / 2) + 'px'
      });
    });
    // DISABLED: var hidden = false;
    // DISABLED: $(window).bind('touchmove', function(event) {
    // DISABLED:   if ( ! hidden) {
    // DISABLED:     hidden = true;
    // DISABLED:     for (var i = 0; i < $fixedWidgets.length; i ++) {
    // DISABLED:       var config = $fixedWidgets[i];
    // DISABLED:       if (config[1].hasClass('ui-collapsed')) {
    // DISABLED:         continue;
    // DISABLED:       }
    // DISABLED:       if (config[2] === 'top') {
    // DISABLED:         config[0].css({ top: '0px' });
    // DISABLED:       } else if (config[2] === 'bottom-if-needed') {
    // DISABLED:         if (document.body.scrollHeight > window.innerHeight) {
    // DISABLED:           config[0].css({ position: 'relative', bottom: 'auto' });
    // DISABLED:         }
    // DISABLED:       } else {
    // DISABLED:         config[0].css({ top: (document.body.scrollHeight - config[0].height()) + 'px' });
    // DISABLED:       }
    // DISABLED:     }
    // DISABLED:   }
    // DISABLED: });
    // DISABLED: $(window).bind('touchend', function() {
    // DISABLED:   if (hidden) {
    // DISABLED:     self.updateLayout();
    // DISABLED:   }
    // DISABLED: });
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
