(function() {
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
var $first     = null,
    $visible   = null,
    $highlight = [],
    $cache     = {},
    $previous  = null,
    hash       = null,
    sequence   = 0;
$.mobile || ($.mobile = {});
$.mobile.scrollTop = function uiScrollTop(offset) {
  if (typeof (offset) === 'undefined') {
    return (document.body.scrollTop || document.documentElement.scrollTop || window.pageYOffset);
  } else {
    document.body.scrollTop =
    document.documentElement.scrollTop =
    window.pageYOffset = offset;
    return $.mobile;
  }
};
$.mobile.loading = function uiLoading(flag) {
  var $loading;
  $('#loading').remove();
  if (flag) {
    $loading = $(document.createElement('div')).attr({ id: 'loading' }).addClass('ui-loading');
    $loading.append($(document.createElement('div')).addClass('ui-spinner'));
    $(document.body).append($loading);
    $(window).trigger('resize');
  }
  return $.mobile;
};
$.mobile.showPage = function uiShowPage(page, options) {
  var id = '#' + page.attr('id');
  options || (options = {});
  if ($previous && $previous.attr('id') !== page.attr('id')) {
    $previous.trigger('pagebeforehide').trigger('pagehide');
  }
  if (options.type === 'dialog') {
    $previous = $visible;
    if ($visible) {
      $visible.data('mobile:scrollTop', $.mobile.scrollTop()).addClass('collapsed');
    }
  } else {
    $previous = null;
    if ($visible) {
      $visible.data('mobile:scrollTop', $.mobile.scrollTop()).trigger('pagebeforehide').addClass('collapsed').trigger('pagehide');
    }
  }
  if ($highlight.length) {
    $highlight.removeClass('highlight');
  }
  $visible = page.trigger('pagebeforeshow').removeClass('collapsed').trigger('pageshow');
  $visible.reflow();
  $highlight = $visible.find('[href="' + id + '"]').addClass('highlight');
  options.event && options.event.stopPropagation();
  setTimeout(function() {
    $.mobile.scrollTop($visible.data('mobile:scrollTop') || 0);
    $.mobile.updateLayout();
  }, 25);
  page.get(0).focus();
  return $.mobile;
};
$.mobile.changePage = function uiChangePage(options) {
  var page = null, found = false;
  options || (options = {});
  if (typeof (options.target) === 'string') {
    var $pages = $('[data-role="page"]');
    options.target = options.target.replace(/^#/, '');
    for (var i = 0; i < $pages.length; i ++) {
      var $this = $($pages.get(i));
      if ($this.attr('id') === options.target) {
        found = true;
        if ($this.hasClass('collapsed')) {
          page = $this;
          hash = options.target;
          break;
        }
      }
    }
    if ( ! found) {
      if ($cache[options.target] && options.method !== 'POST') {
        $.mobile.changePage($.extend(options, { target: $cache[options.target] }));
      } else {
        $.mobile.loading(true);
        $.ajax({
          dataType: 'html',
          data:     options.data,
          type:     (options.method && options.method.toUpperCase()) || 'GET',
          cache:    false,
          url:      options.target,
          success:  function(html, code, xhr) {
            var $result = $(document.createElement('div')).html(html),
                $page   = $result.find('[data-role="page"]'),
                target  = options.target, id;
            if ( ! $page.length) {
              $page = $(document.createElement('div'));
            }
            if ($cache[target]) {
              $cache[target].remove();
              delete $cache[target];
            }
            id = $page.attr('id');
            if (id && $('#' + id).length) {
              $page.attr({ id: 'page-' + (++ sequence) });
            }
            $page.page();
            if ($page.data('cache') === 'true') {
              $cache[target] = $page;
            } else {
              $page.bind('pagehide', function() {
                $page.remove();
              });
            }
            $.mobile.initialize($page);
            $(document.body).append($page);
            $.mobile.loading(false);
            $.mobile.changePage($.extend(options, { target: $page }));
            if (options.type !== 'dialog') {
              hash = target;
              location.hash = hash;
            }
          },
          error: function(xhr, code, exception) {
            $.mobile.loading(false);
            alert('Whoops! We failed to load the requested page from the server. Please make sure you are connected to the internet and try again.\n\n[' + xhr.status + '] ' + (exception || xhr.statusText));
          }
        });
      }
    }
  } else {
    ($visible === options.target) || (page = options.target);
  }
  if (page) {
    $.mobile.showPage(page, options);
  } else {
    options.event && options.event.preventDefault();
  }
  return $.mobile;
};
$.mobile.closeDialog = function uiCloseDialog() {
  $.mobile.changePage({
    target: $previous
  });
}
$.mobile.serialize = function serialize(form) {
  var data = {};
  for (var i = 0; i < form.elements.length; i ++) {
    var element = form.elements[i];
    if (element.name && ! element.disabled) {
      if (element.tagName === 'SELECT') {
        data[element.name] = element.options[element.selectedIndex].value;
      } else if (element.tagName === 'INPUT') {
        if (element.type === 'checkbox' || element.type === 'radio') {
          if (element.checked) {
            data[element.name] = (element.value || 'on');
          }
        } else {
          data[element.name] = (element.value || '').replace(/\r\n|\r|\n/g, '\n');
        }
      } else if (element.tagName === 'TEXTAREA') {
        data[element.name] = (element.value || '').replace(/\r\n|\r|\n/g, '\n');
      }
    }
  }
  return data;
};
$.fn.addTheme = function uiAddTheme(theme, inherit, propagate) {
  inherit   && (inherit   = this.parent('[data-theme]').data('theme'));
  propagate && (propagate = this.find('[data-role]:not([data-theme])'));
  for (var i = 0; i < this.length; i ++) {
    var element = $(this.get(i));
    if ( ! (element.attr('class') || '').match(/\btheme-\w/)) {
      var local = (element.data('theme') || inherit || theme);
      element.addClass('theme-' + local);
      propagate && propagate.each(function() {
        $(this).addClass('theme-' + local);
      });
    }
  }
  return this;
};
$.fn.addIcon = function uiAddIcon(icon) {
  for (var i = 0; i < this.length; i ++) {
    var element = $(this.get(i));
    if ( ! (element.attr('class') || '').match(/\bicon-\w+/)) {
      var local = (element.data('icon') || icon);
      if (local) {
        element.addClass('ui-icon ui-icon-' + local);
      }
    }
  }
  return this;
};
$.fn.reflow = function uiReflow() {
  this.find('[data-role="content"]').content();
  return this;
};
$.fn.none = function uiNone() {};
$.fn.page = function uiPage() {
  if (this.hasClass('ui-page')) {
    return this;
  }
  this.addClass('ui-page');
  this.delegate('a', 'click', function(event) {
    var $this = $(this);
    if ($this.data('ajax') === 'false' || $this.data('role') === 'none' || $this.attr('rel') === 'external') {
      return false;
    }
    if ($this.hasClass('ui-disabled')) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    this.blur();
    var type = $this.data('rel'),
        href = $this.attr('href');
    if (href.indexOf('mailto:') === 0 || href.indexOf('sms:') === 0) {
      return false;
    }
    if (type === 'back') {
      if ($previous) {
        $.mobile.closeDialog();
      } else {
        history.back();
      }
      event.preventDefault();
    } else {
      $.mobile.changePage({
        event:  event,
        target: $this.attr('href'),
        type:   type
      });
    }
  });
  this.delegate('form', 'submit', function(event) {
    var $this = $(this);
    if ($this.data('ajax') === 'false' || $this.data('role') === 'none') {
      return false;
    }
    var type = $this.data('rel');
    $.mobile.changePage({
      event:  event,
      target: $this.attr('action'),
      method: $this.attr('method'),
      data:   $.mobile.serialize(this),
      type:   type
    });
  });
  if ( ! $first) {
    $first = this;
  }
  this.addClass('collapsed');
  return this;
};
var $fixed = [];
$.fn.header = function uiHeader() {
  this.addClass('ui-header').addTheme('a', false, true);
  if (this.data('position') === 'fixed') {
    this.addClass('ui-fixed');
    $fixed.push([this, this.parent('[data-role="page"]'), 'top']);
  }
  return this;
};
$.fn.navbar = function uiNavbar() {
  this.addClass('ui-navbar').addTheme('a', true).find('a').addIcon();
  var $children = this.find('li')
  $children.css({ width: (100 / $children.length) + '%' });
  return this;
};
$.fn.content = function uiContent() {
  this.addClass('ui-content').addTheme('c');
  var top = 0, bottom = 0;
  this.prev('[data-role="header"]').each(function() {
    var $this = $(this);
    if ($this.css('position') === 'absolute') {
      top = top + $this.height();
    }
  });
  this.next('[data-role="footer"]').each(function() {
    var $this = $(this);
    if ($this.css('position') === 'absolute') {
      bottom = bottom + $this.height();
    }
  });
  this.css({
    'padding-top':    top    + 'px',
    'padding-bottom': bottom + 'px'
  });
  return this;
};
$.fn.fieldcontain = function uiFieldContain() {
  this.addClass('ui-field-contain');
  return this;
};
$.fn.listview = function uiListView() {
  var buttons = this.find('[data-role="button"]'),
      split   = this.data('split-icon'),
      icon    = this.data('icon');
  this.addClass('ui-list-view').addClass('align-' + (this.data('iconpos') || 'right')).addTheme('d', true, false);
  if (this.data('inset') === 'true') {
    this.addClass('ui-inset');
  }
  buttons.addTheme('d', false, false);
  if (split) {
    buttons.addIcon(split);
  }
  this.find('li').each(function() {
    var $this = $(this), children = $this.children();
    $this.addIcon(icon);
    if (children.length && children[0].tagName === 'A') {
      $(children[0]).addClass('ui-a-block');
      $this.addClass('ui-li-block');
    }
  });
  return this;
};
$.fn['list-divider'] = function uiListDivider() {
  this.addClass('ui-list-divider').addTheme('b', false);
  return this;
};
$.fn.controlgroup = function uiControlGroup() {
  var $children, type = this.data('type');
  this.addClass('ui-control-group').addClass('orientation-' + (type || 'horizontal')).addTheme('d', true, true);
  if (type !== 'vertical') {
    $children = this.children();
    $children.css({ width: (100 / $children.length) + '%' });
  }
  $children = this.find('input');
  if ($children.length) {
    var self = this;
    this.delegate('input', 'change', function() {
      $children.each(function() {
        $(this).closest('[data-role="button"]')[this.checked ? 'addClass' : 'removeClass']('highlight');
      });
    });
    $children.first().trigger('change');
  }
  return this;
};
$.fn.button = function uiButton() {
  this.addClass('ui-button').addTheme('b', true, false).addIcon().addClass('icon-' + (this.data('iconpos') || 'left'));
  if (this.data('icon-only') === 'true') {
    this.addClass('ui-icon-only');
  }
  if (this.data('inline') === 'true') {
    this.addClass('ui-inline');
  }
  return this;
};
$.fn.collapsible = function uiCollapsible() {
  this.addClass('ui-collapsible');
  if (this.data('collapsed') === 'true') {
    this.addClass('closed');
  }
  var self = this;
  this.children().first().addClass('ui-toggle').bind('click', function() {
    self.toggleClass('closed');
  });
};
$.fn.footer = function uiFooter() {
  this.addClass('ui-footer').addTheme('c', false, true);
  if (this.data('position') === 'fixed') {
    this.addClass('ui-fixed').css({ top: (window.innerHeight - this.height()) + 'px' });
    $fixed.push([this, this.parent('[data-role="page"]'), 'bottom']);
  } else {
    $fixed.push([this, this.parent('[data-role="page"]'), 'bottom-if-needed']);
  }
  return this;
};
var hidden = false;
$(window).bind('touchmove', function onScrollStart(event) {
  if ( ! hidden) {
    hidden = true;
    for (var i = 0; i < $fixed.length; i ++) {
      var config = $fixed[i];
      if (config[1].hasClass('collapsed')) {
        continue;
      }
      if (config[2] === 'top') {
        config[0].css({ top: '0px' });
      } else if (config[2] === 'bottom-if-needed') {
        if (document.body.scrollHeight > window.innerHeight) {
          config[0].css({ position: 'relative', bottom: 'auto' });
        }
      } else {
        config[0].css({ top: (document.body.scrollHeight - config[0].height()) + 'px' });
      }
    }
  }
});
$(window).bind('scroll resize orientationchange', $.mobile.updateLayout = function uiUpdateLayout() {
  var top = $.mobile.scrollTop(), reflow = false;
  for (var i = 0; i < $fixed.length; i ++) {
    var config = $fixed[i];
    if (config[1].hasClass('collapsed')) {
      continue;
    }
    if (config[2] === 'top') {
      config[0].css({ top: top + 'px' });
    } else if (config[2] === 'bottom-if-needed') {
      if (document.body.scrollHeight - 5 <= window.innerHeight) {
        config[0].css({ position: 'absolute', bottom: '0px' });
      } else {
        config[0].css({ position: 'relative', bottom: 'auto' });
      }
      reflow = true;
    } else {
      config[0].css({ top: (top + window.innerHeight - config[0].height()) + 'px' });
    }
  }
  hidden = false;
  if (reflow) {
    $visible.reflow();
  }
  $('#loading').css({
    width:  window.innerWidth          + 'px',
    height: document.body.scrollHeight + 'px'
  }).children('.ui-spinner').css({
    top:  ($.mobile.scrollTop() + Math.round(window.innerHeight / 2)) + 'px',
    left: Math.round(window.innerWidth  / 2) + 'px'
  });
});
$(window).bind('touchend', function onScrollEnd() {
  if (hidden) {
    $.mobile.updateLayout();
  }
});
var initialized = false;
$.mobile.autoInitialize = true;
$.mobile.initialize = function uiInitialize(scope) {
  ((scope && scope.find('[data-role]')) || $('[data-role]')).each(function() {
    var $this = $(this);
    $this[$this.data('role')]();
  });
  var buttonsQuery = 'input[type="button"], input[type="submit"], button';
  ((scope && scope.find(buttonsQuery)) || $(buttonsQuery)).each(function() {
    $(this).button();
  });
  if ( ! initialized) {
    initialized = true;
    $(window).bind('hashchange', function(event) {
      var value = location.hash.replace(/^#/, '');
      if (hash !== value) {
        hash = value;
        $.mobile.changePage({
          event:  event,
          target: hash || $first
        });
      }
    });
    if ( ! ('onhashchange' in window)) {
      var last = location.hash;
      setInterval(function() {
        if (location.hash !== last) {
          last = location.hash;
          $(window).trigger('hashchange', [null, last]);
        }
      }, 50);
    }
    $(window).trigger('hashchange', [null, null]);
    window.scrollTo(0, 0);
  }
};
$(document).ready(function() {
  if ($.mobile.autoInitialize) {
    $.mobile.initialize();
  }
});
})();
