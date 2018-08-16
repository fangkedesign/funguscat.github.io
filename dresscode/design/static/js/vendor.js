/*
 * Lazy Load - jQuery plugin for lazy loading images
 *
 * Copyright (c) 2007-2013 Mika Tuupola
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Project home:
 *   http://www.appelsiini.net/projects/lazyload
 *
 * Version:  1.9.3
 *
 */

(function($, window, document, undefined) {
    var $window = $(window);

    $.fn.lazyload = function(options) {
        var elements = this;
        var $container;
        var settings = {
            threshold       : 0,
            failure_limit   : 0,
            event           : "scroll",
            effect          : "show",
            container       : window,
            data_attribute  : "original",
            skip_invisible  : true,
            appear          : null,
            load            : null,
            placeholder     : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuCLAAAAAElFTkSuQmCC"
        };

        function update() {
            var counter = 0;

            elements.each(function() {
                var $this = $(this);
                if (settings.skip_invisible && !$this.is(":visible")) {
                    return;
                }
                if ($.abovethetop(this, settings) ||
                    $.leftofbegin(this, settings)) {
                        /* Nothing. */
                } else if (!$.belowthefold(this, settings) &&
                    !$.rightoffold(this, settings)) {
                        $this.trigger("appear");
                        /* if we found an image we'll load, reset the counter */
                        counter = 0;
                } else {
                    if (++counter > settings.failure_limit) {
                        return false;
                    }
                }
            });

        }

        if(options) {
            /* Maintain BC for a couple of versions. */
            if (undefined !== options.failurelimit) {
                options.failure_limit = options.failurelimit;
                delete options.failurelimit;
            }
            if (undefined !== options.effectspeed) {
                options.effect_speed = options.effectspeed;
                delete options.effectspeed;
            }

            $.extend(settings, options);
        }

        /* Cache container as jQuery as object. */
        $container = (settings.container === undefined ||
                      settings.container === window) ? $window : $(settings.container);

        /* Fire one scroll event per scroll. Not one scroll event per image. */
        if (0 === settings.event.indexOf("scroll")) {
            $container.bind(settings.event, function() {
                return update();
            });
        }

        this.each(function() {
            var self = this;
            var $self = $(self);

            self.loaded = false;

            /* If no src attribute given use data:uri. */
            if ($self.attr("src") === undefined || $self.attr("src") === false) {
                if ($self.is("img")) {
                    $self.attr("src", settings.placeholder);
                }
            }

            /* When appear is triggered load original image. */
            $self.one("appear", function() {
                if (!this.loaded) {
                    if (settings.appear) {
                        var elements_left = elements.length;
                        settings.appear.call(self, elements_left, settings);
                    }
                    $("<img />")
                        .bind("load", function() {

                            var original = $self.attr("data-" + settings.data_attribute);
                            $self.hide();
                            if ($self.is("img")) {
                                $self.attr("src", original);
                            } else {
                                $self.css("background-image", "url('" + original + "')");
                            }
                            $self[settings.effect](settings.effect_speed);

                            self.loaded = true;

                            /* Remove image from array so it is not looped next time. */
                            var temp = $.grep(elements, function(element) {
                                return !element.loaded;
                            });
                            elements = $(temp);

                            if (settings.load) {
                                var elements_left = elements.length;
                                settings.load.call(self, elements_left, settings);
                            }
                        })
                        .attr("src", $self.attr("data-" + settings.data_attribute));
                }
            });

            /* When wanted event is triggered load original image */
            /* by triggering appear.                              */
            if (0 !== settings.event.indexOf("scroll")) {
                $self.bind(settings.event, function() {
                    if (!self.loaded) {
                        $self.trigger("appear");
                    }
                });
            }
        });

        /* Check if something appears when window is resized. */
        $window.bind("resize", function() {
            update();
        });

        /* With IOS5 force loading images when navigating with back button. */
        /* Non optimal workaround. */
        if ((/(?:iphone|ipod|ipad).*os 5/gi).test(navigator.appVersion)) {
            $window.bind("pageshow", function(event) {
                if (event.originalEvent && event.originalEvent.persisted) {
                    elements.each(function() {
                        $(this).trigger("appear");
                    });
                }
            });
        }

        /* Force initial check if images should appear. */
        $(document).ready(function() {
            update();
        });

        return this;
    };

    /* Convenience methods in jQuery namespace.           */
    /* Use as  $.belowthefold(element, {threshold : 100, container : window}) */

    $.belowthefold = function(element, settings) {
        var fold;

        if (settings.container === undefined || settings.container === window) {
            fold = (window.innerHeight ? window.innerHeight : $window.height()) + $window.scrollTop();
        } else {
            fold = $(settings.container).offset().top + $(settings.container).height();
        }

        return fold <= $(element).offset().top - settings.threshold;
    };

    $.rightoffold = function(element, settings) {
        var fold;

        if (settings.container === undefined || settings.container === window) {
            fold = $window.width() + $window.scrollLeft();
        } else {
            fold = $(settings.container).offset().left + $(settings.container).width();
        }

        return fold <= $(element).offset().left - settings.threshold;
    };

    $.abovethetop = function(element, settings) {
        var fold;

        if (settings.container === undefined || settings.container === window) {
            fold = $window.scrollTop();
        } else {
            fold = $(settings.container).offset().top;
        }

        return fold >= $(element).offset().top + settings.threshold  + $(element).height();
    };

    $.leftofbegin = function(element, settings) {
        var fold;

        if (settings.container === undefined || settings.container === window) {
            fold = $window.scrollLeft();
        } else {
            fold = $(settings.container).offset().left;
        }

        return fold >= $(element).offset().left + settings.threshold + $(element).width();
    };

    $.inviewport = function(element, settings) {
         return !$.rightoffold(element, settings) && !$.leftofbegin(element, settings) &&
                !$.belowthefold(element, settings) && !$.abovethetop(element, settings);
     };

    /* Custom selectors for your convenience.   */
    /* Use as $("img:below-the-fold").something() or */
    /* $("img").filter(":below-the-fold").something() which is faster */

    $.extend($.expr[":"], {
        "below-the-fold" : function(a) { return $.belowthefold(a, {threshold : 0}); },
        "above-the-top"  : function(a) { return !$.belowthefold(a, {threshold : 0}); },
        "right-of-screen": function(a) { return $.rightoffold(a, {threshold : 0}); },
        "left-of-screen" : function(a) { return !$.rightoffold(a, {threshold : 0}); },
        "in-viewport"    : function(a) { return $.inviewport(a, {threshold : 0}); },
        /* Maintain BC for couple of versions. */
        "above-the-fold" : function(a) { return !$.belowthefold(a, {threshold : 0}); },
        "right-of-fold"  : function(a) { return $.rightoffold(a, {threshold : 0}); },
        "left-of-fold"   : function(a) { return !$.rightoffold(a, {threshold : 0}); }
    });

})(jQuery, window, document);
//
// SmoothScroll for websites v1.2.1
// Licensed under the terms of the MIT license.
//
// You may use it in your theme if you credit me. 
// It is also free to use on any individual website.
//
// Exception:
// The only restriction would be not to publish any  
// extension for browsers or native application
// without getting a permission first.
//
 
// People involved
//  - Balazs Galambosi (maintainer)   
//  - Michael Herf     (Pulse Algorithm)
 
(function(){
  
// Scroll Variables (tweakable)
var defaultOptions = {
 
    // Scrolling Core
    frameRate        : 150, // [Hz]
    animationTime    : 400, // [px]
    stepSize         : 120, // [px]
 
    // Pulse (less tweakable)
    // ratio of "tail" to "acceleration"
    pulseAlgorithm   : true,
    pulseScale       : 8,
    pulseNormalize   : 1,
 
    // Acceleration
    accelerationDelta : 20,  // 20
    accelerationMax   : 1,   // 1
 
    // Keyboard Settings
    keyboardSupport   : true,  // option
    arrowScroll       : 50,     // [px]
 
    // Other
    touchpadSupport   : true,
    fixedBackground   : true, 
    excluded          : ""    
};
 
var options = defaultOptions;
 
 
// Other Variables
var isExcluded = false;
var isFrame = false;
var direction = { x: 0, y: 0 };
var initDone  = false;
var root = document.documentElement;
var activeElement;
var observer;
var deltaBuffer = [ 120, 120, 120 ];
 
var key = { left: 37, up: 38, right: 39, down: 40, spacebar: 32, 
            pageup: 33, pagedown: 34, end: 35, home: 36 };
 
 
/***********************************************
 * SETTINGS
 ***********************************************/
 
var options = defaultOptions;
 
 
/***********************************************
 * INITIALIZE
 ***********************************************/
 
/**
 * Tests if smooth scrolling is allowed. Shuts down everything if not.
 */
function initTest() {
 
    var disableKeyboard = false; 
    
    // disable keyboard support if anything above requested it
    if (disableKeyboard) {
        removeEvent("keydown", keydown);
    }
 
    if (options.keyboardSupport && !disableKeyboard) {
        addEvent("keydown", keydown);
    }
}
 
/**
 * Sets up scrolls array, determines if frames are involved.
 */
function init() {
  
    if (!document.body) return;
 
    var body = document.body;
    var html = document.documentElement;
    var windowHeight = window.innerHeight; 
    var scrollHeight = body.scrollHeight;
    
    // check compat mode for root element
    root = (document.compatMode.indexOf('CSS') >= 0) ? html : body;
    activeElement = body;
    
    initTest();
    initDone = true;
 
    // Checks if this script is running in a frame
    if (top != self) {
        isFrame = true;
    }
 
    /**
     * This fixes a bug where the areas left and right to 
     * the content does not trigger the onmousewheel event
     * on some pages. e.g.: html, body { height: 100% }
     */
    else if (scrollHeight > windowHeight &&
            (body.offsetHeight <= windowHeight || 
             html.offsetHeight <= windowHeight)) {
 
        // DOMChange (throttle): fix height
        var pending = false;
        var refresh = function () {
            if (!pending && html.scrollHeight != document.height) {
                pending = true; // add a new pending action
                setTimeout(function () {
                    html.style.height = document.height + 'px';
                    pending = false;
                }, 500); // act rarely to stay fast
            }
        };
        html.style.height = 'auto';
        setTimeout(refresh, 10);
 
        // clearfix
        if (root.offsetHeight <= windowHeight) {
            var underlay = document.createElement("div");   
            underlay.style.clear = "both";
            body.appendChild(underlay);
        }
    }
 
    // disable fixed background
    if (!options.fixedBackground && !isExcluded) {
        body.style.backgroundAttachment = "scroll";
        html.style.backgroundAttachment = "scroll";
    }
}
 
 
/************************************************
 * SCROLLING 
 ************************************************/
 
var que = [];
var pending = false;
var lastScroll = +new Date;
 
/**
 * Pushes scroll actions to the scrolling queue.
 */
function scrollArray(elem, left, top, delay) {
    
    delay || (delay = 1000);
    directionCheck(left, top);
 
    if (options.accelerationMax != 1) {
        var now = +new Date;
        var elapsed = now - lastScroll;
        if (elapsed < options.accelerationDelta) {
            var factor = (1 + (30 / elapsed)) / 2;
            if (factor > 1) {
                factor = Math.min(factor, options.accelerationMax);
                left *= factor;
                top  *= factor;
            }
        }
        lastScroll = +new Date;
    }          
    
    // push a scroll command
    que.push({
        x: left, 
        y: top, 
        lastX: (left < 0) ? 0.99 : -0.99,
        lastY: (top  < 0) ? 0.99 : -0.99, 
        start: +new Date
    });
        
    // don't act if there's a pending queue
    if (pending) {
        return;
    }  
 
    var scrollWindow = (elem === document.body);
    
    var step = function (time) {
        
        var now = +new Date;
        var scrollX = 0;
        var scrollY = 0; 
    
        for (var i = 0; i < que.length; i++) {
            
            var item = que[i];
            var elapsed  = now - item.start;
            var finished = (elapsed >= options.animationTime);
            
            // scroll position: [0, 1]
            var position = (finished) ? 1 : elapsed / options.animationTime;
            
            // easing [optional]
            if (options.pulseAlgorithm) {
                position = pulse(position);
            }
            
            // only need the difference
            var x = (item.x * position - item.lastX) >> 0;
            var y = (item.y * position - item.lastY) >> 0;
            
            // add this to the total scrolling
            scrollX += x;
            scrollY += y;            
            
            // update last values
            item.lastX += x;
            item.lastY += y;
        
            // delete and step back if it's over
            if (finished) {
                que.splice(i, 1); i--;
            }           
        }
 
        // scroll left and top
        if (scrollWindow) {
            window.scrollBy(scrollX, scrollY);
        } 
        else {
            if (scrollX) elem.scrollLeft += scrollX;
            if (scrollY) elem.scrollTop  += scrollY;                    
        }
        
        // clean up if there's nothing left to do
        if (!left && !top) {
            que = [];
        }
        
        if (que.length) { 
            requestFrame(step, elem, (delay / options.frameRate + 1)); 
        } else { 
            pending = false;
        }
    };
    
    // start a new queue of actions
    requestFrame(step, elem, 0);
    pending = true;
}
 
 
/***********************************************
 * EVENTS
 ***********************************************/
 
/**
 * Mouse wheel handler.
 * @param {Object} event
 */
function wheel(event) {
 
    if (!initDone) {
        init();
    }
    
    var target = event.target;
    var overflowing = overflowingAncestor(target);
    
    // use default if there's no overflowing
    // element or default action is prevented    
    if (!overflowing || event.defaultPrevented ||
        isNodeName(activeElement, "embed") ||
       (isNodeName(target, "embed") && /\.pdf/i.test(target.src))) {
        return true;
    }
 
    var deltaX = event.wheelDeltaX || 0;
    var deltaY = event.wheelDeltaY || 0;
    
    // use wheelDelta if deltaX/Y is not available
    if (!deltaX && !deltaY) {
        deltaY = event.wheelDelta || 0;
    }
 
    // check if it's a touchpad scroll that should be ignored
    if (!options.touchpadSupport && isTouchpad(deltaY)) {
        return true;
    }
 
    // scale by step size
    // delta is 120 most of the time
    // synaptics seems to send 1 sometimes
    if (Math.abs(deltaX) > 1.2) {
        deltaX *= options.stepSize / 120;
    }
    if (Math.abs(deltaY) > 1.2) {
        deltaY *= options.stepSize / 120;
    }
    
    scrollArray(overflowing, -deltaX, -deltaY);
    event.preventDefault();
}
 
/**
 * Keydown event handler.
 * @param {Object} event
 */
function keydown(event) {
 
    var target   = event.target;
    var modifier = event.ctrlKey || event.altKey || event.metaKey || 
                  (event.shiftKey && event.keyCode !== key.spacebar);
    
    // do nothing if user is editing text
    // or using a modifier key (except shift)
    // or in a dropdown
    if ( /input|textarea|select|embed/i.test(target.nodeName) ||
         target.isContentEditable || 
         event.defaultPrevented   ||
         modifier ) {
      return true;
    }
    // spacebar should trigger button press
    if (isNodeName(target, "button") &&
        event.keyCode === key.spacebar) {
      return true;
    }
    
    var shift, x = 0, y = 0;
    var elem = overflowingAncestor(activeElement);
    var clientHeight = elem.clientHeight;
 
    if (elem == document.body) {
        clientHeight = window.innerHeight;
    }
 
    switch (event.keyCode) {
        case key.up:
            y = -options.arrowScroll;
            break;
        case key.down:
            y = options.arrowScroll;
            break;         
        case key.spacebar: // (+ shift)
            shift = event.shiftKey ? 1 : -1;
            y = -shift * clientHeight * 0.9;
            break;
        case key.pageup:
            y = -clientHeight * 0.9;
            break;
        case key.pagedown:
            y = clientHeight * 0.9;
            break;
        case key.home:
            y = -elem.scrollTop;
            break;
        case key.end:
            var damt = elem.scrollHeight - elem.scrollTop - clientHeight;
            y = (damt > 0) ? damt+10 : 0;
            break;
        case key.left:
            x = -options.arrowScroll;
            break;
        case key.right:
            x = options.arrowScroll;
            break;            
        default:
            return true; // a key we don't care about
    }
 
    scrollArray(elem, x, y);
    event.preventDefault();
}
 
/**
 * Mousedown event only for updating activeElement
 */
function mousedown(event) {
    activeElement = event.target;
}
 
 
/***********************************************
 * OVERFLOW
 ***********************************************/
 
var cache = {}; // cleared out every once in while
setInterval(function () { cache = {}; }, 10 * 1000);
 
var uniqueID = (function () {
    var i = 0;
    return function (el) {
        return el.uniqueID || (el.uniqueID = i++);
    };
})();
 
function setCache(elems, overflowing) {
    for (var i = elems.length; i--;)
        cache[uniqueID(elems[i])] = overflowing;
    return overflowing;
}
 
function overflowingAncestor(el) {
    var elems = [];
    var rootScrollHeight = root.scrollHeight;
    do {
        var cached = cache[uniqueID(el)];
        if (cached) {
            return setCache(elems, cached);
        }
        elems.push(el);
        if (rootScrollHeight === el.scrollHeight) {
            if (!isFrame || root.clientHeight + 10 < rootScrollHeight) {
                return setCache(elems, document.body); // scrolling root in WebKit
            }
        } else if (el.clientHeight + 10 < el.scrollHeight) {
            overflow = getComputedStyle(el, "").getPropertyValue("overflow-y");
            if (overflow === "scroll" || overflow === "auto") {
                return setCache(elems, el);
            }
        }
    } while (el = el.parentNode);
}
 
 
/***********************************************
 * HELPERS
 ***********************************************/
 
function addEvent(type, fn, bubble) {
    window.addEventListener(type, fn, (bubble||false));
}
 
function removeEvent(type, fn, bubble) {
    window.removeEventListener(type, fn, (bubble||false));  
}
 
function isNodeName(el, tag) {
    return (el.nodeName||"").toLowerCase() === tag.toLowerCase();
}
 
function directionCheck(x, y) {
    x = (x > 0) ? 1 : -1;
    y = (y > 0) ? 1 : -1;
    if (direction.x !== x || direction.y !== y) {
        direction.x = x;
        direction.y = y;
        que = [];
        lastScroll = 0;
    }
}
 
var deltaBufferTimer;
 
function isTouchpad(deltaY) {
    if (!deltaY) return;
    deltaY = Math.abs(deltaY)
    deltaBuffer.push(deltaY);
    deltaBuffer.shift();
    clearTimeout(deltaBufferTimer);
    var allDivisable = (isDivisible(deltaBuffer[0], 120) &&
                        isDivisible(deltaBuffer[1], 120) &&
                        isDivisible(deltaBuffer[2], 120));
    return !allDivisable;
} 
 
function isDivisible(n, divisor) {
    return (Math.floor(n / divisor) == n / divisor);
}
 
var requestFrame = (function () {
      return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              function (callback, element, delay) {
                  window.setTimeout(callback, delay || (1000/60));
              };
})();
 
 
/***********************************************
 * PULSE
 ***********************************************/
 
/**
 * Viscous fluid with a pulse for part and decay for the rest.
 * - Applies a fixed force over an interval (a damped acceleration), and
 * - Lets the exponential bleed away the velocity over a longer interval
 * - Michael Herf, http://stereopsis.com/stopping/
 */
function pulse_(x) {
    var val, start, expx;
    // test
    x = x * options.pulseScale;
    if (x < 1) { // acceleartion
        val = x - (1 - Math.exp(-x));
    } else {     // tail
        // the previous animation ended here:
        start = Math.exp(-1);
        // simple viscous drag
        x -= 1;
        expx = 1 - Math.exp(-x);
        val = start + (expx * (1 - start));
    }
    return val * options.pulseNormalize;
}
 
function pulse(x) {
    if (x >= 1) return 1;
    if (x <= 0) return 0;
 
    if (options.pulseNormalize == 1) {
        options.pulseNormalize /= pulse_(1);
    }
    return pulse_(x);
}
 
var isChrome = /chrome/i.test(window.navigator.userAgent);
var wheelEvent = null;
if ("onwheel" in document.createElement("div"))
    wheelEvent = "wheel";
else if ("onmousewheel" in document.createElement("div"))
    wheelEvent = "mousewheel";
 
if (wheelEvent && isChrome) {
    addEvent(wheelEvent, wheel);
    addEvent("mousedown", mousedown);
    addEvent("load", init);
}
 
})();
!function(e,t){"function"==typeof define&&define.amd?define(t):"object"==typeof exports?module.exports=t(require,exports,module):e.ScrollReveal=t()}(this,function(e,t,n){return function(){"use strict";var e,t,n;this.ScrollReveal=function(){function i(n){return"undefined"==typeof this||Object.getPrototypeOf(this)!==i.prototype?new i(n):(e=this,e.tools=new t,e.isSupported()?(e.tools.extend(e.defaults,n||{}),o(e.defaults),e.store={elements:{},containers:[]},e.sequences={},e.history=[],e.uid=0,e.initialized=!1):"undefined"!=typeof console&&null!==console,e)}function o(t){var n=t.container;return n&&"string"==typeof n?t.container=window.document.querySelector(n):(n&&!e.tools.isNode(n)&&(t.container=null),null==n&&(t.container=window.document.documentElement),t.container)}function r(){return++e.uid}function s(t,n){t.config?t.config=e.tools.extendClone(t.config,n):t.config=e.tools.extendClone(e.defaults,n),"top"===t.config.origin||"bottom"===t.config.origin?t.config.axis="Y":t.config.axis="X","top"!==t.config.origin&&"left"!==t.config.origin||(t.config.distance="-"+t.config.distance)}function a(e){var t=window.getComputedStyle(e.domEl);e.styles||(e.styles={transition:{},transform:{},computed:{}},e.styles.inline=e.domEl.getAttribute("style")||"",e.styles.inline+="; visibility: visible; ",e.styles.computed.opacity=t.opacity,t.transition&&"all 0s ease 0s"!=t.transition?e.styles.computed.transition=t.transition+", ":e.styles.computed.transition=""),e.styles.transition.instant=l(e,0),e.styles.transition.delayed=l(e,e.config.delay),e.styles.transform.initial=" -webkit-transform:",e.styles.transform.target=" -webkit-transform:",c(e),e.styles.transform.initial+="transform:",e.styles.transform.target+="transform:",c(e)}function l(e,t){var n=e.config;return"-webkit-transition: "+e.styles.computed.transition+"-webkit-transform "+n.duration/1e3+"s "+n.easing+" "+t/1e3+"s, opacity "+n.duration/1e3+"s "+n.easing+" "+t/1e3+"s; transition: "+e.styles.computed.transition+"transform "+n.duration/1e3+"s "+n.easing+" "+t/1e3+"s, opacity "+n.duration/1e3+"s "+n.easing+" "+t/1e3+"s; "}function c(e){var t=e.config,n=e.styles.transform;parseInt(t.distance)&&(n.initial+=" translate"+t.axis+"("+t.distance+")",n.target+=" translate"+t.axis+"(0)"),t.scale&&(n.initial+=" scale("+t.scale+")",n.target+=" scale(1)"),t.rotate.x&&(n.initial+=" rotateX("+t.rotate.x+"deg)",n.target+=" rotateX(0)"),t.rotate.y&&(n.initial+=" rotateY("+t.rotate.y+"deg)",n.target+=" rotateY(0)"),t.rotate.z&&(n.initial+=" rotateZ("+t.rotate.z+"deg)",n.target+=" rotateZ(0)"),n.initial+="; opacity: "+t.opacity+";",n.target+="; opacity: "+e.styles.computed.opacity+";"}function f(t){var n=t.config.container;n&&-1==e.store.containers.indexOf(n)&&e.store.containers.push(t.config.container),e.store.elements[t.id]=t}function u(t,n,i){var o={selector:t,config:n,interval:i};e.history.push(o)}function d(){if(e.isSupported()){p();for(var t=0;t<e.store.containers.length;t++)e.store.containers[t].addEventListener("scroll",y),e.store.containers[t].addEventListener("resize",y);e.initialized||(window.addEventListener("scroll",y),window.addEventListener("resize",y),e.initialized=!0)}return e}function y(){n(p)}function m(){var t,n,i,o;e.tools.forOwn(e.sequences,function(r){o=e.sequences[r],t=!1;for(var s=0;s<o.elemIds.length;s++)i=o.elemIds[s],n=e.store.elements[i],O(n)&&!t&&(t=!0);o.active=t})}function p(){var t,n;m(),e.tools.forOwn(e.store.elements,function(i){n=e.store.elements[i],t=b(n),v(n)?(t?n.domEl.setAttribute("style",n.styles.inline+n.styles.transform.target+n.styles.transition.delayed):n.domEl.setAttribute("style",n.styles.inline+n.styles.transform.target+n.styles.transition.instant),w("reveal",n,t),n.revealing=!0,n.seen=!0,n.sequence&&g(n,t)):h(n)&&(n.domEl.setAttribute("style",n.styles.inline+n.styles.transform.initial+n.styles.transition.instant),w("reset",n),n.revealing=!1)})}function g(t,n){var i=0,o=0,r=e.sequences[t.sequence.id];r.blocked=!0,n&&"onload"==t.config.useDelay&&(o=t.config.delay),t.sequence.timer&&(i=Math.abs(t.sequence.timer.started-new Date),window.clearTimeout(t.sequence.timer)),t.sequence.timer={started:new Date},t.sequence.timer.clock=window.setTimeout(function(){r.blocked=!1,t.sequence.timer=null,y()},Math.abs(r.interval)+o-i)}function w(e,t,n){var i=0,o=0,r="after";switch(e){case"reveal":o=t.config.duration,n&&(o+=t.config.delay),r+="Reveal";break;case"reset":o=t.config.duration,r+="Reset"}t.timer&&(i=Math.abs(t.timer.started-new Date),window.clearTimeout(t.timer.clock)),t.timer={started:new Date},t.timer.clock=window.setTimeout(function(){t.config[r](t.domEl),t.timer=null},o-i)}function v(t){if(t.sequence){var n=e.sequences[t.sequence.id];return n.active&&!n.blocked&&!t.revealing&&!t.disabled}return O(t)&&!t.revealing&&!t.disabled}function b(t){var n=t.config.useDelay;return"always"===n||"onload"===n&&!e.initialized||"once"===n&&!t.seen}function h(t){if(t.sequence){var n=e.sequences[t.sequence.id];return!n.active&&t.config.reset&&t.revealing&&!t.disabled}return!O(t)&&t.config.reset&&t.revealing&&!t.disabled}function x(e){return{width:e.clientWidth,height:e.clientHeight}}function q(e){if(e&&e!==window.document.documentElement){var t=E(e);return{x:e.scrollLeft+t.left,y:e.scrollTop+t.top}}return{x:window.pageXOffset,y:window.pageYOffset}}function E(e){var t=0,n=0,i=e.offsetHeight,o=e.offsetWidth;do isNaN(e.offsetTop)||(t+=e.offsetTop),isNaN(e.offsetLeft)||(n+=e.offsetLeft);while(e=e.offsetParent);return{top:t,left:n,height:i,width:o}}function O(e){function t(){var t=c+a*s,n=f+l*s,i=u-a*s,y=d-l*s,m=r.y+e.config.viewOffset.top,p=r.x+e.config.viewOffset.left,g=r.y-e.config.viewOffset.bottom+o.height,w=r.x-e.config.viewOffset.right+o.width;return g>t&&i>m&&n>p&&w>y}function n(){return"fixed"===window.getComputedStyle(e.domEl).position}var i=E(e.domEl),o=x(e.config.container),r=q(e.config.container),s=e.config.viewFactor,a=i.height,l=i.width,c=i.top,f=i.left,u=c+a,d=f+l;return t()||n()}return i.prototype.defaults={origin:"bottom",distance:"20px",duration:500,delay:0,rotate:{x:0,y:0,z:0},opacity:0,scale:.9,easing:"cubic-bezier(0.6, 0.2, 0.1, 1)",container:null,mobile:!0,reset:!1,useDelay:"always",viewFactor:.2,viewOffset:{top:0,right:0,bottom:0,left:0},afterReveal:function(e){},afterReset:function(e){}},i.prototype.isSupported=function(){var e=document.documentElement.style;return"WebkitTransition"in e&&"WebkitTransform"in e||"transition"in e&&"transform"in e},i.prototype.reveal=function(t,n,i,l){var c,y,m,p,g,w;if(c=n&&n.container?o(n):e.defaults.container,y=e.tools.isNode(t)?[t]:Array.prototype.slice.call(c.querySelectorAll(t)),!y.length)return e;n&&"number"==typeof n&&(i=n,n={}),i&&"number"==typeof i&&(w=r(),g=e.sequences[w]={id:w,interval:i,elemIds:[],active:!1});for(var v=0;v<y.length;v++)p=y[v].getAttribute("data-sr-id"),p?m=e.store.elements[p]:(m={id:r(),domEl:y[v],seen:!1,revealing:!1},m.domEl.setAttribute("data-sr-id",m.id)),g&&(m.sequence={id:g.id,index:g.elemIds.length},g.elemIds.push(m.id)),s(m,n||{}),a(m),f(m),e.tools.isMobile()&&!m.config.mobile||!e.isSupported()?(m.domEl.setAttribute("style",m.styles.inline),m.disabled=!0):m.revealing||m.domEl.setAttribute("style",m.styles.inline+m.styles.transform.initial);return!l&&e.isSupported()&&(u(t,n),e.initTimeout&&window.clearTimeout(e.initTimeout),e.initTimeout=window.setTimeout(d,0)),e},i.prototype.sync=function(){if(e.history.length&&e.isSupported()){for(var t=0;t<e.history.length;t++){var n=e.history[t];e.reveal(n.selector,n.config,n.interval,!0)}d()}return e},i}(),t=function(){function e(){}return e.prototype.isObject=function(e){return null!==e&&"object"==typeof e&&e.constructor==Object},e.prototype.isNode=function(e){return"object"==typeof Node?e instanceof Node:e&&"object"==typeof e&&"number"==typeof e.nodeType&&"string"==typeof e.nodeName},e.prototype.forOwn=function(e,t){if(!this.isObject(e))throw new TypeError('Expected "object", but received "'+typeof e+'".');for(var n in e)e.hasOwnProperty(n)&&t(n)},e.prototype.extend=function(e,t){return this.forOwn(t,function(n){this.isObject(t[n])?(e[n]&&this.isObject(e[n])||(e[n]={}),this.extend(e[n],t[n])):e[n]=t[n]}.bind(this)),e},e.prototype.extendClone=function(e,t){return this.extend(this.extend({},e),t)},e.prototype.isMobile=function(){return/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)},e}(),n=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame}.call(this),this.ScrollReveal});
/*jshint browser:true */
/*!
* FitVids 1.1
*
* Copyright 2013, Chris Coyier - http://css-tricks.com + Dave Rupert - http://daverupert.com
* Credit to Thierry Koblentz - http://www.alistapart.com/articles/creating-intrinsic-ratios-for-video/
* Released under the WTFPL license - http://sam.zoy.org/wtfpl/
*
*/

;(function( $ ){

  'use strict';

  $.fn.fitVids = function( options ) {
    var settings = {
      customSelector: null,
      ignore: null
    };

    if(!document.getElementById('fit-vids-style')) {
      // appendStyles: https://github.com/toddmotto/fluidvids/blob/master/dist/fluidvids.js
      var head = document.head || document.getElementsByTagName('head')[0];
      var css = '.fluid-width-video-wrapper{width:100%;position:relative;padding:0;}.fluid-width-video-wrapper iframe,.fluid-width-video-wrapper object,.fluid-width-video-wrapper embed {position:absolute;top:0;left:0;width:100%;height:100%;}';
      var div = document.createElement("div");
      div.innerHTML = '<p>x</p><style id="fit-vids-style">' + css + '</style>';
      head.appendChild(div.childNodes[1]);
    }

    if ( options ) {
      $.extend( settings, options );
    }

    return this.each(function(){
      var selectors = [
        'iframe[src*="player.vimeo.com"]',
        'iframe[src*="youtube.com"]',
        'iframe[src*="youtube-nocookie.com"]',
        'iframe[src*="kickstarter.com"][src*="video.html"]',
        'object',
        'embed'
      ];

      if (settings.customSelector) {
        selectors.push(settings.customSelector);
      }

      var ignoreList = '.fitvidsignore';

      if(settings.ignore) {
        ignoreList = ignoreList + ', ' + settings.ignore;
      }

      var $allVideos = $(this).find(selectors.join(','));
      $allVideos = $allVideos.not('object object'); // SwfObj conflict patch
      $allVideos = $allVideos.not(ignoreList); // Disable FitVids on this video.

      $allVideos.each(function(count){
        var $this = $(this);
        if($this.parents(ignoreList).length > 0) {
          return; // Disable FitVids on this video.
        }
        if (this.tagName.toLowerCase() === 'embed' && $this.parent('object').length || $this.parent('.fluid-width-video-wrapper').length) { return; }
        if ((!$this.css('height') && !$this.css('width')) && (isNaN($this.attr('height')) || isNaN($this.attr('width'))))
        {
          $this.attr('height', 9);
          $this.attr('width', 16);
        }
        var height = ( this.tagName.toLowerCase() === 'object' || ($this.attr('height') && !isNaN(parseInt($this.attr('height'), 10))) ) ? parseInt($this.attr('height'), 10) : $this.height(),
            width = !isNaN(parseInt($this.attr('width'), 10)) ? parseInt($this.attr('width'), 10) : $this.width(),
            aspectRatio = height / width;
        if(!$this.attr('id')){
          var videoID = 'fitvid' + count;
          $this.attr('id', videoID);
        }
        $this.wrap('<div class="fluid-width-video-wrapper"></div>').parent('.fluid-width-video-wrapper').css('padding-top', (aspectRatio * 100)+'%');
        $this.removeAttr('height').removeAttr('width');
      });
    });
  };
// Works with either jQuery or Zepto
})( window.jQuery || window.Zepto );

/*!
 * animsition v4.0.1
 * A simple and easy jQuery plugin for CSS animated page transitions.
 * http://blivesta.github.io/animsition
 * License : MIT
 * Author : blivesta (http://blivesta.com/)
 */
!function(t){"use strict";"function"==typeof define&&define.amd?define(["jquery"],t):"object"==typeof exports?module.exports=t(require("jquery")):t(jQuery)}(function(t){"use strict";var n="animsition",i={init:function(a){a=t.extend({inClass:"fade-in",outClass:"fade-out",inDuration:1500,outDuration:800,linkElement:".animsition-link",loading:!0,loadingParentElement:"body",loadingClass:"animsition-loading",loadingInner:"",timeout:!1,timeoutCountdown:5e3,onLoadEvent:!0,browser:["animation-duration","-webkit-animation-duration"],overlay:!1,overlayClass:"animsition-overlay-slide",overlayParentElement:"body",transition:function(t){window.location.href=t}},a),i.settings={timer:!1,data:{inClass:"animsition-in-class",inDuration:"animsition-in-duration",outClass:"animsition-out-class",outDuration:"animsition-out-duration",overlay:"animsition-overlay"},events:{inStart:"animsition.inStart",inEnd:"animsition.inEnd",outStart:"animsition.outStart",outEnd:"animsition.outEnd"}};var o=i.supportCheck.call(this,a);if(!o&&a.browser.length>0&&(!o||!this.length))return"console"in window||(window.console={},window.console.log=function(t){return t}),this.length||console.log("Animsition: Element does not exist on page."),o||console.log("Animsition: Does not support this browser."),i.destroy.call(this);var e=i.optionCheck.call(this,a);return e&&i.addOverlay.call(this,a),a.loading&&i.addLoading.call(this,a),this.each(function(){var o=this,e=t(this),s=t(window),r=t(document),l=e.data(n);l||(a=t.extend({},a),e.data(n,{options:a}),a.timeout&&i.addTimer.call(o),a.onLoadEvent&&s.on("load."+n,function(){i.settings.timer&&clearTimeout(i.settings.timer),i["in"].call(o)}),s.on("pageshow."+n,function(t){t.originalEvent.persisted&&i["in"].call(o)}),s.on("unload."+n,function(){}),r.on("click."+n,a.linkElement,function(n){n.preventDefault();var a=t(this),e=a.attr("href");2===n.which||n.metaKey||n.shiftKey||-1!==navigator.platform.toUpperCase().indexOf("WIN")&&n.ctrlKey?window.open(e,"_blank"):i.out.call(o,a,e)}))})},addOverlay:function(n){t(n.overlayParentElement).prepend('<div class="'+n.overlayClass+'"></div>')},addLoading:function(n){t(n.loadingParentElement).append('<div class="'+n.loadingClass+'">'+n.loadingInner+"</div>")},removeLoading:function(){var i=t(this),a=i.data(n).options,o=t(a.loadingParentElement).children("."+a.loadingClass);o.fadeOut().remove()},addTimer:function(){var a=this,o=t(this),e=o.data(n).options;i.settings.timer=setTimeout(function(){i["in"].call(a),t(window).off("load."+n)},e.timeoutCountdown)},supportCheck:function(n){var i=t(this),a=n.browser,o=a.length,e=!1;0===o&&(e=!0);for(var s=0;o>s;s++)if("string"==typeof i.css(a[s])){e=!0;break}return e},optionCheck:function(n){var a,o=t(this);return a=n.overlay||o.data(i.settings.data.overlay)?!0:!1},animationCheck:function(i,a,o){var e=t(this),s=e.data(n).options,r=typeof i,l=!a&&"number"===r,d=a&&"string"===r&&i.length>0;return l||d?i=i:a&&o?i=s.inClass:!a&&o?i=s.inDuration:a&&!o?i=s.outClass:a||o||(i=s.outDuration),i},"in":function(){var a=this,o=t(this),e=o.data(n).options,s=o.data(i.settings.data.inDuration),r=o.data(i.settings.data.inClass),l=i.animationCheck.call(a,s,!1,!0),d=i.animationCheck.call(a,r,!0,!0),u=i.optionCheck.call(a,e),c=o.data(n).outClass;e.loading&&i.removeLoading.call(a),c&&o.removeClass(c),u?i.inOverlay.call(a,d,l):i.inDefault.call(a,d,l)},inDefault:function(n,a){var o=t(this);o.css({"animation-duration":a+"ms"}).addClass(n).trigger(i.settings.events.inStart).animateCallback(function(){o.removeClass(n).css({opacity:1}).trigger(i.settings.events.inEnd)})},inOverlay:function(a,o){var e=t(this),s=e.data(n).options;e.css({opacity:1}).trigger(i.settings.events.inStart),t(s.overlayParentElement).children("."+s.overlayClass).css({"animation-duration":o+"ms"}).addClass(a).animateCallback(function(){e.trigger(i.settings.events.inEnd)})},out:function(a,o){var e=this,s=t(this),r=s.data(n).options,l=a.data(i.settings.data.outClass),d=s.data(i.settings.data.outClass),u=a.data(i.settings.data.outDuration),c=s.data(i.settings.data.outDuration),m=l?l:d,g=u?u:c,f=i.animationCheck.call(e,m,!0,!1),v=i.animationCheck.call(e,g,!1,!1),h=i.optionCheck.call(e,r);s.data(n).outClass=f,h?i.outOverlay.call(e,f,v,o):i.outDefault.call(e,f,v,o)},outDefault:function(a,o,e){var s=t(this),r=s.data(n).options;s.css({"animation-duration":o+1+"ms"}).addClass(a).trigger(i.settings.events.outStart).animateCallback(function(){s.trigger(i.settings.events.outEnd),r.transition(e)})},outOverlay:function(a,o,e){var s=this,r=t(this),l=r.data(n).options,d=r.data(i.settings.data.inClass),u=i.animationCheck.call(s,d,!0,!0);t(l.overlayParentElement).children("."+l.overlayClass).css({"animation-duration":o+1+"ms"}).removeClass(u).addClass(a).trigger(i.settings.events.outStart).animateCallback(function(){r.trigger(i.settings.events.outEnd),l.transition(e)})},destroy:function(){return this.each(function(){var i=t(this);t(window).off("."+n),i.css({opacity:1}).removeData(n)})}};t.fn.animateCallback=function(n){var i="animationend webkitAnimationEnd";return this.each(function(){var a=t(this);a.on(i,function(){return a.off(i),n.call(this)})})},t.fn.animsition=function(a){return i[a]?i[a].apply(this,Array.prototype.slice.call(arguments,1)):"object"!=typeof a&&a?void t.error("Method "+a+" does not exist on jQuery."+n):i.init.apply(this,arguments)}});
!function(e,t,n){"use strict";!function o(e,t,n){function a(s,l){if(!t[s]){if(!e[s]){var i="function"==typeof require&&require;if(!l&&i)return i(s,!0);if(r)return r(s,!0);var u=new Error("Cannot find module '"+s+"'");throw u.code="MODULE_NOT_FOUND",u}var c=t[s]={exports:{}};e[s][0].call(c.exports,function(t){var n=e[s][1][t];return a(n?n:t)},c,c.exports,o,e,t,n)}return t[s].exports}for(var r="function"==typeof require&&require,s=0;s<n.length;s++)a(n[s]);return a}({1:[function(o,a){var r,s,l,i,u=function(e){return e&&e.__esModule?e:{"default":e}},c=o("./modules/handle-dom"),d=o("./modules/utils"),f=o("./modules/handle-swal-dom"),p=o("./modules/handle-click"),m=o("./modules/handle-key"),v=u(m),y=o("./modules/default-params"),h=u(y),g=o("./modules/set-params"),b=u(g);l=i=function(){function o(e){var t=a;return t[e]===n?h["default"][e]:t[e]}var a=arguments[0];if(c.addClass(t.body,"stop-scrolling"),f.resetInput(),a===n)return d.logStr("SweetAlert expects at least 1 attribute!"),!1;var l=d.extend({},h["default"]);switch(typeof a){case"string":l.title=a,l.text=arguments[1]||"",l.type=arguments[2]||"";break;case"object":if(a.title===n)return d.logStr('Missing "title" argument!'),!1;l.title=a.title;for(var i in h["default"])l[i]=o(i);l.confirmButtonText=l.showCancelButton?"Confirm":h["default"].confirmButtonText,l.confirmButtonText=o("confirmButtonText"),l.doneFunction=arguments[1]||null;break;default:return d.logStr('Unexpected type of argument! Expected "string" or "object", got '+typeof a),!1}b["default"](l),f.fixVerticalPosition(),f.openModal();for(var u=f.getModal(),m=u.querySelectorAll("button"),y=["onclick","onmouseover","onmouseout","onmousedown","onmouseup","onfocus"],g=function(e){return p.handleButton(e,l,u)},w=0;w<m.length;w++)for(var C=0;C<y.length;C++){var S=y[C];m[w][S]=g}f.getOverlay().onclick=g,r=e.onkeydown;var x=function(e){return v["default"](e,l,u)};e.onkeydown=x,e.onfocus=function(){setTimeout(function(){s!==n&&(s.focus(),s=n)},0)}},l.setDefaults=i.setDefaults=function(e){if(!e)throw new Error("userParams is required");if("object"!=typeof e)throw new Error("userParams has to be a object");d.extend(h["default"],e)},l.close=i.close=function(){var o=f.getModal();c.fadeOut(f.getOverlay(),5),c.fadeOut(o,5),c.removeClass(o,"showSweetAlert"),c.addClass(o,"hideSweetAlert"),c.removeClass(o,"visible");var a=o.querySelector(".sa-icon.sa-success");c.removeClass(a,"animate"),c.removeClass(a.querySelector(".sa-tip"),"animateSuccessTip"),c.removeClass(a.querySelector(".sa-long"),"animateSuccessLong");var l=o.querySelector(".sa-icon.sa-error");c.removeClass(l,"animateErrorIcon"),c.removeClass(l.querySelector(".sa-x-mark"),"animateXMark");var i=o.querySelector(".sa-icon.sa-warning");return c.removeClass(i,"pulseWarning"),c.removeClass(i.querySelector(".sa-body"),"pulseWarningIns"),c.removeClass(i.querySelector(".sa-dot"),"pulseWarningIns"),c.removeClass(t.body,"stop-scrolling"),e.onkeydown=r,e.previousActiveElement&&e.previousActiveElement.focus(),s=n,clearTimeout(o.timeout),!0},l.showInputError=i.showInputError=function(e){var t=f.getModal(),n=t.querySelector(".sa-input-error");c.addClass(n,"show");var o=t.querySelector(".sa-error-container");c.addClass(o,"show"),o.querySelector("p").innerHTML=e,t.querySelector("input").focus()},l.resetInputError=i.resetInputError=function(e){if(e&&13===e.keyCode)return!1;var t=f.getModal(),n=t.querySelector(".sa-input-error");c.removeClass(n,"show");var o=t.querySelector(".sa-error-container");c.removeClass(o,"show")},"function"==typeof define&&define.amd?define(function(){return l}):"undefined"!=typeof e?e.sweetAlert=e.swal=l:"undefined"!=typeof a&&a.exports&&(a.exports=l)},{"./modules/default-params":2,"./modules/handle-click":3,"./modules/handle-dom":4,"./modules/handle-key":5,"./modules/handle-swal-dom":6,"./modules/set-params":8,"./modules/utils":9}],2:[function(e,t,n){Object.defineProperty(n,"__esModule",{value:!0});var o={title:"",text:"",type:null,allowOutsideClick:!1,showConfirmButton:!0,showCancelButton:!1,closeOnConfirm:!0,closeOnCancel:!0,confirmButtonText:"OK",confirmButtonColor:"#AEDEF4",cancelButtonText:"Cancel",imageUrl:null,imageSize:null,timer:null,customClass:"",html:!1,animation:!0,allowEscapeKey:!0,inputType:"text",inputPlaceholder:""};n["default"]=o,t.exports=n["default"]},{}],3:[function(t,n,o){Object.defineProperty(o,"__esModule",{value:!0});var a=t("./utils"),r=(t("./handle-swal-dom"),t("./handle-dom")),s=function(t,n,o){function s(e){m&&n.confirmButtonColor&&(p.style.backgroundColor=e)}var u,c,d,f=t||e.event,p=f.target||f.srcElement,m=-1!==p.className.indexOf("confirm"),v=-1!==p.className.indexOf("sweet-overlay"),y=r.hasClass(o,"visible"),h=n.doneFunction&&"true"===o.getAttribute("data-has-done-function");switch(m&&n.confirmButtonColor&&(u=n.confirmButtonColor,c=a.colorLuminance(u,-.04),d=a.colorLuminance(u,-.14)),f.type){case"mouseover":s(c);break;case"mouseout":s(u);break;case"mousedown":s(d);break;case"mouseup":s(c);break;case"focus":var g=o.querySelector("button.confirm"),b=o.querySelector("button.cancel");m?b.style.boxShadow="none":g.style.boxShadow="none";break;case"click":var w=o===p,C=r.isDescendant(o,p);if(!w&&!C&&y&&!n.allowOutsideClick)break;m&&h&&y?l(o,n):h&&y||v?i(o,n):r.isDescendant(o,p)&&"BUTTON"===p.tagName&&sweetAlert.close()}},l=function(e,t){var n=!0;r.hasClass(e,"show-input")&&(n=e.querySelector("input").value,n||(n="")),t.doneFunction(n),t.closeOnConfirm&&sweetAlert.close()},i=function(e,t){var n=String(t.doneFunction).replace(/\s/g,""),o="function("===n.substring(0,9)&&")"!==n.substring(9,10);o&&t.doneFunction(!1),t.closeOnCancel&&sweetAlert.close()};o["default"]={handleButton:s,handleConfirm:l,handleCancel:i},n.exports=o["default"]},{"./handle-dom":4,"./handle-swal-dom":6,"./utils":9}],4:[function(n,o,a){Object.defineProperty(a,"__esModule",{value:!0});var r=function(e,t){return new RegExp(" "+t+" ").test(" "+e.className+" ")},s=function(e,t){r(e,t)||(e.className+=" "+t)},l=function(e,t){var n=" "+e.className.replace(/[\t\r\n]/g," ")+" ";if(r(e,t)){for(;n.indexOf(" "+t+" ")>=0;)n=n.replace(" "+t+" "," ");e.className=n.replace(/^\s+|\s+$/g,"")}},i=function(e){var n=t.createElement("div");return n.appendChild(t.createTextNode(e)),n.innerHTML},u=function(e){e.style.opacity="",e.style.display="block"},c=function(e){if(e&&!e.length)return u(e);for(var t=0;t<e.length;++t)u(e[t])},d=function(e){e.style.opacity="",e.style.display="none"},f=function(e){if(e&&!e.length)return d(e);for(var t=0;t<e.length;++t)d(e[t])},p=function(e,t){for(var n=t.parentNode;null!==n;){if(n===e)return!0;n=n.parentNode}return!1},m=function(e){e.style.left="-9999px",e.style.display="block";var t,n=e.clientHeight;return t="undefined"!=typeof getComputedStyle?parseInt(getComputedStyle(e).getPropertyValue("padding-top"),10):parseInt(e.currentStyle.padding),e.style.left="",e.style.display="none","-"+parseInt((n+t)/2)+"px"},v=function(e,t){if(+e.style.opacity<1){t=t||16,e.style.opacity=0,e.style.display="block";var n=+new Date,o=function(e){function t(){return e.apply(this,arguments)}return t.toString=function(){return e.toString()},t}(function(){e.style.opacity=+e.style.opacity+(new Date-n)/100,n=+new Date,+e.style.opacity<1&&setTimeout(o,t)});o()}e.style.display="block"},y=function(e,t){t=t||16,e.style.opacity=1;var n=+new Date,o=function(e){function t(){return e.apply(this,arguments)}return t.toString=function(){return e.toString()},t}(function(){e.style.opacity=+e.style.opacity-(new Date-n)/100,n=+new Date,+e.style.opacity>0?setTimeout(o,t):e.style.display="none"});o()},h=function(n){if("function"==typeof MouseEvent){var o=new MouseEvent("click",{view:e,bubbles:!1,cancelable:!0});n.dispatchEvent(o)}else if(t.createEvent){var a=t.createEvent("MouseEvents");a.initEvent("click",!1,!1),n.dispatchEvent(a)}else t.createEventObject?n.fireEvent("onclick"):"function"==typeof n.onclick&&n.onclick()},g=function(t){"function"==typeof t.stopPropagation?(t.stopPropagation(),t.preventDefault()):e.event&&e.event.hasOwnProperty("cancelBubble")&&(e.event.cancelBubble=!0)};a.hasClass=r,a.addClass=s,a.removeClass=l,a.escapeHtml=i,a._show=u,a.show=c,a._hide=d,a.hide=f,a.isDescendant=p,a.getTopMargin=m,a.fadeIn=v,a.fadeOut=y,a.fireClick=h,a.stopEventPropagation=g},{}],5:[function(t,o,a){Object.defineProperty(a,"__esModule",{value:!0});var r=t("./handle-dom"),s=t("./handle-swal-dom"),l=function(t,o,a){var l=t||e.event,i=l.keyCode||l.which,u=a.querySelector("button.confirm"),c=a.querySelector("button.cancel"),d=a.querySelectorAll("button[tabindex]");if(-1!==[9,13,32,27].indexOf(i)){for(var f=l.target||l.srcElement,p=-1,m=0;m<d.length;m++)if(f===d[m]){p=m;break}9===i?(f=-1===p?u:p===d.length-1?d[0]:d[p+1],r.stopEventPropagation(l),f.focus(),o.confirmButtonColor&&s.setFocusStyle(f,o.confirmButtonColor)):13===i?("INPUT"===f.tagName&&(f=u,u.focus()),f=-1===p?u:n):27===i&&o.allowEscapeKey===!0?(f=c,r.fireClick(f,l)):f=n}};a["default"]=l,o.exports=a["default"]},{"./handle-dom":4,"./handle-swal-dom":6}],6:[function(n,o,a){var r=function(e){return e&&e.__esModule?e:{"default":e}};Object.defineProperty(a,"__esModule",{value:!0});var s=n("./utils"),l=n("./handle-dom"),i=n("./default-params"),u=r(i),c=n("./injected-html"),d=r(c),f=".sweet-alert",p=".sweet-overlay",m=function(){var e=t.createElement("div");for(e.innerHTML=d["default"];e.firstChild;)t.body.appendChild(e.firstChild)},v=function(e){function t(){return e.apply(this,arguments)}return t.toString=function(){return e.toString()},t}(function(){var e=t.querySelector(f);return e||(m(),e=v()),e}),y=function(){var e=v();return e?e.querySelector("input"):void 0},h=function(){return t.querySelector(p)},g=function(e,t){var n=s.hexToRgb(t);e.style.boxShadow="0 0 2px rgba("+n+", 0.8), inset 0 0 0 1px rgba(0, 0, 0, 0.05)"},b=function(){var n=v();l.fadeIn(h(),10),l.show(n),l.addClass(n,"showSweetAlert"),l.removeClass(n,"hideSweetAlert"),e.previousActiveElement=t.activeElement;var o=n.querySelector("button.confirm");o.focus(),setTimeout(function(){l.addClass(n,"visible")},500);var a=n.getAttribute("data-timer");"null"!==a&&""!==a&&(n.timeout=setTimeout(function(){swal.close()},a))},w=function(){var e=v(),t=y();l.removeClass(e,"show-input"),t.value="",t.setAttribute("type",u["default"].inputType),t.setAttribute("placeholder",u["default"].inputPlaceholder),C()},C=function(e){if(e&&13===e.keyCode)return!1;var t=v(),n=t.querySelector(".sa-input-error");l.removeClass(n,"show");var o=t.querySelector(".sa-error-container");l.removeClass(o,"show")},S=function(){var e=v();e.style.marginTop=l.getTopMargin(v())};a.sweetAlertInitialize=m,a.getModal=v,a.getOverlay=h,a.getInput=y,a.setFocusStyle=g,a.openModal=b,a.resetInput=w,a.resetInputError=C,a.fixVerticalPosition=S},{"./default-params":2,"./handle-dom":4,"./injected-html":7,"./utils":9}],7:[function(e,t,n){Object.defineProperty(n,"__esModule",{value:!0});var o='<div class="sweet-overlay" tabIndex="-1"></div><div class="sweet-alert"><div class="sa-icon sa-error">\n      <span class="sa-x-mark">\n        <span class="sa-line sa-left"></span>\n        <span class="sa-line sa-right"></span>\n      </span>\n    </div><div class="sa-icon sa-warning">\n      <span class="sa-body"></span>\n      <span class="sa-dot"></span>\n    </div><div class="sa-icon sa-info"></div><div class="sa-icon sa-success">\n      <span class="sa-line sa-tip"></span>\n      <span class="sa-line sa-long"></span>\n\n      <div class="sa-placeholder"></div>\n      <div class="sa-fix"></div>\n    </div><div class="sa-icon sa-custom"></div><h2>Title</h2>\n    <p>Text</p>\n    <fieldset>\n      <input type="text" tabIndex="3" />\n      <div class="sa-input-error"></div>\n    </fieldset><div class="sa-error-container">\n      <div class="icon">!</div>\n      <p>Not valid!</p>\n    </div><div class="sa-button-container">\n      <button class="cancel" tabIndex="2">Cancel</button>\n      <button class="confirm" tabIndex="1">OK</button>\n    </div></div>';n["default"]=o,t.exports=n["default"]},{}],8:[function(e,t,o){Object.defineProperty(o,"__esModule",{value:!0});var a=e("./utils"),r=e("./handle-swal-dom"),s=e("./handle-dom"),l=["error","warning","info","success","input","prompt"],i=function(e){var t=r.getModal(),o=t.querySelector("h2"),i=t.querySelector("p"),u=t.querySelector("button.cancel"),c=t.querySelector("button.confirm");if(o.innerHTML=e.html?e.title:s.escapeHtml(e.title).split("\n").join("<br>"),i.innerHTML=e.html?e.text:s.escapeHtml(e.text||"").split("\n").join("<br>"),e.text&&s.show(i),e.customClass)s.addClass(t,e.customClass),t.setAttribute("data-custom-class",e.customClass);else{var d=t.getAttribute("data-custom-class");s.removeClass(t,d),t.setAttribute("data-custom-class","")}if(s.hide(t.querySelectorAll(".sa-icon")),e.type&&!a.isIE8()){var f=function(){for(var o=!1,a=0;a<l.length;a++)if(e.type===l[a]){o=!0;break}if(!o)return logStr("Unknown alert type: "+e.type),{v:!1};var i=["success","error","warning","info"],u=n;-1!==i.indexOf(e.type)&&(u=t.querySelector(".sa-icon.sa-"+e.type),s.show(u));var c=r.getInput();switch(e.type){case"success":s.addClass(u,"animate"),s.addClass(u.querySelector(".sa-tip"),"animateSuccessTip"),s.addClass(u.querySelector(".sa-long"),"animateSuccessLong");break;case"error":s.addClass(u,"animateErrorIcon"),s.addClass(u.querySelector(".sa-x-mark"),"animateXMark");break;case"warning":s.addClass(u,"pulseWarning"),s.addClass(u.querySelector(".sa-body"),"pulseWarningIns"),s.addClass(u.querySelector(".sa-dot"),"pulseWarningIns");break;case"input":case"prompt":c.setAttribute("type",e.inputType),c.setAttribute("placeholder",e.inputPlaceholder),s.addClass(t,"show-input"),setTimeout(function(){c.focus(),c.addEventListener("keyup",swal.resetInputError)},400)}}();if("object"==typeof f)return f.v}if(e.imageUrl){var p=t.querySelector(".sa-icon.sa-custom");p.style.backgroundImage="url("+e.imageUrl+")",s.show(p);var m=80,v=80;if(e.imageSize){var y=e.imageSize.toString().split("x"),h=y[0],g=y[1];h&&g?(m=h,v=g):logStr("Parameter imageSize expects value with format WIDTHxHEIGHT, got "+e.imageSize)}p.setAttribute("style",p.getAttribute("style")+"width:"+m+"px; height:"+v+"px")}t.setAttribute("data-has-cancel-button",e.showCancelButton),e.showCancelButton?u.style.display="inline-block":s.hide(u),t.setAttribute("data-has-confirm-button",e.showConfirmButton),e.showConfirmButton?c.style.display="inline-block":s.hide(c),e.cancelButtonText&&(u.innerHTML=s.escapeHtml(e.cancelButtonText)),e.confirmButtonText&&(c.innerHTML=s.escapeHtml(e.confirmButtonText)),e.confirmButtonColor&&(c.style.backgroundColor=e.confirmButtonColor,r.setFocusStyle(c,e.confirmButtonColor)),t.setAttribute("data-allow-outside-click",e.allowOutsideClick);var b=e.doneFunction?!0:!1;t.setAttribute("data-has-done-function",b),e.animation?"string"==typeof e.animation?t.setAttribute("data-animation",e.animation):t.setAttribute("data-animation","pop"):t.setAttribute("data-animation","none"),t.setAttribute("data-timer",e.timer)};o["default"]=i,t.exports=o["default"]},{"./handle-dom":4,"./handle-swal-dom":6,"./utils":9}],9:[function(t,n,o){Object.defineProperty(o,"__esModule",{value:!0});var a=function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);return e},r=function(e){var t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?parseInt(t[1],16)+", "+parseInt(t[2],16)+", "+parseInt(t[3],16):null},s=function(){return e.attachEvent&&!e.addEventListener},l=function(t){e.console&&e.console.log("SweetAlert: "+t)},i=function(e,t){e=String(e).replace(/[^0-9a-f]/gi,""),e.length<6&&(e=e[0]+e[0]+e[1]+e[1]+e[2]+e[2]),t=t||0;var n,o,a="#";for(o=0;3>o;o++)n=parseInt(e.substr(2*o,2),16),n=Math.round(Math.min(Math.max(0,n+n*t),255)).toString(16),a+=("00"+n).substr(n.length);return a};o.extend=a,o.hexToRgb=r,o.isIE8=s,o.logStr=l,o.colorLuminance=i},{}]},{},[1])}(window,document);
/*!
*  - v1.2.5
* Homepage: http://bqworks.com/slider-pro/
* Author: bqworks
* Author URL: http://bqworks.com/
*/
;(function( window, $ ) {

	"use strict";

	// Static methods for Slider Pro
	$.SliderPro = {

		// List of added modules
		modules: [],

		// Add a module by extending the core prototype
		addModule: function( name, module ) {
			this.modules.push( name );
			$.extend( SliderPro.prototype, module );
		}
	};

	// namespace
	var NS = $.SliderPro.namespace = 'SliderPro';

	var SliderPro = function( instance, options ) {

		// Reference to the slider instance
		this.instance = instance;

		// Reference to the slider jQuery element
		this.$slider = $( this.instance );

		// Reference to the slides (sp-slides) jQuery element
		this.$slides = null;

		// Reference to the mask (sp-mask) jQuery element
		this.$slidesMask = null;

		// Reference to the slides (sp-slides-container) jQuery element
		this.$slidesContainer = null;

		// Array of SliderProSlide objects, ordered by their DOM index
		this.slides = [];

		// Array of SliderProSlide objects, ordered by their left/top position in the slider.
		// This will be updated continuously if the slider is loopable.
		this.slidesOrder = [];

		// Holds the options passed to the slider when it was instantiated
		this.options = options;

		// Holds the final settings of the slider after merging the specified
		// ones with the default ones.
		this.settings = {};

		// Another reference to the settings which will not be altered by breakpoints or by other means
		this.originalSettings = {};

		// Reference to the original 'gotoSlide' method
		this.originalGotoSlide = null;

		// The index of the currently selected slide (starts with 0)
		this.selectedSlideIndex = 0;

		// The index of the previously selected slide
		this.previousSlideIndex = 0;

		// Indicates the position of the slide considered to be in the middle.
		// If there are 5 slides (0, 1, 2, 3, 4) the middle position will be 2.
		// If there are 6 slides (0, 1, 2, 3, 4, 5) the middle position will be approximated to 2.
		this.middleSlidePosition = 0;

		// Indicates the type of supported transition (CSS3 2D, CSS3 3D or JavaScript)
		this.supportedAnimation = null;

		// Indicates the required vendor prefix for CSS (i.e., -webkit, -moz, etc.)
		this.vendorPrefix = null;

		// Indicates the name of the CSS transition's complete event (i.e., transitionend, webkitTransitionEnd, etc.)
		this.transitionEvent = null;

		// Indicates the 'left' or 'top' position
		this.positionProperty = null;

		// Indicates if the current browser is IE
		this.isIE = null;

		// The position of the slides container
		this.slidesPosition = 0;

		// The width of the individual slide
		this.slideWidth = 0;

		// The height of the individual slide
		this.slideHeight = 0;

		// The width or height, depending on the orientation, of the individual slide
		this.slideSize = 0;

		// Reference to the old slide width, used to check if the width has changed
		this.previousSlideWidth = 0;

		// Reference to the old slide height, used to check if the height has changed
		this.previousSlideHeight = 0;
		
		// Reference to the old window width, used to check if the window width has changed
		this.previousWindowWidth = 0;
		
		// Reference to the old window height, used to check if the window height has changed
		this.previousWindowHeight = 0;

		// The distance from the margin of the slider to the left/top of the selected slide.
		// This is useful in calculating the position of the selected slide when there are 
		// more visible slides.
		this.visibleOffset = 0;

		// Property used for deferring the resizing of the slider
		this.allowResize = true;

		// Unique ID to be used for event listening
		this.uniqueId = new Date().valueOf();

		// Stores size breakpoints
		this.breakpoints = [];

		// Indicates the current size breakpoint
		this.currentBreakpoint = -1;

		// An array of shuffled indexes, based on which the slides will be shuffled
		this.shuffledIndexes = [];

		// Initialize the slider
		this._init();
	};

	SliderPro.prototype = {

		// The starting place for the slider
		_init: function() {
			var that = this;

			this.supportedAnimation = SliderProUtils.getSupportedAnimation();
			this.vendorPrefix = SliderProUtils.getVendorPrefix();
			this.transitionEvent = SliderProUtils.getTransitionEvent();
			this.isIE = SliderProUtils.checkIE();

			// Remove the 'sp-no-js' when the slider's JavaScript code starts running
			this.$slider.removeClass( 'sp-no-js' );

			// Add the 'ios' class if it's an iOS device
			if ( window.navigator.userAgent.match( /(iPad|iPhone|iPod)/g ) ) {
				this.$slider.addClass( 'ios' );
			}

			// Check if IE (older than 11) is used and add the version number as a class to the slider since
			// older IE versions might need CSS tweaks.
			var rmsie = /(msie) ([\w.]+)/,
				ieVersion = rmsie.exec( window.navigator.userAgent.toLowerCase() );
			
			if ( this.isIE ) {
				this.$slider.addClass( 'ie' );
			}

			if ( ieVersion !== null ) {
				this.$slider.addClass( 'ie' + parseInt( ieVersion[2], 10 ) );
			}

			// Set up the slides containers
			// slider-pro > sp-slides-container > sp-mask > sp-slides > sp-slide
			this.$slidesContainer = $( '<div class="sp-slides-container"></div>' ).appendTo( this.$slider );
			this.$slidesMask = $( '<div class="sp-mask"></div>' ).appendTo( this.$slidesContainer );
			this.$slides = this.$slider.find( '.sp-slides' ).appendTo( this.$slidesMask );
			this.$slider.find( '.sp-slide' ).appendTo( this.$slides );
			
			var modules = $.SliderPro.modules;

			// Merge the modules' default settings with the core's default settings
			if ( typeof modules !== 'undefined' ) {
				for ( var i = 0; i < modules.length; i++ ) {
					var defaults = modules[ i ].substring( 0, 1 ).toLowerCase() + modules[ i ].substring( 1 ) + 'Defaults';

					if ( typeof this[ defaults ] !== 'undefined' ) {
						$.extend( this.defaults, this[ defaults ] );
					}
				}
			}

			// Merge the specified setting with the default ones
			this.settings = $.extend( {}, this.defaults, this.options );

			// Initialize the modules
			if ( typeof modules !== 'undefined' ) {
				for ( var j = 0; j < modules.length; j++ ) {
					if ( typeof this[ 'init' + modules[ j ] ] !== 'undefined' ) {
						this[ 'init' + modules[ j ] ]();
					}
				}
			}

			// Keep a reference of the original settings and use it
			// to restore the settings when the breakpoints are used.
			this.originalSettings = $.extend( {}, this.settings );

			// Get the reference to the 'gotoSlide' method
			this.originalGotoSlide = this.gotoSlide;

			// Parse the breakpoints object and store the values into an array,
			// sorting them in ascending order based on the specified size.
			if ( this.settings.breakpoints !== null ) {
				for ( var sizes in this.settings.breakpoints ) {
					this.breakpoints.push({ size: parseInt( sizes, 10 ), properties:this.settings.breakpoints[ sizes ] });
				}

				this.breakpoints = this.breakpoints.sort(function( a, b ) {
					return a.size >= b.size ? 1: -1;
				});
			}

			// Set which slide should be selected initially
			this.selectedSlideIndex = this.settings.startSlide;

			// Shuffle/randomize the slides
			if ( this.settings.shuffle === true ) {
				var slides = this.$slides.find( '.sp-slide' ),
					shuffledSlides = [];

				// Populate the 'shuffledIndexes' with index numbers
				slides.each(function( index ) {
					that.shuffledIndexes.push( index );
				});

				for ( var k = this.shuffledIndexes.length - 1; k > 0; k-- ) {
					var l = Math.floor( Math.random() * ( k + 1 ) ),
						temp = this.shuffledIndexes[ k ];

					this.shuffledIndexes[ k ] = this.shuffledIndexes[ l ];
					this.shuffledIndexes[ l ] = temp;
				}

				// Reposition the slides based on the order of the indexes in the
				// 'shuffledIndexes' array
				$.each( this.shuffledIndexes, function( index, element ) {
					shuffledSlides.push( slides[ element ] );
				});
				
				// Append the sorted slides to the slider
				this.$slides.empty().append( shuffledSlides ) ;
			}
			
			// Resize the slider when the browser window resizes.
			// Also, deffer the resizing in order to not allow multiple
			// resizes in a 200 milliseconds interval.
			$( window ).on( 'resize.' + this.uniqueId + '.' + NS, function() {
			
				// Get the current width and height of the window
				var newWindowWidth = $( window ).width(),
					newWindowHeight = $( window ).height();
				
				// If the resize is not allowed yet or if the window size hasn't changed (this needs to be verified
				// because in IE8 and lower the resize event is triggered whenever an element from the page changes
				// its size) return early.
				if ( that.allowResize === false ||
					( that.previousWindowWidth === newWindowWidth && that.previousWindowHeight === newWindowHeight ) ) {
					return;
				}
				
				// Asign the new values for the window width and height
				that.previousWindowWidth = newWindowWidth;
				that.previousWindowHeight = newWindowHeight;
			
				that.allowResize = false;

				setTimeout(function() {
					that.resize();
					that.allowResize = true;
				}, 200 );
			});

			// Resize the slider when the 'update' method is called.
			this.on( 'update.' + NS, function() {

				// Reset the previous slide width
				that.previousSlideWidth = 0;

				// Some updates might require a resize
				that.resize();
			});

			this.update();

			// add the 'sp-selected' class to the initially selected slide
			this.$slides.find( '.sp-slide' ).eq( this.selectedSlideIndex ).addClass( 'sp-selected' );

			// Fire the 'init' event
			this.trigger({ type: 'init' });
			if ( $.isFunction( this.settings.init ) ) {
				this.settings.init.call( this, { type: 'init' });
			}
		},

		// Update the slider by checking for setting changes and for slides
		// that weren't initialized yet.
		update: function() {
			var that = this;

			// Check the current slider orientation and reset CSS that might have been
			// added for a different orientation, since the orientation can be changed
			// at runtime.
			if ( this.settings.orientation === 'horizontal' ) {
				this.$slider.removeClass( 'sp-vertical' ).addClass( 'sp-horizontal' );
				this.$slider.css({ 'height': '', 'max-height': '' });
				this.$slides.find( '.sp-slide' ).css( 'top', '' );
			} else if ( this.settings.orientation === 'vertical' ) {
				this.$slider.removeClass( 'sp-horizontal' ).addClass( 'sp-vertical' );
				this.$slides.find( '.sp-slide' ).css( 'left', '' );
			}

			// Set the position that will be used to arrange elements, like the slides,
			// based on the orientation.
			this.positionProperty = this.settings.orientation === 'horizontal' ? 'left' : 'top';

			// Reset the 'gotoSlide' method
			this.gotoSlide = this.originalGotoSlide;

			// Loop through the array of SliderProSlide objects and if a stored slide is found
			// which is not in the DOM anymore, destroy that slide.
			for ( var i = this.slides.length - 1; i >= 0; i-- ) {
				if ( this.$slider.find( '.sp-slide[data-index="' + i + '"]' ).length === 0 ) {
					var slide = this.slides[ i ];

					slide.destroy();
					this.slides.splice( i, 1 );
				}
			}

			this.slidesOrder.length = 0;

			// Loop through the list of slides and initialize newly added slides if any,
			// and reset the index of each slide.
			this.$slider.find( '.sp-slide' ).each(function( index ) {
				var $slide = $( this );

				if ( typeof $slide.attr( 'data-init' ) === 'undefined' ) {
					that._createSlide( index, $slide );
				} else {
					that.slides[ index ].setIndex( index );
				}

				that.slidesOrder.push( index );
			});

			// Calculate the position/index of the middle slide
			this.middleSlidePosition = parseInt( ( that.slidesOrder.length - 1 ) / 2, 10 );

			// Arrange the slides in a loop
			if ( this.settings.loop === true ) {
				this._updateSlidesOrder();
			}

			// Fire the 'update' event
			this.trigger({ type: 'update' });
			if ( $.isFunction( this.settings.update ) ) {
				this.settings.update.call( this, { type: 'update' } );
			}
		},

		// Create a SliderProSlide instance for the slide passed as a jQuery element
		_createSlide: function( index, element ) {
			var that = this,
				slide = new SliderProSlide( $( element ), index, this.settings );

			this.slides.splice( index, 0, slide );
		},

		// Arrange the slide elements in a loop inside the 'slidesOrder' array
		_updateSlidesOrder: function() {
			var	slicedItems,
				i,

				// Calculate the distance between the selected element and the middle position
				distance = $.inArray( this.selectedSlideIndex, this.slidesOrder ) - this.middleSlidePosition;

			// If the distance is negative it means that the selected slider is before the middle position, so
			// slides from the end of the array will be added at the beginning, in order to shift the selected slide
			// forward.
			// 
			// If the distance is positive, slides from the beginning of the array will be added at the end.
			if ( distance < 0 ) {
				slicedItems = this.slidesOrder.splice( distance, Math.abs( distance ) );

				for ( i = slicedItems.length - 1; i >= 0; i-- ) {
					this.slidesOrder.unshift( slicedItems[ i ] );
				}
			} else if ( distance > 0 ) {
				slicedItems = this.slidesOrder.splice( 0, distance );

				for ( i = 0; i <= slicedItems.length - 1; i++ ) {
					this.slidesOrder.push( slicedItems[ i ] );
				}
			}
		},

		// Set the left/top position of the slides based on their position in the 'slidesOrder' array
		_updateSlidesPosition: function() {
			var selectedSlidePixelPosition = parseInt( this.$slides.find( '.sp-slide' ).eq( this.selectedSlideIndex ).css( this.positionProperty ), 10 );

			for ( var slideIndex = 0; slideIndex < this.slidesOrder.length; slideIndex++ ) {
				var slide = this.$slides.find( '.sp-slide' ).eq( this.slidesOrder[ slideIndex ] );
				slide.css( this.positionProperty, selectedSlidePixelPosition + ( slideIndex - this.middleSlidePosition  ) * ( this.slideSize + this.settings.slideDistance ) );
			}
		},

		// Set the left/top position of the slides based on their position in the 'slidesOrder' array,
		// and also set the position of the slides container.
		_resetSlidesPosition: function() {
			for ( var slideIndex = 0; slideIndex < this.slidesOrder.length; slideIndex++ ) {
				var slide = this.$slides.find( '.sp-slide' ).eq( this.slidesOrder[ slideIndex ] );
				slide.css( this.positionProperty, slideIndex * ( this.slideSize + this.settings.slideDistance ) );
			}

			var newSlidesPosition = - parseInt( this.$slides.find( '.sp-slide' ).eq( this.selectedSlideIndex ).css( this.positionProperty ), 10 ) + this.visibleOffset;
			this._moveTo( newSlidesPosition, true );
		},

		// Called when the slider needs to resize
		resize: function() {
			var that = this;

			// Check if the current window width is bigger than the biggest breakpoint
			// and if necessary reset the properties to the original settings.
			// 
			// If the window width is smaller than a certain breakpoint, apply the settings specified
			// for that breakpoint but only after merging them with the original settings
			// in order to make sure that only the specified settings for the breakpoint are applied
			if ( this.settings.breakpoints !== null && this.breakpoints.length > 0 ) {
				if ( $( window ).width() > this.breakpoints[ this.breakpoints.length - 1 ].size && this.currentBreakpoint !== -1 ) {
					this.currentBreakpoint = -1;
					this._setProperties( this.originalSettings, false );
				} else {
					for ( var i = 0, n = this.breakpoints.length; i < n; i++ ) {
						if ( $( window ).width() <= this.breakpoints[ i ].size ) {
							if ( this.currentBreakpoint !== this.breakpoints[ i ].size ) {
								var eventObject = { type: 'breakpointReach', size: this.breakpoints[ i ].size, settings: this.breakpoints[ i ].properties };
								this.trigger( eventObject );
								if ( $.isFunction( this.settings.breakpointReach ) )
									this.settings.breakpointReach.call( this, eventObject );

								this.currentBreakpoint = this.breakpoints[ i ].size;
								var settings = $.extend( {}, this.originalSettings, this.breakpoints[ i ].properties );
								this._setProperties( settings, false );
								
								return;
							}

							break;
						}
					}
				}
			}

			// Set the width of the main slider container based on whether or not the slider is responsive,
			// full width or full size
			if ( this.settings.responsive === true ) {
				if ( ( this.settings.forceSize === 'fullWidth' || this.settings.forceSize === 'fullWindow' ) &&
					( this.settings.visibleSize === 'auto' || this.settings.visibleSize !== 'auto' && this.settings.orientation === 'vertical' )
				) {
					this.$slider.css( 'margin', 0 );
					this.$slider.css({ 'width': $( window ).width(), 'max-width': '', 'marginLeft': - this.$slider.offset().left });
				} else {
					this.$slider.css({ 'width': '100%', 'max-width': this.settings.width, 'marginLeft': '' });
				}
			} else {
				this.$slider.css({ 'width': this.settings.width });
			}

			// Calculate the aspect ratio of the slider
			if ( this.settings.aspectRatio === -1 ) {
				this.settings.aspectRatio = this.settings.width / this.settings.height;
			}
			
			// Initially set the slide width to the size of the slider.
			// Later, this will be set to less if there are multiple visible slides.
			this.slideWidth = this.$slider.width();

			// Set the height to the same size as the browser window if the slider is set to be 'fullWindow',
			// or calculate the height based on the width and the aspect ratio.
			if ( this.settings.forceSize === 'fullWindow' ) {
				this.slideHeight = $( window ).height();
			} else {
				this.slideHeight = isNaN( this.settings.aspectRatio ) ? this.settings.height : this.slideWidth / this.settings.aspectRatio;
			}

			// Resize the slider only if the size of the slider has changed
			// If it hasn't, return.
			if ( this.previousSlideWidth !== this.slideWidth ||
				this.previousSlideHeight !== this.slideHeight ||
				this.settings.visibleSize !== 'auto' ||
				this.$slider.outerWidth() > this.$slider.parent().width() ||
				this.$slider.width() !== this.$slidesMask.width()
			) {
				this.previousSlideWidth = this.slideWidth;
				this.previousSlideHeight = this.slideHeight;
			} else {
				return;
			}

			// The slide width or slide height is needed for several calculation, so create a reference to it
			// based on the current orientation.
			this.slideSize = this.settings.orientation === 'horizontal' ? this.slideWidth : this.slideHeight;
			
			// Initially set the visible size of the slides and the offset of the selected slide as if there is only
			// on visible slide.
			// If there will be multiple visible slides (when 'visibleSize' is different than 'auto'), these will
			// be updated accordingly.
			this.visibleSlidesSize = this.slideSize;
			this.visibleOffset = 0;

			// Loop through the existing slides and reset their size.
			$.each( this.slides, function( index, element ) {
				element.setSize( that.slideWidth, that.slideHeight );
			});

			// Set the initial size of the mask container to the size of an individual slide
			this.$slidesMask.css({ 'width': this.slideWidth, 'height': this.slideHeight });

			// Adjust the height if it's set to 'auto'
			if ( this.settings.autoHeight === true ) {

				// Delay the resizing of the height to allow for other resize handlers
				// to execute first before calculating the final height of the slide
				setTimeout( function() {
					that._resizeHeight();
				}, 1 );
			} else {
				this.$slidesMask.css( this.vendorPrefix + 'transition', '' );
			}

			// The 'visibleSize' option can be set to fixed or percentage size to make more slides
			// visible at a time.
			// By default it's set to 'auto'.
			if ( this.settings.visibleSize !== 'auto' ) {
				if ( this.settings.orientation === 'horizontal' ) {

					// If the size is forced to full width or full window, the 'visibleSize' option will be
					// ignored and the slider will become as wide as the browser window.
					if ( this.settings.forceSize === 'fullWidth' || this.settings.forceSize === 'fullWindow' ) {
						this.$slider.css( 'margin', 0 );
						this.$slider.css({ 'width': $( window ).width(), 'max-width': '', 'marginLeft': - this.$slider.offset().left });
					} else {
						this.$slider.css({ 'width': this.settings.visibleSize, 'max-width': '100%', 'marginLeft': 0 });
					}
					
					this.$slidesMask.css( 'width', this.$slider.width() );

					this.visibleSlidesSize = this.$slidesMask.width();
					this.visibleOffset = Math.round( ( this.$slider.width() - this.slideWidth ) / 2 );
				} else {

					// If the size is forced to full window, the 'visibleSize' option will be
					// ignored and the slider will become as high as the browser window.
					if ( this.settings.forceSize === 'fullWindow' ) {
						this.$slider.css({ 'height': $( window ).height(), 'max-height': '' });
					} else {
						this.$slider.css({ 'height': this.settings.visibleSize, 'max-height': '100%' });
					}

					this.$slidesMask.css( 'height', this.$slider.height() );

					this.visibleSlidesSize = this.$slidesMask.height();
					this.visibleOffset = Math.round( ( this.$slider.height() - this.slideHeight ) / 2 );
				}
			}

			this._resetSlidesPosition();

			// Fire the 'sliderResize' event
			this.trigger({ type: 'sliderResize' });
			if ( $.isFunction( this.settings.sliderResize ) ) {
				this.settings.sliderResize.call( this, { type: 'sliderResize' });
			}
		},

		// Resize the height of the slider to the height of the selected slide.
		// It's used when the 'autoHeight' option is set to 'true'.
		_resizeHeight: function() {
			var that = this,
				selectedSlide = this.getSlideAt( this.selectedSlideIndex ),
				size = selectedSlide.getSize();

			selectedSlide.off( 'imagesLoaded.' + NS );
			selectedSlide.on( 'imagesLoaded.' + NS, function( event ) {
				if ( event.index === that.selectedSlideIndex ) {
					var size = selectedSlide.getSize();
					that._resizeHeightTo( size.height );
				}
			});

			// If the selected slide contains images which are still loading,
			// wait for the loading to complete and then request the size again.
			if ( size !== 'loading' ) {
				this._resizeHeightTo( size.height );
			}
		},

		// Open the slide at the specified index
		gotoSlide: function( index ) {
			if ( index === this.selectedSlideIndex || typeof this.slides[ index ] === 'undefined' ) {
				return;
			}

			var that = this;

			this.previousSlideIndex = this.selectedSlideIndex;
			this.selectedSlideIndex = index;

			// Re-assign the 'sp-selected' class to the currently selected slide
			this.$slides.find( '.sp-selected' ).removeClass( 'sp-selected' );
			this.$slides.find( '.sp-slide' ).eq( this.selectedSlideIndex ).addClass( 'sp-selected' );

			// If the slider is loopable reorder the slides to have the selected slide in the middle
			// and update the slides' position.
			if ( this.settings.loop === true ) {
				this._updateSlidesOrder();
				this._updateSlidesPosition();
			}

			// Adjust the height of the slider
			if ( this.settings.autoHeight === true ) {
				this._resizeHeight();
			}

			// Calculate the new position that the slides container need to take
			var newSlidesPosition = - parseInt( this.$slides.find( '.sp-slide' ).eq( this.selectedSlideIndex ).css( this.positionProperty ), 10 ) + this.visibleOffset;

			// Move the slides container to the new position
			this._moveTo( newSlidesPosition, false, function() {
				if ( that.settings.loop === true ) {
					that._resetSlidesPosition();
				}

				// Fire the 'gotoSlideComplete' event
				that.trigger({ type: 'gotoSlideComplete', index: index, previousIndex: that.previousSlideIndex });
				if ( $.isFunction( that.settings.gotoSlideComplete ) ) {
					that.settings.gotoSlideComplete.call( that, { type: 'gotoSlideComplete', index: index, previousIndex: that.previousSlideIndex } );
				}
			});

			// Fire the 'gotoSlide' event
			this.trigger({ type: 'gotoSlide', index: index, previousIndex: this.previousSlideIndex });
			if ( $.isFunction( this.settings.gotoSlide ) ) {
				this.settings.gotoSlide.call( this, { type: 'gotoSlide', index: index, previousIndex: this.previousSlideIndex } );
			}
		},

		// Open the next slide
		nextSlide: function() {
			var index = ( this.selectedSlideIndex >= this.getTotalSlides() - 1 ) ? 0 : ( this.selectedSlideIndex + 1 );
			this.gotoSlide( index );
		},

		// Open the previous slide
		previousSlide: function() {
			var index = this.selectedSlideIndex <= 0 ? ( this.getTotalSlides() - 1 ) : ( this.selectedSlideIndex - 1 );
			this.gotoSlide( index );
		},

		// Move the slides container to the specified position.
		// The movement can be instant or animated.
		_moveTo: function( position, instant, callback ) {
			var that = this,
				css = {};

			if ( position === this.slidesPosition ) {
				return;
			}
			
			this.slidesPosition = position;
			
			if ( ( this.supportedAnimation === 'css-3d' || this.supportedAnimation === 'css-2d' ) && this.isIE === false ) {
				var transition,
					left = this.settings.orientation === 'horizontal' ? position : 0,
					top = this.settings.orientation === 'horizontal' ? 0 : position;

				if ( this.supportedAnimation === 'css-3d' ) {
					css[ this.vendorPrefix + 'transform' ] = 'translate3d(' + left + 'px, ' + top + 'px, 0)';
				} else {
					css[ this.vendorPrefix + 'transform' ] = 'translate(' + left + 'px, ' + top + 'px)';
				}

				if ( typeof instant !== 'undefined' && instant === true ) {
					transition = '';
				} else {
					this.$slides.addClass( 'sp-animated' );
					transition = this.vendorPrefix + 'transform ' + this.settings.slideAnimationDuration / 1000 + 's';

					this.$slides.on( this.transitionEvent, function( event ) {
						if ( event.target !== event.currentTarget ) {
							return;
						}

						that.$slides.off( that.transitionEvent );
						that.$slides.removeClass( 'sp-animated' );
						
						if ( typeof callback === 'function' ) {
							callback();
						}
					});
				}

				css[ this.vendorPrefix + 'transition' ] = transition;

				this.$slides.css( css );
			} else {
				css[ 'margin-' + this.positionProperty ] = position;

				if ( typeof instant !== 'undefined' && instant === true ) {
					this.$slides.css( css );
				} else {
					this.$slides.addClass( 'sp-animated' );
					this.$slides.animate( css, this.settings.slideAnimationDuration, function() {
						that.$slides.removeClass( 'sp-animated' );

						if ( typeof callback === 'function' ) {
							callback();
						}
					});
				}
			}
		},

		// Stop the movement of the slides
		_stopMovement: function() {
			var css = {};

			if ( ( this.supportedAnimation === 'css-3d' || this.supportedAnimation === 'css-2d' ) && this.isIE === false) {

				// Get the current position of the slides by parsing the 'transform' property
				var	matrixString = this.$slides.css( this.vendorPrefix + 'transform' ),
					matrixType = matrixString.indexOf( 'matrix3d' ) !== -1 ? 'matrix3d' : 'matrix',
					matrixArray = matrixString.replace( matrixType, '' ).match( /-?[0-9\.]+/g ),
					left = matrixType === 'matrix3d' ? parseInt( matrixArray[ 12 ], 10 ) : parseInt( matrixArray[ 4 ], 10 ),
					top = matrixType === 'matrix3d' ? parseInt( matrixArray[ 13 ], 10 ) : parseInt( matrixArray[ 5 ], 10 );
					
				// Set the transform property to the value that the transform had when the function was called
				if ( this.supportedAnimation === 'css-3d' ) {
					css[ this.vendorPrefix + 'transform' ] = 'translate3d(' + left + 'px, ' + top + 'px, 0)';
				} else {
					css[ this.vendorPrefix + 'transform' ] = 'translate(' + left + 'px, ' + top + 'px)';
				}

				css[ this.vendorPrefix + 'transition' ] = '';

				this.$slides.css( css );
				this.$slides.off( this.transitionEvent );
				this.slidesPosition = this.settings.orientation === 'horizontal' ? left : top;
			} else {
				this.$slides.stop();
				this.slidesPosition = parseInt( this.$slides.css( 'margin-' + this.positionProperty ), 10 );
			}

			this.$slides.removeClass( 'sp-animated' );
		},

		// Resize the height of the slider to the specified value
		_resizeHeightTo: function( height ) {
			var that = this,
				css = { 'height': height };

			if ( this.supportedAnimation === 'css-3d' || this.supportedAnimation === 'css-2d' ) {
				css[ this.vendorPrefix + 'transition' ] = 'height ' + this.settings.heightAnimationDuration / 1000 + 's';

				this.$slidesMask.off( this.transitionEvent );
				this.$slidesMask.on( this.transitionEvent, function( event ) {
					if ( event.target !== event.currentTarget ) {
						return;
					}

					that.$slidesMask.off( that.transitionEvent );

					// Fire the 'resizeHeightComplete' event
					that.trigger({ type: 'resizeHeightComplete' });
					if ( $.isFunction( that.settings.resizeHeightComplete ) ) {
						that.settings.resizeHeightComplete.call( that, { type: 'resizeHeightComplete' } );
					}
				});

				this.$slidesMask.css( css );
			} else {
				this.$slidesMask.stop().animate( css, this.settings.heightAnimationDuration, function( event ) {
					// Fire the 'resizeHeightComplete' event
					that.trigger({ type: 'resizeHeightComplete' });
					if ( $.isFunction( that.settings.resizeHeightComplete ) ) {
						that.settings.resizeHeightComplete.call( that, { type: 'resizeHeightComplete' } );
					}
				});
			}
		},

		// Destroy the slider instance
		destroy: function() {
			// Remove the stored reference to this instance
			this.$slider.removeData( 'sliderPro' );
			
			// Clean the CSS
			this.$slider.removeAttr( 'style' );
			this.$slides.removeAttr( 'style' );

			// Remove event listeners
			this.off( 'update.' + NS );
			$( window ).off( 'resize.' + this.uniqueId + '.' + NS );

			// Destroy modules
			var modules = $.SliderPro.modules;

			if ( typeof modules !== 'undefined' ) {
				for ( var i = 0; i < modules.length; i++ ) {
					if ( typeof this[ 'destroy' + modules[ i ] ] !== 'undefined' ) {
						this[ 'destroy' + modules[ i ] ]();
					}
				}
			}

			// Destroy all slides
			$.each( this.slides, function( index, element ) {
				element.destroy();
			});

			this.slides.length = 0;

			// Move the slides to their initial position in the DOM and 
			// remove the container elements created dynamically.
			this.$slides.prependTo( this.$slider );
			this.$slidesContainer.remove();
		},

		// Set properties on runtime
		_setProperties: function( properties, store ) {
			// Parse the properties passed as an object
			for ( var prop in properties ) {
				this.settings[ prop ] = properties[ prop ];

				// Alter the original settings as well unless 'false' is passed to the 'store' parameter
				if ( store !== false ) {
					this.originalSettings[ prop ] = properties[ prop ];
				}
			}

			this.update();
		},

		// Attach an event handler to the slider
		on: function( type, callback ) {
			return this.$slider.on( type, callback );
		},

		// Detach an event handler
		off: function( type ) {
			return this.$slider.off( type );
		},

		// Trigger an event on the slider
		trigger: function( data ) {
			return this.$slider.triggerHandler( data );
		},

		// Return the slide at the specified index
		getSlideAt: function( index ) {
			return this.slides[ index ];
		},

		// Return the index of the currently opened slide
		getSelectedSlide: function() {
			return this.selectedSlideIndex;
		},

		// Return the total amount of slides
		getTotalSlides: function() {
			return this.slides.length;
		},

		// The default options of the slider
		defaults: {
			// Width of the slide
			width: 500,

			// Height of the slide
			height: 300,

			// Indicates if the slider is responsive
			responsive: true,

			// The aspect ratio of the slider (width/height)
			aspectRatio: -1,

			// The scale mode for images (cover, contain, exact and none)
			imageScaleMode: 'cover',

			// Indicates if the image will be centered
			centerImage: true,

			// Indicates if the image can be scaled up more than its original size
			allowScaleUp: true,

			// Indicates if height of the slider will be adjusted to the
			// height of the selected slide
			autoHeight: false,

			// Indicates the initially selected slide
			startSlide: 0,

			// Indicates if the slides will be shuffled
			shuffle: false,

			// Indicates whether the slides will be arranged horizontally
			// or vertically. Can be set to 'horizontal' or 'vertical'.
			orientation: 'horizontal',

			// Indicates if the size of the slider will be forced to 'fullWidth' or 'fullWindow'
			forceSize: 'none',

			// Indicates if the slider will be loopable
			loop: true,

			// The distance between slides
			slideDistance: 10,

			// The duration of the slide animation
			slideAnimationDuration: 700,

			// The duration of the height animation
			heightAnimationDuration: 700,

			// Sets the size of the visible area, allowing the increase of it in order
			// to make more slides visible.
			// By default, only the selected slide will be visible. 
			visibleSize: 'auto',

			// Breakpoints for allowing the slider's options to be changed
			// based on the size of the window.
			breakpoints: null,

			// Called when the slider is initialized
			init: function() {},

			// Called when the slider is updates
			update: function() {},

			// Called when the slider is resized
			sliderResize: function() {},

			// Called when a new slide is selected
			gotoSlide: function() {},

			// Called when the navigation to the newly selected slide is complete
			gotoSlideComplete: function() {},

			// Called when the height animation of the slider is complete
			resizeHeightComplete: function() {},

			// Called when a breakpoint is reached
			breakpointReach: function() {}
		}
	};

	var SliderProSlide = function( slide, index, settings ) {

		// Reference to the slide jQuery element
		this.$slide = slide;

		// Reference to the main slide image
		this.$mainImage = null;

		// Reference to the container that will hold the main image
		this.$imageContainer = null;

		// Indicates whether the slide has a main image
		this.hasMainImage = false;

		// Indicates whether the main image is loaded
		this.isMainImageLoaded = false;

		// Indicates whether the main image is in the process of being loaded
		this.isMainImageLoading = false;

		// Indicates whether the slide has any image. There could be other images (i.e., in layers)
		// besides the main slide image.
		this.hasImages = false;

		// Indicates if all the images in the slide are loaded
		this.areImagesLoaded = false;

		// The width and height of the slide
		this.width = 0;
		this.height = 0;

		// Reference to the global settings of the slider
		this.settings = settings;

		// Set the index of the slide
		this.setIndex( index );

		// Initialize the slide
		this._init();
	};

	SliderProSlide.prototype = {

		// The starting point for the slide
		_init: function() {
			var that = this;

			// Mark the slide as initialized
			this.$slide.attr( 'data-init', true );

			// Get the main slide image if there is one
			this.$mainImage = this.$slide.find( '.sp-image' ).length !== 0 ? this.$slide.find( '.sp-image' ) : null;

			// If there is a main slide image, create a container for it and add the image to this container.
			// The container will allow the isolation of the image from the rest of the slide's content. This is
			// helpful when you want to show some content below the image and not cover it.
			if ( this.$mainImage !== null ) {
				this.hasMainImage = true;

				this.$imageContainer = $( '<div class="sp-image-container"></div>' ).prependTo( this.$slide );

				if ( this.$mainImage.parent( 'a' ).length !== 0 ) {
					this.$mainImage.parent( 'a' ).appendTo( this.$imageContainer );
				} else {
					this.$mainImage.appendTo( this.$imageContainer );
				}
			}

			this.hasImages = this.$slide.find( 'img' ).length !== 0 ? true : false;
		},

		// Set the size of the slide
		setSize: function( width, height ) {
			var that = this;
			
			this.width = width;
			this.height = this.settings.autoHeight === true ? 'auto' : height;

			this.$slide.css({
				'width': this.width,
				'height': this.height
			});

			if ( this.hasMainImage === true ) {
				this.$imageContainer.css({
					'width': this.width,
					'height': this.height
				});

				// Resize the main image if it's loaded. If the 'data-src' attribute is present it means
				// that the image will be lazy-loaded
				if ( typeof this.$mainImage.attr( 'data-src' ) === 'undefined' ) {
					this.resizeMainImage();
				}
			}
		},

		// Get the size (width and height) of the slide
		getSize: function() {
			var that = this,
				size;

			// Check if all images have loaded, and if they have, return the size, else, return 'loading'
			if ( this.hasImages === true && this.areImagesLoaded === false && typeof this.$slide.attr( 'data-loading' ) === 'undefined' ) {
				this.$slide.attr( 'data-loading', true );

				var status = SliderProUtils.checkImagesComplete( this.$slide, function() {
					that.areImagesLoaded = true;
					that.$slide.removeAttr( 'data-loading' );
					that.trigger({ type: 'imagesLoaded.' + NS, index: that.index });
				});

				if ( status === 'complete' ) {
					size = this.calculateSize();

					return {
						'width': size.width,
						'height': size.height
					};
				} else {
					return 'loading';
				}
			} else {
				size = this.calculateSize();

				return {
					'width': size.width,
					'height': size.height
				};
			}
		},

		// Calculate the width and height of the slide by going
		// through all the child elements and measuring their 'bottom'
		// and 'right' properties. The element with the biggest
		// 'right'/'bottom' property will determine the slide's
		// width/height.
		calculateSize: function() {
			var width = this.$slide.width(),
				height = this.$slide.height();

			this.$slide.children().each(function( index, element ) {
				var child = $( element );

				if ( child.is( ':hidden' ) === true ) {
					return;
				}

				var	rect = element.getBoundingClientRect(),
					bottom = child.position().top + ( rect.bottom - rect.top ),
					right = child.position().left + ( rect.right - rect.left );

				if ( bottom > height ) {
					height = bottom;
				}

				if ( right > width ) {
					width = right;
				}
			});

			return { width: width, height: height };
		},

		// Resize the main image.
		// 
		// Call this when the slide resizes or when the main image has changed to a different image.
		resizeMainImage: function( isNewImage ) {
			var that = this;

			// If the main image has changed, reset the 'flags'
			if ( isNewImage === true ) {
				this.isMainImageLoaded = false;
				this.isMainImageLoading = false;
			}

			// If the image was not loaded yet and it's not in the process of being loaded, load it
			if ( this.isMainImageLoaded === false && this.isMainImageLoading === false ) {
				this.isMainImageLoading = true;

				SliderProUtils.checkImagesComplete( this.$mainImage, function() {
					that.isMainImageLoaded = true;
					that.isMainImageLoading = false;
					that.resizeMainImage();
					that.trigger({ type: 'imagesLoaded.' + NS, index: that.index });
				});

				return;
			}

			if ( this.settings.allowScaleUp === false ) {
				this.$mainImage.css({ 'width': '', 'height': '', 'maxWidth': '', 'maxHeight': '' });

				var naturalWidth = this.$mainImage.width(),
					naturalHeight = this.$mainImage.height();

				this.$mainImage.css({ 'maxWidth': naturalWidth, 'maxHeight': naturalHeight });
			}

			// After the main image has loaded, resize it
			if ( this.settings.autoHeight === true ) {
				this.$mainImage.css({ width: '100%', height: 'auto' });
			} else {
				if ( this.settings.imageScaleMode === 'cover' ) {
					if ( this.$mainImage.width() / this.$mainImage.height() <= this.width / this.height ) {
						this.$mainImage.css({ width: '100%', height: 'auto' });
					} else {
						this.$mainImage.css({ width: 'auto', height: '100%' });
					}
				} else if ( this.settings.imageScaleMode === 'contain' ) {
					if ( this.$mainImage.width() / this.$mainImage.height() >= this.width / this.height ) {
						this.$mainImage.css({ width: '100%', height: 'auto' });
					} else {
						this.$mainImage.css({ width: 'auto', height: '100%' });
					}
				} else if ( this.settings.imageScaleMode === 'exact' ) {
					this.$mainImage.css({ width: '100%', height: '100%' });
				}
			}

			if ( this.settings.centerImage === true ) {
				this.$mainImage.css({ 'marginLeft': ( this.$imageContainer.width() - this.$mainImage.width() ) * 0.5, 'marginTop': ( this.$imageContainer.height() - this.$mainImage.height() ) * 0.5 });
			}
		},

		// Destroy the slide
		destroy: function() {
			// Clean the slide element from attached styles and data
			this.$slide.removeAttr( 'style' );
			this.$slide.removeAttr( 'data-init' );
			this.$slide.removeAttr( 'data-index' );
			this.$slide.removeAttr( 'data-loaded' );

			// If there is a main image, remove its container
			if ( this.hasMainImage === true ) {
				this.$slide.find( '.sp-image' )
					.removeAttr( 'style' )
					.appendTo( this.$slide );

				this.$slide.find( '.sp-image-container' ).remove();
			}
		},

		// Return the index of the slide
		getIndex: function() {
			return this.index;
		},

		// Set the index of the slide
		setIndex: function( index ) {
			this.index = index;
			this.$slide.attr( 'data-index', this.index );
		},

		// Attach an event handler to the slide
		on: function( type, callback ) {
			return this.$slide.on( type, callback );
		},

		// Detach an event handler to the slide
		off: function( type ) {
			return this.$slide.off( type );
		},

		// Trigger an event on the slide
		trigger: function( data ) {
			return this.$slide.triggerHandler( data );
		}
	};

	window.SliderPro = SliderPro;
	window.SliderProSlide = SliderProSlide;

	$.fn.sliderPro = function( options ) {
		var args = Array.prototype.slice.call( arguments, 1 );

		return this.each(function() {
			// Instantiate the slider or alter it
			if ( typeof $( this ).data( 'sliderPro' ) === 'undefined' ) {
				var newInstance = new SliderPro( this, options );

				// Store a reference to the instance created
				$( this ).data( 'sliderPro', newInstance );
			} else if ( typeof options !== 'undefined' ) {
				var	currentInstance = $( this ).data( 'sliderPro' );

				// Check the type of argument passed
				if ( typeof currentInstance[ options ] === 'function' ) {
					currentInstance[ options ].apply( currentInstance, args );
				} else if ( typeof currentInstance.settings[ options ] !== 'undefined' ) {
					var obj = {};
					obj[ options ] = args[ 0 ];
					currentInstance._setProperties( obj );
				} else if ( typeof options === 'object' ) {
					currentInstance._setProperties( options );
				} else {
					$.error( options + ' does not exist in sliderPro.' );
				}
			}
		});
	};

	// Contains useful utility functions
	var SliderProUtils = {

		// Indicates what type of animations are supported in the current browser
		// Can be CSS 3D, CSS 2D or JavaScript
		supportedAnimation: null,

		// Indicates the required vendor prefix for the current browser
		vendorPrefix: null,

		// Indicates the name of the transition's complete event for the current browser
		transitionEvent: null,

		// Indicates if the current browser is Internet Explorer (any version)
		isIE: null,

		// Check whether CSS3 3D or 2D transforms are supported. If they aren't, use JavaScript animations
		getSupportedAnimation: function() {
			if ( this.supportedAnimation !== null ) {
				return this.supportedAnimation;
			}

			var element = document.body || document.documentElement,
				elementStyle = element.style,
				isCSSTransitions = typeof elementStyle.transition !== 'undefined' ||
									typeof elementStyle.WebkitTransition !== 'undefined' ||
									typeof elementStyle.MozTransition !== 'undefined' ||
									typeof elementStyle.OTransition !== 'undefined';

			if ( isCSSTransitions === true ) {
				var div = document.createElement( 'div' );

				// Check if 3D transforms are supported
				if ( typeof div.style.WebkitPerspective !== 'undefined' || typeof div.style.perspective !== 'undefined' ) {
					this.supportedAnimation = 'css-3d';
				}

				// Additional checks for Webkit
				if ( this.supportedAnimation === 'css-3d' && typeof div.styleWebkitPerspective !== 'undefined' ) {
					var style = document.createElement( 'style' );
					style.textContent = '@media (transform-3d),(-webkit-transform-3d){#test-3d{left:9px;position:absolute;height:5px;margin:0;padding:0;border:0;}}';
					document.getElementsByTagName( 'head' )[0].appendChild( style );

					div.id = 'test-3d';
					document.body.appendChild( div );

					if ( ! ( div.offsetLeft === 9 && div.offsetHeight === 5 ) ) {
						this.supportedAnimation = null;
					}

					style.parentNode.removeChild( style );
					div.parentNode.removeChild( div );
				}

				// If CSS 3D transforms are not supported, check if 2D transforms are supported
				if ( this.supportedAnimation === null && ( typeof div.style['-webkit-transform'] !== 'undefined' || typeof div.style.transform !== 'undefined' ) ) {
					this.supportedAnimation = 'css-2d';
				}
			} else {
				this.supportedAnimation = 'javascript';
			}
			
			return this.supportedAnimation;
		},

		// Check what vendor prefix should be used in the current browser
		getVendorPrefix: function() {
			if ( this.vendorPrefix !== null ) {
				return this.vendorPrefix;
			}

			var div = document.createElement( 'div' ),
				prefixes = [ 'Webkit', 'Moz', 'ms', 'O' ];
			
			if ( 'transform' in div.style ) {
				this.vendorPrefix = '';
				return this.vendorPrefix;
			}
			
			for ( var i = 0; i < prefixes.length; i++ ) {
				if ( ( prefixes[ i ] + 'Transform' ) in div.style ) {
					this.vendorPrefix = '-' + prefixes[ i ].toLowerCase() + '-';
					break;
				}
			}
			
			return this.vendorPrefix;
		},

		// Check the name of the transition's complete event in the current browser
		getTransitionEvent: function() {
			if ( this.transitionEvent !== null ) {
				return this.transitionEvent;
			}

			var div = document.createElement( 'div' ),
				transitions = {
					'transition': 'transitionend',
					'WebkitTransition': 'webkitTransitionEnd',
					'MozTransition': 'transitionend',
					'OTransition': 'oTransitionEnd'
				};

			for ( var transition in transitions ) {
				if ( transition in div.style ) {
					this.transitionEvent = transitions[ transition ];
					break;
				}
			}

			return this.transitionEvent;
		},

		// If a single image is passed, check if it's loaded.
		// If a different element is passed, check if there are images
		// inside it, and check if these images are loaded.
		checkImagesComplete: function( target, callback ) {
			var that = this,

				// Check the initial status of the image(s)
				status = this.checkImagesStatus( target );

			// If there are loading images, wait for them to load.
			// If the images are loaded, call the callback function directly.
			if ( status === 'loading' ) {
				var checkImages = setInterval(function() {
					status = that.checkImagesStatus( target );

					if ( status === 'complete' ) {
						clearInterval( checkImages );

						if ( typeof callback === 'function' ) {
							callback();
						}
					}
				}, 100 );
			} else if ( typeof callback === 'function' ) {
				callback();
			}

			return status;
		},

		checkImagesStatus: function( target ) {
			var status = 'complete';

			if ( target.is( 'img' ) && target[0].complete === false ) {
				status = 'loading';
			} else {
				target.find( 'img' ).each(function( index ) {
					var image = $( this )[0];

					if ( image.complete === false ) {
						status = 'loading';
					}
				});
			}

			return status;
		},

		checkIE: function() {
			if ( this.isIE !== null ) {
				return this.isIE;
			}

			var userAgent = window.navigator.userAgent,
				msie = userAgent.indexOf( 'MSIE' );

			if ( userAgent.indexOf( 'MSIE' ) !== -1 || userAgent.match( /Trident.*rv\:11\./ ) ) {
				this.isIE = true;
			} else {
				this.isIE = false;
			}

			return this.isIE;
		}
	};

	window.SliderProUtils = SliderProUtils;

})( window, jQuery );

// Thumbnails module for Slider Pro.
// 
// Adds the possibility to create a thumbnail scroller, each thumbnail
// corresponding to a slide.
;(function( window, $ ) {

	"use strict";

	var NS = 'Thumbnails.' + $.SliderPro.namespace;

	var Thumbnails = {

		// Reference to the thumbnail scroller 
		$thumbnails: null,

		// Reference to the container of the thumbnail scroller
		$thumbnailsContainer: null,

		// List of Thumbnail objects
		thumbnails: null,

		// Index of the selected thumbnail
		selectedThumbnailIndex: 0,

		// Total size (width or height, depending on the orientation) of the thumbnails
		thumbnailsSize: 0,

		// Size of the thumbnail's container
		thumbnailsContainerSize: 0,

		// The position of the thumbnail scroller inside its container
		thumbnailsPosition: 0,

		// Orientation of the thumbnails
		thumbnailsOrientation: null,

		// Indicates the 'left' or 'top' position based on the orientation of the thumbnails
		thumbnailsPositionProperty: null,

		// Indicates if there are thumbnails in the slider
		isThumbnailScroller: false,

		initThumbnails: function() {
			var that = this;

			this.thumbnails = [];

			this.on( 'update.' + NS, $.proxy( this._thumbnailsOnUpdate, this ) );
			this.on( 'sliderResize.' + NS, $.proxy( this._thumbnailsOnResize, this ) );
			this.on( 'gotoSlide.' + NS, function( event ) {
				that._gotoThumbnail( event.index );
			});
		},

		// Called when the slider is updated
		_thumbnailsOnUpdate: function() {
			var that = this;

			if ( this.$slider.find( '.sp-thumbnail' ).length === 0 && this.thumbnails.length === 0 ) {
				this.isThumbnailScroller = false;
				return;
			}

			this.isThumbnailScroller = true;

			// Create the container of the thumbnail scroller, if it wasn't created yet
			if ( this.$thumbnailsContainer === null ) {
				this.$thumbnailsContainer = $( '<div class="sp-thumbnails-container"></div>' ).insertAfter( this.$slidesContainer );
			}

			// If the thumbnails' main container doesn't exist, create it, and get a reference to it
			if ( this.$thumbnails === null ) {
				if ( this.$slider.find( '.sp-thumbnails' ).length !== 0 ) {
					this.$thumbnails = this.$slider.find( '.sp-thumbnails' ).appendTo( this.$thumbnailsContainer );

					// Shuffle/randomize the thumbnails
					if ( this.settings.shuffle === true ) {
						var thumbnails = this.$thumbnails.find( '.sp-thumbnail' ),
							shuffledThumbnails = [];

						// Reposition the thumbnails based on the order of the indexes in the
						// 'shuffledIndexes' array
						$.each( this.shuffledIndexes, function( index, element ) {
							var $thumbnail = $( thumbnails[ element ] );

							if ( $thumbnail.parent( 'a' ).length !== 0 ) {
								$thumbnail = $thumbnail.parent( 'a' );
							}

							shuffledThumbnails.push( $thumbnail );
						});
						
						// Append the sorted thumbnails to the thumbnail scroller
						this.$thumbnails.empty().append( shuffledThumbnails ) ;
					}
				} else {
					this.$thumbnails = $( '<div class="sp-thumbnails"></div>' ).appendTo( this.$thumbnailsContainer );
				}
			}

			// Check if there are thumbnails inside the slides and move them in the thumbnails container
			this.$slides.find( '.sp-thumbnail' ).each( function( index ) {
				var $thumbnail = $( this ),
					thumbnailIndex = $thumbnail.parents( '.sp-slide' ).index(),
					lastThumbnailIndex = that.$thumbnails.find( '.sp-thumbnail' ).length - 1;

				if ( $thumbnail.parent( 'a' ).length !== 0 ) {
					$thumbnail = $thumbnail.parent( 'a' );
				}

				// If the index of the slide that contains the thumbnail is greater than the total number
				// of thumbnails from the thumbnails container, position the thumbnail at the end.
				// Otherwise, add the thumbnails at the corresponding position.
				if ( thumbnailIndex > lastThumbnailIndex ) {
					$thumbnail.appendTo( that.$thumbnails );
				} else {
					$thumbnail.insertBefore( that.$thumbnails.find( '.sp-thumbnail' ).eq( thumbnailIndex ) );
				}
			});

			// Loop through the Thumbnail objects and if a corresponding element is not found in the DOM,
			// it means that the thumbnail might have been removed. In this case, destroy that Thumbnail instance.
			for ( var i = this.thumbnails.length - 1; i >= 0; i-- ) {
				if ( this.$thumbnails.find( '.sp-thumbnail[data-index="' + i + '"]' ).length === 0 ) {
					var thumbnail = this.thumbnails[ i ];

					thumbnail.destroy();
					this.thumbnails.splice( i, 1 );
				}
			}

			// Loop through the thumbnails and if there is any uninitialized thumbnail,
			// initialize it, else update the thumbnail's index.
			this.$thumbnails.find( '.sp-thumbnail' ).each(function( index ) {
				var $thumbnail = $( this );

				if ( typeof $thumbnail.attr( 'data-init' ) === 'undefined' ) {
					that._createThumbnail( $thumbnail, index );
				} else {
					that.thumbnails[ index ].setIndex( index );
				}
			});

			// Remove the previous class that corresponds to the position of the thumbnail scroller
			this.$thumbnailsContainer.removeClass( 'sp-top-thumbnails sp-bottom-thumbnails sp-left-thumbnails sp-right-thumbnails' );

			// Check the position of the thumbnail scroller and assign it the appropriate class and styling
			if ( this.settings.thumbnailsPosition === 'top' ) {
				this.$thumbnailsContainer.addClass( 'sp-top-thumbnails' );
				this.thumbnailsOrientation = 'horizontal';
			} else if ( this.settings.thumbnailsPosition === 'bottom' ) {
				this.$thumbnailsContainer.addClass( 'sp-bottom-thumbnails' );
				this.thumbnailsOrientation = 'horizontal';
			} else if ( this.settings.thumbnailsPosition === 'left' ) {
				this.$thumbnailsContainer.addClass( 'sp-left-thumbnails' );
				this.thumbnailsOrientation = 'vertical';
			} else if ( this.settings.thumbnailsPosition === 'right' ) {
				this.$thumbnailsContainer.addClass( 'sp-right-thumbnails' );
				this.thumbnailsOrientation = 'vertical';
			}

			// Check if the pointer needs to be created
			if ( this.settings.thumbnailPointer === true ) {
				this.$thumbnailsContainer.addClass( 'sp-has-pointer' );
			} else {
				this.$thumbnailsContainer.removeClass( 'sp-has-pointer' );
			}

			// Mark the thumbnail that corresponds to the selected slide
			this.selectedThumbnailIndex = this.selectedSlideIndex;
			this.$thumbnails.find( '.sp-thumbnail-container' ).eq( this.selectedThumbnailIndex ).addClass( 'sp-selected-thumbnail' );
			
			// Calculate the total size of the thumbnails
			this.thumbnailsSize = 0;

			$.each( this.thumbnails, function( index, thumbnail ) {
				thumbnail.setSize( that.settings.thumbnailWidth, that.settings.thumbnailHeight );
				that.thumbnailsSize += that.thumbnailsOrientation === 'horizontal' ? thumbnail.getSize().width : thumbnail.getSize().height;
			});

			// Set the size of the thumbnails
			if ( this.thumbnailsOrientation === 'horizontal' ) {
				this.$thumbnails.css({ 'width': this.thumbnailsSize, 'height': this.settings.thumbnailHeight });
				this.$thumbnailsContainer.css( 'height', '' );
				this.thumbnailsPositionProperty = 'left';
			} else {
				this.$thumbnails.css({ 'width': this.settings.thumbnailWidth, 'height': this.thumbnailsSize });
				this.$thumbnailsContainer.css( 'width', '' );
				this.thumbnailsPositionProperty = 'top';
			}

			// Fire the 'thumbnailsUpdate' event
			this.trigger({ type: 'thumbnailsUpdate' });
			if ( $.isFunction( this.settings.thumbnailsUpdate ) ) {
				this.settings.thumbnailsUpdate.call( this, { type: 'thumbnailsUpdate' } );
			}
		},

		// Create an individual thumbnail
		_createThumbnail: function( element, index ) {
			var that = this,
				thumbnail = new Thumbnail( element, this.$thumbnails, index );

			// When the thumbnail is clicked, navigate to the corresponding slide
			thumbnail.on( 'thumbnailClick.' + NS, function( event ) {
				that.gotoSlide( event.index );
			});

			// Add the thumbnail at the specified index
			this.thumbnails.splice( index, 0, thumbnail );
		},

		// Called when the slider is resized.
		// Resets the size and position of the thumbnail scroller container.
		_thumbnailsOnResize: function() {
			if ( this.isThumbnailScroller === false ) {
				return;
			}

			var that = this,
				newThumbnailsPosition;

			if ( this.thumbnailsOrientation === 'horizontal' ) {
				this.thumbnailsContainerSize = Math.min( this.$slidesMask.width(), this.thumbnailsSize );
				this.$thumbnailsContainer.css( 'width', this.thumbnailsContainerSize );

				// Reduce the slide mask's height, to make room for the thumbnails
				if ( this.settings.forceSize === 'fullWindow' ) {
					this.$slidesMask.css( 'height', this.$slidesMask.height() - this.$thumbnailsContainer.outerHeight( true ) );

					// Resize the slide
					this.slideHeight = this.$slidesMask.height();
						
					$.each( this.slides, function( index, element ) {
						element.setSize( that.slideWidth, that.slideHeight );
					});
				}
			} else if ( this.thumbnailsOrientation === 'vertical' ) {

				// Check if the width of the slide mask plus the width of the thumbnail scroller is greater than
				// the width of the slider's container and if that's the case, reduce the slides container width
				// in order to make the entire slider fit inside the slider's container.
				if ( this.$slidesMask.width() + this.$thumbnailsContainer.outerWidth( true ) > this.$slider.parent().width() ) {
					// Reduce the slider's width, to make room for the thumbnails
					if ( this.settings.forceSize === 'fullWidth' || this.settings.forceSize === 'fullWindow' ) {
						this.$slider.css( 'max-width', $( window ).width() - this.$thumbnailsContainer.outerWidth( true ) );
					} else {
						this.$slider.css( 'max-width', this.$slider.parent().width() - this.$thumbnailsContainer.outerWidth( true ) );
					}
					
					this.$slidesMask.css( 'width', this.$slider.width() );

					// If the slides are horizontally oriented, update the visible size and the offset
					// of the selected slide, since the slider's size was reduced to make room for the thumbnails.
					// 
					// If the slides are vertically oriented, update the width and height (to maintain the aspect ratio)
					// of the slides.
					if ( this.settings.orientation === 'horizontal' ) {
						this.visibleOffset = Math.round( ( this.$slider.width() - this.slideSize ) / 2 );
						this.visibleSlidesSize = this.$slidesMask.width();
					} else if ( this.settings.orientation === 'vertical' ) {
						this.slideWidth = this.$slider.width();

						$.each( this.slides, function( index, element ) {
							element.setSize( that.slideWidth, that.slideHeight );
						});
					}

					// Re-arrange the slides
					this._resetSlidesPosition();
				}

				this.thumbnailsContainerSize = Math.min( this.$slidesMask.height(), this.thumbnailsSize );
				this.$thumbnailsContainer.css( 'height', this.thumbnailsContainerSize );
			}

			// If the total size of the thumbnails is smaller than the thumbnail scroller' container (which has
			// the same size as the slides container), it means that all the thumbnails will be visible, so set
			// the position of the thumbnail scroller to 0.
			// 
			// If that's not the case, the thumbnail scroller will be positioned based on which thumbnail is selected.
			if ( this.thumbnailsSize <= this.thumbnailsContainerSize || this.$thumbnails.find( '.sp-selected-thumbnail' ).length === 0 ) {
				newThumbnailsPosition = 0;
			} else {
				newThumbnailsPosition = Math.max( - this.thumbnails[ this.selectedThumbnailIndex ].getPosition()[ this.thumbnailsPositionProperty ], this.thumbnailsContainerSize - this.thumbnailsSize );
			}

			// Add a padding to the slider, based on the thumbnail scroller's orientation, to make room
			// for the thumbnails.
			if ( this.settings.thumbnailsPosition === 'top' ) {
				this.$slider.css({ 'paddingTop': this.$thumbnailsContainer.outerHeight( true ), 'paddingLeft': '', 'paddingRight': '' });
			} else if ( this.settings.thumbnailsPosition === 'bottom' ) {
				this.$slider.css({ 'paddingTop': '', 'paddingLeft': '', 'paddingRight': '' });
			} else if ( this.settings.thumbnailsPosition === 'left' ) {
				this.$slider.css({ 'paddingTop': '', 'paddingLeft': this.$thumbnailsContainer.outerWidth( true ), 'paddingRight': '' });
			} else if ( this.settings.thumbnailsPosition === 'right' ) {
				this.$slider.css({ 'paddingTop': '', 'paddingLeft': '', 'paddingRight': this.$thumbnailsContainer.outerWidth( true ) });
			}

			this._moveThumbnailsTo( newThumbnailsPosition, true );
		},

		// Selects the thumbnail at the indicated index and moves the thumbnail scroller
		// accordingly.
		_gotoThumbnail: function( index ) {
			if ( this.isThumbnailScroller === false || typeof this.thumbnails[ index ] === 'undefined' ) {
				return;
			}

			var previousIndex = this.selectedThumbnailIndex,
				newThumbnailsPosition = this.thumbnailsPosition;

			this.selectedThumbnailIndex = index;

			// Set the 'selected' class to the appropriate thumbnail
			this.$thumbnails.find( '.sp-selected-thumbnail' ).removeClass( 'sp-selected-thumbnail' );
			this.$thumbnails.find( '.sp-thumbnail-container' ).eq( this.selectedThumbnailIndex ).addClass( 'sp-selected-thumbnail' );

			// Calculate the new position that the thumbnail scroller needs to go to.
			// 
			// If the selected thumbnail has a higher index than the previous one, make sure that the thumbnail
			// that comes after the selected thumbnail will be visible, if the selected thumbnail is not the
			// last thumbnail in the list.
			// 
			// If the selected thumbnail has a lower index than the previous one, make sure that the thumbnail
			// that's before the selected thumbnail will be visible, if the selected thumbnail is not the
			// first thumbnail in the list.
			if ( this.selectedThumbnailIndex >= previousIndex ) {
				var nextThumbnailIndex = this.selectedThumbnailIndex === this.thumbnails.length - 1 ? this.selectedThumbnailIndex : this.selectedThumbnailIndex + 1,
					nextThumbnail = this.thumbnails[ nextThumbnailIndex ],
					nextThumbnailPosition = this.thumbnailsOrientation === 'horizontal' ? nextThumbnail.getPosition().right : nextThumbnail.getPosition().bottom,
					thumbnailsRightPosition = - this.thumbnailsPosition + this.thumbnailsContainerSize;

				if ( nextThumbnailPosition > thumbnailsRightPosition ) {
					newThumbnailsPosition = this.thumbnailsPosition - ( nextThumbnailPosition - thumbnailsRightPosition );
				}
			} else if ( this.selectedThumbnailIndex < previousIndex ) {
				var previousThumbnailIndex = this.selectedThumbnailIndex === 0 ? this.selectedThumbnailIndex : this.selectedThumbnailIndex - 1,
					previousThumbnail = this.thumbnails[ previousThumbnailIndex ],
					previousThumbnailPosition = this.thumbnailsOrientation === 'horizontal' ? previousThumbnail.getPosition().left : previousThumbnail.getPosition().top;

				if ( previousThumbnailPosition < - this.thumbnailsPosition ) {
					newThumbnailsPosition = - previousThumbnailPosition;
				}
			}

			// Move the thumbnail scroller to the calculated position
			this._moveThumbnailsTo( newThumbnailsPosition );

			// Fire the 'gotoThumbnail' event
			this.trigger({ type: 'gotoThumbnail' });
			if ( $.isFunction( this.settings.gotoThumbnail ) ) {
				this.settings.gotoThumbnail.call( this, { type: 'gotoThumbnail' });
			}
		},

		// Move the thumbnail scroller to the indicated position
		_moveThumbnailsTo: function( position, instant, callback ) {
			var that = this,
				css = {};

			// Return if the position hasn't changed
			if ( position === this.thumbnailsPosition ) {
				return;
			}

			this.thumbnailsPosition = position;

			// Use CSS transitions if they are supported. If not, use JavaScript animation
			if ( this.supportedAnimation === 'css-3d' || this.supportedAnimation === 'css-2d' ) {
				var transition,
					left = this.thumbnailsOrientation === 'horizontal' ? position : 0,
					top = this.thumbnailsOrientation === 'horizontal' ? 0 : position;

				if ( this.supportedAnimation === 'css-3d' ) {
					css[ this.vendorPrefix + 'transform' ] = 'translate3d(' + left + 'px, ' + top + 'px, 0)';
				} else {
					css[ this.vendorPrefix + 'transform' ] = 'translate(' + left + 'px, ' + top + 'px)';
				}

				if ( typeof instant !== 'undefined' && instant === true ) {
					transition = '';
				} else {
					this.$thumbnails.addClass( 'sp-animated' );
					transition = this.vendorPrefix + 'transform ' + 700 / 1000 + 's';

					this.$thumbnails.on( this.transitionEvent, function( event ) {
						if ( event.target !== event.currentTarget ) {
							return;
						}

						that.$thumbnails.off( that.transitionEvent );
						that.$thumbnails.removeClass( 'sp-animated' );

						if ( typeof callback === 'function' ) {
							callback();
						}

						// Fire the 'thumbnailsMoveComplete' event
						that.trigger({ type: 'thumbnailsMoveComplete' });
						if ( $.isFunction( that.settings.thumbnailsMoveComplete ) ) {
							that.settings.thumbnailsMoveComplete.call( that, { type: 'thumbnailsMoveComplete' });
						}
					});
				}

				css[ this.vendorPrefix + 'transition' ] = transition;

				this.$thumbnails.css( css );
			} else {
				css[ 'margin-' + this.thumbnailsPositionProperty ] = position;

				if ( typeof instant !== 'undefined' && instant === true ) {
					this.$thumbnails.css( css );
				} else {
					this.$thumbnails
						.addClass( 'sp-animated' )
						.animate( css, 700, function() {
							that.$thumbnails.removeClass( 'sp-animated' );

							if ( typeof callback === 'function' ) {
								callback();
							}

							// Fire the 'thumbnailsMoveComplete' event
							that.trigger({ type: 'thumbnailsMoveComplete' });
							if ( $.isFunction( that.settings.thumbnailsMoveComplete ) ) {
								that.settings.thumbnailsMoveComplete.call( that, { type: 'thumbnailsMoveComplete' });
							}
						});
				}
			}
		},

		// Stop the movement of the thumbnail scroller
		_stopThumbnailsMovement: function() {
			var css = {};

			if ( this.supportedAnimation === 'css-3d' || this.supportedAnimation === 'css-2d' ) {
				var	matrixString = this.$thumbnails.css( this.vendorPrefix + 'transform' ),
					matrixType = matrixString.indexOf( 'matrix3d' ) !== -1 ? 'matrix3d' : 'matrix',
					matrixArray = matrixString.replace( matrixType, '' ).match( /-?[0-9\.]+/g ),
					left = matrixType === 'matrix3d' ? parseInt( matrixArray[ 12 ], 10 ) : parseInt( matrixArray[ 4 ], 10 ),
					top = matrixType === 'matrix3d' ? parseInt( matrixArray[ 13 ], 10 ) : parseInt( matrixArray[ 5 ], 10 );

				if ( this.supportedAnimation === 'css-3d' ) {
					css[ this.vendorPrefix + 'transform' ] = 'translate3d(' + left + 'px, ' + top + 'px, 0)';
				} else {
					css[ this.vendorPrefix + 'transform' ] = 'translate(' + left + 'px, ' + top + 'px)';
				}

				css[ this.vendorPrefix + 'transition' ] = '';

				this.$thumbnails.css( css );
				this.$thumbnails.off( this.transitionEvent );
				this.thumbnailsPosition = this.thumbnailsOrientation === 'horizontal' ? parseInt( matrixArray[ 4 ] , 10 ) : parseInt( matrixArray[ 5 ] , 10 );
			} else {
				this.$thumbnails.stop();
				this.thumbnailsPosition = parseInt( this.$thumbnails.css( 'margin-' + this.thumbnailsPositionProperty ), 10 );
			}

			this.$thumbnails.removeClass( 'sp-animated' );
		},

		// Destroy the module
		destroyThumbnails: function() {
			var that = this;

			// Remove event listeners
			this.off( 'update.' + NS );

			if ( this.isThumbnailScroller === false ) {
				return;
			}
			
			this.off( 'sliderResize.' + NS );
			this.off( 'gotoSlide.' + NS );
			$( window ).off( 'resize.' + this.uniqueId + '.' + NS );

			// Destroy the individual thumbnails
			this.$thumbnails.find( '.sp-thumbnail' ).each( function() {
				var $thumbnail = $( this ),
					index = parseInt( $thumbnail.attr( 'data-index' ), 10 ),
					thumbnail = that.thumbnails[ index ];

				thumbnail.off( 'thumbnailClick.' + NS );
				thumbnail.destroy();
			});

			this.thumbnails.length = 0;

			// Add the thumbnail scroller directly in the slider and
			// remove the thumbnail scroller container
			this.$thumbnails.appendTo( this.$slider );
			this.$thumbnailsContainer.remove();
			
			// Remove any created padding
			this.$slider.css({ 'paddingTop': '', 'paddingLeft': '', 'paddingRight': '' });
		},

		thumbnailsDefaults: {

			// Sets the width of the thumbnail
			thumbnailWidth: 100,

			// Sets the height of the thumbnail
			thumbnailHeight: 80,

			// Sets the position of the thumbnail scroller (top, bottom, right, left)
			thumbnailsPosition: 'bottom',

			// Indicates if a pointer will be displayed for the selected thumbnail
			thumbnailPointer: false,

			// Called when the thumbnails are updated
			thumbnailsUpdate: function() {},

			// Called when a new thumbnail is selected
			gotoThumbnail: function() {},

			// Called when the thumbnail scroller has moved
			thumbnailsMoveComplete: function() {}
		}
	};

	var Thumbnail = function( thumbnail, thumbnails, index ) {

		// Reference to the thumbnail jQuery element
		this.$thumbnail = thumbnail;

		// Reference to the thumbnail scroller
		this.$thumbnails = thumbnails;

		// Reference to the thumbnail's container, which will be 
		// created dynamically.
		this.$thumbnailContainer = null;

		// The width and height of the thumbnail
		this.width = 0;
		this.height = 0;

		// Indicates whether the thumbnail's image is loaded
		this.isImageLoaded = false;

		// Set the index of the slide
		this.setIndex( index );

		// Initialize the thumbnail
		this._init();
	};

	Thumbnail.prototype = {

		_init: function() {
			var that = this;

			// Mark the thumbnail as initialized
			this.$thumbnail.attr( 'data-init', true );

			// Create a container for the thumbnail and add the original thumbnail to this container.
			// Having a container will help crop the thumbnail image if it's too large.
			this.$thumbnailContainer = $( '<div class="sp-thumbnail-container"></div>' ).appendTo( this.$thumbnails );

			if ( this.$thumbnail.parent( 'a' ).length !== 0 ) {
				this.$thumbnail.parent( 'a' ).appendTo( this.$thumbnailContainer );
			} else {
				this.$thumbnail.appendTo( this.$thumbnailContainer );
			}

			// When the thumbnail container is clicked, fire an event
			this.$thumbnailContainer.on( 'click.' + NS, function() {
				that.trigger({ type: 'thumbnailClick.' + NS, index: that.index });
			});
		},

		// Set the width and height of the thumbnail
		setSize: function( width, height ) {
			this.width = width;
			this.height = height;

			// Apply the width and height to the thumbnail's container
			this.$thumbnailContainer.css({ 'width': this.width, 'height': this.height });

			// If there is an image, resize it to fit the thumbnail container
			if ( this.$thumbnail.is( 'img' ) && typeof this.$thumbnail.attr( 'data-src' ) === 'undefined' ) {
				this.resizeImage();
			}
		},

		// Return the width and height of the thumbnail
		getSize: function() {
			return {
				width: this.$thumbnailContainer.outerWidth( true ),
				height: this.$thumbnailContainer.outerHeight( true )
			};
		},

		// Return the top, bottom, left and right position of the thumbnail
		getPosition: function() {
			return {
				left: this.$thumbnailContainer.position().left + parseInt( this.$thumbnailContainer.css( 'marginLeft' ) , 10 ),
				right: this.$thumbnailContainer.position().left + parseInt( this.$thumbnailContainer.css( 'marginLeft' ) , 10 ) + this.$thumbnailContainer.outerWidth(),
				top: this.$thumbnailContainer.position().top + parseInt( this.$thumbnailContainer.css( 'marginTop' ) , 10 ),
				bottom: this.$thumbnailContainer.position().top + parseInt( this.$thumbnailContainer.css( 'marginTop' ) , 10 ) + this.$thumbnailContainer.outerHeight()
			};
		},

		// Set the index of the thumbnail
		setIndex: function( index ) {
			this.index = index;
			this.$thumbnail.attr( 'data-index', this.index );
		},

		// Resize the thumbnail's image
		resizeImage: function() {
			var that = this;

			// If the image is not loaded yet, load it
			if ( this.isImageLoaded === false ) {
				SliderProUtils.checkImagesComplete( this.$thumbnailContainer , function() {
					that.isImageLoaded = true;
					that.resizeImage();
				});

				return;
			}

			// Get the reference to the thumbnail image again because it was replaced by
			// another img element during the loading process
			this.$thumbnail = this.$thumbnailContainer.find( '.sp-thumbnail' );

			// Calculate whether the image should stretch horizontally or vertically
			var imageWidth = this.$thumbnail.width(),
				imageHeight = this.$thumbnail.height();

			if ( imageWidth / imageHeight <= this.width / this.height ) {
				this.$thumbnail.css({ width: '100%', height: 'auto' });
			} else {
				this.$thumbnail.css({ width: 'auto', height: '100%' });
			}

			this.$thumbnail.css({ 'marginLeft': ( this.$thumbnailContainer.width() - this.$thumbnail.width() ) * 0.5, 'marginTop': ( this.$thumbnailContainer.height() - this.$thumbnail.height() ) * 0.5 });
		},

		// Destroy the thumbnail
		destroy: function() {
			this.$thumbnailContainer.off( 'click.' + NS );

			// Remove added attributes
			this.$thumbnail.removeAttr( 'data-init' );
			this.$thumbnail.removeAttr( 'data-index' );

			// Remove the thumbnail's container and add the thumbnail
			// back to the thumbnail scroller container
			if ( this.$thumbnail.parent( 'a' ).length !== 0 ) {
				this.$thumbnail.parent( 'a' ).insertBefore( this.$thumbnailContainer );
			} else {
				this.$thumbnail.insertBefore( this.$thumbnailContainer );
			}
			
			this.$thumbnailContainer.remove();
		},

		// Attach an event handler to the slide
		on: function( type, callback ) {
			return this.$thumbnailContainer.on( type, callback );
		},

		// Detach an event handler to the slide
		off: function( type ) {
			return this.$thumbnailContainer.off( type );
		},

		// Trigger an event on the slide
		trigger: function( data ) {
			return this.$thumbnailContainer.triggerHandler( data );
		}
	};

	$.SliderPro.addModule( 'Thumbnails', Thumbnails );

})( window, jQuery );

// ConditionalImages module for Slider Pro.
// 
// Adds the possibility to specify multiple sources for each image and
// load the image that's the most appropriate for the size of the slider.
// For example, instead of loading a large image even if the slider will be small
// you can specify a smaller image that will be loaded instead.
;(function( window, $ ) {

	"use strict";

	var NS = 'ConditionalImages.' + $.SliderPro.namespace;

	var ConditionalImages = {

		// Reference to the previous size
		previousImageSize: null,

		// Reference to the current size
		currentImageSize: null,

		// Indicates if the current display supports high PPI
		isRetinaScreen: false,

		initConditionalImages: function() {
			this.currentImageSize = this.previousImageSize = 'default';
			this.isRetinaScreen = ( typeof this._isRetina !== 'undefined' ) && ( this._isRetina() === true );

			this.on( 'update.' + NS, $.proxy( this._conditionalImagesOnUpdate, this ) );
			this.on( 'sliderResize.' + NS, $.proxy( this._conditionalImagesOnResize, this ) );
		},

		// Loop through all the existing images and specify the original path of the image
		// inside the 'data-default' attribute.
		_conditionalImagesOnUpdate: function() {
			$.each( this.slides, function( index, element ) {
				var $slide = element.$slide;

				$slide.find( 'img:not([ data-default ])' ).each(function() {
					var $image = $( this );

					if ( typeof $image.attr( 'data-src' ) !== 'undefined' ) {
						$image.attr( 'data-default', $image.attr( 'data-src' ) );
					} else {
						$image.attr( 'data-default', $image.attr( 'src' ) );
					}
				});
			});
		},

		// When the window resizes, identify the applyable image size based on the current size of the slider
		// and apply it to all images that have a version of the image specified for this size.
		_conditionalImagesOnResize: function() {
			if ( this.slideWidth <= this.settings.smallSize ) {
				this.currentImageSize = 'small';
			} else if ( this.slideWidth <= this.settings.mediumSize ) {
				this.currentImageSize = 'medium';
			} else if ( this.slideWidth <= this.settings.largeSize ) {
				this.currentImageSize = 'large';
			} else {
				this.currentImageSize = 'default';
			}

			if ( this.previousImageSize !== this.currentImageSize ) {
				var that = this;

				$.each( this.slides, function( index, element ) {
					var $slide = element.$slide;

					$slide.find( 'img' ).each(function() {
						var $image = $( this ),
							imageSource = '';

						// Check if the current display supports high PPI and if a retina version of the current size was specified
						if ( that.isRetinaScreen === true && typeof $image.attr( 'data-retina' + that.currentImageSize ) !== 'undefined' ) {
							imageSource = $image.attr( 'data-retina' + that.currentImageSize );

							// If the retina image was not loaded yet, replace the default image source with the one
							// that corresponds to the current slider size
							if ( typeof $image.attr( 'data-retina' ) !== 'undefined' && $image.attr( 'data-retina' ) !== imageSource ) {
								$image.attr( 'data-retina', imageSource );
							}
						} else if ( ( that.isRetinaScreen === false || that.isRetinaScreen === true && typeof $image.attr( 'data-retina' ) === 'undefined' ) && typeof $image.attr( 'data-' + that.currentImageSize ) !== 'undefined' ) {
							imageSource = $image.attr( 'data-' + that.currentImageSize );

							// If the image is set to lazy load, replace the image source with the one
							// that corresponds to the current slider size
							if ( typeof $image.attr( 'data-src' ) !== 'undefined' && $image.attr( 'data-src' ) !== imageSource ) {
								$image.attr( 'data-src', imageSource );
							}
						}

						// If a new image was found
						if ( imageSource !== '' ) {

							// The existence of the 'data-src' attribute indicates that the image
							// will be lazy loaded, so don't load the new image yet
							if ( typeof $image.attr( 'data-src' ) === 'undefined' && $image.attr( 'src' ) !== imageSource  ) {
								that._loadConditionalImage( $image, imageSource, function( newImage ) {
									if ( newImage.hasClass( 'sp-image' ) ) {
										element.$mainImage = newImage;
										element.resizeMainImage( true );
									}
								});
							}
						}
					});
				});

				this.previousImageSize = this.currentImageSize;
			}
		},

		// Replace the target image with a new image
		_loadConditionalImage: function( image, source, callback ) {

			// Create a new image element
			var newImage = $( new Image() );

			// Copy the class(es) and inline style
			newImage.attr( 'class', image.attr( 'class' ) );
			newImage.attr( 'style', image.attr( 'style' ) );

			// Copy the data attributes
			$.each( image.data(), function( name, value ) {
				newImage.attr( 'data-' + name, value );
			});

			// Copy the width and height attributes if they exist
			if ( typeof image.attr( 'width' ) !== 'undefined') {
				newImage.attr( 'width', image.attr( 'width' ) );
			}

			if ( typeof image.attr( 'height' ) !== 'undefined') {
				newImage.attr( 'height', image.attr( 'height' ) );
			}

			if ( typeof image.attr( 'alt' ) !== 'undefined' ) {
				newImage.attr( 'alt', image.attr( 'alt' ) );
			}

			if ( typeof image.attr( 'title' ) !== 'undefined' ) {
				newImage.attr( 'title', image.attr( 'title' ) );
			}

			newImage.attr( 'src', source );

			// Add the new image in the same container and remove the older image
			newImage.insertAfter( image );
			image.remove();
			image = null;
				
			if ( typeof callback === 'function' ) {
				callback( newImage );
			}
		},

		// Destroy the module
		destroyConditionalImages: function() {
			this.off( 'update.' + NS );
			this.off( 'sliderResize.' + NS );
		},

		conditionalImagesDefaults: {

			// If the slider size is below this size, the small version of the images will be used
			smallSize: 480,

			// If the slider size is below this size, the small version of the images will be used
			mediumSize: 768,

			// If the slider size is below this size, the small version of the images will be used
			largeSize: 1024
		}
	};

	$.SliderPro.addModule( 'ConditionalImages', ConditionalImages );

})( window, jQuery );

// Retina module for Slider Pro.
// 
// Adds the possibility to load a different image when the slider is
// viewed on a retina screen.
;(function( window, $ ) {

	"use strict";
	
	var NS = 'Retina.' + $.SliderPro.namespace;

	var Retina = {

		initRetina: function() {
			var that = this;

			// Return if it's not a retina screen
			if ( this._isRetina() === false ) {
				return;
			}
			
			this.on( 'update.' + NS, $.proxy( this._checkRetinaImages, this ) );

			if ( this.$slider.find( '.sp-thumbnail' ).length !== 0 ) {
				this.on( 'update.Thumbnails.' + NS, $.proxy( this._checkRetinaThumbnailImages, this ) );
			}
		},

		// Checks if the current display supports high PPI
		_isRetina: function() {
			if ( window.devicePixelRatio >= 2 ) {
				return true;
			}

			if ( window.matchMedia && ( window.matchMedia( "(-webkit-min-device-pixel-ratio: 2),(min-resolution: 2dppx)" ).matches ) ) {
				return true;
			}

			return false;
		},

		// Loop through the slides and replace the images with their retina version
		_checkRetinaImages: function() {
			var that = this;

			$.each( this.slides, function( index, element ) {
				var $slide = element.$slide;

				if ( typeof $slide.attr( 'data-retina-loaded' ) === 'undefined' ) {
					$slide.attr( 'data-retina-loaded', true );

					$slide.find( 'img[data-retina]' ).each(function() {
						var $image = $( this );

						if ( typeof $image.attr( 'data-src' ) !== 'undefined' ) {
							$image.attr( 'data-src', $image.attr( 'data-retina' ) );
						} else {
							that._loadRetinaImage( $image, function( newImage ) {
								if ( newImage.hasClass( 'sp-image' ) ) {
									element.$mainImage = newImage;
									element.resizeMainImage( true );
								}
							});
						}
					});
				}
			});
		},

		// Loop through the thumbnails and replace the images with their retina version
		_checkRetinaThumbnailImages: function() {
			var that = this;

			$.each( this.thumbnails, function( index, element ) {
				var $thumbnail = element.$thumbnailContainer;

				if ( typeof $thumbnail.attr( 'data-retina-loaded' ) === 'undefined' ) {
					$thumbnail.attr( 'data-retina-loaded', true );

					$thumbnail.find( 'img[data-retina]' ).each(function() {
						var $image = $( this );

						if ( typeof $image.attr( 'data-src' ) !== 'undefined' ) {
							$image.attr( 'data-src', $image.attr( 'data-retina' ) );
						} else {
							that._loadRetinaImage( $image, function( newImage ) {
								if ( newImage.hasClass( 'sp-thumbnail' ) ) {
									element.resizeImage();
								}
							});
						}
					});
				}
			});
		},

		// Load the retina image
		_loadRetinaImage: function( image, callback ) {
			var retinaFound = false,
				newImagePath = '';

			// Check if there is a retina image specified
			if ( typeof image.attr( 'data-retina' ) !== 'undefined' ) {
				retinaFound = true;

				newImagePath = image.attr( 'data-retina' );
			}

			// Check if there is a lazy loaded, non-retina, image specified
			if ( typeof image.attr( 'data-src' ) !== 'undefined' ) {
				if ( retinaFound === false ) {
					newImagePath = image.attr( 'data-src') ;
				}

				image.removeAttr('data-src');
			}

			// Return if there isn't a retina or lazy loaded image
			if ( newImagePath === '' ) {
				return;
			}

			// Create a new image element
			var newImage = $( new Image() );

			// Copy the class(es) and inline style
			newImage.attr( 'class', image.attr('class') );
			newImage.attr( 'style', image.attr('style') );

			// Copy the data attributes
			$.each( image.data(), function( name, value ) {
				newImage.attr( 'data-' + name, value );
			});

			// Copy the width and height attributes if they exist
			if ( typeof image.attr( 'width' ) !== 'undefined' ) {
				newImage.attr( 'width', image.attr( 'width' ) );
			}

			if ( typeof image.attr( 'height' ) !== 'undefined' ) {
				newImage.attr( 'height', image.attr( 'height' ) );
			}

			if ( typeof image.attr( 'alt' ) !== 'undefined' ) {
				newImage.attr( 'alt', image.attr( 'alt' ) );
			}

			if ( typeof image.attr( 'title' ) !== 'undefined' ) {
				newImage.attr( 'title', image.attr( 'title' ) );
			}

			// Add the new image in the same container and remove the older image
			newImage.insertAfter( image );
			image.remove();
			image = null;

			// Assign the source of the image
			newImage.attr( 'src', newImagePath );

			if ( typeof callback === 'function' ) {
				callback( newImage );
			}
		},

		// Destroy the module
		destroyRetina: function() {
			this.off( 'update.' + NS );
			this.off( 'update.Thumbnails.' + NS );
		}
	};

	$.SliderPro.addModule( 'Retina', Retina );
	
})( window, jQuery );

// Lazy Loading module for Slider Pro.
// 
// Adds the possibility to delay the loading of the images until the slides/thumbnails
// that contain them become visible. This technique improves the initial loading
// performance.
;(function( window, $ ) {

	"use strict";

	var NS = 'LazyLoading.' + $.SliderPro.namespace;

	var LazyLoading = {

		allowLazyLoadingCheck: true,

		initLazyLoading: function() {
			var that = this;

			// The 'resize' event is fired after every update, so it's possible to use it for checking
			// if the update made new slides become visible
			// 
			// Also, resizing the slider might make new slides or thumbnails visible
			this.on( 'sliderResize.' + NS, $.proxy( this._lazyLoadingOnResize, this ) );

			// Check visible images when a new slide is selected
			this.on( 'gotoSlide.' + NS, $.proxy( this._checkAndLoadVisibleImages, this ) );

			// Check visible thumbnail images when the thumbnails are updated because new thumbnail
			// might have been added or the settings might have been changed so that more thumbnail
			// images become visible
			// 
			// Also, check visible thumbnail images after the thumbnails have moved because new thumbnails might
			// have become visible
			this.on( 'thumbnailsUpdate.' + NS + ' ' + 'thumbnailsMoveComplete.' + NS, $.proxy( this._checkAndLoadVisibleThumbnailImages, this ) );
		},

		_lazyLoadingOnResize: function() {
			var that = this;

			if ( this.allowLazyLoadingCheck === false ) {
				return;
			}

			this.allowLazyLoadingCheck = false;
			
			this._checkAndLoadVisibleImages();

			if ( this.$slider.find( '.sp-thumbnail' ).length !== 0 ) {
				this._checkAndLoadVisibleThumbnailImages();
			}

			// Use a timer to deffer the loading of images in order to prevent too many
			// checking attempts
			setTimeout(function() {
				that.allowLazyLoadingCheck = true;
			}, 500 );
		},

		// Check visible slides and load their images
		_checkAndLoadVisibleImages: function() {
			if ( this.$slider.find( '.sp-slide:not([ data-loaded ])' ).length === 0 ) {
				return;
			}

			var that = this,

				// Use either the middle position or the index of the selected slide as a reference, depending on
				// whether the slider is loopable
				referencePosition = this.settings.loop === true ? this.middleSlidePosition : this.selectedSlideIndex,

				// Calculate how many slides are visible at the sides of the selected slide
				visibleOnSides = Math.ceil( ( this.visibleSlidesSize - this.slideSize ) / 2 / this.slideSize ),

				// Calculate the indexes of the first and last slide that will be checked
				from = referencePosition - visibleOnSides - 1 > 0 ? referencePosition - visibleOnSides - 1 : 0,
				to = referencePosition + visibleOnSides + 1 < this.getTotalSlides() - 1 ? referencePosition + visibleOnSides + 1 : this.getTotalSlides() - 1,
				
				// Get all the slides that need to be checked
				slidesToCheck = this.slidesOrder.slice( from, to + 1 );

			// Loop through the selected slides and if the slide is not marked as having
			// been loaded yet, loop through its images and load them.
			$.each( slidesToCheck, function( index, element ) {
				var slide = that.slides[ element ],
					$slide = slide.$slide;

				if ( typeof $slide.attr( 'data-loaded' ) === 'undefined' ) {
					$slide.attr( 'data-loaded', true );

					$slide.find( 'img[ data-src ]' ).each(function() {
						var image = $( this );
						that._loadImage( image, function( newImage ) {
							if ( newImage.hasClass( 'sp-image' ) ) {
								slide.$mainImage = newImage;
								slide.resizeMainImage( true );
							}
						});
					});
				}
			});
		},

		// Check visible thumbnails and load their images
		_checkAndLoadVisibleThumbnailImages: function() {
			if ( this.$slider.find( '.sp-thumbnail-container:not([ data-loaded ])' ).length === 0 ) {
				return;
			}

			var that = this,
				thumbnailSize = this.thumbnailsSize / this.thumbnails.length,

				// Calculate the indexes of the first and last thumbnail that will be checked
				from = Math.floor( Math.abs( this.thumbnailsPosition / thumbnailSize ) ),
				to = Math.floor( ( - this.thumbnailsPosition + this.thumbnailsContainerSize ) / thumbnailSize ),

				// Get all the thumbnails that need to be checked
				thumbnailsToCheck = this.thumbnails.slice( from, to + 1 );

			// Loop through the selected thumbnails and if the thumbnail is not marked as having
			// been loaded yet, load its image.
			$.each( thumbnailsToCheck, function( index, element ) {
				var $thumbnailContainer = element.$thumbnailContainer;

				if ( typeof $thumbnailContainer.attr( 'data-loaded' ) === 'undefined' ) {
					$thumbnailContainer.attr( 'data-loaded', true );

					$thumbnailContainer.find( 'img[ data-src ]' ).each(function() {
						var image = $( this );

						that._loadImage( image, function() {
							element.resizeImage();
						});
					});
				}
			});
		},

		// Load an image
		_loadImage: function( image, callback ) {
			// Create a new image element
			var newImage = $( new Image() );

			// Copy the class(es) and inline style
			newImage.attr( 'class', image.attr( 'class' ) );
			newImage.attr( 'style', image.attr( 'style' ) );

			// Copy the data attributes
			$.each( image.data(), function( name, value ) {
				newImage.attr( 'data-' + name, value );
			});

			// Copy the width and height attributes if they exist
			if ( typeof image.attr( 'width' ) !== 'undefined') {
				newImage.attr( 'width', image.attr( 'width' ) );
			}

			if ( typeof image.attr( 'height' ) !== 'undefined') {
				newImage.attr( 'height', image.attr( 'height' ) );
			}

			if ( typeof image.attr( 'alt' ) !== 'undefined' ) {
				newImage.attr( 'alt', image.attr( 'alt' ) );
			}

			if ( typeof image.attr( 'title' ) !== 'undefined' ) {
				newImage.attr( 'title', image.attr( 'title' ) );
			}

			// Assign the source of the image
			newImage.attr( 'src', image.attr( 'data-src' ) );
			newImage.removeAttr( 'data-src' );

			// Add the new image in the same container and remove the older image
			newImage.insertAfter( image );
			image.remove();
			image = null;
			
			if ( typeof callback === 'function' ) {
				callback( newImage );
			}
		},

		// Destroy the module
		destroyLazyLoading: function() {
			this.off( 'update.' + NS );
			this.off( 'gotoSlide.' + NS );
			this.off( 'sliderResize.' + NS );
			this.off( 'thumbnailsUpdate.' + NS );
			this.off( 'thumbnailsMoveComplete.' + NS );
		}
	};

	$.SliderPro.addModule( 'LazyLoading', LazyLoading );

})( window, jQuery );

// Layers module for Slider Pro.
// 
// Adds support for animated and static layers. The layers can contain any content,
// from simple text for video elements.
;(function( window, $ ) {

	"use strict";

	var NS = 'Layers.' +  $.SliderPro.namespace;

	var Layers = {

		// Reference to the original 'gotoSlide' method
		layersGotoSlideReference: null,

		// Reference to the timer that will delay the overriding
		// of the 'gotoSlide' method
		waitForLayersTimer: null,

		initLayers: function() {
			this.on( 'update.' + NS, $.proxy( this._layersOnUpdate, this ) );
			this.on( 'sliderResize.' + NS, $.proxy( this._layersOnResize, this ) );
			this.on( 'gotoSlide.' + NS, $.proxy( this._layersOnGotoSlide, this ) );
		},

		// Loop through the slides and initialize all layers
		_layersOnUpdate: function( event ) {
			var that = this;

			$.each( this.slides, function( index, element ) {
				var $slide = element.$slide;

				// Initialize the layers
				this.$slide.find( '.sp-layer:not([ data-layer-init ])' ).each(function() {
					var layer = new Layer( $( this ) );

					// Add the 'layers' array to the slide objects (instance of SliderProSlide)
					if ( typeof element.layers === 'undefined' ) {
						element.layers = [];
					}

					element.layers.push( layer );

					if ( $( this ).hasClass( 'sp-static' ) === false ) {

						// Add the 'animatedLayers' array to the slide objects (instance of SliderProSlide)
						if ( typeof element.animatedLayers === 'undefined' ) {
							element.animatedLayers = [];
						}

						element.animatedLayers.push( layer );
					}
				});
			});

			// If the 'waitForLayers' option is enabled, the slider will not move to another slide
			// until all the layers from the previous slide will be hidden. To achieve this,
			// replace the current 'gotoSlide' function with another function that will include the 
			// required functionality.
			// 
			// Since the 'gotoSlide' method might be overridden by other modules as well, delay this
			// override to make sure it's the last override.
			if ( this.settings.waitForLayers === true ) {
				clearTimeout( this.waitForLayersTimer );

				this.waitForLayersTimer = setTimeout(function() {
					that.layersGotoSlideReference = that.gotoSlide;
					that.gotoSlide = that._layersGotoSlide;
				}, 1 );
			}

			// Show the layers for the initial slide
			// Delay the call in order to make sure the layers
			// are scaled properly before displaying them
			setTimeout(function() {
				that.showLayers( that.selectedSlideIndex );
			}, 1);
		},

		// When the slider resizes, try to scale down the layers proportionally. The automatic scaling
		// will make use of an option, 'autoScaleReference', by comparing the current width of the slider
		// with the reference width. So, if the reference width is 1000 pixels and the current width is
		// 500 pixels, it means that the layers will be scaled down to 50% of their size.
		_layersOnResize: function() {
			var that = this,
				autoScaleReference,
				useAutoScale = this.settings.autoScaleLayers,
				scaleRatio;

			if ( this.settings.autoScaleLayers === false ) {
				return;
			}

			// If there isn't a reference for how the layers should scale down automatically, use the 'width'
			// option as a reference, unless the width was set to a percentage. If there isn't a set reference and
			// the width was set to a percentage, auto scaling will not be used because it's not possible to
			// calculate how much should the layers scale.
			if ( this.settings.autoScaleReference === -1 ) {
				if ( typeof this.settings.width === 'string' && this.settings.width.indexOf( '%' ) !== -1 ) {
					useAutoScale = false;
				} else {
					autoScaleReference = parseInt( this.settings.width, 10 );
				}
			} else {
				autoScaleReference = this.settings.autoScaleReference;
			}

			if ( useAutoScale === true && this.slideWidth < autoScaleReference ) {
				scaleRatio = that.slideWidth / autoScaleReference;
			} else {
				scaleRatio = 1;
			}

			$.each( this.slides, function( index, slide ) {
				if ( typeof slide.layers !== 'undefined' ) {
					$.each( slide.layers, function( index, layer ) {
						layer.scale( scaleRatio );
					});
				}
			});
		},

		// Replace the 'gotoSlide' method with this one, which makes it possible to 
		// change the slide only after the layers from the previous slide are hidden.
		_layersGotoSlide: function( index ) {
			var that = this,
				animatedLayers = this.slides[ this.selectedSlideIndex ].animatedLayers;

			// If the slider is dragged, don't wait for the layer to hide
			if ( this.$slider.hasClass( 'sp-swiping' ) || typeof animatedLayers === 'undefined' || animatedLayers.length === 0  ) {
				this.layersGotoSlideReference( index );
			} else {
				this.on( 'hideLayersComplete.' + NS, function() {
					that.off( 'hideLayersComplete.' + NS );
					that.layersGotoSlideReference( index );
				});

				this.hideLayers( this.selectedSlideIndex );
			}
		},

		// When a new slide is selected, hide the layers from the previous slide
		// and show the layers from the current slide.
		_layersOnGotoSlide: function( event ) {
			if ( this.previousSlideIndex !== this.selectedSlideIndex &&  this.settings.waitForLayers === false ) {
				this.hideLayers( this.previousSlideIndex );
			}

			this.showLayers( this.selectedSlideIndex );
		},

		// Show the animated layers from the slide at the specified index,
		// and fire an event when all the layers from the slide become visible.
		showLayers: function( index ) {
			var that = this,
				animatedLayers = this.slides[ index ].animatedLayers,
				layerCounter = 0;

			if ( typeof animatedLayers === 'undefined' ) {
				return;
			}

			$.each( animatedLayers, function( index, element ) {

				// If the layer is already visible, increment the counter directly, else wait 
				// for the layer's showing animation to complete.
				if ( element.isVisible() === true ) {
					layerCounter++;

					if ( layerCounter === animatedLayers.length ) {
						that.trigger({ type: 'showLayersComplete', index: index });
						if ( $.isFunction( that.settings.showLayersComplete ) ) {
							that.settings.showLayersComplete.call( that, { type: 'showLayersComplete', index: index });
						}
					}
				} else {
					element.show(function() {
						layerCounter++;

						if ( layerCounter === animatedLayers.length ) {
							that.trigger({ type: 'showLayersComplete', index: index });
							if ( $.isFunction( that.settings.showLayersComplete ) ) {
								that.settings.showLayersComplete.call( that, { type: 'showLayersComplete', index: index });
							}
						}
					});
				}
			});
		},

		// Hide the animated layers from the slide at the specified index,
		// and fire an event when all the layers from the slide become invisible.
		hideLayers: function( index ) {
			var that = this,
				animatedLayers = this.slides[ index ].animatedLayers,
				layerCounter = 0;

			if ( typeof animatedLayers === 'undefined' ) {
				return;
			}

			$.each( animatedLayers, function( index, element ) {

				// If the layer is already invisible, increment the counter directly, else wait 
				// for the layer's hiding animation to complete.
				if ( element.isVisible() === false ) {
					layerCounter++;

					if ( layerCounter === animatedLayers.length ) {
						that.trigger({ type: 'hideLayersComplete', index: index });
						if ( $.isFunction( that.settings.hideLayersComplete ) ) {
							that.settings.hideLayersComplete.call( that, { type: 'hideLayersComplete', index: index });
						}
					}
				} else {
					element.hide(function() {
						layerCounter++;

						if ( layerCounter === animatedLayers.length ) {
							that.trigger({ type: 'hideLayersComplete', index: index });
							if ( $.isFunction( that.settings.hideLayersComplete ) ) {
								that.settings.hideLayersComplete.call( that, { type: 'hideLayersComplete', index: index });
							}
						}
					});
				}
			});
		},

		// Destroy the module
		destroyLayers: function() {
			this.off( 'update.' + NS );
			this.off( 'resize.' + NS );
			this.off( 'gotoSlide.' + NS );
			this.off( 'hideLayersComplete.' + NS );
		},

		layersDefaults: {

			// Indicates whether the slider will wait for the layers to disappear before
			// going to a new slide
			waitForLayers: false,

			// Indicates whether the layers will be scaled automatically
			autoScaleLayers: true,

			// Sets a reference width which will be compared to the current slider width
			// in order to determine how much the layers need to scale down. By default,
			// the reference width will be equal to the slide width. However, if the slide width
			// is set to a percentage value, then it's necessary to set a specific value for 'autoScaleReference'.
			autoScaleReference: -1,

			// Called when all animated layers become visible
			showLayersComplete: function() {},

			// Called when all animated layers become invisible
			hideLayersComplete: function() {}
		}
	};

	// Override the slide's 'destroy' method in order to destroy the 
	// layers that where added to the slide as well.
	var slideDestroy = window.SliderProSlide.prototype.destroy;

	window.SliderProSlide.prototype.destroy = function() {
		if ( typeof this.layers !== 'undefined' ) {
			$.each( this.layers, function( index, element ) {
				element.destroy();
			});

			this.layers.length = 0;
		}

		if ( typeof this.animatedLayers !== 'undefined' ) {
			this.animatedLayers.length = 0;
		}

		slideDestroy.apply( this );
	};

	var Layer = function( layer ) {

		// Reference to the layer jQuery element
		this.$layer = layer;

		// Indicates whether a layer is currently visible or hidden
		this.visible = false;

		// Indicates whether the layer was styled
		this.styled = false;

		// Holds the data attributes added to the layer
		this.data = null;

		// Indicates the layer's reference point (topLeft, bottomLeft, topRight or bottomRight)
		this.position = null;
		
		// Indicates which CSS property (left or right) will be used for positioning the layer 
		this.horizontalProperty = null;
		
		// Indicates which CSS property (top or bottom) will be used for positioning the layer 
		this.verticalProperty = null;

		// Indicates the value of the horizontal position
		this.horizontalPosition = null;
		
		// Indicates the value of the vertical position
		this.verticalPosition = null;

		// Indicates how much the layers needs to be scaled
		this.scaleRatio = 1;

		// Indicates the type of supported transition (CSS3 2D, CSS3 3D or JavaScript)
		this.supportedAnimation = SliderProUtils.getSupportedAnimation();

		// Indicates the required vendor prefix for CSS (i.e., -webkit, -moz, etc.)
		this.vendorPrefix = SliderProUtils.getVendorPrefix();

		// Indicates the name of the CSS transition's complete event (i.e., transitionend, webkitTransitionEnd, etc.)
		this.transitionEvent = SliderProUtils.getTransitionEvent();

		// Reference to the timer that will be used to hide the layers automatically after a given time interval
		this.stayTimer = null;

		this._init();
	};

	Layer.prototype = {

		// Initialize the layers
		_init: function() {
			this.$layer.attr( 'data-layer-init', true );

			if ( this.$layer.hasClass( 'sp-static' ) ) {
				this._setStyle();
			} else {
				this.$layer.css({ 'visibility': 'hidden' });
			}
		},

		// Set the size and position of the layer
		_setStyle: function() {
			this.styled = true;

			// Get the data attributes specified in HTML
			this.data = this.$layer.data();
			
			if ( typeof this.data.width !== 'undefined' ) {
				this.$layer.css( 'width', this.data.width );
			}

			if ( typeof this.data.height !== 'undefined' ) {
				this.$layer.css( 'height', this.data.height );
			}

			if ( typeof this.data.depth !== 'undefined' ) {
				this.$layer.css( 'z-index', this.data.depth );
			}

			this.position = this.data.position ? ( this.data.position ).toLowerCase() : 'topleft';

			if ( this.position.indexOf( 'right' ) !== -1 ) {
				this.horizontalProperty = 'right';
			} else if ( this.position.indexOf( 'left' ) !== -1 ) {
				this.horizontalProperty = 'left';
			} else {
				this.horizontalProperty = 'center';
			}

			if ( this.position.indexOf( 'bottom' ) !== -1 ) {
				this.verticalProperty = 'bottom';
			} else if ( this.position.indexOf( 'top' ) !== -1 ) {
				this.verticalProperty = 'top';
			} else {
				this.verticalProperty = 'center';
			}

			this._setPosition();

			this.scale( this.scaleRatio );
		},

		// Set the position of the layer
		_setPosition: function() {
			var inlineStyle = this.$layer.attr( 'style' );

			this.horizontalPosition = typeof this.data.horizontal !== 'undefined' ? this.data.horizontal : 0;
			this.verticalPosition = typeof this.data.vertical !== 'undefined' ? this.data.vertical : 0;

			// Set the horizontal position of the layer based on the data set
			if ( this.horizontalProperty === 'center' ) {
				
				// prevent content wrapping while setting the width
				if ( this.$layer.is( 'img' ) === false && ( typeof inlineStyle === 'undefined' || ( typeof inlineStyle !== 'undefined' && inlineStyle.indexOf( 'width' ) === -1 ) ) ) {
					this.$layer.css( 'white-space', 'nowrap' );
					this.$layer.css( 'width', this.$layer.outerWidth( true ) );
				}

				this.$layer.css({ 'marginLeft': 'auto', 'marginRight': 'auto', 'left': this.horizontalPosition, 'right': 0 });
			} else {
				this.$layer.css( this.horizontalProperty, this.horizontalPosition );
			}

			// Set the vertical position of the layer based on the data set
			if ( this.verticalProperty === 'center' ) {

				// prevent content wrapping while setting the height
				if ( this.$layer.is( 'img' ) === false && ( typeof inlineStyle === 'undefined' || ( typeof inlineStyle !== 'undefined' && inlineStyle.indexOf( 'height' ) === -1 ) ) ) {
					this.$layer.css( 'white-space', 'nowrap' );
					this.$layer.css( 'height', this.$layer.outerHeight( true ) );
				}

				this.$layer.css({ 'marginTop': 'auto', 'marginBottom': 'auto', 'top': this.verticalPosition, 'bottom': 0 });
			} else {
				this.$layer.css( this.verticalProperty, this.verticalPosition );
			}
		},

		// Scale the layer
		scale: function( ratio ) {

			// Return if the layer is set to be unscalable
			if ( this.$layer.hasClass( 'sp-no-scale' ) ) {
				return;
			}

			// Store the ratio (even if the layer is not ready to be scaled yet)
			this.scaleRatio = ratio;

			// Return if the layer is not styled yet
			if ( this.styled === false ) {
				return;
			}

			var horizontalProperty = this.horizontalProperty === 'center' ? 'left' : this.horizontalProperty,
				verticalProperty = this.verticalProperty === 'center' ? 'top' : this.verticalProperty,
				css = {};

			// Apply the scaling
			css[ this.vendorPrefix + 'transform-origin' ] = this.horizontalProperty + ' ' + this.verticalProperty;
			css[ this.vendorPrefix + 'transform' ] = 'scale(' + this.scaleRatio + ')';

			// If the position is not set to a percentage value, apply the scaling to the position
			if ( typeof this.horizontalPosition !== 'string' ) {
				css[ horizontalProperty ] = this.horizontalPosition * this.scaleRatio;
			}

			// If the position is not set to a percentage value, apply the scaling to the position
			if ( typeof this.verticalPosition !== 'string' ) {
				css[ verticalProperty ] = this.verticalPosition * this.scaleRatio;
			}

			// If the width or height is set to a percentage value, increase the percentage in order to
			// maintain the same layer to slide proportions. This is necessary because otherwise the scaling
			// transform would minimize the layers more than intended.
			if ( typeof this.data.width === 'string' && this.data.width.indexOf( '%' ) !== -1 ) {
				css.width = ( parseInt( this.data.width, 10 ) / this.scaleRatio ).toString() + '%';
			}

			if ( typeof this.data.height === 'string' && this.data.height.indexOf( '%' ) !== -1 ) {
				css.height = ( parseInt( this.data.height, 10 ) / this.scaleRatio ).toString() + '%';
			}

			this.$layer.css( css );
		},

		// Show the layer
		show: function( callback ) {
			if ( this.visible === true ) {
				return;
			}

			this.visible = true;

			// First, style the layer if it's not already styled
			if ( this.styled === false ) {
				this._setStyle();
			}

			var that = this,
				offset = typeof this.data.showOffset !== 'undefined' ? this.data.showOffset : 50,
				duration = typeof this.data.showDuration !== 'undefined' ? this.data.showDuration / 1000 : 0.4,
				delay = typeof this.data.showDelay !== 'undefined' ? this.data.showDelay : 10,
				stayDuration = typeof that.data.stayDuration !== 'undefined' ? parseInt( that.data.stayDuration, 10 ) : -1;

			// Animate the layers with CSS3 or with JavaScript
			if ( this.supportedAnimation === 'javascript' ) {
				this.$layer
					.stop()
					.delay( delay )
					.css({ 'opacity': 0, 'visibility': 'visible' })
					.animate( { 'opacity': 1 }, duration * 1000, function() {

						// Hide the layer after a given time interval
						if ( stayDuration !== -1 ) {
							that.stayTimer = setTimeout(function() {
								that.hide();
								that.stayTimer = null;
							}, stayDuration );
						}

						if ( typeof callback !== 'undefined' ) {
							callback();
						}
					});
			} else {
				var start = { 'opacity': 0, 'visibility': 'visible' },
					target = { 'opacity': 1 },
					transformValues = '';

				start[ this.vendorPrefix + 'transform' ] = 'scale(' + this.scaleRatio + ')';
				target[ this.vendorPrefix + 'transform' ] = 'scale(' + this.scaleRatio + ')';
				target[ this.vendorPrefix + 'transition' ] = 'opacity ' + duration + 's';

				if ( typeof this.data.showTransition !== 'undefined' ) {
					if ( this.data.showTransition === 'left' ) {
						transformValues = offset + 'px, 0';
					} else if ( this.data.showTransition === 'right' ) {
						transformValues = '-' + offset + 'px, 0';
					} else if ( this.data.showTransition === 'up' ) {
						transformValues = '0, ' + offset + 'px';
					} else if ( this.data.showTransition === 'down') {
						transformValues = '0, -' + offset + 'px';
					}

					start[ this.vendorPrefix + 'transform' ] += this.supportedAnimation === 'css-3d' ? ' translate3d(' + transformValues + ', 0)' : ' translate(' + transformValues + ')';
					target[ this.vendorPrefix + 'transform' ] += this.supportedAnimation === 'css-3d' ? ' translate3d(0, 0, 0)' : ' translate(0, 0)';
					target[ this.vendorPrefix + 'transition' ] += ', ' + this.vendorPrefix + 'transform ' + duration + 's';
				}

				// Listen when the layer animation is complete
				this.$layer.on( this.transitionEvent, function( event ) {
					if ( event.target !== event.currentTarget ) {
						return;
					}

					that.$layer
						.off( that.transitionEvent )
						.css( that.vendorPrefix + 'transition', '' );

					// Hide the layer after a given time interval
					if ( stayDuration !== -1 ) {
						that.stayTimer = setTimeout(function() {
							that.hide();
							that.stayTimer = null;
						}, stayDuration );
					}

					if ( typeof callback !== 'undefined' ) {
						callback();
					}
				});

				this.$layer.css( start );

				setTimeout( function() {
					that.$layer.css( target );
				}, delay );
			}
		},

		// Hide the layer
		hide: function( callback ) {
			if ( this.visible === false ) {
				return;
			}

			var that = this,
				offset = typeof this.data.hideOffset !== 'undefined' ? this.data.hideOffset : 50,
				duration = typeof this.data.hideDuration !== 'undefined' ? this.data.hideDuration / 1000 : 0.4,
				delay = typeof this.data.hideDelay !== 'undefined' ? this.data.hideDelay : 10;

			this.visible = false;

			// If the layer is hidden before it hides automatically, clear the timer
			if ( this.stayTimer !== null ) {
				clearTimeout( this.stayTimer );
			}

			// Animate the layers with CSS3 or with JavaScript
			if ( this.supportedAnimation === 'javascript' ) {
				this.$layer
					.stop()
					.delay( delay )
					.animate({ 'opacity': 0 }, duration * 1000, function() {
						$( this ).css( 'visibility', 'hidden' );

						if ( typeof callback !== 'undefined' ) {
							callback();
						}
					});
			} else {
				var transformValues = '',
					target = { 'opacity': 0 };

				target[ this.vendorPrefix + 'transform' ] = 'scale(' + this.scaleRatio + ')';
				target[ this.vendorPrefix + 'transition' ] = 'opacity ' + duration + 's';

				if ( typeof this.data.hideTransition !== 'undefined' ) {
					if ( this.data.hideTransition === 'left' ) {
						transformValues = '-' + offset + 'px, 0';
					} else if ( this.data.hideTransition === 'right' ) {
						transformValues = offset + 'px, 0';
					} else if ( this.data.hideTransition === 'up' ) {
						transformValues = '0, -' + offset + 'px';
					} else if ( this.data.hideTransition === 'down' ) {
						transformValues = '0, ' + offset + 'px';
					}

					target[ this.vendorPrefix + 'transform' ] += this.supportedAnimation === 'css-3d' ? ' translate3d(' + transformValues + ', 0)' : ' translate(' + transformValues + ')';
					target[ this.vendorPrefix + 'transition' ] += ', ' + this.vendorPrefix + 'transform ' + duration + 's';
				}

				// Listen when the layer animation is complete
				this.$layer.on( this.transitionEvent, function( event ) {
					if ( event.target !== event.currentTarget ) {
						return;
					}

					that.$layer
						.off( that.transitionEvent )
						.css( that.vendorPrefix + 'transition', '' );

					// Hide the layer after transition
					if ( that.visible === false ) {
						that.$layer.css( 'visibility', 'hidden' );
					}

					if ( typeof callback !== 'undefined' ) {
						callback();
					}
				});

				setTimeout( function() {
					that.$layer.css( target );
				}, delay );
			}
		},

		isVisible: function() {
			if ( this.visible === false || this.$layer.is( ':hidden' ) ) {
				return false;
			}

			return true;
		},

		// Destroy the layer
		destroy: function() {
			this.$layer.removeAttr( 'style' );
			this.$layer.removeAttr( 'data-layer-init' );
		}
	};

	$.SliderPro.addModule( 'Layers', Layers );
	
})( window, jQuery );

// Fade module for Slider Pro.
// 
// Adds the possibility to navigate through slides using a cross-fade effect.
;(function( window, $ ) {

	"use strict";

	var NS = 'Fade.' + $.SliderPro.namespace;

	var Fade = {

		// Reference to the original 'gotoSlide' method
		fadeGotoSlideReference: null,

		initFade: function() {
			this.on( 'update.' + NS, $.proxy( this._fadeOnUpdate, this ) );
		},

		// If fade is enabled, store a reference to the original 'gotoSlide' method
		// and then assign a new function to 'gotoSlide'.
		_fadeOnUpdate: function() {
			if ( this.settings.fade === true ) {
				this.fadeGotoSlideReference = this.gotoSlide;
				this.gotoSlide = this._fadeGotoSlide;
			}
		},

		// Will replace the original 'gotoSlide' function by adding a cross-fade effect
		// between the previous and the next slide.
		_fadeGotoSlide: function( index ) {
			if ( index === this.selectedSlideIndex ) {
				return;
			}
			
			// If the slides are being swiped/dragged, don't use fade, but call the original method instead.
			// If not, which means that a new slide was selected through a button, arrows or direct call, then
			// use fade.
			if ( this.$slider.hasClass( 'sp-swiping' ) ) {
				this.fadeGotoSlideReference( index );
			} else {
				var that = this,
					$nextSlide,
					$previousSlide,
					newIndex = index;

				// Loop through all the slides and overlap the the previous and next slide,
				// and hide the other slides.
				$.each( this.slides, function( index, element ) {
					var slideIndex = element.getIndex(),
						$slide = element.$slide;

					if ( slideIndex === newIndex ) {
						$slide.css({ 'opacity': 0, 'left': 0, 'top': 0, 'z-index': 20 });
						$nextSlide = $slide;
					} else if ( slideIndex === that.selectedSlideIndex ) {
						$slide.css({ 'opacity': 1, 'left': 0, 'top': 0, 'z-index': 10 });
						$previousSlide = $slide;
					} else {
						$slide.css( 'visibility', 'hidden' );
					}
				});

				// Set the new indexes for the previous and selected slides
				this.previousSlideIndex = this.selectedSlideIndex;
				this.selectedSlideIndex = index;

				// Re-assign the 'sp-selected' class to the currently selected slide
				this.$slides.find( '.sp-selected' ).removeClass( 'sp-selected' );
				this.$slides.find( '.sp-slide' ).eq( this.selectedSlideIndex ).addClass( 'sp-selected' );
			
				// Rearrange the slides if the slider is loopable
				if ( that.settings.loop === true ) {
					that._updateSlidesOrder();
				}

				// Move the slides container so that the cross-fading slides (which now have the top and left
				// position set to 0) become visible and in the center of the slider.
				this._moveTo( this.visibleOffset, true );

				// Fade out the previous slide, if indicated, in addition to fading in the next slide
				if ( this.settings.fadeOutPreviousSlide === true ) {
					this._fadeSlideTo( $previousSlide, 0 );
				}

				// Fade in the selected slide
				this._fadeSlideTo( $nextSlide, 1, function() {

					// After the animation is over, make all the slides visible again
					$.each( that.slides, function( index, element ) {
						var $slide = element.$slide;
						$slide.css({ 'visibility': '', 'opacity': '', 'z-index': '' });
					});
					
					// Reset the position of the slides and slides container
					that._resetSlidesPosition();

					// Fire the 'gotoSlideComplete' event
					that.trigger({ type: 'gotoSlideComplete', index: index, previousIndex: that.previousSlideIndex });
					if ( $.isFunction( that.settings.gotoSlideComplete ) ) {
						that.settings.gotoSlideComplete.call( that, { type: 'gotoSlideComplete', index: index, previousIndex: that.previousSlideIndex } );
					}
				});

				if ( this.settings.autoHeight === true ) {
					this._resizeHeight();
				}

				// Fire the 'gotoSlide' event
				this.trigger({ type: 'gotoSlide', index: index, previousIndex: this.previousSlideIndex });
				if ( $.isFunction( this.settings.gotoSlide ) ) {
					this.settings.gotoSlide.call( this, { type: 'gotoSlide', index: index, previousIndex: this.previousSlideIndex });
				}
			}
		},

		// Fade the target slide to the specified opacity (0 or 1)
		_fadeSlideTo: function( target, opacity, callback ) {
			var that = this;

			// Use CSS transitions if they are supported. If not, use JavaScript animation.
			if ( this.supportedAnimation === 'css-3d' || this.supportedAnimation === 'css-2d' ) {

				// There needs to be a delay between the moment the opacity is set
				// and the moment the transitions starts.
				setTimeout(function(){
					var css = { 'opacity': opacity };
					css[ that.vendorPrefix + 'transition' ] = 'opacity ' + that.settings.fadeDuration / 1000 + 's';
					target.css( css );
				}, 100 );

				target.on( this.transitionEvent, function( event ) {
					if ( event.target !== event.currentTarget ) {
						return;
					}
					
					target.off( that.transitionEvent );
					target.css( that.vendorPrefix + 'transition', '' );

					if ( typeof callback === 'function' ) {
						callback();
					}
				});
			} else {
				target.stop().animate({ 'opacity': opacity }, this.settings.fadeDuration, function() {
					if ( typeof callback === 'function' ) {
						callback();
					}
				});
			}
		},

		// Destroy the module
		destroyFade: function() {
			this.off( 'update.' + NS );

			if ( this.fadeGotoSlideReference !== null ) {
				this.gotoSlide = this.fadeGotoSlideReference;
			}
		},

		fadeDefaults: {

			// Indicates if fade will be used
			fade: false,

			// Indicates if the previous slide will be faded out (in addition to the next slide being faded in)
			fadeOutPreviousSlide: true,

			// Sets the duration of the fade effect
			fadeDuration: 500
		}
	};

	$.SliderPro.addModule( 'Fade', Fade );

})( window, jQuery );

// Touch Swipe module for Slider Pro.
// 
// Adds touch-swipe functionality for slides.
;(function( window, $ ) {

	"use strict";
	
	var NS = 'TouchSwipe.' + $.SliderPro.namespace;

	var TouchSwipe = {

		// The x and y coordinates of the pointer/finger's starting position
		touchStartPoint: {x: 0, y: 0},

		// The x and y coordinates of the pointer/finger's end position
		touchEndPoint: {x: 0, y: 0},

		// The distance from the starting to the end position on the x and y axis
		touchDistance: {x: 0, y: 0},

		// The position of the slides when the touch swipe starts
		touchStartPosition: 0,

		// Indicates if the slides are being swiped
		isTouchMoving: false,

		// Stores the names of the events
		touchSwipeEvents: { startEvent: '', moveEvent: '', endEvent: '' },

		initTouchSwipe: function() {
			var that = this;

			// check if touch swipe is enabled
			if ( this.settings.touchSwipe === false ) {
				return;
			}

			this.touchSwipeEvents.startEvent = 'touchstart' + '.' + NS + ' mousedown' + '.' + NS;
			this.touchSwipeEvents.moveEvent = 'touchmove' + '.' + NS + ' mousemove' + '.' + NS;
			this.touchSwipeEvents.endEvent = 'touchend' + '.' + this.uniqueId + '.' + NS + ' mouseup' + '.' + this.uniqueId + '.' + NS;

			// Listen for touch swipe/mouse move events
			this.$slidesMask.on( this.touchSwipeEvents.startEvent, $.proxy( this._onTouchStart, this ) );
			this.$slidesMask.on( 'dragstart.' + NS, function( event ) {
				event.preventDefault();
			});

			// Add the grabbing icon
			this.$slidesMask.addClass( 'sp-grab' );
		},

		// Called when the slides starts being dragged
		_onTouchStart: function( event ) {
		
			// Disable dragging if the element is set to allow selections
			if ( $( event.target ).closest( '.sp-selectable' ).length >= 1 ) {
				return;
			}

			var that = this,
				eventObject = typeof event.originalEvent.touches !== 'undefined' ? event.originalEvent.touches[0] : event.originalEvent;

			// Prevent default behavior only for mouse events
			if ( typeof event.originalEvent.touches === 'undefined' ) {
				event.preventDefault();
			}

			// Disable click events on links
			$( event.target ).parents( '.sp-slide' ).find( 'a' ).one( 'click.' + NS, function( event ) {
				event.preventDefault();
			});

			// Get the initial position of the mouse pointer and the initial position
			// of the slides' container
			this.touchStartPoint.x = eventObject.pageX || eventObject.clientX;
			this.touchStartPoint.y = eventObject.pageY || eventObject.clientY;
			this.touchStartPosition = this.slidesPosition;

			// Clear the previous distance values
			this.touchDistance.x = this.touchDistance.y = 0;

			// If the slides are being grabbed while they're still animating, stop the
			// current movement
			if ( this.$slides.hasClass( 'sp-animated' ) ) {
				this.isTouchMoving = true;
				this._stopMovement();
				this.touchStartPosition = this.slidesPosition;
			}

			// Listen for move and end events
			this.$slidesMask.on( this.touchSwipeEvents.moveEvent, $.proxy( this._onTouchMove, this ) );
			$( document ).on( this.touchSwipeEvents.endEvent, $.proxy( this._onTouchEnd, this ) );

			// Swap grabbing icons
			this.$slidesMask.removeClass( 'sp-grab' ).addClass( 'sp-grabbing' );

			// Add 'sp-swiping' class to indicate that the slides are being swiped
			this.$slider.addClass( 'sp-swiping' );
		},

		// Called during the slides' dragging
		_onTouchMove: function( event ) {
			var eventObject = typeof event.originalEvent.touches !== 'undefined' ? event.originalEvent.touches[0] : event.originalEvent;

			// Indicate that the move event is being fired
			this.isTouchMoving = true;

			// Get the current position of the mouse pointer
			this.touchEndPoint.x = eventObject.pageX || eventObject.clientX;
			this.touchEndPoint.y = eventObject.pageY || eventObject.clientY;

			// Calculate the distance of the movement on both axis
			this.touchDistance.x = this.touchEndPoint.x - this.touchStartPoint.x;
			this.touchDistance.y = this.touchEndPoint.y - this.touchStartPoint.y;
			
			// Calculate the distance of the swipe that takes place in the same direction as the orientation of the slides
			// and calculate the distance from the opposite direction.
			// 
			// For a swipe to be valid there should more distance in the same direction as the orientation of the slides.
			var distance = this.settings.orientation === 'horizontal' ? this.touchDistance.x : this.touchDistance.y,
				oppositeDistance = this.settings.orientation === 'horizontal' ? this.touchDistance.y : this.touchDistance.x;

			// If the movement is in the same direction as the orientation of the slides, the swipe is valid
			if ( Math.abs( distance ) > Math.abs( oppositeDistance ) ) {
				event.preventDefault();
			} else {
				return;
			}

			if ( this.settings.loop === false ) {
				// Make the slides move slower if they're dragged outside its bounds
				if ( ( this.slidesPosition > this.touchStartPosition && this.selectedSlideIndex === 0 ) ||
					( this.slidesPosition < this.touchStartPosition && this.selectedSlideIndex === this.getTotalSlides() - 1 )
				) {
					distance = distance * 0.2;
				}
			}

			this._moveTo( this.touchStartPosition + distance, true );
		},

		// Called when the slides are released
		_onTouchEnd: function( event ) {
			var that = this,
				touchDistance = this.settings.orientation === 'horizontal' ? this.touchDistance.x : this.touchDistance.y;

			// Remove the move and end listeners
			this.$slidesMask.off( this.touchSwipeEvents.moveEvent );
			$( document ).off( this.touchSwipeEvents.endEvent );

			// Swap grabbing icons
			this.$slidesMask.removeClass( 'sp-grabbing' ).addClass( 'sp-grab' );

			// Check if there is intention for a tap
			if ( this.isTouchMoving === false || this.isTouchMoving === true && Math.abs( this.touchDistance.x ) < 10 && Math.abs( this.touchDistance.y ) < 10 ) {
				// Re-enable click events on links
				$( event.target ).parents( '.sp-slide' ).find( 'a' ).off( 'click.' + NS );
				this.$slider.removeClass( 'sp-swiping' );
			}

			// Remove the 'sp-swiping' class but with a delay
			// because there might be other event listeners that check
			// the existence of this class, and this class should still be 
			// applied for those listeners, since there was a swipe event
			setTimeout(function() {
				that.$slider.removeClass( 'sp-swiping' );
			}, 1 );

			// Return if the slides didn't move
			if ( this.isTouchMoving === false ) {
				return;
			}

			this.isTouchMoving = false;

			$( event.target ).parents( '.sp-slide' ).one( 'click', function( event ) {
				event.preventDefault();
			});

			// Calculate the old position of the slides in order to return to it if the swipe
			// is below the threshold
			var oldSlidesPosition = - parseInt( this.$slides.find( '.sp-slide' ).eq( this.selectedSlideIndex ).css( this.positionProperty ), 10 ) + this.visibleOffset;

			if ( Math.abs( touchDistance ) < this.settings.touchSwipeThreshold ) {
				this._moveTo( oldSlidesPosition );
			} else {

				// Calculate by how many slides the slides container has moved
				var slideArrayDistance = touchDistance / ( this.slideSize + this.settings.slideDistance );

				// Floor the obtained value and add or subtract 1, depending on the direction of the swipe
				slideArrayDistance = parseInt( slideArrayDistance, 10 ) + ( slideArrayDistance > 0 ? 1 : - 1 );

				// Get the index of the currently selected slide and subtract the position index in order to obtain
				// the new index of the selected slide. 
				var nextSlideIndex = this.slidesOrder[ $.inArray( this.selectedSlideIndex, this.slidesOrder ) - slideArrayDistance ];

				if ( this.settings.loop === true ) {
					this.gotoSlide( nextSlideIndex );
				} else {
					if ( typeof nextSlideIndex !== 'undefined' ) {
						this.gotoSlide( nextSlideIndex );
					} else {
						this._moveTo( oldSlidesPosition );
					}
				}
			}
		},

		// Destroy the module
		destroyTouchSwipe: function() {
			this.$slidesMask.off( this.touchSwipeEvents.startEvent );
			this.$slidesMask.off( this.touchSwipeEvents.moveEvent );
			this.$slidesMask.off( 'dragstart.' + NS );
			$( document ).off( this.touchSwipeEvents.endEvent );
			this.$slidesMask.removeClass( 'sp-grab' );
		},

		touchSwipeDefaults: {
			
			// Indicates whether the touch swipe will be enabled
			touchSwipe: true,

			// Sets the minimum amount that the slides should move
			touchSwipeThreshold: 50
		}
	};

	$.SliderPro.addModule( 'TouchSwipe', TouchSwipe );
	
})( window, jQuery );

// Caption module for Slider Pro.
// 
// Adds a corresponding caption for each slide. The caption
// will appear and disappear with the slide.
;(function( window, $ ) {

	"use strict";
	
	var NS = 'Caption.' + $.SliderPro.namespace;

	var Caption = {

		// Reference to the container element that will hold the caption
		$captionContainer: null,

		// The caption content/text
		captionContent: '',

		initCaption: function() {
			this.on( 'update.' + NS, $.proxy( this._captionOnUpdate, this ) );
			this.on( 'gotoSlide.' + NS, $.proxy( this._updateCaptionContent, this ) );
		},

		// Create the caption container and hide the captions inside the slides
		_captionOnUpdate: function() {
			this.$captionContainer = this.$slider.find( '.sp-caption-container' );

			if ( this.$slider.find( '.sp-caption' ).length && this.$captionContainer.length === 0 ) {
				this.$captionContainer = $( '<div class="sp-caption-container"></div>' ).appendTo( this.$slider );

				// Show the caption for the selected slide
				this._updateCaptionContent();
			}

			// Hide the captions inside the slides
			this.$slides.find( '.sp-caption' ).each(function() {
				$( this ).css( 'display', 'none' );
			});
		},

		// Show the caption content for the selected slide
		_updateCaptionContent: function() {
			var that = this,
				newCaptionField = this.$slider.find( '.sp-slide' ).eq( this.selectedSlideIndex ).find( '.sp-caption' ),
				newCaptionContent = newCaptionField.length !== 0 ? newCaptionField.html() : '';

			// Either use a fade effect for swapping the captions or use an instant change
			if ( this.settings.fadeCaption === true ) {
				
				// If the previous slide had a caption, fade out that caption first and when the animation is over
				// fade in the current caption.
				// If the previous slide didn't have a caption, fade in the current caption directly.
				if ( this.captionContent !== '' ) {

					// If the caption container has 0 opacity when the fade out transition starts, set it
					// to 1 because the transition wouldn't work if the initial and final values are the same,
					// and the callback functions wouldn't fire in this case.
					if ( parseFloat( this.$captionContainer.css( 'opacity' ), 10 ) === 0 ) {
						this.$captionContainer.css( this.vendorPrefix + 'transition', '' );
						this.$captionContainer.css( 'opacity', 1 );
					}

					this._fadeCaptionTo( 0, function() {
						that.captionContent = newCaptionContent;

						if ( newCaptionContent !== '' ) {
							that.$captionContainer.html( that.captionContent );
							that._fadeCaptionTo( 1 );
						} else {
							that.$captionContainer.empty();
						}
					});
				} else {
					this.captionContent = newCaptionContent;
					this.$captionContainer.html( this.captionContent );
					this.$captionContainer.css( 'opacity', 0 );
					this._fadeCaptionTo( 1 );
				}
			} else {
				this.captionContent = newCaptionContent;
				this.$captionContainer.html( this.captionContent );
			}
		},

		// Fade the caption container to the specified opacity
		_fadeCaptionTo: function( opacity, callback ) {
			var that = this;

			// Use CSS transitions if they are supported. If not, use JavaScript animation.
			if ( this.supportedAnimation === 'css-3d' || this.supportedAnimation === 'css-2d' ) {
				
				// There needs to be a delay between the moment the opacity is set
				// and the moment the transitions starts.
				setTimeout(function(){
					var css = { 'opacity': opacity };
					css[ that.vendorPrefix + 'transition' ] = 'opacity ' + that.settings.captionFadeDuration / 1000 + 's';
					that.$captionContainer.css( css );
				}, 1 );

				this.$captionContainer.on( this.transitionEvent, function( event ) {
					if ( event.target !== event.currentTarget ) {
						return;
					}

					that.$captionContainer.off( that.transitionEvent );
					that.$captionContainer.css( that.vendorPrefix + 'transition', '' );

					if ( typeof callback === 'function' ) {
						callback();
					}
				});
			} else {
				this.$captionContainer.stop().animate({ 'opacity': opacity }, this.settings.captionFadeDuration, function() {
					if ( typeof callback === 'function' ) {
						callback();
					}
				});
			}
		},

		// Destroy the module
		destroyCaption: function() {
			this.off( 'update.' + NS );
			this.off( 'gotoSlide.' + NS );

			this.$captionContainer.remove();

			this.$slider.find( '.sp-caption' ).each(function() {
				$( this ).css( 'display', '' );
			});
		},

		captionDefaults: {

			// Indicates whether or not the captions will be faded
			fadeCaption: true,

			// Sets the duration of the fade animation
			captionFadeDuration: 500
		}
	};

	$.SliderPro.addModule( 'Caption', Caption );
	
})( window, jQuery );

// Deep Linking module for Slider Pro.
// 
// Updates the hash of the URL as the user navigates through the slides.
// Also, allows navigating to a specific slide by indicating it in the hash.
;(function( window, $ ) {

	"use strict";

	var NS = 'DeepLinking.' + $.SliderPro.namespace;

	var DeepLinking = {

		initDeepLinking: function() {
			var that = this;

			// Parse the initial hash
			this.on( 'init.' + NS, function() {
				that._gotoHash( window.location.hash );
			});

			// Update the hash when a new slide is selected
			this.on( 'gotoSlide.' + NS, function( event ) {
				if ( that.settings.updateHash === true ) {

					// get the 'id' attribute of the slide
					var slideId = that.$slider.find( '.sp-slide' ).eq( event.index ).attr( 'id' );

					// if the slide doesn't have an 'id' attribute, use the slide index
					if ( typeof slideId === 'undefined' ) {
						slideId = event.index;
					}

					window.location.hash = that.$slider.attr( 'id' ) + '/' + slideId;
				}
			});

			// Check when the hash changes and navigate to the indicated slide
			$( window ).on( 'hashchange.' + this.uniqueId + '.' + NS, function() {
				that._gotoHash( window.location.hash );
			});
		},

		// Parse the hash and return the slider id and the slide id
		_parseHash: function( hash ) {
			if ( hash !== '' ) {
				// Eliminate the # symbol
				hash = hash.substring(1);

				// Get the specified slider id and slide id
				var values = hash.split( '/' ),
					slideId = values.pop(),
					sliderId = hash.slice( 0, - slideId.toString().length - 1 );

				if ( this.$slider.attr( 'id' ) === sliderId ) {
					return { 'sliderID': sliderId, 'slideId': slideId };
				}
			}

			return false;
		},

		// Navigate to the appropriate slide, based on the specified hash
		_gotoHash: function( hash ) {
			var result = this._parseHash( hash );

			if ( result === false ) {
				return;
			}

			var slideId = result.slideId,
				slideIdNumber = parseInt( slideId, 10 );

			// check if the specified slide id is a number or string
			if ( isNaN( slideIdNumber ) ) {
				// get the index of the slide based on the specified id
				var slideIndex = this.$slider.find( '.sp-slide#' + slideId ).index();

				if ( slideIndex !== -1 && slideIndex !== this.selectedSlideIndex ) {
					this.gotoSlide( slideIndex );
				}
			} else if ( slideIdNumber !== this.selectedSlideIndex ) {
				this.gotoSlide( slideIdNumber );
			}
		},

		// Destroy the module
		destroyDeepLinking: function() {
			this.off( 'init.' + NS );
			this.off( 'gotoSlide.' + NS );
			$( window ).off( 'hashchange.' + this.uniqueId + '.' + NS );
		},

		deepLinkingDefaults: {

			// Indicates whether the hash will be updated when a new slide is selected
			updateHash: false
		}
	};

	$.SliderPro.addModule( 'DeepLinking', DeepLinking );
	
})( window, jQuery );

// Autoplay module for Slider Pro.
// 
// Adds automatic navigation through the slides by calling the
// 'nextSlide' or 'previousSlide' methods at certain time intervals.
;(function( window, $ ) {

	"use strict";
	
	var NS = 'Autoplay.' + $.SliderPro.namespace;

	var Autoplay = {

		autoplayTimer: null,

		isTimerRunning: false,

		isTimerPaused: false,

		initAutoplay: function() {
			this.on( 'update.' + NS, $.proxy( this._autoplayOnUpdate, this ) );
		},

		// Start the autoplay if it's enabled, or stop it if it's disabled but running 
		_autoplayOnUpdate: function( event ) {
			if ( this.settings.autoplay === true ) {
				this.on( 'gotoSlide.' + NS, $.proxy( this._autoplayOnGotoSlide, this ) );
				this.on( 'mouseenter.' + NS, $.proxy( this._autoplayOnMouseEnter, this ) );
				this.on( 'mouseleave.' + NS, $.proxy( this._autoplayOnMouseLeave, this ) );

				this.startAutoplay();
			} else {
				this.off( 'gotoSlide.' + NS );
				this.off( 'mouseenter.' + NS );
				this.off( 'mouseleave.' + NS );

				this.stopAutoplay();
			}
		},

		// Restart the autoplay timer when a new slide is selected
		_autoplayOnGotoSlide: function( event ) {
			// stop previous timers before starting a new one
			if ( this.isTimerRunning === true ) {
				this.stopAutoplay();
			}
			
			if ( this.isTimerPaused === false ) {
				this.startAutoplay();
			}
		},

		// Pause the autoplay when the slider is hovered
		_autoplayOnMouseEnter: function( event ) {
			if ( this.isTimerRunning && ( this.settings.autoplayOnHover === 'pause' || this.settings.autoplayOnHover === 'stop' ) ) {
				this.stopAutoplay();
				this.isTimerPaused = true;
			}
		},

		// Start the autoplay when the mouse moves away from the slider
		_autoplayOnMouseLeave: function( event ) {
			if ( this.settings.autoplay === true && this.isTimerRunning === false && this.settings.autoplayOnHover !== 'stop' ) {
				this.startAutoplay();
				this.isTimerPaused = false;
			}
		},

		// Starts the autoplay
		startAutoplay: function() {
			var that = this;
			
			this.isTimerRunning = true;

			this.autoplayTimer = setTimeout(function() {
				if ( that.settings.autoplayDirection === 'normal' ) {
					that.nextSlide();
				} else if ( that.settings.autoplayDirection === 'backwards' ) {
					that.previousSlide();
				}
			}, this.settings.autoplayDelay );
		},

		// Stops the autoplay
		stopAutoplay: function() {
			this.isTimerRunning = false;
			this.isTimerPaused = false;

			clearTimeout( this.autoplayTimer );
		},

		// Destroy the module
		destroyAutoplay: function() {
			clearTimeout( this.autoplayTimer );

			this.off( 'update.' + NS );
			this.off( 'gotoSlide.' + NS );
			this.off( 'mouseenter.' + NS );
			this.off( 'mouseleave.' + NS );
		},

		autoplayDefaults: {
			// Indicates whether or not autoplay will be enabled
			autoplay: true,

			// Sets the delay/interval at which the autoplay will run
			autoplayDelay: 5000,

			// Indicates whether autoplay will navigate to the next slide or previous slide
			autoplayDirection: 'normal',

			// Indicates if the autoplay will be paused or stopped when the slider is hovered.
			// Possible values are 'pause', 'stop' or 'none'.
			autoplayOnHover: 'pause'
		}
	};

	$.SliderPro.addModule( 'Autoplay', Autoplay );
	
})(window, jQuery);

// Keyboard module for Slider Pro.
// 
// Adds the possibility to navigate through slides using the keyboard arrow keys, or
// open the link attached to the main slide image by using the Enter key.
;(function( window, $ ) {

	"use strict";
	
	var NS = 'Keyboard.' + $.SliderPro.namespace;

	var Keyboard = {

		initKeyboard: function() {
			var that = this,
				hasFocus = false;

			if ( this.settings.keyboard === false ) {
				return;
			}

			// Detect when the slide is in focus and when it's not, and, optionally, make it
			// responsive to keyboard input only when it's in focus
			this.$slider.on( 'focus.' + NS, function() {
				hasFocus = true;
			});

			this.$slider.on( 'blur.' + NS, function() {
				hasFocus = false;
			});

			$( document ).on( 'keydown.' + this.uniqueId + '.' + NS, function( event ) {
				if ( that.settings.keyboardOnlyOnFocus === true && hasFocus === false ) {
					return;
				}

				// If the left arrow key is pressed, go to the previous slide.
				// If the right arrow key is pressed, go to the next slide.
				// If the Enter key is pressed, open the link attached to the main slide image.
				if ( event.which === 37 ) {
					that.previousSlide();
				} else if ( event.which === 39 ) {
					that.nextSlide();
				} else if ( event.which === 13 ) {
					that.$slider.find( '.sp-slide' ).eq( that.selectedSlideIndex ).find( '.sp-image-container a' )[0].click();
				}
			});
		},

		// Destroy the module
		destroyKeyboard: function() {
			this.$slider.off( 'focus.' + NS );
			this.$slider.off( 'blur.' + NS );
			$( document ).off( 'keydown.' + this.uniqueId + '.' + NS );
		},

		keyboardDefaults: {

			// Indicates whether keyboard navigation will be enabled
			keyboard: true,

			// Indicates whether the slider will respond to keyboard input only when
			// the slider is in focus.
			keyboardOnlyOnFocus: false
		}
	};

	$.SliderPro.addModule( 'Keyboard', Keyboard );
	
})( window, jQuery );

// Full Screen module for Slider Pro.
// 
// Adds the possibility to open the slider full-screen, using the HMTL5 FullScreen API.
;(function( window, $ ) {

	"use strict";

	var NS = 'FullScreen.' + $.SliderPro.namespace;

	var FullScreen = {

		// Indicates whether the slider is currently in full-screen mode
		isFullScreen: false,

		// Reference to the full-screen button
		$fullScreenButton: null,

		// Reference to a set of settings that influence the slider's size
		// before it goes full-screen
		sizeBeforeFullScreen: {},

		initFullScreen: function() {
			if ( ! ( document.fullscreenEnabled ||
				document.webkitFullscreenEnabled ||
				document.mozFullScreenEnabled ||
				document.msFullscreenEnabled ) ) {
				return;
			}
		
			this.on( 'update.' + NS, $.proxy( this._fullScreenOnUpdate, this ) );
		},

		// Create or remove the full-screen button depending on the value of the 'fullScreen' option
		_fullScreenOnUpdate: function() {
			if ( this.settings.fullScreen === true && this.$fullScreenButton === null ) {
				this._addFullScreen();
			} else if ( this.settings.fullScreen === false && this.$fullScreenButton !== null ) {
				this._removeFullScreen();
			}

			if ( this.settings.fullScreen === true ) {
				if ( this.settings.fadeFullScreen === true ) {
					this.$fullScreenButton.addClass( 'sp-fade-full-screen' );
				} else if ( this.settings.fadeFullScreen === false ) {
					this.$fullScreenButton.removeClass( 'sp-fade-full-screen' );
				}
			}
		},

		// Create the full-screen button
		_addFullScreen: function() {
			this.$fullScreenButton = $('<div class="sp-full-screen-button"></div>').appendTo( this.$slider );
			this.$fullScreenButton.on( 'click.' + NS, $.proxy( this._onFullScreenButtonClick, this ) );

			document.addEventListener( 'fullscreenchange', $.proxy( this._onFullScreenChange, this ) );
			document.addEventListener( 'mozfullscreenchange', $.proxy( this._onFullScreenChange, this ) );
			document.addEventListener( 'webkitfullscreenchange', $.proxy( this._onFullScreenChange, this ) );
			document.addEventListener( 'MSFullscreenChange', $.proxy( this._onFullScreenChange, this ) );
		},

		// Remove the full-screen button
		_removeFullScreen: function() {
			if ( this.$fullScreenButton !== null ) {
				this.$fullScreenButton.off( 'click.' + NS );
				this.$fullScreenButton.remove();
				this.$fullScreenButton = null;
				document.removeEventListener( 'fullscreenchange', this._onFullScreenChange );
				document.removeEventListener( 'mozfullscreenchange', this._onFullScreenChange );
				document.removeEventListener( 'webkitfullscreenchange', this._onFullScreenChange );
				document.removeEventListener( 'MSFullscreenChange', this._onFullScreenChange );
			}
		},

		// When the full-screen button is clicked, put the slider into full-screen mode, and
		// take it out of the full-screen mode when it's clicked again.
		_onFullScreenButtonClick: function() {
			if ( this.isFullScreen === false ) {
				if ( this.instance.requestFullScreen ) {
					this.instance.requestFullScreen();
				} else if ( this.instance.mozRequestFullScreen ) {
					this.instance.mozRequestFullScreen();
				} else if ( this.instance.webkitRequestFullScreen ) {
					this.instance.webkitRequestFullScreen();
				} else if ( this.instance.msRequestFullscreen ) {
					this.instance.msRequestFullscreen();
				}
			} else {
				if ( document.exitFullScreen ) {
					document.exitFullScreen();
				} else if ( document.mozCancelFullScreen ) {
					document.mozCancelFullScreen();
				} else if ( document.webkitCancelFullScreen ) {
					document.webkitCancelFullScreen();
				} else if ( document.msExitFullscreen ) {
					document.msExitFullscreen();
				}
			}
		},

		// This will be called whenever the full-screen mode changes.
		// If the slider is in full-screen mode, set it to 'full window', and if it's
		// not in full-screen mode anymore, set it back to the original size.
		_onFullScreenChange: function() {
			this.isFullScreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement ? true : false;

			if ( this.isFullScreen === true ) {
				this.sizeBeforeFullScreen = { forceSize: this.settings.forceSize, autoHeight: this.settings.autoHeight };
				this.$slider.addClass( 'sp-full-screen' );
				this.settings.forceSize = 'fullWindow';
				this.settings.autoHeight = false;
			} else {
				this.$slider.css( 'margin', '' );
				this.$slider.removeClass( 'sp-full-screen' );
				this.settings.forceSize = this.sizeBeforeFullScreen.forceSize;
				this.settings.autoHeight = this.sizeBeforeFullScreen.autoHeight;
			}

			this.resize();
		},

		// Destroy the module
		destroyFullScreen: function() {
			this.off( 'update.' + NS );
			this._removeFullScreen();
		},

		fullScreenDefaults: {

			// Indicates whether the full-screen button is enabled
			fullScreen: false,

			// Indicates whether the button will fade in only on hover
			fadeFullScreen: true
		}
	};

	$.SliderPro.addModule( 'FullScreen', FullScreen );

})( window, jQuery );

// Buttons module for Slider Pro.
// 
// Adds navigation buttons at the bottom of the slider.
;(function( window, $ ) {

	"use strict";
	
	var NS = 'Buttons.' + $.SliderPro.namespace;

	var Buttons = {

		// Reference to the buttons container
		$buttons: null,

		initButtons: function() {
			this.on( 'update.' + NS, $.proxy( this._buttonsOnUpdate, this ) );
		},

		_buttonsOnUpdate: function() {
			this.$buttons = this.$slider.find('.sp-buttons');
			
			// If there is more that one slide but the buttons weren't created yet, create the buttons.
			// If the buttons were created but their number differs from the total number of slides, re-create the buttons.
			// If the buttons were created but there are less than one slide, remove the buttons.s
			if ( this.settings.buttons === true && this.getTotalSlides() > 1 && this.$buttons.length === 0 ) {
				this._createButtons();
			} else if ( this.settings.buttons === true && this.getTotalSlides() !== this.$buttons.find( '.sp-button' ).length && this.$buttons.length !== 0 ) {
				this._adjustButtons();
			} else if ( this.settings.buttons === false || ( this.getTotalSlides() <= 1 && this.$buttons.length !== 0 ) ) {
				this._removeButtons();
			}
		},

		// Create the buttons
		_createButtons: function() {
			var that = this;

			// Create the buttons' container
			this.$buttons = $( '<div class="sp-buttons"></div>' ).appendTo( this.$slider );

			// Create the buttons
			for ( var i = 0; i < this.getTotalSlides(); i++ ) {
				$( '<div class="sp-button"></div>' ).appendTo( this.$buttons );
			}

			// Listen for button clicks 
			this.$buttons.on( 'click.' + NS, '.sp-button', function() {
				that.gotoSlide( $( this ).index() );
			});

			// Set the initially selected button
			this.$buttons.find( '.sp-button' ).eq( this.selectedSlideIndex ).addClass( 'sp-selected-button' );

			// Select the corresponding button when the slide changes
			this.on( 'gotoSlide.' + NS, function( event ) {
				that.$buttons.find( '.sp-selected-button' ).removeClass( 'sp-selected-button' );
				that.$buttons.find( '.sp-button' ).eq( event.index ).addClass( 'sp-selected-button' );
			});

			// Indicate that the slider has buttons 
			this.$slider.addClass( 'sp-has-buttons' );
		},

		// Re-create the buttons. This is calles when the number of slides changes.
		_adjustButtons: function() {
			this.$buttons.empty();

			// Create the buttons
			for ( var i = 0; i < this.getTotalSlides(); i++ ) {
				$( '<div class="sp-button"></div>' ).appendTo( this.$buttons );
			}

			// Change the selected the buttons
			this.$buttons.find( '.sp-selected-button' ).removeClass( 'sp-selected-button' );
			this.$buttons.find( '.sp-button' ).eq( this.selectedSlideIndex ).addClass( 'sp-selected-button' );
		},

		// Remove the buttons
		_removeButtons: function() {
			this.$buttons.off( 'click.' + NS, '.sp-button' );
			this.off( 'gotoSlide.' + NS );
			this.$buttons.remove();
			this.$slider.removeClass( 'sp-has-buttons' );
		},

		destroyButtons: function() {
			this._removeButtons();
			this.off( 'update.' + NS );
		},

		buttonsDefaults: {
			
			// Indicates whether the buttons will be created
			buttons: true
		}
	};

	$.SliderPro.addModule( 'Buttons', Buttons );

})( window, jQuery );

// Arrows module for Slider Pro.
// 
// Adds arrows for navigating to the next or previous slide.
;(function( window, $ ) {

	"use strict";

	var NS = 'Arrows.' + $.SliderPro.namespace;

	var Arrows = {

		// Reference to the arrows container
		$arrows: null,

		// Reference to the previous arrow
		$previousArrow: null,

		// Reference to the next arrow
		$nextArrow: null,

		initArrows: function() {
			this.on( 'update.' + NS, $.proxy( this._arrowsOnUpdate, this ) );
			this.on( 'gotoSlide.' + NS, $.proxy( this._checkArrowsVisibility, this ) );
		},

		_arrowsOnUpdate: function() {
			var that = this;

			// Create the arrows if the 'arrows' option is set to true
			if ( this.settings.arrows === true && this.$arrows === null ) {
				this.$arrows = $( '<div class="sp-arrows"></div>' ).appendTo( this.$slidesContainer );
				
				this.$previousArrow = $( '<div class="sp-arrow sp-previous-arrow"></div>' ).appendTo( this.$arrows );
				this.$nextArrow = $( '<div class="sp-arrow sp-next-arrow"></div>' ).appendTo( this.$arrows );

				this.$previousArrow.on( 'click.' + NS, function() {
					that.previousSlide();
				});

				this.$nextArrow.on( 'click.' + NS, function() {
					that.nextSlide();
				});

				this._checkArrowsVisibility();
			} else if ( this.settings.arrows === false && this.$arrows !== null ) {
				this._removeArrows();
			}

			if ( this.settings.arrows === true ) {
				if ( this.settings.fadeArrows === true ) {
					this.$arrows.addClass( 'sp-fade-arrows' );
				} else if ( this.settings.fadeArrows === false ) {
					this.$arrows.removeClass( 'sp-fade-arrows' );
				}
			}
		},

		// Show or hide the arrows depending on the position of the selected slide
		_checkArrowsVisibility: function() {
			if ( this.settings.arrows === false || this.settings.loop === true ) {
				return;
			}

			if ( this.selectedSlideIndex === 0 ) {
				this.$previousArrow.css( 'display', 'none' );
			} else {
				this.$previousArrow.css( 'display', 'block' );
			}

			if ( this.selectedSlideIndex === this.getTotalSlides() - 1 ) {
				this.$nextArrow.css( 'display', 'none' );
			} else {
				this.$nextArrow.css( 'display', 'block' );
			}
		},
		
		_removeArrows: function() {
			if ( this.$arrows !== null ) {
				this.$previousArrow.off( 'click.' + NS );
				this.$nextArrow.off( 'click.' + NS );
				this.$arrows.remove();
				this.$arrows = null;
			}
		},

		destroyArrows: function() {
			this._removeArrows();
			this.off( 'update.' + NS );
			this.off( 'gotoSlide.' + NS );
		},

		arrowsDefaults: {

			// Indicates whether the arrow buttons will be created
			arrows: false,

			// Indicates whether the arrows will fade in only on hover
			fadeArrows: true
		}
	};

	$.SliderPro.addModule( 'Arrows', Arrows );

})( window, jQuery );

// Thumbnail Touch Swipe module for Slider Pro.
// 
// Adds touch-swipe functionality for thumbnails.
;(function( window, $ ) {

	"use strict";
	
	var NS = 'ThumbnailTouchSwipe.' + $.SliderPro.namespace;

	var ThumbnailTouchSwipe = {

		// The x and y coordinates of the pointer/finger's starting position
		thumbnailTouchStartPoint: { x: 0, y: 0 },

		// The x and y coordinates of the pointer/finger's end position
		thumbnailTouchEndPoint: { x: 0, y: 0 },

		// The distance from the starting to the end position on the x and y axis
		thumbnailTouchDistance: { x: 0, y: 0 },

		// The position of the thumbnail scroller when the touch swipe starts
		thumbnailTouchStartPosition: 0,

		// Indicates if the thumbnail scroller is being swiped
		isThumbnailTouchMoving: false,

		// Indicates if the touch swipe was initialized
		isThumbnailTouchSwipe: false,

		// Stores the names of the events
		thumbnailTouchSwipeEvents: { startEvent: '', moveEvent: '', endEvent: '' },

		initThumbnailTouchSwipe: function() {
			this.on( 'update.' + NS, $.proxy( this._thumbnailTouchSwipeOnUpdate, this ) );
		},

		_thumbnailTouchSwipeOnUpdate: function() {

			// Return if there are no thumbnails
			if ( this.isThumbnailScroller === false ) {
				return;
			}

			// Initialize the touch swipe functionality if it wasn't initialized yet
			if ( this.settings.thumbnailTouchSwipe === true && this.isThumbnailTouchSwipe === false ) {
				this.isThumbnailTouchSwipe = true;

				this.thumbnailTouchSwipeEvents.startEvent = 'touchstart' + '.' + NS + ' mousedown' + '.' + NS;
				this.thumbnailTouchSwipeEvents.moveEvent = 'touchmove' + '.' + NS + ' mousemove' + '.' + NS;
				this.thumbnailTouchSwipeEvents.endEvent = 'touchend' + '.' + this.uniqueId + '.' + NS + ' mouseup' + '.' + this.uniqueId + '.' + NS;
				
				// Listen for touch swipe/mouse move events
				this.$thumbnails.on( this.thumbnailTouchSwipeEvents.startEvent, $.proxy( this._onThumbnailTouchStart, this ) );
				this.$thumbnails.on( 'dragstart.' + NS, function( event ) {
					event.preventDefault();
				});
			
				// Add the grabbing icon
				this.$thumbnails.addClass( 'sp-grab' );
			}

			// Remove the default thumbnailClick
			$.each( this.thumbnails, function( index, thumbnail ) {
				thumbnail.off( 'thumbnailClick' );
			});
		},

		// Called when the thumbnail scroller starts being dragged
		_onThumbnailTouchStart: function( event ) {
			// Disable dragging if the element is set to allow selections
			if ( $( event.target ).closest( '.sp-selectable' ).length >= 1 ) {
				return;
			}

			var that = this,
				eventObject = typeof event.originalEvent.touches !== 'undefined' ? event.originalEvent.touches[0] : event.originalEvent;

			// Prevent default behavior for mouse events
			if ( typeof event.originalEvent.touches === 'undefined' ) {
				event.preventDefault();
			}

			// Disable click events on links
			$( event.target ).parents( '.sp-thumbnail-container' ).find( 'a' ).one( 'click.' + NS, function( event ) {
				event.preventDefault();
			});

			// Get the initial position of the mouse pointer and the initial position
			// of the thumbnail scroller
			this.thumbnailTouchStartPoint.x = eventObject.pageX || eventObject.clientX;
			this.thumbnailTouchStartPoint.y = eventObject.pageY || eventObject.clientY;
			this.thumbnailTouchStartPosition = this.thumbnailsPosition;

			// Clear the previous distance values
			this.thumbnailTouchDistance.x = this.thumbnailTouchDistance.y = 0;

			// If the thumbnail scroller is being grabbed while it's still animating, stop the
			// current movement
			if ( this.$thumbnails.hasClass( 'sp-animated' ) ) {
				this.isThumbnailTouchMoving = true;
				this._stopThumbnailsMovement();
				this.thumbnailTouchStartPosition = this.thumbnailsPosition;
			}

			// Listen for move and end events
			this.$thumbnails.on( this.thumbnailTouchSwipeEvents.moveEvent, $.proxy( this._onThumbnailTouchMove, this ) );
			$( document ).on( this.thumbnailTouchSwipeEvents.endEvent, $.proxy( this._onThumbnailTouchEnd, this ) );

			// Swap grabbing icons
			this.$thumbnails.removeClass( 'sp-grab' ).addClass( 'sp-grabbing' );

			// Add 'sp-swiping' class to indicate that the thumbnail scroller is being swiped
			this.$thumbnailsContainer.addClass( 'sp-swiping' );
		},

		// Called during the thumbnail scroller's dragging
		_onThumbnailTouchMove: function( event ) {
			var eventObject = typeof event.originalEvent.touches !== 'undefined' ? event.originalEvent.touches[0] : event.originalEvent;

			// Indicate that the move event is being fired
			this.isThumbnailTouchMoving = true;

			// Get the current position of the mouse pointer
			this.thumbnailTouchEndPoint.x = eventObject.pageX || eventObject.clientX;
			this.thumbnailTouchEndPoint.y = eventObject.pageY || eventObject.clientY;

			// Calculate the distance of the movement on both axis
			this.thumbnailTouchDistance.x = this.thumbnailTouchEndPoint.x - this.thumbnailTouchStartPoint.x;
			this.thumbnailTouchDistance.y = this.thumbnailTouchEndPoint.y - this.thumbnailTouchStartPoint.y;
			
			// Calculate the distance of the swipe that takes place in the same direction as the orientation of the thumbnails
			// and calculate the distance from the opposite direction.
			// 
			// For a swipe to be valid there should more distance in the same direction as the orientation of the thumbnails.
			var distance = this.thumbnailsOrientation === 'horizontal' ? this.thumbnailTouchDistance.x : this.thumbnailTouchDistance.y,
				oppositeDistance = this.thumbnailsOrientation === 'horizontal' ? this.thumbnailTouchDistance.y : this.thumbnailTouchDistance.x;

			// If the movement is in the same direction as the orientation of the thumbnails, the swipe is valid
			if ( Math.abs( distance ) > Math.abs( oppositeDistance ) ) {
				event.preventDefault();
			} else {
				return;
			}

			// Make the thumbnail scroller move slower if it's dragged outside its bounds
			if ( this.thumbnailsPosition >= 0 ) {
				var infOffset = - this.thumbnailTouchStartPosition;
				distance = infOffset + ( distance - infOffset ) * 0.2;
			} else if ( this.thumbnailsPosition <= - this.thumbnailsSize + this.thumbnailsContainerSize ) {
				var supOffset = this.thumbnailsSize - this.thumbnailsContainerSize + this.thumbnailTouchStartPosition;
				distance = - supOffset + ( distance + supOffset ) * 0.2;
			}
			
			this._moveThumbnailsTo( this.thumbnailTouchStartPosition + distance, true );
		},

		// Called when the thumbnail scroller is released
		_onThumbnailTouchEnd: function( event ) {
			var that = this,
				thumbnailTouchDistance = this.thumbnailsOrientation === 'horizontal' ? this.thumbnailTouchDistance.x : this.thumbnailTouchDistance.y;

			// Remove the move and end listeners
			this.$thumbnails.off( this.thumbnailTouchSwipeEvents.moveEvent );
			$( document ).off( this.thumbnailTouchSwipeEvents.endEvent );

			// Swap grabbing icons
			this.$thumbnails.removeClass( 'sp-grabbing' ).addClass( 'sp-grab' );

			// Check if there is intention for a tap/click
			if ( this.isThumbnailTouchMoving === false ||
				this.isThumbnailTouchMoving === true &&
				Math.abs( this.thumbnailTouchDistance.x ) < 10 &&
				Math.abs( this.thumbnailTouchDistance.y ) < 10
			) {
				var targetThumbnail = $( event.target ).hasClass( 'sp-thumbnail-container' ) ? $( event.target ) : $( event.target ).parents( '.sp-thumbnail-container' ),
					index = targetThumbnail.index();

				// If a link is cliked, navigate to that link, else navigate to the slide that corresponds to the thumbnail
				if ( $( event.target ).parents( 'a' ).length !== 0 ) {
					$( event.target ).parents( 'a' ).off( 'click.' + NS );
					this.$thumbnailsContainer.removeClass( 'sp-swiping' );
				} else if ( index !== this.selectedThumbnailIndex && index !== -1 ) {
					this.gotoSlide( index );
				}

				return;
			}

			this.isThumbnailTouchMoving = false;

			$( event.target ).parents( '.sp-thumbnail' ).one( 'click', function( event ) {
				event.preventDefault();
			});

			// Remove the 'sp-swiping' class but with a delay
			// because there might be other event listeners that check
			// the existence of this class, and this class should still be 
			// applied for those listeners, since there was a swipe event
			setTimeout(function() {
				that.$thumbnailsContainer.removeClass( 'sp-swiping' );
			}, 1 );

			// Keep the thumbnail scroller inside the bounds
			if ( this.thumbnailsPosition > 0 ) {
				this._moveThumbnailsTo( 0 );
			} else if ( this.thumbnailsPosition < this.thumbnailsContainerSize - this.thumbnailsSize ) {
				this._moveThumbnailsTo( this.thumbnailsContainerSize - this.thumbnailsSize );
			}

			// Fire the 'thumbnailsMoveComplete' event
			this.trigger({ type: 'thumbnailsMoveComplete' });
			if ( $.isFunction( this.settings.thumbnailsMoveComplete ) ) {
				this.settings.thumbnailsMoveComplete.call( this, { type: 'thumbnailsMoveComplete' });
			}
		},

		// Destroy the module
		destroyThumbnailTouchSwipe: function() {
			this.off( 'update.' + NS );

			if ( this.isThumbnailScroller === false ) {
				return;
			}

			this.$thumbnails.off( this.thumbnailTouchSwipeEvents.startEvent );
			this.$thumbnails.off( this.thumbnailTouchSwipeEvents.moveEvent );
			this.$thumbnails.off( 'dragstart.' + NS );
			$( document ).off( this.thumbnailTouchSwipeEvents.endEvent );
			this.$thumbnails.removeClass( 'sp-grab' );
		},

		thumbnailTouchSwipeDefaults: {

			// Indicates whether the touch swipe will be enabled for thumbnails
			thumbnailTouchSwipe: true
		}
	};

	$.SliderPro.addModule( 'ThumbnailTouchSwipe', ThumbnailTouchSwipe );

})( window, jQuery );

// Thumbnail Arrows module for Slider Pro.
// 
// Adds thumbnail arrows for moving the thumbnail scroller.
;(function( window, $ ) {

	"use strict";
	
	var NS = 'ThumbnailArrows.' + $.SliderPro.namespace;

	var ThumbnailArrows = {

		// Reference to the arrows container
		$thumbnailArrows: null,

		// Reference to the 'previous' thumbnail arrow
		$previousThumbnailArrow: null,

		// Reference to the 'next' thumbnail arrow
		$nextThumbnailArrow: null,

		initThumbnailArrows: function() {
			var that = this;

			this.on( 'update.' + NS, $.proxy( this._thumbnailArrowsOnUpdate, this ) );
			
			// Check if the arrows need to be visible or invisible when the thumbnail scroller
			// resizes and when the thumbnail scroller moves.
			this.on( 'sliderResize.' + NS + ' ' + 'thumbnailsMoveComplete.' + NS, function() {
				if ( that.isThumbnailScroller === true && that.settings.thumbnailArrows === true ) {
					that._checkThumbnailArrowsVisibility();
				}
			});
		},
		
		// Called when the slider is updated
		_thumbnailArrowsOnUpdate: function() {
			var that = this;
			
			if ( this.isThumbnailScroller === false ) {
				return;
			}

			// Create or remove the thumbnail scroller arrows
			if ( this.settings.thumbnailArrows === true && this.$thumbnailArrows === null ) {
				this.$thumbnailArrows = $( '<div class="sp-thumbnail-arrows"></div>' ).appendTo( this.$thumbnailsContainer );
				
				this.$previousThumbnailArrow = $( '<div class="sp-thumbnail-arrow sp-previous-thumbnail-arrow"></div>' ).appendTo( this.$thumbnailArrows );
				this.$nextThumbnailArrow = $( '<div class="sp-thumbnail-arrow sp-next-thumbnail-arrow"></div>' ).appendTo( this.$thumbnailArrows );

				this.$previousThumbnailArrow.on( 'click.' + NS, function() {
					var previousPosition = Math.min( 0, that.thumbnailsPosition + that.thumbnailsContainerSize );
					that._moveThumbnailsTo( previousPosition );
				});

				this.$nextThumbnailArrow.on( 'click.' + NS, function() {
					var nextPosition = Math.max( that.thumbnailsContainerSize - that.thumbnailsSize, that.thumbnailsPosition - that.thumbnailsContainerSize );
					that._moveThumbnailsTo( nextPosition );
				});
			} else if ( this.settings.thumbnailArrows === false && this.$thumbnailArrows !== null ) {
				this._removeThumbnailArrows();
			}

			// Add fading functionality and check if the arrows need to be visible or not
			if ( this.settings.thumbnailArrows === true ) {
				if ( this.settings.fadeThumbnailArrows === true ) {
					this.$thumbnailArrows.addClass( 'sp-fade-thumbnail-arrows' );
				} else if ( this.settings.fadeThumbnailArrows === false ) {
					this.$thumbnailArrows.removeClass( 'sp-fade-thumbnail-arrows' );
				}

				this._checkThumbnailArrowsVisibility();
			}
		},

		// Checks if the 'next' or 'previous' arrows need to be visible or hidden,
		// based on the position of the thumbnail scroller
		_checkThumbnailArrowsVisibility: function() {
			if ( this.thumbnailsPosition === 0 ) {
				this.$previousThumbnailArrow.css( 'display', 'none' );
			} else {
				this.$previousThumbnailArrow.css( 'display', 'block' );
			}

			if ( this.thumbnailsPosition === this.thumbnailsContainerSize - this.thumbnailsSize ) {
				this.$nextThumbnailArrow.css( 'display', 'none' );
			} else {
				this.$nextThumbnailArrow.css( 'display', 'block' );
			}
		},

		// Remove the thumbnail arrows
		_removeThumbnailArrows: function() {
			if ( this.$thumbnailArrows !== null ) {
				this.$previousThumbnailArrow.off( 'click.' + NS );
				this.$nextThumbnailArrow.off( 'click.' + NS );
				this.$thumbnailArrows.remove();
				this.$thumbnailArrows = null;
			}
		},

		// Destroy the module
		destroyThumbnailArrows: function() {
			this._removeThumbnailArrows();
			this.off( 'update.' + NS );
			this.off( 'sliderResize.' + NS );
			this.off( 'thumbnailsMoveComplete.' + NS );
		},

		thumbnailArrowsDefaults: {

			// Indicates whether the thumbnail arrows will be enabled
			thumbnailArrows: false,

			// Indicates whether the thumbnail arrows will be faded
			fadeThumbnailArrows: true
		}
	};

	$.SliderPro.addModule( 'ThumbnailArrows', ThumbnailArrows );

})( window, jQuery );

// Video module for Slider Pro
//
// Adds automatic control for several video players and providers
;(function( window, $ ) {

	"use strict";

	var NS = 'Video.' + $.SliderPro.namespace;
	
	var Video = {

		firstInit: false,

		initVideo: function() {
			this.on( 'update.' + NS, $.proxy( this._videoOnUpdate, this ) );
			this.on( 'gotoSlideComplete.' + NS, $.proxy( this._videoOnGotoSlideComplete, this ) );
		},

		_videoOnUpdate: function() {
			var that = this;

			// Find all the inline videos and initialize them
			this.$slider.find( '.sp-video' ).not( 'a, [data-video-init]' ).each(function() {
				var video = $( this );
				that._initVideo( video );
			});

			// Find all the lazy-loaded videos and preinitialize them. They will be initialized
			// only when their play button is clicked.
			this.$slider.find( 'a.sp-video' ).not( '[data-video-preinit]' ).each(function() {
				var video = $( this );
				that._preinitVideo( video );
			});

			// call the 'gotoSlideComplete' method in case the first slide contains a video that
			// needs to play automatically
			if ( this.firstInit === false ) {
				this.firstInit = true;
				this._videoOnGotoSlideComplete({ index: this.selectedSlideIndex, previousIndex: -1 });
			}
		},

		// Initialize the target video
		_initVideo: function( video ) {
			var that = this;

			video.attr( 'data-video-init', true )
				.videoController();

			// When the video starts playing, pause the autoplay if it's running
			video.on( 'videoPlay.' + NS, function() {
				if ( that.settings.playVideoAction === 'stopAutoplay' && typeof that.stopAutoplay !== 'undefined' ) {
					that.stopAutoplay();
					that.settings.autoplay = false;
				}

				// Fire the 'videoPlay' event
				var eventObject = { type: 'videoPlay', video: video };
				that.trigger( eventObject );
				if ( $.isFunction( that.settings.videoPlay ) ) {
					that.settings.videoPlay.call( that, eventObject );
				}
			});

			// When the video is paused, restart the autoplay
			video.on( 'videoPause.' + NS, function() {
				if ( that.settings.pauseVideoAction === 'startAutoplay' && typeof that.startAutoplay !== 'undefined' ) {
					that.startAutoplay();
					that.settings.autoplay = true;
				}

				// Fire the 'videoPause' event
				var eventObject = { type: 'videoPause', video: video };
				that.trigger( eventObject );
				if ( $.isFunction( that.settings.videoPause ) ) {
					that.settings.videoPause.call( that, eventObject );
				}
			});

			// When the video ends, restart the autoplay (which was paused during the playback), or
			// go to the next slide, or replay the video
			video.on( 'videoEnded.' + NS, function() {
				if ( that.settings.endVideoAction === 'startAutoplay' && typeof that.startAutoplay !== 'undefined' ) {
					that.startAutoplay();
					that.settings.autoplay = true;
				} else if ( that.settings.endVideoAction === 'nextSlide' ) {
					that.nextSlide();
				} else if ( that.settings.endVideoAction === 'replayVideo' ) {
					video.videoController( 'replay' );
				}

				// Fire the 'videoEnd' event
				var eventObject = { type: 'videoEnd', video: video };
				that.trigger( eventObject );
				if ( $.isFunction(that.settings.videoEnd ) ) {
					that.settings.videoEnd.call( that, eventObject );
				}
			});
		},

		// Pre-initialize the video. This is for lazy loaded videos.
		_preinitVideo: function( video ) {
			var that = this;

			video.attr( 'data-video-preinit', true );

			// When the video poster is clicked, remove the poster and create
			// the inline video
			video.on( 'click.' + NS, function( event ) {

				// If the video is being dragged, don't start the video
				if ( that.$slider.hasClass( 'sp-swiping' ) ) {
					return;
				}

				event.preventDefault();

				var href = video.attr( 'href' ),
					iframe,
					provider,
					regExp,
					match,
					id,
					src,
					videoAttributes,
					videoWidth = video.children( 'img' ).attr( 'width' ) || video.children( 'img' ).width(),
					videoHeight = video.children( 'img' ).attr( 'height') || video.children( 'img' ).height();

				// Check if it's a youtube or vimeo video
				if ( href.indexOf( 'youtube' ) !== -1 || href.indexOf( 'youtu.be' ) !== -1 ) {
					provider = 'youtube';
				} else if ( href.indexOf( 'vimeo' ) !== -1 ) {
					provider = 'vimeo';
				}

				// Get the id of the video
				regExp = provider === 'youtube' ? /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/ : /http:\/\/(www\.)?vimeo.com\/(\d+)/;
				match = href.match( regExp );
				id = match[2];

				// Get the source of the iframe that will be created
				src = provider === 'youtube' ? '//www.youtube.com/embed/' + id + '?enablejsapi=1&wmode=opaque' : '//player.vimeo.com/video/'+ id +'?api=1';
				
				// Get the attributes passed to the video link and then pass them to the iframe's src
				videoAttributes = href.split( '?' )[ 1 ];

				if ( typeof videoAttributes !== 'undefined' ) {
					videoAttributes = videoAttributes.split( '&' );

					$.each( videoAttributes, function( index, value ) {
						if ( value.indexOf( id ) === -1 ) {
							src += '&' + value;
						}
					});
				}

				// Create the iframe
				iframe = $( '<iframe></iframe>' )
					.attr({
						'src': src,
						'width': videoWidth,
						'height': videoHeight,
						'class': video.attr( 'class' ),
						'frameborder': 0,
						'allowfullscreen': 'allowfullscreen'
					}).insertBefore( video );

				// Initialize the video and play it
				that._initVideo( iframe );
				iframe.videoController( 'play' );

				// Hide the video poster
				video.css( 'display', 'none' );
			});
		},

		// Called when a new slide is selected
		_videoOnGotoSlideComplete: function( event ) {

			// Get the video from the previous slide
			var previousVideo = this.$slides.find( '.sp-slide' ).eq( event.previousIndex ).find( '.sp-video[data-video-init]' );

			// Handle the video from the previous slide by stopping it, or pausing it,
			// or remove it, depending on the value of the 'leaveVideoAction' option.
			if ( event.previousIndex !== -1 && previousVideo.length !== 0 ) {
				if ( this.settings.leaveVideoAction === 'stopVideo' ) {
					previousVideo.videoController( 'stop' );
				} else if ( this.settings.leaveVideoAction === 'pauseVideo' ) {
					previousVideo.videoController( 'pause' );
				} else if ( this.settings.leaveVideoAction === 'removeVideo'  ) {
					// If the video was lazy-loaded, remove it and show the poster again. If the video
					// was not lazy-loaded, but inline, stop the video.
					if ( previousVideo.siblings( 'a.sp-video' ).length !== 0 ) {
						previousVideo.siblings( 'a.sp-video' ).css( 'display', '' );
						previousVideo.videoController( 'destroy' );
						previousVideo.remove();
					} else {
						previousVideo.videoController( 'stop' );
					}
				}
			}

			// Handle the video from the selected slide
			if ( this.settings.reachVideoAction === 'playVideo' ) {
				var loadedVideo = this.$slides.find( '.sp-slide' ).eq( event.index ).find( '.sp-video[data-video-init]' ),
					unloadedVideo = this.$slides.find( '.sp-slide' ).eq( event.index ).find( '.sp-video[data-video-preinit]' );

				// If the video was already initialized, play it. If it's not initialized (because
				// it's lazy loaded) initialize it and play it.
				if ( loadedVideo.length !== 0 ) {
					loadedVideo.videoController( 'play' );
				} else if ( unloadedVideo.length !== 0 ) {
					unloadedVideo.trigger( 'click.' + NS );
				}
			}
		},

		// Destroy the module
		destroyVideo: function() {
			this.$slider.find( '.sp-video[ data-video-preinit ]' ).each(function() {
				var video = $( this );
				video.removeAttr( 'data-video-preinit' );
				video.off( 'click.' + NS );
			});

			// Loop through the all the videos and destroy them
			this.$slider.find( '.sp-video[ data-video-init ]' ).each(function() {
				var video = $( this );
				video.removeAttr( 'data-video-init' );
				video.off( 'Video' );
				video.videoController( 'destroy' );
			});

			this.off( 'update.' + NS );
			this.off( 'gotoSlideComplete.' + NS );
		},

		videoDefaults: {

			// Sets the action that the video will perform when its slide container is selected
			// ( 'playVideo' and 'none' )
			reachVideoAction: 'none',

			// Sets the action that the video will perform when another slide is selected
			// ( 'stopVideo', 'pauseVideo', 'removeVideo' and 'none' )
			leaveVideoAction: 'pauseVideo',

			// Sets the action that the slider will perform when the video starts playing
			// ( 'stopAutoplay' and 'none' )
			playVideoAction: 'stopAutoplay',

			// Sets the action that the slider will perform when the video is paused
			// ( 'startAutoplay' and 'none' )
			pauseVideoAction: 'none',

			// Sets the action that the slider will perform when the video ends
			// ( 'startAutoplay', 'nextSlide', 'replayVideo' and 'none' )
			endVideoAction: 'none',

			// Called when the video starts playing
			videoPlay: function() {},

			// Called when the video is paused
			videoPause: function() {},

			// Called when the video ends
			videoEnd: function() {}
		}
	};

	$.SliderPro.addModule( 'Video', Video );
	
})( window, jQuery );

// Video Controller jQuery plugin
// Creates a universal controller for multiple video types and providers
;(function( $ ) {

	"use strict";

// Check if an iOS device is used.
// This information is important because a video can not be
// controlled programmatically unless the user has started the video manually.
var	isIOS = window.navigator.userAgent.match( /(iPad|iPhone|iPod)/g ) ? true : false;

var VideoController = function( instance, options ) {
	this.$video = $( instance );
	this.options = options;
	this.settings = {};
	this.player = null;

	this._init();
};

VideoController.prototype = {

	_init: function() {
		this.settings = $.extend( {}, this.defaults, this.options );

		var that = this,
			players = $.VideoController.players,
			videoID = this.$video.attr( 'id' );

		// Loop through the available video players
		// and check if the targeted video element is supported by one of the players.
		// If a compatible type is found, store the video type.
		for ( var name in players ) {
			if ( typeof players[ name ] !== 'undefined' && players[ name ].isType( this.$video ) ) {
				this.player = new players[ name ]( this.$video );
				break;
			}
		}

		// Return if the player could not be instantiated
		if ( this.player === null ) {
			return;
		}

		// Add event listeners
		var events = [ 'ready', 'start', 'play', 'pause', 'ended' ];
		
		$.each( events, function( index, element ) {
			var event = 'video' + element.charAt( 0 ).toUpperCase() + element.slice( 1 );

			that.player.on( element, function() {
				that.trigger({ type: event, video: videoID });
				if ( $.isFunction( that.settings[ event ] ) ) {
					that.settings[ event ].call( that, { type: event, video: videoID } );
				}
			});
		});
	},
	
	play: function() {
		if ( isIOS === true && this.player.isStarted() === false || this.player.getState() === 'playing' ) {
			return;
		}

		this.player.play();
	},
	
	stop: function() {
		if ( isIOS === true && this.player.isStarted() === false || this.player.getState() === 'stopped' ) {
			return;
		}

		this.player.stop();
	},
	
	pause: function() {
		if ( isIOS === true && this.player.isStarted() === false || this.player.getState() === 'paused' ) {
			return;
		}

		this.player.pause();
	},

	replay: function() {
		if ( isIOS === true && this.player.isStarted() === false ) {
			return;
		}
		
		this.player.replay();
	},

	on: function( type, callback ) {
		return this.$video.on( type, callback );
	},
	
	off: function( type ) {
		return this.$video.off( type );
	},

	trigger: function( data ) {
		return this.$video.triggerHandler( data );
	},

	destroy: function() {
		if ( this.player.isStarted() === true ) {
			this.stop();
		}

		this.player.off( 'ready' );
		this.player.off( 'start' );
		this.player.off( 'play' );
		this.player.off( 'pause' );
		this.player.off( 'ended' );

		this.$video.removeData( 'videoController' );
	},

	defaults: {
		videoReady: function() {},
		videoStart: function() {},
		videoPlay: function() {},
		videoPause: function() {},
		videoEnded: function() {}
	}
};

$.VideoController = {
	players: {},

	addPlayer: function( name, player ) {
		this.players[ name ] = player;
	}
};

$.fn.videoController = function( options ) {
	var args = Array.prototype.slice.call( arguments, 1 );

	return this.each(function() {
		// Instantiate the video controller or call a function on the current instance
		if ( typeof $( this ).data( 'videoController' ) === 'undefined' ) {
			var newInstance = new VideoController( this, options );

			// Store a reference to the instance created
			$( this ).data( 'videoController', newInstance );
		} else if ( typeof options !== 'undefined' ) {
			var	currentInstance = $( this ).data( 'videoController' );

			// Check the type of argument passed
			if ( typeof currentInstance[ options ] === 'function' ) {
				currentInstance[ options ].apply( currentInstance, args );
			} else {
				$.error( options + ' does not exist in videoController.' );
			}
		}
	});
};

// Base object for the video players
var Video = function( video ) {
	this.$video = video;
	this.player = null;
	this.ready = false;
	this.started = false;
	this.state = '';
	this.events = $({});

	this._init();
};

Video.prototype = {
	_init: function() {},

	play: function() {},

	pause: function() {},

	stop: function() {},

	replay: function() {},

	isType: function() {},

	isReady: function() {
		return this.ready;
	},

	isStarted: function() {
		return this.started;
	},

	getState: function() {
		return this.state;
	},

	on: function( type, callback ) {
		return this.events.on( type, callback );
	},
	
	off: function( type ) {
		return this.events.off( type );
	},

	trigger: function( data ) {
		return this.events.triggerHandler( data );
	}
};

// YouTube video
var YoutubeVideoHelper = {
	youtubeAPIAdded: false,
	youtubeVideos: []
};

var YoutubeVideo = function( video ) {
	this.init = false;
	var youtubeAPILoaded = window.YT && window.YT.Player;

	if ( typeof youtubeAPILoaded !== 'undefined' ) {
		Video.call( this, video );
	} else {
		YoutubeVideoHelper.youtubeVideos.push({ 'video': video, 'scope': this });
		
		if ( YoutubeVideoHelper.youtubeAPIAdded === false ) {
			YoutubeVideoHelper.youtubeAPIAdded = true;

			var tag = document.createElement( 'script' );
			tag.src = "//www.youtube.com/player_api";
			var firstScriptTag = document.getElementsByTagName( 'script' )[0];
			firstScriptTag.parentNode.insertBefore( tag, firstScriptTag );

			window.onYouTubePlayerAPIReady = function() {
				$.each( YoutubeVideoHelper.youtubeVideos, function( index, element ) {
					Video.call( element.scope, element.video );
				});
			};
		}
	}
};

YoutubeVideo.prototype = new Video();
YoutubeVideo.prototype.constructor = YoutubeVideo;
$.VideoController.addPlayer( 'YoutubeVideo', YoutubeVideo );

YoutubeVideo.isType = function( video ) {
	if ( video.is( 'iframe' ) ) {
		var src = video.attr( 'src' );

		if ( src.indexOf( 'youtube.com' ) !== -1 || src.indexOf( 'youtu.be' ) !== -1 ) {
			return true;
		}
	}

	return false;
};

YoutubeVideo.prototype._init = function() {
	this.init = true;
	this._setup();
};
	
YoutubeVideo.prototype._setup = function() {
	var that = this;

	// Get a reference to the player
	this.player = new YT.Player( this.$video[0], {
		events: {
			'onReady': function() {
				that.trigger({ type: 'ready' });
				that.ready = true;
			},
			
			'onStateChange': function( event ) {
				switch ( event.data ) {
					case YT.PlayerState.PLAYING:
						if (that.started === false) {
							that.started = true;
							that.trigger({ type: 'start' });
						}

						that.state = 'playing';
						that.trigger({ type: 'play' });
						break;
					
					case YT.PlayerState.PAUSED:
						that.state = 'paused';
						that.trigger({ type: 'pause' });
						break;
					
					case YT.PlayerState.ENDED:
						that.state = 'ended';
						that.trigger({ type: 'ended' });
						break;
				}
			}
		}
	});
};

YoutubeVideo.prototype.play = function() {
	var that = this;

	if ( this.ready === true ) {
		this.player.playVideo();
	} else {
		var timer = setInterval(function() {
			if ( that.ready === true ) {
				clearInterval( timer );
				that.player.playVideo();
			}
		}, 100 );
	}
};

YoutubeVideo.prototype.pause = function() {
	// On iOS, simply pausing the video can make other videos unresponsive
	// so we stop the video instead.
	if ( isIOS === true ) {
		this.stop();
	} else {
		this.player.pauseVideo();
	}
};

YoutubeVideo.prototype.stop = function() {
	this.player.seekTo( 1 );
	this.player.stopVideo();
	this.state = 'stopped';
};

YoutubeVideo.prototype.replay = function() {
	this.player.seekTo( 1 );
	this.player.playVideo();
};

YoutubeVideo.prototype.on = function( type, callback ) {
	var that = this;

	if ( this.init === true ) {
		Video.prototype.on.call( this, type, callback );
	} else {
		var timer = setInterval(function() {
			if ( that.init === true ) {
				clearInterval( timer );
				Video.prototype.on.call( that, type, callback );
			}
		}, 100 );
	}
};

// Vimeo video
var VimeoVideoHelper = {
	vimeoAPIAdded: false,
	vimeoVideos: []
};

var VimeoVideo = function( video ) {
	this.init = false;

	if ( typeof window.Froogaloop !== 'undefined' ) {
		Video.call( this, video );
	} else {
		VimeoVideoHelper.vimeoVideos.push({ 'video': video, 'scope': this });

		if ( VimeoVideoHelper.vimeoAPIAdded === false ) {
			VimeoVideoHelper.vimeoAPIAdded = true;

			var tag = document.createElement('script');
			tag.src = "//a.vimeocdn.com/js/froogaloop2.min.js";
			var firstScriptTag = document.getElementsByTagName( 'script' )[0];
			firstScriptTag.parentNode.insertBefore( tag, firstScriptTag );
		
			var checkVimeoAPITimer = setInterval(function() {
				if ( typeof window.Froogaloop !== 'undefined' ) {
					clearInterval( checkVimeoAPITimer );
					
					$.each( VimeoVideoHelper.vimeoVideos, function( index, element ) {
						Video.call( element.scope, element.video );
					});
				}
			}, 100 );
		}
	}
};

VimeoVideo.prototype = new Video();
VimeoVideo.prototype.constructor = VimeoVideo;
$.VideoController.addPlayer( 'VimeoVideo', VimeoVideo );

VimeoVideo.isType = function( video ) {
	if ( video.is( 'iframe' ) ) {
		var src = video.attr('src');

		if ( src.indexOf( 'vimeo.com' ) !== -1 ) {
			return true;
		}
	}

	return false;
};

VimeoVideo.prototype._init = function() {
	this.init = true;
	this._setup();
};

VimeoVideo.prototype._setup = function() {
	var that = this;

	// Get a reference to the player
	this.player = $f( this.$video[0] );
	
	this.player.addEvent( 'ready', function() {
		that.ready = true;
		that.trigger({ type: 'ready' });
		
		that.player.addEvent( 'play', function() {
			if ( that.started === false ) {
				that.started = true;
				that.trigger({ type: 'start' });
			}

			that.state = 'playing';
			that.trigger({ type: 'play' });
		});
		
		that.player.addEvent( 'pause', function() {
			that.state = 'paused';
			that.trigger({ type: 'pause' });
		});
		
		that.player.addEvent( 'finish', function() {
			that.state = 'ended';
			that.trigger({ type: 'ended' });
		});
	});
};

VimeoVideo.prototype.play = function() {
	var that = this;

	if ( this.ready === true ) {
		this.player.api( 'play' );
	} else {
		var timer = setInterval(function() {
			if ( that.ready === true ) {
				clearInterval( timer );
				that.player.api( 'play' );
			}
		}, 100 );
	}
};

VimeoVideo.prototype.pause = function() {
	this.player.api( 'pause' );
};

VimeoVideo.prototype.stop = function() {
	this.player.api( 'seekTo', 0 );
	this.player.api( 'pause' );
	this.state = 'stopped';
};

VimeoVideo.prototype.replay = function() {
	this.player.api( 'seekTo', 0 );
	this.player.api( 'play' );
};

VimeoVideo.prototype.on = function( type, callback ) {
	var that = this;

	if ( this.init === true ) {
		Video.prototype.on.call( this, type, callback );
	} else {
		var timer = setInterval(function() {
			if ( that.init === true ) {
				clearInterval( timer );
				Video.prototype.on.call( that, type, callback );
			}
		}, 100 );
	}
};

// HTML5 video
var HTML5Video = function( video ) {
	Video.call( this, video );
};

HTML5Video.prototype = new Video();
HTML5Video.prototype.constructor = HTML5Video;
$.VideoController.addPlayer( 'HTML5Video', HTML5Video );

HTML5Video.isType = function( video ) {
	if ( video.is( 'video' ) && video.hasClass( 'video-js' ) === false && video.hasClass( 'sublime' ) === false ) {
		return true;
	}

	return false;
};

HTML5Video.prototype._init = function() {
	var that = this;

	// Get a reference to the player
	this.player = this.$video[0];
	
	var checkVideoReady = setInterval(function() {
		if ( that.player.readyState === 4 ) {
			clearInterval( checkVideoReady );

			that.ready = true;
			that.trigger({ type: 'ready' });

			that.player.addEventListener( 'play', function() {
				if ( that.started === false ) {
					that.started = true;
					that.trigger({ type: 'start' });
				}

				that.state = 'playing';
				that.trigger({ type: 'play' });
			});
			
			that.player.addEventListener( 'pause', function() {
				that.state = 'paused';
				that.trigger({ type: 'pause' });
			});
			
			that.player.addEventListener( 'ended', function() {
				that.state = 'ended';
				that.trigger({ type: 'ended' });
			});
		}
	}, 100 );
};

HTML5Video.prototype.play = function() {
	var that = this;

	if ( this.ready === true ) {
		this.player.play();
	} else {
		var timer = setInterval(function() {
			if ( that.ready === true ) {
				clearInterval( timer );
				that.player.play();
			}
		}, 100 );
	}
};

HTML5Video.prototype.pause = function() {
	this.player.pause();
};

HTML5Video.prototype.stop = function() {
	this.player.currentTime = 0;
	this.player.pause();
	this.state = 'stopped';
};

HTML5Video.prototype.replay = function() {
	this.player.currentTime = 0;
	this.player.play();
};

// VideoJS video
var VideoJSVideo = function( video ) {
	Video.call( this, video );
};

VideoJSVideo.prototype = new Video();
VideoJSVideo.prototype.constructor = VideoJSVideo;
$.VideoController.addPlayer( 'VideoJSVideo', VideoJSVideo );

VideoJSVideo.isType = function( video ) {
	if ( ( typeof video.attr( 'data-videojs-id' ) !== 'undefined' || video.hasClass( 'video-js' ) ) && typeof videojs !== 'undefined' ) {
		return true;
	}

	return false;
};

VideoJSVideo.prototype._init = function() {
	var that = this,
		videoID = this.$video.hasClass( 'video-js' ) ? this.$video.attr( 'id' ) : this.$video.attr( 'data-videojs-id' );
	
	this.player = videojs( videoID );

	this.player.ready(function() {
		that.ready = true;
		that.trigger({ type: 'ready' });

		that.player.on( 'play', function() {
			if ( that.started === false ) {
				that.started = true;
				that.trigger({ type: 'start' });
			}

			that.state = 'playing';
			that.trigger({ type: 'play' });
		});
		
		that.player.on( 'pause', function() {
			that.state = 'paused';
			that.trigger({ type: 'pause' });
		});
		
		that.player.on( 'ended', function() {
			that.state = 'ended';
			that.trigger({ type: 'ended' });
		});
	});
};

VideoJSVideo.prototype.play = function() {
	this.player.play();
};

VideoJSVideo.prototype.pause = function() {
	this.player.pause();
};

VideoJSVideo.prototype.stop = function() {
	this.player.currentTime( 0 );
	this.player.pause();
	this.state = 'stopped';
};

VideoJSVideo.prototype.replay = function() {
	this.player.currentTime( 0 );
	this.player.play();
};

// Sublime video
var SublimeVideo = function( video ) {
	Video.call( this, video );
};

SublimeVideo.prototype = new Video();
SublimeVideo.prototype.constructor = SublimeVideo;
$.VideoController.addPlayer( 'SublimeVideo', SublimeVideo );

SublimeVideo.isType = function( video ) {
	if ( video.hasClass( 'sublime' ) && typeof sublime !== 'undefined' ) {
		return true;
	}

	return false;
};

SublimeVideo.prototype._init = function() {
	var that = this;

	sublime.ready(function() {
		// Get a reference to the player
		that.player = sublime.player( that.$video.attr( 'id' ) );

		that.ready = true;
		that.trigger({ type: 'ready' });

		that.player.on( 'play', function() {
			if ( that.started === false ) {
				that.started = true;
				that.trigger({ type: 'start' });
			}

			that.state = 'playing';
			that.trigger({ type: 'play' });
		});

		that.player.on( 'pause', function() {
			that.state = 'paused';
			that.trigger({ type: 'pause' });
		});

		that.player.on( 'stop', function() {
			that.state = 'stopped';
			that.trigger({ type: 'stop' });
		});

		that.player.on( 'end', function() {
			that.state = 'ended';
			that.trigger({ type: 'ended' });
		});
	});
};

SublimeVideo.prototype.play = function() {
	this.player.play();
};

SublimeVideo.prototype.pause = function() {
	this.player.pause();
};

SublimeVideo.prototype.stop = function() {
	this.player.stop();
};

SublimeVideo.prototype.replay = function() {
	this.player.stop();
	this.player.play();
};

// JWPlayer video
var JWPlayerVideo = function( video ) {
	Video.call( this, video );
};

JWPlayerVideo.prototype = new Video();
JWPlayerVideo.prototype.constructor = JWPlayerVideo;
$.VideoController.addPlayer( 'JWPlayerVideo', JWPlayerVideo );

JWPlayerVideo.isType = function( video ) {
	if ( ( typeof video.attr( 'data-jwplayer-id' ) !== 'undefined' || video.hasClass( 'jwplayer' ) || video.find( "object[data*='jwplayer']" ).length !== 0 ) &&
		typeof jwplayer !== 'undefined') {
		return true;
	}

	return false;
};

JWPlayerVideo.prototype._init = function() {
	var that = this,
		videoID;

	if ( this.$video.hasClass( 'jwplayer' ) ) {
		videoID = this.$video.attr( 'id' );
	} else if ( typeof this.$video.attr( 'data-jwplayer-id' ) !== 'undefined' ) {
		videoID = this.$video.attr( 'data-jwplayer-id');
	} else if ( this.$video.find( "object[data*='jwplayer']" ).length !== 0 ) {
		videoID = this.$video.find( 'object' ).attr( 'id' );
	}

	// Get a reference to the player
	this.player = jwplayer( videoID );

	this.player.onReady(function() {
		that.ready = true;
		that.trigger({ type: 'ready' });
	
		that.player.onPlay(function() {
			if ( that.started === false ) {
				that.started = true;
				that.trigger({ type: 'start' });
			}

			that.state = 'playing';
			that.trigger({ type: 'play' });
		});

		that.player.onPause(function() {
			that.state = 'paused';
			that.trigger({ type: 'pause' });
		});
		
		that.player.onComplete(function() {
			that.state = 'ended';
			that.trigger({ type: 'ended' });
		});
	});
};

JWPlayerVideo.prototype.play = function() {
	this.player.play( true );
};

JWPlayerVideo.prototype.pause = function() {
	this.player.pause( true );
};

JWPlayerVideo.prototype.stop = function() {
	this.player.stop();
	this.state = 'stopped';
};

JWPlayerVideo.prototype.replay = function() {
	this.player.seek( 0 );
	this.player.play( true );
};

})( jQuery );
// -----------------------------------
// Slidebars
// Version 0.10.3
// http://plugins.adchsm.me/slidebars/
//
// Written by Adam Smith
// http://www.adchsm.me/
//
// Released under MIT License
// http://plugins.adchsm.me/slidebars/license.txt
//
// ---------------------
// Index of Slidebars.js
//
// 001 - Default Settings
// 002 - Feature Detection
// 003 - User Agents
// 004 - Setup
// 005 - Animation
// 006 - Operations
// 007 - API
// 008 - User Input

;( function ( $ ) {

	$.slidebars = function ( options ) {

		// ----------------------
		// 001 - Default Settings

		var settings = $.extend( {
			siteClose: true, // true or false - Enable closing of Slidebars by clicking on #sb-site.
			scrollLock: false, // true or false - Prevent scrolling of site when a Slidebar is open.
			disableOver: false, // integer or false - Hide Slidebars over a specific width.
			hideControlClasses: false // true or false - Hide controls at same width as disableOver.
		}, options );

		// -----------------------
		// 002 - Feature Detection

		var test = document.createElement( 'div' ).style, // Create element to test on.
		supportTransition = false, // Variable for testing transitions.
		supportTransform = false; // variable for testing transforms.

		// Test for CSS Transitions
		if ( test.MozTransition === '' || test.WebkitTransition === '' || test.OTransition === '' || test.transition === '' ) supportTransition = true;

		// Test for CSS Transforms
		if ( test.MozTransform === '' || test.WebkitTransform === '' || test.OTransform === '' || test.transform === '' ) supportTransform = true;

		// -----------------
		// 003 - User Agents

		var ua = navigator.userAgent, // Get user agent string.
		android = false, // Variable for storing android version.
		iOS = false; // Variable for storing iOS version.
		
		if ( /Android/.test( ua ) ) { // Detect Android in user agent string.
			android = ua.substr( ua.indexOf( 'Android' )+8, 3 ); // Set version of Android.
		} else if ( /(iPhone|iPod|iPad)/.test( ua ) ) { // Detect iOS in user agent string.
			iOS = ua.substr( ua.indexOf( 'OS ' )+3, 3 ).replace( '_', '.' ); // Set version of iOS.
		}
		
		if ( android && android < 3 || iOS && iOS < 5 ) $( 'html' ).addClass( 'sb-static' ); // Add helper class for older versions of Android & iOS.

		// -----------
		// 004 - Setup

		// Site container
		var $site = $( '#sb-site, .sb-site-container' ); // Cache the selector.

		// Left Slidebar	
		if ( $( '.sb-left' ).length ) { // Check if the left Slidebar exists.
			var $left = $( '.sb-left' ), // Cache the selector.
			leftActive = false; // Used to check whether the left Slidebar is open or closed.
		}

		// Right Slidebar
		if ( $( '.sb-right' ).length ) { // Check if the right Slidebar exists.
			var $right = $( '.sb-right' ), // Cache the selector.
			rightActive = false; // Used to check whether the right Slidebar is open or closed.
		}
				
		var init = false, // Initialisation variable.
		windowWidth = $( window ).width(), // Get width of window.
		$controls = $( '.sb-toggle-left, .sb-toggle-right, .sb-open-left, .sb-open-right, .sb-close' ), // Cache the control classes.
		$slide = $( '.sb-slide' ); // Cache users elements to animate.
		
		// Initailise Slidebars
		function initialise () {
			if ( ! settings.disableOver || ( typeof settings.disableOver === 'number' && settings.disableOver >= windowWidth ) ) { // False or larger than window size. 
				init = true; // true enabled Slidebars to open.
				$( 'html' ).addClass( 'sb-init' ); // Add helper class.
				if ( settings.hideControlClasses ) $controls.removeClass( 'sb-hide' ); // Remove class just incase Slidebars was originally disabled.
				css(); // Set required inline styles.
			} else if ( typeof settings.disableOver === 'number' && settings.disableOver < windowWidth ) { // Less than window size.
				init = false; // false stop Slidebars from opening.
				$( 'html' ).removeClass( 'sb-init' ); // Remove helper class.
				if ( settings.hideControlClasses ) $controls.addClass( 'sb-hide' ); // Hide controls
				$site.css( 'minHeight', '' ); // Remove minimum height.
				if ( leftActive || rightActive ) close(); // Close Slidebars if open.
			}
		}
		initialise();
		
		// Inline CSS
		function css() {
			// Site container height.
			$site.css( 'minHeight', '' );
			var siteHeight = parseInt( $site.css( 'height' ), 10 ),
			htmlHeight = parseInt( $( 'html' ).css( 'height' ), 10 );
			if ( siteHeight < htmlHeight ) $site.css( 'minHeight', $( 'html' ).css( 'height' ) ); // Test height for vh support..
			
			// Custom Slidebar widths.
			if ( $left && $left.hasClass( 'sb-width-custom' ) ) $left.css( 'width', $left.attr( 'data-sb-width' ) ); // Set user custom width.
			if ( $right && $right.hasClass( 'sb-width-custom' ) ) $right.css( 'width', $right.attr( 'data-sb-width' ) ); // Set user custom width.
			
			// Set off-canvas margins for Slidebars with push and overlay animations.
			if ( $left && ( $left.hasClass( 'sb-style-push' ) || $left.hasClass( 'sb-style-overlay' ) ) ) $left.css( 'marginLeft', '-' + $left.css( 'width' ) );
			if ( $right && ( $right.hasClass( 'sb-style-push' ) || $right.hasClass( 'sb-style-overlay' ) ) ) $right.css( 'marginRight', '-' + $right.css( 'width' ) );
			
			// Site scroll locking.
			if ( settings.scrollLock ) $( 'html' ).addClass( 'sb-scroll-lock' );
		}
		
		// Resize Functions
		$( window ).resize( function () {
			var resizedWindowWidth = $( window ).width(); // Get resized window width.
			if ( windowWidth !== resizedWindowWidth ) { // Slidebars is running and window was actually resized.
				windowWidth = resizedWindowWidth; // Set the new window width.
				initialise(); // Call initalise to see if Slidebars should still be running.
				if ( leftActive ) open( 'left' ); // If left Slidebar is open, calling open will ensure it is the correct size.
				if ( rightActive ) open( 'right' ); // If right Slidebar is open, calling open will ensure it is the correct size.
			}
		} );
		// I may include a height check along side a width check here in future.

		// ---------------
		// 005 - Animation

		var animation; // Animation type.

		// Set animation type.
		if ( supportTransition && supportTransform ) { // Browser supports css transitions and transforms.
			animation = 'translate'; // Translate for browsers that support it.
			if ( android && android < 4.4 ) animation = 'side'; // Android supports both, but can't translate any fixed positions, so use left instead.
		} else {
			animation = 'jQuery'; // Browsers that don't support css transitions and transitions.
		}

		// Animate mixin.
		function animate( object, amount, side ) {
			
			// Choose selectors depending on animation style.
			var selector;
			
			if ( object.hasClass( 'sb-style-push' ) ) {
				selector = $site.add( object ).add( $slide ); // Push - Animate site, Slidebar and user elements.
			} else if ( object.hasClass( 'sb-style-overlay' ) ) {
				selector = object; // Overlay - Animate Slidebar only.
				$site.addClass('darken'); // Overlay - Add Darken to Sb-site
			} else {
				selector = $site.add( $slide ); // Reveal - Animate site and user elements.
			}
			
			// Apply animation
			if ( animation === 'translate' ) {
				if ( amount === '0px' ) {
					removeAnimation();
				} else {
					selector.css( 'transform', 'translate( ' + amount + ' )' ); // Apply the animation.
				}

			} else if ( animation === 'side' ) {
				if ( amount === '0px' ) {
					removeAnimation();
				} else {
					if ( amount[0] === '-' ) amount = amount.substr( 1 ); // Remove the '-' from the passed amount for side animations.
					selector.css( side, '0px' ); // Add a 0 value so css transition works.
					setTimeout( function () { // Set a timeout to allow the 0 value to be applied above.
						selector.css( side, amount ); // Apply the animation.
					}, 1 );
				}

			} else if ( animation === 'jQuery' ) {
				if ( amount[0] === '-' ) amount = amount.substr( 1 ); // Remove the '-' from the passed amount for jQuery animations.
				var properties = {};
				properties[side] = amount;
				selector.stop().animate( properties, 400 ); // Stop any current jQuery animation before starting another.
			}
			
			// Remove animation
			function removeAnimation () {
				selector.removeAttr( 'style' );
				$site.removeClass('darken');// Overlay - Remove Darken to Sb-site when menu is closed
				css();
			}
		}

		// ----------------
		// 006 - Operations

		// Open a Slidebar
		function open( side ) {
			// Check to see if opposite Slidebar is open.
			if ( side === 'left' && $left && rightActive || side === 'right' && $right && leftActive ) { // It's open, close it, then continue.
				close();
				setTimeout( proceed, 400 );
			} else { // Its not open, continue.
				proceed();
			}

			// Open
			function proceed() {
				if ( init && side === 'left' && $left ) { // Slidebars is initiated, left is in use and called to open.
					$( 'html' ).addClass( 'sb-active sb-active-left' ); // Add active classes.
					$left.addClass( 'sb-active' );
					animate( $left, $left.css( 'width' ), 'left' ); // Animation
					setTimeout( function () { leftActive = true; }, 400 ); // Set active variables.
				} else if ( init && side === 'right' && $right ) { // Slidebars is initiated, right is in use and called to open.
					$( 'html' ).addClass( 'sb-active sb-active-right' ); // Add active classes.
					$right.addClass( 'sb-active' );
					animate( $right, '-' + $right.css( 'width' ), 'right' ); // Animation
					setTimeout( function () { rightActive = true; }, 400 ); // Set active variables.
				}
			}
		}
			
		// Close either Slidebar
		function close( url, target ) {
			if ( leftActive || rightActive ) { // If a Slidebar is open.
				if ( leftActive ) {
					animate( $left, '0px', 'left' ); // Animation
					leftActive = false;
				}
				if ( rightActive ) {
					animate( $right, '0px', 'right' ); // Animation
					rightActive = false;
				}
			
				setTimeout( function () { // Wait for closing animation to finish.
					$( 'html' ).removeClass( 'sb-active sb-active-left sb-active-right' ); // Remove active classes.
					if ( $left ) $left.removeClass( 'sb-active' );
					if ( $right ) $right.removeClass( 'sb-active' );
					if ( typeof url !== 'undefined' ) { // If a link has been passed to the function, go to it.
						if ( typeof target === undefined ) target = '_self'; // Set to _self if undefined.
						window.open( url, target ); // Open the url.
					}
				}, 400 );
			}
		}
		
		// Toggle either Slidebar
		function toggle( side ) {
			if ( side === 'left' && $left ) { // If left Slidebar is called and in use.
				if ( ! leftActive ) {
					open( 'left' ); // Slidebar is closed, open it.
				} else {
					close(); // Slidebar is open, close it.
				}
			}
			if ( side === 'right' && $right ) { // If right Slidebar is called and in use.
				if ( ! rightActive ) {
					open( 'right' ); // Slidebar is closed, open it.
				} else {
					close(); // Slidebar is open, close it.
				}
			}
		}

		// ---------
		// 007 - API
		
		this.slidebars = {
			open: open, // Maps user variable name to the open method.
			close: close, // Maps user variable name to the close method.
			toggle: toggle, // Maps user variable name to the toggle method.
			init: function () { // Returns true or false whether Slidebars are running or not.
				return init; // Returns true or false whether Slidebars are running.
			},
			active: function ( side ) { // Returns true or false whether Slidebar is open or closed.
				if ( side === 'left' && $left ) return leftActive;
				if ( side === 'right' && $right ) return rightActive;
			},
			destroy: function ( side ) { // Removes the Slidebar from the DOM.
				if ( side === 'left' && $left ) {
					if ( leftActive ) close(); // Close if its open.
					setTimeout( function () {
						$left.remove(); // Remove it.
						$left = false; // Set variable to false so it cannot be opened again.
					}, 400 );
				}
				if ( side === 'right' && $right) {
					if ( rightActive ) close(); // Close if its open.
					setTimeout( function () {
						$right.remove(); // Remove it.
						$right = false; // Set variable to false so it cannot be opened again.
					}, 400 );
				}
			}
		};

		// ----------------
		// 008 - User Input
		
		function eventHandler( event, selector ) {
			event.stopPropagation(); // Stop event bubbling.
			event.preventDefault(); // Prevent default behaviour.
			if ( event.type === 'touchend' ) selector.off( 'click' ); // If event type was touch, turn off clicks to prevent phantom clicks.
		}
		
		// Toggle left Slidebar
		$( '.sb-toggle-left' ).on( 'touchend click', function ( event ) {
			eventHandler( event, $( this ) ); // Handle the event.
			toggle( 'left' ); // Toggle the left Slidbar.
		} );
		
		// Toggle right Slidebar
		$( '.sb-toggle-right' ).on( 'touchend click', function ( event ) {
			eventHandler( event, $( this ) ); // Handle the event.
			toggle( 'right' ); // Toggle the right Slidbar.
		} );
		
		// Open left Slidebar
		$( '.sb-open-left' ).on( 'touchend click', function ( event ) {
			eventHandler( event, $( this ) ); // Handle the event.
			open( 'left' ); // Open the left Slidebar.
		} );
		
		// Open right Slidebar
		$( '.sb-open-right' ).on( 'touchend click', function ( event ) {
			eventHandler( event, $( this ) ); // Handle the event.
			open( 'right' ); // Open the right Slidebar.
		} );
		
		// Close Slidebar
		$( '.sb-close' ).on( 'touchend click', function ( event ) {
			if ( $( this ).is( 'a' ) || $( this ).children().is( 'a' ) ) { // Is a link or contains a link.
				if ( event.type === 'click' ) { // Make sure the user wanted to follow the link.
					event.stopPropagation(); // Stop events propagating
					event.preventDefault(); // Stop default behaviour
					
					var link = ( $( this ).is( 'a' ) ? $( this ) : $( this ).find( 'a' ) ), // Get the link selector.
					url = link.attr( 'href' ), // Get the link url.
					target = ( link.attr( 'target' ) ? link.attr( 'target' ) : '_self' ); // Set target, default to _self if not provided
					
					close( url, target ); // Close Slidebar and pass link target.
				}
			} else { // Just a normal control class.
				eventHandler( event, $( this ) ); // Handle the event.
				close(); // Close Slidebar.
			}
		} );
		
		// Close Slidebar via site
		$site.on( 'touchend click', function ( event ) {
			if ( settings.siteClose && ( leftActive || rightActive ) ) { // If settings permit closing by site and left or right Slidebar is open.
				eventHandler( event, $( this ) ); // Handle the event.
				close(); // Close it.
			}
		} );
		
	}; // End Slidebars function.

} ) ( jQuery );
/**
 * A simple jQuery plugin for creating animated drilldown menus.
 *
 * @name jQuery Drilldown
 * @version 1.0.0
 * @requires jQuery v1.7+
 * @author Aleksandras Nelkinas
 * @license [MIT]{@link http://opensource.org/licenses/mit-license.php}
 *
 * Copyright (c) 2015 Aleksandras Nelkinas
 */

;(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node/CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function ($, undefined) {

  'use strict';

  var pluginName = 'mobilenav';
  var defaults = {
    event: 'click',
    selector: 'a',
    speed: 300,
    cssClass: {
      container: pluginName + '-container',
      root: pluginName + '-root',
      sub: pluginName + '-sub',
      back: pluginName + '-back'
    }
  };

  var Plugin = (function () {

    function Plugin(element, options) {
      var inst = this;

      this._name = pluginName;
      this._defaults = defaults;

      this.element = element;
      this.$element = $(element);

      this.options = $.extend({}, defaults, options);

      this._history = [];
      this._css = {
        float: 'left',
        width: null
      };

      this.$container = this.$element.find('.' + this.options.cssClass.container);

      this.$element.on(this.options.event + '.' + pluginName, this.options.selector, function (e) {
        handleAction.call(inst, e, $(this));
      });
    }

    Plugin.prototype = {

      /**
       * Destroys plugin instance.
       */
      destroy: function () {
        this.reset();

        this.$element.off(this.options.event + '.' + pluginName, this.options.selector);
      },

      /**
       * Resets drilldown to its initial state.
       */
      reset: function () {
        var $root;

        if (this._history.length) {
          $root = this._history[0];

          this.$container.empty().append($root);
          restoreState.call(this, $root);
        }

        this._history = [];
        this._css = {
          float: 'left',
          width: null
        };
      }

    };

    /**
     * Handles user action and decides whether or not and where to drill.
     *
     * @param {jQuery.Event} e
     * @param {jQuery}       $trigger
     * @private
     */
    function handleAction(e, $trigger) {
      var $next = $trigger.nextAll('.' + this.options.cssClass.sub);
      var preventDefault = true;

      if ($next.length) {
        down.call(this, $next);
      } else if ($trigger.closest('.' + this.options.cssClass.back).length) {
        up.call(this);
      } else {
        preventDefault = false;
      }

      if (preventDefault && $trigger.prop('tagName') === 'A') {
        e.preventDefault();
      }
    }

    /**
     * Drills down (deeper).
     *
     * @param {jQuery} $next
     * @private
     */
    function down($next) {
      if (!$next.length) {
        return;
      }

      this._css.width = this.$element.outerWidth();
      this.$container.width(this._css.width * 2);

      $next = $next.clone(true)
          .removeClass(this.options.cssClass.sub)
          .addClass(this.options.cssClass.root);

      this.$container.append($next);

      animateDrilling.call(this, -1 * this._css.width, function () {
        var $current = $next.prev();

        this._history.push($current.detach());

        restoreState.call(this, $next);
      }.bind(this));
    }

    /**
     * Drills up (back).
     *
     * @private
     */
    function up() {
      var $next = this._history.pop();

      this._css.width = this.$element.outerWidth();
      this.$container.width(this._css.width * 2);

      this.$container.prepend($next);

      animateDrilling.call(this, 0, function () {
        var $current = $next.next();

        $current.remove();

        restoreState.call(this, $next);
      }.bind(this));
    }

    /**
     * Animates drilling process.
     *
     * @param {Number}   marginLeft Target margin-left.
     * @param {Function} callback
     * @private
     */
    function animateDrilling(marginLeft, callback) {
      var $menus = this.$container.children('.' + this.options.cssClass.root);

      $menus.css(this._css);

      $menus.first().animate({
        marginLeft: marginLeft
      }, this.options.speed, callback);
    }

    /**
     * Restores initial menu's state.
     *
     * @param {jQuery} $menu
     * @private
     */
    function restoreState($menu) {
      $menu.css({
        float: '',
        width: '',
        marginLeft: ''
      });

      this.$container.css('width', '');
    }

    return Plugin;

  })();

  $.fn[pluginName] = function (options) {
    return this.each(function () {
      var inst = $.data(this, pluginName);
      var method = options;

      if (!inst) {
        $.data(this, pluginName, new Plugin(this, options));
      } else if (typeof method === 'string') {
        if (method === 'destroy') {
          $.removeData(this,  pluginName);
        }
        if (typeof inst[method] === 'function') {
          inst[method]();
        }
      }
    });
  };

}));

/*
 Sticky-kit v1.1.2 | WTFPL | Leaf Corcoran 2015 | http://leafo.net
*/
(function(){var b,f;b=this.jQuery||window.jQuery;f=b(window);b.fn.stick_in_parent=function(d){var A,w,J,n,B,K,p,q,k,E,t;null==d&&(d={});t=d.sticky_class;B=d.inner_scrolling;E=d.recalc_every;k=d.parent;q=d.offset_top;p=d.spacer;w=d.bottoming;null==q&&(q=0);null==k&&(k=void 0);null==B&&(B=!0);null==t&&(t="is_stuck");A=b(document);null==w&&(w=!0);J=function(a,d,n,C,F,u,r,G){var v,H,m,D,I,c,g,x,y,z,h,l;if(!a.data("sticky_kit")){a.data("sticky_kit",!0);I=A.height();g=a.parent();null!=k&&(g=g.closest(k));
if(!g.length)throw"failed to find stick parent";v=m=!1;(h=null!=p?p&&a.closest(p):b("<div />"))&&h.css("position",a.css("position"));x=function(){var c,f,e;if(!G&&(I=A.height(),c=parseInt(g.css("border-top-width"),10),f=parseInt(g.css("padding-top"),10),d=parseInt(g.css("padding-bottom"),10),n=g.offset().top+c+f,C=g.height(),m&&(v=m=!1,null==p&&(a.insertAfter(h),h.detach()),a.css({position:"",top:"",width:"",bottom:""}).removeClass(t),e=!0),F=a.offset().top-(parseInt(a.css("margin-top"),10)||0)-q,
u=a.outerHeight(!0),r=a.css("float"),h&&h.css({width:a.outerWidth(!0),height:u,display:a.css("display"),"vertical-align":a.css("vertical-align"),"float":r}),e))return l()};x();if(u!==C)return D=void 0,c=q,z=E,l=function(){var b,l,e,k;if(!G&&(e=!1,null!=z&&(--z,0>=z&&(z=E,x(),e=!0)),e||A.height()===I||x(),e=f.scrollTop(),null!=D&&(l=e-D),D=e,m?(w&&(k=e+u+c>C+n,v&&!k&&(v=!1,a.css({position:"fixed",bottom:"",top:c}).trigger("sticky_kit:unbottom"))),e<F&&(m=!1,c=q,null==p&&("left"!==r&&"right"!==r||a.insertAfter(h),
h.detach()),b={position:"",width:"",top:""},a.css(b).removeClass(t).trigger("sticky_kit:unstick")),B&&(b=f.height(),u+q>b&&!v&&(c-=l,c=Math.max(b-u,c),c=Math.min(q,c),m&&a.css({top:c+"px"})))):e>F&&(m=!0,b={position:"fixed",top:c},b.width="border-box"===a.css("box-sizing")?a.outerWidth()+"px":a.width()+"px",a.css(b).addClass(t),null==p&&(a.after(h),"left"!==r&&"right"!==r||h.append(a)),a.trigger("sticky_kit:stick")),m&&w&&(null==k&&(k=e+u+c>C+n),!v&&k)))return v=!0,"static"===g.css("position")&&g.css({position:"relative"}),
a.css({position:"absolute",bottom:d,top:"auto"}).trigger("sticky_kit:bottom")},y=function(){x();return l()},H=function(){G=!0;f.off("touchmove",l);f.off("scroll",l);f.off("resize",y);b(document.body).off("sticky_kit:recalc",y);a.off("sticky_kit:detach",H);a.removeData("sticky_kit");a.css({position:"",bottom:"",top:"",width:""});g.position("position","");if(m)return null==p&&("left"!==r&&"right"!==r||a.insertAfter(h),h.remove()),a.removeClass(t)},f.on("touchmove",l),f.on("scroll",l),f.on("resize",
y),b(document.body).on("sticky_kit:recalc",y),a.on("sticky_kit:detach",H),setTimeout(l,0)}};n=0;for(K=this.length;n<K;n++)d=this[n],J(b(d));return this}}).call(this);

/*! Copyright (c) 2011 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.0.6
 * 
 * Requires: 1.2.2+
 */

(function($) {

var types = ['DOMMouseScroll', 'mousewheel'];

if ($.event.fixHooks) {
    for ( var i=types.length; i; ) {
        $.event.fixHooks[ types[--i] ] = $.event.mouseHooks;
    }
}

$.event.special.mousewheel = {
    setup: function() {
        if ( this.addEventListener ) {
            for ( var i=types.length; i; ) {
                this.addEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = handler;
        }
    },
    
    teardown: function() {
        if ( this.removeEventListener ) {
            for ( var i=types.length; i; ) {
                this.removeEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = null;
        }
    }
};

$.fn.extend({
    mousewheel: function(fn) {
        return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
    },
    
    unmousewheel: function(fn) {
        return this.unbind("mousewheel", fn);
    }
});


function handler(event) {
    var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
    event = $.event.fix(orgEvent);
    event.type = "mousewheel";
    
    // Old school scrollwheel delta
    if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta/120; }
    if ( orgEvent.detail     ) { delta = -orgEvent.detail/3; }
    
    // New school multidimensional scroll (touchpads) deltas
    deltaY = delta;
    
    // Gecko
    if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
        deltaY = 0;
        deltaX = -1*delta;
    }
    
    // Webkit
    if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
    if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }
    
    // Add event and delta to the front of the arguments
    args.unshift(event, delta, deltaX, deltaY);
    
    return ($.event.dispatch || $.event.handle).apply(this, args);
}

})(jQuery);

/**
 * jQuery iLightBox - Revolutionary Lightbox Plugin
 * http://www.ilightbox.net/
 *
 * @version: 2.2.0 - September 23, 2014
 *
 * @author: Hemn Chawroka
 *          http://www.iprodev.com/
 *
 */
(function($, window, undefined) {

	var extensions = {
			flash: ['swf'],
			image: ['bmp', 'gif', 'jpeg', 'jpg', 'png', 'tiff', 'tif', 'jfif', 'jpe'],
			iframe: ['asp', 'aspx', 'cgi', 'cfm', 'htm', 'html', 'jsp', 'php', 'pl', 'php3', 'php4', 'php5', 'phtml', 'rb', 'rhtml', 'shtml', 'txt'],
			video: ['avi', 'mov', 'mpg', 'mpeg', 'movie', 'mp4', 'webm', 'ogv', 'ogg', '3gp', 'm4v']
		},

		// Global DOM elements
		$win = $(window),
		$doc = $(document),

		// Support indicators
		browser,
		transform,
		gpuAcceleration,
		fullScreenApi = '',
		supportTouch = !!('ontouchstart' in window) && (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)),

		// Events
		clickEvent = supportTouch ? "itap.iLightBox" : "click.iLightBox",
		touchStartEvent = supportTouch ? "touchstart.iLightBox" : "mousedown.iLightBox",
		touchStopEvent = supportTouch ? "touchend.iLightBox" : "mouseup.iLightBox",
		touchMoveEvent = supportTouch ? "touchmove.iLightBox" : "mousemove.iLightBox",

		// Math shorthands
		abs = Math.abs,
		sqrt = Math.sqrt,
		round = Math.round,
		max = Math.max,
		min = Math.min,
		floor = Math.floor,
		random = Math.random,

		pluginspages = {
			quicktime: 'http://www.apple.com/quicktime/download',
			flash: 'http://www.adobe.com/go/getflash'
		},

		iLightBox = function(el, options, items, instant) {
			var iL = this;

			iL.options = options,
				iL.selector = el.selector || el,
				iL.context = el.context,
				iL.instant = instant;

			if (items.length < 1) iL.attachItems();
			else iL.items = items;

			iL.vars = {
				total: iL.items.length,
				start: 0,
				current: null,
				next: null,
				prev: null,
				BODY: $('body'),
				loadRequests: 0,
				overlay: $('<div class="ilightbox-overlay"></div>'),
				loader: $('<div class="ilightbox-loader"><div></div></div>'),
				toolbar: $('<div class="ilightbox-toolbar"></div>'),
				innerToolbar: $('<div class="ilightbox-inner-toolbar"></div>'),
				title: $('<div class="ilightbox-title"></div>'),
				closeButton: $('<a class="ilightbox-close" title="' + iL.options.text.close + '"></a>'),
				fullScreenButton: $('<a class="ilightbox-fullscreen" title="' + iL.options.text.enterFullscreen + '"></a>'),
				innerPlayButton: $('<a class="ilightbox-play" title="' + iL.options.text.slideShow + '"></a>'),
				innerNextButton: $('<a class="ilightbox-next-button" title="' + iL.options.text.next + '"></a>'),
				innerPrevButton: $('<a class="ilightbox-prev-button" title="' + iL.options.text.previous + '"></a>'),
				holder: $('<div class="ilightbox-holder' + (supportTouch ? ' supportTouch' : '') + '" ondragstart="return false;"><div class="ilightbox-container"></div></div>'),
				nextPhoto: $('<div class="ilightbox-holder' + (supportTouch ? ' supportTouch' : '') + ' ilightbox-next" ondragstart="return false;"><div class="ilightbox-container"></div></div>'),
				prevPhoto: $('<div class="ilightbox-holder' + (supportTouch ? ' supportTouch' : '') + ' ilightbox-prev" ondragstart="return false;"><div class="ilightbox-container"></div></div>'),
				nextButton: $('<a class="ilightbox-button ilightbox-next-button" ondragstart="return false;" title="' + iL.options.text.next + '"><span></span></a>'),
				prevButton: $('<a class="ilightbox-button ilightbox-prev-button" ondragstart="return false;" title="' + iL.options.text.previous + '"><span></span></a>'),
				thumbnails: $('<div class="ilightbox-thumbnails" ondragstart="return false;"><div class="ilightbox-thumbnails-container"><a class="ilightbox-thumbnails-dragger"></a><div class="ilightbox-thumbnails-grid"></div></div></div>'),
				thumbs: false,
				nextLock: false,
				prevLock: false,
				hashLock: false,
				isMobile: false,
				mobileMaxWidth: 980,
				isInFullScreen: false,
				isSwipe: false,
				mouseID: 0,
				cycleID: 0,
				isPaused: 0
			};

			// Hideable elements with mousemove event
			iL.vars.hideableElements = iL.vars.nextButton.add(iL.vars.prevButton);

			iL.normalizeItems();

			//Check necessary plugins
			iL.availPlugins();

			//Set startFrom
			iL.options.startFrom = (iL.options.startFrom > 0 && iL.options.startFrom >= iL.vars.total) ? iL.vars.total - 1 : iL.options.startFrom;

			//If randomStart
			iL.options.startFrom = (iL.options.randomStart) ? floor(random() * iL.vars.total) : iL.options.startFrom;
			iL.vars.start = iL.options.startFrom;

			if (instant) iL.instantCall();
			else iL.patchItemsEvents();

			if (iL.options.linkId) {
				iL.hashChangeHandler();
				$win.iLightBoxHashChange(function() {
					iL.hashChangeHandler();
				});
			}

			if (supportTouch) {
				var RegExp = /(click|mouseenter|mouseleave|mouseover|mouseout)/ig,
					replace = "itap";
				iL.options.caption.show = iL.options.caption.show.replace(RegExp, replace),
					iL.options.caption.hide = iL.options.caption.hide.replace(RegExp, replace),
					iL.options.social.show = iL.options.social.show.replace(RegExp, replace),
					iL.options.social.hide = iL.options.social.hide.replace(RegExp, replace);
			}

			if (iL.options.controls.arrows) {
				$.extend(iL.options.styles, {
					nextOffsetX: 0,
					prevOffsetX: 0,
					nextOpacity: 0,
					prevOpacity: 0
				});
			}
		};

	//iLightBox helpers
	iLightBox.prototype = {
		showLoader: function() {
			var iL = this;
			iL.vars.loadRequests += 1;
			if (iL.options.path.toLowerCase() == "horizontal") iL.vars.loader.stop().animate({
				top: '-30px'
			}, iL.options.show.speed, 'easeOutCirc');
			else iL.vars.loader.stop().animate({
				left: '-30px'
			}, iL.options.show.speed, 'easeOutCirc');
		},

		hideLoader: function() {
			var iL = this;
			iL.vars.loadRequests -= 1;
			iL.vars.loadRequests = (iL.vars.loadRequests < 0) ? 0 : iL.vars.loadRequests;
			if (iL.options.path.toLowerCase() == "horizontal") {
				if (iL.vars.loadRequests <= 0) iL.vars.loader.stop().animate({
					top: '-192px'
				}, iL.options.show.speed, 'easeInCirc');
			} else {
				if (iL.vars.loadRequests <= 0) iL.vars.loader.stop().animate({
					left: '-192px'
				}, iL.options.show.speed, 'easeInCirc');
			}
		},

		createUI: function() {
			var iL = this;

			iL.ui = {
				currentElement: iL.vars.holder,
				nextElement: iL.vars.nextPhoto,
				prevElement: iL.vars.prevPhoto,
				currentItem: iL.vars.current,
				nextItem: iL.vars.next,
				prevItem: iL.vars.prev,
				hide: function() {
					iL.closeAction();
				},
				refresh: function() {
					(arguments.length > 0) ? iL.repositionPhoto(true): iL.repositionPhoto();
				},
				fullscreen: function() {
					iL.fullScreenAction();
				}
			};
		},

		attachItems: function() {
			var iL = this,
				itemsObject = new Array(),
				items = new Array();

			$(iL.selector, iL.context).each(function() {
				var t = $(this),
					URL = t.attr(iL.options.attr) || null,
					options = t.data("options") && eval("({" + t.data("options") + "})") || {},
					caption = t.data('caption'),
					title = t.data('title'),
					type = t.data('type') || getTypeByExtension(URL);

				items.push({
					URL: URL,
					caption: caption,
					title: title,
					type: type,
					options: options
				});

				if (!iL.instant) itemsObject.push(t);
			});

			iL.items = items,
				iL.itemsObject = itemsObject;
		},

		normalizeItems: function() {
			var iL = this,
				newItems = new Array();

			$.each(iL.items, function(key, val) {

				if (typeof val == "string") val = {
					url: val
				};

				var URL = val.url || val.URL || null,
					options = val.options || {},
					caption = val.caption || null,
					title = val.title || null,
					type = (val.type) ? val.type.toLowerCase() : getTypeByExtension(URL),
					ext = (typeof URL != 'object') ? getExtension(URL) : '';

				options.thumbnail = options.thumbnail || ((type == "image") ? URL : null),
				options.videoType = options.videoType || null,
				options.skin = options.skin || iL.options.skin,
				options.width = options.width || null,
				options.height = options.height || null,
				options.mousewheel = (typeof options.mousewheel != 'undefined') ? options.mousewheel : true,
				options.swipe = (typeof options.swipe != 'undefined') ? options.swipe : true,
				options.social = (typeof options.social != 'undefined') ? options.social : iL.options.social.buttons && $.extend({}, {}, iL.options.social.buttons);

				if (type == "video") {
					options.html5video = (typeof options.html5video != 'undefined') ? options.html5video : {};

					options.html5video.webm = options.html5video.webm || options.html5video.WEBM || null;
					options.html5video.controls = (typeof options.html5video.controls != 'undefined') ? options.html5video.controls : "controls";
					options.html5video.preload = options.html5video.preload || "metadata";
					options.html5video.autoplay = (typeof options.html5video.autoplay != 'undefined') ? options.html5video.autoplay : false;
				}

				if (!options.width || !options.height) {
					if (type == "video") options.width = 1280, options.height = 720;
					else if (type == "iframe") options.width = '100%', options.height = '90%';
					else if (type == "flash") options.width = 1280, options.height = 720;
				}

				delete val.url;
				val.index = key;
				val.URL = URL;
				val.caption = caption;
				val.title = title;
				val.type = type;
				val.options = options;
				val.ext = ext;

				newItems.push(val);
			});

			iL.items = newItems;
		},

		instantCall: function() {
			var iL = this,
				key = iL.vars.start;

			iL.vars.current = key;
			iL.vars.next = (iL.items[key + 1]) ? key + 1 : null;
			iL.vars.prev = (iL.items[key - 1]) ? key - 1 : null;

			iL.addContents();
			iL.patchEvents();
		},

		addContents: function() {
			var iL = this,
				vars = iL.vars,
				opts = iL.options,
				viewport = getViewport(),
				path = opts.path.toLowerCase(),
				recognizingItems = vars.total > 0 && iL.items.filter(function(e, i, arr) {
					return ['image', 'flash', 'video'].indexOf(e.type) === -1 && typeof e.recognized === 'undefined' && (opts.smartRecognition || e.options.smartRecognition);
				}),
				needRecognition = recognizingItems.length > 0;

			if (opts.mobileOptimizer && !opts.innerToolbar)
				vars.isMobile = viewport.width <= vars.mobileMaxWidth;

			vars.overlay.addClass(opts.skin).hide().css('opacity', opts.overlay.opacity);

			if (opts.linkId)
				vars.overlay[0].setAttribute('linkid', opts.linkId);

			//Add Toolbar Buttons
			if (opts.controls.toolbar) {
				vars.toolbar.addClass(opts.skin).append(vars.closeButton);
				if (opts.controls.fullscreen)
					vars.toolbar.append(vars.fullScreenButton);
				if (opts.controls.slideshow)
					vars.toolbar.append(vars.innerPlayButton);
				if (vars.total > 1)
					vars.toolbar.append(vars.innerPrevButton).append(vars.innerNextButton);
			}

			//Append elements to body
			vars.BODY.addClass('ilightbox-noscroll').append(vars.overlay).append(vars.loader).append(vars.holder).append(vars.nextPhoto).append(vars.prevPhoto);

			if (!opts.innerToolbar)
				vars.BODY.append(vars.toolbar);
			if (opts.controls.arrows)
				vars.BODY.append(vars.nextButton).append(vars.prevButton);

			if (opts.controls.thumbnail && vars.total > 1) {
				vars.BODY.append(vars.thumbnails);
				vars.thumbnails.addClass(opts.skin).addClass('ilightbox-' + path);
				$('div.ilightbox-thumbnails-grid', vars.thumbnails).empty();
				vars.thumbs = true;
			}

			//Configure loader and arrows
			var loaderCss = (opts.path.toLowerCase() == "horizontal") ? {
				left: parseInt((viewport.width / 2) - (vars.loader.outerWidth() / 2))
			} : {
				top: parseInt((viewport.height / 2) - (vars.loader.outerHeight() / 2))
			};
			vars.loader.addClass(opts.skin).css(loaderCss);
			vars.nextButton.add(vars.prevButton).addClass(opts.skin);
			if (path == "horizontal")
				vars.loader.add(vars.nextButton).add(vars.prevButton).addClass('horizontal');

			// Configure arrow buttons
			vars.BODY[vars.isMobile ? 'addClass' : 'removeClass']('isMobile');

			if (!opts.infinite) {
				vars.prevButton.add(vars.prevButton).add(vars.innerPrevButton).add(vars.innerNextButton).removeClass('disabled');

				if (vars.current == 0)
					vars.prevButton.add(vars.innerPrevButton).addClass('disabled');
				if (vars.current >= vars.total - 1)
					vars.nextButton.add(vars.innerNextButton).addClass('disabled');
			}

			if (opts.show.effect) {
				vars.overlay.stop().fadeIn(opts.show.speed);
				vars.toolbar.stop().fadeIn(opts.show.speed);
			} else {
				vars.overlay.show();
				vars.toolbar.show();
			}

			var length = recognizingItems.length;
			if (needRecognition) {
				iL.showLoader();

				$.each(recognizingItems, function(key, val) {
					var resultFnc = function(result) {
							var key = -1,
								filter = iL.items.filter(function(e, i, arr) {
									if (e.URL == result.url)
										key = i;

									return e.URL == result.url;
								}),
								self = iL.items[key];

							if (result)
								$.extend(true, self, {
									URL: result.source,
									type: result.type,
									recognized: true,
									options: {
										html5video: result.html5video,
										width: (result.type == "image") ? 0 : (result.width || self.width),
										height: (result.type == "image") ? 0 : (result.height || self.height),
										thumbnail: self.options.thumbnail || result.thumbnail
									}
								});

							length--;

							if (length == 0) {
								iL.hideLoader();

								vars.dontGenerateThumbs = false;
								iL.generateThumbnails();

								if (opts.show.effect)
									setTimeout(function() {
										iL.generateBoxes();
									}, opts.show.speed);
								else
									iL.generateBoxes();
							}
						};

					iL.ogpRecognition(this, resultFnc);
				});
			}
			else {
				if (opts.show.effect)
					setTimeout(function() {
						iL.generateBoxes();
					}, opts.show.speed);
				else
					iL.generateBoxes();
			}

			iL.createUI();

			window.iLightBox = {
				close: function() {
					iL.closeAction();
				},
				fullscreen: function() {
					iL.fullScreenAction();
				},
				moveNext: function() {
					iL.moveTo('next');
				},
				movePrev: function() {
					iL.moveTo('prev');
				},
				goTo: function(index) {
					iL.goTo(index);
				},
				refresh: function() {
					iL.refresh();
				},
				reposition: function() {
					(arguments.length > 0) ? iL.repositionPhoto(true): iL.repositionPhoto();
				},
				setOption: function(options) {
					iL.setOption(options);
				},
				destroy: function() {
					iL.closeAction();
					iL.dispatchItemsEvents();
				}
			};

			if (opts.linkId) {
				vars.hashLock = true;
				window.location.hash = opts.linkId + '/' + vars.current;
				setTimeout(function() {
					vars.hashLock = false;
				}, 55);
			}

			if (!opts.slideshow.startPaused) {
				iL.resume();
				vars.innerPlayButton.removeClass('ilightbox-play').addClass('ilightbox-pause');
			}

			//Trigger the onOpen callback
			if (typeof iL.options.callback.onOpen == 'function') iL.options.callback.onOpen.call(iL);
		},

		loadContent: function(obj, opt, speed) {
			var iL = this,
				holder, item;

			iL.createUI();

			obj.speed = speed || iL.options.effects.loadedFadeSpeed;

			if (opt == 'current') {
				if (!obj.options.mousewheel) iL.vars.lockWheel = true;
				else iL.vars.lockWheel = false;

				if (!obj.options.swipe) iL.vars.lockSwipe = true;
				else iL.vars.lockSwipe = false;
			}

			switch (opt) {
				case 'current':
					holder = iL.vars.holder, item = iL.vars.current;
					break;
				case 'next':
					holder = iL.vars.nextPhoto, item = iL.vars.next;
					break;
				case 'prev':
					holder = iL.vars.prevPhoto, item = iL.vars.prev;
					break;
			}

			holder.removeAttr('style class').addClass('ilightbox-holder' + (supportTouch ? ' supportTouch' : '')).addClass(obj.options.skin);
			$('div.ilightbox-inner-toolbar', holder).remove();

			if (obj.title || iL.options.innerToolbar) {
				var innerToolbar = iL.vars.innerToolbar.clone();
				if (obj.title && iL.options.show.title) {
					var title = iL.vars.title.clone();
					title.empty().html(obj.title);
					innerToolbar.append(title);
				}
				if (iL.options.innerToolbar) {
					innerToolbar.append((iL.vars.total > 1) ? iL.vars.toolbar.clone() : iL.vars.toolbar);
				}
				holder.prepend(innerToolbar);
			}

			iL.loadSwitcher(obj, holder, item, opt);
		},

		loadSwitcher: function(obj, holder, item, opt) {
			var iL = this,
				opts = iL.options,
				api = {
					element: holder,
					position: item
				};

			switch (obj.type) {
				case 'image':
					//Trigger the onBeforeLoad callback
					if (typeof opts.callback.onBeforeLoad == 'function') opts.callback.onBeforeLoad.call(iL, iL.ui, item);
					if (typeof obj.options.onBeforeLoad == 'function') obj.options.onBeforeLoad.call(iL, api);

					iL.loadImage(obj.URL, function(img) {
						//Trigger the onAfterLoad callback
						if (typeof opts.callback.onAfterLoad == 'function') opts.callback.onAfterLoad.call(iL, iL.ui, item);
						if (typeof obj.options.onAfterLoad == 'function') obj.options.onAfterLoad.call(iL, api);

						var width = (img) ? img.width : 400,
							height = (img) ? img.height : 200;

						holder.data({
							naturalWidth: width,
							naturalHeight: height
						});
						$('div.ilightbox-container', holder).empty().append((img) ? '<img src="' + obj.URL + '" class="ilightbox-image" />' : '<span class="ilightbox-alert">' + opts.errors.loadImage + '</span>');

						//Trigger the onRender callback
						if (typeof opts.callback.onRender == 'function') opts.callback.onRender.call(iL, iL.ui, item);
						if (typeof obj.options.onRender == 'function') obj.options.onRender.call(iL, api);

						iL.configureHolder(obj, opt, holder);
					});

					break;

				case 'video':
					holder.data({
						naturalWidth: obj.options.width,
						naturalHeight: obj.options.height
					});

					iL.addContent(holder, obj);

					//Trigger the onRender callback
					if (typeof opts.callback.onRender == 'function') opts.callback.onRender.call(iL, iL.ui, item);
					if (typeof obj.options.onRender == 'function') obj.options.onRender.call(iL, api);

					iL.configureHolder(obj, opt, holder);

					break;

				case 'iframe':
					iL.showLoader();
					holder.data({
						naturalWidth: obj.options.width,
						naturalHeight: obj.options.height
					});
					var el = iL.addContent(holder, obj);

					//Trigger the onRender callback
					if (typeof opts.callback.onRender == 'function') opts.callback.onRender.call(iL, iL.ui, item);
					if (typeof obj.options.onRender == 'function') obj.options.onRender.call(iL, api);

					//Trigger the onBeforeLoad callback
					if (typeof opts.callback.onBeforeLoad == 'function') opts.callback.onBeforeLoad.call(iL, iL.ui, item);
					if (typeof obj.options.onBeforeLoad == 'function') obj.options.onBeforeLoad.call(iL, api);

					el.bind('load', function() {
						//Trigger the onAfterLoad callback
						if (typeof opts.callback.onAfterLoad == 'function') opts.callback.onAfterLoad.call(iL, iL.ui, item);
						if (typeof obj.options.onAfterLoad == 'function') obj.options.onAfterLoad.call(iL, api);

						iL.hideLoader();
						iL.configureHolder(obj, opt, holder);
						el.unbind('load');
					});

					break;

				case 'inline':
					var el = $(obj.URL),
						content = iL.addContent(holder, obj),
						images = findImageInElement(holder);

					holder.data({
						naturalWidth: (iL.items[item].options.width || el.outerWidth()),
						naturalHeight: (iL.items[item].options.height || el.outerHeight())
					});
					content.children().eq(0).show();

					//Trigger the onRender callback
					if (typeof opts.callback.onRender == 'function') opts.callback.onRender.call(iL, iL.ui, item);
					if (typeof obj.options.onRender == 'function') obj.options.onRender.call(iL, api);

					//Trigger the onBeforeLoad callback
					if (typeof opts.callback.onBeforeLoad == 'function') opts.callback.onBeforeLoad.call(iL, iL.ui, item);
					if (typeof obj.options.onBeforeLoad == 'function') obj.options.onBeforeLoad.call(iL, api);

					iL.loadImage(images, function() {
						//Trigger the onAfterLoad callback
						if (typeof opts.callback.onAfterLoad == 'function') opts.callback.onAfterLoad.call(iL, iL.ui, item);
						if (typeof obj.options.onAfterLoad == 'function') obj.options.onAfterLoad.call(iL, api);

						iL.configureHolder(obj, opt, holder);
					});

					break;

				case 'flash':
					var el = iL.addContent(holder, obj);

					holder.data({
						naturalWidth: (iL.items[item].options.width || el.outerWidth()),
						naturalHeight: (iL.items[item].options.height || el.outerHeight())
					});

					//Trigger the onRender callback
					if (typeof opts.callback.onRender == 'function') opts.callback.onRender.call(iL, iL.ui, item);
					if (typeof obj.options.onRender == 'function') obj.options.onRender.call(iL, api);

					iL.configureHolder(obj, opt, holder);

					break;

				case 'ajax':
					var ajax = obj.options.ajax || {};
					//Trigger the onBeforeLoad callback
					if (typeof opts.callback.onBeforeLoad == 'function') opts.callback.onBeforeLoad.call(iL, iL.ui, item);
					if (typeof obj.options.onBeforeLoad == 'function') obj.options.onBeforeLoad.call(iL, api);

					iL.showLoader();
					$.ajax({
						url: obj.URL || opts.ajaxSetup.url,
						data: ajax.data || null,
						dataType: ajax.dataType || "html",
						type: ajax.type || opts.ajaxSetup.type,
						cache: ajax.cache || opts.ajaxSetup.cache,
						crossDomain: ajax.crossDomain || opts.ajaxSetup.crossDomain,
						global: ajax.global || opts.ajaxSetup.global,
						ifModified: ajax.ifModified || opts.ajaxSetup.ifModified,
						username: ajax.username || opts.ajaxSetup.username,
						password: ajax.password || opts.ajaxSetup.password,
						beforeSend: ajax.beforeSend || opts.ajaxSetup.beforeSend,
						complete: ajax.complete || opts.ajaxSetup.complete,
						success: function(data, textStatus, jqXHR) {
							iL.hideLoader();

							var el = $(data),
								container = $('div.ilightbox-container', holder),
								elWidth = iL.items[item].options.width || parseInt(el[0].getAttribute('width')),
								elHeight = iL.items[item].options.height || parseInt(el[0].getAttribute('height')),
								css = (el[0].getAttribute('width') && el[0].getAttribute('height')) ? {
									'overflow': 'hidden'
								} : {};

							container.empty().append($('<div class="ilightbox-wrapper"></div>').css(css).html(el));
							holder.show().data({
								naturalWidth: (elWidth || container.outerWidth()),
								naturalHeight: (elHeight || container.outerHeight())
							}).hide();

							//Trigger the onRender callback
							if (typeof opts.callback.onRender == 'function') opts.callback.onRender.call(iL, iL.ui, item);
							if (typeof obj.options.onRender == 'function') obj.options.onRender.call(iL, api);

							var images = findImageInElement(holder);
							iL.loadImage(images, function() {
								//Trigger the onAfterLoad callback
								if (typeof opts.callback.onAfterLoad == 'function') opts.callback.onAfterLoad.call(iL, iL.ui, item);
								if (typeof obj.options.onAfterLoad == 'function') obj.options.onAfterLoad.call(iL, api);

								iL.configureHolder(obj, opt, holder);
							});

							opts.ajaxSetup.success(data, textStatus, jqXHR);
							if (typeof ajax.success == 'function') ajax.success(data, textStatus, jqXHR);
						},
						error: function(jqXHR, textStatus, errorThrown) {
							//Trigger the onAfterLoad callback
							if (typeof opts.callback.onAfterLoad == 'function') opts.callback.onAfterLoad.call(iL, iL.ui, item);
							if (typeof obj.options.onAfterLoad == 'function') obj.options.onAfterLoad.call(iL, api);

							iL.hideLoader();
							$('div.ilightbox-container', holder).empty().append('<span class="ilightbox-alert">' + opts.errors.loadContents + '</span>');
							iL.configureHolder(obj, opt, holder);

							opts.ajaxSetup.error(jqXHR, textStatus, errorThrown);
							if (typeof ajax.error == 'function') ajax.error(jqXHR, textStatus, errorThrown);
						}
					});

					break;

				case 'html':
					var object = obj.URL,
						el
					container = $('div.ilightbox-container', holder);

					if (object[0].nodeName) el = object.clone();
					else {
						var dom = $(object);
						if (dom.selector) el = $('<div>' + dom + '</div>');
						else el = dom;
					}

					var elWidth = iL.items[item].options.width || parseInt(el.attr('width')),
						elHeight = iL.items[item].options.height || parseInt(el.attr('height'));

					iL.addContent(holder, obj);

					el.appendTo(document.documentElement).hide();

					//Trigger the onRender callback
					if (typeof opts.callback.onRender == 'function') opts.callback.onRender.call(iL, iL.ui, item);
					if (typeof obj.options.onRender == 'function') obj.options.onRender.call(iL, api);

					var images = findImageInElement(holder);

					//Trigger the onBeforeLoad callback
					if (typeof opts.callback.onBeforeLoad == 'function') opts.callback.onBeforeLoad.call(iL, iL.ui, item);
					if (typeof obj.options.onBeforeLoad == 'function') obj.options.onBeforeLoad.call(iL, api);

					iL.loadImage(images, function() {
						//Trigger the onAfterLoad callback
						if (typeof opts.callback.onAfterLoad == 'function') opts.callback.onAfterLoad.call(iL, iL.ui, item);
						if (typeof obj.options.onAfterLoad == 'function') obj.options.onAfterLoad.call(iL, api);

						holder.show().data({
							naturalWidth: (elWidth || container.outerWidth()),
							naturalHeight: (elHeight || container.outerHeight())
						}).hide();
						el.remove();

						iL.configureHolder(obj, opt, holder);
					});

					break;
			}
		},

		configureHolder: function(obj, opt, holder) {
			var iL = this,
				vars = iL.vars,
				opts = iL.options;

			if (opt != "current")(opt == "next") ? holder.addClass('ilightbox-next') : holder.addClass('ilightbox-prev');

			if (opt == "current")
				var item = vars.current;
			else if (opt == "next")
				var opacity = opts.styles.nextOpacity,
					item = vars.next;
			else
				var opacity = opts.styles.prevOpacity,
					item = vars.prev;

			var api = {
				element: holder,
				position: item
			};

			iL.items[item].options.width = iL.items[item].options.width || 0,
				iL.items[item].options.height = iL.items[item].options.height || 0;

			if (opt == "current") {
				if (opts.show.effect) holder.css(transform, gpuAcceleration).fadeIn(obj.speed, function() {
					holder.css(transform, '');
					if (obj.caption) {
						iL.setCaption(obj, holder);
						var caption = $('div.ilightbox-caption', holder),
							percent = parseInt((caption.outerHeight() / holder.outerHeight()) * 100);
						if (opts.caption.start & percent <= 50) caption.fadeIn(opts.effects.fadeSpeed);
					}

					var social = obj.options.social;
					if (social) {
						iL.setSocial(social, obj.URL, holder);
						if (opts.social.start) $('div.ilightbox-social', holder).fadeIn(opts.effects.fadeSpeed);
					}

					//Generate thumbnails
					iL.generateThumbnails();

					//Trigger the onShow callback
					if (typeof opts.callback.onShow == 'function') opts.callback.onShow.call(iL, iL.ui, item);
					if (typeof obj.options.onShow == 'function') obj.options.onShow.call(iL, api);
				});
				else {
					holder.show();

					//Generate thumbnails
					iL.generateThumbnails();

					//Trigger the onShow callback
					if (typeof opts.callback.onShow == 'function') opts.callback.onShow.call(iL, iL.ui, item);
					if (typeof obj.options.onShow == 'function') obj.options.onShow.call(iL, api);
				}
			} else {
				if (opts.show.effect) holder.fadeTo(obj.speed, opacity, function() {
					if (opt == "next") vars.nextLock = false;
					else vars.prevLock = false;

					//Generate thumbnails
					iL.generateThumbnails();

					//Trigger the onShow callback
					if (typeof opts.callback.onShow == 'function') opts.callback.onShow.call(iL, iL.ui, item);
					if (typeof obj.options.onShow == 'function') obj.options.onShow.call(iL, api);
				});
				else {
					holder.css({
						opacity: opacity
					}).show();
					if (opt == "next") vars.nextLock = false;
					else vars.prevLock = false;

					//Generate thumbnails
					iL.generateThumbnails();

					//Trigger the onShow callback
					if (typeof opts.callback.onShow == 'function') opts.callback.onShow.call(iL, iL.ui, item);
					if (typeof obj.options.onShow == 'function') obj.options.onShow.call(iL, api);
				}
			}

			setTimeout(function() {
				iL.repositionPhoto();
			}, 0);
		},

		generateBoxes: function() {
			var iL = this,
				vars = iL.vars,
				opts = iL.options;

			if (opts.infinite && vars.total >= 3) {
				if (vars.current == vars.total - 1) vars.next = 0;
				if (vars.current == 0) vars.prev = vars.total - 1;
			} else opts.infinite = false;

			iL.loadContent(iL.items[vars.current], 'current', opts.show.speed);

			if (iL.items[vars.next]) iL.loadContent(iL.items[vars.next], 'next', opts.show.speed);
			if (iL.items[vars.prev]) iL.loadContent(iL.items[vars.prev], 'prev', opts.show.speed);
		},

		generateThumbnails: function() {
			var iL = this,
				vars = iL.vars,
				opts = iL.options,
				timeOut = null;

			if (vars.thumbs && !iL.vars.dontGenerateThumbs) {
				var thumbnails = vars.thumbnails,
					container = $('div.ilightbox-thumbnails-container', thumbnails),
					grid = $('div.ilightbox-thumbnails-grid', container),
					i = 0;

				grid.removeAttr('style').empty();

				$.each(iL.items, function(key, val) {
					var isActive = (vars.current == key) ? 'ilightbox-active' : '',
						opacity = (vars.current == key) ? opts.thumbnails.activeOpacity : opts.thumbnails.normalOpacity,
						thumb = val.options.thumbnail,
						thumbnail = $('<div class="ilightbox-thumbnail"></div>'),
						icon = $('<div class="ilightbox-thumbnail-icon"></div>');

					thumbnail.css({
						opacity: 0
					}).addClass(isActive);

					if ((val.type == "video" || val.type == "flash") && typeof val.options.icon == 'undefined') {
						icon.addClass('ilightbox-thumbnail-video');
						thumbnail.append(icon);
					} else if (val.options.icon) {
						icon.addClass('ilightbox-thumbnail-' + val.options.icon);
						thumbnail.append(icon);
					}

					if (thumb) iL.loadImage(thumb, function(img) {
						i++;
						if (img) thumbnail.data({
							naturalWidth: img.width,
							naturalHeight: img.height
						}).append('<img src="' + thumb + '" border="0" />');
						else thumbnail.data({
							naturalWidth: opts.thumbnails.maxWidth,
							naturalHeight: opts.thumbnails.maxHeight
						});

						clearTimeout(timeOut);
						timeOut = setTimeout(function() {
							iL.positionThumbnails(thumbnails, container, grid);
						}, 20);
						setTimeout(function() {
							thumbnail.fadeTo(opts.effects.loadedFadeSpeed, opacity);
						}, i * 20);
					});

					grid.append(thumbnail);
				});
				iL.vars.dontGenerateThumbs = true;
			}
		},

		positionThumbnails: function(thumbnails, container, grid) {
			var iL = this,
				vars = iL.vars,
				opts = iL.options,
				viewport = getViewport(),
				path = opts.path.toLowerCase();

			if (!thumbnails) thumbnails = vars.thumbnails;
			if (!container) container = $('div.ilightbox-thumbnails-container', thumbnails);
			if (!grid) grid = $('div.ilightbox-thumbnails-grid', container);

			var thumbs = $('.ilightbox-thumbnail', grid),
				widthAvail = (path == 'horizontal') ? viewport.width - opts.styles.pageOffsetX : thumbs.eq(0).outerWidth() - opts.styles.pageOffsetX,
				heightAvail = (path == 'horizontal') ? thumbs.eq(0).outerHeight() - opts.styles.pageOffsetY : viewport.height - opts.styles.pageOffsetY,
				gridWidth = (path == 'horizontal') ? 0 : widthAvail,
				gridHeight = (path == 'horizontal') ? heightAvail : 0,
				active = $('.ilightbox-active', grid),
				gridCss = {},
				css = {};

			if (arguments.length < 3) {
				thumbs.css({
					opacity: opts.thumbnails.normalOpacity
				});
				active.css({
					opacity: opts.thumbnails.activeOpacity
				});
			}

			thumbs.each(function(i) {
				var t = $(this),
					data = t.data(),
					width = (path == 'horizontal') ? 0 : opts.thumbnails.maxWidth;
				height = (path == 'horizontal') ? opts.thumbnails.maxHeight : 0;
				dims = iL.getNewDimenstions(width, height, data.naturalWidth, data.naturalHeight, true);

				t.css({
					width: dims.width,
					height: dims.height
				});
				if (path == 'horizontal') t.css({
					'float': 'left'
				});

				(path == 'horizontal') ? (
					gridWidth += t.outerWidth()
				) : (
					gridHeight += t.outerHeight()
				);
			});

			gridCss = {
				width: gridWidth,
				height: gridHeight
			};

			grid.css(gridCss);

			gridCss = {};

			var gridOffset = grid.offset(),
				activeOffset = (active.length) ? active.offset() : {
					top: parseInt(heightAvail / 2),
					left: parseInt(widthAvail / 2)
				};

			gridOffset.top = (gridOffset.top - $doc.scrollTop()),
				gridOffset.left = (gridOffset.left - $doc.scrollLeft()),
				activeOffset.top = (activeOffset.top - gridOffset.top - $doc.scrollTop()),
				activeOffset.left = (activeOffset.left - gridOffset.left - $doc.scrollLeft());

			(path == 'horizontal') ? (
				gridCss.top = 0,
				gridCss.left = parseInt((widthAvail / 2) - activeOffset.left - (active.outerWidth() / 2))
			) : (
				gridCss.top = parseInt(((heightAvail / 2) - activeOffset.top - (active.outerHeight() / 2))),
				gridCss.left = 0
			);

			if (arguments.length < 3) grid.stop().animate(gridCss, opts.effects.repositionSpeed, 'easeOutCirc');
			else grid.css(gridCss);
		},

		loadImage: function(image, callback) {
			if (!$.isArray(image)) image = [image];

			var iL = this,
				length = image.length;

			if (length > 0) {
				iL.showLoader();
				$.each(image, function(index, value) {
					var img = new Image();
					img.onload = function() {
						length -= 1;
						if (length == 0) {
							iL.hideLoader();
							callback(img);
						}
					};
					img.onerror = img.onabort = function() {
						length -= 1;
						if (length == 0) {
							iL.hideLoader();
							callback(false);
						}
					};
					img.src = image[index];
				});
			} else callback(false);
		},

		patchItemsEvents: function() {
			var iL = this,
				vars = iL.vars,
				clickEvent = supportTouch ? "itap.iL" : "click.iL",
				vEvent = supportTouch ? "click.iL" : "itap.iL";

			if (iL.context && iL.selector) {
				var $items = $(iL.selector, iL.context);

				$(iL.context).on(clickEvent, iL.selector, function() {
					var $this = $(this),
						key = $items.index($this);

					vars.current = key;
					vars.next = iL.items[key + 1] ? key + 1 : null;
					vars.prev = iL.items[key - 1] ? key - 1 : null;

					iL.addContents();
					iL.patchEvents();

					return false;
				}).on(vEvent, iL.selector, function() {
					return false;
				});
			} else
				$.each(iL.itemsObject, function(key, val) {
					val.on(clickEvent, function() {
						vars.current = key;
						vars.next = iL.items[key + 1] ? key + 1 : null;
						vars.prev = iL.items[key - 1] ? key - 1 : null;

						iL.addContents();
						iL.patchEvents();

						return false;
					}).on(vEvent, function() {
						return false;
					});
				});
		},

		dispatchItemsEvents: function() {
			var iL = this,
				vars = iL.vars,
				opts = iL.options;

			if (iL.context && iL.selector)
				$(iL.context).off('.iL', iL.selector);
			else
				$.each(iL.itemsObject, function(key, val) {
					val.off('.iL');
				});
		},

		refresh: function() {
			var iL = this;

			iL.dispatchItemsEvents();
			iL.attachItems();
			iL.normalizeItems();
			iL.patchItemsEvents();
		},

		patchEvents: function() {
			var iL = this,
				vars = iL.vars,
				opts = iL.options,
				path = opts.path.toLowerCase(),
				holders = $('.ilightbox-holder'),
				fullscreenEvent = fullScreenApi.fullScreenEventName + '.iLightBox',
				durationThreshold = 1000,
				horizontalDistanceThreshold =
				verticalDistanceThreshold = 100,
				buttonsArray = [vars.nextButton[0], vars.prevButton[0], vars.nextButton[0].firstChild, vars.prevButton[0].firstChild];

			$win.bind('resize.iLightBox', function() {
				var viewport = getViewport();

				if (opts.mobileOptimizer && !opts.innerToolbar) vars.isMobile = viewport.width <= vars.mobileMaxWidth;
				vars.BODY[vars.isMobile ? 'addClass' : 'removeClass']('isMobile');

				iL.repositionPhoto(null);
				if (supportTouch) {
					clearTimeout(vars.setTime);
					vars.setTime = setTimeout(function() {
						var scrollTop = getScrollXY().y;
						window.scrollTo(0, scrollTop - 30);
						window.scrollTo(0, scrollTop + 30);
						window.scrollTo(0, scrollTop);
					}, 2000);
				}
				if (vars.thumbs) iL.positionThumbnails();
			}).bind('keydown.iLightBox', function(event) {
				if (opts.controls.keyboard) {
					switch (event.keyCode) {
						case 13:
							if (event.shiftKey && opts.keyboard.shift_enter) iL.fullScreenAction();
							break;
						case 27:
							if (opts.keyboard.esc) iL.closeAction();
							break;
						case 37:
							if (opts.keyboard.left && !vars.lockKey) iL.moveTo('prev');
							break;
						case 38:
							if (opts.keyboard.up && !vars.lockKey) iL.moveTo('prev');
							break;
						case 39:
							if (opts.keyboard.right && !vars.lockKey) iL.moveTo('next');
							break;
						case 40:
							if (opts.keyboard.down && !vars.lockKey) iL.moveTo('next');
							break;
					}
				}
			});

			if (fullScreenApi.supportsFullScreen) $win.bind(fullscreenEvent, function() {
				iL.doFullscreen();
			});

			var holderEventsArr = [opts.caption.show + '.iLightBox', opts.caption.hide + '.iLightBox', opts.social.show + '.iLightBox', opts.social.hide + '.iLightBox'].filter(function(e, i, arr) {
					return arr.lastIndexOf(e) === i;
				}),
				holderEvents = "";

			$.each(holderEventsArr, function(key, val) {
				if (key != 0) holderEvents += ' ';
				holderEvents += val;
			});

			$doc.on(clickEvent, '.ilightbox-overlay', function() {
				if (opts.overlay.blur) iL.closeAction();
			}).on(clickEvent, '.ilightbox-next, .ilightbox-next-button', function() {
				iL.moveTo('next');
			}).on(clickEvent, '.ilightbox-prev, .ilightbox-prev-button', function() {
				iL.moveTo('prev');
			}).on(clickEvent, '.ilightbox-thumbnail', function() {
				var t = $(this),
					thumbs = $('.ilightbox-thumbnail', vars.thumbnails),
					index = thumbs.index(t);

				if (index != vars.current) iL.goTo(index);
			}).on(holderEvents, '.ilightbox-holder:not(.ilightbox-next, .ilightbox-prev)', function(e) {
				var caption = $('div.ilightbox-caption', vars.holder),
					social = $('div.ilightbox-social', vars.holder),
					fadeSpeed = opts.effects.fadeSpeed;

				if (vars.nextLock || vars.prevLock) {
					if (e.type == opts.caption.show && !caption.is(':visible')) caption.fadeIn(fadeSpeed);
					else if (e.type == opts.caption.hide && caption.is(':visible')) caption.fadeOut(fadeSpeed);

					if (e.type == opts.social.show && !social.is(':visible')) social.fadeIn(fadeSpeed);
					else if (e.type == opts.social.hide && social.is(':visible')) social.fadeOut(fadeSpeed);
				} else {
					if (e.type == opts.caption.show && !caption.is(':visible')) caption.stop().fadeIn(fadeSpeed);
					else if (e.type == opts.caption.hide && caption.is(':visible')) caption.stop().fadeOut(fadeSpeed);

					if (e.type == opts.social.show && !social.is(':visible')) social.stop().fadeIn(fadeSpeed);
					else if (e.type == opts.social.hide && social.is(':visible')) social.stop().fadeOut(fadeSpeed);
				}
			}).on('mouseenter.iLightBox mouseleave.iLightBox', '.ilightbox-wrapper', function(e) {
				if (e.type == 'mouseenter') vars.lockWheel = true;
				else vars.lockWheel = false;
			}).on(clickEvent, '.ilightbox-toolbar a.ilightbox-close, .ilightbox-toolbar a.ilightbox-fullscreen, .ilightbox-toolbar a.ilightbox-play, .ilightbox-toolbar a.ilightbox-pause', function() {
				var t = $(this);

				if (t.hasClass('ilightbox-fullscreen')) iL.fullScreenAction();
				else if (t.hasClass('ilightbox-play')) {
					iL.resume();
					t.addClass('ilightbox-pause').removeClass('ilightbox-play');
				} else if (t.hasClass('ilightbox-pause')) {
					iL.pause();
					t.addClass('ilightbox-play').removeClass('ilightbox-pause');
				} else iL.closeAction();
			}).on(touchMoveEvent, '.ilightbox-overlay, .ilightbox-thumbnails-container', function(e) {
				// prevent scrolling
				e.preventDefault();
			});

			function mouseMoveHandler(e) {
				if (!vars.isMobile) {
					if (!vars.mouseID) {
						vars.hideableElements.show();
					}

					vars.mouseID = clearTimeout(vars.mouseID);

					if (buttonsArray.indexOf(e.target) === -1)
						vars.mouseID = setTimeout(function() {
							vars.hideableElements.hide();
							vars.mouseID = clearTimeout(vars.mouseID);
						}, 3000);
				}
			}

			if (opts.controls.arrows && !supportTouch) $doc.on('mousemove.iLightBox', mouseMoveHandler);

			if (opts.controls.slideshow && opts.slideshow.pauseOnHover) $doc.on('mouseenter.iLightBox mouseleave.iLightBox', '.ilightbox-holder:not(.ilightbox-next, .ilightbox-prev)', function(e) {
				if (e.type == 'mouseenter' && vars.cycleID) iL.pause();
				else if (e.type == 'mouseleave' && vars.isPaused) iL.resume();
			});

			var switchers = $('.ilightbox-overlay, .ilightbox-holder, .ilightbox-thumbnails');

			if (opts.controls.mousewheel) switchers.on('mousewheel.iLightBox', function(event, delta) {
				if (!vars.lockWheel) {
					event.preventDefault();
					if (delta < 0) iL.moveTo('next');
					else if (delta > 0) iL.moveTo('prev');
				}
			});

			if (opts.controls.swipe) holders.on(touchStartEvent, function(event) {
				if (vars.nextLock || vars.prevLock || vars.total == 1 || vars.lockSwipe) return;

				vars.BODY.addClass('ilightbox-closedhand');

				var data = event.originalEvent.touches ? event.originalEvent.touches[0] : event,
					scrollTop = $doc.scrollTop(),
					scrollLeft = $doc.scrollLeft(),
					offsets = [
						holders.eq(0).offset(),
						holders.eq(1).offset(),
						holders.eq(2).offset()
					],
					offSet = [{
						top: offsets[0].top - scrollTop,
						left: offsets[0].left - scrollLeft
					}, {
						top: offsets[1].top - scrollTop,
						left: offsets[1].left - scrollLeft
					}, {
						top: offsets[2].top - scrollTop,
						left: offsets[2].left - scrollLeft
					}],
					start = {
						time: (new Date()).getTime(),
						coords: [data.pageX - scrollLeft, data.pageY - scrollTop]
					},
					stop;

				function moveEachHandler(i) {
					var t = $(this),
						offset = offSet[i],
						scroll = [(start.coords[0] - stop.coords[0]), (start.coords[1] - stop.coords[1])];

					t[0].style[path == "horizontal" ? 'left' : 'top'] = (path == "horizontal" ? offset.left - scroll[0] : offset.top - scroll[1]) + 'px';
				}

				function moveHandler(event) {

					if (!start) return;

					var data = event.originalEvent.touches ? event.originalEvent.touches[0] : event;

					stop = {
						time: (new Date()).getTime(),
						coords: [data.pageX - scrollLeft, data.pageY - scrollTop]
					};

					holders.each(moveEachHandler);

					// prevent scrolling
					event.preventDefault();
				}

				function repositionHolders() {
					holders.each(function() {
						var t = $(this),
							offset = t.data('offset') || {
								top: t.offset().top - scrollTop,
								left: t.offset().left - scrollLeft
							},
							top = offset.top,
							left = offset.left;

						t.css(transform, gpuAcceleration).stop().animate({
							top: top,
							left: left
						}, 500, 'easeOutCirc', function() {
							t.css(transform, '');
						});
					});
				}

				holders.bind(touchMoveEvent, moveHandler);
				$doc.one(touchStopEvent, function(event) {
					holders.unbind(touchMoveEvent, moveHandler);

					vars.BODY.removeClass('ilightbox-closedhand');

					if (start && stop) {
						if (path == "horizontal" && stop.time - start.time < durationThreshold && abs(start.coords[0] - stop.coords[0]) > horizontalDistanceThreshold && abs(start.coords[1] - stop.coords[1]) < verticalDistanceThreshold) {
							if (start.coords[0] > stop.coords[0]) {
								if (vars.current == vars.total - 1 && !opts.infinite) repositionHolders();
								else {
									vars.isSwipe = true;
									iL.moveTo('next');
								}
							} else {
								if (vars.current == 0 && !opts.infinite) repositionHolders();
								else {
									vars.isSwipe = true;
									iL.moveTo('prev');
								}
							}
						} else if (path == "vertical" && stop.time - start.time < durationThreshold && abs(start.coords[1] - stop.coords[1]) > horizontalDistanceThreshold && abs(start.coords[0] - stop.coords[0]) < verticalDistanceThreshold) {
							if (start.coords[1] > stop.coords[1]) {
								if (vars.current == vars.total - 1 && !opts.infinite) repositionHolders();
								else {
									vars.isSwipe = true;
									iL.moveTo('next');
								}
							} else {
								if (vars.current == 0 && !opts.infinite) repositionHolders();
								else {
									vars.isSwipe = true;
									iL.moveTo('prev');
								}
							}
						} else repositionHolders();
					}
					start = stop = undefined;
				});
			});

		},

		goTo: function(index) {
			var iL = this,
				vars = iL.vars,
				opts = iL.options,
				diff = (index - vars.current);

			if (opts.infinite) {
				if (index == vars.total - 1 && vars.current == 0) diff = -1;
				if (vars.current == vars.total - 1 && index == 0) diff = 1;
			}

			if (diff == 1) iL.moveTo('next');
			else if (diff == -1) iL.moveTo('prev');
			else {

				if (vars.nextLock || vars.prevLock) return false;

				//Trigger the onBeforeChange callback
				if (typeof opts.callback.onBeforeChange == 'function') opts.callback.onBeforeChange.call(iL, iL.ui);

				if (opts.linkId) {
					vars.hashLock = true;
					window.location.hash = opts.linkId + '/' + index;
				}

				if (iL.items[index]) {
					if (!iL.items[index].options.mousewheel) vars.lockWheel = true;
					else iL.vars.lockWheel = false;

					if (!iL.items[index].options.swipe) vars.lockSwipe = true;
					else vars.lockSwipe = false;
				}

				$.each([vars.holder, vars.nextPhoto, vars.prevPhoto], function(key, val) {
					val.css(transform, gpuAcceleration).fadeOut(opts.effects.loadedFadeSpeed);
				});

				vars.current = index;
				vars.next = index + 1;
				vars.prev = index - 1;

				iL.createUI();

				setTimeout(function() {
					iL.generateBoxes();
				}, opts.effects.loadedFadeSpeed + 50);

				$('.ilightbox-thumbnail', vars.thumbnails).removeClass('ilightbox-active').eq(index).addClass('ilightbox-active');
				iL.positionThumbnails();

				if (opts.linkId) setTimeout(function() {
					vars.hashLock = false;
				}, 55);

				// Configure arrow buttons
				if (!opts.infinite) {
					vars.nextButton.add(vars.prevButton).add(vars.innerPrevButton).add(vars.innerNextButton).removeClass('disabled');

					if (vars.current == 0) {
						vars.prevButton.add(vars.innerPrevButton).addClass('disabled');
					}
					if (vars.current >= vars.total - 1) {
						vars.nextButton.add(vars.innerNextButton).addClass('disabled');
					}
				}

				// Reset next cycle timeout
				iL.resetCycle();

				//Trigger the onAfterChange callback
				if (typeof opts.callback.onAfterChange == 'function') opts.callback.onAfterChange.call(iL, iL.ui);
			}
		},

		moveTo: function(side) {
			var iL = this,
				vars = iL.vars,
				opts = iL.options,
				path = opts.path.toLowerCase(),
				viewport = getViewport(),
				switchSpeed = opts.effects.switchSpeed;

			if (vars.nextLock || vars.prevLock) return false;
			else {

				var item = (side == "next") ? vars.next : vars.prev;

				if (opts.linkId) {
					vars.hashLock = true;
					window.location.hash = opts.linkId + '/' + item;
				}

				if (side == "next") {
					if (!iL.items[item]) return false;
					var firstHolder = vars.nextPhoto,
						secondHolder = vars.holder,
						lastHolder = vars.prevPhoto,
						firstClass = 'ilightbox-prev',
						secondClass = 'ilightbox-next';
				} else if (side == "prev") {
					if (!iL.items[item]) return false;
					var firstHolder = vars.prevPhoto,
						secondHolder = vars.holder,
						lastHolder = vars.nextPhoto,
						firstClass = 'ilightbox-next',
						secondClass = 'ilightbox-prev';
				}

				//Trigger the onBeforeChange callback
				if (typeof opts.callback.onBeforeChange == 'function')
					opts.callback.onBeforeChange.call(iL, iL.ui);

				(side == "next") ? vars.nextLock = true: vars.prevLock = true;

				var captionFirst = $('div.ilightbox-caption', secondHolder),
					socialFirst = $('div.ilightbox-social', secondHolder);

				if (captionFirst.length)
					captionFirst.stop().fadeOut(switchSpeed, function() {
						$(this).remove();
					});
				if (socialFirst.length)
					socialFirst.stop().fadeOut(switchSpeed, function() {
						$(this).remove();
					});

				if (iL.items[item].caption) {
					iL.setCaption(iL.items[item], firstHolder);
					var caption = $('div.ilightbox-caption', firstHolder),
						percent = parseInt((caption.outerHeight() / firstHolder.outerHeight()) * 100);
					if (opts.caption.start && percent <= 50) caption.fadeIn(switchSpeed);
				}

				var social = iL.items[item].options.social;
				if (social) {
					iL.setSocial(social, iL.items[item].URL, firstHolder);
					if (opts.social.start) $('div.ilightbox-social', firstHolder).fadeIn(opts.effects.fadeSpeed);
				}

				$.each([firstHolder, secondHolder, lastHolder], function(key, val) {
					val.removeClass('ilightbox-next ilightbox-prev');
				});

				var firstOffset = firstHolder.data('offset'),
					winW = (viewport.width - (opts.styles.pageOffsetX)),
					winH = (viewport.height - (opts.styles.pageOffsetY)),
					width = firstOffset.newDims.width,
					height = firstOffset.newDims.height,
					thumbsOffset = firstOffset.thumbsOffset,
					diff = firstOffset.diff,
					top = parseInt((winH / 2) - (height / 2) - diff.H - (thumbsOffset.H / 2)),
					left = parseInt((winW / 2) - (width / 2) - diff.W - (thumbsOffset.W / 2));

				firstHolder.css(transform, gpuAcceleration).animate({
					top: top,
					left: left,
					opacity: 1
				}, switchSpeed, (vars.isSwipe) ? 'easeOutCirc' : 'easeInOutCirc', function() {
					firstHolder.css(transform, '');
				});

				$('div.ilightbox-container', firstHolder).animate({
					width: width,
					height: height
				}, switchSpeed, (vars.isSwipe) ? 'easeOutCirc' : 'easeInOutCirc');

				var secondOffset = secondHolder.data('offset'),
					object = secondOffset.object;

				diff = secondOffset.diff;

				width = secondOffset.newDims.width,
					height = secondOffset.newDims.height;

				width = parseInt(width * opts.styles[side == 'next' ? 'prevScale' : 'nextScale']),
					height = parseInt(height * opts.styles[side == 'next' ? 'prevScale' : 'nextScale']),
					top = (path == 'horizontal') ? parseInt((winH / 2) - object.offsetY - (height / 2) - diff.H - (thumbsOffset.H / 2)) : parseInt(winH - object.offsetX - diff.H - (thumbsOffset.H / 2));

				if (side == 'prev')
					left = (path == 'horizontal') ? parseInt(winW - object.offsetX - diff.W - (thumbsOffset.W / 2)) : parseInt((winW / 2) - (width / 2) - diff.W - object.offsetY - (thumbsOffset.W / 2));
				else {
					top = (path == 'horizontal') ? top : parseInt(object.offsetX - diff.H - height - (thumbsOffset.H / 2)),
						left = (path == 'horizontal') ? parseInt(object.offsetX - diff.W - width - (thumbsOffset.W / 2)) : parseInt((winW / 2) - object.offsetY - (width / 2) - diff.W - (thumbsOffset.W / 2));
				}

				$('div.ilightbox-container', secondHolder).animate({
					width: width,
					height: height
				}, switchSpeed, (vars.isSwipe) ? 'easeOutCirc' : 'easeInOutCirc');

				secondHolder.addClass(firstClass).css(transform, gpuAcceleration).animate({
					top: top,
					left: left,
					opacity: opts.styles.prevOpacity
				}, switchSpeed, (vars.isSwipe) ? 'easeOutCirc' : 'easeInOutCirc', function() {
					secondHolder.css(transform, '');

					$('.ilightbox-thumbnail', vars.thumbnails).removeClass('ilightbox-active').eq(item).addClass('ilightbox-active');
					iL.positionThumbnails();

					if (iL.items[item]) {
						if (!iL.items[item].options.mousewheel) vars.lockWheel = true;
						else vars.lockWheel = false;

						if (!iL.items[item].options.swipe) vars.lockSwipe = true;
						else vars.lockSwipe = false;
					}

					vars.isSwipe = false;

					if (side == "next") {
						vars.nextPhoto = lastHolder,
							vars.prevPhoto = secondHolder,
							vars.holder = firstHolder;

						vars.nextPhoto.hide();

						vars.next = vars.next + 1,
							vars.prev = vars.current,
							vars.current = vars.current + 1;

						if (opts.infinite) {
							if (vars.current > vars.total - 1) vars.current = 0;
							if (vars.current == vars.total - 1) vars.next = 0;
							if (vars.current == 0) vars.prev = vars.total - 1;
						}

						iL.createUI();

						if (!iL.items[vars.next])
							vars.nextLock = false;
						else
							iL.loadContent(iL.items[vars.next], 'next');
					} else {
						vars.prevPhoto = lastHolder;
						vars.nextPhoto = secondHolder;
						vars.holder = firstHolder;

						vars.prevPhoto.hide();

						vars.next = vars.current;
						vars.current = vars.prev;
						vars.prev = vars.current - 1;

						if (opts.infinite) {
							if (vars.current == vars.total - 1) vars.next = 0;
							if (vars.current == 0) vars.prev = vars.total - 1;
						}

						iL.createUI();

						if (!iL.items[vars.prev])
							vars.prevLock = false;
						else
							iL.loadContent(iL.items[vars.prev], 'prev');
					}

					if (opts.linkId) setTimeout(function() {
						vars.hashLock = false;
					}, 55);

					// Configure arrow buttons
					if (!opts.infinite) {
						vars.nextButton.add(vars.prevButton).add(vars.innerPrevButton).add(vars.innerNextButton).removeClass('disabled');

						if (vars.current == 0)
							vars.prevButton.add(vars.innerPrevButton).addClass('disabled');
						if (vars.current >= vars.total - 1)
							vars.nextButton.add(vars.innerNextButton).addClass('disabled');
					}

					iL.repositionPhoto();

					// Reset next cycle timeout
					iL.resetCycle();

					//Trigger the onAfterChange callback
					if (typeof opts.callback.onAfterChange == 'function')
						opts.callback.onAfterChange.call(iL, iL.ui);
				});

				top = (path == 'horizontal') ? getPixel(lastHolder, 'top') : ((side == "next") ? parseInt(-(winH / 2) - lastHolder.outerHeight()) : parseInt(top * 2)),
					left = (path == 'horizontal') ? ((side == "next") ? parseInt(-(winW / 2) - lastHolder.outerWidth()) : parseInt(left * 2)) : getPixel(lastHolder, 'left');

				lastHolder.css(transform, gpuAcceleration).animate({
					top: top,
					left: left,
					opacity: opts.styles.nextOpacity
				}, switchSpeed, (vars.isSwipe) ? 'easeOutCirc' : 'easeInOutCirc', function() {
					lastHolder.css(transform, '');
				}).addClass(secondClass);
			}
		},

		setCaption: function(obj, target) {
			var iL = this,
				caption = $('<div class="ilightbox-caption"></div>');

			if (obj.caption) {
				caption.html(obj.caption);
				$('div.ilightbox-container', target).append(caption);
			}
		},

		normalizeSocial: function(obj, url) {
			var iL = this,
				vars = iL.vars,
				opts = iL.options,
				baseURL = window.location.href;

			$.each(obj, function(key, value) {
				if (!value)
					return true;

				var item = key.toLowerCase(),
					source, text;

				switch (item) {
					case 'facebook':
						source = "http://www.facebook.com/share.php?v=4&src=bm&u={URL}",
							text = "Share on Facebook";
						break;
					case 'twitter':
						source = "http://twitter.com/home?status={URL}",
							text = "Share on Twitter";
						break;
					case 'googleplus':
						source = "https://plus.google.com/share?url={URL}",
							text = "Share on Google+";
						break;
					case 'delicious':
						source = "http://delicious.com/post?url={URL}",
							text = "Share on Delicious";
						break;
					case 'digg':
						source = "http://digg.com/submit?phase=2&url={URL}",
							text = "Share on Digg";
						break;
					case 'reddit':
						source = "http://reddit.com/submit?url={URL}",
							text = "Share on reddit";
						break;
				}

				obj[key] = {
					URL: value.URL && absolutizeURI(baseURL, value.URL) || opts.linkId && window.location.href || typeof url !== 'string' && baseURL || url && absolutizeURI(baseURL, url) || baseURL,
					source: value.source || source || value.URL && absolutizeURI(baseURL, value.URL) || url && absolutizeURI(baseURL, url),
					text: value.text || text || "Share on " + key,
					width: (typeof(value.width) != 'undefined' && !isNaN(value.width)) ? parseInt(value.width) : 640,
					height: value.height || 360
				};

			});

			return obj;
		},

		setSocial: function(obj, url, target) {
			var iL = this,
				socialBar = $('<div class="ilightbox-social"></div>'),
				buttons = '<ul>';

			obj = iL.normalizeSocial(obj, url);

			$.each(obj, function(key, value) {
				var item = key.toLowerCase(),
					source = value.source.replace(/\{URL\}/g, encodeURIComponent(value.URL).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+'));
				buttons += '<li class="' + key + '"><a href="' + source + '" onclick="javascript:window.open(this.href' + ((value.width <= 0 || value.height <= 0) ? '' : ', \'\', \'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=' + value.height + ',width=' + value.width + ',left=40,top=40\'') + ');return false;" title="' + value.text + '" target="_blank"></a></li>';
			});

			buttons += '</ul>';

			socialBar.html(buttons);
			$('div.ilightbox-container', target).append(socialBar);
		},

		fullScreenAction: function() {
			var iL = this,
				vars = iL.vars;

			if (fullScreenApi.supportsFullScreen) {
				if (fullScreenApi.isFullScreen()) fullScreenApi.cancelFullScreen(document.documentElement);
				else fullScreenApi.requestFullScreen(document.documentElement);
			} else {
				iL.doFullscreen();
			}
		},

		doFullscreen: function() {
			var iL = this,
				vars = iL.vars,
				viewport = getViewport(),
				opts = iL.options;

			if (opts.fullAlone) {
				var currentHolder = vars.holder,
					current = iL.items[vars.current],
					windowWidth = viewport.width,
					windowHeight = viewport.height,
					elements = [currentHolder, vars.nextPhoto, vars.prevPhoto, vars.nextButton, vars.prevButton, vars.overlay, vars.toolbar, vars.thumbnails, vars.loader],
					hideElements = [vars.nextPhoto, vars.prevPhoto, vars.nextButton, vars.prevButton, vars.loader, vars.thumbnails];

				if (!vars.isInFullScreen) {
					vars.isInFullScreen = vars.lockKey = vars.lockWheel = vars.lockSwipe = true;
					vars.overlay.css({
						opacity: 1
					});

					$.each(hideElements, function(i, element) {
						element.hide();
					});

					vars.fullScreenButton.attr('title', opts.text.exitFullscreen);

					if (opts.fullStretchTypes.indexOf(current.type) != -1) currentHolder.data({
						naturalWidthOld: currentHolder.data('naturalWidth'),
						naturalHeightOld: currentHolder.data('naturalHeight'),
						naturalWidth: windowWidth,
						naturalHeight: windowHeight
					});
					else {
						var viewport = current.options.fullViewPort || opts.fullViewPort || '',
							newWidth = windowWidth,
							newHeight = windowHeight,
							width = currentHolder.data('naturalWidth'),
							height = currentHolder.data('naturalHeight');

						if (viewport.toLowerCase() == 'fill') {
							newHeight = (newWidth / width) * height;

							if (newHeight < windowHeight) {
								newWidth = (windowHeight / height) * width,
									newHeight = windowHeight;
							}
						} else if (viewport.toLowerCase() == 'fit') {
							var dims = iL.getNewDimenstions(newWidth, newHeight, width, height, true);

							newWidth = dims.width,
								newHeight = dims.height;
						} else if (viewport.toLowerCase() == 'stretch') {
							newWidth = newWidth,
								newHeight = newHeight;
						} else {
							var scale = (width > newWidth || height > newHeight) ? true : false,
								dims = iL.getNewDimenstions(newWidth, newHeight, width, height, scale);
							newWidth = dims.width,
								newHeight = dims.height;
						}

						currentHolder.data({
							naturalWidthOld: currentHolder.data('naturalWidth'),
							naturalHeightOld: currentHolder.data('naturalHeight'),
							naturalWidth: newWidth,
							naturalHeight: newHeight
						});
					}

					$.each(elements, function(key, val) {
						val.addClass('ilightbox-fullscreen');
					});

					//Trigger the onEnterFullScreen callback
					if (typeof opts.callback.onEnterFullScreen == 'function') opts.callback.onEnterFullScreen.call(iL, iL.ui);
				} else {
					vars.isInFullScreen = vars.lockKey = vars.lockWheel = vars.lockSwipe = false;
					vars.overlay.css({
						opacity: iL.options.overlay.opacity
					});

					$.each(hideElements, function(i, element) {
						element.show();
					});

					vars.fullScreenButton.attr('title', opts.text.enterFullscreen);

					currentHolder.data({
						naturalWidth: currentHolder.data('naturalWidthOld'),
						naturalHeight: currentHolder.data('naturalHeightOld'),
						naturalWidthOld: null,
						naturalHeightOld: null
					});

					$.each(elements, function(key, val) {
						val.removeClass('ilightbox-fullscreen');
					});

					//Trigger the onExitFullScreen callback
					if (typeof opts.callback.onExitFullScreen == 'function') opts.callback.onExitFullScreen.call(iL, iL.ui);
				}
			} else {
				if (!vars.isInFullScreen) vars.isInFullScreen = true;
				else vars.isInFullScreen = false;
			}
			iL.repositionPhoto(true);
		},

		closeAction: function() {
			var iL = this,
				vars = iL.vars,
				opts = iL.options;

			$win.unbind('.iLightBox');
			$doc.off('.iLightBox');

			if (vars.isInFullScreen) fullScreenApi.cancelFullScreen(document.documentElement);

			$('.ilightbox-overlay, .ilightbox-holder, .ilightbox-thumbnails').off('.iLightBox');

			//--------------------- Alert ---------------------
			// this section has been customized.

			if (opts.hide.effect) vars.overlay.stop().fadeOut(opts.hide.speed, function() {
				vars.overlay.remove();
				vars.BODY.removeClass('ilightbox-noscroll').off('.iLightBox');
			});
			else {
				vars.overlay.remove();
				vars.BODY.removeClass('ilightbox-noscroll').off('.iLightBox');
			}

			var fadeOuts = [vars.toolbar, vars.nextPhoto, vars.prevPhoto, vars.nextButton, vars.prevButton, vars.loader, vars.thumbnails];

			$.each(fadeOuts, function(i, element) {
				element.removeAttr('style').remove();
    			$(vars.holder).stop().animate({
				    top: "-100%"
				}, 500, function() {
				    $(this).remove();
				});
			});
			// --------------------- Alert ---------------------
			// this section has been customized.

			vars.dontGenerateThumbs = vars.isInFullScreen = false;

			window.iLightBox = null;

			if (opts.linkId) {
				vars.hashLock = true;
				removeHash();
				setTimeout(function() {
					vars.hashLock = false;
				}, 55);
			}

			//Trigger the onHide callback
			if (typeof opts.callback.onHide == 'function') opts.callback.onHide.call(iL, iL.ui);
		},

		repositionPhoto: function() {
			var iL = this,
				vars = iL.vars,
				opts = iL.options,
				path = opts.path.toLowerCase(),
				viewport = getViewport(),
				winWidth = viewport.width,
				winHeight = viewport.height;

			var thumbsOffsetW = (vars.isInFullScreen && opts.fullAlone || vars.isMobile) ? 0 : ((path == 'horizontal') ? 0 : vars.thumbnails.outerWidth()),
				thumbsOffsetH = vars.isMobile ? vars.toolbar.outerHeight() : ((vars.isInFullScreen && opts.fullAlone) ? 0 : ((path == 'horizontal') ? vars.thumbnails.outerHeight() : 0)),
				width = (vars.isInFullScreen && opts.fullAlone) ? winWidth : (winWidth - (opts.styles.pageOffsetX)),
				height = (vars.isInFullScreen && opts.fullAlone) ? winHeight : (winHeight - (opts.styles.pageOffsetY)),
				offsetW = (path == 'horizontal') ? parseInt((iL.items[vars.next] || iL.items[vars.prev]) ? ((opts.styles.nextOffsetX + opts.styles.prevOffsetX)) * 2 : (((width / 10) <= 30) ? 30 : (width / 10))) : parseInt(((width / 10) <= 30) ? 30 : (width / 10)) + thumbsOffsetW,
				offsetH = (path == 'horizontal') ? parseInt(((height / 10) <= 30) ? 30 : (height / 10)) + thumbsOffsetH : parseInt((iL.items[vars.next] || iL.items[vars.prev]) ? ((opts.styles.nextOffsetX + opts.styles.prevOffsetX)) * 2 : (((height / 10) <= 30) ? 30 : (height / 10)));

			var elObject = {
				type: 'current',
				width: width,
				height: height,
				item: iL.items[vars.current],
				offsetW: offsetW,
				offsetH: offsetH,
				thumbsOffsetW: thumbsOffsetW,
				thumbsOffsetH: thumbsOffsetH,
				animate: arguments.length,
				holder: vars.holder
			};

			iL.repositionEl(elObject);

			if (iL.items[vars.next]) {
				elObject = $.extend(elObject, {
					type: 'next',
					item: iL.items[vars.next],
					offsetX: opts.styles.nextOffsetX,
					offsetY: opts.styles.nextOffsetY,
					holder: vars.nextPhoto
				});

				iL.repositionEl(elObject);
			}

			if (iL.items[vars.prev]) {
				elObject = $.extend(elObject, {
					type: 'prev',
					item: iL.items[vars.prev],
					offsetX: opts.styles.prevOffsetX,
					offsetY: opts.styles.prevOffsetY,
					holder: vars.prevPhoto
				});

				iL.repositionEl(elObject);
			}

			var loaderCss = (path == "horizontal") ? {
				left: parseInt((width / 2) - (vars.loader.outerWidth() / 2))
			} : {
				top: parseInt((height / 2) - (vars.loader.outerHeight() / 2))
			};
			vars.loader.css(loaderCss);
		},

		repositionEl: function(obj) {
			var iL = this,
				vars = iL.vars,
				opts = iL.options,
				path = opts.path.toLowerCase(),
				widthAvail = (obj.type == 'current') ? ((vars.isInFullScreen && opts.fullAlone) ? obj.width : (obj.width - obj.offsetW)) : (obj.width - obj.offsetW),
				heightAvail = (obj.type == 'current') ? ((vars.isInFullScreen && opts.fullAlone) ? obj.height : (obj.height - obj.offsetH)) : (obj.height - obj.offsetH),
				itemParent = obj.item,
				item = obj.item.options,
				holder = obj.holder,
				offsetX = obj.offsetX || 0,
				offsetY = obj.offsetY || 0,
				thumbsOffsetW = obj.thumbsOffsetW,
				thumbsOffsetH = obj.thumbsOffsetH;

			if (obj.type == 'current') {
				if (typeof item.width == 'number' && item.width) widthAvail = ((vars.isInFullScreen && opts.fullAlone) && (opts.fullStretchTypes.indexOf(itemParent.type) != -1 || item.fullViewPort || opts.fullViewPort)) ? widthAvail : ((item.width > widthAvail) ? widthAvail : item.width);
				if (typeof item.height == 'number' && item.height) heightAvail = ((vars.isInFullScreen && opts.fullAlone) && (opts.fullStretchTypes.indexOf(itemParent.type) != -1 || item.fullViewPort || opts.fullViewPort)) ? heightAvail : ((item.height > heightAvail) ? heightAvail : item.height);
			} else {
				if (typeof item.width == 'number' && item.width) widthAvail = (item.width > widthAvail) ? widthAvail : item.width;
				if (typeof item.height == 'number' && item.height) heightAvail = (item.height > heightAvail) ? heightAvail : item.height;
			}

			heightAvail = parseInt(heightAvail - $('.ilightbox-inner-toolbar', holder).outerHeight());

			var width = (typeof item.width == 'string' && item.width.indexOf('%') != -1) ? percentToValue(parseInt(item.width.replace('%', '')), obj.width) : holder.data('naturalWidth'),
				height = (typeof item.height == 'string' && item.height.indexOf('%') != -1) ? percentToValue(parseInt(item.height.replace('%', '')), obj.height) : holder.data('naturalHeight');

			var dims = ((typeof item.width == 'string' && item.width.indexOf('%') != -1 || typeof item.height == 'string' && item.height.indexOf('%') != -1) ? {
					width: width,
					height: height
				} : iL.getNewDimenstions(widthAvail, heightAvail, width, height)),
				newDims = $.extend({}, dims, {});

			if (obj.type == 'prev' || obj.type == 'next')
				width = parseInt(dims.width * ((obj.type == 'next') ? opts.styles.nextScale : opts.styles.prevScale)),
				height = parseInt(dims.height * ((obj.type == 'next') ? opts.styles.nextScale : opts.styles.prevScale));
			else
				width = dims.width,
				height = dims.height;

			var widthDiff = parseInt((getPixel(holder, 'padding-left') + getPixel(holder, 'padding-right') + getPixel(holder, 'border-left-width') + getPixel(holder, 'border-right-width')) / 2),
				heightDiff = parseInt((getPixel(holder, 'padding-top') + getPixel(holder, 'padding-bottom') + getPixel(holder, 'border-top-width') + getPixel(holder, 'border-bottom-width') + $('.ilightbox-inner-toolbar', holder).outerHeight()) / 2);

			switch (obj.type) {
				case 'current':
					var top = parseInt((obj.height / 2) - (height / 2) - heightDiff - (thumbsOffsetH / 2)),
						left = parseInt((obj.width / 2) - (width / 2) - widthDiff - (thumbsOffsetW / 2));
					break;

				case 'next':
					var top = (path == 'horizontal') ? parseInt((obj.height / 2) - offsetY - (height / 2) - heightDiff - (thumbsOffsetH / 2)) : parseInt(obj.height - offsetX - heightDiff - (thumbsOffsetH / 2)),
						left = (path == 'horizontal') ? parseInt(obj.width - offsetX - widthDiff - (thumbsOffsetW / 2)) : parseInt((obj.width / 2) - (width / 2) - widthDiff - offsetY - (thumbsOffsetW / 2));
					break;

				case 'prev':
					var top = (path == 'horizontal') ? parseInt((obj.height / 2) - offsetY - (height / 2) - heightDiff - (thumbsOffsetH / 2)) : parseInt(offsetX - heightDiff - height - (thumbsOffsetH / 2)),
						left = (path == 'horizontal') ? parseInt(offsetX - widthDiff - width - (thumbsOffsetW / 2)) : parseInt((obj.width / 2) - offsetY - (width / 2) - widthDiff - (thumbsOffsetW / 2));
					break;
			}

			holder.data('offset', {
				top: top,
				left: left,
				newDims: newDims,
				diff: {
					W: widthDiff,
					H: heightDiff
				},
				thumbsOffset: {
					W: thumbsOffsetW,
					H: thumbsOffsetH
				},
				object: obj
			});

			if (obj.animate > 0 && opts.effects.reposition) {
				holder.css(transform, gpuAcceleration).stop().animate({
					top: top,
					left: left
				}, opts.effects.repositionSpeed, 'easeOutCirc', function() {
					holder.css(transform, '');
				});
				$('div.ilightbox-container', holder).stop().animate({
					width: width,
					height: height
				}, opts.effects.repositionSpeed, 'easeOutCirc');
				$('div.ilightbox-inner-toolbar', holder).stop().animate({
					width: width
				}, opts.effects.repositionSpeed, 'easeOutCirc', function() {
					$(this).css('overflow', 'visible');
				});
			} else {
				holder.css({
					top: 0, //orifinally value is : top
					left: left
				});
				$('div.ilightbox-container', holder).css({
					width: width,
					height: height
				});
				$('div.ilightbox-inner-toolbar', holder).css({
					width: width
				});
			}
		},

		resume: function(priority) {
			var iL = this,
				vars = iL.vars,
				opts = iL.options;

			if (!opts.slideshow.pauseTime || opts.controls.slideshow && vars.total <= 1 || priority < vars.isPaused) {
				return;
			}

			vars.isPaused = 0;

			if (vars.cycleID) {
				vars.cycleID = clearTimeout(vars.cycleID);
			}

			vars.cycleID = setTimeout(function() {
				if (vars.current == vars.total - 1) iL.goTo(0);
				else iL.moveTo('next');
			}, opts.slideshow.pauseTime);
		},

		pause: function(priority) {
			var iL = this,
				vars = iL.vars,
				opts = iL.options;

			if (priority < vars.isPaused) {
				return;
			}

			vars.isPaused = priority || 100;

			if (vars.cycleID) {
				vars.cycleID = clearTimeout(vars.cycleID);
			}
		},

		resetCycle: function() {
			var iL = this,
				vars = iL.vars,
				opts = iL.options;

			if (opts.controls.slideshow && vars.cycleID && !vars.isPaused) {
				iL.resume();
			}
		},

		getNewDimenstions: function(width, height, width_old, height_old, thumb) {
			var iL = this;

			if (!width) factor = height / height_old;
			else if (!height) factor = width / width_old;
			else factor = min(width / width_old, height / height_old);

			if (!thumb) {
				if (factor > iL.options.maxScale) factor = iL.options.maxScale;
				else if (factor < iL.options.minScale) factor = iL.options.minScale;
			}

			var final_width = (iL.options.keepAspectRatio) ? round(width_old * factor) : width,
				final_height = (iL.options.keepAspectRatio) ? round(height_old * factor) : height;

			return {
				width: final_width,
				height: final_height,
				ratio: factor
			};
		},

		setOption: function(options) {
			var iL = this;

			iL.options = $.extend(true, iL.options, options || {});
			iL.refresh();
		},

		availPlugins: function() {
			var iL = this,
				testEl = document.createElement("video");

			iL.plugins = {
				flash: (parseInt(PluginDetect.getVersion("Shockwave")) >= 0 || parseInt(PluginDetect.getVersion("Flash")) >= 0) ? true : false,
				quicktime: (parseInt(PluginDetect.getVersion("QuickTime")) >= 0) ? true : false,
				html5H264: !!(testEl.canPlayType && testEl.canPlayType('video/mp4').replace(/no/, '')),
				html5WebM: !!(testEl.canPlayType && testEl.canPlayType('video/webm').replace(/no/, '')),
				html5Vorbis: !!(testEl.canPlayType && testEl.canPlayType('video/ogg').replace(/no/, '')),
				html5QuickTime: !!(testEl.canPlayType && testEl.canPlayType('video/quicktime').replace(/no/, ''))
			};
		},

		addContent: function(element, obj) {
			var iL = this,
				el;

			switch (obj.type) {
				case 'video':
					var HTML5 = false,
						videoType = obj.videoType,
						html5video = obj.options.html5video;

					if (((videoType == 'video/mp4' || obj.ext == 'mp4' || obj.ext == 'm4v') || html5video.h264) && iL.plugins.html5H264)
						obj.ext = 'mp4',
						obj.URL = html5video.h264 || obj.URL;
					else if (html5video.webm && iL.plugins.html5WebM)
						obj.ext = 'webm',
						obj.URL = html5video.webm || obj.URL;
					else if (html5video.ogg && iL.plugins.html5Vorbis)
						obj.ext = 'ogv',
						obj.URL = html5video.ogg || obj.URL;

					if (iL.plugins.html5H264 && (videoType == 'video/mp4' || obj.ext == 'mp4' || obj.ext == 'm4v')) HTML5 = true, videoType = "video/mp4";
					else if (iL.plugins.html5WebM && (videoType == 'video/webm' || obj.ext == 'webm')) HTML5 = true, videoType = "video/webm";
					else if (iL.plugins.html5Vorbis && (videoType == 'video/ogg' || obj.ext == 'ogv')) HTML5 = true, videoType = "video/ogg";
					else if (iL.plugins.html5QuickTime && (videoType == 'video/quicktime' || obj.ext == 'mov' || obj.ext == 'qt')) HTML5 = true, videoType = "video/quicktime";

					if (HTML5) {
						el = $('<video />', {
							"width": "100%",
							"height": "100%",
							"preload": html5video.preload,
							"autoplay": html5video.autoplay,
							"poster": html5video.poster,
							"controls": html5video.controls
						}).append($('<source />', {
							"src": obj.URL,
							"type": videoType
						}));
					} else {
						if (!iL.plugins.quicktime) el = $('<span />', {
							"class": "ilightbox-alert",
							html: iL.options.errors.missingPlugin.replace('{pluginspage}', pluginspages.quicktime).replace('{type}', 'QuickTime')
						});
						else {

							el = $('<object />', {
								"type": "video/quicktime",
								"pluginspage": pluginspages.quicktime
							}).attr({
								"data": obj.URL,
								"width": "100%",
								"height": "100%"
							}).append($('<param />', {
								"name": "src",
								"value": obj.URL
							})).append($('<param />', {
								"name": "autoplay",
								"value": "false"
							})).append($('<param />', {
								"name": "loop",
								"value": "false"
							})).append($('<param />', {
								"name": "scale",
								"value": "tofit"
							}));

							if (browser.msie) el = QT_GenerateOBJECTText(obj.URL, '100%', '100%', '', 'SCALE', 'tofit', 'AUTOPLAY', 'false', 'LOOP', 'false');
						}
					}

					break;

				case 'flash':
					if (!iL.plugins.flash) el = $('<span />', {
						"class": "ilightbox-alert",
						html: iL.options.errors.missingPlugin.replace('{pluginspage}', pluginspages.flash).replace('{type}', 'Adobe Flash player')
					});
					else {
						var flashvars = "",
							i = 0;

						if (obj.options.flashvars) $.each(obj.options.flashvars, function(k, v) {
							if (i != 0) flashvars += "&";
							flashvars += k + "=" + encodeURIComponent(v);
							i++;
						});
						else flashvars = null;

						el = $('<embed />').attr({
							"type": "application/x-shockwave-flash",
							"src": obj.URL,
							"width": (typeof obj.options.width == 'number' && obj.options.width && iL.options.minScale == '1' && iL.options.maxScale == '1') ? obj.options.width : "100%",
							"height": (typeof obj.options.height == 'number' && obj.options.height && iL.options.minScale == '1' && iL.options.maxScale == '1') ? obj.options.height : "100%",
							"quality": "high",
							"bgcolor": "#000000",
							"play": "true",
							"loop": "true",
							"menu": "true",
							"wmode": "transparent",
							"scale": "showall",
							"allowScriptAccess": "always",
							"allowFullScreen": "true",
							"flashvars": flashvars,
							"fullscreen": "yes"
						});
					}

					break;

				case 'iframe':
					el = $('<iframe />').attr({
						"width": (typeof obj.options.width == 'number' && obj.options.width && iL.options.minScale == '1' && iL.options.maxScale == '1') ? obj.options.width : "100%",
						"height": (typeof obj.options.height == 'number' && obj.options.height && iL.options.minScale == '1' && iL.options.maxScale == '1') ? obj.options.height : "100%",
						src: obj.URL,
						frameborder: 0,
						'hspace': 0,
						'vspace': 0,
						'scrolling': supportTouch ? 'auto' : 'scroll',
						'webkitAllowFullScreen': '',
						'mozallowfullscreen': '',
						'allowFullScreen': ''
					});

					break;

				case 'inline':
					el = $('<div class="ilightbox-wrapper"></div>').html($(obj.URL).clone(true));

					break;

				case 'html':
					var object = obj.URL,
						el;

					if (object[0].nodeName) {
						el = $('<div class="ilightbox-wrapper"></div>').html(object);
					} else {
						var dom = $(obj.URL),
							html = (dom.selector) ? $('<div>' + dom + '</div>') : dom;
						el = $('<div class="ilightbox-wrapper"></div>').html(html);
					}

					break;
			}

			$('div.ilightbox-container', element).empty().html(el);

			// For fixing Chrome about just playing the video for first time
			if (el[0].tagName.toLowerCase() === 'video' && browser.webkit) setTimeout(function() {
				var src = el[0].currentSrc + '?' + floor(random() * 30000);
				el[0].currentSrc = src;
				el[0].src = src;
			});

			return el;
		},

		ogpRecognition: function(obj, callback) {
			var iL = this,
				url = obj.URL;

			iL.showLoader();
			doAjax(url, function(data) {
				iL.hideLoader();
				
				if (data) {
					var object = new Object();

					object.length = false,
					object.url = data.url;

					if (data.status == 200) {
						var result = data.results,
							type = result.type,
							source = result.source;

						object.source = source.src,
						object.width = source.width && parseInt(source.width) || 0,
						object.height = source.height && parseInt(source.height) || 0,
						object.type = type,
						object.thumbnail = source.thumbnail || result.images[0],
						object.html5video = result.html5video || {},
						object.length = true;

						if (source.type == 'application/x-shockwave-flash') object.type = "flash";
						else if (source.type.indexOf("video/") != -1) object.type = "video";
						else if (source.type.indexOf("/html") != -1) object.type = "iframe";
						else if (source.type.indexOf("image/") != -1) object.type = "image";

					} else if (typeof data.response != 'undefined')
						throw data.response;

					callback.call(this, object.length ? object : false);
				}
			});
		},

		hashChangeHandler: function(url) {
			var iL = this,
				vars = iL.vars,
				opts = iL.options,
				URL = url || window.location.href,
				hash = parseURI(URL).hash,
				split = hash.split('/'),
				index = split[1];

			if (vars.hashLock || ('#' + opts.linkId != split[0] && hash.length > 1)) return;

			if (index) {
				var target = split[1] || 0;
				if (iL.items[target]) {
					var overlay = $('.ilightbox-overlay');
					if (overlay.length && overlay.attr('linkid') == opts.linkId) {
						iL.goTo(target);
					} else {
						iL.itemsObject[target].trigger(supportTouch ? 'itap' : 'click');
					}
				} else {
					var overlay = $('.ilightbox-overlay');
					if (overlay.length) iL.closeAction();
				}
			} else {
				var overlay = $('.ilightbox-overlay');
				if (overlay.length) iL.closeAction();
			}
		}
	};

	/**
	 * Parse style to pixels.
	 *
	 * @param {Object}   $element   jQuery object with element.
	 * @param {Property} property   CSS property to get the pixels from.
	 *
	 * @return {Int}
	 */
	function getPixel($element, property) {
		return parseInt($element.css(property), 10) || 0;
	}

	/**
	 * Make sure that number is within the limits.
	 *
	 * @param {Number} number
	 * @param {Number} min
	 * @param {Number} max
	 *
	 * @return {Number}
	 */
	function within(number, min, max) {
		return number < min ? min : number > max ? max : number;
	}

	/**
	 * Get viewport/window size (width and height).
	 *
	 * @return {Object}
	 */
	function getViewport() {
		var e = window,
			a = 'inner';
		if (!('innerWidth' in window)) {
			a = 'client';
			e = document.documentElement || document.body;
		}
		return {
			width: e[a + 'Width'],
			height: e[a + 'Height']
		}
	}

	/**
	 * Remove hash tag from the URL
	 *
	 * @return {Void}
	 */
	function removeHash() {
		var scroll = getScrollXY();

		window.location.hash = "";

		// Restore the scroll offset, should be flicker free
		window.scrollTo(scroll.x, scroll.y);
	}

	/**
	 * Do the ajax requests with callback.
	 *
	 * @param {String}   url
	 * @param {Function} callback
	 *
	 * @return {Void}
	 */
	function doAjax(url, callback) {
		var url = "http://ilightbox.net/getSource/jsonp.php?url=" + encodeURIComponent(url).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A');
		$.ajax({
			url: url,
			dataType: 'jsonp'
		});

		iLCallback = function(data) {
			callback.call(this, data);
		};
	}

	/**
	 * Find image from DOM elements
	 *
	 * @param {Element} element
	 *
	 * @return {Void}
	 */
	function findImageInElement(element) {
		var elements = $('*', element),
			imagesArr = new Array();

		elements.each(function() {
			var url = "",
				element = this;

			if ($(element).css("background-image") != "none") {
				url = $(element).css("background-image");
			} else if (typeof($(element).attr("src")) != "undefined" && element.nodeName.toLowerCase() == "img") {
				url = $(element).attr("src");
			}

			if (url.indexOf("gradient") == -1) {
				url = url.replace(/url\(\"/g, "");
				url = url.replace(/url\(/g, "");
				url = url.replace(/\"\)/g, "");
				url = url.replace(/\)/g, "");

				var urls = url.split(",");

				for (var i = 0; i < urls.length; i++) {
					if (urls[i].length > 0 && $.inArray(urls[i], imagesArr) == -1) {
						var extra = "";
						if (browser.msie && browser.version < 9) {
							extra = "?" + floor(random() * 3000);
						}
						imagesArr.push(urls[i] + extra);
					}
				}
			}
		});

		return imagesArr;
	}

	/**
	 * Get file extension.
	 *
	 * @param {String} URL
	 *
	 * @return {String}
	 */
	function getExtension(URL) {
		var ext = URL.split('.').pop().toLowerCase(),
			extra = ext.indexOf('?') !== -1 ? ext.split('?').pop() : '';

		return ext.replace(extra, '');
	}

	/**
	 * Get type via extension.
	 *
	 * @param {String} URL
	 *
	 * @return {String}
	 */
	function getTypeByExtension(URL) {
		var type,
			ext = getExtension(URL);

		if (extensions.image.indexOf(ext) !== -1) type = 'image';
		else if (extensions.flash.indexOf(ext) !== -1) type = 'flash';
		else if (extensions.video.indexOf(ext) !== -1) type = 'video';
		else type = 'iframe';

		return type;
	}

	/**
	 * Return value from percent of a number.
	 *
	 * @param {Number} percent
	 * @param {Number} total
	 *
	 * @return {Number}
	 */
	function percentToValue(percent, total) {
		return parseInt((total / 100) * percent);
	}

	/**
	 * A JavaScript equivalent of PHP’s parse_url.
	 *
	 * @param {String} url           The URL to parse.
	 *
	 * @return {Mixed}
	 */
	function parseURI(url) {
		var m = String(url).replace(/^\s+|\s+$/g, '').match(/^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
		// authority = '//' + user + ':' + pass '@' + hostname + ':' port
		return (m ? {
			href: m[0] || '',
			protocol: m[1] || '',
			authority: m[2] || '',
			host: m[3] || '',
			hostname: m[4] || '',
			port: m[5] || '',
			pathname: m[6] || '',
			search: m[7] || '',
			hash: m[8] || ''
		} : null);
	}

	/**
	 * Gets the absolute URI.
	 *
	 * @param {String} href     The relative URL.
	 * @param {String} base     The base URL.
	 *
	 * @return {String}         The absolute URL.
	 */
	function absolutizeURI(base, href) { // RFC 3986
		var iL = this;

		function removeDotSegments(input) {
			var output = [];
			input.replace(/^(\.\.?(\/|$))+/, '')
				.replace(/\/(\.(\/|$))+/g, '/')
				.replace(/\/\.\.$/, '/../')
				.replace(/\/?[^\/]*/g, function(p) {
					if (p === '/..') {
						output.pop();
					} else {
						output.push(p);
					}
				});
			return output.join('').replace(/^\//, input.charAt(0) === '/' ? '/' : '');
		}

		href = parseURI(href || '');
		base = parseURI(base || '');

		return !href || !base ? null : (href.protocol || base.protocol) +
			(href.protocol || href.authority ? href.authority : base.authority) +
			removeDotSegments(href.protocol || href.authority || href.pathname.charAt(0) === '/' ? href.pathname : (href.pathname ? ((base.authority && !base.pathname ? '/' : '') + base.pathname.slice(0, base.pathname.lastIndexOf('/') + 1) + href.pathname) : base.pathname)) +
			(href.protocol || href.authority || href.pathname ? href.search : (href.search || base.search)) +
			href.hash;
	}

	/**
	 * A JavaScript equivalent of PHP’s version_compare.
	 *
	 * @param {String} v1
	 * @param {String} v2
	 * @param {String} operator
	 *
	 * @return {Boolean}
	 */
	function version_compare(v1, v2, operator) {
		this.php_js = this.php_js || {};
		this.php_js.ENV = this.php_js.ENV || {};
		var i = 0,
			x = 0,
			compare = 0,
			vm = {
				'dev': -6,
				'alpha': -5,
				'a': -5,
				'beta': -4,
				'b': -4,
				'RC': -3,
				'rc': -3,
				'#': -2,
				'p': 1,
				'pl': 1
			},
			prepVersion = function(v) {
				v = ('' + v).replace(/[_\-+]/g, '.');
				v = v.replace(/([^.\d]+)/g, '.$1.').replace(/\.{2,}/g, '.');
				return (!v.length ? [-8] : v.split('.'));
			},
			numVersion = function(v) {
				return !v ? 0 : (isNaN(v) ? vm[v] || -7 : parseInt(v, 10));
			};
		v1 = prepVersion(v1);
		v2 = prepVersion(v2);
		x = max(v1.length, v2.length);
		for (i = 0; i < x; i++) {
			if (v1[i] == v2[i]) {
				continue;
			}
			v1[i] = numVersion(v1[i]);
			v2[i] = numVersion(v2[i]);
			if (v1[i] < v2[i]) {
				compare = -1;
				break;
			} else if (v1[i] > v2[i]) {
				compare = 1;
				break;
			}
		}
		if (!operator) {
			return compare;
		}

		switch (operator) {
			case '>':
			case 'gt':
				return (compare > 0);
			case '>=':
			case 'ge':
				return (compare >= 0);
			case '<=':
			case 'le':
				return (compare <= 0);
			case '==':
			case '=':
			case 'eq':
				return (compare === 0);
			case '<>':
			case '!=':
			case 'ne':
				return (compare !== 0);
			case '':
			case '<':
			case 'lt':
				return (compare < 0);
			default:
				return null;
		}
	}


	// Begin the iLightBox plugin
	$.fn.iLightBox = function() {

		var args = arguments,
			opt = ($.isPlainObject(args[0])) ? args[0] : args[1],
			items = ($.isArray(args[0]) || typeof args[0] == 'string') ? args[0] : args[1];

		if (!opt) opt = {};

		// Default options. Play carefully.
		var options = $.extend(true, {
			attr: 'href',
			path: 'vertical',
			skin: 'dark',
			linkId: false,
			infinite: false,
			startFrom: 0,
			randomStart: false,
			keepAspectRatio: true,
			maxScale: 1,
			minScale: .2,
			innerToolbar: false,
			smartRecognition: false,
			mobileOptimizer: true,
			fullAlone: true,
			fullViewPort: null,
			fullStretchTypes: 'flash, video',
			overlay: {
				blur: true,
				opacity: .85
			},
			controls: {
				arrows: false,
				slideshow: false,
				toolbar: true,
				fullscreen: true,
				thumbnail: true,
				keyboard: true,
				mousewheel: true,
				swipe: true
			},
			keyboard: {
				left: true, // previous
				right: true, // next
				up: true, // previous
				down: true, // next
				esc: true, // close
				shift_enter: true // fullscreen
			},
			show: {
				effect: true,
				speed: 300,
				title: true
			},
			hide: {
				effect: true,
				speed: 300
			},
			caption: {
				start: true,
				show: 'mouseenter',
				hide: 'mouseleave'
			},
			social: {
				start: true,
				show: 'mouseenter',
				hide: 'mouseleave',
				buttons: false
			},
			styles: {
				pageOffsetX: 0,
				pageOffsetY: 0,
				nextOffsetX: 45,
				nextOffsetY: 0,
				nextOpacity: 1,
				nextScale: 1,
				prevOffsetX: 45,
				prevOffsetY: 0,
				prevOpacity: 1,
				prevScale: 1
			},
			thumbnails: {
				maxWidth: 120,
				maxHeight: 80,
				normalOpacity: 1,
				activeOpacity: .6
			},
			effects: {
				reposition: true,
				repositionSpeed: 200,
				switchSpeed: 500,
				loadedFadeSpeed: 180,
				fadeSpeed: 200
			},
			slideshow: {
				pauseTime: 5000,
				pauseOnHover: false,
				startPaused: true
			},
			text: {
				close: "Press Esc to close",
				enterFullscreen: "Enter Fullscreen (Shift+Enter)",
				exitFullscreen: "Exit Fullscreen (Shift+Enter)",
				slideShow: "Slideshow",
				next: "Next",
				previous: "Previous"
			},
			errors: {
				loadImage: "An error occurred when trying to load photo.",
				loadContents: "An error occurred when trying to load contents.",
				missingPlugin: "The content your are attempting to view requires the <a href='{pluginspage}' target='_blank'>{type} plugin<\/a>."
			},
			ajaxSetup: {
				url: '',
				beforeSend: function(jqXHR, settings) {},
				cache: false,
				complete: function(jqXHR, textStatus) {},
				crossDomain: false,
				error: function(jqXHR, textStatus, errorThrown) {},
				success: function(data, textStatus, jqXHR) {},
				global: true,
				ifModified: false,
				username: null,
				password: null,
				type: 'GET'
			},
			callback: {}
		}, opt);

		var instant = ($.isArray(items) || typeof items == 'string') ? true : false;

		items = $.isArray(items) ? items : new Array();

		if (typeof args[0] == 'string') items[0] = args[0];

		if (version_compare($.fn.jquery, '1.8', '>=')) {
			var iLB = new iLightBox($(this), options, items, instant);
			return {
				close: function() {
					iLB.closeAction();
				},
				fullscreen: function() {
					iLB.fullScreenAction();
				},
				moveNext: function() {
					iLB.moveTo('next');
				},
				movePrev: function() {
					iLB.moveTo('prev');
				},
				goTo: function(index) {
					iLB.goTo(index);
				},
				refresh: function() {
					iLB.refresh();
				},
				reposition: function() {
					(arguments.length > 0) ? iLB.repositionPhoto(true): iLB.repositionPhoto();
				},
				setOption: function(options) {
					iLB.setOption(options);
				},
				destroy: function() {
					iLB.closeAction();
					iLB.dispatchItemsEvents();
				}
			};
		} else {
			throw "The jQuery version that was loaded is too old. iLightBox requires jQuery 1.8+";
		}

	};


	$.iLightBox = function() {
		return $.fn.iLightBox(arguments[0], arguments[1]);
	};


	$.extend($.easing, {
		easeInCirc: function(x, t, b, c, d) {
			return -c * (sqrt(1 - (t /= d) * t) - 1) + b;
		},
		easeOutCirc: function(x, t, b, c, d) {
			return c * sqrt(1 - (t = t / d - 1) * t) + b;
		},
		easeInOutCirc: function(x, t, b, c, d) {
			if ((t /= d / 2) < 1) return -c / 2 * (sqrt(1 - t * t) - 1) + b;
			return c / 2 * (sqrt(1 - (t -= 2) * t) + 1) + b;
		}
	});

	function getScrollXY() {
		var scrOfX = 0,
			scrOfY = 0;
		if (typeof(window.pageYOffset) == 'number') {
			//Netscape compliant
			scrOfY = window.pageYOffset;
			scrOfX = window.pageXOffset;
		} else if (document.body && (document.body.scrollLeft || document.body.scrollTop)) {
			//DOM compliant
			scrOfY = document.body.scrollTop;
			scrOfX = document.body.scrollLeft;
		} else if (document.documentElement && (document.documentElement.scrollLeft || document.documentElement.scrollTop)) {
			//IE6 standards compliant mode
			scrOfY = document.documentElement.scrollTop;
			scrOfX = document.documentElement.scrollLeft;
		}
		return {
			x: scrOfX,
			y: scrOfY
		};
	}

	(function() {
		// add new event shortcuts
		$.each(("touchstart touchmove touchend " +
			"tap taphold " +
			"swipe swipeleft swiperight " +
			"scrollstart scrollstop").split(" "), function(i, name) {

			$.fn[name] = function(fn) {
				return fn ? this.bind(name, fn) : this.trigger(name);
			};

			// jQuery < 1.8
			if ($.attrFn) {
				$.attrFn[name] = true;
			}
		});

		var tapSettings = {
			startEvent: 'touchstart.iTap',
			endEvent: 'touchend.iTap'
		};

		// tap Event:
		$.event.special.itap = {
			setup: function() {

				var self = this,
					$self = $(this),
					start, stop;

				$self.bind(tapSettings.startEvent, function(event) {
					start = getScrollXY();

					$self.one(tapSettings.endEvent, function(event) {
						stop = getScrollXY();

						var orgEvent = event || window.event;
						event = $.event.fix(orgEvent);
						event.type = "itap";

						if ((start && stop) && (start.x == stop.x && start.y == stop.y))($.event.dispatch || $.event.handle).call(self, event);

						start = stop = undefined;
					});
				});
			},

			teardown: function() {
				$(this).unbind(tapSettings.startEvent);
			}
		};
	}());


	//Fullscreen API
	(function() {
		fullScreenApi = {
				supportsFullScreen: false,
				isFullScreen: function() {
					return false;
				},
				requestFullScreen: function() {},
				cancelFullScreen: function() {},
				fullScreenEventName: '',
				prefix: ''
			},
			browserPrefixes = 'webkit moz o ms khtml'.split(' ');

		// check for native support
		if (typeof document.cancelFullScreen != 'undefined') {
			fullScreenApi.supportsFullScreen = true;
		} else {
			// check for fullscreen support by vendor prefix
			for (var i = 0, il = browserPrefixes.length; i < il; i++) {
				fullScreenApi.prefix = browserPrefixes[i];

				if (typeof document[fullScreenApi.prefix + 'CancelFullScreen'] != 'undefined') {
					fullScreenApi.supportsFullScreen = true;

					break;
				}
			}
		}

		// update methods to do something useful
		if (fullScreenApi.supportsFullScreen) {
			fullScreenApi.fullScreenEventName = fullScreenApi.prefix + 'fullscreenchange';

			fullScreenApi.isFullScreen = function() {
				switch (this.prefix) {
					case '':
						return document.fullScreen;
					case 'webkit':
						return document.webkitIsFullScreen;
					default:
						return document[this.prefix + 'FullScreen'];
				}
			}
			fullScreenApi.requestFullScreen = function(el) {
				return (this.prefix === '') ? el.requestFullScreen() : el[this.prefix + 'RequestFullScreen']();
			}
			fullScreenApi.cancelFullScreen = function(el) {
				return (this.prefix === '') ? document.cancelFullScreen() : document[this.prefix + 'CancelFullScreen']();
			}
		}
	}());

	// Browser detect
	(function() {
		function uaMatch(ua) {
			ua = ua.toLowerCase();

			var match = /(chrome)[ \/]([\w.]+)/.exec(ua) ||
				/(webkit)[ \/]([\w.]+)/.exec(ua) ||
				/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
				/(msie) ([\w.]+)/.exec(ua) ||
				ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || [];

			return {
				browser: match[1] || "",
				version: match[2] || "0"
			};
		}

		var matched = uaMatch(navigator.userAgent);
		browser = {};

		if (matched.browser) {
			browser[matched.browser] = true;
			browser.version = matched.version;
		}

		// Chrome is Webkit, but Webkit is also Safari.
		if (browser.chrome) {
			browser.webkit = true;
		} else if (browser.webkit) {
			browser.safari = true;
		}
	}());

	// Feature detects
	(function() {
		var prefixes = ['', 'webkit', 'moz', 'ms', 'o'];
		var el = document.createElement('div');

		function testProp(prop) {
			for (var p = 0, pl = prefixes.length; p < pl; p++) {
				var prefixedProp = prefixes[p] ? prefixes[p] + prop.charAt(0).toUpperCase() + prop.slice(1) : prop;
				if (el.style[prefixedProp] !== undefined) {
					return prefixedProp;
				}
			}
		}

		// Global support indicators
		transform = testProp('transform') || '';
		gpuAcceleration = testProp('perspective') ? 'translateZ(0) ' : '';
	}());


	/*
		PluginDetect v0.7.9
		www.pinlady.net/PluginDetect/license/
		[ getVersion onWindowLoaded BetterIE ]
		[ Flash QuickTime Shockwave ]
	*/
	var PluginDetect={version:"0.7.9",name:"PluginDetect",handler:function(c,b,a){return function(){c(b,a)}},openTag:"<",isDefined:function(b){return typeof b!="undefined"},isArray:function(b){return(/array/i).test(Object.prototype.toString.call(b))},isFunc:function(b){return typeof b=="function"},isString:function(b){return typeof b=="string"},isNum:function(b){return typeof b=="number"},isStrNum:function(b){return(typeof b=="string"&&(/\d/).test(b))},getNumRegx:/[\d][\d\.\_,-]*/,splitNumRegx:/[\.\_,-]/g,getNum:function(b,c){var d=this,a=d.isStrNum(b)?(d.isDefined(c)?new RegExp(c):d.getNumRegx).exec(b):null;return a?a[0]:null},compareNums:function(h,f,d){var e=this,c,b,a,g=parseInt;if(e.isStrNum(h)&&e.isStrNum(f)){if(e.isDefined(d)&&d.compareNums){return d.compareNums(h,f)}c=h.split(e.splitNumRegx);b=f.split(e.splitNumRegx);for(a=0;a<min(c.length,b.length);a++){if(g(c[a],10)>g(b[a],10)){return 1}if(g(c[a],10)<g(b[a],10)){return -1}}}return 0},formatNum:function(b,c){var d=this,a,e;if(!d.isStrNum(b)){return null}if(!d.isNum(c)){c=4}c--;e=b.replace(/\s/g,"").split(d.splitNumRegx).concat(["0","0","0","0"]);for(a=0;a<4;a++){if(/^(0+)(.+)$/.test(e[a])){e[a]=RegExp.$2}if(a>c||!(/\d/).test(e[a])){e[a]="0"}}return e.slice(0,4).join(",")},$$hasMimeType:function(a){return function(c){if(!a.isIE&&c){var f,e,b,d=a.isArray(c)?c:(a.isString(c)?[c]:[]);for(b=0;b<d.length;b++){if(a.isString(d[b])&&/[^\s]/.test(d[b])){f=navigator.mimeTypes[d[b]];e=f?f.enabledPlugin:0;if(e&&(e.name||e.description)){return f}}}}return null}},findNavPlugin:function(l,e,c){var j=this,h=new RegExp(l,"i"),d=(!j.isDefined(e)||e)?/\d/:0,k=c?new RegExp(c,"i"):0,a=navigator.plugins,g="",f,b,m;for(f=0;f<a.length;f++){m=a[f].description||g;b=a[f].name||g;if((h.test(m)&&(!d||d.test(RegExp.leftContext+RegExp.rightContext)))||(h.test(b)&&(!d||d.test(RegExp.leftContext+RegExp.rightContext)))){if(!k||!(k.test(m)||k.test(b))){return a[f]}}}return null},getMimeEnabledPlugin:function(k,m,c){var e=this,f,b=new RegExp(m,"i"),h="",g=c?new RegExp(c,"i"):0,a,l,d,j=e.isString(k)?[k]:k;for(d=0;d<j.length;d++){if((f=e.hasMimeType(j[d]))&&(f=f.enabledPlugin)){l=f.description||h;a=f.name||h;if(b.test(l)||b.test(a)){if(!g||!(g.test(l)||g.test(a))){return f}}}}return 0},getPluginFileVersion:function(f,b){var h=this,e,d,g,a,c=-1;if(h.OS>2||!f||!f.version||!(e=h.getNum(f.version))){return b}if(!b){return e}e=h.formatNum(e);b=h.formatNum(b);d=b.split(h.splitNumRegx);g=e.split(h.splitNumRegx);for(a=0;a<d.length;a++){if(c>-1&&a>c&&d[a]!="0"){return b}if(g[a]!=d[a]){if(c==-1){c=a}if(d[a]!="0"){return b}}}return e},AXO:window.ActiveXObject,getAXO:function(a){var f=null,d,b=this,c={};try{f=new b.AXO(a)}catch(d){}return f},convertFuncs:function(f){var a,g,d,b=/^[\$][\$]/,c=this;for(a in f){if(b.test(a)){try{g=a.slice(2);if(g.length>0&&!f[g]){f[g]=f[a](f);delete f[a]}}catch(d){}}}},initObj:function(e,b,d){var a,c;if(e){if(e[b[0]]==1||d){for(a=0;a<b.length;a=a+2){e[b[a]]=b[a+1]}}for(a in e){c=e[a];if(c&&c[b[0]]==1){this.initObj(c,b)}}}},initScript:function(){var d=this,a=navigator,h,i=document,l=a.userAgent||"",j=a.vendor||"",b=a.platform||"",k=a.product||"";d.initObj(d,["$",d]);for(h in d.Plugins){if(d.Plugins[h]){d.initObj(d.Plugins[h],["$",d,"$$",d.Plugins[h]],1)}}d.convertFuncs(d);d.OS=100;if(b){var g=["Win",1,"Mac",2,"Linux",3,"FreeBSD",4,"iPhone",21.1,"iPod",21.2,"iPad",21.3,"Win.*CE",22.1,"Win.*Mobile",22.2,"Pocket\\s*PC",22.3,"",100];for(h=g.length-2;h>=0;h=h-2){if(g[h]&&new RegExp(g[h],"i").test(b)){d.OS=g[h+1];break}}};d.head=i.getElementsByTagName("head")[0]||i.getElementsByTagName("body")[0]||i.body||null;d.isIE=new Function("return/*@cc_on!@*/!1")();d.verIE=d.isIE&&(/MSIE\s*(\d+\.?\d*)/i).test(l)?parseFloat(RegExp.$1,10):null;d.verIEfull=null;d.docModeIE=null;if(d.isIE){var f,n,c=document.createElement("div");try{c.style.behavior="url(#default#clientcaps)";d.verIEfull=(c.getComponentVersion("{89820200-ECBD-11CF-8B85-00AA005B4383}","componentid")).replace(/,/g,".")}catch(f){}n=parseFloat(d.verIEfull||"0",10);d.docModeIE=i.documentMode||((/back/i).test(i.compatMode||"")?5:n)||d.verIE;d.verIE=n||d.docModeIE};d.ActiveXEnabled=false;if(d.isIE){var h,m=["Msxml2.XMLHTTP","Msxml2.DOMDocument","Microsoft.XMLDOM","ShockwaveFlash.ShockwaveFlash","TDCCtl.TDCCtl","Shell.UIHelper","Scripting.Dictionary","wmplayer.ocx"];for(h=0;h<m.length;h++){if(d.getAXO(m[h])){d.ActiveXEnabled=true;break}}};d.isGecko=(/Gecko/i).test(k)&&(/Gecko\s*\/\s*\d/i).test(l);d.verGecko=d.isGecko?d.formatNum((/rv\s*\:\s*([\.\,\d]+)/i).test(l)?RegExp.$1:"0.9"):null;d.isChrome=(/Chrome\s*\/\s*(\d[\d\.]*)/i).test(l);d.verChrome=d.isChrome?d.formatNum(RegExp.$1):null;d.isSafari=((/Apple/i).test(j)||(!j&&!d.isChrome))&&(/Safari\s*\/\s*(\d[\d\.]*)/i).test(l);d.verSafari=d.isSafari&&(/Version\s*\/\s*(\d[\d\.]*)/i).test(l)?d.formatNum(RegExp.$1):null;d.isOpera=(/Opera\s*[\/]?\s*(\d+\.?\d*)/i).test(l);d.verOpera=d.isOpera&&((/Version\s*\/\s*(\d+\.?\d*)/i).test(l)||1)?parseFloat(RegExp.$1,10):null;d.addWinEvent("load",d.handler(d.runWLfuncs,d))},init:function(d){var c=this,b,d,a={status:-3,plugin:0};if(!c.isString(d)){return a}if(d.length==1){c.getVersionDelimiter=d;return a}d=d.toLowerCase().replace(/\s/g,"");b=c.Plugins[d];if(!b||!b.getVersion){return a}a.plugin=b;if(!c.isDefined(b.installed)){b.installed=null;b.version=null;b.version0=null;b.getVersionDone=null;b.pluginName=d}c.garbage=false;if(c.isIE&&!c.ActiveXEnabled&&d!=="java"){a.status=-2;return a}a.status=1;return a},fPush:function(b,a){var c=this;if(c.isArray(a)&&(c.isFunc(b)||(c.isArray(b)&&b.length>0&&c.isFunc(b[0])))){a.push(b)}},callArray:function(b){var c=this,a;if(c.isArray(b)){for(a=0;a<b.length;a++){if(b[a]===null){return}c.call(b[a]);b[a]=null}}},call:function(c){var b=this,a=b.isArray(c)?c.length:-1;if(a>0&&b.isFunc(c[0])){c[0](b,a>1?c[1]:0,a>2?c[2]:0,a>3?c[3]:0)}else{if(b.isFunc(c)){c(b)}}},getVersionDelimiter:",",$$getVersion:function(a){return function(g,d,c){var e=a.init(g),f,b,h={};if(e.status<0){return null};f=e.plugin;if(f.getVersionDone!=1){f.getVersion(null,d,c);if(f.getVersionDone===null){f.getVersionDone=1}}a.cleanup();b=(f.version||f.version0);b=b?b.replace(a.splitNumRegx,a.getVersionDelimiter):b;return b}},cleanup:function(){var a=this;if(a.garbage&&a.isDefined(window.CollectGarbage)){window.CollectGarbage()}},isActiveXObject:function(d,b){var f=this,a=false,g,c='<object width="1" height="1" style="display:none" '+d.getCodeBaseVersion(b)+">"+d.HTML+f.openTag+"/object>";if(!f.head){return a}f.head.insertBefore(document.createElement("object"),f.head.firstChild);f.head.firstChild.outerHTML=c;try{f.head.firstChild.classid=d.classID}catch(g){}try{if(f.head.firstChild.object){a=true}}catch(g){}try{if(a&&f.head.firstChild.readyState<4){f.garbage=true}}catch(g){}f.head.removeChild(f.head.firstChild);return a},codebaseSearch:function(f,b){var c=this;if(!c.ActiveXEnabled||!f){return null}if(f.BIfuncs&&f.BIfuncs.length&&f.BIfuncs[f.BIfuncs.length-1]!==null){c.callArray(f.BIfuncs)}var d,o=f.SEARCH,k={};if(c.isStrNum(b)){if(o.match&&o.min&&c.compareNums(b,o.min)<=0){return true}if(o.match&&o.max&&c.compareNums(b,o.max)>=0){return false}d=c.isActiveXObject(f,b);if(d&&(!o.min||c.compareNums(b,o.min)>0)){o.min=b}if(!d&&(!o.max||c.compareNums(b,o.max)<0)){o.max=b}return d};var e=[0,0,0,0],l=[].concat(o.digits),a=o.min?1:0,j,i,h,g,m,n=function(p,r){var q=[].concat(e);q[p]=r;return c.isActiveXObject(f,q.join(","))};if(o.max){g=o.max.split(c.splitNumRegx);for(j=0;j<g.length;j++){g[j]=parseInt(g[j],10)}if(g[0]<l[0]){l[0]=g[0]}}if(o.min){m=o.min.split(c.splitNumRegx);for(j=0;j<m.length;j++){m[j]=parseInt(m[j],10)}if(m[0]>e[0]){e[0]=m[0]}}if(m&&g){for(j=1;j<m.length;j++){if(m[j-1]!=g[j-1]){break}if(g[j]<l[j]){l[j]=g[j]}if(m[j]>e[j]){e[j]=m[j]}}}if(o.max){for(j=1;j<l.length;j++){if(g[j]>0&&l[j]==0&&l[j-1]<o.digits[j-1]){l[j-1]+=1;break}}};for(j=0;j<l.length;j++){h={};for(i=0;i<20;i++){if(l[j]-e[j]<1){break}d=round((l[j]+e[j])/2);if(h["a"+d]){break}h["a"+d]=1;if(n(j,d)){e[j]=d;a=1}else{l[j]=d}}l[j]=e[j];if(!a&&n(j,e[j])){a=1};if(!a){break}};return a?e.join(","):null},addWinEvent:function(d,c){var e=this,a=window,b;if(e.isFunc(c)){if(a.addEventListener){a.addEventListener(d,c,false)}else{if(a.attachEvent){a.attachEvent("on"+d,c)}else{b=a["on"+d];a["on"+d]=e.winHandler(c,b)}}}},winHandler:function(d,c){return function(){d();if(typeof c=="function"){c()}}},WLfuncs0:[],WLfuncs:[],runWLfuncs:function(a){var b={};a.winLoaded=true;a.callArray(a.WLfuncs0);a.callArray(a.WLfuncs);if(a.onDoneEmptyDiv){a.onDoneEmptyDiv()}},winLoaded:false,$$onWindowLoaded:function(a){return function(b){if(a.winLoaded){a.call(b)}else{a.fPush(b,a.WLfuncs)}}},div:null,divID:"plugindetect",divWidth:50,pluginSize:1,emptyDiv:function(){var d=this,b,h,c,a,f,g;if(d.div&&d.div.childNodes){for(b=d.div.childNodes.length-1;b>=0;b--){c=d.div.childNodes[b];if(c&&c.childNodes){for(h=c.childNodes.length-1;h>=0;h--){g=c.childNodes[h];try{c.removeChild(g)}catch(f){}}}if(c){try{d.div.removeChild(c)}catch(f){}}}}if(!d.div){a=document.getElementById(d.divID);if(a){d.div=a}}if(d.div&&d.div.parentNode){try{d.div.parentNode.removeChild(d.div)}catch(f){}d.div=null}},DONEfuncs:[],onDoneEmptyDiv:function(){var c=this,a,b;if(!c.winLoaded){return}if(c.WLfuncs&&c.WLfuncs.length&&c.WLfuncs[c.WLfuncs.length-1]!==null){return}for(a in c){b=c[a];if(b&&b.funcs){if(b.OTF==3){return}if(b.funcs.length&&b.funcs[b.funcs.length-1]!==null){return}}}for(a=0;a<c.DONEfuncs.length;a++){c.callArray(c.DONEfuncs)}c.emptyDiv()},getWidth:function(c){if(c){var a=c.scrollWidth||c.offsetWidth,b=this;if(b.isNum(a)){return a}}return -1},getTagStatus:function(m,g,a,b){var c=this,f,k=m.span,l=c.getWidth(k),h=a.span,j=c.getWidth(h),d=g.span,i=c.getWidth(d);if(!k||!h||!d||!c.getDOMobj(m)){return -2}if(j<i||l<0||j<0||i<0||i<=c.pluginSize||c.pluginSize<1){return 0}if(l>=i){return -1}try{if(l==c.pluginSize&&(!c.isIE||c.getDOMobj(m).readyState==4)){if(!m.winLoaded&&c.winLoaded){return 1}if(m.winLoaded&&c.isNum(b)){if(!c.isNum(m.count)){m.count=b}if(b-m.count>=10){return 1}}}}catch(f){}return 0},getDOMobj:function(g,a){var f,d=this,c=g?g.span:0,b=c&&c.firstChild?1:0;try{if(b&&a){d.div.focus()}}catch(f){}return b?c.firstChild:null},setStyle:function(b,g){var f=b.style,a,d,c=this;if(f&&g){for(a=0;a<g.length;a=a+2){try{f[g[a]]=g[a+1]}catch(d){}}}},insertDivInBody:function(i,g){var f,c=this,h="pd33993399",b=null,d=g?window.top.document:window.document,a=d.getElementsByTagName("body")[0]||d.body;if(!a){try{d.write('<div id="'+h+'">.'+c.openTag+"/div>");b=d.getElementById(h)}catch(f){}}a=d.getElementsByTagName("body")[0]||d.body;if(a){a.insertBefore(i,a.firstChild);if(b){a.removeChild(b)}}},insertHTML:function(f,b,g,a,k){var l,m=document,j=this,p,o=m.createElement("span"),n,i;var c=["outlineStyle","none","borderStyle","none","padding","0px","margin","0px","visibility","visible"];var h="outline-style:none;border-style:none;padding:0px;margin:0px;visibility:visible;";if(!j.isDefined(a)){a=""}if(j.isString(f)&&(/[^\s]/).test(f)){f=f.toLowerCase().replace(/\s/g,"");p=j.openTag+f+' width="'+j.pluginSize+'" height="'+j.pluginSize+'" ';p+='style="'+h+'display:inline;" ';for(n=0;n<b.length;n=n+2){if(/[^\s]/.test(b[n+1])){p+=b[n]+'="'+b[n+1]+'" '}}p+=">";for(n=0;n<g.length;n=n+2){if(/[^\s]/.test(g[n+1])){p+=j.openTag+'param name="'+g[n]+'" value="'+g[n+1]+'" />'}}p+=a+j.openTag+"/"+f+">"}else{p=a}if(!j.div){i=m.getElementById(j.divID);if(i){j.div=i}else{j.div=m.createElement("div");j.div.id=j.divID}j.setStyle(j.div,c.concat(["width",j.divWidth+"px","height",(j.pluginSize+3)+"px","fontSize",(j.pluginSize+3)+"px","lineHeight",(j.pluginSize+3)+"px","verticalAlign","baseline","display","block"]));if(!i){j.setStyle(j.div,["position","absolute","right","0px","top","0px"]);j.insertDivInBody(j.div)}}if(j.div&&j.div.parentNode){j.setStyle(o,c.concat(["fontSize",(j.pluginSize+3)+"px","lineHeight",(j.pluginSize+3)+"px","verticalAlign","baseline","display","inline"]));try{o.innerHTML=p}catch(l){};try{j.div.appendChild(o)}catch(l){};return{span:o,winLoaded:j.winLoaded,tagName:f,outerHTML:p}}return{span:null,winLoaded:j.winLoaded,tagName:"",outerHTML:p}},Plugins:{quicktime:{mimeType:["video/quicktime","application/x-quicktimeplayer","image/x-macpaint","image/x-quicktime"],progID:"QuickTimeCheckObject.QuickTimeCheck.1",progID0:"QuickTime.QuickTime",classID:"clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B",minIEver:7,HTML:'<param name="src" value="" /><param name="controller" value="false" />',getCodeBaseVersion:function(a){return'codebase="#version='+a+'"'},SEARCH:{min:0,max:0,match:0,digits:[16,128,128,0]},getVersion:function(c){var f=this,d=f.$,a=null,e=null,b;if(!d.isIE){if(d.hasMimeType(f.mimeType)){e=d.OS!=3?d.findNavPlugin("QuickTime.*Plug-?in",0):null;if(e&&e.name){a=d.getNum(e.name)}}}else{if(d.isStrNum(c)){b=c.split(d.splitNumRegx);if(b.length>3&&parseInt(b[3],10)>0){b[3]="9999"}c=b.join(",")}if(d.isStrNum(c)&&d.verIE>=f.minIEver&&f.canUseIsMin()>0){f.installed=f.isMin(c);f.getVersionDone=0;return}f.getVersionDone=1;if(!a&&d.verIE>=f.minIEver){a=f.CDBASE2VER(d.codebaseSearch(f))}if(!a){e=d.getAXO(f.progID);if(e&&e.QuickTimeVersion){a=e.QuickTimeVersion.toString(16);a=parseInt(a.charAt(0),16)+"."+parseInt(a.charAt(1),16)+"."+parseInt(a.charAt(2),16)}}}f.installed=a?1:(e?0:-1);f.version=d.formatNum(a,3)},cdbaseUpper:["7,60,0,0","0,0,0,0"],cdbaseLower:["7,50,0,0",null],cdbase2ver:[function(c,b){var a=b.split(c.$.splitNumRegx);return[a[0],a[1].charAt(0),a[1].charAt(1),a[2]].join(",")},null],CDBASE2VER:function(f){var e=this,c=e.$,b,a=e.cdbaseUpper,d=e.cdbaseLower;if(f){f=c.formatNum(f);for(b=0;b<a.length;b++){if(a[b]&&c.compareNums(f,a[b])<0&&d[b]&&c.compareNums(f,d[b])>=0&&e.cdbase2ver[b]){return e.cdbase2ver[b](e,f)}}}return f},canUseIsMin:function(){var f=this,d=f.$,b,c=f.canUseIsMin,a=f.cdbaseUpper,e=f.cdbaseLower;if(!c.value){c.value=-1;for(b=0;b<a.length;b++){if(a[b]&&d.codebaseSearch(f,a[b])){c.value=1;break}if(e[b]&&d.codebaseSearch(f,e[b])){c.value=-1;break}}}f.SEARCH.match=c.value==1?1:0;return c.value},isMin:function(c){var b=this,a=b.$;return a.codebaseSearch(b,c)?0.7:-1}},flash:{mimeType:"application/x-shockwave-flash",progID:"ShockwaveFlash.ShockwaveFlash",classID:"clsid:D27CDB6E-AE6D-11CF-96B8-444553540000",getVersion:function(){var b=function(i){if(!i){return null}var e=/[\d][\d\,\.\s]*[rRdD]{0,1}[\d\,]*/.exec(i);return e?e[0].replace(/[rRdD\.]/g,",").replace(/\s/g,""):null};var j=this,g=j.$,k,h,l=null,c=null,a=null,f,m,d;if(!g.isIE){m=g.hasMimeType(j.mimeType);if(m){f=g.getDOMobj(g.insertHTML("object",["type",j.mimeType],[],"",j));try{l=g.getNum(f.GetVariable("$version"))}catch(k){}}if(!l){d=m?m.enabledPlugin:null;if(d&&d.description){l=b(d.description)}if(l){l=g.getPluginFileVersion(d,l)}}}else{for(h=15;h>2;h--){c=g.getAXO(j.progID+"."+h);if(c){a=h.toString();break}}if(!c){c=g.getAXO(j.progID)}if(a=="6"){try{c.AllowScriptAccess="always"}catch(k){return"6,0,21,0"}}try{l=b(c.GetVariable("$version"))}catch(k){}if(!l&&a){l=a}}j.installed=l?1:-1;j.version=g.formatNum(l);return true}},shockwave:{mimeType:"application/x-director",progID:"SWCtl.SWCtl",classID:"clsid:166B1BCA-3F9C-11CF-8075-444553540000",getVersion:function(){var a=null,b=null,g,f,d=this,c=d.$;if(!c.isIE){f=c.findNavPlugin("Shockwave\\s*for\\s*Director");if(f&&f.description&&c.hasMimeType(d.mimeType)){a=c.getNum(f.description)}if(a){a=c.getPluginFileVersion(f,a)}}else{try{b=c.getAXO(d.progID).ShockwaveVersion("")}catch(g){}if(c.isString(b)&&b.length>0){a=c.getNum(b)}else{if(c.getAXO(d.progID+".8")){a="8"}else{if(c.getAXO(d.progID+".7")){a="7"}else{if(c.getAXO(d.progID+".1")){a="6"}}}}}d.installed=a?1:-1;d.version=c.formatNum(a)}},zz:0}};PluginDetect.initScript();

	var gArgCountErr='The "%%" function requires an even number of arguments.\nArguments should be in the form "atttributeName", "attributeValue", ...',gTagAttrs=null,gQTGeneratorVersion=1;function AC_QuickTimeVersion(){return gQTGeneratorVersion}function _QTComplain(a,b){b=b.replace("%%",a);alert(b)}function _QTAddAttribute(a,b,c){var d;d=gTagAttrs[a+b];null==d&&(d=gTagAttrs[b]);return null!=d?(0==b.indexOf(a)&&null==c&&(c=b.substring(a.length)),null==c&&(c=b),c+'="'+d+'" '):""}function _QTAddObjectAttr(a,b){if(0==a.indexOf("emb#"))return"";0==a.indexOf("obj#")&&null==b&&(b=a.substring(4));return _QTAddAttribute("obj#",a,b)}function _QTAddEmbedAttr(a,b){if(0==a.indexOf("obj#"))return"";0==a.indexOf("emb#")&&null==b&&(b=a.substring(4));return _QTAddAttribute("emb#",a,b)}function _QTAddObjectParam(a,b){var c,d="",e=b?" />":">";-1==a.indexOf("emb#")&&(c=gTagAttrs["obj#"+a],null==c&&(c=gTagAttrs[a]),0==a.indexOf("obj#")&&(a=a.substring(4)),null!=c&&(d='  <param name="'+a+'" value="'+c+'"'+e+"\n"));return d}function _QTDeleteTagAttrs(){for(var a=0;a<arguments.length;a++){var b=arguments[a];delete gTagAttrs[b];delete gTagAttrs["emb#"+b];delete gTagAttrs["obj#"+b]}}function _QTGenerate(a,b,c){if(4>c.length||0!=c.length%2)return _QTComplain(a,gArgCountErr),"";gTagAttrs=[];gTagAttrs.src=c[0];gTagAttrs.width=c[1];gTagAttrs.height=c[2];gTagAttrs.classid="clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B";gTagAttrs.pluginspage="http://www.apple.com/quicktime/download/";a=c[3];if(null==a||""==a)a="6,0,2,0";gTagAttrs.codebase="http://www.apple.com/qtactivex/qtplugin.cab#version="+a;for(var d,e=4;e<c.length;e+=2)d=c[e].toLowerCase(),a=c[e+1],"name"==d||"id"==d?gTagAttrs.name=a:gTagAttrs[d]=a;c="<object "+_QTAddObjectAttr("classid")+_QTAddObjectAttr("width")+_QTAddObjectAttr("height")+_QTAddObjectAttr("codebase")+_QTAddObjectAttr("name","id")+_QTAddObjectAttr("tabindex")+_QTAddObjectAttr("hspace")+_QTAddObjectAttr("vspace")+_QTAddObjectAttr("border")+_QTAddObjectAttr("align")+_QTAddObjectAttr("class")+_QTAddObjectAttr("title")+_QTAddObjectAttr("accesskey")+_QTAddObjectAttr("noexternaldata")+">\n"+_QTAddObjectParam("src",b);e="  <embed "+_QTAddEmbedAttr("src")+_QTAddEmbedAttr("width")+_QTAddEmbedAttr("height")+_QTAddEmbedAttr("pluginspage")+_QTAddEmbedAttr("name")+_QTAddEmbedAttr("align")+_QTAddEmbedAttr("tabindex");_QTDeleteTagAttrs("src","width","height","pluginspage","classid","codebase","name","tabindex","hspace","vspace","border","align","noexternaldata","class","title","accesskey");for(d in gTagAttrs)a=gTagAttrs[d],null!=a&&(e+=_QTAddEmbedAttr(d),c+=_QTAddObjectParam(d,b));return c+e+"> </embed>\n</object>"}function QT_GenerateOBJECTText(){return _QTGenerate("QT_GenerateOBJECTText",!1,arguments)};


	/*
		jQuery hashchange event v1.3
		https://github.com/cowboy/jquery-hashchange
		Copyright (c) 2010 "Cowboy" Ben Alman
		Dual licensed under the MIT and GPL licenses.
	*/
	(function(){function e(a){a=a||location.href;return"#"+a.replace(/^[^#]*#?(.*)$/,"$1")}var k=document,b,f=$.event.special,p=k.documentMode,m="oniLightBoxHashChange"in window&&(void 0===p||7<p);$.fn.iLightBoxHashChange=function(a){return a?this.bind("iLightBoxHashChange",a):this.trigger("iLightBoxHashChange")};$.fn.iLightBoxHashChange.delay=50;f.iLightBoxHashChange=$.extend(f.iLightBoxHashChange,{setup:function(){if(m)return!1;$(b.start)},teardown:function(){if(m)return!1;$(b.stop)}});b=function(){function a(){var c=
	e(),d=f(l);c!==l?(n(l=c,d),$(window).trigger("iLightBoxHashChange")):d!==l&&(location.href=location.href.replace(/#.*/,"")+d);g=setTimeout(a,$.fn.iLightBoxHashChange.delay)}var h={},g,l=e(),b=function(c){return c},n=b,f=b;h.start=function(){g||a()};h.stop=function(){g&&clearTimeout(g);g=void 0};browser.msie&&!m&&function(){var c,d;h.start=function(){c||(d=(d=$.fn.iLightBoxHashChange.src)&&d+e(),c=$('<iframe tabindex="-1" title="empty"/>').hide().one("load",function(){d||n(e());a()}).attr("src",d||
	"javascript:0").insertAfter("body")[0].contentWindow,k.onpropertychange=function(){try{"title"===event.propertyName&&(c.document.title=k.title)}catch(a){}})};h.stop=b;f=function(){return e(c.location.href)};n=function(a,d){var b=c.document,e=$.fn.iLightBoxHashChange.domain;a!==d&&(b.title=k.title,b.open(),e&&b.write('<script>document.domain="'+e+'"\x3c/script>'),b.close(),c.location.hash=a)}}();return h}()})();

	if (!Array.prototype.filter) {
		Array.prototype.filter = function(fun /*, thisp */ ) {
			"use strict";

			if (this == null)
				throw new TypeError();

			var t = Object(this);
			var len = t.length >>> 0;
			if (typeof fun != "function")
				throw new TypeError();

			var res = [];
			var thisp = arguments[1];
			for (var i = 0; i < len; i++) {
				if (i in t) {
					var val = t[i]; // in case fun mutates this
					if (fun.call(thisp, val, i, t))
						res.push(val);
				}
			}

			return res;
		};
	}

	if (!Array.prototype.indexOf) {
		Array.prototype.indexOf = function(searchElement, fromIndex) {
			var k;

			if (this == null) {
				throw new TypeError('"this" is null or not defined');
			}

			var O = Object(this);

			var len = O.length >>> 0;

			if (len === 0) {
				return -1;
			}

			var n = +fromIndex || 0;

			if (abs(n) === Infinity) {
				n = 0;
			}

			if (n >= len) {
				return -1;
			}

			k = max(n >= 0 ? n : len - abs(n), 0);

			while (k < len) {
				var kValue;
				if (k in O && O[k] === searchElement) {
					return k;
				}
				k++;
			}
			return -1;
		};
	}

	if (!Array.prototype.lastIndexOf) {
		Array.prototype.lastIndexOf = function(searchElement /*, fromIndex*/ ) {
			"use strict";

			if (this == null)
				throw new TypeError();

			var t = Object(this);
			var len = t.length >>> 0;
			if (len === 0)
				return -1;

			var n = len;
			if (arguments.length > 1) {
				n = Number(arguments[1]);
				if (n != n)
					n = 0;
				else if (n != 0 && n != (1 / 0) && n != -(1 / 0))
					n = (n > 0 || -1) * floor(abs(n));
			}

			var k = n >= 0 ? min(n, len - 1) : len - abs(n);

			for (; k >= 0; k--) {
				if (k in t && t[k] === searchElement)
					return k;
			}
			return -1;
		};
	}
})(jQuery, this);
/*
 * jQuery Superfish Menu Plugin - v1.7.4
 * Copyright (c) 2013 Joel Birch
 *
 * Dual licensed under the MIT and GPL licenses:
 *	http://www.opensource.org/licenses/mit-license.php
 *	http://www.gnu.org/licenses/gpl.html
 */

;(function ($) {
	"use strict";

	var methods = (function () {
		// private properties and methods go here
		var c = {
				bcClass: 'sf-breadcrumb',
				menuClass: 'sf-js-enabled',
				anchorClass: 'sf-with-ul',
				menuArrowClass: 'sf-arrows'
			},
			ios = (function () {
				var ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
				if (ios) {
					// iOS clicks only bubble as far as body children
					$(window).load(function () {
						$('body').children().on('click', $.noop);
					});
				}
				return ios;
			})(),
			wp7 = (function () {
				var style = document.documentElement.style;
				return ('behavior' in style && 'fill' in style && /iemobile/i.test(navigator.userAgent));
			})(),
			toggleMenuClasses = function ($menu, o) {
				var classes = c.menuClass;
				if (o.cssArrows) {
					classes += ' ' + c.menuArrowClass;
				}
				$menu.toggleClass(classes);
			},
			setPathToCurrent = function ($menu, o) {
				return $menu.find('li.' + o.pathClass).slice(0, o.pathLevels)
					.addClass(o.hoverClass + ' ' + c.bcClass)
						.filter(function () {
							return ($(this).children(o.popUpSelector).hide().show().length);
						}).removeClass(o.pathClass);
			},
			toggleAnchorClass = function ($li) {
				$li.children('a').toggleClass(c.anchorClass);
			},
			toggleTouchAction = function ($menu) {
				var touchAction = $menu.css('ms-touch-action');
				touchAction = (touchAction === 'pan-y') ? 'auto' : 'pan-y';
				$menu.css('ms-touch-action', touchAction);
			},
			applyHandlers = function ($menu, o) {
				var targets = 'li:has(' + o.popUpSelector + ')';
				if ($.fn.hoverIntent && !o.disableHI) {
					$menu.hoverIntent(over, out, targets);
				}
				else {
					$menu
						.on('mouseenter.superfish', targets, over)
						.on('mouseleave.superfish', targets, out);
				}
				var touchevent = 'MSPointerDown.superfish';
				if (!ios) {
					touchevent += ' touchend.superfish';
				}
				if (wp7) {
					touchevent += ' mousedown.superfish';
				}
				$menu
					.on('focusin.superfish', 'li', over)
					.on('focusout.superfish', 'li', out)
					.on(touchevent, 'a', o, touchHandler);
			},
			touchHandler = function (e) {
				var $this = $(this),
					$ul = $this.siblings(e.data.popUpSelector);

				if ($ul.length > 0 && $ul.is(':hidden')) {
					$this.one('click.superfish', false);
					if (e.type === 'MSPointerDown') {
						$this.trigger('focus');
					} else {
						$.proxy(over, $this.parent('li'))();
					}
				}
			},
			over = function () {
				var $this = $(this),
					o = getOptions($this);
				clearTimeout(o.sfTimer);
				$this.siblings().superfish('hide').end().superfish('show');
			},
			out = function () {
				var $this = $(this),
					o = getOptions($this);
				if (ios) {
					$.proxy(close, $this, o)();
				}
				else {
					clearTimeout(o.sfTimer);
					o.sfTimer = setTimeout($.proxy(close, $this, o), o.delay);
				}
			},
			close = function (o) {
				o.retainPath = ($.inArray(this[0], o.$path) > -1);
				this.superfish('hide');

				if (!this.parents('.' + o.hoverClass).length) {
					o.onIdle.call(getMenu(this));
					if (o.$path.length) {
						$.proxy(over, o.$path)();
					}
				}
			},
			getMenu = function ($el) {
				return $el.closest('.' + c.menuClass);
			},
			getOptions = function ($el) {
				return getMenu($el).data('sf-options');
			};

		return {
			// public methods
			hide: function (instant) {
				if (this.length) {
					var $this = this,
						o = getOptions($this);
					if (!o) {
						return this;
					}
					var not = (o.retainPath === true) ? o.$path : '',
						$ul = $this.find('li.' + o.hoverClass).add(this).not(not).removeClass(o.hoverClass).children(o.popUpSelector),
						speed = o.speedOut;

					if (instant) {
						$ul.show();
						speed = 0;
					}
					o.retainPath = false;
					o.onBeforeHide.call($ul);
					$ul.stop(true, true).animate(o.animationOut, speed, function () {
						var $this = $(this);
						o.onHide.call($this);
					});
				}
				return this;
			},
			show: function () {
				var o = getOptions(this);
				if (!o) {
					return this;
				}
				var $this = this.addClass(o.hoverClass),
					$ul = $this.children(o.popUpSelector);

				o.onBeforeShow.call($ul);
				$ul.stop(true, true).animate(o.animation, o.speed, function () {
					o.onShow.call($ul);
				});
				return this;
			},
			destroy: function () {
				return this.each(function () {
					var $this = $(this),
						o = $this.data('sf-options'),
						$hasPopUp;
					if (!o) {
						return false;
					}
					$hasPopUp = $this.find(o.popUpSelector).parent('li');
					clearTimeout(o.sfTimer);
					toggleMenuClasses($this, o);
					toggleAnchorClass($hasPopUp);
					toggleTouchAction($this);
					// remove event handlers
					$this.off('.superfish').off('.hoverIntent');
					// clear animation's inline display style
					$hasPopUp.children(o.popUpSelector).attr('style', function (i, style) {
						return style.replace(/display[^;]+;?/g, '');
					});
					// reset 'current' path classes
					o.$path.removeClass(o.hoverClass + ' ' + c.bcClass).addClass(o.pathClass);
					$this.find('.' + o.hoverClass).removeClass(o.hoverClass);
					o.onDestroy.call($this);
					$this.removeData('sf-options');
				});
			},
			init: function (op) {
				return this.each(function () {
					var $this = $(this);
					if ($this.data('sf-options')) {
						return false;
					}
					var o = $.extend({}, $.fn.superfish.defaults, op),
						$hasPopUp = $this.find(o.popUpSelector).parent('li');
					o.$path = setPathToCurrent($this, o);

					$this.data('sf-options', o);

					toggleMenuClasses($this, o);
					toggleAnchorClass($hasPopUp);
					toggleTouchAction($this);
					applyHandlers($this, o);

					$hasPopUp.not('.' + c.bcClass).superfish('hide', true);

					o.onInit.call(this);
				});
			}
		};
	})();

	$.fn.superfish = function (method, args) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		}
		else if (typeof method === 'object' || ! method) {
			return methods.init.apply(this, arguments);
		}
		else {
			return $.error('Method ' +  method + ' does not exist on jQuery.fn.superfish');
		}
	};

	$.fn.superfish.defaults = {
		popUpSelector: 'ul,.sf-mega', // within menu context
		hoverClass: 'sfHover',
		pathClass: 'overrideThisToUse',
		pathLevels: 1,
		delay: 800,
		animation: {opacity: 'show'},
		animationOut: {opacity: 'hide'},
		speed: 'normal',
		speedOut: 'fast',
		cssArrows: true,
		disableHI: false,
		onInit: $.noop,
		onBeforeShow: $.noop,
		onShow: $.noop,
		onBeforeHide: $.noop,
		onHide: $.noop,
		onIdle: $.noop,
		onDestroy: $.noop
	};

	// soon to be deprecated
	$.fn.extend({
		hideSuperfishUl: methods.hide,
		showSuperfishUl: methods.show
	});

})(jQuery);

/*
 *  jQuery OwlCarousel v1.3.3
 *
 *  Copyright (c) 2013 Bartosz Wojciechowski
 *  http://www.owlgraphic.com/owlcarousel/
 *
 *  Licensed under MIT
 *
 */

/*JS Lint helpers: */
/*global dragMove: false, dragEnd: false, $, jQuery, alert, window, document */
/*jslint nomen: true, continue:true */

if (typeof Object.create !== "function") {
    Object.create = function (obj) {
        function F() {}
        F.prototype = obj;
        return new F();
    };
}
(function ($, window, document) {

    var Carousel = {
        init : function (options, el) {
            var base = this;

            base.$elem = $(el);
            base.options = $.extend({}, $.fn.owlCarousel.options, base.$elem.data(), options);

            base.userOptions = options;
            base.loadContent();
        },

        loadContent : function () {
            var base = this, url;

            function getData(data) {
                var i, content = "";
                if (typeof base.options.jsonSuccess === "function") {
                    base.options.jsonSuccess.apply(this, [data]);
                } else {
                    for (i in data.owl) {
                        if (data.owl.hasOwnProperty(i)) {
                            content += data.owl[i].item;
                        }
                    }
                    base.$elem.html(content);
                }
                base.logIn();
            }

            if (typeof base.options.beforeInit === "function") {
                base.options.beforeInit.apply(this, [base.$elem]);
            }

            if (typeof base.options.jsonPath === "string") {
                url = base.options.jsonPath;
                $.getJSON(url, getData);
            } else {
                base.logIn();
            }
        },

        logIn : function () {
            var base = this;

            base.$elem.data("owl-originalStyles", base.$elem.attr("style"));
            base.$elem.data("owl-originalClasses", base.$elem.attr("class"));

            base.$elem.css({opacity: 0});
            base.orignalItems = base.options.items;
            base.checkBrowser();
            base.wrapperWidth = 0;
            base.checkVisible = null;
            base.setVars();
        },

        setVars : function () {
            var base = this;
            if (base.$elem.children().length === 0) {return false; }
            base.baseClass();
            base.eventTypes();
            base.$userItems = base.$elem.children();
            base.itemsAmount = base.$userItems.length;
            base.wrapItems();
            base.$owlItems = base.$elem.find(".owl-item");
            base.$owlWrapper = base.$elem.find(".owl-wrapper");
            base.playDirection = "next";
            base.prevItem = 0;
            base.prevArr = [0];
            base.currentItem = 0;
            base.customEvents();
            base.onStartup();
        },

        onStartup : function () {
            var base = this;
            base.updateItems();
            base.calculateAll();
            base.buildControls();
            base.updateControls();
            base.response();
            base.moveEvents();
            base.stopOnHover();
            base.owlStatus();

            if (base.options.transitionStyle !== false) {
                base.transitionTypes(base.options.transitionStyle);
            }
            if (base.options.autoPlay === true) {
                base.options.autoPlay = 5000;
            }
            base.play();

            base.$elem.find(".owl-wrapper").css("display", "block");

            if (!base.$elem.is(":visible")) {
                base.watchVisibility();
            } else {
                base.$elem.css("opacity", 1);
            }
            base.onstartup = false;
            base.eachMoveUpdate();
            if (typeof base.options.afterInit === "function") {
                base.options.afterInit.apply(this, [base.$elem]);
            }
        },

        eachMoveUpdate : function () {
            var base = this;

            if (base.options.lazyLoad === true) {
                base.lazyLoad();
            }
            if (base.options.autoHeight === true) {
                base.autoHeight();
            }
            base.onVisibleItems();

            if (typeof base.options.afterAction === "function") {
                base.options.afterAction.apply(this, [base.$elem]);
            }
        },

        updateVars : function () {
            var base = this;
            if (typeof base.options.beforeUpdate === "function") {
                base.options.beforeUpdate.apply(this, [base.$elem]);
            }
            base.watchVisibility();
            base.updateItems();
            base.calculateAll();
            base.updatePosition();
            base.updateControls();
            base.eachMoveUpdate();
            if (typeof base.options.afterUpdate === "function") {
                base.options.afterUpdate.apply(this, [base.$elem]);
            }
        },

        reload : function () {
            var base = this;
            window.setTimeout(function () {
                base.updateVars();
            }, 0);
        },

        watchVisibility : function () {
            var base = this;

            if (base.$elem.is(":visible") === false) {
                base.$elem.css({opacity: 0});
                window.clearInterval(base.autoPlayInterval);
                window.clearInterval(base.checkVisible);
            } else {
                return false;
            }
            base.checkVisible = window.setInterval(function () {
                if (base.$elem.is(":visible")) {
                    base.reload();
                    base.$elem.animate({opacity: 1}, 200);
                    window.clearInterval(base.checkVisible);
                }
            }, 500);
        },

        wrapItems : function () {
            var base = this;
            base.$userItems.wrapAll("<div class=\"owl-wrapper\">").wrap("<div class=\"owl-item\"></div>");
            base.$elem.find(".owl-wrapper").wrap("<div class=\"owl-wrapper-outer\">");
            base.wrapperOuter = base.$elem.find(".owl-wrapper-outer");
            base.$elem.css("display", "block");
        },

        baseClass : function () {
            var base = this,
                hasBaseClass = base.$elem.hasClass(base.options.baseClass),
                hasThemeClass = base.$elem.hasClass(base.options.theme);

            if (!hasBaseClass) {
                base.$elem.addClass(base.options.baseClass);
            }

            if (!hasThemeClass) {
                base.$elem.addClass(base.options.theme);
            }
        },

        updateItems : function () {
            var base = this, width, i;

            if (base.options.responsive === false) {
                return false;
            }
            if (base.options.singleItem === true) {
                base.options.items = base.orignalItems = 1;
                base.options.itemsCustom = false;
                base.options.itemsDesktop = false;
                base.options.itemsDesktopSmall = false;
                base.options.itemsTablet = false;
                base.options.itemsTabletSmall = false;
                base.options.itemsMobile = false;
                return false;
            }

            width = $(base.options.responsiveBaseWidth).width();

            if (width > (base.options.itemsDesktop[0] || base.orignalItems)) {
                base.options.items = base.orignalItems;
            }
            if (base.options.itemsCustom !== false) {
                //Reorder array by screen size
                base.options.itemsCustom.sort(function (a, b) {return a[0] - b[0]; });

                for (i = 0; i < base.options.itemsCustom.length; i += 1) {
                    if (base.options.itemsCustom[i][0] <= width) {
                        base.options.items = base.options.itemsCustom[i][1];
                    }
                }

            } else {

                if (width <= base.options.itemsDesktop[0] && base.options.itemsDesktop !== false) {
                    base.options.items = base.options.itemsDesktop[1];
                }

                if (width <= base.options.itemsDesktopSmall[0] && base.options.itemsDesktopSmall !== false) {
                    base.options.items = base.options.itemsDesktopSmall[1];
                }

                if (width <= base.options.itemsTablet[0] && base.options.itemsTablet !== false) {
                    base.options.items = base.options.itemsTablet[1];
                }

                if (width <= base.options.itemsTabletSmall[0] && base.options.itemsTabletSmall !== false) {
                    base.options.items = base.options.itemsTabletSmall[1];
                }

                if (width <= base.options.itemsMobile[0] && base.options.itemsMobile !== false) {
                    base.options.items = base.options.itemsMobile[1];
                }
            }

            //if number of items is less than declared
            if (base.options.items > base.itemsAmount && base.options.itemsScaleUp === true) {
                base.options.items = base.itemsAmount;
            }
        },

        response : function () {
            var base = this,
                smallDelay,
                lastWindowWidth;

            if (base.options.responsive !== true) {
                return false;
            }
            lastWindowWidth = $(window).width();

            base.resizer = function () {
                if ($(window).width() !== lastWindowWidth) {
                    if (base.options.autoPlay !== false) {
                        window.clearInterval(base.autoPlayInterval);
                    }
                    window.clearTimeout(smallDelay);
                    smallDelay = window.setTimeout(function () {
                        lastWindowWidth = $(window).width();
                        base.updateVars();
                    }, base.options.responsiveRefreshRate);
                }
            };
            $(window).resize(base.resizer);
        },

        updatePosition : function () {
            var base = this;
            base.jumpTo(base.currentItem);
            if (base.options.autoPlay !== false) {
                base.checkAp();
            }
        },

        appendItemsSizes : function () {
            var base = this,
                roundPages = 0,
                lastItem = base.itemsAmount - base.options.items;

            base.$owlItems.each(function (index) {
                var $this = $(this);
                $this
                    .css({"width": base.itemWidth})
                    .data("owl-item", Number(index));

                if (index % base.options.items === 0 || index === lastItem) {
                    if (!(index > lastItem)) {
                        roundPages += 1;
                    }
                }
                $this.data("owl-roundPages", roundPages);
            });
        },

        appendWrapperSizes : function () {
            var base = this,
                width = base.$owlItems.length * base.itemWidth;

            base.$owlWrapper.css({
                "width": width * 2,
                "left": 0
            });
            base.appendItemsSizes();
        },

        calculateAll : function () {
            var base = this;
            base.calculateWidth();
            base.appendWrapperSizes();
            base.loops();
            base.max();
        },

        calculateWidth : function () {
            var base = this;
            base.itemWidth = Math.round(base.$elem.width() / base.options.items);
        },

        max : function () {
            var base = this,
                maximum = ((base.itemsAmount * base.itemWidth) - base.options.items * base.itemWidth) * -1;
            if (base.options.items > base.itemsAmount) {
                base.maximumItem = 0;
                maximum = 0;
                base.maximumPixels = 0;
            } else {
                base.maximumItem = base.itemsAmount - base.options.items;
                base.maximumPixels = maximum;
            }
            return maximum;
        },

        min : function () {
            return 0;
        },

        loops : function () {
            var base = this,
                prev = 0,
                elWidth = 0,
                i,
                item,
                roundPageNum;

            base.positionsInArray = [0];
            base.pagesInArray = [];

            for (i = 0; i < base.itemsAmount; i += 1) {
                elWidth += base.itemWidth;
                base.positionsInArray.push(-elWidth);

                if (base.options.scrollPerPage === true) {
                    item = $(base.$owlItems[i]);
                    roundPageNum = item.data("owl-roundPages");
                    if (roundPageNum !== prev) {
                        base.pagesInArray[prev] = base.positionsInArray[i];
                        prev = roundPageNum;
                    }
                }
            }
        },

        buildControls : function () {
            var base = this;
            if (base.options.navigation === true || base.options.pagination === true) {
                base.owlControls = $("<div class=\"owl-controls\"/>").toggleClass("clickable", !base.browser.isTouch).appendTo(base.$elem);
            }
            if (base.options.pagination === true) {
                base.buildPagination();
            }
            if (base.options.navigation === true) {
                base.buildButtons();
            }
        },

        buildButtons : function () {
            var base = this,
                buttonsWrapper = $("<div class=\"owl-buttons\"/>");
            base.owlControls.append(buttonsWrapper);

            base.buttonPrev = $("<div/>", {
                "class" : "owl-prev",
                "html" : base.options.navigationText[0] || ""
            });

            base.buttonNext = $("<div/>", {
                "class" : "owl-next",
                "html" : base.options.navigationText[1] || ""
            });

            buttonsWrapper
                .append(base.buttonPrev)
                .append(base.buttonNext);

            buttonsWrapper.on("touchstart.owlControls mousedown.owlControls", "div[class^=\"owl\"]", function (event) {
                event.preventDefault();
            });

            buttonsWrapper.on("touchend.owlControls mouseup.owlControls", "div[class^=\"owl\"]", function (event) {
                event.preventDefault();
                if ($(this).hasClass("owl-next")) {
                    base.next();
                } else {
                    base.prev();
                }
            });
        },

        buildPagination : function () {
            var base = this;

            base.paginationWrapper = $("<div class=\"owl-pagination\"/>");
            base.owlControls.append(base.paginationWrapper);

            base.paginationWrapper.on("touchend.owlControls mouseup.owlControls", ".owl-page", function (event) {
                event.preventDefault();
                if (Number($(this).data("owl-page")) !== base.currentItem) {
                    base.goTo(Number($(this).data("owl-page")), true);
                }
            });
        },

        updatePagination : function () {
            var base = this,
                counter,
                lastPage,
                lastItem,
                i,
                paginationButton,
                paginationButtonInner;

            if (base.options.pagination === false) {
                return false;
            }

            base.paginationWrapper.html("");

            counter = 0;
            lastPage = base.itemsAmount - base.itemsAmount % base.options.items;

            for (i = 0; i < base.itemsAmount; i += 1) {
                if (i % base.options.items === 0) {
                    counter += 1;
                    if (lastPage === i) {
                        lastItem = base.itemsAmount - base.options.items;
                    }
                    paginationButton = $("<div/>", {
                        "class" : "owl-page"
                    });
                    paginationButtonInner = $("<span></span>", {
                        "text": base.options.paginationNumbers === true ? counter : "",
                        "class": base.options.paginationNumbers === true ? "owl-numbers" : ""
                    });
                    paginationButton.append(paginationButtonInner);

                    paginationButton.data("owl-page", lastPage === i ? lastItem : i);
                    paginationButton.data("owl-roundPages", counter);

                    base.paginationWrapper.append(paginationButton);
                }
            }
            base.checkPagination();
        },
        checkPagination : function () {
            var base = this;
            if (base.options.pagination === false) {
                return false;
            }
            base.paginationWrapper.find(".owl-page").each(function () {
                if ($(this).data("owl-roundPages") === $(base.$owlItems[base.currentItem]).data("owl-roundPages")) {
                    base.paginationWrapper
                        .find(".owl-page")
                        .removeClass("active");
                    $(this).addClass("active");
                }
            });
        },

        checkNavigation : function () {
            var base = this;

            if (base.options.navigation === false) {
                return false;
            }
            if (base.options.rewindNav === false) {
                if (base.currentItem === 0 && base.maximumItem === 0) {
                    base.buttonPrev.addClass("disabled");
                    base.buttonNext.addClass("disabled");
                } else if (base.currentItem === 0 && base.maximumItem !== 0) {
                    base.buttonPrev.addClass("disabled");
                    base.buttonNext.removeClass("disabled");
                } else if (base.currentItem === base.maximumItem) {
                    base.buttonPrev.removeClass("disabled");
                    base.buttonNext.addClass("disabled");
                } else if (base.currentItem !== 0 && base.currentItem !== base.maximumItem) {
                    base.buttonPrev.removeClass("disabled");
                    base.buttonNext.removeClass("disabled");
                }
            }
        },

        updateControls : function () {
            var base = this;
            base.updatePagination();
            base.checkNavigation();
            if (base.owlControls) {
                if (base.options.items >= base.itemsAmount) {
                    base.owlControls.hide();
                } else {
                    base.owlControls.show();
                }
            }
        },

        destroyControls : function () {
            var base = this;
            if (base.owlControls) {
                base.owlControls.remove();
            }
        },

        next : function (speed) {
            var base = this;

            if (base.isTransition) {
                return false;
            }

            base.currentItem += base.options.scrollPerPage === true ? base.options.items : 1;
            if (base.currentItem > base.maximumItem + (base.options.scrollPerPage === true ? (base.options.items - 1) : 0)) {
                if (base.options.rewindNav === true) {
                    base.currentItem = 0;
                    speed = "rewind";
                } else {
                    base.currentItem = base.maximumItem;
                    return false;
                }
            }
            base.goTo(base.currentItem, speed);
        },

        prev : function (speed) {
            var base = this;

            if (base.isTransition) {
                return false;
            }

            if (base.options.scrollPerPage === true && base.currentItem > 0 && base.currentItem < base.options.items) {
                base.currentItem = 0;
            } else {
                base.currentItem -= base.options.scrollPerPage === true ? base.options.items : 1;
            }
            if (base.currentItem < 0) {
                if (base.options.rewindNav === true) {
                    base.currentItem = base.maximumItem;
                    speed = "rewind";
                } else {
                    base.currentItem = 0;
                    return false;
                }
            }
            base.goTo(base.currentItem, speed);
        },

        goTo : function (position, speed, drag) {
            var base = this,
                goToPixel;

            if (base.isTransition) {
                return false;
            }
            if (typeof base.options.beforeMove === "function") {
                base.options.beforeMove.apply(this, [base.$elem]);
            }
            if (position >= base.maximumItem) {
                position = base.maximumItem;
            } else if (position <= 0) {
                position = 0;
            }

            base.currentItem = base.owl.currentItem = position;
            if (base.options.transitionStyle !== false && drag !== "drag" && base.options.items === 1 && base.browser.support3d === true) {
                base.swapSpeed(0);
                if (base.browser.support3d === true) {
                    base.transition3d(base.positionsInArray[position]);
                } else {
                    base.css2slide(base.positionsInArray[position], 1);
                }
                base.afterGo();
                base.singleItemTransition();
                return false;
            }
            goToPixel = base.positionsInArray[position];

            if (base.browser.support3d === true) {
                base.isCss3Finish = false;

                if (speed === true) {
                    base.swapSpeed("paginationSpeed");
                    window.setTimeout(function () {
                        base.isCss3Finish = true;
                    }, base.options.paginationSpeed);

                } else if (speed === "rewind") {
                    base.swapSpeed(base.options.rewindSpeed);
                    window.setTimeout(function () {
                        base.isCss3Finish = true;
                    }, base.options.rewindSpeed);

                } else {
                    base.swapSpeed("slideSpeed");
                    window.setTimeout(function () {
                        base.isCss3Finish = true;
                    }, base.options.slideSpeed);
                }
                base.transition3d(goToPixel);
            } else {
                if (speed === true) {
                    base.css2slide(goToPixel, base.options.paginationSpeed);
                } else if (speed === "rewind") {
                    base.css2slide(goToPixel, base.options.rewindSpeed);
                } else {
                    base.css2slide(goToPixel, base.options.slideSpeed);
                }
            }
            base.afterGo();
        },

        jumpTo : function (position) {
            var base = this;
            if (typeof base.options.beforeMove === "function") {
                base.options.beforeMove.apply(this, [base.$elem]);
            }
            if (position >= base.maximumItem || position === -1) {
                position = base.maximumItem;
            } else if (position <= 0) {
                position = 0;
            }
            base.swapSpeed(0);
            if (base.browser.support3d === true) {
                base.transition3d(base.positionsInArray[position]);
            } else {
                base.css2slide(base.positionsInArray[position], 1);
            }
            base.currentItem = base.owl.currentItem = position;
            base.afterGo();
        },

        afterGo : function () {
            var base = this;

            base.prevArr.push(base.currentItem);
            base.prevItem = base.owl.prevItem = base.prevArr[base.prevArr.length - 2];
            base.prevArr.shift(0);

            if (base.prevItem !== base.currentItem) {
                base.checkPagination();
                base.checkNavigation();
                base.eachMoveUpdate();

                if (base.options.autoPlay !== false) {
                    base.checkAp();
                }
            }
            if (typeof base.options.afterMove === "function" && base.prevItem !== base.currentItem) {
                base.options.afterMove.apply(this, [base.$elem]);
            }
        },

        stop : function () {
            var base = this;
            base.apStatus = "stop";
            window.clearInterval(base.autoPlayInterval);
        },

        checkAp : function () {
            var base = this;
            if (base.apStatus !== "stop") {
                base.play();
            }
        },

        play : function () {
            var base = this;
            base.apStatus = "play";
            if (base.options.autoPlay === false) {
                return false;
            }
            window.clearInterval(base.autoPlayInterval);
            base.autoPlayInterval = window.setInterval(function () {
                base.next(true);
            }, base.options.autoPlay);
        },

        swapSpeed : function (action) {
            var base = this;
            if (action === "slideSpeed") {
                base.$owlWrapper.css(base.addCssSpeed(base.options.slideSpeed));
            } else if (action === "paginationSpeed") {
                base.$owlWrapper.css(base.addCssSpeed(base.options.paginationSpeed));
            } else if (typeof action !== "string") {
                base.$owlWrapper.css(base.addCssSpeed(action));
            }
        },

        addCssSpeed : function (speed) {
            return {
                "-webkit-transition": "all " + speed + "ms ease",
                "-moz-transition": "all " + speed + "ms ease",
                "-o-transition": "all " + speed + "ms ease",
                "transition": "all " + speed + "ms ease"
            };
        },

        removeTransition : function () {
            return {
                "-webkit-transition": "",
                "-moz-transition": "",
                "-o-transition": "",
                "transition": ""
            };
        },

        doTranslate : function (pixels) {
            return {
                "-webkit-transform": "translate3d(" + pixels + "px, 0px, 0px)",
                "-moz-transform": "translate3d(" + pixels + "px, 0px, 0px)",
                "-o-transform": "translate3d(" + pixels + "px, 0px, 0px)",
                "-ms-transform": "translate3d(" + pixels + "px, 0px, 0px)",
                "transform": "translate3d(" + pixels + "px, 0px,0px)"
            };
        },

        transition3d : function (value) {
            var base = this;
            base.$owlWrapper.css(base.doTranslate(value));
        },

        css2move : function (value) {
            var base = this;
            base.$owlWrapper.css({"left" : value});
        },

        css2slide : function (value, speed) {
            var base = this;

            base.isCssFinish = false;
            base.$owlWrapper.stop(true, true).animate({
                "left" : value
            }, {
                duration : speed || base.options.slideSpeed,
                complete : function () {
                    base.isCssFinish = true;
                }
            });
        },

        checkBrowser : function () {
            var base = this,
                translate3D = "translate3d(0px, 0px, 0px)",
                tempElem = document.createElement("div"),
                regex,
                asSupport,
                support3d,
                isTouch;

            tempElem.style.cssText = "  -moz-transform:" + translate3D +
                                  "; -ms-transform:"     + translate3D +
                                  "; -o-transform:"      + translate3D +
                                  "; -webkit-transform:" + translate3D +
                                  "; transform:"         + translate3D;
            regex = /translate3d\(0px, 0px, 0px\)/g;
            asSupport = tempElem.style.cssText.match(regex);
            support3d = (asSupport !== null && asSupport.length === 1);

            isTouch = "ontouchstart" in window || window.navigator.msMaxTouchPoints;

            base.browser = {
                "support3d" : support3d,
                "isTouch" : isTouch
            };
        },

        moveEvents : function () {
            var base = this;
            if (base.options.mouseDrag !== false || base.options.touchDrag !== false) {
                base.gestures();
                base.disabledEvents();
            }
        },

        eventTypes : function () {
            var base = this,
                types = ["s", "e", "x"];

            base.ev_types = {};

            if (base.options.mouseDrag === true && base.options.touchDrag === true) {
                types = [
                    "touchstart.owl mousedown.owl",
                    "touchmove.owl mousemove.owl",
                    "touchend.owl touchcancel.owl mouseup.owl"
                ];
            } else if (base.options.mouseDrag === false && base.options.touchDrag === true) {
                types = [
                    "touchstart.owl",
                    "touchmove.owl",
                    "touchend.owl touchcancel.owl"
                ];
            } else if (base.options.mouseDrag === true && base.options.touchDrag === false) {
                types = [
                    "mousedown.owl",
                    "mousemove.owl",
                    "mouseup.owl"
                ];
            }

            base.ev_types.start = types[0];
            base.ev_types.move = types[1];
            base.ev_types.end = types[2];
        },

        disabledEvents :  function () {
            var base = this;
            base.$elem.on("dragstart.owl", function (event) { event.preventDefault(); });
            base.$elem.on("mousedown.disableTextSelect", function (e) {
                return $(e.target).is('input, textarea, select, option');
            });
        },

        gestures : function () {
            /*jslint unparam: true*/
            var base = this,
                locals = {
                    offsetX : 0,
                    offsetY : 0,
                    baseElWidth : 0,
                    relativePos : 0,
                    position: null,
                    minSwipe : null,
                    maxSwipe: null,
                    sliding : null,
                    dargging: null,
                    targetElement : null
                };

            base.isCssFinish = true;

            function getTouches(event) {
                if (event.touches !== undefined) {
                    return {
                        x : event.touches[0].pageX,
                        y : event.touches[0].pageY
                    };
                }

                if (event.touches === undefined) {
                    if (event.pageX !== undefined) {
                        return {
                            x : event.pageX,
                            y : event.pageY
                        };
                    }
                    if (event.pageX === undefined) {
                        return {
                            x : event.clientX,
                            y : event.clientY
                        };
                    }
                }
            }

            function swapEvents(type) {
                if (type === "on") {
                    $(document).on(base.ev_types.move, dragMove);
                    $(document).on(base.ev_types.end, dragEnd);
                } else if (type === "off") {
                    $(document).off(base.ev_types.move);
                    $(document).off(base.ev_types.end);
                }
            }

            function dragStart(event) {
                var ev = event.originalEvent || event || window.event,
                    position;

                if (ev.which === 3) {
                    return false;
                }
                if (base.itemsAmount <= base.options.items) {
                    return;
                }
                if (base.isCssFinish === false && !base.options.dragBeforeAnimFinish) {
                    return false;
                }
                if (base.isCss3Finish === false && !base.options.dragBeforeAnimFinish) {
                    return false;
                }

                if (base.options.autoPlay !== false) {
                    window.clearInterval(base.autoPlayInterval);
                }

                if (base.browser.isTouch !== true && !base.$owlWrapper.hasClass("grabbing")) {
                    base.$owlWrapper.addClass("grabbing");
                }

                base.newPosX = 0;
                base.newRelativeX = 0;

                $(this).css(base.removeTransition());

                position = $(this).position();
                locals.relativePos = position.left;

                locals.offsetX = getTouches(ev).x - position.left;
                locals.offsetY = getTouches(ev).y - position.top;

                swapEvents("on");

                locals.sliding = false;
                locals.targetElement = ev.target || ev.srcElement;
            }

            function dragMove(event) {
                var ev = event.originalEvent || event || window.event,
                    minSwipe,
                    maxSwipe;

                base.newPosX = getTouches(ev).x - locals.offsetX;
                base.newPosY = getTouches(ev).y - locals.offsetY;
                base.newRelativeX = base.newPosX - locals.relativePos;

                if (typeof base.options.startDragging === "function" && locals.dragging !== true && base.newRelativeX !== 0) {
                    locals.dragging = true;
                    base.options.startDragging.apply(base, [base.$elem]);
                }

                if ((base.newRelativeX > 8 || base.newRelativeX < -8) && (base.browser.isTouch === true)) {
                    if (ev.preventDefault !== undefined) {
                        ev.preventDefault();
                    } else {
                        ev.returnValue = false;
                    }
                    locals.sliding = true;
                }

                if ((base.newPosY > 10 || base.newPosY < -10) && locals.sliding === false) {
                    $(document).off("touchmove.owl");
                }

                minSwipe = function () {
                    return base.newRelativeX / 5;
                };

                maxSwipe = function () {
                    return base.maximumPixels + base.newRelativeX / 5;
                };

                base.newPosX = Math.max(Math.min(base.newPosX, minSwipe()), maxSwipe());
                if (base.browser.support3d === true) {
                    base.transition3d(base.newPosX);
                } else {
                    base.css2move(base.newPosX);
                }
            }

            function dragEnd(event) {
                var ev = event.originalEvent || event || window.event,
                    newPosition,
                    handlers,
                    owlStopEvent;

                ev.target = ev.target || ev.srcElement;

                locals.dragging = false;

                if (base.browser.isTouch !== true) {
                    base.$owlWrapper.removeClass("grabbing");
                }

                if (base.newRelativeX < 0) {
                    base.dragDirection = base.owl.dragDirection = "left";
                } else {
                    base.dragDirection = base.owl.dragDirection = "right";
                }

                if (base.newRelativeX !== 0) {
                    newPosition = base.getNewPosition();
                    base.goTo(newPosition, false, "drag");
                    if (locals.targetElement === ev.target && base.browser.isTouch !== true) {
                        $(ev.target).on("click.disable", function (ev) {
                            ev.stopImmediatePropagation();
                            ev.stopPropagation();
                            ev.preventDefault();
                            $(ev.target).off("click.disable");
                        });
                        handlers = $._data(ev.target, "events").click;
                        owlStopEvent = handlers.pop();
                        handlers.splice(0, 0, owlStopEvent);
                    }
                }
                swapEvents("off");
            }
            base.$elem.on(base.ev_types.start, ".owl-wrapper", dragStart);
        },

        getNewPosition : function () {
            var base = this,
                newPosition = base.closestItem();

            if (newPosition > base.maximumItem) {
                base.currentItem = base.maximumItem;
                newPosition  = base.maximumItem;
            } else if (base.newPosX >= 0) {
                newPosition = 0;
                base.currentItem = 0;
            }
            return newPosition;
        },
        closestItem : function () {
            var base = this,
                array = base.options.scrollPerPage === true ? base.pagesInArray : base.positionsInArray,
                goal = base.newPosX,
                closest = null;

            $.each(array, function (i, v) {
                if (goal - (base.itemWidth / 20) > array[i + 1] && goal - (base.itemWidth / 20) < v && base.moveDirection() === "left") {
                    closest = v;
                    if (base.options.scrollPerPage === true) {
                        base.currentItem = $.inArray(closest, base.positionsInArray);
                    } else {
                        base.currentItem = i;
                    }
                } else if (goal + (base.itemWidth / 20) < v && goal + (base.itemWidth / 20) > (array[i + 1] || array[i] - base.itemWidth) && base.moveDirection() === "right") {
                    if (base.options.scrollPerPage === true) {
                        closest = array[i + 1] || array[array.length - 1];
                        base.currentItem = $.inArray(closest, base.positionsInArray);
                    } else {
                        closest = array[i + 1];
                        base.currentItem = i + 1;
                    }
                }
            });
            return base.currentItem;
        },

        moveDirection : function () {
            var base = this,
                direction;
            if (base.newRelativeX < 0) {
                direction = "right";
                base.playDirection = "next";
            } else {
                direction = "left";
                base.playDirection = "prev";
            }
            return direction;
        },

        customEvents : function () {
            /*jslint unparam: true*/
            var base = this;
            base.$elem.on("owl.next", function () {
                base.next();
            });
            base.$elem.on("owl.prev", function () {
                base.prev();
            });
            base.$elem.on("owl.play", function (event, speed) {
                base.options.autoPlay = speed;
                base.play();
                base.hoverStatus = "play";
            });
            base.$elem.on("owl.stop", function () {
                base.stop();
                base.hoverStatus = "stop";
            });
            base.$elem.on("owl.goTo", function (event, item) {
                base.goTo(item);
            });
            base.$elem.on("owl.jumpTo", function (event, item) {
                base.jumpTo(item);
            });
        },

        stopOnHover : function () {
            var base = this;
            if (base.options.stopOnHover === true && base.browser.isTouch !== true && base.options.autoPlay !== false) {
                base.$elem.on("mouseover", function () {
                    base.stop();
                });
                base.$elem.on("mouseout", function () {
                    if (base.hoverStatus !== "stop") {
                        base.play();
                    }
                });
            }
        },

        lazyLoad : function () {
            var base = this,
                i,
                $item,
                itemNumber,
                $lazyImg,
                follow;

            if (base.options.lazyLoad === false) {
                return false;
            }
            for (i = 0; i < base.itemsAmount; i += 1) {
                $item = $(base.$owlItems[i]);

                if ($item.data("owl-loaded") === "loaded") {
                    continue;
                }

                itemNumber = $item.data("owl-item");
                $lazyImg = $item.find(".lazyOwl");

                if (typeof $lazyImg.data("src") !== "string") {
                    $item.data("owl-loaded", "loaded");
                    continue;
                }
                if ($item.data("owl-loaded") === undefined) {
                    $lazyImg.hide();
                    $item.addClass("loading").data("owl-loaded", "checked");
                }
                if (base.options.lazyFollow === true) {
                    follow = itemNumber >= base.currentItem;
                } else {
                    follow = true;
                }
                if (follow && itemNumber < base.currentItem + base.options.items && $lazyImg.length) {
                    base.lazyPreload($item, $lazyImg);
                }
            }
        },

        lazyPreload : function ($item, $lazyImg) {
            var base = this,
                iterations = 0,
                isBackgroundImg;

            if ($lazyImg.prop("tagName") === "DIV") {
                $lazyImg.css("background-image", "url(" + $lazyImg.data("src") + ")");
                isBackgroundImg = true;
            } else {
                $lazyImg[0].src = $lazyImg.data("src");
            }

            function showImage() {
                $item.data("owl-loaded", "loaded").removeClass("loading");
                $lazyImg.removeAttr("data-src");
                if (base.options.lazyEffect === "fade") {
                    $lazyImg.fadeIn(400);
                } else {
                    $lazyImg.show();
                }
                if (typeof base.options.afterLazyLoad === "function") {
                    base.options.afterLazyLoad.apply(this, [base.$elem]);
                }
            }

            function checkLazyImage() {
                iterations += 1;
                if (base.completeImg($lazyImg.get(0)) || isBackgroundImg === true) {
                    showImage();
                } else if (iterations <= 100) {//if image loads in less than 10 seconds 
                    window.setTimeout(checkLazyImage, 100);
                } else {
                    showImage();
                }
            }

            checkLazyImage();
        },

        autoHeight : function () {
            var base = this,
                $currentimg = $(base.$owlItems[base.currentItem]).find("img"),
                iterations;

            function addHeight() {
                var $currentItem = $(base.$owlItems[base.currentItem]).height();
                base.wrapperOuter.css("height", $currentItem + "px");
                if (!base.wrapperOuter.hasClass("autoHeight")) {
                    window.setTimeout(function () {
                        base.wrapperOuter.addClass("autoHeight");
                    }, 0);
                }
            }

            function checkImage() {
                iterations += 1;
                if (base.completeImg($currentimg.get(0))) {
                    addHeight();
                } else if (iterations <= 100) { //if image loads in less than 10 seconds 
                    window.setTimeout(checkImage, 100);
                } else {
                    base.wrapperOuter.css("height", ""); //Else remove height attribute
                }
            }

            if ($currentimg.get(0) !== undefined) {
                iterations = 0;
                checkImage();
            } else {
                addHeight();
            }
        },

        completeImg : function (img) {
            var naturalWidthType;

            if (!img.complete) {
                return false;
            }
            naturalWidthType = typeof img.naturalWidth;
            if (naturalWidthType !== "undefined" && img.naturalWidth === 0) {
                return false;
            }
            return true;
        },

        onVisibleItems : function () {
            var base = this,
                i;

            if (base.options.addClassActive === true) {
                base.$owlItems.removeClass("active");
            }
            base.visibleItems = [];
            for (i = base.currentItem; i < base.currentItem + base.options.items; i += 1) {
                base.visibleItems.push(i);

                if (base.options.addClassActive === true) {
                    $(base.$owlItems[i]).addClass("active");
                }
            }
            base.owl.visibleItems = base.visibleItems;
        },

        transitionTypes : function (className) {
            var base = this;
            //Currently available: "fade", "backSlide", "goDown", "fadeUp"
            base.outClass = "owl-" + className + "-out";
            base.inClass = "owl-" + className + "-in";
        },

        singleItemTransition : function () {
            var base = this,
                outClass = base.outClass,
                inClass = base.inClass,
                $currentItem = base.$owlItems.eq(base.currentItem),
                $prevItem = base.$owlItems.eq(base.prevItem),
                prevPos = Math.abs(base.positionsInArray[base.currentItem]) + base.positionsInArray[base.prevItem],
                origin = Math.abs(base.positionsInArray[base.currentItem]) + base.itemWidth / 2,
                animEnd = 'webkitAnimationEnd oAnimationEnd MSAnimationEnd animationend';

            base.isTransition = true;

            base.$owlWrapper
                .addClass('owl-origin')
                .css({
                    "-webkit-transform-origin" : origin + "px",
                    "-moz-perspective-origin" : origin + "px",
                    "perspective-origin" : origin + "px"
                });
            function transStyles(prevPos) {
                return {
                    "position" : "relative",
                    "left" : prevPos + "px"
                };
            }

            $prevItem
                .css(transStyles(prevPos, 10))
                .addClass(outClass)
                .on(animEnd, function () {
                    base.endPrev = true;
                    $prevItem.off(animEnd);
                    base.clearTransStyle($prevItem, outClass);
                });

            $currentItem
                .addClass(inClass)
                .on(animEnd, function () {
                    base.endCurrent = true;
                    $currentItem.off(animEnd);
                    base.clearTransStyle($currentItem, inClass);
                });
        },

        clearTransStyle : function (item, classToRemove) {
            var base = this;
            item.css({
                "position" : "",
                "left" : ""
            }).removeClass(classToRemove);

            if (base.endPrev && base.endCurrent) {
                base.$owlWrapper.removeClass('owl-origin');
                base.endPrev = false;
                base.endCurrent = false;
                base.isTransition = false;
            }
        },

        owlStatus : function () {
            var base = this;
            base.owl = {
                "userOptions"   : base.userOptions,
                "baseElement"   : base.$elem,
                "userItems"     : base.$userItems,
                "owlItems"      : base.$owlItems,
                "currentItem"   : base.currentItem,
                "prevItem"      : base.prevItem,
                "visibleItems"  : base.visibleItems,
                "isTouch"       : base.browser.isTouch,
                "browser"       : base.browser,
                "dragDirection" : base.dragDirection
            };
        },

        clearEvents : function () {
            var base = this;
            base.$elem.off(".owl owl mousedown.disableTextSelect");
            $(document).off(".owl owl");
            $(window).off("resize", base.resizer);
        },

        unWrap : function () {
            var base = this;
            if (base.$elem.children().length !== 0) {
                base.$owlWrapper.unwrap();
                base.$userItems.unwrap().unwrap();
                if (base.owlControls) {
                    base.owlControls.remove();
                }
            }
            base.clearEvents();
            base.$elem
                .attr("style", base.$elem.data("owl-originalStyles") || "")
                .attr("class", base.$elem.data("owl-originalClasses"));
        },

        destroy : function () {
            var base = this;
            base.stop();
            window.clearInterval(base.checkVisible);
            base.unWrap();
            base.$elem.removeData();
        },

        reinit : function (newOptions) {
            var base = this,
                options = $.extend({}, base.userOptions, newOptions);
            base.unWrap();
            base.init(options, base.$elem);
        },

        addItem : function (htmlString, targetPosition) {
            var base = this,
                position;

            if (!htmlString) {return false; }

            if (base.$elem.children().length === 0) {
                base.$elem.append(htmlString);
                base.setVars();
                return false;
            }
            base.unWrap();
            if (targetPosition === undefined || targetPosition === -1) {
                position = -1;
            } else {
                position = targetPosition;
            }
            if (position >= base.$userItems.length || position === -1) {
                base.$userItems.eq(-1).after(htmlString);
            } else {
                base.$userItems.eq(position).before(htmlString);
            }

            base.setVars();
        },

        removeItem : function (targetPosition) {
            var base = this,
                position;

            if (base.$elem.children().length === 0) {
                return false;
            }
            if (targetPosition === undefined || targetPosition === -1) {
                position = -1;
            } else {
                position = targetPosition;
            }

            base.unWrap();
            base.$userItems.eq(position).remove();
            base.setVars();
        }

    };

    $.fn.owlCarousel = function (options) {
        return this.each(function () {
            if ($(this).data("owl-init") === true) {
                return false;
            }
            $(this).data("owl-init", true);
            var carousel = Object.create(Carousel);
            carousel.init(options, this);
            $.data(this, "owlCarousel", carousel);
        });
    };

    $.fn.owlCarousel.options = {

        items : 5,
        itemsCustom : false,
        itemsDesktop : [1199, 4],
        itemsDesktopSmall : [979, 3],
        itemsTablet : [768, 2],
        itemsTabletSmall : false,
        itemsMobile : [479, 1],
        singleItem : false,
        itemsScaleUp : false,

        slideSpeed : 200,
        paginationSpeed : 800,
        rewindSpeed : 1000,

        autoPlay : false,
        stopOnHover : false,

        navigation : false,
        navigationText : ["prev", "next"],
        rewindNav : true,
        scrollPerPage : false,

        pagination : true,
        paginationNumbers : false,

        responsive : true,
        responsiveRefreshRate : 200,
        responsiveBaseWidth : window,

        baseClass : "owl-carousel",
        theme : "owl-theme",

        lazyLoad : false,
        lazyFollow : true,
        lazyEffect : "fade",

        autoHeight : false,

        jsonPath : false,
        jsonSuccess : false,

        dragBeforeAnimFinish : true,
        mouseDrag : true,
        touchDrag : true,

        addClassActive : false,
        transitionStyle : false,

        beforeUpdate : false,
        afterUpdate : false,
        beforeInit : false,
        afterInit : false,
        beforeMove : false,
        afterMove : false,
        afterAction : false,
        startDragging : false,
        afterLazyLoad: false
    };
}(jQuery, window, document));
/* Modernizr 2.6.2 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-cssanimations-csstransitions-touch-shiv-cssclasses-prefixed-teststyles-testprop-testallprops-prefixes-domprefixes-load
 */
;window.Modernizr=function(a,b,c){function z(a){j.cssText=a}function A(a,b){return z(m.join(a+";")+(b||""))}function B(a,b){return typeof a===b}function C(a,b){return!!~(""+a).indexOf(b)}function D(a,b){for(var d in a){var e=a[d];if(!C(e,"-")&&j[e]!==c)return b=="pfx"?e:!0}return!1}function E(a,b,d){for(var e in a){var f=b[a[e]];if(f!==c)return d===!1?a[e]:B(f,"function")?f.bind(d||b):f}return!1}function F(a,b,c){var d=a.charAt(0).toUpperCase()+a.slice(1),e=(a+" "+o.join(d+" ")+d).split(" ");return B(b,"string")||B(b,"undefined")?D(e,b):(e=(a+" "+p.join(d+" ")+d).split(" "),E(e,b,c))}var d="2.6.2",e={},f=!0,g=b.documentElement,h="modernizr",i=b.createElement(h),j=i.style,k,l={}.toString,m=" -webkit- -moz- -o- -ms- ".split(" "),n="Webkit Moz O ms",o=n.split(" "),p=n.toLowerCase().split(" "),q={},r={},s={},t=[],u=t.slice,v,w=function(a,c,d,e){var f,i,j,k,l=b.createElement("div"),m=b.body,n=m||b.createElement("body");if(parseInt(d,10))while(d--)j=b.createElement("div"),j.id=e?e[d]:h+(d+1),l.appendChild(j);return f=["&#173;",'<style id="s',h,'">',a,"</style>"].join(""),l.id=h,(m?l:n).innerHTML+=f,n.appendChild(l),m||(n.style.background="",n.style.overflow="hidden",k=g.style.overflow,g.style.overflow="hidden",g.appendChild(n)),i=c(l,a),m?l.parentNode.removeChild(l):(n.parentNode.removeChild(n),g.style.overflow=k),!!i},x={}.hasOwnProperty,y;!B(x,"undefined")&&!B(x.call,"undefined")?y=function(a,b){return x.call(a,b)}:y=function(a,b){return b in a&&B(a.constructor.prototype[b],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(b){var c=this;if(typeof c!="function")throw new TypeError;var d=u.call(arguments,1),e=function(){if(this instanceof e){var a=function(){};a.prototype=c.prototype;var f=new a,g=c.apply(f,d.concat(u.call(arguments)));return Object(g)===g?g:f}return c.apply(b,d.concat(u.call(arguments)))};return e}),q.touch=function(){var c;return"ontouchstart"in a||a.DocumentTouch&&b instanceof DocumentTouch?c=!0:w(["@media (",m.join("touch-enabled),("),h,")","{#modernizr{top:9px;position:absolute}}"].join(""),function(a){c=a.offsetTop===9}),c},q.cssanimations=function(){return F("animationName")},q.csstransitions=function(){return F("transition")};for(var G in q)y(q,G)&&(v=G.toLowerCase(),e[v]=q[G](),t.push((e[v]?"":"no-")+v));return e.addTest=function(a,b){if(typeof a=="object")for(var d in a)y(a,d)&&e.addTest(d,a[d]);else{a=a.toLowerCase();if(e[a]!==c)return e;b=typeof b=="function"?b():b,typeof f!="undefined"&&f&&(g.className+=" "+(b?"":"no-")+a),e[a]=b}return e},z(""),i=k=null,function(a,b){function k(a,b){var c=a.createElement("p"),d=a.getElementsByTagName("head")[0]||a.documentElement;return c.innerHTML="x<style>"+b+"</style>",d.insertBefore(c.lastChild,d.firstChild)}function l(){var a=r.elements;return typeof a=="string"?a.split(" "):a}function m(a){var b=i[a[g]];return b||(b={},h++,a[g]=h,i[h]=b),b}function n(a,c,f){c||(c=b);if(j)return c.createElement(a);f||(f=m(c));var g;return f.cache[a]?g=f.cache[a].cloneNode():e.test(a)?g=(f.cache[a]=f.createElem(a)).cloneNode():g=f.createElem(a),g.canHaveChildren&&!d.test(a)?f.frag.appendChild(g):g}function o(a,c){a||(a=b);if(j)return a.createDocumentFragment();c=c||m(a);var d=c.frag.cloneNode(),e=0,f=l(),g=f.length;for(;e<g;e++)d.createElement(f[e]);return d}function p(a,b){b.cache||(b.cache={},b.createElem=a.createElement,b.createFrag=a.createDocumentFragment,b.frag=b.createFrag()),a.createElement=function(c){return r.shivMethods?n(c,a,b):b.createElem(c)},a.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+l().join().replace(/\w+/g,function(a){return b.createElem(a),b.frag.createElement(a),'c("'+a+'")'})+");return n}")(r,b.frag)}function q(a){a||(a=b);var c=m(a);return r.shivCSS&&!f&&!c.hasCSS&&(c.hasCSS=!!k(a,"article,aside,figcaption,figure,footer,header,hgroup,nav,section{display:block}mark{background:#FF0;color:#000}")),j||p(a,c),a}var c=a.html5||{},d=/^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,e=/^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,f,g="_html5shiv",h=0,i={},j;(function(){try{var a=b.createElement("a");a.innerHTML="<xyz></xyz>",f="hidden"in a,j=a.childNodes.length==1||function(){b.createElement("a");var a=b.createDocumentFragment();return typeof a.cloneNode=="undefined"||typeof a.createDocumentFragment=="undefined"||typeof a.createElement=="undefined"}()}catch(c){f=!0,j=!0}})();var r={elements:c.elements||"abbr article aside audio bdi canvas data datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video",shivCSS:c.shivCSS!==!1,supportsUnknownElements:j,shivMethods:c.shivMethods!==!1,type:"default",shivDocument:q,createElement:n,createDocumentFragment:o};a.html5=r,q(b)}(this,b),e._version=d,e._prefixes=m,e._domPrefixes=p,e._cssomPrefixes=o,e.testProp=function(a){return D([a])},e.testAllProps=F,e.testStyles=w,e.prefixed=function(a,b,c){return b?F(a,b,c):F(a,"pfx")},g.className=g.className.replace(/(^|\s)no-js(\s|$)/,"$1$2")+(f?" js "+t.join(" "):""),e}(this,this.document),function(a,b,c){function d(a){return"[object Function]"==o.call(a)}function e(a){return"string"==typeof a}function f(){}function g(a){return!a||"loaded"==a||"complete"==a||"uninitialized"==a}function h(){var a=p.shift();q=1,a?a.t?m(function(){("c"==a.t?B.injectCss:B.injectJs)(a.s,0,a.a,a.x,a.e,1)},0):(a(),h()):q=0}function i(a,c,d,e,f,i,j){function k(b){if(!o&&g(l.readyState)&&(u.r=o=1,!q&&h(),l.onload=l.onreadystatechange=null,b)){"img"!=a&&m(function(){t.removeChild(l)},50);for(var d in y[c])y[c].hasOwnProperty(d)&&y[c][d].onload()}}var j=j||B.errorTimeout,l=b.createElement(a),o=0,r=0,u={t:d,s:c,e:f,a:i,x:j};1===y[c]&&(r=1,y[c]=[]),"object"==a?l.data=c:(l.src=c,l.type=a),l.width=l.height="0",l.onerror=l.onload=l.onreadystatechange=function(){k.call(this,r)},p.splice(e,0,u),"img"!=a&&(r||2===y[c]?(t.insertBefore(l,s?null:n),m(k,j)):y[c].push(l))}function j(a,b,c,d,f){return q=0,b=b||"j",e(a)?i("c"==b?v:u,a,b,this.i++,c,d,f):(p.splice(this.i++,0,a),1==p.length&&h()),this}function k(){var a=B;return a.loader={load:j,i:0},a}var l=b.documentElement,m=a.setTimeout,n=b.getElementsByTagName("script")[0],o={}.toString,p=[],q=0,r="MozAppearance"in l.style,s=r&&!!b.createRange().compareNode,t=s?l:n.parentNode,l=a.opera&&"[object Opera]"==o.call(a.opera),l=!!b.attachEvent&&!l,u=r?"object":l?"script":"img",v=l?"script":u,w=Array.isArray||function(a){return"[object Array]"==o.call(a)},x=[],y={},z={timeout:function(a,b){return b.length&&(a.timeout=b[0]),a}},A,B;B=function(a){function b(a){var a=a.split("!"),b=x.length,c=a.pop(),d=a.length,c={url:c,origUrl:c,prefixes:a},e,f,g;for(f=0;f<d;f++)g=a[f].split("="),(e=z[g.shift()])&&(c=e(c,g));for(f=0;f<b;f++)c=x[f](c);return c}function g(a,e,f,g,h){var i=b(a),j=i.autoCallback;i.url.split(".").pop().split("?").shift(),i.bypass||(e&&(e=d(e)?e:e[a]||e[g]||e[a.split("/").pop().split("?")[0]]),i.instead?i.instead(a,e,f,g,h):(y[i.url]?i.noexec=!0:y[i.url]=1,f.load(i.url,i.forceCSS||!i.forceJS&&"css"==i.url.split(".").pop().split("?").shift()?"c":c,i.noexec,i.attrs,i.timeout),(d(e)||d(j))&&f.load(function(){k(),e&&e(i.origUrl,h,g),j&&j(i.origUrl,h,g),y[i.url]=2})))}function h(a,b){function c(a,c){if(a){if(e(a))c||(j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}),g(a,j,b,0,h);else if(Object(a)===a)for(n in m=function(){var b=0,c;for(c in a)a.hasOwnProperty(c)&&b++;return b}(),a)a.hasOwnProperty(n)&&(!c&&!--m&&(d(j)?j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}:j[n]=function(a){return function(){var b=[].slice.call(arguments);a&&a.apply(this,b),l()}}(k[n])),g(a[n],j,b,n,h))}else!c&&l()}var h=!!a.test,i=a.load||a.both,j=a.callback||f,k=j,l=a.complete||f,m,n;c(h?a.yep:a.nope,!!i),i&&c(i)}var i,j,l=this.yepnope.loader;if(e(a))g(a,0,l,0);else if(w(a))for(i=0;i<a.length;i++)j=a[i],e(j)?g(j,0,l,0):w(j)?B(j):Object(j)===j&&h(j,l);else Object(a)===a&&h(a,l)},B.addPrefix=function(a,b){z[a]=b},B.addFilter=function(a){x.push(a)},B.errorTimeout=1e4,null==b.readyState&&b.addEventListener&&(b.readyState="loading",b.addEventListener("DOMContentLoaded",A=function(){b.removeEventListener("DOMContentLoaded",A,0),b.readyState="complete"},0)),a.yepnope=k(),a.yepnope.executeStack=h,a.yepnope.injectJs=function(a,c,d,e,i,j){var k=b.createElement("script"),l,o,e=e||B.errorTimeout;k.src=a;for(o in d)k.setAttribute(o,d[o]);c=j?h:c||f,k.onreadystatechange=k.onload=function(){!l&&g(k.readyState)&&(l=1,c(),k.onload=k.onreadystatechange=null)},m(function(){l||(l=1,c(1))},e),i?k.onload():n.parentNode.insertBefore(k,n)},a.yepnope.injectCss=function(a,c,d,e,g,i){var e=b.createElement("link"),j,c=i?h:c||f;e.href=a,e.rel="stylesheet",e.type="text/css";for(j in d)e.setAttribute(j,d[j]);g||(n.parentNode.insertBefore(e,n),m(c,0))}}(this,document),Modernizr.load=function(){yepnope.apply(window,[].slice.call(arguments,0))};
/**
 * jquery.dlmenu.js v1.0.1
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2013, Codrops
 * http://www.codrops.com
 */
;( function( $, window, undefined ) {

	'use strict';

	// global
	var Modernizr = window.Modernizr, $body = $( 'body' );

	$.DLMenu = function( options, element ) {
		this.$el = $( element );
		this._init( options );
	};

	// the options
	$.DLMenu.defaults = {
		// classes for the animation effects
		animationClasses : { classin : 'dl-animate-in-1', classout : 'dl-animate-out-1' },
		// callback: click a link that has a sub menu
		// el is the link element (li); name is the level name
		onLevelClick : function( el, name ) { return false; },
		// callback: click a link that does not have a sub menu
		// el is the link element (li); ev is the event obj
		onLinkClick : function( el, ev ) { return false; }
	};

	$.DLMenu.prototype = {
		_init : function( options ) {

			// options
			this.options = $.extend( true, {}, $.DLMenu.defaults, options );
			// cache some elements and initialize some variables
			this._config();
			
			var animEndEventNames = {
					'WebkitAnimation' : 'webkitAnimationEnd',
					'OAnimation' : 'oAnimationEnd',
					'msAnimation' : 'MSAnimationEnd',
					'animation' : 'animationend'
				},
				transEndEventNames = {
					'WebkitTransition' : 'webkitTransitionEnd',
					'MozTransition' : 'transitionend',
					'OTransition' : 'oTransitionEnd',
					'msTransition' : 'MSTransitionEnd',
					'transition' : 'transitionend'
				};
			// animation end event name
			this.animEndEventName = animEndEventNames[ Modernizr.prefixed( 'animation' ) ] + '.dlmenu';
			// transition end event name
			this.transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ] + '.dlmenu',
			// support for css animations and css transitions
			this.supportAnimations = Modernizr.cssanimations,
			this.supportTransitions = Modernizr.csstransitions;

			this._initEvents();

		},
		_config : function() {
			this.open = false;
			this.$trigger = this.$el.children( '.dl-trigger' );
			this.$menu = this.$el.children( 'ul.dl-menu' );
			this.$menuitems = this.$menu.find( 'li:not(.dl-back)' );
			this.$el.find( 'ul.dl-submenu' ).prepend( '<li class="dl-back"><a href="#">back</a></li>' );
			this.$back = this.$menu.find( 'li.dl-back' );
		},
		_initEvents : function() {

			var self = this;

			this.$trigger.on( 'click.dlmenu', function() {
				
				if( self.open ) {
					self._closeMenu();
				} 
				else {
					self._openMenu();
				}
				return false;

			} );

			this.$menuitems.on( 'click.dlmenu', function( event ) {
				
				event.stopPropagation();

				var $item = $(this),
					$submenu = $item.children( 'ul.dl-submenu' );

				if( $submenu.length > 0 ) {

					var $flyin = $submenu.clone().css( 'opacity', 0 ).insertAfter( self.$menu ),
						onAnimationEndFn = function() {
							self.$menu.off( self.animEndEventName ).removeClass( self.options.animationClasses.classout ).addClass( 'dl-subview' );
							$item.addClass( 'dl-subviewopen' ).parents( '.dl-subviewopen:first' ).removeClass( 'dl-subviewopen' ).addClass( 'dl-subview' );
							$flyin.remove();
						};

					setTimeout( function() {
						$flyin.addClass( self.options.animationClasses.classin );
						self.$menu.addClass( self.options.animationClasses.classout );
						if( self.supportAnimations ) {
							self.$menu.on( self.animEndEventName, onAnimationEndFn );
						}
						else {
							onAnimationEndFn.call();
						}

						self.options.onLevelClick( $item, $item.children( 'a:first' ).text() );
					} );

					return false;

				}
				else {
					self.options.onLinkClick( $item, event );
				}

			} );

			this.$back.on( 'click.dlmenu', function( event ) {
				
				var $this = $( this ),
					$submenu = $this.parents( 'ul.dl-submenu:first' ),
					$item = $submenu.parent(),

					$flyin = $submenu.clone().insertAfter( self.$menu );

				var onAnimationEndFn = function() {
					self.$menu.off( self.animEndEventName ).removeClass( self.options.animationClasses.classin );
					$flyin.remove();
				};

				setTimeout( function() {
					$flyin.addClass( self.options.animationClasses.classout );
					self.$menu.addClass( self.options.animationClasses.classin );
					if( self.supportAnimations ) {
						self.$menu.on( self.animEndEventName, onAnimationEndFn );
					}
					else {
						onAnimationEndFn.call();
					}

					$item.removeClass( 'dl-subviewopen' );
					
					var $subview = $this.parents( '.dl-subview:first' );
					if( $subview.is( 'li' ) ) {
						$subview.addClass( 'dl-subviewopen' );
					}
					$subview.removeClass( 'dl-subview' );
				} );

				return false;

			} );
			
		},
		closeMenu : function() {
			if( this.open ) {
				this._closeMenu();
			}
		},
		_closeMenu : function() {
			var self = this,
				onTransitionEndFn = function() {
					self.$menu.off( self.transEndEventName );
					self._resetMenu();
				};
			
			this.$menu.removeClass( 'dl-menuopen' );
			this.$menu.addClass( 'dl-menu-toggle' );
			this.$trigger.removeClass( 'dl-active' );
			
			if( this.supportTransitions ) {
				this.$menu.on( this.transEndEventName, onTransitionEndFn );
			}
			else {
				onTransitionEndFn.call();
			}

			this.open = false;
		},
		openMenu : function() {
			if( !this.open ) {
				this._openMenu();
			}
		},
		_openMenu : function() {
			var self = this;
			// clicking somewhere else makes the menu close
			$body.off( 'click' ).on( 'click.dlmenu', function() {
				self._closeMenu() ;
			} );
			this.$menu.addClass( 'dl-menuopen dl-menu-toggle' ).on( this.transEndEventName, function() {
				$( this ).removeClass( 'dl-menu-toggle' );
			} );
			this.$trigger.addClass( 'dl-active' );
			this.open = true;
		},
		// resets the menu to its original state (first level of options)
		_resetMenu : function() {
			this.$menu.removeClass( 'dl-subview' );
			this.$menuitems.removeClass( 'dl-subview dl-subviewopen' );
		}
	};

	var logError = function( message ) {
		if ( window.console ) {
			window.console.error( message );
		}
	};

	$.fn.dlmenu = function( options ) {
		if ( typeof options === 'string' ) {
			var args = Array.prototype.slice.call( arguments, 1 );
			this.each(function() {
				var instance = $.data( this, 'dlmenu' );
				if ( !instance ) {
					logError( "cannot call methods on dlmenu prior to initialization; " +
					"attempted to call method '" + options + "'" );
					return;
				}
				if ( !$.isFunction( instance[options] ) || options.charAt(0) === "_" ) {
					logError( "no such method '" + options + "' for dlmenu instance" );
					return;
				}
				instance[ options ].apply( instance, args );
			});
		} 
		else {
			this.each(function() {	
				var instance = $.data( this, 'dlmenu' );
				if ( instance ) {
					instance._init();
				}
				else {
					instance = $.data( this, 'dlmenu', new $.DLMenu( options, this ) );
				}
			});
		}
		return this;
	};

} )( jQuery, window );
/* Scrollport.js 1.0.0 — Plugin for something more interesting then usual scroll to. Author: Sergey Dmitriev (serdmi.com). Licensed MIT. */
(function(){!function(t){var o,n;return o=function(){function o(o,n,i,s){var r,e,l;if(r=this._normalize_args(o,n,i,s),this.$container=r.$container,this.target=r.target,l=r.init_options,this._is_window=!this.$container[0].nodeName||-1!==t.inArray(this.$container[0].nodeName.toLowerCase(),["iframe","#document","html","body"]),this._is_window&&(this.$container=t(this.$container[0].contentWindow||window),l.container=this.$container),this._$container_for_scroll=this.$container.is(t(window))?t("body, html"):this.$container,l=this._normalize_options(l),this.options=t.extend(!0,{},this.constructor.defaults,l),this.options=this._normalize_mode_options(this.options),null==this.target)return t.extend(!0,this.constructor.defaults,l),this._set_status("cancel"),this;if(this._is_in_motion()){if(!this.constructor.last_scrollport.options.interrupt_scrollport)return this._set_status("cancel"),this;this.constructor.last_scrollport.stop("interrupt")}return this.final_position=this._get_final_position(this.target),this.final_position.top_distance+this.final_position.left_distance===0?(this._set_status("cancel"),this):(e=this._$container_for_scroll.offset(),this.scroll_position={top:this.$container.scrollTop(),left:this.$container.scrollLeft()},this.constructor.last_scrollport=this,this._do_scroll(this.final_position))}return o.defaults={mode:"usual",interrupt:null,interrupt_user:!0,interrupt_scrollport:!0,container:t(window),delta:{top:0,left:0},on_start:null,on_stop:null,on_interrupt:null,on_finish:null},o.prototype._normalize_args=function(o,n,i,s){var r,e;return r={},e=null,null!=s?(r=s,e={top:parseFloat(n),left:parseFloat(i)}):null!=i?!isNaN(parseFloat(i))&&isFinite(i)?e={top:parseFloat(n),left:parseFloat(i)}:(r=i,e=!isNaN(parseFloat(n))&&isFinite(n)?{top:parseFloat(n)}:n):null!=n&&(!isNaN(parseFloat(n))&&isFinite(n)?e={top:parseFloat(n)}:"object"!=typeof n||n instanceof jQuery?e=n:r=n),null==o&&(o=null!=r.container?r.container:t(window)),r.container=o,{$container:o,target:e,init_options:r}},o.last_scrollport=!1,o.prototype.status="init",o.prototype._is_window=function(o){return!o.nodeName||-1!==t.inArray(o.nodeName.toLowerCase(),["iframe","#document","html","body"])},o.prototype._get_final_position=function(o){var n,i,s,r,e,l,a,c,_,p,u,f,d,h,g,$,m;return f=this.$container.scrollTop(),u=this.$container.scrollLeft(),o instanceof jQuery||"object"==typeof o?o instanceof jQuery&&(n=o):n=t(o),r=this._$container_for_scroll.offset(),a=r.top,s=r.left,e=this._$container_for_scroll[0].scrollHeight,l=this._$container_for_scroll[0].scrollWidth,i=this.$container.innerHeight(),c=this.$container.innerWidth(),null!=n?(h=n.offset(),g=h.top-this.options.delta.top,d=h.left-this.options.delta.left):(g=null!=o.top?o.top-this.options.delta.top:f,d=null!=o.left?o.left-this.options.delta.left:u),c>=l?(_=0,p=0):(_=d+(this._is_window?0:u)-s,_>l-c&&(_=l-c),p=_-u),i>=e?($=0,m=0):($=g+(this._is_window?0:f)-a,$>e-i&&($=e-i),m=$-f),{top:$,left:_,top_distance:m,left_distance:p}},o.prototype._get_distance_betwin_points=function(t,o,n,i){var s,r;return r=i-o,s=n-t,Math.sqrt(r*r+s*s)},o.prototype._get_point_betwin_points=function(t,o,n,i,s){var r,e,l,a;return a=i-o,l=n-t,r=Math.sqrt(a*a+l*l),0>s&&(s=r+s),e=s/r,{left:t+l*e,top:o+a*e}},o.prototype._modes={usual:{defaults:{easing:"swing",duration:700},do_scroll:function(t,o){return t._$container_for_scroll.stop(!0).animate({scrollTop:o.top,scrollLeft:o.left},t.options.duration,t.options.easing,function(){return t._$container_for_scroll.last().is(this)?t.stop("finish"):void 0})},stop_scroll:function(t,o){return t._$container_for_scroll.stop(!0),t._set_status(o),t._call_end_callbacks()}},roll:{defaults:{easing:"swing",speed:2500,max_duration:700,min_duration:300},do_scroll:function(t,o){var n,i;return n=Math.sqrt(o.top_distance*o.top_distance+o.left_distance*o.left_distance),i=n/t.options.speed*1e3,t.options.max_duration&&i<t.options.min_duration&&(i=t.options.min_duration),t.options.min_duration&&i>t.options.max_duration&&(i=t.options.max_duration),t._$container_for_scroll.stop(!0).animate({scrollTop:o.top,scrollLeft:o.left},i,t.options.easing,function(){return t._$container_for_scroll.last().is(this)?t.stop("finish"):void 0}),t},stop_scroll:function(t,o){return t._$container_for_scroll.stop(!0),t._set_status(o),t._call_end_callbacks()}},hard:{defaults:{easing:"swing",distance:5,duration:100},do_scroll:function(t,o){var n;return n=t._get_point_betwin_points(t.scroll_position.left,t.scroll_position.top,o.left,o.top,-t.options.distance),t._$container_for_scroll.scrollTop(n.top).scrollLeft(n.left),t._$container_for_scroll.stop(!0).animate({scrollTop:o.top,scrollLeft:o.left},t.options.duration,t.options.easing,function(){return t._$container_for_scroll.last().is(this)?t.stop("finish"):void 0}),t},stop_scroll:function(t,o){return t._$container_for_scroll.stop(!0),t._set_status(o),t._call_end_callbacks()}},soft:{defaults:{easing:null,easing_before:"swing",easing_after:"swing",distance:null,distance_before:200,distance_after:200,duration:null,duration_before:200,duration_after:400,speed:null,waiting:100},do_scroll:function(n,i){var s,r,e,l;return l=Math.sqrt(i.top_distance*i.top_distance+i.left_distance*i.left_distance),l<1.5*(n.options.distance_before+n.options.distance_before)?null!=n.target.top?null!=n.target.left?new o(n.$container,n.target.top,n.target.left,t.extend(!0,{},n.options,{mode:"roll",speed:n.options.speed})):new o(n.$container,n.target.top,t.extend(!0,{},n.options,{mode:"roll",speed:n.options.speed})):new o(n.$container,n.target,t.extend(!0,{},n.options,{mode:"roll",speed:n.options.speed})):(e=n._get_point_betwin_points(n.scroll_position.left,n.scroll_position.top,i.left,i.top,n.options.distance_before),r=n._get_point_betwin_points(n.scroll_position.left,n.scroll_position.top,i.left,i.top,-n.options.distance_after),s=n._get_or_create_overlay(),s.stop(!0).show().animate({opacity:1},n.options.duration_before),n._$container_for_scroll.stop(!0).animate({scrollTop:e.top,scrollLeft:e.left},n.options.duration_before,n.options.easing_before,function(){return n._$container_for_scroll.last().is(this)?(n._$container_for_scroll.scrollTop(r.top).scrollLeft(r.left),s.animate({opacity:1},n.options.waiting,function(){return s.stop(!0).animate({opacity:0},n.options.duration_after,function(){return s.hide()}),n._$container_for_scroll.stop(!0).animate({scrollTop:i.top,scrollLeft:i.left},n.options.duration_after,n.options.easing_after,function(){return n._$container_for_scroll.last().is(this)?n.stop("finish"):void 0})})):void 0}),n)},stop_scroll:function(t,o){var n,i,s;return n=t._get_or_create_overlay(),"none"===n.css("display")?(t._set_status(o),void t._call_end_callbacks()):(s=parseFloat(n.css("opacity")),i=t.options.duration_after*s,t._$container_for_scroll.stop(!0),t._set_status(o),t._call_end_callbacks(),n.stop(!0).animate({opacity:0},i,function(){return n.hide()}))}}},o.prototype.stop=function(t){return this._modes[this.options.mode].stop_scroll(this,t),this._$container_for_scroll.off("mousewheel.scrollport DOMMouseScroll.scrollport")},o.prototype._do_scroll=function(t){var o;return o=this,this._$container_for_scroll.on("mousewheel.scrollport DOMMouseScroll.scrollport",function(t){return o.options.interrupt_user?(o._$container_for_scroll.off("mousewheel.scrollport DOMMouseScroll.scrollport"),o.stop("interrupt")):t.preventDefault()}),this._set_status("motion"),null!=this.options.on_start&&this.options.on_start.call(this._$container_for_scroll,this),this._modes[this.options.mode].do_scroll(this,t)},o.prototype._set_status=function(t){return this.status=t},o.prototype._is_in_motion=function(){return!!this.constructor.last_scrollport&&"motion"===this.constructor.last_scrollport.status},o.prototype._call_end_callbacks=function(){return null!=this.options.on_stop&&this.options.on_stop.call(this._$container_for_scroll,this),null!=this.options.on_finish&&"finish"===this.status&&this.options.on_finish.call(this._$container_for_scroll,this),null!=this.options.on_interrupt&&"interrupt"===this.status?this.options.on_interrupt.call(this._$container_for_scroll,this):void 0},o.prototype._get_or_create_overlay=function(){return null!=this.constructor._$overlay&&t(".scrollport-overlay").length?this.constructor._$overlay.css({width:this._$container_for_scroll[0].scrollWidth,height:this._$container_for_scroll[0].scrollHeight}):(this.constructor._$overlay=t("<div>").attr("class","scrollport-overlay").hide().appendTo(this._$container_for_scroll.first()).css({backgroundColor:"#ffffff",width:this._$container_for_scroll[0].scrollWidth,height:this._$container_for_scroll[0].scrollHeight,top:"0",left:"0",position:"absolute",opacity:0}),this.constructor._$overlay)},o.prototype._normalize_options=function(t){return null!=t.delta&&("object"==typeof t.delta?(t.delta.top=null!=t.delta.top?parseFloat(t.delta.top):0,t.delta.left=null!=t.delta.left?parseFloat(t.delta.left):0):t.delta={top:t.delta,left:0}),null!=t.interrupt&&(t.interrupt_user=t.interrupt,t.interrupt_scrollport=t.interrupt),t},o.prototype._normalize_mode_options=function(o){return o=t.extend(!0,{},this._modes[this.options.mode].defaults,o),"soft"===o.mode&&(null!=o.distance&&(o.distance_before=o.distance,o.distance_after=o.distance),null!=o.duration&&(o.duration_before=o.duration,o.duration_after=o.duration),null!=o.easing&&(o.easing_before=o.easing,o.easing_after=o.easing),null==o.speed&&(o.speed=(o.distance_before+o.distance_after)/(o.duration_before+o.duration_after)*1e3)),o},o}(),n=function(){function n(n,i,s,r,e){var l,a,c,_,p,u,f;if(u=this,l=this._normalize_args(i,s,r,e),this.$link=n,this.target=l.target,this.$container=l.$container,f=l.scrollport_options,null==this.target){for(c=["data-scrollport","href","data-href"],_=!1,p=0;!_&&p<c.length;)a=this.$link.attr(c[p]),null!=a&&""!==a&&(_=!0),p++;if(!_)return;this.target=t(a)}this.$link.on("click",function(t){return t.preventDefault(),null!=this.target.top?null!=this.target.left?new o(u.$container,u.target.top,u.target.left,f):new o(u.$container,u.target.top,f):new o(u.$container,u.target,f)})}return n.prototype._normalize_args=function(t,o,n,i){var s,r,e;return s=null,r={},e=null,null!=i?(r=i,s=n,e={top:t,left:o}):null!=n?n instanceof jQuery?(s=n,e={top:t,left:o}):(r=n,o instanceof jQuery?(s=o,e=!isNaN(parseFloat(t))&&isFinite(t)?{top:t}:t):e={top:t,left:o}):null!=o?!isNaN(parseFloat(o))&&isFinite(o)?e={top:t,left:o}:o instanceof jQuery?(s=o,e=!isNaN(parseFloat(t))&&isFinite(t)?{top:t}:t):(r=o,e=!isNaN(parseFloat(t))&&isFinite(t)?{top:t}:t):null!=t&&(!isNaN(parseFloat(t))&&isFinite(t)?e={top:t}:"object"!=typeof t||t instanceof jQuery?e=t:r=t),{$container:s,target:e,scrollport_options:r}},n}(),t.scrollport=function(t,n,i){return new o(null,t,n,i)},t.fn.scrollport=function(t,n,i){return new o(this.first(),t,n,i),this},t.fn.scrollport_link=function(o,i,s,r){return this.each(function(){return new n(t(this),o,i,s,r)})},t(function(){return t("[data-scrollport]").scrollport_link()})}(jQuery)}).call(this);
/*global $ */
$(document).ready(function() {

    "use strict";

    $('.menu > ul > li:has( > ul)').addClass('menu-dropdown-icon');
    //Checks if li has sub (ul) and adds class for toggle icon - just an UI


    //Adds menu-mobile class (for mobile toggle menu) before the normal menu
    //Mobile menu is hidden if width is more then 959px, but normal menu is displayed
    //Normal menu is hidden if width is below 959px, and jquery adds mobile menu
    //Done this way so it can be used with wordpress without any trouble

    $(".menu > ul > li").hover(function(e) {
        if ($(window).width() > 943) {
            $(this).children("ul").stop(true, false).fadeToggle(150);
            e.preventDefault();
        }
    });
    //If width is more than 943px dropdowns are displayed on hover

    $(".menu > ul > li").click(function() {
        if ($(window).width() <= 943) {
            $(this).children("ul").fadeToggle(150);
        }
    });
    //If width is less or equal to 943px dropdowns are displayed on click (thanks Aman Jain from stackoverflow)

    $(".menu-mobile").click(function(e) {
        $(".menu > ul").toggleClass('show-on-mobile');
        e.preventDefault();
    });
    //when clicked on mobile-menu, normal menu is shown as a list, classic rwd menu story (thanks mwl from stackoverflow)

});



/*
 * Lightcase - jQuery Plugin
 * The smart and flexible Lightbox Plugin.
 *
 * @author		Cornel Boppart <cornel@bopp-art.com>
 * @copyright	Author
 *
 * @version		2.3.4 (29/12/2015)
 */

;(function ($) {

	'use strict';

	var _self = {
		cache: {},

		support: {},

		objects: {},

		/**
		 * Initializes the plugin
		 *
		 * @param	{object}	options
		 * @return	{object}
		 */
		init: function (options) {
			return this.each(function () {
				$(this).unbind('click.lightcase').bind('click.lightcase', function (event) {
					event.preventDefault();
					$(this).lightcase('start', options);
				});
			});
		},

		/**
		 * Starts the plugin
		 *
		 * @param	{object}	options
		 * @return	{void}
		 */
		start: function (options) {
			_self.origin = lightcase.origin = this;

			_self.settings = lightcase.settings = $.extend(true, {
				idPrefix: 'lightcase-',
				classPrefix: 'lightcase-',
				attrPrefix: 'lc-',
				transition: 'elastic',
				transitionIn: null,
				transitionOut: null,
				cssTransitions: true,
				speedIn: 250,
				speedOut: 250,
				maxWidth: 800,
				maxHeight: 500,
				forceWidth: false,
				forceHeight: false,
				liveResize: true,
				fullScreenModeForMobile: true,
				mobileMatchExpression: /(iphone|ipod|ipad|android|blackberry|symbian)/,
				disableShrink: false,
				shrinkFactor: .75,
				overlayOpacity: .9,
				slideshow: false,
				timeout: 5000,
				swipe: true,
				useKeys: true,
				useCategories: true,
				navigateEndless: true,
				closeOnOverlayClick: true,
				title: null,
				caption: null,
				showTitle: true,
				showCaption: true,
				showSequenceInfo: true,
				inline: {
					width: 'auto',
					height: 'auto'
				},
				ajax: {
					width: 'auto',
					height: 'auto',
					type: 'get',
					dataType: 'html',
					data: {}
				},
				iframe: {
					width: 800,
					height: 500,
					frameborder: 0
				},
				flash: {
					width: 400,
					height: 205,
					wmode: 'transparent'
				},
				video: {
					width: 400,
					height: 225,
					poster: '',
					preload: 'auto',
					controls: true,
					autobuffer: true,
					autoplay: true,
					loop: false
				},
				attr: 'data-rel',
				href: null,
				type: null,
				typeMapping: {
					'image': 'jpg,jpeg,gif,png,bmp',
					'flash': 'swf',
					'video': 'mp4,mov,ogv,ogg,webm',
					'iframe': 'html,php',
					'ajax': 'json,txt',
					'inline': '#'
				},
				errorMessage: function () {
					return '<p class="' + _self.settings.classPrefix + 'error">' + _self.settings.labels['errorMessage'] + '</p>';
				},
				labels: {
					'errorMessage': 'Source could not be found...',
					'sequenceInfo.of': ' of ',
					'close': 'Close',
					'navigator.prev': 'Prev',
					'navigator.next': 'Next',
 					'navigator.play': 'Play',
					'navigator.pause': 'Pause'
				},
				markup: function () {
					$('body').append(
						_self.objects.overlay = $('<div id="' + _self.settings.idPrefix + 'overlay"></div>'),
						_self.objects.loading = $('<div id="' + _self.settings.idPrefix + 'loading" class="' + _self.settings.classPrefix + 'icon-spin"></div>'),
						_self.objects.case = $('<div id="' + _self.settings.idPrefix + 'case" aria-hidden="true" role="dialog"></div>')
					);
					_self.objects.case.after(
						_self.objects.nav = $('<div id="' + _self.settings.idPrefix + 'nav"></div>')
					);
					_self.objects.nav.append(
						_self.objects.close = $('<a href="#" class="' + _self.settings.classPrefix + 'icon-close"><span>' + _self.settings.labels['close'] + '</span></a>'),
						_self.objects.prev = $('<a href="#" class="' + _self.settings.classPrefix + 'icon-prev"><span>' + _self.settings.labels['navigator.prev'] + '</span></a>').hide(),
						_self.objects.next = $('<a href="#" class="' + _self.settings.classPrefix + 'icon-next"><span>' + _self.settings.labels['navigator.next'] + '</span></a>').hide(),
						_self.objects.play = $('<a href="#" class="' + _self.settings.classPrefix + 'icon-play"><span>' + _self.settings.labels['navigator.play'] + '</span></a>').hide(),
						_self.objects.pause = $('<a href="#" class="' + _self.settings.classPrefix + 'icon-pause"><span>' + _self.settings.labels['navigator.pause'] + '</span></a>').hide()
					);
					_self.objects.case.append(
						_self.objects.content = $('<div id="' + _self.settings.idPrefix + 'content"></div>'),
						_self.objects.info = $('<div id="' + _self.settings.idPrefix + 'info"></div>')
					);
					_self.objects.content.append(
						_self.objects.contentInner = $('<div class="' + _self.settings.classPrefix + 'contentInner"></div>')
					);
					_self.objects.info.append(
						_self.objects.sequenceInfo = $('<div id="' + _self.settings.idPrefix + 'sequenceInfo"></div>'),
						_self.objects.title = $('<h4 id="' + _self.settings.idPrefix + 'title"></h4>'),
						_self.objects.caption = $('<p id="' + _self.settings.idPrefix + 'caption"></p>')
					);
				},
				onInit: {},
				onStart: {},
				onFinish: {},
				onClose: {},
				onCleanup: {}
			}, options);

			// Call onInit hook functions
			_self._callHooks(_self.settings.onInit);

			_self.objectData = _self._setObjectData(this);

			_self._cacheScrollPosition();
			_self._watchScrollInteraction();

			_self._addElements();
			_self._open();

			_self.dimensions = _self.getViewportDimensions();
		},

		/**
		 * Getter method for objects
		 *
		 * @param	{string}	name
		 * @return	{object}
		 */
		get: function (name) {
			return _self.objects[name];
		},

		/**
		 * Getter method for objectData
		 *
		 * @return	{object}
		 */
		getObjectData: function () {
			return _self.objectData;
		},

		/**
		 * Sets the object data
		 *
		 * @param	{object}	object
		 * @return	{object}	objectData
		 */
		_setObjectData: function (object) {
		 	var $object = $(object),
				objectData = {
				title: _self.settings.title || $object.attr(_self._prefixAttributeName('title')) || $object.attr('title'),
				caption: _self.settings.caption || $object.attr(_self._prefixAttributeName('caption')) || $object.children('img').attr('alt'),
				url: _self._determineUrl(),
				requestType: _self.settings.ajax.type,
				requestData: _self.settings.ajax.data,
				requestDataType: _self.settings.ajax.dataType,
				rel: $object.attr(_self._determineAttributeSelector()),
				type: _self.settings.type || _self._verifyDataType(_self._determineUrl()),
				isPartOfSequence: _self._isPartOfSequence($object.attr(_self.settings.attr), ':'),
				isPartOfSequenceWithSlideshow: _self._isPartOfSequence($object.attr(_self.settings.attr), ':slideshow'),
				currentIndex: $(_self._determineAttributeSelector()).index($object),
				sequenceLength: $(_self._determineAttributeSelector()).length
			};

			// Add sequence info to objectData
			objectData.sequenceInfo = (objectData.currentIndex + 1) + _self.settings.labels['sequenceInfo.of'] + objectData.sequenceLength;

			// Add next/prev index
			objectData.prevIndex = objectData.currentIndex - 1;
			objectData.nextIndex = objectData.currentIndex + 1;

			return objectData;
		},

		/**
		 * Prefixes a data attribute name with defined name from 'settings.attrPrefix'
		 * to ensure more uniqueness for all lightcase related/used attributes.
		 *
		 * @param	{string}	name
		 * @return	{string}
		 */
		_prefixAttributeName: function (name) {
			return 'data-' + _self.settings.attrPrefix + name;
		},

		/**
		 * Determines the link target considering 'settings.href' and data attributes
		 * but also with a fallback to the default 'href' value.
		 *
		 * @return	{string}
		 */
		_determineLinkTarget: function () {
			return _self.settings.href || $(_self.origin).attr(_self._prefixAttributeName('href')) || $(_self.origin).attr('href');
		},

		/**
		 * Determines the attribute selector to use, depending on
		 * whether categorized collections are beeing used or not.
		 *
		 * @return	{string}	selector
		 */
		_determineAttributeSelector: function () {
			var	$origin = $(_self.origin),
				selector = '';

			if (typeof _self.cache.selector !== 'undefined') {
				selector = _self.cache.selector;
			} else if (_self.settings.useCategories === true && $origin.attr(_self._prefixAttributeName('categories'))) {
				var	categories = $origin.attr(_self._prefixAttributeName('categories')).split(' ');

				$.each(categories, function (index, category) {
					if (index > 0) {
						selector += ',';
					}
					selector += '[' + _self._prefixAttributeName('categories') + '~="' + category + '"]';
				});
			} else {
				selector = '[' + _self.settings.attr + '="' + $origin.attr(_self.settings.attr) + '"]';
			}

			_self.cache.selector = selector;

			return selector;
		},

		/**
		 * Determines the correct resource according to the
		 * current viewport and density.
		 *
		 * @return	{string}	url
		 */
		_determineUrl: function () {
			var dataUrl = _self._verifyDataUrl(_self._determineLinkTarget()),
				width = 0,
				density = 0,
				url;

			$.each(dataUrl, function (index, src) {
				if (
					// Check density
					_self._devicePixelRatio() >= src.density &&
					src.density >= density &&
					// Check viewport width
					_self._matchMedia()('screen and (min-width:' + src.width + 'px)') &&
					src.width >= width
				) {
					width = src.width;
					density = src.density;
					url = src.url;
				}
			});

			return url;
		},

		/**
		 * Normalizes an url and returns information about the resource path,
		 * the viewport width as well as density if defined.
		 *
		 * @param	{string}	url	Path to resource in format of an url or srcset
		 * @return	{object}
		 */
		_normalizeUrl: function (url) {
			var srcExp = /^\d+$/;

			return url.split(',').map(function (str) {
				var src = {
					width: 0,
					density: 0
				};

				str.trim().split(/\s+/).forEach(function (url, i) {
					if (i === 0) {
						return src.url = url;
					}

					var value = url.substring(0, url.length - 1),
						lastChar = url[url.length - 1],
						intVal = parseInt(value, 10),
						floatVal = parseFloat(value);
					if (lastChar === 'w' && srcExp.test(value)) {
						src.width = intVal;
					} else if (lastChar === 'h' && srcExp.test(value)) {
						src.height = intVal;
					} else if (lastChar === 'x' && !isNaN(floatVal)) {
						src.density = floatVal;
					}
				});

				return src;
			});
		},

		/**
		 * Verifies if the link is part of a sequence
		 *
		 * @param	{string}	rel
		 * @param	{string}	expression
		 * @return	{boolean}
		 */
		_isPartOfSequence: function (rel, expression) {
			var getSimilarLinks = $('[' + _self.settings.attr + '="' + rel + '"]'),
				regexp = new RegExp(expression);

			return (regexp.test(rel) && getSimilarLinks.length > 1);
		},

		/**
		 * Verifies if the slideshow should be enabled
		 *
		 * @return	{boolean}
		 */
		isSlideshowEnabled: function () {
			return (_self.objectData.isPartOfSequence && (_self.settings.slideshow === true || _self.objectData.isPartOfSequenceWithSlideshow === true));
		},

		/**
		 * Loads the new content to show
		 *
		 * @return	{void}
		 */
		_loadContent: function () {
			if (_self.cache.originalObject) {
				_self._restoreObject();
			}

			_self._createObject();
		},

		/**
		 * Creates a new object
		 *
		 * @return	{void}
		 */
		_createObject: function () {
			var $object;

			// Create object
			switch (_self.objectData.type) {
				case 'image':
					$object = $(new Image());
					$object.attr({
						// The time expression is required to prevent the binding of an image load
						'src': _self.objectData.url,
						'alt': _self.objectData.title
					});
					break;
				case 'inline':
					$object = $('<div class="' + _self.settings.classPrefix + 'inlineWrap"></div>');
					$object.html(_self._cloneObject($(_self.objectData.url)));

					// Add custom attributes from _self.settings
					$.each(_self.settings.inline, function (name, value) {
						$object.attr(_self._prefixAttributeName(name), value);
					});
					break;
				case 'ajax':
					$object = $('<div class="' + _self.settings.classPrefix + 'inlineWrap"></div>');

					// Add custom attributes from _self.settings
					$.each(_self.settings.ajax, function (name, value) {
						if (name !== 'data') {
							$object.attr(_self._prefixAttributeName(name), value);
						}
					});
					break;
				case 'flash':
					$object = $('<embed src="' + _self.objectData.url + '" type="application/x-shockwave-flash"></embed>');

					// Add custom attributes from _self.settings
					$.each(_self.settings.flash, function (name, value) {
						$object.attr(name, value);
					});
					break;
				case 'video':
					$object = $('<video></video>');
					$object.attr('src', _self.objectData.url);

					// Add custom attributes from _self.settings
					$.each(_self.settings.video, function (name, value) {
						$object.attr(name, value);
					});
					break;
				default :
					$object = $('<iframe></iframe>');
					$object.attr({
						'src': _self.objectData.url
					});

					// Add custom attributes from _self.settings
					$.each(_self.settings.iframe, function (name, value) {
						$object.attr(name, value);
					});
					break;
			}

			_self._addObject($object);
			_self._loadObject($object);
		},

		/**
		 * Adds the new object to the markup
		 *
		 * @param	{object}	$object
		 * @return	{void}
		 */
		_addObject: function ($object) {
			// Add object to content holder
			_self.objects.contentInner.html($object);

			// Start loading
			_self._loading('start');

			// Call onStart hook functions
			_self._callHooks(_self.settings.onStart);

			// Add sequenceInfo to the content holder or hide if its empty
			if (_self.settings.showSequenceInfo === true && _self.objectData.isPartOfSequence) {
				_self.objects.sequenceInfo.html(_self.objectData.sequenceInfo);
				_self.objects.sequenceInfo.show();
			} else {
				_self.objects.sequenceInfo.empty();
				_self.objects.sequenceInfo.hide();
			}
			// Add title to the content holder or hide if its empty
			if (_self.settings.showTitle === true && _self.objectData.title !== undefined && _self.objectData.title !== '') {
				_self.objects.title.html(_self.objectData.title);
				_self.objects.title.show();
			} else {
				_self.objects.title.empty();
				_self.objects.title.hide();
			}
			// Add caption to the content holder or hide if its empty
			if (_self.settings.showCaption === true && _self.objectData.caption !== undefined && _self.objectData.caption !== '') {
				_self.objects.caption.html(_self.objectData.caption);
				_self.objects.caption.show();
			} else {
				_self.objects.caption.empty();
				_self.objects.caption.hide();
			}
		},

		/**
		 * Loads the new object
		 *
		 * @param	{object}	$object
		 * @return	{void}
		 */
		_loadObject: function ($object) {
			// Load the object
			switch (_self.objectData.type) {
				case 'inline':
					if ($(_self.objectData.url)) {
						_self._showContent($object);
					} else {
						_self.error();
					}
					break;
				case 'ajax':
					$.ajax(
						$.extend({}, _self.settings.ajax, {
							url: _self.objectData.url,
							type: _self.objectData.requestType,
							dataType: _self.objectData.requestDataType,
							data: _self.objectData.requestData,
							success: function (data, textStatus, jqXHR) {
								// Unserialize if data is transferred as json
								if (_self.objectData.requestDataType === 'json') {
									_self.objectData.data = data;
								} else {
									$object.html(data);
								}
								_self._showContent($object);
							},
							error: function (jqXHR, textStatus, errorThrown) {
								_self.error();
							}
						})
					);
					break;
				case 'flash':
					_self._showContent($object);
					break;
				case 'video':
					if (typeof($object.get(0).canPlayType) === 'function' || _self.objects.case.find('video').length === 0) {
						_self._showContent($object);
					} else {
						_self.error();
					}
					break;
				default:
					if (_self.objectData.url) {
						$object.load(function () {
							_self._showContent($object);
						});
						$object.error(function () {
							_self.error();
						});
					} else {
						_self.error();
					}
					break;
			}
		},

		/**
		 * Throws an error message if something went wrong
		 *
		 * @return	{void}
		 */
		error: function () {
			_self.objectData.type = 'error';
			var $object = $('<div class="' + _self.settings.classPrefix + 'inlineWrap"></div>');

			$object.html(_self.settings.errorMessage);
			_self.objects.contentInner.html($object);

			_self._showContent(_self.objects.contentInner);
		},

		/**
		 * Calculates the dimensions to fit content
		 *
		 * @param	{object}	$object
		 * @return	{void}
		 */
		_calculateDimensions: function ($object) {
			_self._cleanupDimensions();

			// Set default dimensions
			var dimensions = {
				objectWidth: $object.attr('width') ? $object.attr('width') : $object.attr(_self._prefixAttributeName('width')),
				objectHeight: $object.attr('height') ? $object.attr('height') : $object.attr(_self._prefixAttributeName('height'))
			};

			if (!_self.settings.disableShrink) {
				// Add calculated maximum width/height to dimensions
				dimensions.maxWidth = parseInt(_self.dimensions.windowWidth * _self.settings.shrinkFactor);
				dimensions.maxHeight = parseInt(_self.dimensions.windowHeight * _self.settings.shrinkFactor);

				// If the auto calculated maxWidth/maxHeight greather than the userdefined one, use that.
				if (dimensions.maxWidth > _self.settings.maxWidth) {
					dimensions.maxWidth = _self.settings.maxWidth;
				}
				if (dimensions.maxHeight > _self.settings.maxHeight) {
					dimensions.maxHeight = _self.settings.maxHeight;
				}

				// Calculate the difference between screen width/height and image width/height
				dimensions.differenceWidthAsPercent = parseInt(100 / dimensions.maxWidth * dimensions.objectWidth);
				dimensions.differenceHeightAsPercent = parseInt(100 / dimensions.maxHeight * dimensions.objectHeight);

				switch (_self.objectData.type) {
					case 'image':
					case 'flash':
					case 'video':
						if (dimensions.differenceWidthAsPercent > 100 && dimensions.differenceWidthAsPercent > dimensions.differenceHeightAsPercent) {
							dimensions.objectWidth = dimensions.maxWidth;
							dimensions.objectHeight = parseInt(dimensions.objectHeight / dimensions.differenceWidthAsPercent * 100);
						}
						if (dimensions.differenceHeightAsPercent > 100 && dimensions.differenceHeightAsPercent > dimensions.differenceWidthAsPercent) {
							dimensions.objectWidth = parseInt(dimensions.objectWidth / dimensions.differenceHeightAsPercent * 100);
							dimensions.objectHeight = dimensions.maxHeight;
						}
						if (dimensions.differenceHeightAsPercent > 100 && dimensions.differenceWidthAsPercent < dimensions.differenceHeightAsPercent) {
							dimensions.objectWidth = parseInt(dimensions.maxWidth / dimensions.differenceHeightAsPercent * dimensions.differenceWidthAsPercent);
							dimensions.objectHeight = dimensions.maxHeight;
						}
						break;
					case 'error':
						if (!isNaN(dimensions.objectWidth) && dimensions.objectWidth > dimensions.maxWidth) {
							dimensions.objectWidth = dimensions.maxWidth;
						}
						break;
					default:
						if ((isNaN(dimensions.objectWidth) || dimensions.objectWidth > dimensions.maxWidth) && !_self.settings.forceWidth) {
							dimensions.objectWidth = dimensions.maxWidth;
						}
						if (((isNaN(dimensions.objectHeight) && dimensions.objectHeight !== 'auto') || dimensions.objectHeight > dimensions.maxHeight) && !_self.settings.forceHeight) {
							dimensions.objectHeight = dimensions.maxHeight;
						}
						break;
				}
			}

			if (_self.settings.forceWidth) {
				dimensions.maxWidth = dimensions.objectWidth;
			} else if ($object.attr(_self._prefixAttributeName('max-width'))) {
				dimensions.maxWidth =  $object.attr(_self._prefixAttributeName('max-width'));
			}

			if (_self.settings.forceHeight) {
				dimensions.maxHeight = dimensions.objectHeight;
			} else if ($object.attr(_self._prefixAttributeName('max-height'))) {
				dimensions.maxHeight =  $object.attr(_self._prefixAttributeName('max-height'));
			}

			_self._adjustDimensions($object, dimensions);
		},

		/**
		 * Adjusts the dimensions
		 *
		 * @param	{object}	$object
		 * @param	{object}	dimensions
		 * @return	{void}
		 */
		_adjustDimensions: function ($object, dimensions) {
			// Adjust width and height
			$object.css({
				'width': dimensions.objectWidth,
				'height': dimensions.objectHeight,
				'max-width': dimensions.maxWidth,
				'max-height': dimensions.maxHeight
			});

			_self.objects.contentInner.css({
				'width': $object.outerWidth(),
				'height': $object.outerHeight(),
				'max-width': '100%'
			});

			_self.objects.case.css({
				'width': _self.objects.contentInner.outerWidth()
			});

			// Adjust margin
			_self.objects.case.css({
				'margin-top': parseInt(-(_self.objects.case.outerHeight() / 2)),
				'margin-left': parseInt(-(_self.objects.case.outerWidth() / 2))
			});
		},

		/**
		 * Handles the _loading
		 *
		 * @param	{string}	process
		 * @return	{void}
		 */
		_loading: function (process) {
			if (process === 'start') {
				_self.objects.case.addClass(_self.settings.classPrefix + 'loading');
				_self.objects.loading.show();
			} else if (process === 'end') {
				_self.objects.case.removeClass(_self.settings.classPrefix + 'loading');
				_self.objects.loading.hide();
			}
		},


		/**
		 * Gets the client screen dimensions
		 *
		 * @return	{object}	dimensions
		 */
		getViewportDimensions: function () {
			return {
				windowWidth: $(window).innerWidth(),
				windowHeight: $(window).innerHeight()
			};
		},

		/**
		 * Verifies the url
		 *
		 * @param	{string}	dataUrl
		 * @return	{object}	dataUrl	Clean url for processing content
		 */
		_verifyDataUrl: function (dataUrl) {
			if (!dataUrl || dataUrl === undefined || dataUrl === '') {
				return false;
			}

			if (dataUrl.indexOf('#') > -1) {
				dataUrl = dataUrl.split('#');
				dataUrl = '#' + dataUrl[dataUrl.length - 1];
			}

			return _self._normalizeUrl(dataUrl.toString());
		},

		/**
		 * Verifies the data type of the content to load
		 *
		 * @param	{string}			url
		 * @return	{string|boolean}	Array key if expression matched, else false
		 */
		_verifyDataType: function (url) {
			var typeMapping = _self.settings.typeMapping;

			// Early abort if dataUrl couldn't be verified
			if (!url) {
				return false;
			}

			// Verify the dataType of url according to typeMapping which
			// has been defined in settings.
			for (var key in typeMapping) {
				if (typeMapping.hasOwnProperty(key)) {
					var suffixArr = typeMapping[key].split(',');

					for (var i = 0; i < suffixArr.length; i++) {
						var suffix = suffixArr[i].toLowerCase(),
							regexp = new RegExp('\.(' + suffix + ')$', 'i'),
							// Verify only the last 5 characters of the string
							str = url.toLowerCase().split('?')[0].substr(-5);

						if (regexp.test(str) === true || (key === 'inline' && (url.indexOf(suffix) > -1))) {
							return key;
						}
					}
				}
			}

			// If no expression matched, return 'iframe'.
			return 'iframe';
		},

		/**
		 * Extends html markup with the essential tags
		 *
		 * @return	{void}
		 */
		_addElements: function () {
			if (typeof _self.objects.case !== 'undefined' && $('#' + _self.objects.case.attr('id')).length) {
				return;
			}

			_self.settings.markup();
		},

		/**
		 * Shows the loaded content
		 *
		 * @param	{object}	$object
		 * @return	{void}
		 */
		_showContent: function ($object) {
			// Add data attribute with the object type
			_self.objects.case.attr(_self._prefixAttributeName('type'), _self.objectData.type);

			_self.cache.object = $object;
			_self._calculateDimensions($object);

			// Call onFinish hook functions
			_self._callHooks(_self.settings.onFinish);

			switch (_self.settings.transitionIn) {
				case 'scrollTop':
				case 'scrollRight':
				case 'scrollBottom':
				case 'scrollLeft':
				case 'scrollHorizontal':
				case 'scrollVertical':
					_self.transition.scroll(_self.objects.case, 'in', _self.settings.speedIn);
					_self.transition.fade(_self.objects.contentInner, 'in', _self.settings.speedIn);
					break;
				case 'elastic':
					if (_self.objects.case.css('opacity') < 1) {
						_self.transition.zoom(_self.objects.case, 'in', _self.settings.speedIn);
						_self.transition.fade(_self.objects.contentInner, 'in', _self.settings.speedIn);
					}
				case 'fade':
				case 'fadeInline':
					_self.transition.fade(_self.objects.case, 'in', _self.settings.speedIn);
					_self.transition.fade(_self.objects.contentInner, 'in', _self.settings.speedIn);
					break;
				default:
					_self.transition.fade(_self.objects.case, 'in', 0);
					break;
			}

			// End loading.
			_self._loading('end');
			_self.isBusy = false;
		},

		/**
		 * Processes the content to show
		 *
		 * @return	{void}
		 */
		_processContent: function () {
			_self.isBusy = true;

			switch (_self.settings.transitionOut) {
				case 'scrollTop':
				case 'scrollRight':
				case 'scrollBottom':
				case 'scrollLeft':
				case 'scrollVertical':
				case 'scrollHorizontal':
					if (_self.objects.case.is(':hidden')) {
						_self.transition.fade(_self.objects.case, 'out', 0, 0, function () {
							_self._loadContent();
						});
						_self.transition.fade(_self.objects.contentInner, 'out', 0);
					} else {
						_self.transition.scroll(_self.objects.case, 'out', _self.settings.speedOut, function () {
							_self._loadContent();
						});
					}
					break;
				case 'fade':
					if (_self.objects.case.is(':hidden')) {
						_self.transition.fade(_self.objects.case, 'out', 0, 0, function () {
							_self._loadContent();
						});
					} else {
						_self.transition.fade(_self.objects.case, 'out', _self.settings.speedOut, 0, function () {
							_self._loadContent();
						});
					}
					break;
				case 'fadeInline':
				case 'elastic':
					if (_self.objects.case.is(':hidden')) {
						_self.transition.fade(_self.objects.case, 'out', 0, 0, function () {
							_self._loadContent();
						});
					} else {
						_self.transition.fade(_self.objects.contentInner, 'out', _self.settings.speedOut, 0, function () {
							_self._loadContent();
						});
					}
					break;
				default:
					_self.transition.fade(_self.objects.case, 'out', 0, 0, function () {
						_self._loadContent();
					});
					break;
			}
		},

		/**
		 * Handles events for gallery buttons
		 *
		 * @return	{void}
		 */
		_handleEvents: function () {
			_self._unbindEvents();

			_self.objects.nav.children().not(_self.objects.close).hide();

			// If slideshow is enabled, show play/pause and start timeout.
			if (_self.isSlideshowEnabled()) {
				// Only start the timeout if slideshow is not pausing
				if (!_self.objects.nav.hasClass(_self.settings.classPrefix + 'paused')) {
					_self._startTimeout();
				} else {
					_self._stopTimeout();
				}
			}

			if (_self.settings.liveResize) {
				_self._watchResizeInteraction();
			}

			_self.objects.close.click(function (event) {
				event.preventDefault();
				_self.close();
			});

			if (_self.settings.closeOnOverlayClick === true) {
				_self.objects.overlay.css('cursor', 'pointer').click(function (event) {
					event.preventDefault();

					_self.close();
				});
			}

			if (_self.settings.useKeys === true) {
				_self._addKeyEvents();
			}

			if (_self.objectData.isPartOfSequence) {
				_self.objects.nav.attr(_self._prefixAttributeName('ispartofsequence'), true);
				_self.objects.nav.data('items', _self._setNavigation());

				_self.objects.prev.click(function (event) {
					event.preventDefault();

					if (_self.settings.navigateEndless === true || !_self.item.isFirst()) {
						_self.objects.prev.unbind('click');
						_self.cache.action = 'prev';
						_self.objects.nav.data('items').prev.click();

						if (_self.isSlideshowEnabled()) {
							_self._stopTimeout();
						}
					}
				});

				_self.objects.next.click(function (event) {
					event.preventDefault();

					if (_self.settings.navigateEndless === true || !_self.item.isLast()) {
						_self.objects.next.unbind('click');
						_self.cache.action = 'next';
						_self.objects.nav.data('items').next.click();

						if (_self.isSlideshowEnabled()) {
							_self._stopTimeout();
						}
					}
				});

				if (_self.isSlideshowEnabled()) {
					_self.objects.play.click(function (event) {
						event.preventDefault();
						_self._startTimeout();
					});
					_self.objects.pause.click(function (event) {
						event.preventDefault();
						_self._stopTimeout();
					});
				}

				// Enable swiping if activated
				if (_self.settings.swipe === true) {
					if ($.isPlainObject($.event.special.swipeleft)) {
						_self.objects.case.on('swipeleft', function (event) {
							event.preventDefault();
							_self.objects.next.click();
							if (_self.isSlideshowEnabled()) {
								_self._stopTimeout();
							}
						});
					}
					if ($.isPlainObject($.event.special.swiperight)) {
						_self.objects.case.on('swiperight', function (event) {
							event.preventDefault();
							_self.objects.prev.click();
							if (_self.isSlideshowEnabled()) {
								_self._stopTimeout();
							}
						});
					}
				}
			}
		},

		/**
		 * Adds the key events
		 *
		 * @return	{void}
		 */
		_addKeyEvents: function () {
			$(document).bind('keyup.lightcase', function (event) {
				// Do nothing if lightcase is in process
				if (_self.isBusy) {
					return;
				}

				switch (event.keyCode) {
					// Escape key
					case 27:
						_self.objects.close.click();
						break;
					// Backward key
					case 37:
						if (_self.objectData.isPartOfSequence) {
							_self.objects.prev.click();
						}
						break;
					// Forward key
					case 39:
						if (_self.objectData.isPartOfSequence) {
							_self.objects.next.click();
						}
						break;
				}
			});
		},

		/**
		 * Starts the slideshow timeout
		 *
		 * @return	{void}
		 */
		_startTimeout: function () {
			_self.objects.play.hide();
			_self.objects.pause.show();

			_self.cache.action = 'next';
			_self.objects.nav.removeClass(_self.settings.classPrefix + 'paused');

			_self.timeout = setTimeout(function () {
				_self.objects.nav.data('items').next.click();
			}, _self.settings.timeout);
		},

		/**
		 * Stops the slideshow timeout
		 *
		 * @return	{void}
		 */
		_stopTimeout: function () {
			_self.objects.play.show();
			_self.objects.pause.hide();

			_self.objects.nav.addClass(_self.settings.classPrefix + 'paused');

			clearTimeout(_self.timeout);
		},

		/**
		 * Sets the navigator buttons (prev/next)
		 *
		 * @return	{object}	items
		 */
		_setNavigation: function () {
			var $links = $((_self.cache.selector || _self.settings.attr)),
				sequenceLength = _self.objectData.sequenceLength - 1,
				items = {
					prev: $links.eq(_self.objectData.prevIndex),
					next: $links.eq(_self.objectData.nextIndex)
				};

			if (_self.objectData.currentIndex > 0) {
				_self.objects.prev.show();
			} else {
				items.prevItem = $links.eq(sequenceLength);
			}
			if (_self.objectData.nextIndex <= sequenceLength) {
				_self.objects.next.show();
			} else {
				items.next = $links.eq(0);
			}

			if (_self.settings.navigateEndless === true) {
				_self.objects.prev.show();
				_self.objects.next.show();
			}

			return items;
		},

		/**
		 * Item information/status
		 *
		 */
		item: {
			/**
			 * Verifies if the current item is first item.
			 *
			 * @return	{boolean}
			 */
			isFirst: function () {
				return (_self.objectData.currentIndex === 0);
			},

			/**
			 * Verifies if the current item is last item.
			 *
			 * @return	{boolean}
			 */
			isLast: function () {
				return (_self.objectData.currentIndex === (_self.objectData.sequenceLength - 1));
			}
		},

		/**
		 * Clones the object for inline elements
		 *
		 * @param	{object}	$object
		 * @return	{object}	$clone
		 */
		_cloneObject: function ($object) {
			var $clone = $object.clone(),
				objectId = $object.attr('id');

			// If element is hidden, cache the object and remove
			if ($object.is(':hidden')) {
				_self._cacheObjectData($object);
				$object.attr('id', _self.settings.idPrefix + 'temp-' + objectId).empty();
			} else {
				// Prevent duplicated id's
				$clone.removeAttr('id');
			}

			return $clone.show();
		},

		/**
		 * Verifies if it is a mobile device
		 *
		 * @return	{boolean}
		 */
		isMobileDevice: function () {
			var deviceAgent = navigator.userAgent.toLowerCase(),
				agentId = deviceAgent.match(_self.settings.mobileMatchExpression);

			return agentId ? true : false;
		},

		/**
		 * Verifies if css transitions are supported
		 *
		 * @return	{string|boolean}	The transition prefix if supported, else false.
		 */
		isTransitionSupported: function () {
			var body = $('body').get(0),
				isTransitionSupported = false,
				transitionMapping = {
					'transition': '',
					'WebkitTransition': '-webkit-',
					'MozTransition': '-moz-',
					'OTransition': '-o-',
					'MsTransition': '-ms-'
				};

			for (var key in transitionMapping) {
				if (transitionMapping.hasOwnProperty(key) && key in body.style) {
					_self.support.transition = transitionMapping[key];
					isTransitionSupported = true;
				}
			}

			return isTransitionSupported;
		},

		/**
		 * Transition types
		 *
		 */
		transition: {
			/**
			 * Fades in/out the object
			 *
			 * @param	{object}	$object
			 * @param	{string}	type
			 * @param	{number}	speed
			 * @param	{number}	opacity
			 * @param	{function}	callback
			 * @return	{void}		Animates an object
			 */
			fade: function ($object, type, speed, opacity, callback) {
				var isInTransition = type === 'in',
					startTransition = {},
					startOpacity = $object.css('opacity'),
					endTransition = {},
					endOpacity = opacity ? opacity: isInTransition ? 1 : 0;

				if (!_self.isOpen && isInTransition) return;

				startTransition['opacity'] = startOpacity;
				endTransition['opacity'] = endOpacity;

				$object.css(startTransition).show();

				// Css transition
				if (_self.support.transitions) {
					endTransition[_self.support.transition + 'transition'] = speed + 'ms ease';

					setTimeout(function () {
						$object.css(endTransition);

						setTimeout(function () {
							$object.css(_self.support.transition + 'transition', '');

							if (callback && (_self.isOpen || !isInTransition)) {
								callback();
							}
						}, speed);
					}, 15);
				} else {
					// Fallback to js transition
					$object.stop();
					$object.animate(endTransition, speed, callback);
				}
			},

			/**
			 * Scrolls in/out the object
			 *
			 * @param	{object}	$object
			 * @param	{string}	type
			 * @param	{number}	speed
			 * @param	{function}	callback
			 * @return	{void}		Animates an object
			 */
			scroll: function ($object, type, speed, callback) {
				var isInTransition = type === 'in',
					transition = isInTransition ? _self.settings.transitionIn : _self.settings.transitionOut,
					direction = 'left',
					startTransition = {},
					startOpacity = isInTransition ? 0 : 1,
					startOffset = isInTransition ? '-50%' : '50%',
					endTransition = {},
					endOpacity = isInTransition ? 1 : 0,
					endOffset = isInTransition ? '50%' : '-50%';

				if (!_self.isOpen && isInTransition) return;

				switch (transition) {
					case 'scrollTop':
						direction = 'top';
						break;
					case 'scrollRight':
						startOffset = isInTransition ? '150%' : '50%';
						endOffset = isInTransition ? '50%' : '150%';
						break;
					case 'scrollBottom':
						direction = 'top';
						startOffset = isInTransition ? '150%' : '50%';
						endOffset = isInTransition ? '50%' : '150%';
						break;
					case 'scrollHorizontal':
						startOffset = isInTransition ? '150%' : '50%';
						endOffset = isInTransition ? '50%' : '-50%';
						break;
					case 'scrollVertical':
						direction = 'top';
						startOffset = isInTransition ? '-50%' : '50%';
						endOffset = isInTransition ? '50%' : '150%';
						break;
				}

				if (_self.cache.action === 'prev') {
					switch (transition) {
						case 'scrollHorizontal':
							startOffset = isInTransition ? '-50%' : '50%';
							endOffset = isInTransition ? '50%' : '150%';
							break;
						case 'scrollVertical':
							startOffset = isInTransition ? '150%' : '50%';
							endOffset = isInTransition ? '50%' : '-50%';
							break;
					}
				}

				startTransition['opacity'] = startOpacity;
				startTransition[direction] = startOffset;

				endTransition['opacity'] = endOpacity;
				endTransition[direction] = endOffset;

				$object.css(startTransition).show();

				// Css transition
				if (_self.support.transitions) {
					endTransition[_self.support.transition + 'transition'] = speed + 'ms ease';

					setTimeout(function () {
						$object.css(endTransition);

						setTimeout(function () {
							$object.css(_self.support.transition + 'transition', '');

							if (callback && (_self.isOpen || !isInTransition)) {
								callback();
							}
						}, speed);
					}, 15);
				} else {
					// Fallback to js transition
					$object.stop();
					$object.animate(endTransition, speed, callback);
				}
			},

			/**
			 * Zooms in/out the object
			 *
			 * @param	{object}	$object
			 * @param	{string}	type
			 * @param	{number}	speed
			 * @param	{function}	callback
			 * @return	{void}		Animates an object
			 */
			zoom: function ($object, type, speed, callback) {
				var isInTransition = type === 'in',
					startTransition = {},
					startOpacity = $object.css('opacity'),
					startScale = isInTransition ? 'scale(0.75)' : 'scale(1)',
					endTransition = {},
					endOpacity = isInTransition ? 1 : 0,
					endScale = isInTransition ? 'scale(1)' : 'scale(0.75)';

				if (!_self.isOpen && isInTransition) return;

				startTransition['opacity'] = startOpacity;
				startTransition[_self.support.transition + 'transform'] = startScale;

				endTransition['opacity'] = endOpacity;

				$object.css(startTransition).show();

				// Css transition
				if (_self.support.transitions) {
					endTransition[_self.support.transition + 'transform'] = endScale;
					endTransition[_self.support.transition + 'transition'] = speed + 'ms ease';

					setTimeout(function () {
						$object.css(endTransition);

						setTimeout(function () {
							$object.css(_self.support.transition + 'transform', '');
							$object.css(_self.support.transition + 'transition', '');

							if (callback && (_self.isOpen || !isInTransition)) {
								callback();
							}
						}, speed);
					}, 15);
				} else {
					// Fallback to js transition
					$object.stop();
					$object.animate(endTransition, speed, callback);
				}
			}
		},

		/**
		 * Calls all the registered functions of a specific hook
		 *
		 * @param	{object}	hooks
		 * @return	{void}
		 */
		_callHooks: function (hooks) {
			if (typeof(hooks) === 'object') {
				$.each(hooks, function(index, hook) {
					if (typeof(hook) === 'function') {
						hook.call(_self.origin);
					}
				});
			}
		},

		/**
		 * Caches the object data
		 *
		 * @param	{object}	$object
		 * @return	{void}
		 */
		_cacheObjectData: function ($object) {
			$.data($object, 'cache', {
				id: $object.attr('id'),
				content: $object.html()
			});

			_self.cache.originalObject = $object;
		},

		/**
		 * Restores the object from cache
		 *
		 * @return	void
		 */
		_restoreObject: function () {
			var $object = $('[id^="' + _self.settings.idPrefix + 'temp-"]');

			$object.attr('id', $.data(_self.cache.originalObject, 'cache').id);
			$object.html($.data(_self.cache.originalObject, 'cache').content);
		},

		/**
		 * Executes functions for a window resize.
		 * It stops an eventual timeout and recalculates dimenstions.
		 *
		 * @return	{void}
		 */
		resize: function () {
			if (!_self.isOpen) return;

			if (_self.isSlideshowEnabled()) {
				_self._stopTimeout();
			}

			_self.dimensions = _self.getViewportDimensions();
			_self._calculateDimensions(_self.cache.object);
		},

		/**
		 * Caches the actual scroll coordinates.
		 *
		 * @return	{void}
		 */
		_cacheScrollPosition: function () {
			var	$window = $(window),
				$document = $(document),
				offset = {
					'top': $window.scrollTop(),
					'left':  $window.scrollLeft()
				};

			_self.cache.scrollPosition = _self.cache.scrollPosition || {};

			if ($document.width() > $window.width()) {
				_self.cache.scrollPosition.left = offset.left;
			}
			if ($document.height() > $window.height()) {
				_self.cache.scrollPosition.top = offset.top;
			}
		},

		/**
		 * Watches for any resize interaction and caches the new sizes.
		 *
		 * @return	{void}
		 */
		_watchResizeInteraction: function () {
			$(window).resize(_self.resize);
		},

		/**
		 * Stop watching any resize interaction related to _self.
		 *
		 * @return	{void}
		 */
		_unwatchResizeInteraction: function () {
			$(window).off('resize', _self.resize);
		},

		/**
		 * Watches for any scroll interaction and caches the new position.
		 *
		 * @return	{void}
		 */
		_watchScrollInteraction: function () {
			$(window).scroll(_self._cacheScrollPosition);
		},

		/**
		 * Stop watching any scroll interaction related to _self.
		 *
		 * @return	{void}
		 */
		_unwatchScrollInteraction: function () {
			$(window).off('scroll', _self._cacheScrollPosition);
		},

		/**
		 * Restores to the original scoll position before
		 * lightcase got initialized.
		 *
		 * @return	{void}
		 */
		_restoreScrollPosition: function () {
			$(window)
				.scrollTop(parseInt(_self.cache.scrollPosition.top))
				.scrollLeft(parseInt(_self.cache.scrollPosition.left))
				.resize();
		},

		/**
		 * Switches to the fullscreen mode
		 *
		 * @return	{void}
		 */
		_switchToFullScreenMode: function () {
			_self.settings.shrinkFactor = 1;
			_self.settings.overlayOpacity = 1;

			$('html').addClass(_self.settings.classPrefix + 'fullScreenMode');
		},

		/**
		 * Enters into the lightcase view
		 *
		 * @return	{void}
		 */
		_open: function () {
			_self.isOpen = true;

			_self.support.transitions = _self.settings.cssTransitions ? _self.isTransitionSupported() : false;
			_self.support.mobileDevice = _self.isMobileDevice();

			if (_self.support.mobileDevice) {
				$('html').addClass(_self.settings.classPrefix + 'isMobileDevice');

				if (_self.settings.fullScreenModeForMobile) {
					_self._switchToFullScreenMode();
				}
			}
			if (!_self.settings.transitionIn) {
				_self.settings.transitionIn = _self.settings.transition;
			}
			if (!_self.settings.transitionOut) {
				_self.settings.transitionOut = _self.settings.transition;
			}

			switch (_self.settings.transitionIn) {
				case 'fade':
				case 'fadeInline':
				case 'elastic':
				case 'scrollTop':
				case 'scrollRight':
				case 'scrollBottom':
				case 'scrollLeft':
				case 'scrollVertical':
				case 'scrollHorizontal':
					if (_self.objects.case.is(':hidden')) {
						_self.objects.close.css('opacity', 0);
						_self.objects.overlay.css('opacity', 0);
						_self.objects.case.css('opacity', 0);
						_self.objects.contentInner.css('opacity', 0);
					}
					_self.transition.fade(_self.objects.overlay, 'in', _self.settings.speedIn, _self.settings.overlayOpacity, function () {
						_self.transition.fade(_self.objects.close, 'in', _self.settings.speedIn);
						_self._handleEvents();
						_self._processContent();
					});
					break;
				default:
					_self.transition.fade(_self.objects.overlay, 'in', 0, _self.settings.overlayOpacity, function () {
						_self.transition.fade(_self.objects.close, 'in', 0);
						_self._handleEvents();
						_self._processContent();
					});
					break;
			}

			$('html').addClass(_self.settings.classPrefix + 'open');
			_self.objects.case.attr('aria-hidden', 'false');
		},

		/**
		 * Escapes from the lightcase view
		 *
		 * @return	{void}
		 */
		close: function () {
			_self.isOpen = false;

			if (_self.isSlideshowEnabled()) {
				_self._stopTimeout();
				_self.objects.nav.removeClass(_self.settings.classPrefix + 'paused');
			}

			_self.objects.loading.hide();

			_self._unbindEvents();

			_self._unwatchResizeInteraction();
			_self._unwatchScrollInteraction();

			$('html').removeClass(_self.settings.classPrefix + 'open');
			_self.objects.case.attr('aria-hidden', 'true');

			_self.objects.nav.children().hide();

			_self._restoreScrollPosition();

			// Call onClose hook functions
			_self._callHooks(_self.settings.onClose);

			switch (_self.settings.transitionOut) {
				case 'fade':
				case 'fadeInline':
				case 'scrollTop':
				case 'scrollRight':
				case 'scrollBottom':
				case 'scrollLeft':
				case 'scrollHorizontal':
				case 'scrollVertical':
					_self.transition.fade(_self.objects.case, 'out', _self.settings.speedOut, 0, function () {
						_self.transition.fade(_self.objects.overlay, 'out', _self.settings.speedOut, 0, function () {
							_self.cleanup();
						});
					});
					break;
				case 'elastic':
					_self.transition.zoom(_self.objects.case, 'out', _self.settings.speedOut, function () {
						_self.transition.fade(_self.objects.overlay, 'out', _self.settings.speedOut, 0, function () {
							_self.cleanup();
						});
					});
					break;
				default:
					_self.cleanup();
					break;
			}
		},

		/**
		 * Unbinds all given events
		 *
		 * @return	{void}
		 */
		_unbindEvents: function () {
			// Unbind overlay event
			_self.objects.overlay.unbind('click');

			// Unbind key events
			$(document).unbind('keyup.lightcase');

			// Unbind swipe events
			_self.objects.case.unbind('swipeleft').unbind('swiperight');

			// Unbind navigator events
			_self.objects.prev.unbind('click');
			_self.objects.next.unbind('click');
			_self.objects.play.unbind('click');
			_self.objects.pause.unbind('click');

			// Unbind close event
			_self.objects.close.unbind('click');
		},

		/**
		 * Cleans up the dimensions
		 *
		 * @return	{void}
		 */
		_cleanupDimensions: function () {
			var opacity = _self.objects.contentInner.css('opacity');

			_self.objects.case.css({
				'width': '',
				'height': '',
				'top': '',
				'left': '',
				'margin-top': '',
				'margin-left': ''
			});

			_self.objects.contentInner.removeAttr('style').css('opacity', opacity);
			_self.objects.contentInner.children().removeAttr('style');
		},

		/**
		 * Cleanup after aborting lightcase
		 *
		 * @return	{void}
		 */
		cleanup: function () {
			_self._cleanupDimensions();

			_self.objects.loading.hide();
			_self.objects.overlay.hide();
			_self.objects.case.hide();
			_self.objects.prev.hide();
			_self.objects.next.hide();
			_self.objects.play.hide();
			_self.objects.pause.hide();

			_self.objects.case.removeAttr(_self._prefixAttributeName('type'));
			_self.objects.nav.removeAttr(_self._prefixAttributeName('ispartofsequence'));

			_self.objects.contentInner.empty().hide();
			_self.objects.info.children().empty();

			if (_self.cache.originalObject) {
				_self._restoreObject();
			}

			// Call onCleanup hook functions
			_self._callHooks(_self.settings.onCleanup);

			// Restore cache
			_self.cache = {};
		},

		/**
		 * Returns the supported match media or undefined if the browser
		 * doesn't support match media.
		 *
		 * @return	{mixed}
		 */
		_matchMedia: function () {
			return window.matchMedia || window.msMatchMedia;
		},

		/**
		 * Returns the devicePixelRatio if supported. Else, it simply returns
		 * 1 as the default.
		 *
		 * @return	{number}
		 */
		_devicePixelRatio: function () {
			return window.devicePixelRatio || 1;
		},

		/**
		 * Checks if method is public
		 *
		 * @return	{boolean}
		 */
		_isPublicMethod: function (method) {
			return (typeof _self[method] === 'function' && method.charAt(0) !== '_');
		},

		/**
		 * Exports all public methods to be accessible, callable
		 * from global scope.
		 *
		 * @return	{void}
		 */
		_export: function () {
			window.lightcase = {};

			$.each(_self, function (property) {
				if (_self._isPublicMethod(property)) {
					lightcase[property] = _self[property];
				}
			});
		}
	};

	_self._export();

	$.fn.lightcase = function (method) {
		// Method calling logic (only public methods are applied)
		if (_self._isPublicMethod(method)) {
			return _self[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return _self.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on jQuery.lightcase');
		}
	};
})(jQuery);
/*!
 * Infinite Scroll PACKAGED v3.0.3
 * Automatically add next page
 *
 * Licensed GPLv3 for open source use
 * or Infinite Scroll Commercial License for commercial use
 *
 * https://infinite-scroll.com
 * Copyright 2018 Metafizzy
 */
!function(t,e){"function"==typeof define&&define.amd?define("jquery-bridget/jquery-bridget",["jquery"],function(i){return e(t,i)}):"object"==typeof module&&module.exports?module.exports=e(t,require("jquery")):t.jQueryBridget=e(t,t.jQuery)}(window,function(t,e){"use strict";function i(i,r,l){function a(t,e,n){var o,r="$()."+i+'("'+e+'")';return t.each(function(t,a){var h=l.data(a,i);if(!h)return void s(i+" not initialized. Cannot call methods, i.e. "+r);var c=h[e];if(!c||"_"==e.charAt(0))return void s(r+" is not a valid method");var u=c.apply(h,n);o=void 0===o?u:o}),void 0!==o?o:t}function h(t,e){t.each(function(t,n){var o=l.data(n,i);o?(o.option(e),o._init()):(o=new r(n,e),l.data(n,i,o))})}l=l||e||t.jQuery,l&&(r.prototype.option||(r.prototype.option=function(t){l.isPlainObject(t)&&(this.options=l.extend(!0,this.options,t))}),l.fn[i]=function(t){if("string"==typeof t){var e=o.call(arguments,1);return a(this,t,e)}return h(this,t),this},n(l))}function n(t){!t||t&&t.bridget||(t.bridget=i)}var o=Array.prototype.slice,r=t.console,s="undefined"==typeof r?function(){}:function(t){r.error(t)};return n(e||t.jQuery),i}),function(t,e){"function"==typeof define&&define.amd?define("ev-emitter/ev-emitter",e):"object"==typeof module&&module.exports?module.exports=e():t.EvEmitter=e()}("undefined"!=typeof window?window:this,function(){function t(){}var e=t.prototype;return e.on=function(t,e){if(t&&e){var i=this._events=this._events||{},n=i[t]=i[t]||[];return n.indexOf(e)==-1&&n.push(e),this}},e.once=function(t,e){if(t&&e){this.on(t,e);var i=this._onceEvents=this._onceEvents||{},n=i[t]=i[t]||{};return n[e]=!0,this}},e.off=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){var n=i.indexOf(e);return n!=-1&&i.splice(n,1),this}},e.emitEvent=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){i=i.slice(0),e=e||[];for(var n=this._onceEvents&&this._onceEvents[t],o=0;o<i.length;o++){var r=i[o],s=n&&n[r];s&&(this.off(t,r),delete n[r]),r.apply(this,e)}return this}},e.allOff=function(){delete this._events,delete this._onceEvents},t}),function(t,e){"use strict";"function"==typeof define&&define.amd?define("desandro-matches-selector/matches-selector",e):"object"==typeof module&&module.exports?module.exports=e():t.matchesSelector=e()}(window,function(){"use strict";var t=function(){var t=window.Element.prototype;if(t.matches)return"matches";if(t.matchesSelector)return"matchesSelector";for(var e=["webkit","moz","ms","o"],i=0;i<e.length;i++){var n=e[i],o=n+"MatchesSelector";if(t[o])return o}}();return function(e,i){return e[t](i)}}),function(t,e){"function"==typeof define&&define.amd?define("fizzy-ui-utils/utils",["desandro-matches-selector/matches-selector"],function(i){return e(t,i)}):"object"==typeof module&&module.exports?module.exports=e(t,require("desandro-matches-selector")):t.fizzyUIUtils=e(t,t.matchesSelector)}(window,function(t,e){var i={};i.extend=function(t,e){for(var i in e)t[i]=e[i];return t},i.modulo=function(t,e){return(t%e+e)%e},i.makeArray=function(t){var e=[];if(Array.isArray(t))e=t;else if(t&&"object"==typeof t&&"number"==typeof t.length)for(var i=0;i<t.length;i++)e.push(t[i]);else e.push(t);return e},i.removeFrom=function(t,e){var i=t.indexOf(e);i!=-1&&t.splice(i,1)},i.getParent=function(t,i){for(;t.parentNode&&t!=document.body;)if(t=t.parentNode,e(t,i))return t},i.getQueryElement=function(t){return"string"==typeof t?document.querySelector(t):t},i.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},i.filterFindElements=function(t,n){t=i.makeArray(t);var o=[];return t.forEach(function(t){if(t instanceof HTMLElement){if(!n)return void o.push(t);e(t,n)&&o.push(t);for(var i=t.querySelectorAll(n),r=0;r<i.length;r++)o.push(i[r])}}),o},i.debounceMethod=function(t,e,i){var n=t.prototype[e],o=e+"Timeout";t.prototype[e]=function(){var t=this[o];t&&clearTimeout(t);var e=arguments,r=this;this[o]=setTimeout(function(){n.apply(r,e),delete r[o]},i||100)}},i.docReady=function(t){var e=document.readyState;"complete"==e||"interactive"==e?setTimeout(t):document.addEventListener("DOMContentLoaded",t)},i.toDashed=function(t){return t.replace(/(.)([A-Z])/g,function(t,e,i){return e+"-"+i}).toLowerCase()};var n=t.console;return i.htmlInit=function(e,o){i.docReady(function(){var r=i.toDashed(o),s="data-"+r,l=document.querySelectorAll("["+s+"]"),a=document.querySelectorAll(".js-"+r),h=i.makeArray(l).concat(i.makeArray(a)),c=s+"-options",u=t.jQuery;h.forEach(function(t){var i,r=t.getAttribute(s)||t.getAttribute(c);try{i=r&&JSON.parse(r)}catch(l){return void(n&&n.error("Error parsing "+s+" on "+t.className+": "+l))}var a=new e(t,i);u&&u.data(t,o,a)})})},i}),function(t,e){"function"==typeof define&&define.amd?define("infinite-scroll/js/core",["ev-emitter/ev-emitter","fizzy-ui-utils/utils"],function(i,n){return e(t,i,n)}):"object"==typeof module&&module.exports?module.exports=e(t,require("ev-emitter"),require("fizzy-ui-utils")):t.InfiniteScroll=e(t,t.EvEmitter,t.fizzyUIUtils)}(window,function(t,e,i){function n(t,e){var s=i.getQueryElement(t);if(!s)return void console.error("Bad element for InfiniteScroll: "+(s||t));if(t=s,t.infiniteScrollGUID){var l=r[t.infiniteScrollGUID];return l.option(e),l}this.element=t,this.options=i.extend({},n.defaults),this.option(e),o&&(this.$element=o(this.element)),this.create()}var o=t.jQuery,r={};n.defaults={},n.create={},n.destroy={};var s=n.prototype;i.extend(s,e.prototype);var l=0;s.create=function(){var t=this.guid=++l;if(this.element.infiniteScrollGUID=t,r[t]=this,this.pageIndex=1,this.loadCount=0,this.updateGetPath(),!this.getPath)return void console.error("Disabling InfiniteScroll");this.updateGetAbsolutePath(),this.log("initialized",[this.element.className]),this.callOnInit();for(var e in n.create)n.create[e].call(this)},s.option=function(t){i.extend(this.options,t)},s.callOnInit=function(){var t=this.options.onInit;t&&t.call(this,this)},s.dispatchEvent=function(t,e,i){this.log(t,i);var n=e?[e].concat(i):i;if(this.emitEvent(t,n),o&&this.$element){t+=".infiniteScroll";var r=t;if(e){var s=o.Event(e);s.type=t,r=s}this.$element.trigger(r,i)}};var a={initialized:function(t){return"on "+t},request:function(t){return"URL: "+t},load:function(t,e){return(t.title||"")+". URL: "+e},error:function(t,e){return t+". URL: "+e},append:function(t,e,i){return i.length+" items. URL: "+e},last:function(t,e){return"URL: "+e},history:function(t,e){return"URL: "+e},pageIndex:function(t,e){return"current page determined to be: "+t+" from "+e}};s.log=function(t,e){if(this.options.debug){var i="[InfiniteScroll] "+t,n=a[t];n&&(i+=". "+n.apply(this,e)),console.log(i)}},s.updateMeasurements=function(){this.windowHeight=t.innerHeight;var e=this.element.getBoundingClientRect();this.top=e.top+t.pageYOffset},s.updateScroller=function(){var e=this.options.elementScroll;if(!e)return void(this.scroller=t);if(this.scroller=e===!0?this.element:i.getQueryElement(e),!this.scroller)throw"Unable to find elementScroll: "+e},s.updateGetPath=function(){var t=this.options.path;if(!t)return void console.error("InfiniteScroll path option required. Set as: "+t);var e=typeof t;if("function"==e)return void(this.getPath=t);var i="string"==e&&t.match("{{#}}");return i?void this.updateGetPathTemplate(t):void this.updateGetPathSelector(t)},s.updateGetPathTemplate=function(t){this.getPath=function(){var e=this.pageIndex+1;return t.replace("{{#}}",e)}.bind(this);var e=t.replace("{{#}}","(\\d\\d?\\d?)"),i=new RegExp(e),n=location.href.match(i);n&&(this.pageIndex=parseInt(n[1],10),this.log("pageIndex",this.pageIndex,"template string"))};var h=[/^(.*?\/?page\/?)(\d\d?\d?)(.*?$)/,/^(.*?\/?\?page=)(\d\d?\d?)(.*?$)/,/(.*?)(\d\d?\d?)(?!.*\d)(.*?$)/];return s.updateGetPathSelector=function(t){var e=document.querySelector(t);if(!e)return void console.error("Bad InfiniteScroll path option. Next link not found: "+t);for(var i,n,o=e.getAttribute("href"),r=0;o&&r<h.length;r++){n=h[r];var s=o.match(n);if(s){i=s.slice(1);break}}return i?(this.isPathSelector=!0,this.getPath=function(){var t=this.pageIndex+1;return i[0]+t+i[2]}.bind(this),this.pageIndex=parseInt(i[1],10)-1,void this.log("pageIndex",[this.pageIndex,"next link"])):void console.error("InfiniteScroll unable to parse next link href: "+o)},s.updateGetAbsolutePath=function(){var t=this.getPath(),e=t.match(/^http/)||t.match(/^\//);if(e)return void(this.getAbsolutePath=this.getPath);var i=location.pathname,n=i.substring(0,i.lastIndexOf("/"));this.getAbsolutePath=function(){return n+"/"+this.getPath()}},n.create.hideNav=function(){var t=i.getQueryElement(this.options.hideNav);t&&(t.style.display="none",this.nav=t)},n.destroy.hideNav=function(){this.nav&&(this.nav.style.display="")},s.destroy=function(){this.allOff();for(var t in n.destroy)n.destroy[t].call(this);delete this.element.infiniteScrollGUID,delete r[this.guid]},n.throttle=function(t,e){e=e||200;var i,n;return function(){var o=+new Date,r=arguments,s=function(){i=o,t.apply(this,r)}.bind(this);i&&o<i+e?(clearTimeout(n),n=setTimeout(s,e)):s()}},n.data=function(t){t=i.getQueryElement(t);var e=t&&t.infiniteScrollGUID;return e&&r[e]},n.setJQuery=function(t){o=t},i.htmlInit(n,"infinite-scroll"),o&&o.bridget&&o.bridget("infiniteScroll",n),n}),function(t,e){"function"==typeof define&&define.amd?define("infinite-scroll/js/page-load",["./core"],function(i){return e(t,i)}):"object"==typeof module&&module.exports?module.exports=e(t,require("./core")):e(t,t.InfiniteScroll)}(window,function(t,e){function i(t){for(var e=document.createDocumentFragment(),i=0;t&&i<t.length;i++)e.appendChild(t[i]);return e}function n(t){for(var e=t.querySelectorAll("script"),i=0;i<e.length;i++){var n=e[i],r=document.createElement("script");o(n,r),n.parentNode.replaceChild(r,n)}}function o(t,e){for(var i=t.attributes,n=0;n<i.length;n++){var o=i[n];e.setAttribute(o.name,o.value)}}function r(t,e,i,n){var o=new XMLHttpRequest;o.open("GET",t,!0),o.responseType=e||"",o.setRequestHeader("X-Requested-With","XMLHttpRequest"),o.onload=function(){if(200==o.status)i(o.response);else{var t=new Error(o.statusText);n(t)}},o.onerror=function(){var e=new Error("Network error requesting "+t);n(e)},o.send()}var s=e.prototype;return e.defaults.loadOnScroll=!0,e.defaults.checkLastPage=!0,e.defaults.responseType="document",e.create.pageLoad=function(){this.canLoad=!0,this.on("scrollThreshold",this.onScrollThresholdLoad),this.on("load",this.checkLastPage),this.options.outlayer&&this.on("append",this.onAppendOutlayer)},s.onScrollThresholdLoad=function(){this.options.loadOnScroll&&this.loadNextPage()},s.loadNextPage=function(){if(!this.isLoading&&this.canLoad){var t=this.getAbsolutePath();this.isLoading=!0;var e=function(e){this.onPageLoad(e,t)}.bind(this),i=function(e){this.onPageError(e,t)}.bind(this);r(t,this.options.responseType,e,i),this.dispatchEvent("request",null,[t])}},s.onPageLoad=function(t,e){return this.options.append||(this.isLoading=!1),this.pageIndex++,this.loadCount++,this.dispatchEvent("load",null,[t,e]),this.appendNextPage(t,e),t},s.appendNextPage=function(t,e){var n=this.options.append,o="document"==this.options.responseType;if(o&&n){var r=t.querySelectorAll(n),s=i(r),l=function(){this.appendItems(r,s),this.isLoading=!1,this.dispatchEvent("append",null,[t,e,r])}.bind(this);this.options.outlayer?this.appendOutlayerItems(s,l):l()}},s.appendItems=function(t,e){t&&t.length&&(e=e||i(t),n(e),this.element.appendChild(e))},s.appendOutlayerItems=function(i,n){var o=e.imagesLoaded||t.imagesLoaded;return o?void o(i,n):(console.error("[InfiniteScroll] imagesLoaded required for outlayer option"),void(this.isLoading=!1))},s.onAppendOutlayer=function(t,e,i){this.options.outlayer.appended(i)},s.checkLastPage=function(t,e){var i=this.options.checkLastPage;if(i){var n=this.options.path;if("function"==typeof n){var o=this.getPath();if(!o)return void this.lastPageReached(t,e)}var r;if("string"==typeof i?r=i:this.isPathSelector&&(r=n),r&&t.querySelector){var s=t.querySelector(r);s||this.lastPageReached(t,e)}}},s.lastPageReached=function(t,e){this.canLoad=!1,this.dispatchEvent("last",null,[t,e])},s.onPageError=function(t,e){return this.isLoading=!1,this.canLoad=!1,this.dispatchEvent("error",null,[t,e]),t},e.create.prefill=function(){if(this.options.prefill){var t=this.options.append;if(!t)return void console.error("append option required for prefill. Set as :"+t);this.updateMeasurements(),this.updateScroller(),this.isPrefilling=!0,this.on("append",this.prefill),this.once("error",this.stopPrefill),this.once("last",this.stopPrefill),this.prefill()}},s.prefill=function(){var t=this.getPrefillDistance();this.isPrefilling=t>=0,this.isPrefilling?(this.log("prefill"),this.loadNextPage()):this.stopPrefill()},s.getPrefillDistance=function(){return this.options.elementScroll?this.scroller.clientHeight-this.scroller.scrollHeight:this.windowHeight-this.element.clientHeight},s.stopPrefill=function(){console.log("stopping prefill"),this.off("append",this.prefill)},e}),function(t,e){"function"==typeof define&&define.amd?define("infinite-scroll/js/scroll-watch",["./core","fizzy-ui-utils/utils"],function(i,n){return e(t,i,n)}):"object"==typeof module&&module.exports?module.exports=e(t,require("./core"),require("fizzy-ui-utils")):e(t,t.InfiniteScroll,t.fizzyUIUtils)}(window,function(t,e,i){var n=e.prototype;return e.defaults.scrollThreshold=400,e.create.scrollWatch=function(){this.pageScrollHandler=this.onPageScroll.bind(this),this.resizeHandler=this.onResize.bind(this);var t=this.options.scrollThreshold,e=t||0===t;e&&this.enableScrollWatch()},e.destroy.scrollWatch=function(){this.disableScrollWatch()},n.enableScrollWatch=function(){this.isScrollWatching||(this.isScrollWatching=!0,this.updateMeasurements(),this.updateScroller(),this.on("last",this.disableScrollWatch),this.bindScrollWatchEvents(!0))},n.disableScrollWatch=function(){this.isScrollWatching&&(this.bindScrollWatchEvents(!1),delete this.isScrollWatching)},n.bindScrollWatchEvents=function(e){var i=e?"addEventListener":"removeEventListener";this.scroller[i]("scroll",this.pageScrollHandler),t[i]("resize",this.resizeHandler)},n.onPageScroll=e.throttle(function(){var t=this.getBottomDistance();t<=this.options.scrollThreshold&&this.dispatchEvent("scrollThreshold")}),n.getBottomDistance=function(){return this.options.elementScroll?this.getElementBottomDistance():this.getWindowBottomDistance()},n.getWindowBottomDistance=function(){var e=this.top+this.element.clientHeight,i=t.pageYOffset+this.windowHeight;return e-i},n.getElementBottomDistance=function(){var t=this.scroller.scrollHeight,e=this.scroller.scrollTop+this.scroller.clientHeight;return t-e},n.onResize=function(){this.updateMeasurements()},i.debounceMethod(e,"onResize",150),e}),function(t,e){"function"==typeof define&&define.amd?define("infinite-scroll/js/history",["./core","fizzy-ui-utils/utils"],function(i,n){return e(t,i,n)}):"object"==typeof module&&module.exports?module.exports=e(t,require("./core"),require("fizzy-ui-utils")):e(t,t.InfiniteScroll,t.fizzyUIUtils)}(window,function(t,e,i){var n=e.prototype;e.defaults.history="replace";var o=document.createElement("a");return e.create.history=function(){if(this.options.history){o.href=this.getAbsolutePath();var t=o.origin||o.protocol+"//"+o.host,e=t==location.origin;return e?void(this.options.append?this.createHistoryAppend():this.createHistoryPageLoad()):void console.error("[InfiniteScroll] cannot set history with different origin: "+o.origin+" on "+location.origin+" . History behavior disabled.")}},n.createHistoryAppend=function(){this.updateMeasurements(),this.updateScroller(),this.scrollPages=[{top:0,path:location.href,title:document.title}],this.scrollPageIndex=0,this.scrollHistoryHandler=this.onScrollHistory.bind(this),this.unloadHandler=this.onUnload.bind(this),this.scroller.addEventListener("scroll",this.scrollHistoryHandler),this.on("append",this.onAppendHistory),this.bindHistoryAppendEvents(!0)},n.bindHistoryAppendEvents=function(e){var i=e?"addEventListener":"removeEventListener";this.scroller[i]("scroll",this.scrollHistoryHandler),t[i]("unload",this.unloadHandler)},n.createHistoryPageLoad=function(){this.on("load",this.onPageLoadHistory)},e.destroy.history=n.destroyHistory=function(){var t=this.options.history&&this.options.append;t&&this.bindHistoryAppendEvents(!1)},n.onAppendHistory=function(t,e,i){var n=i[0],r=this.getElementScrollY(n);o.href=e,this.scrollPages.push({top:r,path:o.href,title:t.title})},n.getElementScrollY=function(t){return this.options.elementScroll?this.getElementElementScrollY(t):this.getElementWindowScrollY(t)},n.getElementWindowScrollY=function(e){var i=e.getBoundingClientRect();return i.top+t.pageYOffset},n.getElementElementScrollY=function(t){return t.offsetTop-this.top},n.onScrollHistory=function(){for(var t,e,i=this.getScrollViewY(),n=0;n<this.scrollPages.length;n++){var o=this.scrollPages[n];if(o.top>=i)break;t=n,e=o}t!=this.scrollPageIndex&&(this.scrollPageIndex=t,this.setHistory(e.title,e.path))},i.debounceMethod(e,"onScrollHistory",150),n.getScrollViewY=function(){return this.options.elementScroll?this.scroller.scrollTop+this.scroller.clientHeight/2:t.pageYOffset+this.windowHeight/2},n.setHistory=function(t,e){var i=this.options.history,n=i&&history[i+"State"];n&&(history[i+"State"](null,t,e),this.options.historyTitle&&(document.title=t),this.dispatchEvent("history",null,[t,e]))},n.onUnload=function(){var e=this.scrollPageIndex;if(0!==e){var i=this.scrollPages[e],n=t.pageYOffset-i.top+this.top;this.destroyHistory(),scrollTo(0,n)}},n.onPageLoadHistory=function(t,e){this.setHistory(t.title,e)},e}),function(t,e){"function"==typeof define&&define.amd?define("infinite-scroll/js/button",["./core","fizzy-ui-utils/utils"],function(i,n){return e(t,i,n)}):"object"==typeof module&&module.exports?module.exports=e(t,require("./core"),require("fizzy-ui-utils")):e(t,t.InfiniteScroll,t.fizzyUIUtils)}(window,function(t,e,i){function n(t,e){this.element=t,this.infScroll=e,this.clickHandler=this.onClick.bind(this),this.element.addEventListener("click",this.clickHandler),e.on("request",this.disable.bind(this)),e.on("load",this.enable.bind(this)),e.on("error",this.hide.bind(this)),e.on("last",this.hide.bind(this))}return e.create.button=function(){var t=i.getQueryElement(this.options.button);if(t)return void(this.button=new n(t,this))},e.destroy.button=function(){this.button&&this.button.destroy()},n.prototype.onClick=function(t){t.preventDefault(),this.infScroll.loadNextPage()},n.prototype.enable=function(){this.element.removeAttribute("disabled")},n.prototype.disable=function(){this.element.disabled="disabled"},n.prototype.hide=function(){this.element.style.display="none"},n.prototype.destroy=function(){this.element.removeEventListener("click",this.clickHandler)},e.Button=n,e}),function(t,e){"function"==typeof define&&define.amd?define("infinite-scroll/js/status",["./core","fizzy-ui-utils/utils"],function(i,n){return e(t,i,n)}):"object"==typeof module&&module.exports?module.exports=e(t,require("./core"),require("fizzy-ui-utils")):e(t,t.InfiniteScroll,t.fizzyUIUtils)}(window,function(t,e,i){function n(t){r(t,"none")}function o(t){r(t,"block")}function r(t,e){t&&(t.style.display=e)}var s=e.prototype;return e.create.status=function(){var t=i.getQueryElement(this.options.status);t&&(this.statusElement=t,this.statusEventElements={request:t.querySelector(".infinite-scroll-request"),error:t.querySelector(".infinite-scroll-error"),last:t.querySelector(".infinite-scroll-last")},this.on("request",this.showRequestStatus),this.on("error",this.showErrorStatus),this.on("last",this.showLastStatus),this.bindHideStatus("on"))},s.bindHideStatus=function(t){var e=this.options.append?"append":"load";this[t](e,this.hideAllStatus)},s.showRequestStatus=function(){this.showStatus("request")},s.showErrorStatus=function(){this.showStatus("error")},s.showLastStatus=function(){this.showStatus("last"),this.bindHideStatus("off")},s.showStatus=function(t){o(this.statusElement),this.hideStatusEventElements();var e=this.statusEventElements[t];o(e)},s.hideAllStatus=function(){n(this.statusElement),this.hideStatusEventElements()},s.hideStatusEventElements=function(){for(var t in this.statusEventElements){var e=this.statusEventElements[t];n(e)}},e}),function(t,e){"function"==typeof define&&define.amd?define(["infinite-scroll/js/core","infinite-scroll/js/page-load","infinite-scroll/js/scroll-watch","infinite-scroll/js/history","infinite-scroll/js/button","infinite-scroll/js/status"],e):"object"==typeof module&&module.exports&&(module.exports=e(require("./core"),require("./page-load"),require("./scroll-watch"),require("./history"),require("./button"),require("./status")))}(window,function(t){return t}),function(t,e){"use strict";"function"==typeof define&&define.amd?define("imagesloaded/imagesloaded",["ev-emitter/ev-emitter"],function(i){return e(t,i)}):"object"==typeof module&&module.exports?module.exports=e(t,require("ev-emitter")):t.imagesLoaded=e(t,t.EvEmitter)}("undefined"!=typeof window?window:this,function(t,e){function i(t,e){for(var i in e)t[i]=e[i];return t}function n(t){if(Array.isArray(t))return t;var e="object"==typeof t&&"number"==typeof t.length;return e?h.call(t):[t]}function o(t,e,r){if(!(this instanceof o))return new o(t,e,r);var s=t;return"string"==typeof t&&(s=document.querySelectorAll(t)),s?(this.elements=n(s),this.options=i({},this.options),"function"==typeof e?r=e:i(this.options,e),r&&this.on("always",r),this.getImages(),l&&(this.jqDeferred=new l.Deferred),void setTimeout(this.check.bind(this))):void a.error("Bad element for imagesLoaded "+(s||t))}function r(t){this.img=t}function s(t,e){this.url=t,this.element=e,this.img=new Image}var l=t.jQuery,a=t.console,h=Array.prototype.slice;o.prototype=Object.create(e.prototype),o.prototype.options={},o.prototype.getImages=function(){this.images=[],this.elements.forEach(this.addElementImages,this)},o.prototype.addElementImages=function(t){"IMG"==t.nodeName&&this.addImage(t),this.options.background===!0&&this.addElementBackgroundImages(t);var e=t.nodeType;if(e&&c[e]){for(var i=t.querySelectorAll("img"),n=0;n<i.length;n++){var o=i[n];this.addImage(o)}if("string"==typeof this.options.background){var r=t.querySelectorAll(this.options.background);for(n=0;n<r.length;n++){var s=r[n];this.addElementBackgroundImages(s)}}}};var c={1:!0,9:!0,11:!0};return o.prototype.addElementBackgroundImages=function(t){var e=getComputedStyle(t);if(e)for(var i=/url\((['"])?(.*?)\1\)/gi,n=i.exec(e.backgroundImage);null!==n;){var o=n&&n[2];o&&this.addBackground(o,t),n=i.exec(e.backgroundImage)}},o.prototype.addImage=function(t){var e=new r(t);this.images.push(e)},o.prototype.addBackground=function(t,e){var i=new s(t,e);this.images.push(i)},o.prototype.check=function(){function t(t,i,n){setTimeout(function(){e.progress(t,i,n)})}var e=this;return this.progressedCount=0,this.hasAnyBroken=!1,this.images.length?void this.images.forEach(function(e){e.once("progress",t),e.check()}):void this.complete()},o.prototype.progress=function(t,e,i){this.progressedCount++,this.hasAnyBroken=this.hasAnyBroken||!t.isLoaded,this.emitEvent("progress",[this,t,e]),this.jqDeferred&&this.jqDeferred.notify&&this.jqDeferred.notify(this,t),this.progressedCount==this.images.length&&this.complete(),this.options.debug&&a&&a.log("progress: "+i,t,e)},o.prototype.complete=function(){var t=this.hasAnyBroken?"fail":"done";if(this.isComplete=!0,this.emitEvent(t,[this]),this.emitEvent("always",[this]),this.jqDeferred){var e=this.hasAnyBroken?"reject":"resolve";this.jqDeferred[e](this)}},r.prototype=Object.create(e.prototype),r.prototype.check=function(){var t=this.getIsImageComplete();return t?void this.confirm(0!==this.img.naturalWidth,"naturalWidth"):(this.proxyImage=new Image,this.proxyImage.addEventListener("load",this),this.proxyImage.addEventListener("error",this),this.img.addEventListener("load",this),this.img.addEventListener("error",this),void(this.proxyImage.src=this.img.src))},r.prototype.getIsImageComplete=function(){return this.img.complete&&this.img.naturalWidth},r.prototype.confirm=function(t,e){this.isLoaded=t,this.emitEvent("progress",[this,this.img,e])},r.prototype.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},r.prototype.onload=function(){this.confirm(!0,"onload"),this.unbindEvents()},r.prototype.onerror=function(){this.confirm(!1,"onerror"),this.unbindEvents()},r.prototype.unbindEvents=function(){this.proxyImage.removeEventListener("load",this),this.proxyImage.removeEventListener("error",this),this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},s.prototype=Object.create(r.prototype),s.prototype.check=function(){this.img.addEventListener("load",this),this.img.addEventListener("error",this),this.img.src=this.url;var t=this.getIsImageComplete();t&&(this.confirm(0!==this.img.naturalWidth,"naturalWidth"),this.unbindEvents())},s.prototype.unbindEvents=function(){this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},s.prototype.confirm=function(t,e){this.isLoaded=t,this.emitEvent("progress",[this,this.element,e])},o.makeJQueryPlugin=function(e){e=e||t.jQuery,e&&(l=e,l.fn.imagesLoaded=function(t,e){var i=new o(this,t,e);return i.jqDeferred.promise(l(this))})},o.makeJQueryPlugin(),o});
/*
**  Anderson Ferminiano
**  contato@andersonferminiano.com -- feel free to contact me for bugs or new implementations.
**  jQuery ScrollPagination
**  28th/March/2011
**  http://andersonferminiano.com/jqueryscrollpagination/
**  You may use this script for free, but keep my credits.
**  Thank you.
*/

(function( $ ){
     
         
 $.fn.scrollPagination = function(options) {
    
        var opts = $.extend($.fn.scrollPagination.defaults, options);  
        var target = opts.scrollTarget;
        if (target == null){
            target = obj; 
        }
        opts.scrollTarget = target;
     
        return this.each(function() {
          $.fn.scrollPagination.init($(this), opts);
        });

  };
  
  $.fn.stopScrollPagination = function(){
      return this.each(function() {
        $(this).attr('scrollPagination', 'disabled');
      });
      
  };
  
  $.fn.scrollPagination.loadContent = function(obj, opts){
     var target = opts.scrollTarget;
     var mayLoadContent = $(target).scrollTop()+opts.heightOffset >= $(document).height() - $(target).height();
     if (mayLoadContent){
         if (opts.beforeLoad != null){
            opts.beforeLoad(); 
         }
         $(obj).children().attr('rel', 'loaded');
         $.ajax({
              type: 'POST',
              url: opts.contentPage,
              data: opts.contentData,
              success: function(data){
                $(obj).append(data); 
                var objectsRendered = $(obj).children('[rel!=loaded]');
                
                if (opts.afterLoad != null){
                    opts.afterLoad(objectsRendered);    
                }
              },
              dataType: 'html'
         });
     }
     
  };
  
  $.fn.scrollPagination.init = function(obj, opts){
     var target = opts.scrollTarget;
     $(obj).attr('scrollPagination', 'enabled');
    
     $(target).scroll(function(event){
        if ($(obj).attr('scrollPagination') == 'enabled'){
            $.fn.scrollPagination.loadContent(obj, opts);       
        }
        else {
            event.stopPropagation();    
        }
     });
     
     $.fn.scrollPagination.loadContent(obj, opts);
     
 };
    
 $.fn.scrollPagination.defaults = {
         'contentPage' : null,
         'contentData' : {},
         'beforeLoad': null,
         'afterLoad': null  ,
         'scrollTarget': null,
         'heightOffset': 0        
 }; 
})( jQuery );
/*! Hammer.JS - v2.0.8 - 2016-04-23
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2016 Jorik Tangelder;
 * Licensed under the MIT license */
!function(a,b,c,d){"use strict";function e(a,b,c){return setTimeout(j(a,c),b)}function f(a,b,c){return Array.isArray(a)?(g(a,c[b],c),!0):!1}function g(a,b,c){var e;if(a)if(a.forEach)a.forEach(b,c);else if(a.length!==d)for(e=0;e<a.length;)b.call(c,a[e],e,a),e++;else for(e in a)a.hasOwnProperty(e)&&b.call(c,a[e],e,a)}function h(b,c,d){var e="DEPRECATED METHOD: "+c+"\n"+d+" AT \n";return function(){var c=new Error("get-stack-trace"),d=c&&c.stack?c.stack.replace(/^[^\(]+?[\n$]/gm,"").replace(/^\s+at\s+/gm,"").replace(/^Object.<anonymous>\s*\(/gm,"{anonymous}()@"):"Unknown Stack Trace",f=a.console&&(a.console.warn||a.console.log);return f&&f.call(a.console,e,d),b.apply(this,arguments)}}function i(a,b,c){var d,e=b.prototype;d=a.prototype=Object.create(e),d.constructor=a,d._super=e,c&&la(d,c)}function j(a,b){return function(){return a.apply(b,arguments)}}function k(a,b){return typeof a==oa?a.apply(b?b[0]||d:d,b):a}function l(a,b){return a===d?b:a}function m(a,b,c){g(q(b),function(b){a.addEventListener(b,c,!1)})}function n(a,b,c){g(q(b),function(b){a.removeEventListener(b,c,!1)})}function o(a,b){for(;a;){if(a==b)return!0;a=a.parentNode}return!1}function p(a,b){return a.indexOf(b)>-1}function q(a){return a.trim().split(/\s+/g)}function r(a,b,c){if(a.indexOf&&!c)return a.indexOf(b);for(var d=0;d<a.length;){if(c&&a[d][c]==b||!c&&a[d]===b)return d;d++}return-1}function s(a){return Array.prototype.slice.call(a,0)}function t(a,b,c){for(var d=[],e=[],f=0;f<a.length;){var g=b?a[f][b]:a[f];r(e,g)<0&&d.push(a[f]),e[f]=g,f++}return c&&(d=b?d.sort(function(a,c){return a[b]>c[b]}):d.sort()),d}function u(a,b){for(var c,e,f=b[0].toUpperCase()+b.slice(1),g=0;g<ma.length;){if(c=ma[g],e=c?c+f:b,e in a)return e;g++}return d}function v(){return ua++}function w(b){var c=b.ownerDocument||b;return c.defaultView||c.parentWindow||a}function x(a,b){var c=this;this.manager=a,this.callback=b,this.element=a.element,this.target=a.options.inputTarget,this.domHandler=function(b){k(a.options.enable,[a])&&c.handler(b)},this.init()}function y(a){var b,c=a.options.inputClass;return new(b=c?c:xa?M:ya?P:wa?R:L)(a,z)}function z(a,b,c){var d=c.pointers.length,e=c.changedPointers.length,f=b&Ea&&d-e===0,g=b&(Ga|Ha)&&d-e===0;c.isFirst=!!f,c.isFinal=!!g,f&&(a.session={}),c.eventType=b,A(a,c),a.emit("hammer.input",c),a.recognize(c),a.session.prevInput=c}function A(a,b){var c=a.session,d=b.pointers,e=d.length;c.firstInput||(c.firstInput=D(b)),e>1&&!c.firstMultiple?c.firstMultiple=D(b):1===e&&(c.firstMultiple=!1);var f=c.firstInput,g=c.firstMultiple,h=g?g.center:f.center,i=b.center=E(d);b.timeStamp=ra(),b.deltaTime=b.timeStamp-f.timeStamp,b.angle=I(h,i),b.distance=H(h,i),B(c,b),b.offsetDirection=G(b.deltaX,b.deltaY);var j=F(b.deltaTime,b.deltaX,b.deltaY);b.overallVelocityX=j.x,b.overallVelocityY=j.y,b.overallVelocity=qa(j.x)>qa(j.y)?j.x:j.y,b.scale=g?K(g.pointers,d):1,b.rotation=g?J(g.pointers,d):0,b.maxPointers=c.prevInput?b.pointers.length>c.prevInput.maxPointers?b.pointers.length:c.prevInput.maxPointers:b.pointers.length,C(c,b);var k=a.element;o(b.srcEvent.target,k)&&(k=b.srcEvent.target),b.target=k}function B(a,b){var c=b.center,d=a.offsetDelta||{},e=a.prevDelta||{},f=a.prevInput||{};b.eventType!==Ea&&f.eventType!==Ga||(e=a.prevDelta={x:f.deltaX||0,y:f.deltaY||0},d=a.offsetDelta={x:c.x,y:c.y}),b.deltaX=e.x+(c.x-d.x),b.deltaY=e.y+(c.y-d.y)}function C(a,b){var c,e,f,g,h=a.lastInterval||b,i=b.timeStamp-h.timeStamp;if(b.eventType!=Ha&&(i>Da||h.velocity===d)){var j=b.deltaX-h.deltaX,k=b.deltaY-h.deltaY,l=F(i,j,k);e=l.x,f=l.y,c=qa(l.x)>qa(l.y)?l.x:l.y,g=G(j,k),a.lastInterval=b}else c=h.velocity,e=h.velocityX,f=h.velocityY,g=h.direction;b.velocity=c,b.velocityX=e,b.velocityY=f,b.direction=g}function D(a){for(var b=[],c=0;c<a.pointers.length;)b[c]={clientX:pa(a.pointers[c].clientX),clientY:pa(a.pointers[c].clientY)},c++;return{timeStamp:ra(),pointers:b,center:E(b),deltaX:a.deltaX,deltaY:a.deltaY}}function E(a){var b=a.length;if(1===b)return{x:pa(a[0].clientX),y:pa(a[0].clientY)};for(var c=0,d=0,e=0;b>e;)c+=a[e].clientX,d+=a[e].clientY,e++;return{x:pa(c/b),y:pa(d/b)}}function F(a,b,c){return{x:b/a||0,y:c/a||0}}function G(a,b){return a===b?Ia:qa(a)>=qa(b)?0>a?Ja:Ka:0>b?La:Ma}function H(a,b,c){c||(c=Qa);var d=b[c[0]]-a[c[0]],e=b[c[1]]-a[c[1]];return Math.sqrt(d*d+e*e)}function I(a,b,c){c||(c=Qa);var d=b[c[0]]-a[c[0]],e=b[c[1]]-a[c[1]];return 180*Math.atan2(e,d)/Math.PI}function J(a,b){return I(b[1],b[0],Ra)+I(a[1],a[0],Ra)}function K(a,b){return H(b[0],b[1],Ra)/H(a[0],a[1],Ra)}function L(){this.evEl=Ta,this.evWin=Ua,this.pressed=!1,x.apply(this,arguments)}function M(){this.evEl=Xa,this.evWin=Ya,x.apply(this,arguments),this.store=this.manager.session.pointerEvents=[]}function N(){this.evTarget=$a,this.evWin=_a,this.started=!1,x.apply(this,arguments)}function O(a,b){var c=s(a.touches),d=s(a.changedTouches);return b&(Ga|Ha)&&(c=t(c.concat(d),"identifier",!0)),[c,d]}function P(){this.evTarget=bb,this.targetIds={},x.apply(this,arguments)}function Q(a,b){var c=s(a.touches),d=this.targetIds;if(b&(Ea|Fa)&&1===c.length)return d[c[0].identifier]=!0,[c,c];var e,f,g=s(a.changedTouches),h=[],i=this.target;if(f=c.filter(function(a){return o(a.target,i)}),b===Ea)for(e=0;e<f.length;)d[f[e].identifier]=!0,e++;for(e=0;e<g.length;)d[g[e].identifier]&&h.push(g[e]),b&(Ga|Ha)&&delete d[g[e].identifier],e++;return h.length?[t(f.concat(h),"identifier",!0),h]:void 0}function R(){x.apply(this,arguments);var a=j(this.handler,this);this.touch=new P(this.manager,a),this.mouse=new L(this.manager,a),this.primaryTouch=null,this.lastTouches=[]}function S(a,b){a&Ea?(this.primaryTouch=b.changedPointers[0].identifier,T.call(this,b)):a&(Ga|Ha)&&T.call(this,b)}function T(a){var b=a.changedPointers[0];if(b.identifier===this.primaryTouch){var c={x:b.clientX,y:b.clientY};this.lastTouches.push(c);var d=this.lastTouches,e=function(){var a=d.indexOf(c);a>-1&&d.splice(a,1)};setTimeout(e,cb)}}function U(a){for(var b=a.srcEvent.clientX,c=a.srcEvent.clientY,d=0;d<this.lastTouches.length;d++){var e=this.lastTouches[d],f=Math.abs(b-e.x),g=Math.abs(c-e.y);if(db>=f&&db>=g)return!0}return!1}function V(a,b){this.manager=a,this.set(b)}function W(a){if(p(a,jb))return jb;var b=p(a,kb),c=p(a,lb);return b&&c?jb:b||c?b?kb:lb:p(a,ib)?ib:hb}function X(){if(!fb)return!1;var b={},c=a.CSS&&a.CSS.supports;return["auto","manipulation","pan-y","pan-x","pan-x pan-y","none"].forEach(function(d){b[d]=c?a.CSS.supports("touch-action",d):!0}),b}function Y(a){this.options=la({},this.defaults,a||{}),this.id=v(),this.manager=null,this.options.enable=l(this.options.enable,!0),this.state=nb,this.simultaneous={},this.requireFail=[]}function Z(a){return a&sb?"cancel":a&qb?"end":a&pb?"move":a&ob?"start":""}function $(a){return a==Ma?"down":a==La?"up":a==Ja?"left":a==Ka?"right":""}function _(a,b){var c=b.manager;return c?c.get(a):a}function aa(){Y.apply(this,arguments)}function ba(){aa.apply(this,arguments),this.pX=null,this.pY=null}function ca(){aa.apply(this,arguments)}function da(){Y.apply(this,arguments),this._timer=null,this._input=null}function ea(){aa.apply(this,arguments)}function fa(){aa.apply(this,arguments)}function ga(){Y.apply(this,arguments),this.pTime=!1,this.pCenter=!1,this._timer=null,this._input=null,this.count=0}function ha(a,b){return b=b||{},b.recognizers=l(b.recognizers,ha.defaults.preset),new ia(a,b)}function ia(a,b){this.options=la({},ha.defaults,b||{}),this.options.inputTarget=this.options.inputTarget||a,this.handlers={},this.session={},this.recognizers=[],this.oldCssProps={},this.element=a,this.input=y(this),this.touchAction=new V(this,this.options.touchAction),ja(this,!0),g(this.options.recognizers,function(a){var b=this.add(new a[0](a[1]));a[2]&&b.recognizeWith(a[2]),a[3]&&b.requireFailure(a[3])},this)}function ja(a,b){var c=a.element;if(c.style){var d;g(a.options.cssProps,function(e,f){d=u(c.style,f),b?(a.oldCssProps[d]=c.style[d],c.style[d]=e):c.style[d]=a.oldCssProps[d]||""}),b||(a.oldCssProps={})}}function ka(a,c){var d=b.createEvent("Event");d.initEvent(a,!0,!0),d.gesture=c,c.target.dispatchEvent(d)}var la,ma=["","webkit","Moz","MS","ms","o"],na=b.createElement("div"),oa="function",pa=Math.round,qa=Math.abs,ra=Date.now;la="function"!=typeof Object.assign?function(a){if(a===d||null===a)throw new TypeError("Cannot convert undefined or null to object");for(var b=Object(a),c=1;c<arguments.length;c++){var e=arguments[c];if(e!==d&&null!==e)for(var f in e)e.hasOwnProperty(f)&&(b[f]=e[f])}return b}:Object.assign;var sa=h(function(a,b,c){for(var e=Object.keys(b),f=0;f<e.length;)(!c||c&&a[e[f]]===d)&&(a[e[f]]=b[e[f]]),f++;return a},"extend","Use `assign`."),ta=h(function(a,b){return sa(a,b,!0)},"merge","Use `assign`."),ua=1,va=/mobile|tablet|ip(ad|hone|od)|android/i,wa="ontouchstart"in a,xa=u(a,"PointerEvent")!==d,ya=wa&&va.test(navigator.userAgent),za="touch",Aa="pen",Ba="mouse",Ca="kinect",Da=25,Ea=1,Fa=2,Ga=4,Ha=8,Ia=1,Ja=2,Ka=4,La=8,Ma=16,Na=Ja|Ka,Oa=La|Ma,Pa=Na|Oa,Qa=["x","y"],Ra=["clientX","clientY"];x.prototype={handler:function(){},init:function(){this.evEl&&m(this.element,this.evEl,this.domHandler),this.evTarget&&m(this.target,this.evTarget,this.domHandler),this.evWin&&m(w(this.element),this.evWin,this.domHandler)},destroy:function(){this.evEl&&n(this.element,this.evEl,this.domHandler),this.evTarget&&n(this.target,this.evTarget,this.domHandler),this.evWin&&n(w(this.element),this.evWin,this.domHandler)}};var Sa={mousedown:Ea,mousemove:Fa,mouseup:Ga},Ta="mousedown",Ua="mousemove mouseup";i(L,x,{handler:function(a){var b=Sa[a.type];b&Ea&&0===a.button&&(this.pressed=!0),b&Fa&&1!==a.which&&(b=Ga),this.pressed&&(b&Ga&&(this.pressed=!1),this.callback(this.manager,b,{pointers:[a],changedPointers:[a],pointerType:Ba,srcEvent:a}))}});var Va={pointerdown:Ea,pointermove:Fa,pointerup:Ga,pointercancel:Ha,pointerout:Ha},Wa={2:za,3:Aa,4:Ba,5:Ca},Xa="pointerdown",Ya="pointermove pointerup pointercancel";a.MSPointerEvent&&!a.PointerEvent&&(Xa="MSPointerDown",Ya="MSPointerMove MSPointerUp MSPointerCancel"),i(M,x,{handler:function(a){var b=this.store,c=!1,d=a.type.toLowerCase().replace("ms",""),e=Va[d],f=Wa[a.pointerType]||a.pointerType,g=f==za,h=r(b,a.pointerId,"pointerId");e&Ea&&(0===a.button||g)?0>h&&(b.push(a),h=b.length-1):e&(Ga|Ha)&&(c=!0),0>h||(b[h]=a,this.callback(this.manager,e,{pointers:b,changedPointers:[a],pointerType:f,srcEvent:a}),c&&b.splice(h,1))}});var Za={touchstart:Ea,touchmove:Fa,touchend:Ga,touchcancel:Ha},$a="touchstart",_a="touchstart touchmove touchend touchcancel";i(N,x,{handler:function(a){var b=Za[a.type];if(b===Ea&&(this.started=!0),this.started){var c=O.call(this,a,b);b&(Ga|Ha)&&c[0].length-c[1].length===0&&(this.started=!1),this.callback(this.manager,b,{pointers:c[0],changedPointers:c[1],pointerType:za,srcEvent:a})}}});var ab={touchstart:Ea,touchmove:Fa,touchend:Ga,touchcancel:Ha},bb="touchstart touchmove touchend touchcancel";i(P,x,{handler:function(a){var b=ab[a.type],c=Q.call(this,a,b);c&&this.callback(this.manager,b,{pointers:c[0],changedPointers:c[1],pointerType:za,srcEvent:a})}});var cb=2500,db=25;i(R,x,{handler:function(a,b,c){var d=c.pointerType==za,e=c.pointerType==Ba;if(!(e&&c.sourceCapabilities&&c.sourceCapabilities.firesTouchEvents)){if(d)S.call(this,b,c);else if(e&&U.call(this,c))return;this.callback(a,b,c)}},destroy:function(){this.touch.destroy(),this.mouse.destroy()}});var eb=u(na.style,"touchAction"),fb=eb!==d,gb="compute",hb="auto",ib="manipulation",jb="none",kb="pan-x",lb="pan-y",mb=X();V.prototype={set:function(a){a==gb&&(a=this.compute()),fb&&this.manager.element.style&&mb[a]&&(this.manager.element.style[eb]=a),this.actions=a.toLowerCase().trim()},update:function(){this.set(this.manager.options.touchAction)},compute:function(){var a=[];return g(this.manager.recognizers,function(b){k(b.options.enable,[b])&&(a=a.concat(b.getTouchAction()))}),W(a.join(" "))},preventDefaults:function(a){var b=a.srcEvent,c=a.offsetDirection;if(this.manager.session.prevented)return void b.preventDefault();var d=this.actions,e=p(d,jb)&&!mb[jb],f=p(d,lb)&&!mb[lb],g=p(d,kb)&&!mb[kb];if(e){var h=1===a.pointers.length,i=a.distance<2,j=a.deltaTime<250;if(h&&i&&j)return}return g&&f?void 0:e||f&&c&Na||g&&c&Oa?this.preventSrc(b):void 0},preventSrc:function(a){this.manager.session.prevented=!0,a.preventDefault()}};var nb=1,ob=2,pb=4,qb=8,rb=qb,sb=16,tb=32;Y.prototype={defaults:{},set:function(a){return la(this.options,a),this.manager&&this.manager.touchAction.update(),this},recognizeWith:function(a){if(f(a,"recognizeWith",this))return this;var b=this.simultaneous;return a=_(a,this),b[a.id]||(b[a.id]=a,a.recognizeWith(this)),this},dropRecognizeWith:function(a){return f(a,"dropRecognizeWith",this)?this:(a=_(a,this),delete this.simultaneous[a.id],this)},requireFailure:function(a){if(f(a,"requireFailure",this))return this;var b=this.requireFail;return a=_(a,this),-1===r(b,a)&&(b.push(a),a.requireFailure(this)),this},dropRequireFailure:function(a){if(f(a,"dropRequireFailure",this))return this;a=_(a,this);var b=r(this.requireFail,a);return b>-1&&this.requireFail.splice(b,1),this},hasRequireFailures:function(){return this.requireFail.length>0},canRecognizeWith:function(a){return!!this.simultaneous[a.id]},emit:function(a){function b(b){c.manager.emit(b,a)}var c=this,d=this.state;qb>d&&b(c.options.event+Z(d)),b(c.options.event),a.additionalEvent&&b(a.additionalEvent),d>=qb&&b(c.options.event+Z(d))},tryEmit:function(a){return this.canEmit()?this.emit(a):void(this.state=tb)},canEmit:function(){for(var a=0;a<this.requireFail.length;){if(!(this.requireFail[a].state&(tb|nb)))return!1;a++}return!0},recognize:function(a){var b=la({},a);return k(this.options.enable,[this,b])?(this.state&(rb|sb|tb)&&(this.state=nb),this.state=this.process(b),void(this.state&(ob|pb|qb|sb)&&this.tryEmit(b))):(this.reset(),void(this.state=tb))},process:function(a){},getTouchAction:function(){},reset:function(){}},i(aa,Y,{defaults:{pointers:1},attrTest:function(a){var b=this.options.pointers;return 0===b||a.pointers.length===b},process:function(a){var b=this.state,c=a.eventType,d=b&(ob|pb),e=this.attrTest(a);return d&&(c&Ha||!e)?b|sb:d||e?c&Ga?b|qb:b&ob?b|pb:ob:tb}}),i(ba,aa,{defaults:{event:"pan",threshold:10,pointers:1,direction:Pa},getTouchAction:function(){var a=this.options.direction,b=[];return a&Na&&b.push(lb),a&Oa&&b.push(kb),b},directionTest:function(a){var b=this.options,c=!0,d=a.distance,e=a.direction,f=a.deltaX,g=a.deltaY;return e&b.direction||(b.direction&Na?(e=0===f?Ia:0>f?Ja:Ka,c=f!=this.pX,d=Math.abs(a.deltaX)):(e=0===g?Ia:0>g?La:Ma,c=g!=this.pY,d=Math.abs(a.deltaY))),a.direction=e,c&&d>b.threshold&&e&b.direction},attrTest:function(a){return aa.prototype.attrTest.call(this,a)&&(this.state&ob||!(this.state&ob)&&this.directionTest(a))},emit:function(a){this.pX=a.deltaX,this.pY=a.deltaY;var b=$(a.direction);b&&(a.additionalEvent=this.options.event+b),this._super.emit.call(this,a)}}),i(ca,aa,{defaults:{event:"pinch",threshold:0,pointers:2},getTouchAction:function(){return[jb]},attrTest:function(a){return this._super.attrTest.call(this,a)&&(Math.abs(a.scale-1)>this.options.threshold||this.state&ob)},emit:function(a){if(1!==a.scale){var b=a.scale<1?"in":"out";a.additionalEvent=this.options.event+b}this._super.emit.call(this,a)}}),i(da,Y,{defaults:{event:"press",pointers:1,time:251,threshold:9},getTouchAction:function(){return[hb]},process:function(a){var b=this.options,c=a.pointers.length===b.pointers,d=a.distance<b.threshold,f=a.deltaTime>b.time;if(this._input=a,!d||!c||a.eventType&(Ga|Ha)&&!f)this.reset();else if(a.eventType&Ea)this.reset(),this._timer=e(function(){this.state=rb,this.tryEmit()},b.time,this);else if(a.eventType&Ga)return rb;return tb},reset:function(){clearTimeout(this._timer)},emit:function(a){this.state===rb&&(a&&a.eventType&Ga?this.manager.emit(this.options.event+"up",a):(this._input.timeStamp=ra(),this.manager.emit(this.options.event,this._input)))}}),i(ea,aa,{defaults:{event:"rotate",threshold:0,pointers:2},getTouchAction:function(){return[jb]},attrTest:function(a){return this._super.attrTest.call(this,a)&&(Math.abs(a.rotation)>this.options.threshold||this.state&ob)}}),i(fa,aa,{defaults:{event:"swipe",threshold:10,velocity:.3,direction:Na|Oa,pointers:1},getTouchAction:function(){return ba.prototype.getTouchAction.call(this)},attrTest:function(a){var b,c=this.options.direction;return c&(Na|Oa)?b=a.overallVelocity:c&Na?b=a.overallVelocityX:c&Oa&&(b=a.overallVelocityY),this._super.attrTest.call(this,a)&&c&a.offsetDirection&&a.distance>this.options.threshold&&a.maxPointers==this.options.pointers&&qa(b)>this.options.velocity&&a.eventType&Ga},emit:function(a){var b=$(a.offsetDirection);b&&this.manager.emit(this.options.event+b,a),this.manager.emit(this.options.event,a)}}),i(ga,Y,{defaults:{event:"tap",pointers:1,taps:1,interval:300,time:250,threshold:9,posThreshold:10},getTouchAction:function(){return[ib]},process:function(a){var b=this.options,c=a.pointers.length===b.pointers,d=a.distance<b.threshold,f=a.deltaTime<b.time;if(this.reset(),a.eventType&Ea&&0===this.count)return this.failTimeout();if(d&&f&&c){if(a.eventType!=Ga)return this.failTimeout();var g=this.pTime?a.timeStamp-this.pTime<b.interval:!0,h=!this.pCenter||H(this.pCenter,a.center)<b.posThreshold;this.pTime=a.timeStamp,this.pCenter=a.center,h&&g?this.count+=1:this.count=1,this._input=a;var i=this.count%b.taps;if(0===i)return this.hasRequireFailures()?(this._timer=e(function(){this.state=rb,this.tryEmit()},b.interval,this),ob):rb}return tb},failTimeout:function(){return this._timer=e(function(){this.state=tb},this.options.interval,this),tb},reset:function(){clearTimeout(this._timer)},emit:function(){this.state==rb&&(this._input.tapCount=this.count,this.manager.emit(this.options.event,this._input))}}),ha.VERSION="2.0.8",ha.defaults={domEvents:!1,touchAction:gb,enable:!0,inputTarget:null,inputClass:null,preset:[[ea,{enable:!1}],[ca,{enable:!1},["rotate"]],[fa,{direction:Na}],[ba,{direction:Na},["swipe"]],[ga],[ga,{event:"doubletap",taps:2},["tap"]],[da]],cssProps:{userSelect:"none",touchSelect:"none",touchCallout:"none",contentZooming:"none",userDrag:"none",tapHighlightColor:"rgba(0,0,0,0)"}};var ub=1,vb=2;ia.prototype={set:function(a){return la(this.options,a),a.touchAction&&this.touchAction.update(),a.inputTarget&&(this.input.destroy(),this.input.target=a.inputTarget,this.input.init()),this},stop:function(a){this.session.stopped=a?vb:ub},recognize:function(a){var b=this.session;if(!b.stopped){this.touchAction.preventDefaults(a);var c,d=this.recognizers,e=b.curRecognizer;(!e||e&&e.state&rb)&&(e=b.curRecognizer=null);for(var f=0;f<d.length;)c=d[f],b.stopped===vb||e&&c!=e&&!c.canRecognizeWith(e)?c.reset():c.recognize(a),!e&&c.state&(ob|pb|qb)&&(e=b.curRecognizer=c),f++}},get:function(a){if(a instanceof Y)return a;for(var b=this.recognizers,c=0;c<b.length;c++)if(b[c].options.event==a)return b[c];return null},add:function(a){if(f(a,"add",this))return this;var b=this.get(a.options.event);return b&&this.remove(b),this.recognizers.push(a),a.manager=this,this.touchAction.update(),a},remove:function(a){if(f(a,"remove",this))return this;if(a=this.get(a)){var b=this.recognizers,c=r(b,a);-1!==c&&(b.splice(c,1),this.touchAction.update())}return this},on:function(a,b){if(a!==d&&b!==d){var c=this.handlers;return g(q(a),function(a){c[a]=c[a]||[],c[a].push(b)}),this}},off:function(a,b){if(a!==d){var c=this.handlers;return g(q(a),function(a){b?c[a]&&c[a].splice(r(c[a],b),1):delete c[a]}),this}},emit:function(a,b){this.options.domEvents&&ka(a,b);var c=this.handlers[a]&&this.handlers[a].slice();if(c&&c.length){b.type=a,b.preventDefault=function(){b.srcEvent.preventDefault()};for(var d=0;d<c.length;)c[d](b),d++}},destroy:function(){this.element&&ja(this,!1),this.handlers={},this.session={},this.input.destroy(),this.element=null}},la(ha,{INPUT_START:Ea,INPUT_MOVE:Fa,INPUT_END:Ga,INPUT_CANCEL:Ha,STATE_POSSIBLE:nb,STATE_BEGAN:ob,STATE_CHANGED:pb,STATE_ENDED:qb,STATE_RECOGNIZED:rb,STATE_CANCELLED:sb,STATE_FAILED:tb,DIRECTION_NONE:Ia,DIRECTION_LEFT:Ja,DIRECTION_RIGHT:Ka,DIRECTION_UP:La,DIRECTION_DOWN:Ma,DIRECTION_HORIZONTAL:Na,DIRECTION_VERTICAL:Oa,DIRECTION_ALL:Pa,Manager:ia,Input:x,TouchAction:V,TouchInput:P,MouseInput:L,PointerEventInput:M,TouchMouseInput:R,SingleTouchInput:N,Recognizer:Y,AttrRecognizer:aa,Tap:ga,Pan:ba,Swipe:fa,Pinch:ca,Rotate:ea,Press:da,on:m,off:n,each:g,merge:ta,extend:sa,assign:la,inherit:i,bindFn:j,prefixed:u});var wb="undefined"!=typeof a?a:"undefined"!=typeof self?self:{};wb.Hammer=ha,"function"==typeof define&&define.amd?define(function(){return ha}):"undefined"!=typeof module&&module.exports?module.exports=ha:a[c]=ha}(window,document,"Hammer");
//# sourceMappingURL=hammer.min.js.map
/********************************************
	-	THEMEPUNCH TOOLS Ver. 1.0     -
	 Last Update of Tools 27.02.2015
*********************************************/


/*
* @fileOverview TouchSwipe - jQuery Plugin
* @version 1.6.9
*
* @author Matt Bryson http://www.github.com/mattbryson
* @see https://github.com/mattbryson/TouchSwipe-Jquery-Plugin
* @see http://labs.skinkers.com/touchSwipe/
* @see http://plugins.jquery.com/project/touchSwipe
*
* Copyright (c) 2010 Matt Bryson
* Dual licensed under the MIT or GPL Version 2 licenses.
*
*/



(function(a){if(typeof define==="function"&&define.amd&&define.amd.jQuery){define(["jquery"],a)}else{a(jQuery)}}(function(f){var y="1.6.9",p="left",o="right",e="up",x="down",c="in",A="out",m="none",s="auto",l="swipe",t="pinch",B="tap",j="doubletap",b="longtap",z="hold",E="horizontal",u="vertical",i="all",r=10,g="start",k="move",h="end",q="cancel",a="ontouchstart" in window,v=window.navigator.msPointerEnabled&&!window.navigator.pointerEnabled,d=window.navigator.pointerEnabled||window.navigator.msPointerEnabled,C="TouchSwipe";var n={fingers:1,threshold:75,cancelThreshold:null,pinchThreshold:20,maxTimeThreshold:null,fingerReleaseThreshold:250,longTapThreshold:500,doubleTapThreshold:200,swipe:null,swipeLeft:null,swipeRight:null,swipeUp:null,swipeDown:null,swipeStatus:null,pinchIn:null,pinchOut:null,pinchStatus:null,click:null,tap:null,doubleTap:null,longTap:null,hold:null,triggerOnTouchEnd:true,triggerOnTouchLeave:false,allowPageScroll:"auto",fallbackToMouseEvents:true,excludedElements:"label, button, input, select, textarea, a, .noSwipe",preventDefaultEvents:true};f.fn.swipetp=function(H){var G=f(this),F=G.data(C);if(F&&typeof H==="string"){if(F[H]){return F[H].apply(this,Array.prototype.slice.call(arguments,1))}else{f.error("Method "+H+" does not exist on jQuery.swipetp")}}else{if(!F&&(typeof H==="object"||!H)){return w.apply(this,arguments)}}return G};f.fn.swipetp.version=y;f.fn.swipetp.defaults=n;f.fn.swipetp.phases={PHASE_START:g,PHASE_MOVE:k,PHASE_END:h,PHASE_CANCEL:q};f.fn.swipetp.directions={LEFT:p,RIGHT:o,UP:e,DOWN:x,IN:c,OUT:A};f.fn.swipetp.pageScroll={NONE:m,HORIZONTAL:E,VERTICAL:u,AUTO:s};f.fn.swipetp.fingers={ONE:1,TWO:2,THREE:3,ALL:i};function w(F){if(F&&(F.allowPageScroll===undefined&&(F.swipe!==undefined||F.swipeStatus!==undefined))){F.allowPageScroll=m}if(F.click!==undefined&&F.tap===undefined){F.tap=F.click}if(!F){F={}}F=f.extend({},f.fn.swipetp.defaults,F);return this.each(function(){var H=f(this);var G=H.data(C);if(!G){G=new D(this,F);H.data(C,G)}})}function D(a5,aw){var aA=(a||d||!aw.fallbackToMouseEvents),K=aA?(d?(v?"MSPointerDown":"pointerdown"):"touchstart"):"mousedown",az=aA?(d?(v?"MSPointerMove":"pointermove"):"touchmove"):"mousemove",V=aA?(d?(v?"MSPointerUp":"pointerup"):"touchend"):"mouseup",T=aA?null:"mouseleave",aE=(d?(v?"MSPointerCancel":"pointercancel"):"touchcancel");var ah=0,aQ=null,ac=0,a2=0,a0=0,H=1,ar=0,aK=0,N=null;var aS=f(a5);var aa="start";var X=0;var aR=null;var U=0,a3=0,a6=0,ae=0,O=0;var aX=null,ag=null;try{aS.bind(K,aO);aS.bind(aE,ba)}catch(al){f.error("events not supported "+K+","+aE+" on jQuery.swipetp")}this.enable=function(){aS.bind(K,aO);aS.bind(aE,ba);return aS};this.disable=function(){aL();return aS};this.destroy=function(){aL();aS.data(C,null);aS=null};this.option=function(bd,bc){if(aw[bd]!==undefined){if(bc===undefined){return aw[bd]}else{aw[bd]=bc}}else{f.error("Option "+bd+" does not exist on jQuery.swipetp.options")}return null};function aO(be){if(aC()){return}if(f(be.target).closest(aw.excludedElements,aS).length>0){return}var bf=be.originalEvent?be.originalEvent:be;var bd,bg=bf.touches,bc=bg?bg[0]:bf;aa=g;if(bg){X=bg.length}else{be.preventDefault()}ah=0;aQ=null;aK=null;ac=0;a2=0;a0=0;H=1;ar=0;aR=ak();N=ab();S();if(!bg||(X===aw.fingers||aw.fingers===i)||aY()){aj(0,bc);U=au();if(X==2){aj(1,bg[1]);a2=a0=av(aR[0].start,aR[1].start)}if(aw.swipeStatus||aw.pinchStatus){bd=P(bf,aa)}}else{bd=false}if(bd===false){aa=q;P(bf,aa);return bd}else{if(aw.hold){ag=setTimeout(f.proxy(function(){aS.trigger("hold",[bf.target]);if(aw.hold){bd=aw.hold.call(aS,bf,bf.target)}},this),aw.longTapThreshold)}ap(true)}return null}function a4(bf){var bi=bf.originalEvent?bf.originalEvent:bf;if(aa===h||aa===q||an()){return}var be,bj=bi.touches,bd=bj?bj[0]:bi;var bg=aI(bd);a3=au();if(bj){X=bj.length}if(aw.hold){clearTimeout(ag)}aa=k;if(X==2){if(a2==0){aj(1,bj[1]);a2=a0=av(aR[0].start,aR[1].start)}else{aI(bj[1]);a0=av(aR[0].end,aR[1].end);aK=at(aR[0].end,aR[1].end)}H=a8(a2,a0);ar=Math.abs(a2-a0)}if((X===aw.fingers||aw.fingers===i)||!bj||aY()){aQ=aM(bg.start,bg.end);am(bf,aQ);ah=aT(bg.start,bg.end);ac=aN();aJ(aQ,ah);if(aw.swipeStatus||aw.pinchStatus){be=P(bi,aa)}if(!aw.triggerOnTouchEnd||aw.triggerOnTouchLeave){var bc=true;if(aw.triggerOnTouchLeave){var bh=aZ(this);bc=F(bg.end,bh)}if(!aw.triggerOnTouchEnd&&bc){aa=aD(k)}else{if(aw.triggerOnTouchLeave&&!bc){aa=aD(h)}}if(aa==q||aa==h){P(bi,aa)}}}else{aa=q;P(bi,aa)}if(be===false){aa=q;P(bi,aa)}}function M(bc){var bd=bc.originalEvent?bc.originalEvent:bc,be=bd.touches;if(be){if(be.length){G();return true}}if(an()){X=ae}a3=au();ac=aN();if(bb()||!ao()){aa=q;P(bd,aa)}else{if(aw.triggerOnTouchEnd||(aw.triggerOnTouchEnd==false&&aa===k)){bc.preventDefault();aa=h;P(bd,aa)}else{if(!aw.triggerOnTouchEnd&&a7()){aa=h;aG(bd,aa,B)}else{if(aa===k){aa=q;P(bd,aa)}}}}ap(false);return null}function ba(){X=0;a3=0;U=0;a2=0;a0=0;H=1;S();ap(false)}function L(bc){var bd=bc.originalEvent?bc.originalEvent:bc;if(aw.triggerOnTouchLeave){aa=aD(h);P(bd,aa)}}function aL(){aS.unbind(K,aO);aS.unbind(aE,ba);aS.unbind(az,a4);aS.unbind(V,M);if(T){aS.unbind(T,L)}ap(false)}function aD(bg){var bf=bg;var be=aB();var bd=ao();var bc=bb();if(!be||bc){bf=q}else{if(bd&&bg==k&&(!aw.triggerOnTouchEnd||aw.triggerOnTouchLeave)){bf=h}else{if(!bd&&bg==h&&aw.triggerOnTouchLeave){bf=q}}}return bf}function P(be,bc){var bd,bf=be.touches;if((J()||W())||(Q()||aY())){if(J()||W()){bd=aG(be,bc,l)}if((Q()||aY())&&bd!==false){bd=aG(be,bc,t)}}else{if(aH()&&bd!==false){bd=aG(be,bc,j)}else{if(aq()&&bd!==false){bd=aG(be,bc,b)}else{if(ai()&&bd!==false){bd=aG(be,bc,B)}}}}if(bc===q){ba(be)}if(bc===h){if(bf){if(!bf.length){ba(be)}}else{ba(be)}}return bd}function aG(bf,bc,be){var bd;if(be==l){aS.trigger("swipeStatus",[bc,aQ||null,ah||0,ac||0,X,aR]);if(aw.swipeStatus){bd=aw.swipeStatus.call(aS,bf,bc,aQ||null,ah||0,ac||0,X,aR);if(bd===false){return false}}if(bc==h&&aW()){aS.trigger("swipe",[aQ,ah,ac,X,aR]);if(aw.swipe){bd=aw.swipe.call(aS,bf,aQ,ah,ac,X,aR);if(bd===false){return false}}switch(aQ){case p:aS.trigger("swipeLeft",[aQ,ah,ac,X,aR]);if(aw.swipeLeft){bd=aw.swipeLeft.call(aS,bf,aQ,ah,ac,X,aR)}break;case o:aS.trigger("swipeRight",[aQ,ah,ac,X,aR]);if(aw.swipeRight){bd=aw.swipeRight.call(aS,bf,aQ,ah,ac,X,aR)}break;case e:aS.trigger("swipeUp",[aQ,ah,ac,X,aR]);if(aw.swipeUp){bd=aw.swipeUp.call(aS,bf,aQ,ah,ac,X,aR)}break;case x:aS.trigger("swipeDown",[aQ,ah,ac,X,aR]);if(aw.swipeDown){bd=aw.swipeDown.call(aS,bf,aQ,ah,ac,X,aR)}break}}}if(be==t){aS.trigger("pinchStatus",[bc,aK||null,ar||0,ac||0,X,H,aR]);if(aw.pinchStatus){bd=aw.pinchStatus.call(aS,bf,bc,aK||null,ar||0,ac||0,X,H,aR);if(bd===false){return false}}if(bc==h&&a9()){switch(aK){case c:aS.trigger("pinchIn",[aK||null,ar||0,ac||0,X,H,aR]);if(aw.pinchIn){bd=aw.pinchIn.call(aS,bf,aK||null,ar||0,ac||0,X,H,aR)}break;case A:aS.trigger("pinchOut",[aK||null,ar||0,ac||0,X,H,aR]);if(aw.pinchOut){bd=aw.pinchOut.call(aS,bf,aK||null,ar||0,ac||0,X,H,aR)}break}}}if(be==B){if(bc===q||bc===h){clearTimeout(aX);clearTimeout(ag);if(Z()&&!I()){O=au();aX=setTimeout(f.proxy(function(){O=null;aS.trigger("tap",[bf.target]);if(aw.tap){bd=aw.tap.call(aS,bf,bf.target)}},this),aw.doubleTapThreshold)}else{O=null;aS.trigger("tap",[bf.target]);if(aw.tap){bd=aw.tap.call(aS,bf,bf.target)}}}}else{if(be==j){if(bc===q||bc===h){clearTimeout(aX);O=null;aS.trigger("doubletap",[bf.target]);if(aw.doubleTap){bd=aw.doubleTap.call(aS,bf,bf.target)}}}else{if(be==b){if(bc===q||bc===h){clearTimeout(aX);O=null;aS.trigger("longtap",[bf.target]);if(aw.longTap){bd=aw.longTap.call(aS,bf,bf.target)}}}}}return bd}function ao(){var bc=true;if(aw.threshold!==null){bc=ah>=aw.threshold}return bc}function bb(){var bc=false;if(aw.cancelThreshold!==null&&aQ!==null){bc=(aU(aQ)-ah)>=aw.cancelThreshold}return bc}function af(){if(aw.pinchThreshold!==null){return ar>=aw.pinchThreshold}return true}function aB(){var bc;if(aw.maxTimeThreshold){if(ac>=aw.maxTimeThreshold){bc=false}else{bc=true}}else{bc=true}return bc}function am(bc,bd){if(aw.preventDefaultEvents===false){return}if(aw.allowPageScroll===m){bc.preventDefault()}else{var be=aw.allowPageScroll===s;switch(bd){case p:if((aw.swipeLeft&&be)||(!be&&aw.allowPageScroll!=E)){bc.preventDefault()}break;case o:if((aw.swipeRight&&be)||(!be&&aw.allowPageScroll!=E)){bc.preventDefault()}break;case e:if((aw.swipeUp&&be)||(!be&&aw.allowPageScroll!=u)){bc.preventDefault()}break;case x:if((aw.swipeDown&&be)||(!be&&aw.allowPageScroll!=u)){bc.preventDefault()}break}}}function a9(){var bd=aP();var bc=Y();var be=af();return bd&&bc&&be}function aY(){return !!(aw.pinchStatus||aw.pinchIn||aw.pinchOut)}function Q(){return !!(a9()&&aY())}function aW(){var bf=aB();var bh=ao();var be=aP();var bc=Y();var bd=bb();var bg=!bd&&bc&&be&&bh&&bf;return bg}function W(){return !!(aw.swipe||aw.swipeStatus||aw.swipeLeft||aw.swipeRight||aw.swipeUp||aw.swipeDown)}function J(){return !!(aW()&&W())}function aP(){return((X===aw.fingers||aw.fingers===i)||!a)}function Y(){return aR[0].end.x!==0}function a7(){return !!(aw.tap)}function Z(){return !!(aw.doubleTap)}function aV(){return !!(aw.longTap)}function R(){if(O==null){return false}var bc=au();return(Z()&&((bc-O)<=aw.doubleTapThreshold))}function I(){return R()}function ay(){return((X===1||!a)&&(isNaN(ah)||ah<aw.threshold))}function a1(){return((ac>aw.longTapThreshold)&&(ah<r))}function ai(){return !!(ay()&&a7())}function aH(){return !!(R()&&Z())}function aq(){return !!(a1()&&aV())}function G(){a6=au();ae=event.touches.length+1}function S(){a6=0;ae=0}function an(){var bc=false;if(a6){var bd=au()-a6;if(bd<=aw.fingerReleaseThreshold){bc=true}}return bc}function aC(){return !!(aS.data(C+"_intouch")===true)}function ap(bc){if(bc===true){aS.bind(az,a4);aS.bind(V,M);if(T){aS.bind(T,L)}}else{aS.unbind(az,a4,false);aS.unbind(V,M,false);if(T){aS.unbind(T,L,false)}}aS.data(C+"_intouch",bc===true)}function aj(bd,bc){var be=bc.identifier!==undefined?bc.identifier:0;aR[bd].identifier=be;aR[bd].start.x=aR[bd].end.x=bc.pageX||bc.clientX;aR[bd].start.y=aR[bd].end.y=bc.pageY||bc.clientY;return aR[bd]}function aI(bc){var be=bc.identifier!==undefined?bc.identifier:0;var bd=ad(be);bd.end.x=bc.pageX||bc.clientX;bd.end.y=bc.pageY||bc.clientY;return bd}function ad(bd){for(var bc=0;bc<aR.length;bc++){if(aR[bc].identifier==bd){return aR[bc]}}}function ak(){var bc=[];for(var bd=0;bd<=5;bd++){bc.push({start:{x:0,y:0},end:{x:0,y:0},identifier:0})}return bc}function aJ(bc,bd){bd=Math.max(bd,aU(bc));N[bc].distance=bd}function aU(bc){if(N[bc]){return N[bc].distance}return undefined}function ab(){var bc={};bc[p]=ax(p);bc[o]=ax(o);bc[e]=ax(e);bc[x]=ax(x);return bc}function ax(bc){return{direction:bc,distance:0}}function aN(){return a3-U}function av(bf,be){var bd=Math.abs(bf.x-be.x);var bc=Math.abs(bf.y-be.y);return Math.round(Math.sqrt(bd*bd+bc*bc))}function a8(bc,bd){var be=(bd/bc)*1;return be.toFixed(2)}function at(){if(H<1){return A}else{return c}}function aT(bd,bc){return Math.round(Math.sqrt(Math.pow(bc.x-bd.x,2)+Math.pow(bc.y-bd.y,2)))}function aF(bf,bd){var bc=bf.x-bd.x;var bh=bd.y-bf.y;var be=Math.atan2(bh,bc);var bg=Math.round(be*180/Math.PI);if(bg<0){bg=360-Math.abs(bg)}return bg}function aM(bd,bc){var be=aF(bd,bc);if((be<=45)&&(be>=0)){return p}else{if((be<=360)&&(be>=315)){return p}else{if((be>=135)&&(be<=225)){return o}else{if((be>45)&&(be<135)){return x}else{return e}}}}}function au(){var bc=new Date();return bc.getTime()}function aZ(bc){bc=f(bc);var be=bc.offset();var bd={left:be.left,right:be.left+bc.outerWidth(),top:be.top,bottom:be.top+bc.outerHeight()};return bd}function F(bc,bd){return(bc.x>bd.left&&bc.x<bd.right&&bc.y>bd.top&&bc.y<bd.bottom)}}}));

if(typeof(console) === 'undefined') {
    var console = {};
    console.log = console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = console.groupCollapsed = function() {};
}

if (window.tplogs==true)
	try {
		console.groupCollapsed("ThemePunch GreenSocks Logs");
	} catch(e) { }


var oldgs = window.GreenSockGlobals;
	oldgs_queue = window._gsQueue;
	
var punchgs = window.GreenSockGlobals = {};

if (window.tplogs==true)
	try {
		console.info("Build GreenSock SandBox for ThemePunch Plugins");
		console.info("GreenSock TweenLite Engine Initalised by ThemePunch Plugin");
	} catch(e) {}

/*!
 * VERSION: 1.18.0
 * DATE: 2015-09-03
 * UPDATES AND DOCS AT: http://greensock.com
 *
 * @license Copyright (c) 2008-2015, GreenSock. All rights reserved.
 * This work is subject to the terms at http://greensock.com/standard-license or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 */
(function(t,e){"use strict";var i=t.GreenSockGlobals=t.GreenSockGlobals||t;if(!i.TweenLite){var s,r,n,a,o,l=function(t){var e,s=t.split("."),r=i;for(e=0;s.length>e;e++)r[s[e]]=r=r[s[e]]||{};return r},h=l("com.greensock"),_=1e-10,u=function(t){var e,i=[],s=t.length;for(e=0;e!==s;i.push(t[e++]));return i},f=function(){},c=function(){var t=Object.prototype.toString,e=t.call([]);return function(i){return null!=i&&(i instanceof Array||"object"==typeof i&&!!i.push&&t.call(i)===e)}}(),m={},p=function(s,r,n,a){this.sc=m[s]?m[s].sc:[],m[s]=this,this.gsClass=null,this.func=n;var o=[];this.check=function(h){for(var _,u,f,c,d,v=r.length,g=v;--v>-1;)(_=m[r[v]]||new p(r[v],[])).gsClass?(o[v]=_.gsClass,g--):h&&_.sc.push(this);if(0===g&&n)for(u=("com.greensock."+s).split("."),f=u.pop(),c=l(u.join("."))[f]=this.gsClass=n.apply(n,o),a&&(i[f]=c,d="undefined"!=typeof module&&module.exports,!d&&"function"==typeof define&&define.amd?define((t.GreenSockAMDPath?t.GreenSockAMDPath+"/":"")+s.split(".").pop(),[],function(){return c}):s===e&&d&&(module.exports=c)),v=0;this.sc.length>v;v++)this.sc[v].check()},this.check(!0)},d=t._gsDefine=function(t,e,i,s){return new p(t,e,i,s)},v=h._class=function(t,e,i){return e=e||function(){},d(t,[],function(){return e},i),e};d.globals=i;var g=[0,0,1,1],T=[],y=v("easing.Ease",function(t,e,i,s){this._func=t,this._type=i||0,this._power=s||0,this._params=e?g.concat(e):g},!0),w=y.map={},P=y.register=function(t,e,i,s){for(var r,n,a,o,l=e.split(","),_=l.length,u=(i||"easeIn,easeOut,easeInOut").split(",");--_>-1;)for(n=l[_],r=s?v("easing."+n,null,!0):h.easing[n]||{},a=u.length;--a>-1;)o=u[a],w[n+"."+o]=w[o+n]=r[o]=t.getRatio?t:t[o]||new t};for(n=y.prototype,n._calcEnd=!1,n.getRatio=function(t){if(this._func)return this._params[0]=t,this._func.apply(null,this._params);var e=this._type,i=this._power,s=1===e?1-t:2===e?t:.5>t?2*t:2*(1-t);return 1===i?s*=s:2===i?s*=s*s:3===i?s*=s*s*s:4===i&&(s*=s*s*s*s),1===e?1-s:2===e?s:.5>t?s/2:1-s/2},s=["Linear","Quad","Cubic","Quart","Quint,Strong"],r=s.length;--r>-1;)n=s[r]+",Power"+r,P(new y(null,null,1,r),n,"easeOut",!0),P(new y(null,null,2,r),n,"easeIn"+(0===r?",easeNone":"")),P(new y(null,null,3,r),n,"easeInOut");w.linear=h.easing.Linear.easeIn,w.swing=h.easing.Quad.easeInOut;var b=v("events.EventDispatcher",function(t){this._listeners={},this._eventTarget=t||this});n=b.prototype,n.addEventListener=function(t,e,i,s,r){r=r||0;var n,l,h=this._listeners[t],_=0;for(null==h&&(this._listeners[t]=h=[]),l=h.length;--l>-1;)n=h[l],n.c===e&&n.s===i?h.splice(l,1):0===_&&r>n.pr&&(_=l+1);h.splice(_,0,{c:e,s:i,up:s,pr:r}),this!==a||o||a.wake()},n.removeEventListener=function(t,e){var i,s=this._listeners[t];if(s)for(i=s.length;--i>-1;)if(s[i].c===e)return s.splice(i,1),void 0},n.dispatchEvent=function(t){var e,i,s,r=this._listeners[t];if(r)for(e=r.length,i=this._eventTarget;--e>-1;)s=r[e],s&&(s.up?s.c.call(s.s||i,{type:t,target:i}):s.c.call(s.s||i))};var k=t.requestAnimationFrame,A=t.cancelAnimationFrame,S=Date.now||function(){return(new Date).getTime()},x=S();for(s=["ms","moz","webkit","o"],r=s.length;--r>-1&&!k;)k=t[s[r]+"RequestAnimationFrame"],A=t[s[r]+"CancelAnimationFrame"]||t[s[r]+"CancelRequestAnimationFrame"];v("Ticker",function(t,e){var i,s,r,n,l,h=this,u=S(),c=e!==!1&&k,m=500,p=33,d="tick",v=function(t){var e,a,o=S()-x;o>m&&(u+=o-p),x+=o,h.time=(x-u)/1e3,e=h.time-l,(!i||e>0||t===!0)&&(h.frame++,l+=e+(e>=n?.004:n-e),a=!0),t!==!0&&(r=s(v)),a&&h.dispatchEvent(d)};b.call(h),h.time=h.frame=0,h.tick=function(){v(!0)},h.lagSmoothing=function(t,e){m=t||1/_,p=Math.min(e,m,0)},h.sleep=function(){null!=r&&(c&&A?A(r):clearTimeout(r),s=f,r=null,h===a&&(o=!1))},h.wake=function(){null!==r?h.sleep():h.frame>10&&(x=S()-m+5),s=0===i?f:c&&k?k:function(t){return setTimeout(t,0|1e3*(l-h.time)+1)},h===a&&(o=!0),v(2)},h.fps=function(t){return arguments.length?(i=t,n=1/(i||60),l=this.time+n,h.wake(),void 0):i},h.useRAF=function(t){return arguments.length?(h.sleep(),c=t,h.fps(i),void 0):c},h.fps(t),setTimeout(function(){c&&5>h.frame&&h.useRAF(!1)},1500)}),n=h.Ticker.prototype=new h.events.EventDispatcher,n.constructor=h.Ticker;var R=v("core.Animation",function(t,e){if(this.vars=e=e||{},this._duration=this._totalDuration=t||0,this._delay=Number(e.delay)||0,this._timeScale=1,this._active=e.immediateRender===!0,this.data=e.data,this._reversed=e.reversed===!0,H){o||a.wake();var i=this.vars.useFrames?K:H;i.add(this,i._time),this.vars.paused&&this.paused(!0)}});a=R.ticker=new h.Ticker,n=R.prototype,n._dirty=n._gc=n._initted=n._paused=!1,n._totalTime=n._time=0,n._rawPrevTime=-1,n._next=n._last=n._onUpdate=n._timeline=n.timeline=null,n._paused=!1;var C=function(){o&&S()-x>2e3&&a.wake(),setTimeout(C,2e3)};C(),n.play=function(t,e){return null!=t&&this.seek(t,e),this.reversed(!1).paused(!1)},n.pause=function(t,e){return null!=t&&this.seek(t,e),this.paused(!0)},n.resume=function(t,e){return null!=t&&this.seek(t,e),this.paused(!1)},n.seek=function(t,e){return this.totalTime(Number(t),e!==!1)},n.restart=function(t,e){return this.reversed(!1).paused(!1).totalTime(t?-this._delay:0,e!==!1,!0)},n.reverse=function(t,e){return null!=t&&this.seek(t||this.totalDuration(),e),this.reversed(!0).paused(!1)},n.render=function(){},n.invalidate=function(){return this._time=this._totalTime=0,this._initted=this._gc=!1,this._rawPrevTime=-1,(this._gc||!this.timeline)&&this._enabled(!0),this},n.isActive=function(){var t,e=this._timeline,i=this._startTime;return!e||!this._gc&&!this._paused&&e.isActive()&&(t=e.rawTime())>=i&&i+this.totalDuration()/this._timeScale>t},n._enabled=function(t,e){return o||a.wake(),this._gc=!t,this._active=this.isActive(),e!==!0&&(t&&!this.timeline?this._timeline.add(this,this._startTime-this._delay):!t&&this.timeline&&this._timeline._remove(this,!0)),!1},n._kill=function(){return this._enabled(!1,!1)},n.kill=function(t,e){return this._kill(t,e),this},n._uncache=function(t){for(var e=t?this:this.timeline;e;)e._dirty=!0,e=e.timeline;return this},n._swapSelfInParams=function(t){for(var e=t.length,i=t.concat();--e>-1;)"{self}"===t[e]&&(i[e]=this);return i},n._callback=function(t){var e=this.vars;e[t].apply(e[t+"Scope"]||e.callbackScope||this,e[t+"Params"]||T)},n.eventCallback=function(t,e,i,s){if("on"===(t||"").substr(0,2)){var r=this.vars;if(1===arguments.length)return r[t];null==e?delete r[t]:(r[t]=e,r[t+"Params"]=c(i)&&-1!==i.join("").indexOf("{self}")?this._swapSelfInParams(i):i,r[t+"Scope"]=s),"onUpdate"===t&&(this._onUpdate=e)}return this},n.delay=function(t){return arguments.length?(this._timeline.smoothChildTiming&&this.startTime(this._startTime+t-this._delay),this._delay=t,this):this._delay},n.duration=function(t){return arguments.length?(this._duration=this._totalDuration=t,this._uncache(!0),this._timeline.smoothChildTiming&&this._time>0&&this._time<this._duration&&0!==t&&this.totalTime(this._totalTime*(t/this._duration),!0),this):(this._dirty=!1,this._duration)},n.totalDuration=function(t){return this._dirty=!1,arguments.length?this.duration(t):this._totalDuration},n.time=function(t,e){return arguments.length?(this._dirty&&this.totalDuration(),this.totalTime(t>this._duration?this._duration:t,e)):this._time},n.totalTime=function(t,e,i){if(o||a.wake(),!arguments.length)return this._totalTime;if(this._timeline){if(0>t&&!i&&(t+=this.totalDuration()),this._timeline.smoothChildTiming){this._dirty&&this.totalDuration();var s=this._totalDuration,r=this._timeline;if(t>s&&!i&&(t=s),this._startTime=(this._paused?this._pauseTime:r._time)-(this._reversed?s-t:t)/this._timeScale,r._dirty||this._uncache(!1),r._timeline)for(;r._timeline;)r._timeline._time!==(r._startTime+r._totalTime)/r._timeScale&&r.totalTime(r._totalTime,!0),r=r._timeline}this._gc&&this._enabled(!0,!1),(this._totalTime!==t||0===this._duration)&&(z.length&&V(),this.render(t,e,!1),z.length&&V())}return this},n.progress=n.totalProgress=function(t,e){var i=this.duration();return arguments.length?this.totalTime(i*t,e):i?this._time/i:this.ratio},n.startTime=function(t){return arguments.length?(t!==this._startTime&&(this._startTime=t,this.timeline&&this.timeline._sortChildren&&this.timeline.add(this,t-this._delay)),this):this._startTime},n.endTime=function(t){return this._startTime+(0!=t?this.totalDuration():this.duration())/this._timeScale},n.timeScale=function(t){if(!arguments.length)return this._timeScale;if(t=t||_,this._timeline&&this._timeline.smoothChildTiming){var e=this._pauseTime,i=e||0===e?e:this._timeline.totalTime();this._startTime=i-(i-this._startTime)*this._timeScale/t}return this._timeScale=t,this._uncache(!1)},n.reversed=function(t){return arguments.length?(t!=this._reversed&&(this._reversed=t,this.totalTime(this._timeline&&!this._timeline.smoothChildTiming?this.totalDuration()-this._totalTime:this._totalTime,!0)),this):this._reversed},n.paused=function(t){if(!arguments.length)return this._paused;var e,i,s=this._timeline;return t!=this._paused&&s&&(o||t||a.wake(),e=s.rawTime(),i=e-this._pauseTime,!t&&s.smoothChildTiming&&(this._startTime+=i,this._uncache(!1)),this._pauseTime=t?e:null,this._paused=t,this._active=this.isActive(),!t&&0!==i&&this._initted&&this.duration()&&(e=s.smoothChildTiming?this._totalTime:(e-this._startTime)/this._timeScale,this.render(e,e===this._totalTime,!0))),this._gc&&!t&&this._enabled(!0,!1),this};var D=v("core.SimpleTimeline",function(t){R.call(this,0,t),this.autoRemoveChildren=this.smoothChildTiming=!0});n=D.prototype=new R,n.constructor=D,n.kill()._gc=!1,n._first=n._last=n._recent=null,n._sortChildren=!1,n.add=n.insert=function(t,e){var i,s;if(t._startTime=Number(e||0)+t._delay,t._paused&&this!==t._timeline&&(t._pauseTime=t._startTime+(this.rawTime()-t._startTime)/t._timeScale),t.timeline&&t.timeline._remove(t,!0),t.timeline=t._timeline=this,t._gc&&t._enabled(!0,!0),i=this._last,this._sortChildren)for(s=t._startTime;i&&i._startTime>s;)i=i._prev;return i?(t._next=i._next,i._next=t):(t._next=this._first,this._first=t),t._next?t._next._prev=t:this._last=t,t._prev=i,this._recent=t,this._timeline&&this._uncache(!0),this},n._remove=function(t,e){return t.timeline===this&&(e||t._enabled(!1,!0),t._prev?t._prev._next=t._next:this._first===t&&(this._first=t._next),t._next?t._next._prev=t._prev:this._last===t&&(this._last=t._prev),t._next=t._prev=t.timeline=null,t===this._recent&&(this._recent=this._last),this._timeline&&this._uncache(!0)),this},n.render=function(t,e,i){var s,r=this._first;for(this._totalTime=this._time=this._rawPrevTime=t;r;)s=r._next,(r._active||t>=r._startTime&&!r._paused)&&(r._reversed?r.render((r._dirty?r.totalDuration():r._totalDuration)-(t-r._startTime)*r._timeScale,e,i):r.render((t-r._startTime)*r._timeScale,e,i)),r=s},n.rawTime=function(){return o||a.wake(),this._totalTime};var I=v("TweenLite",function(e,i,s){if(R.call(this,i,s),this.render=I.prototype.render,null==e)throw"Cannot tween a null target.";this.target=e="string"!=typeof e?e:I.selector(e)||e;var r,n,a,o=e.jquery||e.length&&e!==t&&e[0]&&(e[0]===t||e[0].nodeType&&e[0].style&&!e.nodeType),l=this.vars.overwrite;if(this._overwrite=l=null==l?$[I.defaultOverwrite]:"number"==typeof l?l>>0:$[l],(o||e instanceof Array||e.push&&c(e))&&"number"!=typeof e[0])for(this._targets=a=u(e),this._propLookup=[],this._siblings=[],r=0;a.length>r;r++)n=a[r],n?"string"!=typeof n?n.length&&n!==t&&n[0]&&(n[0]===t||n[0].nodeType&&n[0].style&&!n.nodeType)?(a.splice(r--,1),this._targets=a=a.concat(u(n))):(this._siblings[r]=W(n,this,!1),1===l&&this._siblings[r].length>1&&Y(n,this,null,1,this._siblings[r])):(n=a[r--]=I.selector(n),"string"==typeof n&&a.splice(r+1,1)):a.splice(r--,1);else this._propLookup={},this._siblings=W(e,this,!1),1===l&&this._siblings.length>1&&Y(e,this,null,1,this._siblings);(this.vars.immediateRender||0===i&&0===this._delay&&this.vars.immediateRender!==!1)&&(this._time=-_,this.render(-this._delay))},!0),E=function(e){return e&&e.length&&e!==t&&e[0]&&(e[0]===t||e[0].nodeType&&e[0].style&&!e.nodeType)},O=function(t,e){var i,s={};for(i in t)M[i]||i in e&&"transform"!==i&&"x"!==i&&"y"!==i&&"width"!==i&&"height"!==i&&"className"!==i&&"border"!==i||!(!Q[i]||Q[i]&&Q[i]._autoCSS)||(s[i]=t[i],delete t[i]);t.css=s};n=I.prototype=new R,n.constructor=I,n.kill()._gc=!1,n.ratio=0,n._firstPT=n._targets=n._overwrittenProps=n._startAt=null,n._notifyPluginsOfEnabled=n._lazy=!1,I.version="1.18.0",I.defaultEase=n._ease=new y(null,null,1,1),I.defaultOverwrite="auto",I.ticker=a,I.autoSleep=120,I.lagSmoothing=function(t,e){a.lagSmoothing(t,e)},I.selector=t.$||t.jQuery||function(e){var i=t.$||t.jQuery;return i?(I.selector=i,i(e)):"undefined"==typeof document?e:document.querySelectorAll?document.querySelectorAll(e):document.getElementById("#"===e.charAt(0)?e.substr(1):e)};var z=[],F={},L=/(?:(-|-=|\+=)?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/gi,N=function(t){for(var e,i=this._firstPT,s=1e-6;i;)e=i.blob?t?this.join(""):this.start:i.c*t+i.s,i.r?e=Math.round(e):s>e&&e>-s&&(e=0),i.f?i.fp?i.t[i.p](i.fp,e):i.t[i.p](e):i.t[i.p]=e,i=i._next},U=function(t,e,i,s){var r,n,a,o,l,h,_,u=[t,e],f=0,c="",m=0;for(u.start=t,i&&(i(u),t=u[0],e=u[1]),u.length=0,r=t.match(L)||[],n=e.match(L)||[],s&&(s._next=null,s.blob=1,u._firstPT=s),l=n.length,o=0;l>o;o++)_=n[o],h=e.substr(f,e.indexOf(_,f)-f),c+=h||!o?h:",",f+=h.length,m?m=(m+1)%5:"rgba("===h.substr(-5)&&(m=1),_===r[o]||o>=r.length?c+=_:(c&&(u.push(c),c=""),a=parseFloat(r[o]),u.push(a),u._firstPT={_next:u._firstPT,t:u,p:u.length-1,s:a,c:("="===_.charAt(1)?parseInt(_.charAt(0)+"1",10)*parseFloat(_.substr(2)):parseFloat(_)-a)||0,f:0,r:m&&4>m}),f+=_.length;return c+=e.substr(f),c&&u.push(c),u.setRatio=N,u},j=function(t,e,i,s,r,n,a,o){var l,h,_="get"===i?t[e]:i,u=typeof t[e],f="string"==typeof s&&"="===s.charAt(1),c={t:t,p:e,s:_,f:"function"===u,pg:0,n:r||e,r:n,pr:0,c:f?parseInt(s.charAt(0)+"1",10)*parseFloat(s.substr(2)):parseFloat(s)-_||0};return"number"!==u&&("function"===u&&"get"===i&&(h=e.indexOf("set")||"function"!=typeof t["get"+e.substr(3)]?e:"get"+e.substr(3),c.s=_=a?t[h](a):t[h]()),"string"==typeof _&&(a||isNaN(_))?(c.fp=a,l=U(_,s,o||I.defaultStringFilter,c),c={t:l,p:"setRatio",s:0,c:1,f:2,pg:0,n:r||e,pr:0}):f||(c.c=parseFloat(s)-parseFloat(_)||0)),c.c?((c._next=this._firstPT)&&(c._next._prev=c),this._firstPT=c,c):void 0},G=I._internals={isArray:c,isSelector:E,lazyTweens:z,blobDif:U},Q=I._plugins={},q=G.tweenLookup={},B=0,M=G.reservedProps={ease:1,delay:1,overwrite:1,onComplete:1,onCompleteParams:1,onCompleteScope:1,useFrames:1,runBackwards:1,startAt:1,onUpdate:1,onUpdateParams:1,onUpdateScope:1,onStart:1,onStartParams:1,onStartScope:1,onReverseComplete:1,onReverseCompleteParams:1,onReverseCompleteScope:1,onRepeat:1,onRepeatParams:1,onRepeatScope:1,easeParams:1,yoyo:1,immediateRender:1,repeat:1,repeatDelay:1,data:1,paused:1,reversed:1,autoCSS:1,lazy:1,onOverwrite:1,callbackScope:1,stringFilter:1},$={none:0,all:1,auto:2,concurrent:3,allOnStart:4,preexisting:5,"true":1,"false":0},K=R._rootFramesTimeline=new D,H=R._rootTimeline=new D,J=30,V=G.lazyRender=function(){var t,e=z.length;for(F={};--e>-1;)t=z[e],t&&t._lazy!==!1&&(t.render(t._lazy[0],t._lazy[1],!0),t._lazy=!1);z.length=0};H._startTime=a.time,K._startTime=a.frame,H._active=K._active=!0,setTimeout(V,1),R._updateRoot=I.render=function(){var t,e,i;if(z.length&&V(),H.render((a.time-H._startTime)*H._timeScale,!1,!1),K.render((a.frame-K._startTime)*K._timeScale,!1,!1),z.length&&V(),a.frame>=J){J=a.frame+(parseInt(I.autoSleep,10)||120);for(i in q){for(e=q[i].tweens,t=e.length;--t>-1;)e[t]._gc&&e.splice(t,1);0===e.length&&delete q[i]}if(i=H._first,(!i||i._paused)&&I.autoSleep&&!K._first&&1===a._listeners.tick.length){for(;i&&i._paused;)i=i._next;i||a.sleep()}}},a.addEventListener("tick",R._updateRoot);var W=function(t,e,i){var s,r,n=t._gsTweenID;if(q[n||(t._gsTweenID=n="t"+B++)]||(q[n]={target:t,tweens:[]}),e&&(s=q[n].tweens,s[r=s.length]=e,i))for(;--r>-1;)s[r]===e&&s.splice(r,1);return q[n].tweens},X=function(t,e,i,s){var r,n,a=t.vars.onOverwrite;return a&&(r=a(t,e,i,s)),a=I.onOverwrite,a&&(n=a(t,e,i,s)),r!==!1&&n!==!1},Y=function(t,e,i,s,r){var n,a,o,l;if(1===s||s>=4){for(l=r.length,n=0;l>n;n++)if((o=r[n])!==e)o._gc||o._kill(null,t,e)&&(a=!0);else if(5===s)break;return a}var h,u=e._startTime+_,f=[],c=0,m=0===e._duration;for(n=r.length;--n>-1;)(o=r[n])===e||o._gc||o._paused||(o._timeline!==e._timeline?(h=h||Z(e,0,m),0===Z(o,h,m)&&(f[c++]=o)):u>=o._startTime&&o._startTime+o.totalDuration()/o._timeScale>u&&((m||!o._initted)&&2e-10>=u-o._startTime||(f[c++]=o)));for(n=c;--n>-1;)if(o=f[n],2===s&&o._kill(i,t,e)&&(a=!0),2!==s||!o._firstPT&&o._initted){if(2!==s&&!X(o,e))continue;o._enabled(!1,!1)&&(a=!0)}return a},Z=function(t,e,i){for(var s=t._timeline,r=s._timeScale,n=t._startTime;s._timeline;){if(n+=s._startTime,r*=s._timeScale,s._paused)return-100;s=s._timeline}return n/=r,n>e?n-e:i&&n===e||!t._initted&&2*_>n-e?_:(n+=t.totalDuration()/t._timeScale/r)>e+_?0:n-e-_};n._init=function(){var t,e,i,s,r,n=this.vars,a=this._overwrittenProps,o=this._duration,l=!!n.immediateRender,h=n.ease;if(n.startAt){this._startAt&&(this._startAt.render(-1,!0),this._startAt.kill()),r={};for(s in n.startAt)r[s]=n.startAt[s];if(r.overwrite=!1,r.immediateRender=!0,r.lazy=l&&n.lazy!==!1,r.startAt=r.delay=null,this._startAt=I.to(this.target,0,r),l)if(this._time>0)this._startAt=null;else if(0!==o)return}else if(n.runBackwards&&0!==o)if(this._startAt)this._startAt.render(-1,!0),this._startAt.kill(),this._startAt=null;else{0!==this._time&&(l=!1),i={};for(s in n)M[s]&&"autoCSS"!==s||(i[s]=n[s]);if(i.overwrite=0,i.data="isFromStart",i.lazy=l&&n.lazy!==!1,i.immediateRender=l,this._startAt=I.to(this.target,0,i),l){if(0===this._time)return}else this._startAt._init(),this._startAt._enabled(!1),this.vars.immediateRender&&(this._startAt=null)}if(this._ease=h=h?h instanceof y?h:"function"==typeof h?new y(h,n.easeParams):w[h]||I.defaultEase:I.defaultEase,n.easeParams instanceof Array&&h.config&&(this._ease=h.config.apply(h,n.easeParams)),this._easeType=this._ease._type,this._easePower=this._ease._power,this._firstPT=null,this._targets)for(t=this._targets.length;--t>-1;)this._initProps(this._targets[t],this._propLookup[t]={},this._siblings[t],a?a[t]:null)&&(e=!0);else e=this._initProps(this.target,this._propLookup,this._siblings,a);if(e&&I._onPluginEvent("_onInitAllProps",this),a&&(this._firstPT||"function"!=typeof this.target&&this._enabled(!1,!1)),n.runBackwards)for(i=this._firstPT;i;)i.s+=i.c,i.c=-i.c,i=i._next;this._onUpdate=n.onUpdate,this._initted=!0},n._initProps=function(e,i,s,r){var n,a,o,l,h,_;if(null==e)return!1;F[e._gsTweenID]&&V(),this.vars.css||e.style&&e!==t&&e.nodeType&&Q.css&&this.vars.autoCSS!==!1&&O(this.vars,e);for(n in this.vars)if(_=this.vars[n],M[n])_&&(_ instanceof Array||_.push&&c(_))&&-1!==_.join("").indexOf("{self}")&&(this.vars[n]=_=this._swapSelfInParams(_,this));else if(Q[n]&&(l=new Q[n])._onInitTween(e,this.vars[n],this)){for(this._firstPT=h={_next:this._firstPT,t:l,p:"setRatio",s:0,c:1,f:1,n:n,pg:1,pr:l._priority},a=l._overwriteProps.length;--a>-1;)i[l._overwriteProps[a]]=this._firstPT;(l._priority||l._onInitAllProps)&&(o=!0),(l._onDisable||l._onEnable)&&(this._notifyPluginsOfEnabled=!0),h._next&&(h._next._prev=h)}else i[n]=j.call(this,e,n,"get",_,n,0,null,this.vars.stringFilter);return r&&this._kill(r,e)?this._initProps(e,i,s,r):this._overwrite>1&&this._firstPT&&s.length>1&&Y(e,this,i,this._overwrite,s)?(this._kill(i,e),this._initProps(e,i,s,r)):(this._firstPT&&(this.vars.lazy!==!1&&this._duration||this.vars.lazy&&!this._duration)&&(F[e._gsTweenID]=!0),o)},n.render=function(t,e,i){var s,r,n,a,o=this._time,l=this._duration,h=this._rawPrevTime;if(t>=l)this._totalTime=this._time=l,this.ratio=this._ease._calcEnd?this._ease.getRatio(1):1,this._reversed||(s=!0,r="onComplete",i=i||this._timeline.autoRemoveChildren),0===l&&(this._initted||!this.vars.lazy||i)&&(this._startTime===this._timeline._duration&&(t=0),(0===t||0>h||h===_&&"isPause"!==this.data)&&h!==t&&(i=!0,h>_&&(r="onReverseComplete")),this._rawPrevTime=a=!e||t||h===t?t:_);else if(1e-7>t)this._totalTime=this._time=0,this.ratio=this._ease._calcEnd?this._ease.getRatio(0):0,(0!==o||0===l&&h>0)&&(r="onReverseComplete",s=this._reversed),0>t&&(this._active=!1,0===l&&(this._initted||!this.vars.lazy||i)&&(h>=0&&(h!==_||"isPause"!==this.data)&&(i=!0),this._rawPrevTime=a=!e||t||h===t?t:_)),this._initted||(i=!0);else if(this._totalTime=this._time=t,this._easeType){var u=t/l,f=this._easeType,c=this._easePower;(1===f||3===f&&u>=.5)&&(u=1-u),3===f&&(u*=2),1===c?u*=u:2===c?u*=u*u:3===c?u*=u*u*u:4===c&&(u*=u*u*u*u),this.ratio=1===f?1-u:2===f?u:.5>t/l?u/2:1-u/2}else this.ratio=this._ease.getRatio(t/l);if(this._time!==o||i){if(!this._initted){if(this._init(),!this._initted||this._gc)return;if(!i&&this._firstPT&&(this.vars.lazy!==!1&&this._duration||this.vars.lazy&&!this._duration))return this._time=this._totalTime=o,this._rawPrevTime=h,z.push(this),this._lazy=[t,e],void 0;this._time&&!s?this.ratio=this._ease.getRatio(this._time/l):s&&this._ease._calcEnd&&(this.ratio=this._ease.getRatio(0===this._time?0:1))}for(this._lazy!==!1&&(this._lazy=!1),this._active||!this._paused&&this._time!==o&&t>=0&&(this._active=!0),0===o&&(this._startAt&&(t>=0?this._startAt.render(t,e,i):r||(r="_dummyGS")),this.vars.onStart&&(0!==this._time||0===l)&&(e||this._callback("onStart"))),n=this._firstPT;n;)n.f?n.t[n.p](n.c*this.ratio+n.s):n.t[n.p]=n.c*this.ratio+n.s,n=n._next;this._onUpdate&&(0>t&&this._startAt&&t!==-1e-4&&this._startAt.render(t,e,i),e||(this._time!==o||s)&&this._callback("onUpdate")),r&&(!this._gc||i)&&(0>t&&this._startAt&&!this._onUpdate&&t!==-1e-4&&this._startAt.render(t,e,i),s&&(this._timeline.autoRemoveChildren&&this._enabled(!1,!1),this._active=!1),!e&&this.vars[r]&&this._callback(r),0===l&&this._rawPrevTime===_&&a!==_&&(this._rawPrevTime=0))}},n._kill=function(t,e,i){if("all"===t&&(t=null),null==t&&(null==e||e===this.target))return this._lazy=!1,this._enabled(!1,!1);e="string"!=typeof e?e||this._targets||this.target:I.selector(e)||e;var s,r,n,a,o,l,h,_,u,f=i&&this._time&&i._startTime===this._startTime&&this._timeline===i._timeline;if((c(e)||E(e))&&"number"!=typeof e[0])for(s=e.length;--s>-1;)this._kill(t,e[s],i)&&(l=!0);else{if(this._targets){for(s=this._targets.length;--s>-1;)if(e===this._targets[s]){o=this._propLookup[s]||{},this._overwrittenProps=this._overwrittenProps||[],r=this._overwrittenProps[s]=t?this._overwrittenProps[s]||{}:"all";break}}else{if(e!==this.target)return!1;o=this._propLookup,r=this._overwrittenProps=t?this._overwrittenProps||{}:"all"}if(o){if(h=t||o,_=t!==r&&"all"!==r&&t!==o&&("object"!=typeof t||!t._tempKill),i&&(I.onOverwrite||this.vars.onOverwrite)){for(n in h)o[n]&&(u||(u=[]),u.push(n));if((u||!t)&&!X(this,i,e,u))return!1}for(n in h)(a=o[n])&&(f&&(a.f?a.t[a.p](a.s):a.t[a.p]=a.s,l=!0),a.pg&&a.t._kill(h)&&(l=!0),a.pg&&0!==a.t._overwriteProps.length||(a._prev?a._prev._next=a._next:a===this._firstPT&&(this._firstPT=a._next),a._next&&(a._next._prev=a._prev),a._next=a._prev=null),delete o[n]),_&&(r[n]=1);!this._firstPT&&this._initted&&this._enabled(!1,!1)}}return l},n.invalidate=function(){return this._notifyPluginsOfEnabled&&I._onPluginEvent("_onDisable",this),this._firstPT=this._overwrittenProps=this._startAt=this._onUpdate=null,this._notifyPluginsOfEnabled=this._active=this._lazy=!1,this._propLookup=this._targets?{}:[],R.prototype.invalidate.call(this),this.vars.immediateRender&&(this._time=-_,this.render(-this._delay)),this},n._enabled=function(t,e){if(o||a.wake(),t&&this._gc){var i,s=this._targets;if(s)for(i=s.length;--i>-1;)this._siblings[i]=W(s[i],this,!0);else this._siblings=W(this.target,this,!0)}return R.prototype._enabled.call(this,t,e),this._notifyPluginsOfEnabled&&this._firstPT?I._onPluginEvent(t?"_onEnable":"_onDisable",this):!1},I.to=function(t,e,i){return new I(t,e,i)},I.from=function(t,e,i){return i.runBackwards=!0,i.immediateRender=0!=i.immediateRender,new I(t,e,i)},I.fromTo=function(t,e,i,s){return s.startAt=i,s.immediateRender=0!=s.immediateRender&&0!=i.immediateRender,new I(t,e,s)},I.delayedCall=function(t,e,i,s,r){return new I(e,0,{delay:t,onComplete:e,onCompleteParams:i,callbackScope:s,onReverseComplete:e,onReverseCompleteParams:i,immediateRender:!1,lazy:!1,useFrames:r,overwrite:0})},I.set=function(t,e){return new I(t,0,e)},I.getTweensOf=function(t,e){if(null==t)return[];t="string"!=typeof t?t:I.selector(t)||t;var i,s,r,n;if((c(t)||E(t))&&"number"!=typeof t[0]){for(i=t.length,s=[];--i>-1;)s=s.concat(I.getTweensOf(t[i],e));for(i=s.length;--i>-1;)for(n=s[i],r=i;--r>-1;)n===s[r]&&s.splice(i,1)}else for(s=W(t).concat(),i=s.length;--i>-1;)(s[i]._gc||e&&!s[i].isActive())&&s.splice(i,1);return s},I.killTweensOf=I.killDelayedCallsTo=function(t,e,i){"object"==typeof e&&(i=e,e=!1);for(var s=I.getTweensOf(t,e),r=s.length;--r>-1;)s[r]._kill(i,t)};var te=v("plugins.TweenPlugin",function(t,e){this._overwriteProps=(t||"").split(","),this._propName=this._overwriteProps[0],this._priority=e||0,this._super=te.prototype},!0);if(n=te.prototype,te.version="1.18.0",te.API=2,n._firstPT=null,n._addTween=j,n.setRatio=N,n._kill=function(t){var e,i=this._overwriteProps,s=this._firstPT;if(null!=t[this._propName])this._overwriteProps=[];else for(e=i.length;--e>-1;)null!=t[i[e]]&&i.splice(e,1);for(;s;)null!=t[s.n]&&(s._next&&(s._next._prev=s._prev),s._prev?(s._prev._next=s._next,s._prev=null):this._firstPT===s&&(this._firstPT=s._next)),s=s._next;return!1},n._roundProps=function(t,e){for(var i=this._firstPT;i;)(t[this._propName]||null!=i.n&&t[i.n.split(this._propName+"_").join("")])&&(i.r=e),i=i._next},I._onPluginEvent=function(t,e){var i,s,r,n,a,o=e._firstPT;if("_onInitAllProps"===t){for(;o;){for(a=o._next,s=r;s&&s.pr>o.pr;)s=s._next;(o._prev=s?s._prev:n)?o._prev._next=o:r=o,(o._next=s)?s._prev=o:n=o,o=a}o=e._firstPT=r}for(;o;)o.pg&&"function"==typeof o.t[t]&&o.t[t]()&&(i=!0),o=o._next;return i},te.activate=function(t){for(var e=t.length;--e>-1;)t[e].API===te.API&&(Q[(new t[e])._propName]=t[e]);return!0},d.plugin=function(t){if(!(t&&t.propName&&t.init&&t.API))throw"illegal plugin definition.";var e,i=t.propName,s=t.priority||0,r=t.overwriteProps,n={init:"_onInitTween",set:"setRatio",kill:"_kill",round:"_roundProps",initAll:"_onInitAllProps"},a=v("plugins."+i.charAt(0).toUpperCase()+i.substr(1)+"Plugin",function(){te.call(this,i,s),this._overwriteProps=r||[]},t.global===!0),o=a.prototype=new te(i);o.constructor=a,a.API=t.API;for(e in n)"function"==typeof t[e]&&(o[n[e]]=t[e]);return a.version=t.version,te.activate([a]),a},s=t._gsQueue){for(r=0;s.length>r;r++)s[r]();for(n in m)m[n].func||t.console.log("GSAP encountered missing dependency: com.greensock."+n)}o=!1}})("undefined"!=typeof module&&module.exports&&"undefined"!=typeof global?global:this||window,"TweenLite");

/*!
 * VERSION: 1.18.0
 * DATE: 2015-08-29
 * UPDATES AND DOCS AT: http://greensock.com
 *
 * @license Copyright (c) 2008-2015, GreenSock. All rights reserved.
 * This work is subject to the terms at http://greensock.com/standard-license or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 */
var _gsScope="undefined"!=typeof module&&module.exports&&"undefined"!=typeof global?global:this||window;(_gsScope._gsQueue||(_gsScope._gsQueue=[])).push(function(){"use strict";_gsScope._gsDefine("TimelineLite",["core.Animation","core.SimpleTimeline","TweenLite"],function(t,e,i){var s=function(t){e.call(this,t),this._labels={},this.autoRemoveChildren=this.vars.autoRemoveChildren===!0,this.smoothChildTiming=this.vars.smoothChildTiming===!0,this._sortChildren=!0,this._onUpdate=this.vars.onUpdate;var i,s,r=this.vars;for(s in r)i=r[s],l(i)&&-1!==i.join("").indexOf("{self}")&&(r[s]=this._swapSelfInParams(i));l(r.tweens)&&this.add(r.tweens,0,r.align,r.stagger)},r=1e-10,n=i._internals,a=s._internals={},o=n.isSelector,l=n.isArray,h=n.lazyTweens,_=n.lazyRender,u=_gsScope._gsDefine.globals,f=function(t){var e,i={};for(e in t)i[e]=t[e];return i},c=function(t,e,i){var s,r,n=t.cycle;for(s in n)r=n[s],t[s]="function"==typeof r?r.call(e[i],i):r[i%r.length];delete t.cycle},p=a.pauseCallback=function(){},m=function(t){var e,i=[],s=t.length;for(e=0;e!==s;i.push(t[e++]));return i},d=s.prototype=new e;return s.version="1.18.0",d.constructor=s,d.kill()._gc=d._forcingPlayhead=d._hasPause=!1,d.to=function(t,e,s,r){var n=s.repeat&&u.TweenMax||i;return e?this.add(new n(t,e,s),r):this.set(t,s,r)},d.from=function(t,e,s,r){return this.add((s.repeat&&u.TweenMax||i).from(t,e,s),r)},d.fromTo=function(t,e,s,r,n){var a=r.repeat&&u.TweenMax||i;return e?this.add(a.fromTo(t,e,s,r),n):this.set(t,r,n)},d.staggerTo=function(t,e,r,n,a,l,h,_){var u,p,d=new s({onComplete:l,onCompleteParams:h,callbackScope:_,smoothChildTiming:this.smoothChildTiming}),g=r.cycle;for("string"==typeof t&&(t=i.selector(t)||t),t=t||[],o(t)&&(t=m(t)),n=n||0,0>n&&(t=m(t),t.reverse(),n*=-1),p=0;t.length>p;p++)u=f(r),u.startAt&&(u.startAt=f(u.startAt),u.startAt.cycle&&c(u.startAt,t,p)),g&&c(u,t,p),d.to(t[p],e,u,p*n);return this.add(d,a)},d.staggerFrom=function(t,e,i,s,r,n,a,o){return i.immediateRender=0!=i.immediateRender,i.runBackwards=!0,this.staggerTo(t,e,i,s,r,n,a,o)},d.staggerFromTo=function(t,e,i,s,r,n,a,o,l){return s.startAt=i,s.immediateRender=0!=s.immediateRender&&0!=i.immediateRender,this.staggerTo(t,e,s,r,n,a,o,l)},d.call=function(t,e,s,r){return this.add(i.delayedCall(0,t,e,s),r)},d.set=function(t,e,s){return s=this._parseTimeOrLabel(s,0,!0),null==e.immediateRender&&(e.immediateRender=s===this._time&&!this._paused),this.add(new i(t,0,e),s)},s.exportRoot=function(t,e){t=t||{},null==t.smoothChildTiming&&(t.smoothChildTiming=!0);var r,n,a=new s(t),o=a._timeline;for(null==e&&(e=!0),o._remove(a,!0),a._startTime=0,a._rawPrevTime=a._time=a._totalTime=o._time,r=o._first;r;)n=r._next,e&&r instanceof i&&r.target===r.vars.onComplete||a.add(r,r._startTime-r._delay),r=n;return o.add(a,0),a},d.add=function(r,n,a,o){var h,_,u,f,c,p;if("number"!=typeof n&&(n=this._parseTimeOrLabel(n,0,!0,r)),!(r instanceof t)){if(r instanceof Array||r&&r.push&&l(r)){for(a=a||"normal",o=o||0,h=n,_=r.length,u=0;_>u;u++)l(f=r[u])&&(f=new s({tweens:f})),this.add(f,h),"string"!=typeof f&&"function"!=typeof f&&("sequence"===a?h=f._startTime+f.totalDuration()/f._timeScale:"start"===a&&(f._startTime-=f.delay())),h+=o;return this._uncache(!0)}if("string"==typeof r)return this.addLabel(r,n);if("function"!=typeof r)throw"Cannot add "+r+" into the timeline; it is not a tween, timeline, function, or string.";r=i.delayedCall(0,r)}if(e.prototype.add.call(this,r,n),(this._gc||this._time===this._duration)&&!this._paused&&this._duration<this.duration())for(c=this,p=c.rawTime()>r._startTime;c._timeline;)p&&c._timeline.smoothChildTiming?c.totalTime(c._totalTime,!0):c._gc&&c._enabled(!0,!1),c=c._timeline;return this},d.remove=function(e){if(e instanceof t){this._remove(e,!1);var i=e._timeline=e.vars.useFrames?t._rootFramesTimeline:t._rootTimeline;return e._startTime=(e._paused?e._pauseTime:i._time)-(e._reversed?e.totalDuration()-e._totalTime:e._totalTime)/e._timeScale,this}if(e instanceof Array||e&&e.push&&l(e)){for(var s=e.length;--s>-1;)this.remove(e[s]);return this}return"string"==typeof e?this.removeLabel(e):this.kill(null,e)},d._remove=function(t,i){e.prototype._remove.call(this,t,i);var s=this._last;return s?this._time>s._startTime+s._totalDuration/s._timeScale&&(this._time=this.duration(),this._totalTime=this._totalDuration):this._time=this._totalTime=this._duration=this._totalDuration=0,this},d.append=function(t,e){return this.add(t,this._parseTimeOrLabel(null,e,!0,t))},d.insert=d.insertMultiple=function(t,e,i,s){return this.add(t,e||0,i,s)},d.appendMultiple=function(t,e,i,s){return this.add(t,this._parseTimeOrLabel(null,e,!0,t),i,s)},d.addLabel=function(t,e){return this._labels[t]=this._parseTimeOrLabel(e),this},d.addPause=function(t,e,s,r){var n=i.delayedCall(0,p,s,r||this);return n.vars.onComplete=n.vars.onReverseComplete=e,n.data="isPause",this._hasPause=!0,this.add(n,t)},d.removeLabel=function(t){return delete this._labels[t],this},d.getLabelTime=function(t){return null!=this._labels[t]?this._labels[t]:-1},d._parseTimeOrLabel=function(e,i,s,r){var n;if(r instanceof t&&r.timeline===this)this.remove(r);else if(r&&(r instanceof Array||r.push&&l(r)))for(n=r.length;--n>-1;)r[n]instanceof t&&r[n].timeline===this&&this.remove(r[n]);if("string"==typeof i)return this._parseTimeOrLabel(i,s&&"number"==typeof e&&null==this._labels[i]?e-this.duration():0,s);if(i=i||0,"string"!=typeof e||!isNaN(e)&&null==this._labels[e])null==e&&(e=this.duration());else{if(n=e.indexOf("="),-1===n)return null==this._labels[e]?s?this._labels[e]=this.duration()+i:i:this._labels[e]+i;i=parseInt(e.charAt(n-1)+"1",10)*Number(e.substr(n+1)),e=n>1?this._parseTimeOrLabel(e.substr(0,n-1),0,s):this.duration()}return Number(e)+i},d.seek=function(t,e){return this.totalTime("number"==typeof t?t:this._parseTimeOrLabel(t),e!==!1)},d.stop=function(){return this.paused(!0)},d.gotoAndPlay=function(t,e){return this.play(t,e)},d.gotoAndStop=function(t,e){return this.pause(t,e)},d.render=function(t,e,i){this._gc&&this._enabled(!0,!1);var s,n,a,o,l,u,f=this._dirty?this.totalDuration():this._totalDuration,c=this._time,p=this._startTime,m=this._timeScale,d=this._paused;if(t>=f)this._totalTime=this._time=f,this._reversed||this._hasPausedChild()||(n=!0,o="onComplete",l=!!this._timeline.autoRemoveChildren,0===this._duration&&(0===t||0>this._rawPrevTime||this._rawPrevTime===r)&&this._rawPrevTime!==t&&this._first&&(l=!0,this._rawPrevTime>r&&(o="onReverseComplete"))),this._rawPrevTime=this._duration||!e||t||this._rawPrevTime===t?t:r,t=f+1e-4;else if(1e-7>t)if(this._totalTime=this._time=0,(0!==c||0===this._duration&&this._rawPrevTime!==r&&(this._rawPrevTime>0||0>t&&this._rawPrevTime>=0))&&(o="onReverseComplete",n=this._reversed),0>t)this._active=!1,this._timeline.autoRemoveChildren&&this._reversed?(l=n=!0,o="onReverseComplete"):this._rawPrevTime>=0&&this._first&&(l=!0),this._rawPrevTime=t;else{if(this._rawPrevTime=this._duration||!e||t||this._rawPrevTime===t?t:r,0===t&&n)for(s=this._first;s&&0===s._startTime;)s._duration||(n=!1),s=s._next;t=0,this._initted||(l=!0)}else{if(this._hasPause&&!this._forcingPlayhead&&!e){if(t>=c)for(s=this._first;s&&t>=s._startTime&&!u;)s._duration||"isPause"!==s.data||s.ratio||0===s._startTime&&0===this._rawPrevTime||(u=s),s=s._next;else for(s=this._last;s&&s._startTime>=t&&!u;)s._duration||"isPause"===s.data&&s._rawPrevTime>0&&(u=s),s=s._prev;u&&(this._time=t=u._startTime,this._totalTime=t+this._cycle*(this._totalDuration+this._repeatDelay))}this._totalTime=this._time=this._rawPrevTime=t}if(this._time!==c&&this._first||i||l||u){if(this._initted||(this._initted=!0),this._active||!this._paused&&this._time!==c&&t>0&&(this._active=!0),0===c&&this.vars.onStart&&0!==this._time&&(e||this._callback("onStart")),this._time>=c)for(s=this._first;s&&(a=s._next,!this._paused||d);)(s._active||s._startTime<=this._time&&!s._paused&&!s._gc)&&(u===s&&this.pause(),s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)),s=a;else for(s=this._last;s&&(a=s._prev,!this._paused||d);){if(s._active||c>=s._startTime&&!s._paused&&!s._gc){if(u===s){for(u=s._prev;u&&u.endTime()>this._time;)u.render(u._reversed?u.totalDuration()-(t-u._startTime)*u._timeScale:(t-u._startTime)*u._timeScale,e,i),u=u._prev;u=null,this.pause()}s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)}s=a}this._onUpdate&&(e||(h.length&&_(),this._callback("onUpdate"))),o&&(this._gc||(p===this._startTime||m!==this._timeScale)&&(0===this._time||f>=this.totalDuration())&&(n&&(h.length&&_(),this._timeline.autoRemoveChildren&&this._enabled(!1,!1),this._active=!1),!e&&this.vars[o]&&this._callback(o)))}},d._hasPausedChild=function(){for(var t=this._first;t;){if(t._paused||t instanceof s&&t._hasPausedChild())return!0;t=t._next}return!1},d.getChildren=function(t,e,s,r){r=r||-9999999999;for(var n=[],a=this._first,o=0;a;)r>a._startTime||(a instanceof i?e!==!1&&(n[o++]=a):(s!==!1&&(n[o++]=a),t!==!1&&(n=n.concat(a.getChildren(!0,e,s)),o=n.length))),a=a._next;return n},d.getTweensOf=function(t,e){var s,r,n=this._gc,a=[],o=0;for(n&&this._enabled(!0,!0),s=i.getTweensOf(t),r=s.length;--r>-1;)(s[r].timeline===this||e&&this._contains(s[r]))&&(a[o++]=s[r]);return n&&this._enabled(!1,!0),a},d.recent=function(){return this._recent},d._contains=function(t){for(var e=t.timeline;e;){if(e===this)return!0;e=e.timeline}return!1},d.shiftChildren=function(t,e,i){i=i||0;for(var s,r=this._first,n=this._labels;r;)r._startTime>=i&&(r._startTime+=t),r=r._next;if(e)for(s in n)n[s]>=i&&(n[s]+=t);return this._uncache(!0)},d._kill=function(t,e){if(!t&&!e)return this._enabled(!1,!1);for(var i=e?this.getTweensOf(e):this.getChildren(!0,!0,!1),s=i.length,r=!1;--s>-1;)i[s]._kill(t,e)&&(r=!0);return r},d.clear=function(t){var e=this.getChildren(!1,!0,!0),i=e.length;for(this._time=this._totalTime=0;--i>-1;)e[i]._enabled(!1,!1);return t!==!1&&(this._labels={}),this._uncache(!0)},d.invalidate=function(){for(var e=this._first;e;)e.invalidate(),e=e._next;return t.prototype.invalidate.call(this)},d._enabled=function(t,i){if(t===this._gc)for(var s=this._first;s;)s._enabled(t,!0),s=s._next;return e.prototype._enabled.call(this,t,i)},d.totalTime=function(){this._forcingPlayhead=!0;var e=t.prototype.totalTime.apply(this,arguments);return this._forcingPlayhead=!1,e},d.duration=function(t){return arguments.length?(0!==this.duration()&&0!==t&&this.timeScale(this._duration/t),this):(this._dirty&&this.totalDuration(),this._duration)},d.totalDuration=function(t){if(!arguments.length){if(this._dirty){for(var e,i,s=0,r=this._last,n=999999999999;r;)e=r._prev,r._dirty&&r.totalDuration(),r._startTime>n&&this._sortChildren&&!r._paused?this.add(r,r._startTime-r._delay):n=r._startTime,0>r._startTime&&!r._paused&&(s-=r._startTime,this._timeline.smoothChildTiming&&(this._startTime+=r._startTime/this._timeScale),this.shiftChildren(-r._startTime,!1,-9999999999),n=0),i=r._startTime+r._totalDuration/r._timeScale,i>s&&(s=i),r=e;this._duration=this._totalDuration=s,this._dirty=!1}return this._totalDuration}return 0!==this.totalDuration()&&0!==t&&this.timeScale(this._totalDuration/t),this},d.paused=function(e){if(!e)for(var i=this._first,s=this._time;i;)i._startTime===s&&"isPause"===i.data&&(i._rawPrevTime=0),i=i._next;return t.prototype.paused.apply(this,arguments)},d.usesFrames=function(){for(var e=this._timeline;e._timeline;)e=e._timeline;return e===t._rootFramesTimeline},d.rawTime=function(){return this._paused?this._totalTime:(this._timeline.rawTime()-this._startTime)*this._timeScale},s},!0)}),_gsScope._gsDefine&&_gsScope._gsQueue.pop()(),function(t){"use strict";var e=function(){return(_gsScope.GreenSockGlobals||_gsScope)[t]};"function"==typeof define&&define.amd?define(["TweenLite"],e):"undefined"!=typeof module&&module.exports&&(require("./TweenLite.js"),module.exports=e())}("TimelineLite");

/*!
 * VERSION: beta 1.15.2
 * DATE: 2015-01-27
 * UPDATES AND DOCS AT: http://greensock.com
 *
 * @license Copyright (c) 2008-2015, GreenSock. All rights reserved.
 * This work is subject to the terms at http://greensock.com/standard-license or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 **/
var _gsScope="undefined"!=typeof module&&module.exports&&"undefined"!=typeof global?global:this||window;(_gsScope._gsQueue||(_gsScope._gsQueue=[])).push(function(){"use strict";_gsScope._gsDefine("easing.Back",["easing.Ease"],function(t){var e,i,s,r=_gsScope.GreenSockGlobals||_gsScope,n=r.com.greensock,a=2*Math.PI,o=Math.PI/2,h=n._class,l=function(e,i){var s=h("easing."+e,function(){},!0),r=s.prototype=new t;return r.constructor=s,r.getRatio=i,s},_=t.register||function(){},u=function(t,e,i,s){var r=h("easing."+t,{easeOut:new e,easeIn:new i,easeInOut:new s},!0);return _(r,t),r},c=function(t,e,i){this.t=t,this.v=e,i&&(this.next=i,i.prev=this,this.c=i.v-e,this.gap=i.t-t)},f=function(e,i){var s=h("easing."+e,function(t){this._p1=t||0===t?t:1.70158,this._p2=1.525*this._p1},!0),r=s.prototype=new t;return r.constructor=s,r.getRatio=i,r.config=function(t){return new s(t)},s},p=u("Back",f("BackOut",function(t){return(t-=1)*t*((this._p1+1)*t+this._p1)+1}),f("BackIn",function(t){return t*t*((this._p1+1)*t-this._p1)}),f("BackInOut",function(t){return 1>(t*=2)?.5*t*t*((this._p2+1)*t-this._p2):.5*((t-=2)*t*((this._p2+1)*t+this._p2)+2)})),m=h("easing.SlowMo",function(t,e,i){e=e||0===e?e:.7,null==t?t=.7:t>1&&(t=1),this._p=1!==t?e:0,this._p1=(1-t)/2,this._p2=t,this._p3=this._p1+this._p2,this._calcEnd=i===!0},!0),d=m.prototype=new t;return d.constructor=m,d.getRatio=function(t){var e=t+(.5-t)*this._p;return this._p1>t?this._calcEnd?1-(t=1-t/this._p1)*t:e-(t=1-t/this._p1)*t*t*t*e:t>this._p3?this._calcEnd?1-(t=(t-this._p3)/this._p1)*t:e+(t-e)*(t=(t-this._p3)/this._p1)*t*t*t:this._calcEnd?1:e},m.ease=new m(.7,.7),d.config=m.config=function(t,e,i){return new m(t,e,i)},e=h("easing.SteppedEase",function(t){t=t||1,this._p1=1/t,this._p2=t+1},!0),d=e.prototype=new t,d.constructor=e,d.getRatio=function(t){return 0>t?t=0:t>=1&&(t=.999999999),(this._p2*t>>0)*this._p1},d.config=e.config=function(t){return new e(t)},i=h("easing.RoughEase",function(e){e=e||{};for(var i,s,r,n,a,o,h=e.taper||"none",l=[],_=0,u=0|(e.points||20),f=u,p=e.randomize!==!1,m=e.clamp===!0,d=e.template instanceof t?e.template:null,g="number"==typeof e.strength?.4*e.strength:.4;--f>-1;)i=p?Math.random():1/u*f,s=d?d.getRatio(i):i,"none"===h?r=g:"out"===h?(n=1-i,r=n*n*g):"in"===h?r=i*i*g:.5>i?(n=2*i,r=.5*n*n*g):(n=2*(1-i),r=.5*n*n*g),p?s+=Math.random()*r-.5*r:f%2?s+=.5*r:s-=.5*r,m&&(s>1?s=1:0>s&&(s=0)),l[_++]={x:i,y:s};for(l.sort(function(t,e){return t.x-e.x}),o=new c(1,1,null),f=u;--f>-1;)a=l[f],o=new c(a.x,a.y,o);this._prev=new c(0,0,0!==o.t?o:o.next)},!0),d=i.prototype=new t,d.constructor=i,d.getRatio=function(t){var e=this._prev;if(t>e.t){for(;e.next&&t>=e.t;)e=e.next;e=e.prev}else for(;e.prev&&e.t>=t;)e=e.prev;return this._prev=e,e.v+(t-e.t)/e.gap*e.c},d.config=function(t){return new i(t)},i.ease=new i,u("Bounce",l("BounceOut",function(t){return 1/2.75>t?7.5625*t*t:2/2.75>t?7.5625*(t-=1.5/2.75)*t+.75:2.5/2.75>t?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375}),l("BounceIn",function(t){return 1/2.75>(t=1-t)?1-7.5625*t*t:2/2.75>t?1-(7.5625*(t-=1.5/2.75)*t+.75):2.5/2.75>t?1-(7.5625*(t-=2.25/2.75)*t+.9375):1-(7.5625*(t-=2.625/2.75)*t+.984375)}),l("BounceInOut",function(t){var e=.5>t;return t=e?1-2*t:2*t-1,t=1/2.75>t?7.5625*t*t:2/2.75>t?7.5625*(t-=1.5/2.75)*t+.75:2.5/2.75>t?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375,e?.5*(1-t):.5*t+.5})),u("Circ",l("CircOut",function(t){return Math.sqrt(1-(t-=1)*t)}),l("CircIn",function(t){return-(Math.sqrt(1-t*t)-1)}),l("CircInOut",function(t){return 1>(t*=2)?-.5*(Math.sqrt(1-t*t)-1):.5*(Math.sqrt(1-(t-=2)*t)+1)})),s=function(e,i,s){var r=h("easing."+e,function(t,e){this._p1=t>=1?t:1,this._p2=(e||s)/(1>t?t:1),this._p3=this._p2/a*(Math.asin(1/this._p1)||0),this._p2=a/this._p2},!0),n=r.prototype=new t;return n.constructor=r,n.getRatio=i,n.config=function(t,e){return new r(t,e)},r},u("Elastic",s("ElasticOut",function(t){return this._p1*Math.pow(2,-10*t)*Math.sin((t-this._p3)*this._p2)+1},.3),s("ElasticIn",function(t){return-(this._p1*Math.pow(2,10*(t-=1))*Math.sin((t-this._p3)*this._p2))},.3),s("ElasticInOut",function(t){return 1>(t*=2)?-.5*this._p1*Math.pow(2,10*(t-=1))*Math.sin((t-this._p3)*this._p2):.5*this._p1*Math.pow(2,-10*(t-=1))*Math.sin((t-this._p3)*this._p2)+1},.45)),u("Expo",l("ExpoOut",function(t){return 1-Math.pow(2,-10*t)}),l("ExpoIn",function(t){return Math.pow(2,10*(t-1))-.001}),l("ExpoInOut",function(t){return 1>(t*=2)?.5*Math.pow(2,10*(t-1)):.5*(2-Math.pow(2,-10*(t-1)))})),u("Sine",l("SineOut",function(t){return Math.sin(t*o)}),l("SineIn",function(t){return-Math.cos(t*o)+1}),l("SineInOut",function(t){return-.5*(Math.cos(Math.PI*t)-1)})),h("easing.EaseLookup",{find:function(e){return t.map[e]}},!0),_(r.SlowMo,"SlowMo","ease,"),_(i,"RoughEase","ease,"),_(e,"SteppedEase","ease,"),p},!0)}),_gsScope._gsDefine&&_gsScope._gsQueue.pop()();


/*!
 * VERSION: 1.18.0
 * DATE: 2015-09-05
 * UPDATES AND DOCS AT: http://greensock.com
 *
 * @license Copyright (c) 2008-2015, GreenSock. All rights reserved.
 * This work is subject to the terms at http://greensock.com/standard-license or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 */
var _gsScope="undefined"!=typeof module&&module.exports&&"undefined"!=typeof global?global:this||window;(_gsScope._gsQueue||(_gsScope._gsQueue=[])).push(function(){"use strict";_gsScope._gsDefine("plugins.CSSPlugin",["plugins.TweenPlugin","TweenLite"],function(t,e){var i,r,s,n,a=function(){t.call(this,"css"),this._overwriteProps.length=0,this.setRatio=a.prototype.setRatio},o=_gsScope._gsDefine.globals,l={},h=a.prototype=new t("css");h.constructor=a,a.version="1.18.0",a.API=2,a.defaultTransformPerspective=0,a.defaultSkewType="compensated",a.defaultSmoothOrigin=!0,h="px",a.suffixMap={top:h,right:h,bottom:h,left:h,width:h,height:h,fontSize:h,padding:h,margin:h,perspective:h,lineHeight:""};var u,f,c,_,p,d,m=/(?:\d|\-\d|\.\d|\-\.\d)+/g,g=/(?:\d|\-\d|\.\d|\-\.\d|\+=\d|\-=\d|\+=.\d|\-=\.\d)+/g,v=/(?:\+=|\-=|\-|\b)[\d\-\.]+[a-zA-Z0-9]*(?:%|\b)/gi,y=/(?![+-]?\d*\.?\d+|[+-]|e[+-]\d+)[^0-9]/g,x=/(?:\d|\-|\+|=|#|\.)*/g,T=/opacity *= *([^)]*)/i,w=/opacity:([^;]*)/i,b=/alpha\(opacity *=.+?\)/i,P=/^(rgb|hsl)/,S=/([A-Z])/g,O=/-([a-z])/gi,C=/(^(?:url\(\"|url\())|(?:(\"\))$|\)$)/gi,k=function(t,e){return e.toUpperCase()},R=/(?:Left|Right|Width)/i,A=/(M11|M12|M21|M22)=[\d\-\.e]+/gi,M=/progid\:DXImageTransform\.Microsoft\.Matrix\(.+?\)/i,D=/,(?=[^\)]*(?:\(|$))/gi,L=Math.PI/180,N=180/Math.PI,F={},X=document,z=function(t){return X.createElementNS?X.createElementNS("http://www.w3.org/1999/xhtml",t):X.createElement(t)},B=z("div"),I=z("img"),E=a._internals={_specialProps:l},Y=navigator.userAgent,W=function(){var t=Y.indexOf("Android"),e=z("a");return c=-1!==Y.indexOf("Safari")&&-1===Y.indexOf("Chrome")&&(-1===t||Number(Y.substr(t+8,1))>3),p=c&&6>Number(Y.substr(Y.indexOf("Version/")+8,1)),_=-1!==Y.indexOf("Firefox"),(/MSIE ([0-9]{1,}[\.0-9]{0,})/.exec(Y)||/Trident\/.*rv:([0-9]{1,}[\.0-9]{0,})/.exec(Y))&&(d=parseFloat(RegExp.$1)),e?(e.style.cssText="top:1px;opacity:.55;",/^0.55/.test(e.style.opacity)):!1}(),V=function(t){return T.test("string"==typeof t?t:(t.currentStyle?t.currentStyle.filter:t.style.filter)||"")?parseFloat(RegExp.$1)/100:1},j=function(t){window.console&&console.log(t)},G="",U="",q=function(t,e){e=e||B;var i,r,s=e.style;if(void 0!==s[t])return t;for(t=t.charAt(0).toUpperCase()+t.substr(1),i=["O","Moz","ms","Ms","Webkit"],r=5;--r>-1&&void 0===s[i[r]+t];);return r>=0?(U=3===r?"ms":i[r],G="-"+U.toLowerCase()+"-",U+t):null},H=X.defaultView?X.defaultView.getComputedStyle:function(){},Q=a.getStyle=function(t,e,i,r,s){var n;return W||"opacity"!==e?(!r&&t.style[e]?n=t.style[e]:(i=i||H(t))?n=i[e]||i.getPropertyValue(e)||i.getPropertyValue(e.replace(S,"-$1").toLowerCase()):t.currentStyle&&(n=t.currentStyle[e]),null==s||n&&"none"!==n&&"auto"!==n&&"auto auto"!==n?n:s):V(t)},Z=E.convertToPixels=function(t,i,r,s,n){if("px"===s||!s)return r;if("auto"===s||!r)return 0;var o,l,h,u=R.test(i),f=t,c=B.style,_=0>r;if(_&&(r=-r),"%"===s&&-1!==i.indexOf("border"))o=r/100*(u?t.clientWidth:t.clientHeight);else{if(c.cssText="border:0 solid red;position:"+Q(t,"position")+";line-height:0;","%"!==s&&f.appendChild&&"v"!==s.charAt(0)&&"rem"!==s)c[u?"borderLeftWidth":"borderTopWidth"]=r+s;else{if(f=t.parentNode||X.body,l=f._gsCache,h=e.ticker.frame,l&&u&&l.time===h)return l.width*r/100;c[u?"width":"height"]=r+s}f.appendChild(B),o=parseFloat(B[u?"offsetWidth":"offsetHeight"]),f.removeChild(B),u&&"%"===s&&a.cacheWidths!==!1&&(l=f._gsCache=f._gsCache||{},l.time=h,l.width=100*(o/r)),0!==o||n||(o=Z(t,i,r,s,!0))}return _?-o:o},$=E.calculateOffset=function(t,e,i){if("absolute"!==Q(t,"position",i))return 0;var r="left"===e?"Left":"Top",s=Q(t,"margin"+r,i);return t["offset"+r]-(Z(t,e,parseFloat(s),s.replace(x,""))||0)},K=function(t,e){var i,r,s,n={};if(e=e||H(t,null))if(i=e.length)for(;--i>-1;)s=e[i],(-1===s.indexOf("-transform")||Se===s)&&(n[s.replace(O,k)]=e.getPropertyValue(s));else for(i in e)(-1===i.indexOf("Transform")||Pe===i)&&(n[i]=e[i]);else if(e=t.currentStyle||t.style)for(i in e)"string"==typeof i&&void 0===n[i]&&(n[i.replace(O,k)]=e[i]);return W||(n.opacity=V(t)),r=ze(t,e,!1),n.rotation=r.rotation,n.skewX=r.skewX,n.scaleX=r.scaleX,n.scaleY=r.scaleY,n.x=r.x,n.y=r.y,Ce&&(n.z=r.z,n.rotationX=r.rotationX,n.rotationY=r.rotationY,n.scaleZ=r.scaleZ),n.filters&&delete n.filters,n},J=function(t,e,i,r,s){var n,a,o,l={},h=t.style;for(a in i)"cssText"!==a&&"length"!==a&&isNaN(a)&&(e[a]!==(n=i[a])||s&&s[a])&&-1===a.indexOf("Origin")&&("number"==typeof n||"string"==typeof n)&&(l[a]="auto"!==n||"left"!==a&&"top"!==a?""!==n&&"auto"!==n&&"none"!==n||"string"!=typeof e[a]||""===e[a].replace(y,"")?n:0:$(t,a),void 0!==h[a]&&(o=new pe(h,a,h[a],o)));if(r)for(a in r)"className"!==a&&(l[a]=r[a]);return{difs:l,firstMPT:o}},te={width:["Left","Right"],height:["Top","Bottom"]},ee=["marginLeft","marginRight","marginTop","marginBottom"],ie=function(t,e,i){var r=parseFloat("width"===e?t.offsetWidth:t.offsetHeight),s=te[e],n=s.length;for(i=i||H(t,null);--n>-1;)r-=parseFloat(Q(t,"padding"+s[n],i,!0))||0,r-=parseFloat(Q(t,"border"+s[n]+"Width",i,!0))||0;return r},re=function(t,e){if("contain"===t||"auto"===t||"auto auto"===t)return t+" ";(null==t||""===t)&&(t="0 0");var i=t.split(" "),r=-1!==t.indexOf("left")?"0%":-1!==t.indexOf("right")?"100%":i[0],s=-1!==t.indexOf("top")?"0%":-1!==t.indexOf("bottom")?"100%":i[1];return null==s?s="center"===r?"50%":"0":"center"===s&&(s="50%"),("center"===r||isNaN(parseFloat(r))&&-1===(r+"").indexOf("="))&&(r="50%"),t=r+" "+s+(i.length>2?" "+i[2]:""),e&&(e.oxp=-1!==r.indexOf("%"),e.oyp=-1!==s.indexOf("%"),e.oxr="="===r.charAt(1),e.oyr="="===s.charAt(1),e.ox=parseFloat(r.replace(y,"")),e.oy=parseFloat(s.replace(y,"")),e.v=t),e||t},se=function(t,e){return"string"==typeof t&&"="===t.charAt(1)?parseInt(t.charAt(0)+"1",10)*parseFloat(t.substr(2)):parseFloat(t)-parseFloat(e)},ne=function(t,e){return null==t?e:"string"==typeof t&&"="===t.charAt(1)?parseInt(t.charAt(0)+"1",10)*parseFloat(t.substr(2))+e:parseFloat(t)},ae=function(t,e,i,r){var s,n,a,o,l,h=1e-6;return null==t?o=e:"number"==typeof t?o=t:(s=360,n=t.split("_"),l="="===t.charAt(1),a=(l?parseInt(t.charAt(0)+"1",10)*parseFloat(n[0].substr(2)):parseFloat(n[0]))*(-1===t.indexOf("rad")?1:N)-(l?0:e),n.length&&(r&&(r[i]=e+a),-1!==t.indexOf("short")&&(a%=s,a!==a%(s/2)&&(a=0>a?a+s:a-s)),-1!==t.indexOf("_cw")&&0>a?a=(a+9999999999*s)%s-(0|a/s)*s:-1!==t.indexOf("ccw")&&a>0&&(a=(a-9999999999*s)%s-(0|a/s)*s)),o=e+a),h>o&&o>-h&&(o=0),o},oe={aqua:[0,255,255],lime:[0,255,0],silver:[192,192,192],black:[0,0,0],maroon:[128,0,0],teal:[0,128,128],blue:[0,0,255],navy:[0,0,128],white:[255,255,255],fuchsia:[255,0,255],olive:[128,128,0],yellow:[255,255,0],orange:[255,165,0],gray:[128,128,128],purple:[128,0,128],green:[0,128,0],red:[255,0,0],pink:[255,192,203],cyan:[0,255,255],transparent:[255,255,255,0]},le=function(t,e,i){return t=0>t?t+1:t>1?t-1:t,0|255*(1>6*t?e+6*(i-e)*t:.5>t?i:2>3*t?e+6*(i-e)*(2/3-t):e)+.5},he=a.parseColor=function(t,e){var i,r,s,n,a,o,l,h,u,f,c;if(t)if("number"==typeof t)i=[t>>16,255&t>>8,255&t];else{if(","===t.charAt(t.length-1)&&(t=t.substr(0,t.length-1)),oe[t])i=oe[t];else if("#"===t.charAt(0))4===t.length&&(r=t.charAt(1),s=t.charAt(2),n=t.charAt(3),t="#"+r+r+s+s+n+n),t=parseInt(t.substr(1),16),i=[t>>16,255&t>>8,255&t];else if("hsl"===t.substr(0,3))if(i=c=t.match(m),e){if(-1!==t.indexOf("="))return t.match(g)}else a=Number(i[0])%360/360,o=Number(i[1])/100,l=Number(i[2])/100,s=.5>=l?l*(o+1):l+o-l*o,r=2*l-s,i.length>3&&(i[3]=Number(t[3])),i[0]=le(a+1/3,r,s),i[1]=le(a,r,s),i[2]=le(a-1/3,r,s);else i=t.match(m)||oe.transparent;i[0]=Number(i[0]),i[1]=Number(i[1]),i[2]=Number(i[2]),i.length>3&&(i[3]=Number(i[3]))}else i=oe.black;return e&&!c&&(r=i[0]/255,s=i[1]/255,n=i[2]/255,h=Math.max(r,s,n),u=Math.min(r,s,n),l=(h+u)/2,h===u?a=o=0:(f=h-u,o=l>.5?f/(2-h-u):f/(h+u),a=h===r?(s-n)/f+(n>s?6:0):h===s?(n-r)/f+2:(r-s)/f+4,a*=60),i[0]=0|a+.5,i[1]=0|100*o+.5,i[2]=0|100*l+.5),i},ue=function(t,e){var i,r,s,n=t.match(fe)||[],a=0,o=n.length?"":t;for(i=0;n.length>i;i++)r=n[i],s=t.substr(a,t.indexOf(r,a)-a),a+=s.length+r.length,r=he(r,e),3===r.length&&r.push(1),o+=s+(e?"hsla("+r[0]+","+r[1]+"%,"+r[2]+"%,"+r[3]:"rgba("+r.join(","))+")";return o},fe="(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#.+?\\b";for(h in oe)fe+="|"+h+"\\b";fe=RegExp(fe+")","gi"),a.colorStringFilter=function(t){var e,i=t[0]+t[1];fe.lastIndex=0,fe.test(i)&&(e=-1!==i.indexOf("hsl(")||-1!==i.indexOf("hsla("),t[0]=ue(t[0],e),t[1]=ue(t[1],e))},e.defaultStringFilter||(e.defaultStringFilter=a.colorStringFilter);var ce=function(t,e,i,r){if(null==t)return function(t){return t};var s,n=e?(t.match(fe)||[""])[0]:"",a=t.split(n).join("").match(v)||[],o=t.substr(0,t.indexOf(a[0])),l=")"===t.charAt(t.length-1)?")":"",h=-1!==t.indexOf(" ")?" ":",",u=a.length,f=u>0?a[0].replace(m,""):"";return u?s=e?function(t){var e,c,_,p;if("number"==typeof t)t+=f;else if(r&&D.test(t)){for(p=t.replace(D,"|").split("|"),_=0;p.length>_;_++)p[_]=s(p[_]);return p.join(",")}if(e=(t.match(fe)||[n])[0],c=t.split(e).join("").match(v)||[],_=c.length,u>_--)for(;u>++_;)c[_]=i?c[0|(_-1)/2]:a[_];return o+c.join(h)+h+e+l+(-1!==t.indexOf("inset")?" inset":"")}:function(t){var e,n,c;if("number"==typeof t)t+=f;else if(r&&D.test(t)){for(n=t.replace(D,"|").split("|"),c=0;n.length>c;c++)n[c]=s(n[c]);return n.join(",")}if(e=t.match(v)||[],c=e.length,u>c--)for(;u>++c;)e[c]=i?e[0|(c-1)/2]:a[c];return o+e.join(h)+l}:function(t){return t}},_e=function(t){return t=t.split(","),function(e,i,r,s,n,a,o){var l,h=(i+"").split(" ");for(o={},l=0;4>l;l++)o[t[l]]=h[l]=h[l]||h[(l-1)/2>>0];return s.parse(e,o,n,a)}},pe=(E._setPluginRatio=function(t){this.plugin.setRatio(t);for(var e,i,r,s,n=this.data,a=n.proxy,o=n.firstMPT,l=1e-6;o;)e=a[o.v],o.r?e=Math.round(e):l>e&&e>-l&&(e=0),o.t[o.p]=e,o=o._next;if(n.autoRotate&&(n.autoRotate.rotation=a.rotation),1===t)for(o=n.firstMPT;o;){if(i=o.t,i.type){if(1===i.type){for(s=i.xs0+i.s+i.xs1,r=1;i.l>r;r++)s+=i["xn"+r]+i["xs"+(r+1)];i.e=s}}else i.e=i.s+i.xs0;o=o._next}},function(t,e,i,r,s){this.t=t,this.p=e,this.v=i,this.r=s,r&&(r._prev=this,this._next=r)}),de=(E._parseToProxy=function(t,e,i,r,s,n){var a,o,l,h,u,f=r,c={},_={},p=i._transform,d=F;for(i._transform=null,F=e,r=u=i.parse(t,e,r,s),F=d,n&&(i._transform=p,f&&(f._prev=null,f._prev&&(f._prev._next=null)));r&&r!==f;){if(1>=r.type&&(o=r.p,_[o]=r.s+r.c,c[o]=r.s,n||(h=new pe(r,"s",o,h,r.r),r.c=0),1===r.type))for(a=r.l;--a>0;)l="xn"+a,o=r.p+"_"+l,_[o]=r.data[l],c[o]=r[l],n||(h=new pe(r,l,o,h,r.rxp[l]));r=r._next}return{proxy:c,end:_,firstMPT:h,pt:u}},E.CSSPropTween=function(t,e,r,s,a,o,l,h,u,f,c){this.t=t,this.p=e,this.s=r,this.c=s,this.n=l||e,t instanceof de||n.push(this.n),this.r=h,this.type=o||0,u&&(this.pr=u,i=!0),this.b=void 0===f?r:f,this.e=void 0===c?r+s:c,a&&(this._next=a,a._prev=this)}),me=function(t,e,i,r,s,n){var a=new de(t,e,i,r-i,s,-1,n);return a.b=i,a.e=a.xs0=r,a},ge=a.parseComplex=function(t,e,i,r,s,n,a,o,l,h){i=i||n||"",a=new de(t,e,0,0,a,h?2:1,null,!1,o,i,r),r+="";var f,c,_,p,d,v,y,x,T,w,b,P,S,O=i.split(", ").join(",").split(" "),C=r.split(", ").join(",").split(" "),k=O.length,R=u!==!1;for((-1!==r.indexOf(",")||-1!==i.indexOf(","))&&(O=O.join(" ").replace(D,", ").split(" "),C=C.join(" ").replace(D,", ").split(" "),k=O.length),k!==C.length&&(O=(n||"").split(" "),k=O.length),a.plugin=l,a.setRatio=h,fe.lastIndex=0,f=0;k>f;f++)if(p=O[f],d=C[f],x=parseFloat(p),x||0===x)a.appendXtra("",x,se(d,x),d.replace(g,""),R&&-1!==d.indexOf("px"),!0);else if(s&&fe.test(p))P=","===d.charAt(d.length-1)?"),":")",S=-1!==d.indexOf("hsl")&&W,p=he(p,S),d=he(d,S),T=p.length+d.length>6,T&&!W&&0===d[3]?(a["xs"+a.l]+=a.l?" transparent":"transparent",a.e=a.e.split(C[f]).join("transparent")):(W||(T=!1),S?a.appendXtra(T?"hsla(":"hsl(",p[0],se(d[0],p[0]),",",!1,!0).appendXtra("",p[1],se(d[1],p[1]),"%,",!1).appendXtra("",p[2],se(d[2],p[2]),T?"%,":"%"+P,!1):a.appendXtra(T?"rgba(":"rgb(",p[0],d[0]-p[0],",",!0,!0).appendXtra("",p[1],d[1]-p[1],",",!0).appendXtra("",p[2],d[2]-p[2],T?",":P,!0),T&&(p=4>p.length?1:p[3],a.appendXtra("",p,(4>d.length?1:d[3])-p,P,!1))),fe.lastIndex=0;else if(v=p.match(m)){if(y=d.match(g),!y||y.length!==v.length)return a;for(_=0,c=0;v.length>c;c++)b=v[c],w=p.indexOf(b,_),a.appendXtra(p.substr(_,w-_),Number(b),se(y[c],b),"",R&&"px"===p.substr(w+b.length,2),0===c),_=w+b.length;a["xs"+a.l]+=p.substr(_)}else a["xs"+a.l]+=a.l?" "+p:p;if(-1!==r.indexOf("=")&&a.data){for(P=a.xs0+a.data.s,f=1;a.l>f;f++)P+=a["xs"+f]+a.data["xn"+f];a.e=P+a["xs"+f]}return a.l||(a.type=-1,a.xs0=a.e),a.xfirst||a},ve=9;for(h=de.prototype,h.l=h.pr=0;--ve>0;)h["xn"+ve]=0,h["xs"+ve]="";h.xs0="",h._next=h._prev=h.xfirst=h.data=h.plugin=h.setRatio=h.rxp=null,h.appendXtra=function(t,e,i,r,s,n){var a=this,o=a.l;return a["xs"+o]+=n&&o?" "+t:t||"",i||0===o||a.plugin?(a.l++,a.type=a.setRatio?2:1,a["xs"+a.l]=r||"",o>0?(a.data["xn"+o]=e+i,a.rxp["xn"+o]=s,a["xn"+o]=e,a.plugin||(a.xfirst=new de(a,"xn"+o,e,i,a.xfirst||a,0,a.n,s,a.pr),a.xfirst.xs0=0),a):(a.data={s:e+i},a.rxp={},a.s=e,a.c=i,a.r=s,a)):(a["xs"+o]+=e+(r||""),a)};var ye=function(t,e){e=e||{},this.p=e.prefix?q(t)||t:t,l[t]=l[this.p]=this,this.format=e.formatter||ce(e.defaultValue,e.color,e.collapsible,e.multi),e.parser&&(this.parse=e.parser),this.clrs=e.color,this.multi=e.multi,this.keyword=e.keyword,this.dflt=e.defaultValue,this.pr=e.priority||0},xe=E._registerComplexSpecialProp=function(t,e,i){"object"!=typeof e&&(e={parser:i});var r,s,n=t.split(","),a=e.defaultValue;for(i=i||[a],r=0;n.length>r;r++)e.prefix=0===r&&e.prefix,e.defaultValue=i[r]||a,s=new ye(n[r],e)},Te=function(t){if(!l[t]){var e=t.charAt(0).toUpperCase()+t.substr(1)+"Plugin";xe(t,{parser:function(t,i,r,s,n,a,h){var u=o.com.greensock.plugins[e];return u?(u._cssRegister(),l[r].parse(t,i,r,s,n,a,h)):(j("Error: "+e+" js file not loaded."),n)}})}};h=ye.prototype,h.parseComplex=function(t,e,i,r,s,n){var a,o,l,h,u,f,c=this.keyword;if(this.multi&&(D.test(i)||D.test(e)?(o=e.replace(D,"|").split("|"),l=i.replace(D,"|").split("|")):c&&(o=[e],l=[i])),l){for(h=l.length>o.length?l.length:o.length,a=0;h>a;a++)e=o[a]=o[a]||this.dflt,i=l[a]=l[a]||this.dflt,c&&(u=e.indexOf(c),f=i.indexOf(c),u!==f&&(-1===f?o[a]=o[a].split(c).join(""):-1===u&&(o[a]+=" "+c)));e=o.join(", "),i=l.join(", ")}return ge(t,this.p,e,i,this.clrs,this.dflt,r,this.pr,s,n)},h.parse=function(t,e,i,r,n,a){return this.parseComplex(t.style,this.format(Q(t,this.p,s,!1,this.dflt)),this.format(e),n,a)},a.registerSpecialProp=function(t,e,i){xe(t,{parser:function(t,r,s,n,a,o){var l=new de(t,s,0,0,a,2,s,!1,i);return l.plugin=o,l.setRatio=e(t,r,n._tween,s),l},priority:i})},a.useSVGTransformAttr=c||_;var we,be="scaleX,scaleY,scaleZ,x,y,z,skewX,skewY,rotation,rotationX,rotationY,perspective,xPercent,yPercent".split(","),Pe=q("transform"),Se=G+"transform",Oe=q("transformOrigin"),Ce=null!==q("perspective"),ke=E.Transform=function(){this.perspective=parseFloat(a.defaultTransformPerspective)||0,this.force3D=a.defaultForce3D!==!1&&Ce?a.defaultForce3D||"auto":!1},Re=window.SVGElement,Ae=function(t,e,i){var r,s=X.createElementNS("http://www.w3.org/2000/svg",t),n=/([a-z])([A-Z])/g;for(r in i)s.setAttributeNS(null,r.replace(n,"$1-$2").toLowerCase(),i[r]);return e.appendChild(s),s},Me=X.documentElement,De=function(){var t,e,i,r=d||/Android/i.test(Y)&&!window.chrome;return X.createElementNS&&!r&&(t=Ae("svg",Me),e=Ae("rect",t,{width:100,height:50,x:100}),i=e.getBoundingClientRect().width,e.style[Oe]="50% 50%",e.style[Pe]="scaleX(0.5)",r=i===e.getBoundingClientRect().width&&!(_&&Ce),Me.removeChild(t)),r}(),Le=function(t,e,i,r,s){var n,o,l,h,u,f,c,_,p,d,m,g,v,y,x=t._gsTransform,T=Xe(t,!0);x&&(v=x.xOrigin,y=x.yOrigin),(!r||2>(n=r.split(" ")).length)&&(c=t.getBBox(),e=re(e).split(" "),n=[(-1!==e[0].indexOf("%")?parseFloat(e[0])/100*c.width:parseFloat(e[0]))+c.x,(-1!==e[1].indexOf("%")?parseFloat(e[1])/100*c.height:parseFloat(e[1]))+c.y]),i.xOrigin=h=parseFloat(n[0]),i.yOrigin=u=parseFloat(n[1]),r&&T!==Fe&&(f=T[0],c=T[1],_=T[2],p=T[3],d=T[4],m=T[5],g=f*p-c*_,o=h*(p/g)+u*(-_/g)+(_*m-p*d)/g,l=h*(-c/g)+u*(f/g)-(f*m-c*d)/g,h=i.xOrigin=n[0]=o,u=i.yOrigin=n[1]=l),x&&(s||s!==!1&&a.defaultSmoothOrigin!==!1?(o=h-v,l=u-y,x.xOffset+=o*T[0]+l*T[2]-o,x.yOffset+=o*T[1]+l*T[3]-l):x.xOffset=x.yOffset=0),t.setAttribute("data-svg-origin",n.join(" "))},Ne=function(t){return!!(Re&&"function"==typeof t.getBBox&&t.getCTM&&(!t.parentNode||t.parentNode.getBBox&&t.parentNode.getCTM))},Fe=[1,0,0,1,0,0],Xe=function(t,e){var i,r,s,n,a,o=t._gsTransform||new ke,l=1e5;if(Pe?r=Q(t,Se,null,!0):t.currentStyle&&(r=t.currentStyle.filter.match(A),r=r&&4===r.length?[r[0].substr(4),Number(r[2].substr(4)),Number(r[1].substr(4)),r[3].substr(4),o.x||0,o.y||0].join(","):""),i=!r||"none"===r||"matrix(1, 0, 0, 1, 0, 0)"===r,(o.svg||t.getBBox&&Ne(t))&&(i&&-1!==(t.style[Pe]+"").indexOf("matrix")&&(r=t.style[Pe],i=0),s=t.getAttribute("transform"),i&&s&&(-1!==s.indexOf("matrix")?(r=s,i=0):-1!==s.indexOf("translate")&&(r="matrix(1,0,0,1,"+s.match(/(?:\-|\b)[\d\-\.e]+\b/gi).join(",")+")",i=0))),i)return Fe;for(s=(r||"").match(/(?:\-|\b)[\d\-\.e]+\b/gi)||[],ve=s.length;--ve>-1;)n=Number(s[ve]),s[ve]=(a=n-(n|=0))?(0|a*l+(0>a?-.5:.5))/l+n:n;return e&&s.length>6?[s[0],s[1],s[4],s[5],s[12],s[13]]:s},ze=E.getTransform=function(t,i,r,n){if(t._gsTransform&&r&&!n)return t._gsTransform;var o,l,h,u,f,c,_=r?t._gsTransform||new ke:new ke,p=0>_.scaleX,d=2e-5,m=1e5,g=Ce?parseFloat(Q(t,Oe,i,!1,"0 0 0").split(" ")[2])||_.zOrigin||0:0,v=parseFloat(a.defaultTransformPerspective)||0;if(_.svg=!(!t.getBBox||!Ne(t)),_.svg&&(Le(t,Q(t,Oe,s,!1,"50% 50%")+"",_,t.getAttribute("data-svg-origin")),we=a.useSVGTransformAttr||De),o=Xe(t),o!==Fe){if(16===o.length){var y,x,T,w,b,P=o[0],S=o[1],O=o[2],C=o[3],k=o[4],R=o[5],A=o[6],M=o[7],D=o[8],L=o[9],F=o[10],X=o[12],z=o[13],B=o[14],I=o[11],E=Math.atan2(A,F);_.zOrigin&&(B=-_.zOrigin,X=D*B-o[12],z=L*B-o[13],B=F*B+_.zOrigin-o[14]),_.rotationX=E*N,E&&(w=Math.cos(-E),b=Math.sin(-E),y=k*w+D*b,x=R*w+L*b,T=A*w+F*b,D=k*-b+D*w,L=R*-b+L*w,F=A*-b+F*w,I=M*-b+I*w,k=y,R=x,A=T),E=Math.atan2(D,F),_.rotationY=E*N,E&&(w=Math.cos(-E),b=Math.sin(-E),y=P*w-D*b,x=S*w-L*b,T=O*w-F*b,L=S*b+L*w,F=O*b+F*w,I=C*b+I*w,P=y,S=x,O=T),E=Math.atan2(S,P),_.rotation=E*N,E&&(w=Math.cos(-E),b=Math.sin(-E),P=P*w+k*b,x=S*w+R*b,R=S*-b+R*w,A=O*-b+A*w,S=x),_.rotationX&&Math.abs(_.rotationX)+Math.abs(_.rotation)>359.9&&(_.rotationX=_.rotation=0,_.rotationY+=180),_.scaleX=(0|Math.sqrt(P*P+S*S)*m+.5)/m,_.scaleY=(0|Math.sqrt(R*R+L*L)*m+.5)/m,_.scaleZ=(0|Math.sqrt(A*A+F*F)*m+.5)/m,_.skewX=0,_.perspective=I?1/(0>I?-I:I):0,_.x=X,_.y=z,_.z=B,_.svg&&(_.x-=_.xOrigin-(_.xOrigin*P-_.yOrigin*k),_.y-=_.yOrigin-(_.yOrigin*S-_.xOrigin*R))}else if(!(Ce&&!n&&o.length&&_.x===o[4]&&_.y===o[5]&&(_.rotationX||_.rotationY)||void 0!==_.x&&"none"===Q(t,"display",i))){var Y=o.length>=6,W=Y?o[0]:1,V=o[1]||0,j=o[2]||0,G=Y?o[3]:1;_.x=o[4]||0,_.y=o[5]||0,h=Math.sqrt(W*W+V*V),u=Math.sqrt(G*G+j*j),f=W||V?Math.atan2(V,W)*N:_.rotation||0,c=j||G?Math.atan2(j,G)*N+f:_.skewX||0,Math.abs(c)>90&&270>Math.abs(c)&&(p?(h*=-1,c+=0>=f?180:-180,f+=0>=f?180:-180):(u*=-1,c+=0>=c?180:-180)),_.scaleX=h,_.scaleY=u,_.rotation=f,_.skewX=c,Ce&&(_.rotationX=_.rotationY=_.z=0,_.perspective=v,_.scaleZ=1),_.svg&&(_.x-=_.xOrigin-(_.xOrigin*W+_.yOrigin*j),_.y-=_.yOrigin-(_.xOrigin*V+_.yOrigin*G))}_.zOrigin=g;for(l in _)d>_[l]&&_[l]>-d&&(_[l]=0)}return r&&(t._gsTransform=_,_.svg&&(we&&t.style[Pe]?e.delayedCall(.001,function(){Ye(t.style,Pe)}):!we&&t.getAttribute("transform")&&e.delayedCall(.001,function(){t.removeAttribute("transform")}))),_},Be=function(t){var e,i,r=this.data,s=-r.rotation*L,n=s+r.skewX*L,a=1e5,o=(0|Math.cos(s)*r.scaleX*a)/a,l=(0|Math.sin(s)*r.scaleX*a)/a,h=(0|Math.sin(n)*-r.scaleY*a)/a,u=(0|Math.cos(n)*r.scaleY*a)/a,f=this.t.style,c=this.t.currentStyle;if(c){i=l,l=-h,h=-i,e=c.filter,f.filter="";var _,p,m=this.t.offsetWidth,g=this.t.offsetHeight,v="absolute"!==c.position,y="progid:DXImageTransform.Microsoft.Matrix(M11="+o+", M12="+l+", M21="+h+", M22="+u,w=r.x+m*r.xPercent/100,b=r.y+g*r.yPercent/100;if(null!=r.ox&&(_=(r.oxp?.01*m*r.ox:r.ox)-m/2,p=(r.oyp?.01*g*r.oy:r.oy)-g/2,w+=_-(_*o+p*l),b+=p-(_*h+p*u)),v?(_=m/2,p=g/2,y+=", Dx="+(_-(_*o+p*l)+w)+", Dy="+(p-(_*h+p*u)+b)+")"):y+=", sizingMethod='auto expand')",f.filter=-1!==e.indexOf("DXImageTransform.Microsoft.Matrix(")?e.replace(M,y):y+" "+e,(0===t||1===t)&&1===o&&0===l&&0===h&&1===u&&(v&&-1===y.indexOf("Dx=0, Dy=0")||T.test(e)&&100!==parseFloat(RegExp.$1)||-1===e.indexOf("gradient("&&e.indexOf("Alpha"))&&f.removeAttribute("filter")),!v){var P,S,O,C=8>d?1:-1;for(_=r.ieOffsetX||0,p=r.ieOffsetY||0,r.ieOffsetX=Math.round((m-((0>o?-o:o)*m+(0>l?-l:l)*g))/2+w),r.ieOffsetY=Math.round((g-((0>u?-u:u)*g+(0>h?-h:h)*m))/2+b),ve=0;4>ve;ve++)S=ee[ve],P=c[S],i=-1!==P.indexOf("px")?parseFloat(P):Z(this.t,S,parseFloat(P),P.replace(x,""))||0,O=i!==r[S]?2>ve?-r.ieOffsetX:-r.ieOffsetY:2>ve?_-r.ieOffsetX:p-r.ieOffsetY,f[S]=(r[S]=Math.round(i-O*(0===ve||2===ve?1:C)))+"px"}}},Ie=E.set3DTransformRatio=E.setTransformRatio=function(t){var e,i,r,s,n,a,o,l,h,u,f,c,p,d,m,g,v,y,x,T,w,b,P,S=this.data,O=this.t.style,C=S.rotation,k=S.rotationX,R=S.rotationY,A=S.scaleX,M=S.scaleY,D=S.scaleZ,N=S.x,F=S.y,X=S.z,z=S.svg,B=S.perspective,I=S.force3D;if(!(((1!==t&&0!==t||"auto"!==I||this.tween._totalTime!==this.tween._totalDuration&&this.tween._totalTime)&&I||X||B||R||k)&&(!we||!z)&&Ce))return C||S.skewX||z?(C*=L,b=S.skewX*L,P=1e5,e=Math.cos(C)*A,s=Math.sin(C)*A,i=Math.sin(C-b)*-M,n=Math.cos(C-b)*M,b&&"simple"===S.skewType&&(v=Math.tan(b),v=Math.sqrt(1+v*v),i*=v,n*=v,S.skewY&&(e*=v,s*=v)),z&&(N+=S.xOrigin-(S.xOrigin*e+S.yOrigin*i)+S.xOffset,F+=S.yOrigin-(S.xOrigin*s+S.yOrigin*n)+S.yOffset,we&&(S.xPercent||S.yPercent)&&(d=this.t.getBBox(),N+=.01*S.xPercent*d.width,F+=.01*S.yPercent*d.height),d=1e-6,d>N&&N>-d&&(N=0),d>F&&F>-d&&(F=0)),x=(0|e*P)/P+","+(0|s*P)/P+","+(0|i*P)/P+","+(0|n*P)/P+","+N+","+F+")",z&&we?this.t.setAttribute("transform","matrix("+x):O[Pe]=(S.xPercent||S.yPercent?"translate("+S.xPercent+"%,"+S.yPercent+"%) matrix(":"matrix(")+x):O[Pe]=(S.xPercent||S.yPercent?"translate("+S.xPercent+"%,"+S.yPercent+"%) matrix(":"matrix(")+A+",0,0,"+M+","+N+","+F+")",void 0;if(_&&(d=1e-4,d>A&&A>-d&&(A=D=2e-5),d>M&&M>-d&&(M=D=2e-5),!B||S.z||S.rotationX||S.rotationY||(B=0)),C||S.skewX)C*=L,m=e=Math.cos(C),g=s=Math.sin(C),S.skewX&&(C-=S.skewX*L,m=Math.cos(C),g=Math.sin(C),"simple"===S.skewType&&(v=Math.tan(S.skewX*L),v=Math.sqrt(1+v*v),m*=v,g*=v,S.skewY&&(e*=v,s*=v))),i=-g,n=m;else{if(!(R||k||1!==D||B||z))return O[Pe]=(S.xPercent||S.yPercent?"translate("+S.xPercent+"%,"+S.yPercent+"%) translate3d(":"translate3d(")+N+"px,"+F+"px,"+X+"px)"+(1!==A||1!==M?" scale("+A+","+M+")":""),void 0;e=n=1,i=s=0}h=1,r=a=o=l=u=f=0,c=B?-1/B:0,p=S.zOrigin,d=1e-6,T=",",w="0",C=R*L,C&&(m=Math.cos(C),g=Math.sin(C),o=-g,u=c*-g,r=e*g,a=s*g,h=m,c*=m,e*=m,s*=m),C=k*L,C&&(m=Math.cos(C),g=Math.sin(C),v=i*m+r*g,y=n*m+a*g,l=h*g,f=c*g,r=i*-g+r*m,a=n*-g+a*m,h*=m,c*=m,i=v,n=y),1!==D&&(r*=D,a*=D,h*=D,c*=D),1!==M&&(i*=M,n*=M,l*=M,f*=M),1!==A&&(e*=A,s*=A,o*=A,u*=A),(p||z)&&(p&&(N+=r*-p,F+=a*-p,X+=h*-p+p),z&&(N+=S.xOrigin-(S.xOrigin*e+S.yOrigin*i)+S.xOffset,F+=S.yOrigin-(S.xOrigin*s+S.yOrigin*n)+S.yOffset),d>N&&N>-d&&(N=w),d>F&&F>-d&&(F=w),d>X&&X>-d&&(X=0)),x=S.xPercent||S.yPercent?"translate("+S.xPercent+"%,"+S.yPercent+"%) matrix3d(":"matrix3d(",x+=(d>e&&e>-d?w:e)+T+(d>s&&s>-d?w:s)+T+(d>o&&o>-d?w:o),x+=T+(d>u&&u>-d?w:u)+T+(d>i&&i>-d?w:i)+T+(d>n&&n>-d?w:n),k||R?(x+=T+(d>l&&l>-d?w:l)+T+(d>f&&f>-d?w:f)+T+(d>r&&r>-d?w:r),x+=T+(d>a&&a>-d?w:a)+T+(d>h&&h>-d?w:h)+T+(d>c&&c>-d?w:c)+T):x+=",0,0,0,0,1,0,",x+=N+T+F+T+X+T+(B?1+-X/B:1)+")",O[Pe]=x};h=ke.prototype,h.x=h.y=h.z=h.skewX=h.skewY=h.rotation=h.rotationX=h.rotationY=h.zOrigin=h.xPercent=h.yPercent=h.xOffset=h.yOffset=0,h.scaleX=h.scaleY=h.scaleZ=1,xe("transform,scale,scaleX,scaleY,scaleZ,x,y,z,rotation,rotationX,rotationY,rotationZ,skewX,skewY,shortRotation,shortRotationX,shortRotationY,shortRotationZ,transformOrigin,svgOrigin,transformPerspective,directionalRotation,parseTransform,force3D,skewType,xPercent,yPercent,smoothOrigin",{parser:function(t,e,i,r,n,o,l){if(r._lastParsedTransform===l)return n;r._lastParsedTransform=l;var h,u,f,c,_,p,d,m,g,v,y=t._gsTransform,x=t.style,T=1e-6,w=be.length,b=l,P={},S="transformOrigin";if(l.display?(c=Q(t,"display"),x.display="block",h=ze(t,s,!0,l.parseTransform),x.display=c):h=ze(t,s,!0,l.parseTransform),r._transform=h,"string"==typeof b.transform&&Pe)c=B.style,c[Pe]=b.transform,c.display="block",c.position="absolute",X.body.appendChild(B),u=ze(B,null,!1),X.body.removeChild(B),u.perspective||(u.perspective=h.perspective),null!=b.xPercent&&(u.xPercent=ne(b.xPercent,h.xPercent)),null!=b.yPercent&&(u.yPercent=ne(b.yPercent,h.yPercent));else if("object"==typeof b){if(u={scaleX:ne(null!=b.scaleX?b.scaleX:b.scale,h.scaleX),scaleY:ne(null!=b.scaleY?b.scaleY:b.scale,h.scaleY),scaleZ:ne(b.scaleZ,h.scaleZ),x:ne(b.x,h.x),y:ne(b.y,h.y),z:ne(b.z,h.z),xPercent:ne(b.xPercent,h.xPercent),yPercent:ne(b.yPercent,h.yPercent),perspective:ne(b.transformPerspective,h.perspective)},m=b.directionalRotation,null!=m)if("object"==typeof m)for(c in m)b[c]=m[c];else b.rotation=m;"string"==typeof b.x&&-1!==b.x.indexOf("%")&&(u.x=0,u.xPercent=ne(b.x,h.xPercent)),"string"==typeof b.y&&-1!==b.y.indexOf("%")&&(u.y=0,u.yPercent=ne(b.y,h.yPercent)),u.rotation=ae("rotation"in b?b.rotation:"shortRotation"in b?b.shortRotation+"_short":"rotationZ"in b?b.rotationZ:h.rotation,h.rotation,"rotation",P),Ce&&(u.rotationX=ae("rotationX"in b?b.rotationX:"shortRotationX"in b?b.shortRotationX+"_short":h.rotationX||0,h.rotationX,"rotationX",P),u.rotationY=ae("rotationY"in b?b.rotationY:"shortRotationY"in b?b.shortRotationY+"_short":h.rotationY||0,h.rotationY,"rotationY",P)),u.skewX=null==b.skewX?h.skewX:ae(b.skewX,h.skewX),u.skewY=null==b.skewY?h.skewY:ae(b.skewY,h.skewY),(f=u.skewY-h.skewY)&&(u.skewX+=f,u.rotation+=f)}for(Ce&&null!=b.force3D&&(h.force3D=b.force3D,d=!0),h.skewType=b.skewType||h.skewType||a.defaultSkewType,p=h.force3D||h.z||h.rotationX||h.rotationY||u.z||u.rotationX||u.rotationY||u.perspective,p||null==b.scale||(u.scaleZ=1);--w>-1;)i=be[w],_=u[i]-h[i],(_>T||-T>_||null!=b[i]||null!=F[i])&&(d=!0,n=new de(h,i,h[i],_,n),i in P&&(n.e=P[i]),n.xs0=0,n.plugin=o,r._overwriteProps.push(n.n));return _=b.transformOrigin,h.svg&&(_||b.svgOrigin)&&(g=h.xOffset,v=h.yOffset,Le(t,re(_),u,b.svgOrigin,b.smoothOrigin),n=me(h,"xOrigin",(y?h:u).xOrigin,u.xOrigin,n,S),n=me(h,"yOrigin",(y?h:u).yOrigin,u.yOrigin,n,S),(g!==h.xOffset||v!==h.yOffset)&&(n=me(h,"xOffset",y?g:h.xOffset,h.xOffset,n,S),n=me(h,"yOffset",y?v:h.yOffset,h.yOffset,n,S)),_=we?null:"0px 0px"),(_||Ce&&p&&h.zOrigin)&&(Pe?(d=!0,i=Oe,_=(_||Q(t,i,s,!1,"50% 50%"))+"",n=new de(x,i,0,0,n,-1,S),n.b=x[i],n.plugin=o,Ce?(c=h.zOrigin,_=_.split(" "),h.zOrigin=(_.length>2&&(0===c||"0px"!==_[2])?parseFloat(_[2]):c)||0,n.xs0=n.e=_[0]+" "+(_[1]||"50%")+" 0px",n=new de(h,"zOrigin",0,0,n,-1,n.n),n.b=c,n.xs0=n.e=h.zOrigin):n.xs0=n.e=_):re(_+"",h)),d&&(r._transformType=h.svg&&we||!p&&3!==this._transformType?2:3),n},prefix:!0}),xe("boxShadow",{defaultValue:"0px 0px 0px 0px #999",prefix:!0,color:!0,multi:!0,keyword:"inset"}),xe("borderRadius",{defaultValue:"0px",parser:function(t,e,i,n,a){e=this.format(e);var o,l,h,u,f,c,_,p,d,m,g,v,y,x,T,w,b=["borderTopLeftRadius","borderTopRightRadius","borderBottomRightRadius","borderBottomLeftRadius"],P=t.style;for(d=parseFloat(t.offsetWidth),m=parseFloat(t.offsetHeight),o=e.split(" "),l=0;b.length>l;l++)this.p.indexOf("border")&&(b[l]=q(b[l])),f=u=Q(t,b[l],s,!1,"0px"),-1!==f.indexOf(" ")&&(u=f.split(" "),f=u[0],u=u[1]),c=h=o[l],_=parseFloat(f),v=f.substr((_+"").length),y="="===c.charAt(1),y?(p=parseInt(c.charAt(0)+"1",10),c=c.substr(2),p*=parseFloat(c),g=c.substr((p+"").length-(0>p?1:0))||""):(p=parseFloat(c),g=c.substr((p+"").length)),""===g&&(g=r[i]||v),g!==v&&(x=Z(t,"borderLeft",_,v),T=Z(t,"borderTop",_,v),"%"===g?(f=100*(x/d)+"%",u=100*(T/m)+"%"):"em"===g?(w=Z(t,"borderLeft",1,"em"),f=x/w+"em",u=T/w+"em"):(f=x+"px",u=T+"px"),y&&(c=parseFloat(f)+p+g,h=parseFloat(u)+p+g)),a=ge(P,b[l],f+" "+u,c+" "+h,!1,"0px",a);return a},prefix:!0,formatter:ce("0px 0px 0px 0px",!1,!0)}),xe("backgroundPosition",{defaultValue:"0 0",parser:function(t,e,i,r,n,a){var o,l,h,u,f,c,_="background-position",p=s||H(t,null),m=this.format((p?d?p.getPropertyValue(_+"-x")+" "+p.getPropertyValue(_+"-y"):p.getPropertyValue(_):t.currentStyle.backgroundPositionX+" "+t.currentStyle.backgroundPositionY)||"0 0"),g=this.format(e);if(-1!==m.indexOf("%")!=(-1!==g.indexOf("%"))&&(c=Q(t,"backgroundImage").replace(C,""),c&&"none"!==c)){for(o=m.split(" "),l=g.split(" "),I.setAttribute("src",c),h=2;--h>-1;)m=o[h],u=-1!==m.indexOf("%"),u!==(-1!==l[h].indexOf("%"))&&(f=0===h?t.offsetWidth-I.width:t.offsetHeight-I.height,o[h]=u?parseFloat(m)/100*f+"px":100*(parseFloat(m)/f)+"%");m=o.join(" ")}return this.parseComplex(t.style,m,g,n,a)},formatter:re}),xe("backgroundSize",{defaultValue:"0 0",formatter:re}),xe("perspective",{defaultValue:"0px",prefix:!0}),xe("perspectiveOrigin",{defaultValue:"50% 50%",prefix:!0}),xe("transformStyle",{prefix:!0}),xe("backfaceVisibility",{prefix:!0}),xe("userSelect",{prefix:!0}),xe("margin",{parser:_e("marginTop,marginRight,marginBottom,marginLeft")}),xe("padding",{parser:_e("paddingTop,paddingRight,paddingBottom,paddingLeft")}),xe("clip",{defaultValue:"rect(0px,0px,0px,0px)",parser:function(t,e,i,r,n,a){var o,l,h;return 9>d?(l=t.currentStyle,h=8>d?" ":",",o="rect("+l.clipTop+h+l.clipRight+h+l.clipBottom+h+l.clipLeft+")",e=this.format(e).split(",").join(h)):(o=this.format(Q(t,this.p,s,!1,this.dflt)),e=this.format(e)),this.parseComplex(t.style,o,e,n,a)}}),xe("textShadow",{defaultValue:"0px 0px 0px #999",color:!0,multi:!0}),xe("autoRound,strictUnits",{parser:function(t,e,i,r,s){return s}}),xe("border",{defaultValue:"0px solid #000",parser:function(t,e,i,r,n,a){return this.parseComplex(t.style,this.format(Q(t,"borderTopWidth",s,!1,"0px")+" "+Q(t,"borderTopStyle",s,!1,"solid")+" "+Q(t,"borderTopColor",s,!1,"#000")),this.format(e),n,a)},color:!0,formatter:function(t){var e=t.split(" ");return e[0]+" "+(e[1]||"solid")+" "+(t.match(fe)||["#000"])[0]}}),xe("borderWidth",{parser:_e("borderTopWidth,borderRightWidth,borderBottomWidth,borderLeftWidth")}),xe("float,cssFloat,styleFloat",{parser:function(t,e,i,r,s){var n=t.style,a="cssFloat"in n?"cssFloat":"styleFloat";return new de(n,a,0,0,s,-1,i,!1,0,n[a],e)}});var Ee=function(t){var e,i=this.t,r=i.filter||Q(this.data,"filter")||"",s=0|this.s+this.c*t;100===s&&(-1===r.indexOf("atrix(")&&-1===r.indexOf("radient(")&&-1===r.indexOf("oader(")?(i.removeAttribute("filter"),e=!Q(this.data,"filter")):(i.filter=r.replace(b,""),e=!0)),e||(this.xn1&&(i.filter=r=r||"alpha(opacity="+s+")"),-1===r.indexOf("pacity")?0===s&&this.xn1||(i.filter=r+" alpha(opacity="+s+")"):i.filter=r.replace(T,"opacity="+s))};xe("opacity,alpha,autoAlpha",{defaultValue:"1",parser:function(t,e,i,r,n,a){var o=parseFloat(Q(t,"opacity",s,!1,"1")),l=t.style,h="autoAlpha"===i;return"string"==typeof e&&"="===e.charAt(1)&&(e=("-"===e.charAt(0)?-1:1)*parseFloat(e.substr(2))+o),h&&1===o&&"hidden"===Q(t,"visibility",s)&&0!==e&&(o=0),W?n=new de(l,"opacity",o,e-o,n):(n=new de(l,"opacity",100*o,100*(e-o),n),n.xn1=h?1:0,l.zoom=1,n.type=2,n.b="alpha(opacity="+n.s+")",n.e="alpha(opacity="+(n.s+n.c)+")",n.data=t,n.plugin=a,n.setRatio=Ee),h&&(n=new de(l,"visibility",0,0,n,-1,null,!1,0,0!==o?"inherit":"hidden",0===e?"hidden":"inherit"),n.xs0="inherit",r._overwriteProps.push(n.n),r._overwriteProps.push(i)),n}});var Ye=function(t,e){e&&(t.removeProperty?(("ms"===e.substr(0,2)||"webkit"===e.substr(0,6))&&(e="-"+e),t.removeProperty(e.replace(S,"-$1").toLowerCase())):t.removeAttribute(e))},We=function(t){if(this.t._gsClassPT=this,1===t||0===t){this.t.setAttribute("class",0===t?this.b:this.e);for(var e=this.data,i=this.t.style;e;)e.v?i[e.p]=e.v:Ye(i,e.p),e=e._next;1===t&&this.t._gsClassPT===this&&(this.t._gsClassPT=null)}else this.t.getAttribute("class")!==this.e&&this.t.setAttribute("class",this.e)};xe("className",{parser:function(t,e,r,n,a,o,l){var h,u,f,c,_,p=t.getAttribute("class")||"",d=t.style.cssText;if(a=n._classNamePT=new de(t,r,0,0,a,2),a.setRatio=We,a.pr=-11,i=!0,a.b=p,u=K(t,s),f=t._gsClassPT){for(c={},_=f.data;_;)c[_.p]=1,_=_._next;
f.setRatio(1)}return t._gsClassPT=a,a.e="="!==e.charAt(1)?e:p.replace(RegExp("\\s*\\b"+e.substr(2)+"\\b"),"")+("+"===e.charAt(0)?" "+e.substr(2):""),t.setAttribute("class",a.e),h=J(t,u,K(t),l,c),t.setAttribute("class",p),a.data=h.firstMPT,t.style.cssText=d,a=a.xfirst=n.parse(t,h.difs,a,o)}});var Ve=function(t){if((1===t||0===t)&&this.data._totalTime===this.data._totalDuration&&"isFromStart"!==this.data.data){var e,i,r,s,n,a=this.t.style,o=l.transform.parse;if("all"===this.e)a.cssText="",s=!0;else for(e=this.e.split(" ").join("").split(","),r=e.length;--r>-1;)i=e[r],l[i]&&(l[i].parse===o?s=!0:i="transformOrigin"===i?Oe:l[i].p),Ye(a,i);s&&(Ye(a,Pe),n=this.t._gsTransform,n&&(n.svg&&this.t.removeAttribute("data-svg-origin"),delete this.t._gsTransform))}};for(xe("clearProps",{parser:function(t,e,r,s,n){return n=new de(t,r,0,0,n,2),n.setRatio=Ve,n.e=e,n.pr=-10,n.data=s._tween,i=!0,n}}),h="bezier,throwProps,physicsProps,physics2D".split(","),ve=h.length;ve--;)Te(h[ve]);h=a.prototype,h._firstPT=h._lastParsedTransform=h._transform=null,h._onInitTween=function(t,e,o){if(!t.nodeType)return!1;this._target=t,this._tween=o,this._vars=e,u=e.autoRound,i=!1,r=e.suffixMap||a.suffixMap,s=H(t,""),n=this._overwriteProps;var h,_,d,m,g,v,y,x,T,b=t.style;if(f&&""===b.zIndex&&(h=Q(t,"zIndex",s),("auto"===h||""===h)&&this._addLazySet(b,"zIndex",0)),"string"==typeof e&&(m=b.cssText,h=K(t,s),b.cssText=m+";"+e,h=J(t,h,K(t)).difs,!W&&w.test(e)&&(h.opacity=parseFloat(RegExp.$1)),e=h,b.cssText=m),this._firstPT=_=e.className?l.className.parse(t,e.className,"className",this,null,null,e):this.parse(t,e,null),this._transformType){for(T=3===this._transformType,Pe?c&&(f=!0,""===b.zIndex&&(y=Q(t,"zIndex",s),("auto"===y||""===y)&&this._addLazySet(b,"zIndex",0)),p&&this._addLazySet(b,"WebkitBackfaceVisibility",this._vars.WebkitBackfaceVisibility||(T?"visible":"hidden"))):b.zoom=1,d=_;d&&d._next;)d=d._next;x=new de(t,"transform",0,0,null,2),this._linkCSSP(x,null,d),x.setRatio=Pe?Ie:Be,x.data=this._transform||ze(t,s,!0),x.tween=o,x.pr=-1,n.pop()}if(i){for(;_;){for(v=_._next,d=m;d&&d.pr>_.pr;)d=d._next;(_._prev=d?d._prev:g)?_._prev._next=_:m=_,(_._next=d)?d._prev=_:g=_,_=v}this._firstPT=m}return!0},h.parse=function(t,e,i,n){var a,o,h,f,c,_,p,d,m,g,v=t.style;for(a in e)_=e[a],o=l[a],o?i=o.parse(t,_,a,this,i,n,e):(c=Q(t,a,s)+"",m="string"==typeof _,"color"===a||"fill"===a||"stroke"===a||-1!==a.indexOf("Color")||m&&P.test(_)?(m||(_=he(_),_=(_.length>3?"rgba(":"rgb(")+_.join(",")+")"),i=ge(v,a,c,_,!0,"transparent",i,0,n)):!m||-1===_.indexOf(" ")&&-1===_.indexOf(",")?(h=parseFloat(c),p=h||0===h?c.substr((h+"").length):"",(""===c||"auto"===c)&&("width"===a||"height"===a?(h=ie(t,a,s),p="px"):"left"===a||"top"===a?(h=$(t,a,s),p="px"):(h="opacity"!==a?0:1,p="")),g=m&&"="===_.charAt(1),g?(f=parseInt(_.charAt(0)+"1",10),_=_.substr(2),f*=parseFloat(_),d=_.replace(x,"")):(f=parseFloat(_),d=m?_.replace(x,""):""),""===d&&(d=a in r?r[a]:p),_=f||0===f?(g?f+h:f)+d:e[a],p!==d&&""!==d&&(f||0===f)&&h&&(h=Z(t,a,h,p),"%"===d?(h/=Z(t,a,100,"%")/100,e.strictUnits!==!0&&(c=h+"%")):"em"===d||"rem"===d?h/=Z(t,a,1,d):"px"!==d&&(f=Z(t,a,f,d),d="px"),g&&(f||0===f)&&(_=f+h+d)),g&&(f+=h),!h&&0!==h||!f&&0!==f?void 0!==v[a]&&(_||"NaN"!=_+""&&null!=_)?(i=new de(v,a,f||h||0,0,i,-1,a,!1,0,c,_),i.xs0="none"!==_||"display"!==a&&-1===a.indexOf("Style")?_:c):j("invalid "+a+" tween value: "+e[a]):(i=new de(v,a,h,f-h,i,0,a,u!==!1&&("px"===d||"zIndex"===a),0,c,_),i.xs0=d)):i=ge(v,a,c,_,!0,null,i,0,n)),n&&i&&!i.plugin&&(i.plugin=n);return i},h.setRatio=function(t){var e,i,r,s=this._firstPT,n=1e-6;if(1!==t||this._tween._time!==this._tween._duration&&0!==this._tween._time)if(t||this._tween._time!==this._tween._duration&&0!==this._tween._time||this._tween._rawPrevTime===-1e-6)for(;s;){if(e=s.c*t+s.s,s.r?e=Math.round(e):n>e&&e>-n&&(e=0),s.type)if(1===s.type)if(r=s.l,2===r)s.t[s.p]=s.xs0+e+s.xs1+s.xn1+s.xs2;else if(3===r)s.t[s.p]=s.xs0+e+s.xs1+s.xn1+s.xs2+s.xn2+s.xs3;else if(4===r)s.t[s.p]=s.xs0+e+s.xs1+s.xn1+s.xs2+s.xn2+s.xs3+s.xn3+s.xs4;else if(5===r)s.t[s.p]=s.xs0+e+s.xs1+s.xn1+s.xs2+s.xn2+s.xs3+s.xn3+s.xs4+s.xn4+s.xs5;else{for(i=s.xs0+e+s.xs1,r=1;s.l>r;r++)i+=s["xn"+r]+s["xs"+(r+1)];s.t[s.p]=i}else-1===s.type?s.t[s.p]=s.xs0:s.setRatio&&s.setRatio(t);else s.t[s.p]=e+s.xs0;s=s._next}else for(;s;)2!==s.type?s.t[s.p]=s.b:s.setRatio(t),s=s._next;else for(;s;){if(2!==s.type)if(s.r&&-1!==s.type)if(e=Math.round(s.s+s.c),s.type){if(1===s.type){for(r=s.l,i=s.xs0+e+s.xs1,r=1;s.l>r;r++)i+=s["xn"+r]+s["xs"+(r+1)];s.t[s.p]=i}}else s.t[s.p]=e+s.xs0;else s.t[s.p]=s.e;else s.setRatio(t);s=s._next}},h._enableTransforms=function(t){this._transform=this._transform||ze(this._target,s,!0),this._transformType=this._transform.svg&&we||!t&&3!==this._transformType?2:3};var je=function(){this.t[this.p]=this.e,this.data._linkCSSP(this,this._next,null,!0)};h._addLazySet=function(t,e,i){var r=this._firstPT=new de(t,e,0,0,this._firstPT,2);r.e=i,r.setRatio=je,r.data=this},h._linkCSSP=function(t,e,i,r){return t&&(e&&(e._prev=t),t._next&&(t._next._prev=t._prev),t._prev?t._prev._next=t._next:this._firstPT===t&&(this._firstPT=t._next,r=!0),i?i._next=t:r||null!==this._firstPT||(this._firstPT=t),t._next=e,t._prev=i),t},h._kill=function(e){var i,r,s,n=e;if(e.autoAlpha||e.alpha){n={};for(r in e)n[r]=e[r];n.opacity=1,n.autoAlpha&&(n.visibility=1)}return e.className&&(i=this._classNamePT)&&(s=i.xfirst,s&&s._prev?this._linkCSSP(s._prev,i._next,s._prev._prev):s===this._firstPT&&(this._firstPT=i._next),i._next&&this._linkCSSP(i._next,i._next._next,s._prev),this._classNamePT=null),t.prototype._kill.call(this,n)};var Ge=function(t,e,i){var r,s,n,a;if(t.slice)for(s=t.length;--s>-1;)Ge(t[s],e,i);else for(r=t.childNodes,s=r.length;--s>-1;)n=r[s],a=n.type,n.style&&(e.push(K(n)),i&&i.push(n)),1!==a&&9!==a&&11!==a||!n.childNodes.length||Ge(n,e,i)};return a.cascadeTo=function(t,i,r){var s,n,a,o,l=e.to(t,i,r),h=[l],u=[],f=[],c=[],_=e._internals.reservedProps;for(t=l._targets||l.target,Ge(t,u,c),l.render(i,!0,!0),Ge(t,f),l.render(0,!0,!0),l._enabled(!0),s=c.length;--s>-1;)if(n=J(c[s],u[s],f[s]),n.firstMPT){n=n.difs;for(a in r)_[a]&&(n[a]=r[a]);o={};for(a in n)o[a]=u[s][a];h.push(e.fromTo(c[s],i,o,n))}return h},t.activate([a]),a},!0)}),_gsScope._gsDefine&&_gsScope._gsQueue.pop()(),function(t){"use strict";var e=function(){return(_gsScope.GreenSockGlobals||_gsScope)[t]};"function"==typeof define&&define.amd?define(["TweenLite"],e):"undefined"!=typeof module&&module.exports&&(require("../TweenLite.js"),module.exports=e())}("CSSPlugin");


/*!
 * VERSION: beta 0.3.4
 * DATE: 2015-08-15
 * UPDATES AND DOCS AT: http://greensock.com
 *
 * @license Copyright (c) 2008-2015, GreenSock. All rights reserved.
 * SplitText is a Club GreenSock membership benefit; You must have a valid membership to use
 * this code without violating the terms of use. Visit http://www.greensock.com/club/ to sign up or get more details.
 * This work is subject to the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 */
var _gsScope="undefined"!=typeof module&&module.exports&&"undefined"!=typeof global?global:this||window;(function(t){"use strict";var e=t.GreenSockGlobals||t,i=function(t){var i,s=t.split("."),r=e;for(i=0;s.length>i;i++)r[s[i]]=r=r[s[i]]||{};return r},s=i("com.greensock.utils"),r=function(t){var e=t.nodeType,i="";if(1===e||9===e||11===e){if("string"==typeof t.textContent)return t.textContent;for(t=t.firstChild;t;t=t.nextSibling)i+=r(t)}else if(3===e||4===e)return t.nodeValue;return i},n=document,a=n.defaultView?n.defaultView.getComputedStyle:function(){},o=/([A-Z])/g,l=function(t,e,i,s){var r;return(i=i||a(t,null))?(t=i.getPropertyValue(e.replace(o,"-$1").toLowerCase()),r=t||i.length?t:i[e]):t.currentStyle&&(i=t.currentStyle,r=i[e]),s?r:parseInt(r,10)||0},h=function(t){return t.length&&t[0]&&(t[0].nodeType&&t[0].style&&!t.nodeType||t[0].length&&t[0][0])?!0:!1},_=function(t){var e,i,s,r=[],n=t.length;for(e=0;n>e;e++)if(i=t[e],h(i))for(s=i.length,s=0;i.length>s;s++)r.push(i[s]);else r.push(i);return r},u=")eefec303079ad17405c",c=/(?:<br>|<br\/>|<br \/>)/gi,f=n.all&&!n.addEventListener,p="<div style='position:relative;display:inline-block;"+(f?"*display:inline;*zoom:1;'":"'"),m=function(t){t=t||"";var e=-1!==t.indexOf("++"),i=1;return e&&(t=t.split("++").join("")),function(){return p+(t?" class='"+t+(e?i++:"")+"'>":">")}},d=s.SplitText=e.SplitText=function(t,e){if("string"==typeof t&&(t=d.selector(t)),!t)throw"cannot split a null element.";this.elements=h(t)?_(t):[t],this.chars=[],this.words=[],this.lines=[],this._originals=[],this.vars=e||{},this.split(e)},g=function(t,e,i){var s=t.nodeType;if(1===s||9===s||11===s)for(t=t.firstChild;t;t=t.nextSibling)g(t,e,i);else(3===s||4===s)&&(t.nodeValue=t.nodeValue.split(e).join(i))},v=function(t,e){for(var i=e.length;--i>-1;)t.push(e[i])},y=function(t,e,i,s,o){c.test(t.innerHTML)&&(t.innerHTML=t.innerHTML.replace(c,u));var h,_,f,p,d,y,T,w,b,x,P,S,k,C,R=r(t),O=e.type||e.split||"chars,words,lines",A=-1!==O.indexOf("lines")?[]:null,D=-1!==O.indexOf("words"),M=-1!==O.indexOf("chars"),L="absolute"===e.position||e.absolute===!0,F=L?"&#173; ":" ",z=-999,I=a(t),E=l(t,"paddingLeft",I),N=l(t,"borderBottomWidth",I)+l(t,"borderTopWidth",I),X=l(t,"borderLeftWidth",I)+l(t,"borderRightWidth",I),B=l(t,"paddingTop",I)+l(t,"paddingBottom",I),j=l(t,"paddingLeft",I)+l(t,"paddingRight",I),U=l(t,"textAlign",I,!0),Y=t.clientHeight,q=t.clientWidth,V="</div>",G=m(e.wordsClass),Q=m(e.charsClass),W=-1!==(e.linesClass||"").indexOf("++"),Z=e.linesClass,H=-1!==R.indexOf("<"),$=!0,K=[],J=[],te=[];for(W&&(Z=Z.split("++").join("")),H&&(R=R.split("<").join("{{LT}}")),h=R.length,p=G(),d=0;h>d;d++)if(T=R.charAt(d),")"===T&&R.substr(d,20)===u)p+=($?V:"")+"<BR/>",$=!1,d!==h-20&&R.substr(d+20,20)!==u&&(p+=" "+G(),$=!0),d+=19;else if(" "===T&&" "!==R.charAt(d-1)&&d!==h-1&&R.substr(d-20,20)!==u){for(p+=$?V:"",$=!1;" "===R.charAt(d+1);)p+=F,d++;(")"!==R.charAt(d+1)||R.substr(d+1,20)!==u)&&(p+=F+G(),$=!0)}else"{"===T&&"{{LT}}"===R.substr(d,6)?(p+=M?Q()+"{{LT}}"+"</div>":"{{LT}}",d+=5):p+=M&&" "!==T?Q()+T+"</div>":T;for(t.innerHTML=p+($?V:""),H&&g(t,"{{LT}}","<"),y=t.getElementsByTagName("*"),h=y.length,w=[],d=0;h>d;d++)w[d]=y[d];if(A||L)for(d=0;h>d;d++)b=w[d],f=b.parentNode===t,(f||L||M&&!D)&&(x=b.offsetTop,A&&f&&x!==z&&"BR"!==b.nodeName&&(_=[],A.push(_),z=x),L&&(b._x=b.offsetLeft,b._y=x,b._w=b.offsetWidth,b._h=b.offsetHeight),A&&(D!==f&&M||(_.push(b),b._x-=E),f&&d&&(w[d-1]._wordEnd=!0),"BR"===b.nodeName&&b.nextSibling&&"BR"===b.nextSibling.nodeName&&A.push([])));for(d=0;h>d;d++)b=w[d],f=b.parentNode===t,"BR"!==b.nodeName?(L&&(S=b.style,D||f||(b._x+=b.parentNode._x,b._y+=b.parentNode._y),S.left=b._x+"px",S.top=b._y+"px",S.position="absolute",S.display="block",S.width=b._w+1+"px",S.height=b._h+"px"),D?f&&""!==b.innerHTML?J.push(b):M&&K.push(b):f?(t.removeChild(b),w.splice(d--,1),h--):!f&&M&&(x=!A&&!L&&b.nextSibling,t.appendChild(b),x||t.appendChild(n.createTextNode(" ")),K.push(b))):A||L?(t.removeChild(b),w.splice(d--,1),h--):D||t.appendChild(b);if(A){for(L&&(P=n.createElement("div"),t.appendChild(P),k=P.offsetWidth+"px",x=P.offsetParent===t?0:t.offsetLeft,t.removeChild(P)),S=t.style.cssText,t.style.cssText="display:none;";t.firstChild;)t.removeChild(t.firstChild);for(C=!L||!D&&!M,d=0;A.length>d;d++){for(_=A[d],P=n.createElement("div"),P.style.cssText="display:block;text-align:"+U+";position:"+(L?"absolute;":"relative;"),Z&&(P.className=Z+(W?d+1:"")),te.push(P),h=_.length,y=0;h>y;y++)"BR"!==_[y].nodeName&&(b=_[y],P.appendChild(b),C&&(b._wordEnd||D)&&P.appendChild(n.createTextNode(" ")),L&&(0===y&&(P.style.top=b._y+"px",P.style.left=E+x+"px"),b.style.top="0px",x&&(b.style.left=b._x-x+"px")));0===h&&(P.innerHTML="&nbsp;"),D||M||(P.innerHTML=r(P).split(String.fromCharCode(160)).join(" ")),L&&(P.style.width=k,P.style.height=b._h+"px"),t.appendChild(P)}t.style.cssText=S}L&&(Y>t.clientHeight&&(t.style.height=Y-B+"px",Y>t.clientHeight&&(t.style.height=Y+N+"px")),q>t.clientWidth&&(t.style.width=q-j+"px",q>t.clientWidth&&(t.style.width=q+X+"px"))),v(i,K),v(s,J),v(o,te)},T=d.prototype;T.split=function(t){this.isSplit&&this.revert(),this.vars=t||this.vars,this._originals.length=this.chars.length=this.words.length=this.lines.length=0;for(var e=this.elements.length;--e>-1;)this._originals[e]=this.elements[e].innerHTML,y(this.elements[e],this.vars,this.chars,this.words,this.lines);return this.chars.reverse(),this.words.reverse(),this.lines.reverse(),this.isSplit=!0,this},T.revert=function(){if(!this._originals)throw"revert() call wasn't scoped properly.";for(var t=this._originals.length;--t>-1;)this.elements[t].innerHTML=this._originals[t];return this.chars=[],this.words=[],this.lines=[],this.isSplit=!1,this},d.selector=t.$||t.jQuery||function(e){var i=t.$||t.jQuery;return i?(d.selector=i,i(e)):"undefined"==typeof document?e:document.querySelectorAll?document.querySelectorAll(e):document.getElementById("#"===e.charAt(0)?e.substr(1):e)},d.version="0.3.4"})(_gsScope),function(t){"use strict";var e=function(){return(_gsScope.GreenSockGlobals||_gsScope)[t]};"function"==typeof define&&define.amd?define(["TweenLite"],e):"undefined"!=typeof module&&module.exports&&(module.exports=e())}("SplitText");


try{
	window.GreenSockGlobals = null;
	window._gsQueue = null;
	window._gsDefine = null;

	delete(window.GreenSockGlobals);
	delete(window._gsQueue);
	delete(window._gsDefine);	
   } catch(e) {}

try{
	window.GreenSockGlobals = oldgs;
	window._gsQueue = oldgs_queue;
	} catch(e) {}

if (window.tplogs==true)
	try {
		console.groupEnd();
	} catch(e) {}

(function(e,t){
		e.waitForImages={hasImageProperties:["backgroundImage","listStyleImage","borderImage","borderCornerImage"]};e.expr[":"].uncached=function(t){var n=document.createElement("img");n.src=t.src;return e(t).is('img[src!=""]')&&!n.complete};e.fn.waitForImages=function(t,n,r){if(e.isPlainObject(arguments[0])){n=t.each;r=t.waitForAll;t=t.finished}t=t||e.noop;n=n||e.noop;r=!!r;if(!e.isFunction(t)||!e.isFunction(n)){throw new TypeError("An invalid callback was supplied.")}return this.each(function(){var i=e(this),s=[];if(r){var o=e.waitForImages.hasImageProperties||[],u=/url\((['"]?)(.*?)\1\)/g;i.find("*").each(function(){var t=e(this);if(t.is("img:uncached")){s.push({src:t.attr("src"),element:t[0]})}e.each(o,function(e,n){var r=t.css(n);if(!r){return true}var i;while(i=u.exec(r)){s.push({src:i[2],element:t[0]})}})})}else{i.find("img:uncached").each(function(){s.push({src:this.src,element:this})})}var f=s.length,l=0;if(f==0){t.call(i[0])}e.each(s,function(r,s){var o=new Image;e(o).bind("load error",function(e){l++;n.call(s.element,l,f,e.type=="load");if(l==f){t.call(i[0]);return false}});o.src=s.src})})};		
})(jQuery)

/**************************************************************************
 * jquery.themepunch.revolution.js - jQuery Plugin for Revolution Slider
 * @version: 5.1.6 (04.12.2015)
 * @requires jQuery v1.7 or later (tested on 1.9)
 * @author ThemePunch
**************************************************************************/
!function(e,t){"use strict";e.fn.extend({revolution:function(a){var n={delay:9e3,responsiveLevels:4064,visibilityLevels:[2048,1024,778,480],gridwidth:960,gridheight:500,minHeight:0,autoHeight:"off",sliderType:"standard",sliderLayout:"auto",fullScreenAutoWidth:"off",fullScreenAlignForce:"off",fullScreenOffsetContainer:"",fullScreenOffset:"0",hideCaptionAtLimit:0,hideAllCaptionAtLimit:0,hideSliderAtLimit:0,disableProgressBar:"off",stopAtSlide:-1,stopAfterLoops:-1,shadow:0,dottedOverlay:"none",startDelay:0,lazyType:"smart",spinner:"spinner0",shuffle:"off",viewPort:{enable:!1,outof:"wait",visible_area:"60%"},fallbacks:{isJoomla:!1,panZoomDisableOnMobile:"off",simplifyAll:"on",nextSlideOnWindowFocus:"off",disableFocusListener:!0},parallax:{type:"off",levels:[10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85],origo:"enterpoint",speed:400,bgparallax:"on",opacity:"on",disable_onmobile:"off",ddd_shadow:"on",ddd_bgfreeze:"off",ddd_overflow:"visible",ddd_layer_overflow:"visible",ddd_z_correction:65,ddd_path:"mouse"},carousel:{horizontal_align:"center",vertical_align:"center",infinity:"on",space:0,maxVisibleItems:3,stretch:"off",fadeout:"on",maxRotation:0,minScale:0,vary_fade:"off",vary_rotation:"on",vary_scale:"off",border_radius:"0px",padding_top:0,padding_bottom:0},navigation:{keyboardNavigation:"on",keyboard_direction:"horizontal",mouseScrollNavigation:"off",onHoverStop:"on",touch:{touchenabled:"off",swipe_treshold:75,swipe_min_touches:1,drag_block_vertical:!1,swipe_direction:"horizontal"},arrows:{style:"",enable:!1,hide_onmobile:!1,hide_onleave:!0,hide_delay:200,hide_delay_mobile:1200,hide_under:0,hide_over:9999,tmp:"",left:{h_align:"left",v_align:"center",h_offset:20,v_offset:0},right:{h_align:"right",v_align:"center",h_offset:20,v_offset:0}},bullets:{style:"",enable:!1,hide_onmobile:!1,hide_onleave:!0,hide_delay:200,hide_delay_mobile:1200,hide_under:0,hide_over:9999,direction:"horizontal",h_align:"left",v_align:"center",space:0,h_offset:20,v_offset:0,tmp:'<span class="tp-bullet-image"></span><span class="tp-bullet-title"></span>'},thumbnails:{style:"",enable:!1,width:100,height:50,min_width:100,wrapper_padding:2,wrapper_color:"#f5f5f5",wrapper_opacity:1,tmp:'<span class="tp-thumb-image"></span><span class="tp-thumb-title"></span>',visibleAmount:5,hide_onmobile:!1,hide_onleave:!0,hide_delay:200,hide_delay_mobile:1200,hide_under:0,hide_over:9999,direction:"horizontal",span:!1,position:"inner",space:2,h_align:"left",v_align:"center",h_offset:20,v_offset:0},tabs:{style:"",enable:!1,width:100,min_width:100,height:50,wrapper_padding:10,wrapper_color:"#f5f5f5",wrapper_opacity:1,tmp:'<span class="tp-tab-image"></span>',visibleAmount:5,hide_onmobile:!1,hide_onleave:!0,hide_delay:200,hide_delay_mobile:1200,hide_under:0,hide_over:9999,direction:"horizontal",span:!1,space:0,position:"inner",h_align:"left",v_align:"center",h_offset:20,v_offset:0}},extensions:"extensions/",extensions_suffix:".min.js",debugMode:!1};return a=e.extend(!0,{},n,a),this.each(function(){var n=e(this);"hero"==a.sliderType&&n.find(">ul>li").each(function(t){t>0&&e(this).remove()}),a.jsFileLocation=a.jsFileLocation||d("themepunch.revolution.min.js"),a.jsFileLocation=a.jsFileLocation+a.extensions,a.scriptsneeded=s(a,n),a.curWinRange=0,a.navigation!=t&&a.navigation.touch!=t&&(a.navigation.touch.swipe_min_touches=a.navigation.touch.swipe_min_touches>5?1:a.navigation.touch.swipe_min_touches),e(this).on("scriptsloaded",function(){return a.modulesfailing?(n.html('<div style="margin:auto;line-height:40px;font-size:14px;color:#fff;padding:15px;background:#e74c3c;margin:20px 0px;">!! Error at loading Slider Revolution 5.0 Extrensions.'+a.errorm+"</div>").show(),!1):(i.migration!=t&&(a=i.migration(n,a)),punchgs.force3D=!0,"on"!==a.simplifyAll&&punchgs.TweenLite.lagSmoothing(1e3,16),u(n,a),void h(n,a))}),l(n,a.scriptsneeded)})},revremoveslide:function(a){return this.each(function(){var r=e(this);if(r!=t&&r.length>0&&e("body").find("#"+r.attr("id")).length>0){var s=r.parent().find(".tp-bannertimer"),l=s.data("opt");if(l&&l.li.length>0&&(a>0||a<=l.li.length)){var d=e(l.li[a]),c=d.data("index"),u=!1;l.slideamount=l.slideamount-1,o(".tp-bullet",c,l),o(".tp-tab",c,l),o(".tp-thumb",c,l),d.hasClass("active-revslide")&&(u=!0),d.remove(),l.li=n(l.li,a),l.carousel&&l.carousel.slides&&(l.carousel.slides=n(l.carousel.slides,a)),l.thumbs=n(l.thumbs,a),i.updateNavIndexes&&i.updateNavIndexes(l),u&&r.revnext()}}})},revaddcallback:function(i){return this.each(function(){var a=e(this);if(a!=t&&a.length>0&&e("body").find("#"+a.attr("id")).length>0){var n=a.parent().find(".tp-bannertimer"),o=n.data("opt");o.callBackArray===t&&(o.callBackArray=new Array),o.callBackArray.push(i)}})},revgetparallaxproc:function(){var i=e(this);if(i!=t&&i.length>0&&e("body").find("#"+i.attr("id")).length>0){var a=i.parent().find(".tp-bannertimer"),n=a.data("opt");return n.scrollproc}},revdebugmode:function(){return this.each(function(){var i=e(this);if(i!=t&&i.length>0&&e("body").find("#"+i.attr("id")).length>0){var a=i.parent().find(".tp-bannertimer"),n=a.data("opt");n.debugMode=!0,b(i,n)}})},revscroll:function(i){return this.each(function(){var a=e(this);a!=t&&a.length>0&&e("body").find("#"+a.attr("id")).length>0&&e("body,html").animate({scrollTop:a.offset().top+a.height()-i+"px"},{duration:400})})},revredraw:function(i){return this.each(function(){var i=e(this);if(i!=t&&i.length>0&&e("body").find("#"+i.attr("id")).length>0){var a=i.parent().find(".tp-bannertimer"),n=a.data("opt");b(i,n)}})},revkill:function(a){var n=this,o=e(this);if(punchgs.TweenLite.killDelayedCallsTo(i.showHideNavElements),i.endMoveCaption&&punchgs.TweenLite.killDelayedCallsTo(i.endMoveCaption),o!=t&&o.length>0&&e("body").find("#"+o.attr("id")).length>0){o.data("conthover",1),o.data("conthover-changed",1),o.trigger("revolution.slide.onpause");var r=o.parent().find(".tp-bannertimer"),s=r.data("opt");s.tonpause=!0,o.trigger("stoptimer"),punchgs.TweenLite.killTweensOf(o.find("*"),!1),punchgs.TweenLite.killTweensOf(o,!1),o.unbind("hover, mouseover, mouseenter,mouseleave, resize");var l="resize.revslider-"+o.attr("id");e(window).off(l),o.find("*").each(function(){var i=e(this);i.unbind("on, hover, mouseenter,mouseleave,mouseover, resize,restarttimer, stoptimer"),i.off("on, hover, mouseenter,mouseleave,mouseover, resize"),i.data("mySplitText",null),i.data("ctl",null),i.data("tween")!=t&&i.data("tween").kill(),i.data("kenburn")!=t&&i.data("kenburn").kill(),i.data("timeline_out")!=t&&i.data("timeline_out").kill(),i.data("timeline")!=t&&i.data("timeline").kill(),i.remove(),i.empty(),i=null}),punchgs.TweenLite.killTweensOf(o.find("*"),!1),punchgs.TweenLite.killTweensOf(o,!1),r.remove();try{o.closest(".forcefullwidth_wrapper_tp_banner").remove()}catch(d){}try{o.closest(".rev_slider_wrapper").remove()}catch(d){}try{o.remove()}catch(d){}return o.empty(),o.html(),o=null,s=null,delete n.c,delete n.opt,!0}return!1},revpause:function(){return this.each(function(){var i=e(this);if(i!=t&&i.length>0&&e("body").find("#"+i.attr("id")).length>0){i.data("conthover",1),i.data("conthover-changed",1),i.trigger("revolution.slide.onpause");var a=i.parent().find(".tp-bannertimer"),n=a.data("opt");n.tonpause=!0,i.trigger("stoptimer")}})},revresume:function(){return this.each(function(){var i=e(this);if(i!=t&&i.length>0&&e("body").find("#"+i.attr("id")).length>0){i.data("conthover",0),i.data("conthover-changed",1),i.trigger("revolution.slide.onresume");var a=i.parent().find(".tp-bannertimer"),n=a.data("opt");n.tonpause=!1,i.trigger("starttimer")}})},revnext:function(){return this.each(function(){var a=e(this);if(a!=t&&a.length>0&&e("body").find("#"+a.attr("id")).length>0){var n=a.parent().find(".tp-bannertimer"),o=n.data("opt");i.callingNewSlide(o,a,1)}})},revprev:function(){return this.each(function(){var a=e(this);if(a!=t&&a.length>0&&e("body").find("#"+a.attr("id")).length>0){var n=a.parent().find(".tp-bannertimer"),o=n.data("opt");i.callingNewSlide(o,a,-1)}})},revmaxslide:function(){return e(this).find(".tp-revslider-mainul >li").length},revcurrentslide:function(){var i=e(this);if(i!=t&&i.length>0&&e("body").find("#"+i.attr("id")).length>0){var a=i.parent().find(".tp-bannertimer"),n=a.data("opt");return parseInt(n.act,0)+1}},revlastslide:function(){return e(this).find(".tp-revslider-mainul >li").length},revshowslide:function(a){return this.each(function(){var n=e(this);if(n!=t&&n.length>0&&e("body").find("#"+n.attr("id")).length>0){var o=n.parent().find(".tp-bannertimer"),r=o.data("opt");i.callingNewSlide(r,n,"to"+(a-1))}})},revcallslidewithid:function(a){return this.each(function(){var n=e(this);if(n!=t&&n.length>0&&e("body").find("#"+n.attr("id")).length>0){var o=n.parent().find(".tp-bannertimer"),r=o.data("opt");i.callingNewSlide(r,n,a)}})}});var i=e.fn.revolution;e.extend(!0,i,{simp:function(e,t,i){var a=Math.abs(e)-Math.floor(Math.abs(e/t))*t;return i?a:0>e?-1*a:a},iOSVersion:function(){var e=!1;return navigator.userAgent.match(/iPhone/i)||navigator.userAgent.match(/iPod/i)||navigator.userAgent.match(/iPad/i)?navigator.userAgent.match(/OS 4_\d like Mac OS X/i)&&(e=!0):e=!1,e},isIE:function(t,i){var a=e('<div style="display:none;"/>').appendTo(e("body"));a.html("<!--[if "+(i||"")+" IE "+(t||"")+"]><a>&nbsp;</a><![endif]-->");var n=a.find("a").length;return a.remove(),n},is_mobile:function(){var e=["android","webos","iphone","ipad","blackberry","Android","webos",,"iPod","iPhone","iPad","Blackberry","BlackBerry"],t=!1;for(var i in e)navigator.userAgent.split(e[i]).length>1&&(t=!0);return t},callBackHandling:function(t,i,a){try{t.callBackArray&&e.each(t.callBackArray,function(e,t){t&&t.inmodule&&t.inmodule===i&&t.atposition&&t.atposition===a&&t.callback&&t.callback.call()})}catch(n){console.log("Call Back Failed")}},get_browser:function(){var e,t=navigator.appName,i=navigator.userAgent,a=i.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);return a&&null!=(e=i.match(/version\/([\.\d]+)/i))&&(a[2]=e[1]),a=a?[a[1],a[2]]:[t,navigator.appVersion,"-?"],a[0]},get_browser_version:function(){var e,t=navigator.appName,i=navigator.userAgent,a=i.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);return a&&null!=(e=i.match(/version\/([\.\d]+)/i))&&(a[2]=e[1]),a=a?[a[1],a[2]]:[t,navigator.appVersion,"-?"],a[1]},getHorizontalOffset:function(e,t){var i=p(e,".outer-left"),a=p(e,".outer-right");switch(t){case"left":return i;case"right":return a;case"both":return i+a}},callingNewSlide:function(t,i,a){var n=i.find(".next-revslide").length>0?i.find(".next-revslide").index():i.find(".processing-revslide").length>0?i.find(".processing-revslide").index():i.find(".active-revslide").index(),o=0;i.find(".next-revslide").removeClass("next-revslide"),a&&e.isNumeric(a)||a.match(/to/g)?(1===a||-1===a?(o=n+a,o=0>o?t.slideamount-1:o>=t.slideamount?0:o):(a=e.isNumeric(a)?a:parseInt(a.split("to")[1],0),o=0>a?0:a>t.slideamount-1?t.slideamount-1:a),i.find(".tp-revslider-slidesli:eq("+o+")").addClass("next-revslide")):a&&i.find(".tp-revslider-slidesli").each(function(){var t=e(this);t.data("index")===a&&t.addClass("next-revslide")}),o=i.find(".next-revslide").index(),i.trigger("revolution.nextslide.waiting"),o!==n&&-1!=o?H(i,t):i.find(".next-revslide").removeClass("next-revslide")},slotSize:function(i,a){a.slotw=Math.ceil(a.width/a.slots),"fullscreen"==a.sliderLayout?a.sloth=Math.ceil(e(window).height()/a.slots):a.sloth=Math.ceil(a.height/a.slots),"on"==a.autoHeight&&i!==t&&""!==i&&(a.sloth=Math.ceil(i.height()/a.slots))},setSize:function(i){var a=(i.top_outer||0)+(i.bottom_outer||0),n=parseInt(i.carousel.padding_top||0,0),o=parseInt(i.carousel.padding_bottom||0,0),r=i.gridheight[i.curWinRange];if(r=r<i.minHeight?i.minHeight:r,"fullwidth"==i.sliderLayout&&"off"==i.autoHeight&&punchgs.TweenLite.set(i.c,{maxHeight:r+"px"}),i.c.css({marginTop:n,marginBottom:o}),i.width=i.ul.width(),i.height=i.ul.height(),y(i),i.height=Math.round(i.gridheight[i.curWinRange]*(i.width/i.gridwidth[i.curWinRange])),i.height>i.gridheight[i.curWinRange]&&"on"!=i.autoHeight&&(i.height=i.gridheight[i.curWinRange]),"fullscreen"==i.sliderLayout||i.infullscreenmode){i.height=i.bw*i.gridheight[i.curWinRange];var s=(i.c.parent().width(),e(window).height());if(i.fullScreenOffsetContainer!=t){try{var l=i.fullScreenOffsetContainer.split(",");l&&e.each(l,function(t,i){s=e(i).length>0?s-e(i).outerHeight(!0):s})}catch(d){}try{i.fullScreenOffset.split("%").length>1&&i.fullScreenOffset!=t&&i.fullScreenOffset.length>0?s-=e(window).height()*parseInt(i.fullScreenOffset,0)/100:i.fullScreenOffset!=t&&i.fullScreenOffset.length>0&&(s-=parseInt(i.fullScreenOffset,0))}catch(d){}}s=s<i.minHeight?i.minHeight:s,s-=a,i.c.parent().height(s),i.c.closest(".rev_slider_wrapper").height(s),i.c.css({height:"100%"}),i.height=s,i.minHeight!=t&&i.height<i.minHeight&&(i.height=i.minHeight)}else i.minHeight!=t&&i.height<i.minHeight&&(i.height=i.minHeight),i.c.height(i.height);var c={height:n+o+a+i.height};i.c.closest(".forcefullwidth_wrapper_tp_banner").find(".tp-fullwidth-forcer").css(c),i.c.closest(".rev_slider_wrapper").css(c),y(i)},enterInViewPort:function(a){a.waitForCountDown&&(M(a.c,a),a.waitForCountDown=!1),a.waitForFirstSlide&&(H(a.c,a),a.waitForFirstSlide=!1),("playing"==a.sliderlaststatus||a.sliderlaststatus==t)&&a.c.trigger("starttimer"),a.lastplayedvideos!=t&&a.lastplayedvideos.length>0&&e.each(a.lastplayedvideos,function(e,t){i.playVideo(t,a)})},leaveViewPort:function(a){a.sliderlaststatus=a.sliderstatus,a.c.trigger("stoptimer"),a.playingvideos!=t&&a.playingvideos.length>0&&(a.lastplayedvideos=e.extend(!0,[],a.playingvideos),a.playingvideos&&e.each(a.playingvideos,function(e,t){i.stopVideo&&i.stopVideo(t,a)}))},unToggleState:function(i){i!=t&&i.length>0&&e.each(i,function(e,t){t.removeClass("rs-toggle-content-active")})},toggleState:function(i){i!=t&&i.length>0&&e.each(i,function(e,t){t.addClass("rs-toggle-content-active")})},lastToggleState:function(i){var a=0;return i!=t&&i.length>0&&e.each(i,function(e,t){a=t.hasClass("rs-toggle-content-active")}),a}});var a=i.is_mobile(),n=function(t,i){var a=[];return e.each(t,function(e,t){e!=i&&a.push(t)}),a},o=function(t,i,a){a.c.find(t).each(function(){var t=e(this);t.data("liref")===i&&t.remove()})},r=function(i,a){return e("body").data(i)?!1:a.filesystem?(a.errorm===t&&(a.errorm="<br>Local Filesystem Detected !<br>Put this to your header:"),console.warn("Local Filesystem detected !"),a.errorm=a.errorm+'<br>&lt;script type="text/javascript" src="'+a.jsFileLocation+i+a.extensions_suffix+'"&gt;&lt;/script&gt;',console.warn(a.jsFileLocation+i+a.extensions_suffix+" could not be loaded !"),console.warn("Please use a local Server or work online or make sure that you load all needed Libraries manually in your Document."),console.log(" "),a.modulesfailing=!0,!1):(e.ajax({url:a.jsFileLocation+i+a.extensions_suffix,dataType:"script",cache:!0,error:function(e){console.warn("Slider Revolution 5.0 Error !"),console.error("Failure at Loading:"+i+a.extensions_suffix+" on Path:"+a.jsFileLocation),console.info(e)}}),void e("body").data(i,!0))},s=function(a,n){var o=new Object,s=a.navigation;return o.kenburns=!1,o.parallax=!1,o.carousel=!1,o.navigation=!1,o.videos=!1,o.actions=!1,o.layeranim=!1,o.migration=!1,n.data("version")&&n.data("version").toString().match(/5./gi)?(n.find("img").each(function(){"on"==e(this).data("kenburns")&&(o.kenburns=!0)}),("carousel"==a.sliderType||"on"==s.keyboardNavigation||"on"==s.mouseScrollNavigation||"on"==s.touch.touchenabled||s.arrows.enable||s.bullets.enable||s.thumbnails.enable||s.tabs.enable)&&(o.navigation=!0),n.find(".tp-caption, .tp-static-layer, .rs-background-video-layer").each(function(){var i=e(this);(i.data("ytid")!=t||i.find("iframe").length>0&&i.find("iframe").attr("src").toLowerCase().indexOf("youtube")>0)&&(o.videos=!0),(i.data("vimeoid")!=t||i.find("iframe").length>0&&i.find("iframe").attr("src").toLowerCase().indexOf("vimeo")>0)&&(o.videos=!0),i.data("actions")!==t&&(o.actions=!0),o.layeranim=!0}),n.find("li").each(function(){e(this).data("link")&&e(this).data("link")!=t&&(o.layeranim=!0,o.actions=!0)}),!o.videos&&(n.find(".rs-background-video-layer").length>0||n.find(".tp-videolayer").length>0||n.find("iframe").length>0||n.find("video").length>0)&&(o.videos=!0),"carousel"==a.sliderType&&(o.carousel=!0),("off"!==a.parallax.type||a.viewPort.enable||"true"==a.viewPort.enable)&&(o.parallax=!0)):(o.kenburns=!0,o.parallax=!0,o.carousel=!1,o.navigation=!0,o.videos=!0,o.actions=!0,o.layeranim=!0,o.migration=!0),"hero"==a.sliderType&&(o.carousel=!1,o.navigation=!1),window.location.href.match(/file:/gi)&&(o.filesystem=!0,a.filesystem=!0),o.videos&&"undefined"==typeof i.isVideoPlaying&&r("revolution.extension.video",a),o.carousel&&"undefined"==typeof i.prepareCarousel&&r("revolution.extension.carousel",a),o.carousel||"undefined"!=typeof i.animateSlide||r("revolution.extension.slideanims",a),o.actions&&"undefined"==typeof i.checkActions&&r("revolution.extension.actions",a),o.layeranim&&"undefined"==typeof i.handleStaticLayers&&r("revolution.extension.layeranimation",a),o.kenburns&&"undefined"==typeof i.stopKenBurn&&r("revolution.extension.kenburn",a),o.navigation&&"undefined"==typeof i.createNavigation&&r("revolution.extension.navigation",a),o.migration&&"undefined"==typeof i.migration&&r("revolution.extension.migration",a),o.parallax&&"undefined"==typeof i.checkForParallax&&r("revolution.extension.parallax",a),o},l=function(e,t){t.filesystem||"undefined"!=typeof punchgs&&(!t.kenburns||t.kenburns&&"undefined"!=typeof i.stopKenBurn)&&(!t.navigation||t.navigation&&"undefined"!=typeof i.createNavigation)&&(!t.carousel||t.carousel&&"undefined"!=typeof i.prepareCarousel)&&(!t.videos||t.videos&&"undefined"!=typeof i.resetVideo)&&(!t.actions||t.actions&&"undefined"!=typeof i.checkActions)&&(!t.layeranim||t.layeranim&&"undefined"!=typeof i.handleStaticLayers)&&(!t.migration||t.migration&&"undefined"!=typeof i.migration)&&(!t.parallax||t.parallax&&"undefined"!=typeof i.checkForParallax)&&(t.carousel||!t.carousel&&"undefined"!=typeof i.animateSlide)?e.trigger("scriptsloaded"):setTimeout(function(){l(e,t)},50)},d=function(t){var i=new RegExp("themepunch.revolution.min.js","gi"),a="";return e("script").each(function(){var t=e(this).attr("src");t&&t.match(i)&&(a=t)}),a=a.replace("jquery.themepunch.revolution.min.js",""),a=a.replace("jquery.themepunch.revolution.js",""),a=a.split("?")[0]},c=function(t,i){var a=9999,n=0,o=0,r=0,s=e(window).width(),l=i&&9999==t.responsiveLevels?t.visibilityLevels:t.responsiveLevels;l&&l.length&&e.each(l,function(e,t){t>s&&(0==n||n>t)&&(a=t,r=e,n=t),s>t&&t>n&&(n=t,o=e)}),a>n&&(r=o),i?t.forcedWinRange=r:t.curWinRange=r},u=function(e,t){t.carousel.maxVisibleItems=t.carousel.maxVisibleItems<1?999:t.carousel.maxVisibleItems,t.carousel.vertical_align="top"===t.carousel.vertical_align?"0%":"bottom"===t.carousel.vertical_align?"100%":"50%"},p=function(t,i){var a=0;return t.find(i).each(function(){var t=e(this);!t.hasClass("tp-forcenotvisible")&&a<t.outerWidth()&&(a=t.outerWidth())}),a},h=function(n,o){if(n==t)return!1;if(n.data("aimg")!=t&&("enabled"==n.data("aie8")&&i.isIE(8)||"enabled"==n.data("amobile")&&a)&&n.html('<img class="tp-slider-alternative-image" src="'+n.data("aimg")+'">'),n.find(">ul").addClass("tp-revslider-mainul"),o.c=n,o.ul=n.find(".tp-revslider-mainul"),o.ul.find(">li").each(function(t){var i=e(this);"on"==i.data("hideslideonmobile")&&a&&i.remove()}),o.cid=n.attr("id"),o.ul.css({visibility:"visible"}),o.slideamount=o.ul.find(">li").length,o.slayers=n.find(".tp-static-layers"),o.ul.find(">li").each(function(t){e(this).data("originalindex",t)}),"on"==o.shuffle){var r=new Object,s=o.ul.find(">li:first-child");r.fstransition=s.data("fstransition"),r.fsmasterspeed=s.data("fsmasterspeed"),r.fsslotamount=s.data("fsslotamount");for(var l=0;l<o.slideamount;l++){var d=Math.round(Math.random()*o.slideamount);o.ul.find(">li:eq("+d+")").prependTo(o.ul)}var u=o.ul.find(">li:first-child");u.data("fstransition",r.fstransition),u.data("fsmasterspeed",r.fsmasterspeed),u.data("fsslotamount",r.fsslotamount),o.li=o.ul.find(">li")}if(o.li=o.ul.find(">li"),o.thumbs=new Array,o.slots=4,o.act=-1,o.firststart=1,o.loadqueue=new Array,o.syncload=0,o.conw=n.width(),o.conh=n.height(),o.responsiveLevels.length>1?o.responsiveLevels[0]=9999:o.responsiveLevels=9999,e.each(o.li,function(i,a){var a=e(a),n=a.find(".rev-slidebg")||a.find("img").first(),r=0;a.addClass("tp-revslider-slidesli"),a.data("index")===t&&a.data("index","rs-"+Math.round(999999*Math.random()));var s=new Object;s.params=new Array,s.id=a.data("index"),s.src=a.data("thumb")!==t?a.data("thumb"):n.data("lazyload")!==t?n.data("lazyload"):n.attr("src"),a.data("title")!==t&&s.params.push({from:RegExp("\\{\\{title\\}\\}","g"),to:a.data("title")}),a.data("description")!==t&&s.params.push({from:RegExp("\\{\\{description\\}\\}","g"),to:a.data("description")});for(var r=1;10>=r;r++)a.data("param"+r)!==t&&s.params.push({from:RegExp("\\{\\{param"+r+"\\}\\}","g"),to:a.data("param"+r)});if(o.thumbs.push(s),a.data("origindex",a.index()),a.data("link")!=t){var l=a.data("link"),d=a.data("target")||"_self",c="back"===a.data("slideindex")?0:60,u=a.data("linktoslide"),p=u;u!=t&&"next"!=u&&"prev"!=u&&o.li.each(function(){var t=e(this);t.data("origindex")+1==p&&(u=t.data("index"))}),"slide"!=l&&(u="no");var h='<div class="tp-caption sft slidelink" style="cursor:pointer;width:100%;height:100%;z-index:'+c+';" data-x="center" data-y="center" ',f="scroll_under"===u?'[{"event":"click","action":"scrollbelow","offset":"100px","delay":"0"}]':"prev"===u?'[{"event":"click","action":"jumptoslide","slide":"prev","delay":"0.2"}]':"next"===u?'[{"event":"click","action":"jumptoslide","slide":"next","delay":"0.2"}]':'[{"event":"click","action":"jumptoslide","slide":"'+u+'","delay":"0.2"}]';h="no"==u?h+' data-start="0">':h+"data-actions='"+f+'\' data-start="0">',h+='<a style="width:100%;height:100%;display:block"',h="slide"!=l?h+' target="'+d+'" href="'+l+'"':h,h+='><span style="width:100%;height:100%;display:block"></span></a></div>',a.append(h)}}),o.rle=o.responsiveLevels.length||1,o.gridwidth=f(o.gridwidth,o.rle),o.gridheight=f(o.gridheight,o.rle),"on"==o.simplifyAll&&(i.isIE(8)||i.iOSVersion())&&(n.find(".tp-caption").each(function(){var t=e(this);t.removeClass("customin customout").addClass("fadein fadeout"),t.data("splitin",""),t.data("speed",400)}),o.li.each(function(){var t=e(this);t.data("transition","fade"),t.data("masterspeed",500),t.data("slotamount",1);var i=t.find(".rev-slidebg")||t.find(">img").first();i.data("kenburns","off")})),o.desktop=!navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|BB10|mobi|tablet|opera mini|nexus 7)/i),o.autoHeight="fullscreen"==o.sliderLayout?"on":o.autoHeight,"fullwidth"==o.sliderLayout&&"off"==o.autoHeight&&n.css({maxHeight:o.gridheight[o.curWinRange]+"px"}),"auto"!=o.sliderLayout&&0==n.closest(".forcefullwidth_wrapper_tp_banner").length&&("fullscreen"!==o.sliderLayout||"on"!=o.fullScreenAutoWidth)){var p=n.parent(),h=p.css("marginBottom"),y=p.css("marginTop");h=h===t?0:h,y=y===t?0:y,p.wrap('<div class="forcefullwidth_wrapper_tp_banner" style="position:relative;width:100%;height:auto;margin-top:'+y+";margin-bottom:"+h+'"></div>'),n.closest(".forcefullwidth_wrapper_tp_banner").append('<div class="tp-fullwidth-forcer" style="width:100%;height:'+n.height()+'px"></div>'),n.parent().css({marginTop:"0px",marginBottom:"0px"}),n.parent().css({position:"absolute"})}if(o.shadow!==t&&o.shadow>0&&(n.parent().addClass("tp-shadow"+o.shadow),n.parent().append('<div class="tp-shadowcover"></div>'),n.parent().find(".tp-shadowcover").css({backgroundColor:n.parent().css("backgroundColor"),backgroundImage:n.parent().css("backgroundImage")})),c(o),c(o,!0),!n.hasClass("revslider-initialised")){n.addClass("revslider-initialised"),n.addClass("tp-simpleresponsive"),n.attr("id")==t&&n.attr("id","revslider-"+Math.round(1e3*Math.random()+5)),o.firefox13=!1,o.ie=!e.support.opacity,o.ie9=9==document.documentMode,o.origcd=o.delay;var x=e.fn.jquery.split("."),_=parseFloat(x[0]),k=parseFloat(x[1]);parseFloat(x[2]||"0");1==_&&7>k&&n.html('<div style="text-align:center; padding:40px 0px; font-size:20px; color:#992222;"> The Current Version of jQuery:'+x+" <br>Please update your jQuery Version to min. 1.7 in Case you wish to use the Revolution Slider Plugin</div>"),_>1&&(o.ie=!1);var T=new Object;T.addedyt=0,T.addedvim=0,T.addedvid=0,n.find(".tp-caption, .rs-background-video-layer").each(function(n){var r=e(this),s=r.data("autoplayonlyfirsttime"),l=r.data("autoplay");r.hasClass("tp-static-layer")&&i.handleStaticLayers&&i.handleStaticLayers(r,o);var d=r.data("noposteronmobile")||r.data("noPosterOnMobile")||r.data("posteronmobile")||r.data("posterOnMobile")||r.data("posterOnMObile");r.data("noposteronmobile",d);var c=0;if(r.find("iframe").each(function(){punchgs.TweenLite.set(e(this),{autoAlpha:0}),c++}),c>0&&r.data("iframes",!0),r.hasClass("tp-caption")){var u=r.hasClass("slidelink")?"width:100% !important;height:100% !important;":"";r.wrap('<div class="tp-parallax-wrap" style="'+u+'position:absolute;visibility:hidden"><div class="tp-loop-wrap" style="'+u+'position:absolute;"><div class="tp-mask-wrap" style="'+u+'position:absolute" ></div></div></div>');var p=["pendulum","rotate","slideloop","pulse","wave"],h=r.closest(".tp-loop-wrap");e.each(p,function(e,t){var i=r.find(".rs-"+t),a=i.data()||"";""!=a&&(h.data(a),h.addClass("rs-"+t),i.children(0).unwrap(),r.data("loopanimation","on"))}),punchgs.TweenLite.set(r,{visibility:"hidden"})}var f=r.data("actions");f!==t&&i.checkActions(r,o,f),g(r,o),i.checkVideoApis&&(T=i.checkVideoApis(r,o,T)),a&&((1==s||"true"==s)&&(r.data("autoplayonlyfirsttime","false"),s=!1),(1==l||"true"==l||"on"==l||"1sttime"==l)&&(r.data("autoplay","off"),l="off")),(1==s||"true"==s||"1sttime"==l)&&r.closest("li.tp-revslider-slidesli").addClass("rs-pause-timer-once"),(1==l||"true"==l||"on"==l||"no1sttime"==l)&&r.closest("li.tp-revslider-slidesli").addClass("rs-pause-timer-always")}),n.hover(function(){n.trigger("tp-mouseenter"),o.overcontainer=!0},function(){n.trigger("tp-mouseleft"),o.overcontainer=!1}),n.on("mouseover",function(){n.trigger("tp-mouseover"),o.overcontainer=!0}),n.find(".tp-caption video").each(function(t){var i=e(this);i.removeClass("video-js vjs-default-skin"),i.attr("preload",""),i.css({display:"none"})}),"standard"!==o.sliderType&&(o.lazyType="all"),S(n.find(".tp-static-layers"),o,0),z(n.find(".tp-static-layers img"),o,function(){n.find(".tp-static-layers img").each(function(){var i=e(this),a=i.data("lazyload")!=t?i.data("lazyload"):i.attr("src"),n=A(o,a);i.attr("src",n.src)})}),o.li.each(function(t){var i=e(this);("all"==o.lazyType||"smart"==o.lazyType&&(0==t||1==t||t==o.slideamount||t==o.slideamount-1))&&(S(i,o,t),z(i,o,function(){"carousel"==o.sliderType&&punchgs.TweenLite.to(i,1,{autoAlpha:1,ease:punchgs.Power3.easeInOut})}))});var C=R("#")[0];if(C.length<9&&C.split("slide").length>1){var L=parseInt(C.split("slide")[1],0);1>L&&(L=1),L>o.slideamount&&(L=o.slideamount),o.startWithSlide=L-1}n.append('<div class="tp-loader '+o.spinner+'"><div class="dot1"></div><div class="dot2"></div><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>'),0===n.find(".tp-bannertimer").length&&n.append('<div class="tp-bannertimer" style="visibility:hidden"></div>'),n.find(".tp-bannertimer").css({width:"0%"}),n.find(".tp-bannertimer").data("opt",o),o.ul.css({display:"block"}),w(n,o),"off"!==o.parallax.type&&i.checkForParallax(n,o),i.setSize(o),"hero"!==o.sliderType&&i.createNavigation(n,o),i.resizeThumbsTabs&&i.resizeThumbsTabs(o),v(o);var O=o.viewPort;o.inviewport=!1,O!=t&&O.enable&&(e.isNumeric(O.visible_area)||-1!==O.visible_area.indexOf("%")&&(O.visible_area=parseInt(O.visible_area)/100),i.scrollTicker&&i.scrollTicker(o,n)),setTimeout(function(){"carousel"==o.sliderType&&i.prepareCarousel(o),!O.enable||O.enable&&o.inviewport||O.enable&&!o.inviewport&&"wait"==!O.outof?H(n,o):o.waitForFirstSlide=!0,i.manageNavigation&&i.manageNavigation(o),o.slideamount>1&&(!O.enable||O.enable&&o.inviewport?M(n,o):o.waitForCountDown=!0),setTimeout(function(){n.trigger("revolution.slide.onloaded")},100)},o.startDelay),o.startDelay=0,e("body").data("rs-fullScreenMode",!1),e(window).on("mozfullscreenchange webkitfullscreenchange fullscreenchange",function(){e("body").data("rs-fullScreenMode",!e("body").data("rs-fullScreenMode")),e("body").data("rs-fullScreenMode")&&setTimeout(function(){e(window).trigger("resize")},200)});var I="resize.revslider-"+n.attr("id");e(window).on(I,function(){return n==t?!1:(0!=e("body").find(n)&&v(o),void((n.outerWidth(!0)!=o.width||n.is(":hidden")||"fullscreen"==o.sliderLayout&&e(window).height()!=o.lastwindowheight)&&(o.lastwindowheight=e(window).height(),b(n,o))))}),m(n,o),v(o),o.fallbacks.disableFocusListener||"true"==o.fallbacks.disableFocusListener||o.fallbacks.disableFocusListener===!0||N(n,o)}},f=function(t,i){if(!e.isArray(t)){var a=t;t=new Array,t.push(a)}if(t.length<i)for(var a=t[t.length-1],n=0;n<i-t.length+2;n++)t.push(a);return t},g=function(a,n){"sliderenter"===a.data("start")&&(n.layersonhover===t&&(n.c.on("tp-mouseenter",function(){n.layersonhover&&e.each(n.layersonhover,function(e,a){a.data("animdirection","in");var o=a.data("timeline_out"),r="carousel"===n.sliderType?0:n.width/2-n.gridwidth[n.curWinRange]*n.bw/2,s=0,l=a.closest(".tp-revslider-slidesli");if(l.hasClass("active-revslide")||l.hasClass("processing-revslide")){o!=t&&(o.pause(0),o.kill()),i.animateSingleCaption(a,n,r,s,0,!1,!0);var d=a.data("timeline");a.data("triggerstate","on"),d.play(0)}})}),n.c.on("tp-mouseleft",function(){n.layersonhover&&e.each(n.layersonhover,function(e,t){t.data("animdirection","out"),t.data("triggered",!0),t.data("triggerstate","off"),i.stopVideo&&i.stopVideo(t,n),i.endMoveCaption&&i.endMoveCaption(t,null,null,n)})}),n.layersonhover=new Array),n.layersonhover.push(a))},v=function(t){var a=i.getHorizontalOffset(t.c,"left");if("auto"==t.sliderLayout||"fullscreen"===t.sliderLayout&&"on"==t.fullScreenAutoWidth)"fullscreen"==t.sliderLayout&&"on"==t.fullScreenAutoWidth?punchgs.TweenLite.set(t.ul,{left:0,width:t.c.width()}):punchgs.TweenLite.set(t.ul,{left:a,width:t.c.width()-i.getHorizontalOffset(t.c,"both")});else{var n=Math.ceil(t.c.closest(".forcefullwidth_wrapper_tp_banner").offset().left-a);punchgs.TweenLite.set(t.c.parent(),{left:0-n+"px",width:e(window).width()-i.getHorizontalOffset(t.c,"both")})}t.slayers&&"fullwidth"!=t.sliderLayout&&"fullscreen"!=t.sliderLayout&&punchgs.TweenLite.set(t.slayers,{left:a})},m=function(a,n,o){var r=a.parent();e(window).width()<n.hideSliderAtLimit?(a.trigger("stoptimer"),"none"!=r.css("display")&&r.data("olddisplay",r.css("display")),r.css({display:"none"})):a.is(":hidden")&&o&&(r.data("olddisplay")!=t&&"undefined"!=r.data("olddisplay")&&"none"!=r.data("olddisplay")?r.css({display:r.data("olddisplay")}):r.css({display:"block"}),a.trigger("restarttimer"),setTimeout(function(){b(a,n)},150)),i.hideUnHideNav&&i.hideUnHideNav(n)},b=function(a,n){if(1==n.infullscreenmode&&(n.minHeight=e(window).height()),c(n),c(n,!0),!i.resizeThumbsTabs||i.resizeThumbsTabs(n)===!0){if(m(a,n,!0),v(n),"carousel"==n.sliderType&&i.prepareCarousel(n,!0),a===t)return!1;i.setSize(n),n.conw=n.c.width(),n.conh=n.infullscreenmode?n.minHeight:n.c.height();var o=a.find(".active-revslide .slotholder"),r=a.find(".processing-revslide .slotholder");x(a,n,a,2),"standard"===n.sliderType&&(punchgs.TweenLite.set(r.find(".defaultimg"),{opacity:0}),o.find(".defaultimg").css({opacity:1})),"carousel"==n.sliderType&&n.lastconw!=n.conw&&(clearTimeout(n.pcartimer),n.pcartimer=setTimeout(function(){i.prepareCarousel(n,!0)},100),n.lastconw=n.conw),i.manageNavigation&&i.manageNavigation(n),i.animateTheCaptions&&i.animateTheCaptions(a.find(".active-revslide"),n,!0),"on"==r.data("kenburns")&&i.startKenBurn(r,n,r.data("kbtl").progress()),"on"==o.data("kenburns")&&i.startKenBurn(o,n,o.data("kbtl").progress()),i.animateTheCaptions&&i.animateTheCaptions(r.closest("li"),n,!0),
i.manageNavigation&&i.manageNavigation(n)}},y=function(e){e.bw=e.width/e.gridwidth[e.curWinRange],e.bh=e.height/e.gridheight[e.curWinRange],e.bh>e.bw?e.bh=e.bw:e.bw=e.bh,(e.bh>1||e.bw>1)&&(e.bw=1,e.bh=1)},w=function(n,o){if(n.find(".tp-caption").each(function(){var i=e(this);i.data("transition")!==t&&i.addClass(i.data("transition"))}),o.ul.css({overflow:"hidden",width:"100%",height:"100%",maxHeight:n.parent().css("maxHeight")}),"on"==o.autoHeight&&(o.ul.css({overflow:"hidden",width:"100%",height:"100%",maxHeight:"none"}),n.css({maxHeight:"none"}),n.parent().css({maxHeight:"none"})),o.li.each(function(i){var a=e(this),n=a.data("originalindex");(o.startWithSlide!=t&&n==o.startWithSlide||o.startWithSlide===t&&0==i)&&a.addClass("next-revslide"),a.css({width:"100%",height:"100%",overflow:"hidden"})}),"carousel"===o.sliderType){o.ul.css({overflow:"visible"}).wrap('<div class="tp-carousel-wrapper" style="width:100%;height:100%;position:absolute;top:0px;left:0px;overflow:hidden;"></div>');var r='<div style="clear:both;display:block;width:100%;height:1px;position:relative;margin-bottom:-1px"></div>';o.c.parent().prepend(r),o.c.parent().append(r),i.prepareCarousel(o)}n.parent().css({overflow:"visible"}),o.li.find(">img").each(function(i){var n=e(this),r=n.closest("li").find(".rs-background-video-layer");r.addClass("defaultvid").css({zIndex:30}),n.addClass("defaultimg"),"on"==o.fallbacks.panZoomDisableOnMobile&&a&&(n.data("kenburns","off"),n.data("bgfit","cover")),n.wrap('<div class="slotholder" style="width:100%;height:100%;"></div>'),r.appendTo(n.closest("li").find(".slotholder"));var s=n.data();n.closest(".slotholder").data(s),r.length>0&&s.bgparallax!=t&&r.data("bgparallax",s.bgparallax),"none"!=o.dottedOverlay&&o.dottedOverlay!=t&&n.closest(".slotholder").append('<div class="tp-dottedoverlay '+o.dottedOverlay+'"></div>');var l=n.attr("src");s.src=l,s.bgfit=s.bgfit||"cover",s.bgrepeat=s.bgrepeat||"no-repeat",s.bgposition=s.bgposition||"center center";var d=n.closest(".slotholder");n.parent().append('<div class="tp-bgimg defaultimg" style="background-color:'+n.css("backgroundColor")+";background-repeat:"+s.bgrepeat+";background-image:url("+l+");background-size:"+s.bgfit+";background-position:"+s.bgposition+';width:100%;height:100%;"></div>');var c=document.createComment("Runtime Modification - Img tag is Still Available for SEO Goals in Source - "+n.get(0).outerHTML);n.replaceWith(c),n=d.find(".tp-bgimg"),n.data(s),n.attr("src",l),("standard"===o.sliderType||"undefined"===o.sliderType)&&n.css({opacity:0})})},x=function(t,i,a,n){i.removePrepare=i.removePrepare+n,a.find(".slot, .slot-circle-wrapper").each(function(){e(this).remove()}),i.transition=0,i.removePrepare=0},_=function(e){var i=e;return e!=t&&e.length>0&&(i=e.split("?")[0]),i},k=function(e,t){var i=e.split("/"),a=t.split("/");i.pop();for(var n=0;n<a.length;n++)"."!=a[n]&&(".."==a[n]?i.pop():i.push(a[n]));return i.join("/")},T=function(t,i,a){i.syncload--,i.loadqueue&&e.each(i.loadqueue,function(e,i){var n=i.src.replace(/\.\.\/\.\.\//gi,""),o=self.location.href,r=document.location.origin,s=o.substring(0,o.length-1)+"/"+n,l=r+"/"+n,d=k(self.location.href,i.src);o=o.substring(0,o.length-1)+n,r+=n,(_(r)===_(decodeURIComponent(t.src))||_(o)===_(decodeURIComponent(t.src))||_(d)===_(decodeURIComponent(t.src))||_(l)===_(decodeURIComponent(t.src))||_(s)===_(decodeURIComponent(t.src))||_(i.src)===_(decodeURIComponent(t.src))||_(i.src).replace(/^.*\/\/[^\/]+/,"")===_(decodeURIComponent(t.src)).replace(/^.*\/\/[^\/]+/,"")||"file://"===window.location.origin&&_(t.src).match(new RegExp(n)))&&(i.progress=a,i.width=t.width,i.height=t.height)}),C(i)},C=function(t){3!=t.syncload&&t.loadqueue&&e.each(t.loadqueue,function(e,i){if(i.progress.match(/prepared/g)&&t.syncload<=3){t.syncload++;var a=new Image;a.onload=function(){T(this,t,"loaded")},a.onerror=function(){T(this,t,"failed")},a.src=i.src,i.progress="inload"}})},L=function(t,i,a){var n=!1;if(i.loadqueue&&e.each(i.loadqueue,function(e,i){i.src===t&&(n=!0)}),!n){var o=new Object;o.src=t,o.prio=a,o.progress="prepared",i.loadqueue.push(o)}},S=function(i,a,n){i.find("img,.defaultimg").each(function(){var i=e(this),o=i.data("lazyload")!==t&&"undefined"!==i.data("lazyload")?i.data("lazyload"):i.attr("src");i.data("start-to-load",e.now()),L(o,a,n)}),C(a)},A=function(t,i){var a=new Object;return t.loadqueue&&e.each(t.loadqueue,function(e,t){t.src==i&&(a=t)}),a},z=function(a,n,o){var r=!1;a.find("img,.defaultimg").each(function(){var o=e(this),s=o.data("lazyload")!=t?o.data("lazyload"):o.attr("src"),l=A(n,s);if(o.data("loaded")===t&&l!==t&&l.progress&&l.progress.match(/loaded/g)){if(o.attr("src",l.src),o.hasClass("defaultimg"))i.isIE(8)?defimg.attr("src",l.src):o.css({backgroundImage:'url("'+l.src+'")'}),a.data("owidth",l.width),a.data("oheight",l.height),a.find(".slotholder").data("owidth",l.width),a.find(".slotholder").data("oheight",l.height);else{var d=o.data("ww"),c=o.data("hh");o.data("owidth",l.width),o.data("oheight",l.height),d=d==t||"auto"==d||""==d?l.width:d,c=c==t||"auto"==c||""==c?l.height:c,o.data("ww",d),o.data("hh",c)}o.data("loaded",!0)}if(l&&l.progress&&l.progress.match(/inprogress|inload|prepared/g)&&(e.now()-o.data("start-to-load")<5e3?r=!0:console.error(s+"  Could not be loaded !")),1==n.youtubeapineeded&&(!window.YT||YT.Player==t)&&(r=!0,e.now()-n.youtubestarttime>5e3&&1!=n.youtubewarning)){n.youtubewarning=!0;var u="YouTube Api Could not be loaded !";"https:"===location.protocol&&(u+=" Please Check and Renew SSL Certificate !"),console.error(u),n.c.append('<div style="position:absolute;top:50%;width:100%;color:#e74c3c;  font-size:16px; text-align:center; padding:15px;background:#000; display:block;"><strong>'+u+"</strong></div>")}if(1==n.vimeoapineeded&&!window.Froogaloop&&(r=!0,e.now()-n.vimeostarttime>5e3&&1!=n.vimeowarning)){n.vimeowarning=!0;var u="Vimeo Froogaloop Api Could not be loaded !";"https:"===location.protocol&&(u+=" Please Check and Renew SSL Certificate !"),console.error(u),n.c.append('<div style="position:absolute;top:50%;width:100%;color:#e74c3c;  font-size:16px; text-align:center; padding:15px;background:#000; display:block;"><strong>'+u+"</strong></div>")}}),r?setTimeout(function(){z(a,n,o)},19):o()},H=function(t,a){if(clearTimeout(a.waitWithSwapSlide),t.find(".processing-revslide").length>0)return a.waitWithSwapSlide=setTimeout(function(){H(t,a)},150),!1;var n=t.find(".active-revslide"),o=t.find(".next-revslide"),r=o.find(".defaultimg");return o.index()===n.index()?(o.removeClass("next-revslide"),!1):(o.removeClass("next-revslide").addClass("processing-revslide"),o.data("slide_on_focus_amount",o.data("slide_on_focus_amount")+1||1),"on"==a.stopLoop&&o.index()==a.lastslidetoshow-1&&(t.find(".tp-bannertimer").css({visibility:"hidden"}),t.trigger("revolution.slide.onstop"),a.noloopanymore=1),o.index()===a.slideamount-1&&(a.looptogo=a.looptogo-1,a.looptogo<=0&&(a.stopLoop="on")),a.tonpause=!0,t.trigger("stoptimer"),a.cd=0,"off"===a.spinner?t.find(".tp-loader").css({display:"none"}):t.find(".tp-loader").css({display:"block"}),S(o,a,1),void z(o,a,function(){o.find(".rs-background-video-layer").each(function(){var t=e(this);t.hasClass("HasListener")||(t.data("bgvideo",1),i.manageVideoLayer(t,a)),0==t.find(".rs-fullvideo-cover").length&&t.append('<div class="rs-fullvideo-cover"></div>')}),O(a,r,t)}))},O=function(e,a,n){var o=n.find(".active-revslide"),r=n.find(".processing-revslide"),s=o.find(".slotholder"),l=r.find(".slotholder");e.tonpause=!1,e.cd=0,n.trigger("nulltimer"),n.find(".tp-loader").css({display:"none"}),i.setSize(e),i.slotSize(a,e),i.manageNavigation&&i.manageNavigation(e);var d={};d.nextslide=r,d.currentslide=o,n.trigger("revolution.slide.onbeforeswap",d),e.transition=1,e.videoplaying=!1,r.data("delay")!=t?(e.cd=0,e.delay=r.data("delay")):e.delay=e.origcd;var c=o.index(),u=r.index();e.sdir=c>u?1:0,"arrow"==e.sc_indicator&&(0==c&&u==e.slideamount-1&&(e.sdir=1),c==e.slideamount-1&&0==u&&(e.sdir=0)),e.lsdir=e.lsdir===t?e.sdir:e.lsdir,e.dirc=e.lsdir!=e.sdir,e.lsdir=e.sdir,o.index()!=r.index()&&1!=e.firststart&&i.removeTheCaptions&&i.removeTheCaptions(o,e),r.hasClass("rs-pause-timer-once")||r.hasClass("rs-pause-timer-always")?e.videoplaying=!0:n.trigger("restarttimer"),r.removeClass("rs-pause-timer-once");var p,h;if("carousel"==e.sliderType)h=new punchgs.TimelineLite,i.prepareCarousel(e,h),I(n,e,l,s,r,o,h),e.transition=0,e.firststart=0;else{h=new punchgs.TimelineLite({onComplete:function(){I(n,e,l,s,r,o,h)}}),h.add(punchgs.TweenLite.set(l.find(".defaultimg"),{opacity:0})),h.pause(),1==e.firststart&&(punchgs.TweenLite.set(o,{autoAlpha:0}),e.firststart=0),punchgs.TweenLite.set(o,{zIndex:18}),punchgs.TweenLite.set(r,{autoAlpha:0,zIndex:20}),"prepared"==r.data("differentissplayed")&&(r.data("differentissplayed","done"),r.data("transition",r.data("savedtransition")),r.data("slotamount",r.data("savedslotamount")),r.data("masterspeed",r.data("savedmasterspeed"))),r.data("fstransition")!=t&&"done"!=r.data("differentissplayed")&&(r.data("savedtransition",r.data("transition")),r.data("savedslotamount",r.data("slotamount")),r.data("savedmasterspeed",r.data("masterspeed")),r.data("transition",r.data("fstransition")),r.data("slotamount",r.data("fsslotamount")),r.data("masterspeed",r.data("fsmasterspeed")),r.data("differentissplayed","prepared")),r.data("transition")==t&&r.data("transition","random"),p=0;var f=r.data("transition")!==t?r.data("transition").split(","):"fade",g=r.data("nexttransid")==t?-1:r.data("nexttransid");"on"==r.data("randomtransition")?g=Math.round(Math.random()*f.length):g+=1,g==f.length&&(g=0),r.data("nexttransid",g);var v=f[g];e.ie&&("boxfade"==v&&(v="boxslide"),"slotfade-vertical"==v&&(v="slotzoom-vertical"),"slotfade-horizontal"==v&&(v="slotzoom-horizontal")),i.isIE(8)&&(v=11),h=i.animateSlide(p,v,n,e,r,o,l,s,h),"on"==l.data("kenburns")&&(i.startKenBurn(l,e),h.add(punchgs.TweenLite.set(l,{autoAlpha:0}))),h.pause()}i.scrollHandling&&(i.scrollHandling(e,!0),h.eventCallback("onUpdate",function(){i.scrollHandling(e,!0)})),"off"!=e.parallax.type&&e.parallax.firstgo==t&&i.scrollHandling&&(e.parallax.firstgo=!0,e.lastscrolltop=-999,i.scrollHandling(e,!0),setTimeout(function(){e.lastscrolltop=-999,i.scrollHandling(e,!0)},210),setTimeout(function(){e.lastscrolltop=-999,i.scrollHandling(e,!0)},420)),i.animateTheCaptions?i.animateTheCaptions(r,e,null,h):h!=t&&setTimeout(function(){h.resume()},30),punchgs.TweenLite.to(r,.001,{autoAlpha:1})},I=function(n,o,r,s,l,d,c){"carousel"===o.sliderType||(o.removePrepare=0,punchgs.TweenLite.to(r.find(".defaultimg"),.001,{zIndex:20,autoAlpha:1,onComplete:function(){x(n,o,l,1)}}),l.index()!=d.index()&&punchgs.TweenLite.to(d,.2,{zIndex:18,autoAlpha:0,onComplete:function(){x(n,o,d,1)}})),n.find(".active-revslide").removeClass("active-revslide"),n.find(".processing-revslide").removeClass("processing-revslide").addClass("active-revslide"),o.act=l.index(),("scroll"==o.parallax.type||"scroll+mouse"==o.parallax.type||"mouse+scroll"==o.parallax.type)&&(o.lastscrolltop=-999,i.scrollHandling(o)),c.clear(),s.data("kbtl")!=t&&(s.data("kbtl").reverse(),s.data("kbtl").timeScale(25)),"on"==r.data("kenburns")&&(r.data("kbtl")!=t?(r.data("kbtl").timeScale(1),r.data("kbtl").play()):i.startKenBurn(r,o)),l.find(".rs-background-video-layer").each(function(t){if(a)return!1;var n=e(this);i.resetVideo(n,o),punchgs.TweenLite.fromTo(n,1,{autoAlpha:0},{autoAlpha:1,ease:punchgs.Power3.easeInOut,delay:.2,onComplete:function(){i.animcompleted&&i.animcompleted(n,o)}})}),d.find(".rs-background-video-layer").each(function(t){if(a)return!1;var n=e(this);i.stopVideo&&(i.resetVideo(n,o),i.stopVideo(n,o)),punchgs.TweenLite.to(n,1,{autoAlpha:0,ease:punchgs.Power3.easeInOut,delay:.2})});var u={};u.slideIndex=l.index()+1,u.slideLIIndex=l.index(),u.slide=l,u.currentslide=l,u.prevslide=d,n.trigger("revolution.slide.onchange",u),n.trigger("revolution.slide.onafterswap",u),o.duringslidechange=!1;var p=d.data("slide_on_focus_amount"),h=d.data("hideafterloop");0!=h&&p>=h&&o.c.revremoveslide(d.index())},P=function(t,i){t.children().each(function(){try{e(this).die("click")}catch(t){}try{e(this).die("mouseenter")}catch(t){}try{e(this).die("mouseleave")}catch(t){}try{e(this).unbind("hover")}catch(t){}});try{t.die("click","mouseenter","mouseleave")}catch(a){}clearInterval(i.cdint),t=null},M=function(n,o){o.cd=0,o.loop=0,o.stopAfterLoops!=t&&o.stopAfterLoops>-1?o.looptogo=o.stopAfterLoops:o.looptogo=9999999,o.stopAtSlide!=t&&o.stopAtSlide>-1?o.lastslidetoshow=o.stopAtSlide:o.lastslidetoshow=999,o.stopLoop="off",0==o.looptogo&&(o.stopLoop="on");var r=n.find(".tp-bannertimer");n.on("stoptimer",function(){var t=e(this).find(".tp-bannertimer");t.data("tween").pause(),"on"==o.disableProgressBar&&t.css({visibility:"hidden"}),o.sliderstatus="paused",i.unToggleState(o.slidertoggledby)}),n.on("starttimer",function(){1!=o.conthover&&1!=o.videoplaying&&o.width>o.hideSliderAtLimit&&1!=o.tonpause&&1!=o.overnav&&(1===o.noloopanymore||o.viewPort.enable&&!o.inviewport||(r.css({visibility:"visible"}),r.data("tween").resume(),o.sliderstatus="playing")),"on"==o.disableProgressBar&&r.css({visibility:"hidden"}),i.toggleState(o.slidertoggledby)}),n.on("restarttimer",function(){var t=e(this).find(".tp-bannertimer");return o.mouseoncontainer&&"on"==o.navigation.onHoverStop&&!a?!1:(1===o.noloopanymore||o.viewPort.enable&&!o.inviewport||(t.css({visibility:"visible"}),t.data("tween").kill(),t.data("tween",punchgs.TweenLite.fromTo(t,o.delay/1e3,{width:"0%"},{force3D:"auto",width:"100%",ease:punchgs.Linear.easeNone,onComplete:s,delay:1})),o.sliderstatus="playing"),"on"==o.disableProgressBar&&t.css({visibility:"hidden"}),void i.toggleState(o.slidertoggledby))}),n.on("nulltimer",function(){r.data("tween").pause(0),"on"==o.disableProgressBar&&r.css({visibility:"hidden"}),o.sliderstatus="paused"});var s=function(){0==e("body").find(n).length&&(P(n,o),clearInterval(o.cdint)),n.trigger("revolution.slide.slideatend"),1==n.data("conthover-changed")&&(o.conthover=n.data("conthover"),n.data("conthover-changed",0)),i.callingNewSlide(o,n,1)};r.data("tween",punchgs.TweenLite.fromTo(r,o.delay/1e3,{width:"0%"},{force3D:"auto",width:"100%",ease:punchgs.Linear.easeNone,onComplete:s,delay:1})),r.data("opt",o),o.slideamount>1&&(0!=o.stopAfterLoops||1!=o.stopAtSlide)?n.trigger("starttimer"):(o.noloopanymore=1,n.trigger("nulltimer")),n.on("tp-mouseenter",function(){o.mouseoncontainer=!0,"on"!=o.navigation.onHoverStop||a||(n.trigger("stoptimer"),n.trigger("revolution.slide.onpause"))}),n.on("tp-mouseleft",function(){o.mouseoncontainer=!1,1!=n.data("conthover")&&"on"==o.navigation.onHoverStop&&(1==o.viewPort.enable&&o.inviewport||0==o.viewPort.enable)&&(n.trigger("revolution.slide.onresume"),n.trigger("starttimer"))})},F=(function(){var e,t,i={hidden:"visibilitychange",webkitHidden:"webkitvisibilitychange",mozHidden:"mozvisibilitychange",msHidden:"msvisibilitychange"};for(e in i)if(e in document){t=i[e];break}return function(i){return i&&document.addEventListener(t,i),!document[e]}}(),function(e){return e==t||e.c==t?!1:void(1!=e.windowfocused&&(e.windowfocused=!0,punchgs.TweenLite.delayedCall(.3,function(){"on"==e.fallbacks.nextSlideOnWindowFocus&&e.c.revnext(),e.c.revredraw(),"playing"==e.lastsliderstatus&&e.c.revresume()})))}),j=function(e){e.windowfocused=!1,e.lastsliderstatus=e.sliderstatus,e.c.revpause();var t=e.c.find(".active-revslide .slotholder"),a=e.c.find(".processing-revslide .slotholder");"on"==a.data("kenburns")&&i.stopKenBurn(a,e),"on"==t.data("kenburns")&&i.stopKenBurn(t,e)},N=function(i,a){var n=document.documentMode===t,o=window.chrome;n&&!o?e(window).on("focusin",function(){F(a)}).on("focusout",function(){j(a)}):window.addEventListener?(window.addEventListener("focus",function(e){F(a)},!1),window.addEventListener("blur",function(e){j(a)},!1)):(window.attachEvent("focus",function(e){F(a)}),window.attachEvent("blur",function(e){j(a)}))},R=function(e){for(var t,i=[],a=window.location.href.slice(window.location.href.indexOf(e)+1).split("_"),n=0;n<a.length;n++)a[n]=a[n].replace("%3D","="),t=a[n].split("="),i.push(t[0]),i[t[0]]=t[1];return i}}(jQuery);
/********************************************
 * REVOLUTION 5.0 EXTENSION - ACTIONS
 * @version: 1.1 (25.11.2015)
 * @requires jquery.themepunch.revolution.js
 * @author ThemePunch
*********************************************/
!function($){var _R=jQuery.fn.revolution,_ISM=_R.is_mobile();jQuery.extend(!0,_R,{checkActions:function(e,t,a){checkActions_intern(e,t,a)}});var checkActions_intern=function(e,t,a){a&&jQuery.each(a,function(a,o){o.delay=parseInt(o.delay,0)/1e3,e.addClass("noSwipe"),t.fullscreen_esclistener||("exitfullscreen"==o.action||"togglefullscreen"==o.action)&&(jQuery(document).keyup(function(t){27==t.keyCode&&jQuery("#rs-go-fullscreen").length>0&&e.trigger(o.event)}),t.fullscreen_esclistener=!0);var l="backgroundvideo"==o.layer?jQuery(".rs-background-video-layer"):"firstvideo"==o.layer?jQuery(".tp-revslider-slidesli").find(".tp-videolayer"):jQuery("#"+o.layer);switch(o.action){case"togglevideo":jQuery.each(l,function(t,a){a=jQuery(a);var o=a.data("videotoggledby");void 0==o&&(o=new Array),o.push(e),a.data("videotoggledby",o)});break;case"togglelayer":jQuery.each(l,function(t,a){a=jQuery(a);var o=a.data("layertoggledby");void 0==o&&(o=new Array),o.push(e),a.data("layertoggledby",o)});break;case"toggle_mute_video":jQuery.each(l,function(t,a){a=jQuery(a);var o=a.data("videomutetoggledby");void 0==o&&(o=new Array),o.push(e),a.data("videomutetoggledby",o)});break;case"toggleslider":void 0==t.slidertoggledby&&(t.slidertoggledby=new Array),t.slidertoggledby.push(e);break;case"togglefullscreen":void 0==t.fullscreentoggledby&&(t.fullscreentoggledby=new Array),t.fullscreentoggledby.push(e)}switch(e.on(o.event,function(){var a="backgroundvideo"==o.layer?jQuery(".active-revslide .slotholder .rs-background-video-layer"):"firstvideo"==o.layer?jQuery(".active-revslide .tp-videolayer").first():jQuery("#"+o.layer);if("stoplayer"==o.action||"togglelayer"==o.action||"startlayer"==o.action){if(a.length>0)if("startlayer"==o.action||"togglelayer"==o.action&&"in"!=a.data("animdirection")){a.data("animdirection","in");var l=a.data("timeline_out"),r="carousel"===t.sliderType?0:t.width/2-t.gridwidth[t.curWinRange]*t.bw/2,i=0;void 0!=l&&l.pause(0).kill(),_R.animateSingleCaption&&_R.animateSingleCaption(a,t,r,i,0,!1,!0);var n=a.data("timeline");a.data("triggerstate","on"),_R.toggleState(a.data("layertoggledby")),punchgs.TweenLite.delayedCall(o.delay,function(){n.play(0)},[n])}else("stoplayer"==o.action||"togglelayer"==o.action&&"out"!=a.data("animdirection"))&&(a.data("animdirection","out"),a.data("triggered",!0),a.data("triggerstate","off"),_R.stopVideo&&_R.stopVideo(a,t),_R.endMoveCaption&&punchgs.TweenLite.delayedCall(o.delay,_R.endMoveCaption,[a,null,null,t]),_R.unToggleState(a.data("layertoggledby")))}else!_ISM||"playvideo"!=o.action&&"stopvideo"!=o.action&&"togglevideo"!=o.action&&"mutevideo"!=o.action&&"unmutevideo"!=o.action&&"toggle_mute_video"!=o.action?punchgs.TweenLite.delayedCall(o.delay,function(){actionSwitches(a,t,o,e)},[a,t,o,e]):actionSwitches(a,t,o,e)}),o.action){case"togglelayer":case"startlayer":case"playlayer":case"stoplayer":var l=jQuery("#"+o.layer);"bytrigger"!=l.data("start")&&(l.data("triggerstate","on"),l.data("animdirection","in"))}})},actionSwitches=function(tnc,opt,a,_nc){switch(a.action){case"scrollbelow":_nc.addClass("tp-scrollbelowslider"),_nc.data("scrolloffset",a.offset),_nc.data("scrolldelay",a.delay);var off=getOffContH(opt.fullScreenOffsetContainer)||0,aof=parseInt(a.offset,0)||0;off=off-aof||0,jQuery("body,html").animate({scrollTop:opt.c.offset().top+jQuery(opt.li[0]).height()-off+"px"},{duration:400});break;case"callback":eval(a.callback);break;case"jumptoslide":switch(a.slide.toLowerCase()){case"+1":case"next":opt.sc_indicator="arrow",_R.callingNewSlide(opt,opt.c,1);break;case"previous":case"prev":case"-1":opt.sc_indicator="arrow",_R.callingNewSlide(opt,opt.c,-1);break;default:var ts=jQuery.isNumeric(a.slide)?parseInt(a.slide,0):a.slide;_R.callingNewSlide(opt,opt.c,ts)}break;case"simplelink":window.open(a.url,a.target);break;case"toggleslider":opt.noloopanymore=0,"playing"==opt.sliderstatus?(opt.c.revpause(),_R.unToggleState(opt.slidertoggledby)):(opt.c.revresume(),_R.toggleState(opt.slidertoggledby));break;case"pauseslider":opt.c.revpause(),_R.unToggleState(opt.slidertoggledby);break;case"playslider":opt.noloopanymore=0,opt.c.revresume(),_R.toggleState(opt.slidertoggledby);break;case"playvideo":tnc.length>0&&_R.playVideo(tnc,opt);break;case"stopvideo":tnc.length>0&&_R.stopVideo&&_R.stopVideo(tnc,opt);break;case"togglevideo":tnc.length>0&&(_R.isVideoPlaying(tnc,opt)?_R.stopVideo&&_R.stopVideo(tnc,opt):_R.playVideo(tnc,opt));break;case"mutevideo":tnc.length>0&&_R.muteVideo(tnc,opt);break;case"unmutevideo":tnc.length>0&&_R.unMuteVideo&&_R.unMuteVideo(tnc,opt);break;case"toggle_mute_video":tnc.length>0&&(_R.isVideoMuted(tnc,opt)?_R.unMuteVideo(tnc,opt):_R.muteVideo&&_R.muteVideo(tnc,opt)),_nc.toggleClass("rs-toggle-content-active");break;case"simulateclick":tnc.length>0&&tnc.click();break;case"toggleclass":tnc.length>0&&(tnc.hasClass(a.classname)?tnc.removeClass(a.classname):tnc.addClass(a.classname));break;case"gofullscreen":case"exitfullscreen":case"togglefullscreen":if(jQuery("#rs-go-fullscreen").length>0&&("togglefullscreen"==a.action||"exitfullscreen"==a.action)){jQuery("#rs-go-fullscreen").appendTo(jQuery("#rs-was-here"));var paw=opt.c.closest(".forcefullwidth_wrapper_tp_banner").length>0?opt.c.closest(".forcefullwidth_wrapper_tp_banner"):opt.c.closest(".rev_slider_wrapper");paw.unwrap(),paw.unwrap(),opt.minHeight=opt.oldminheight,opt.infullscreenmode=!1,opt.c.revredraw(),void 0!=opt.playingvideos&&opt.playingvideos.length>0&&jQuery.each(opt.playingvideos,function(e,t){_R.playVideo(t,opt)}),_R.unToggleState(opt.fullscreentoggledby)}else if(0==jQuery("#rs-go-fullscreen").length&&("togglefullscreen"==a.action||"gofullscreen"==a.action)){var paw=opt.c.closest(".forcefullwidth_wrapper_tp_banner").length>0?opt.c.closest(".forcefullwidth_wrapper_tp_banner"):opt.c.closest(".rev_slider_wrapper");paw.wrap('<div id="rs-was-here"><div id="rs-go-fullscreen"></div></div>');var gf=jQuery("#rs-go-fullscreen");gf.appendTo(jQuery("body")),gf.css({position:"fixed",width:"100%",height:"100%",top:"0px",left:"0px",zIndex:"9999999",background:"#ffffff"}),opt.oldminheight=opt.minHeight,opt.minHeight=jQuery(window).height(),opt.infullscreenmode=!0,opt.c.revredraw(),void 0!=opt.playingvideos&&opt.playingvideos.length>0&&jQuery.each(opt.playingvideos,function(e,t){_R.playVideo(t,opt)}),_R.toggleState(opt.fullscreentoggledby)}}},getOffContH=function(e){if(void 0==e)return 0;if(e.split(",").length>1){oc=e.split(",");var t=0;return oc&&jQuery.each(oc,function(e,a){jQuery(a).length>0&&(t+=jQuery(a).outerHeight(!0))}),t}return jQuery(e).height()}}(jQuery);
/********************************************
 * REVOLUTION 5.0 EXTENSION - CAROUSEL
 * @version: 1.0.2 (01.10.2015)
 * @requires jquery.themepunch.revolution.js
 * @author ThemePunch
*********************************************/
!function(){var e=jQuery.fn.revolution;jQuery.extend(!0,e,{prepareCarousel:function(i,l,o){o=i.carousel.lastdirection=a(o,i.carousel.lastdirection),t(i),i.carousel.slide_offset_target=r(i),void 0==l?e.carouselToEvalPosition(i,o):s(i,o,!1)},carouselToEvalPosition:function(i,t){var l=i.carousel;t=l.lastdirection=a(t,l.lastdirection);var o="center"===l.horizontal_align?(l.wrapwidth/2-l.slide_width/2-l.slide_globaloffset)/l.slide_width:(0-l.slide_globaloffset)/l.slide_width,r=e.simp(o,i.slideamount,!1),n=r-Math.floor(r),d=0,f=-1*(Math.ceil(r)-r),h=-1*(Math.floor(r)-r);d=n>=.3&&"left"===t||n>=.7&&"right"===t?f:.3>n&&"left"===t||.7>n&&"right"===t?h:d,d="off"===l.infinity?0>r?r:o>i.slideamount-1?o-(i.slideamount-1):d:d,l.slide_offset_target=d*l.slide_width,0!==Math.abs(l.slide_offset_target)?s(i,t,!0):e.organiseCarousel(i,t)},organiseCarousel:function(e,i,t,a){i=void 0===i||"down"==i||"up"==i||null===i||jQuery.isEmptyObject(i)?"left":i;for(var s=e.carousel,l=new Array,o=s.slides.length,r="right"===s.horizontal_align?r=e.width:0,n=0;o>n;n++){var d=n*s.slide_width+s.slide_offset;"on"===s.infinity&&(d=d>s.wrapwidth-s.inneroffset&&"right"==i?s.slide_offset-(s.slides.length-n)*s.slide_width:d,d=d<0-s.inneroffset-s.slide_width&&"left"==i?d+s.maxwidth:d),l[n]=d}var f=999;s.slides&&jQuery.each(s.slides,function(a,r){var n=l[a];"on"===s.infinity&&(n=n>s.wrapwidth-s.inneroffset&&"left"===i?l[0]-(o-a)*s.slide_width:n,n=n<0-s.inneroffset-s.slide_width?"left"==i?n+s.maxwidth:"right"===i?l[o-1]+(a+1)*s.slide_width:n:n);var d=new Object;d.left=n+s.inneroffset;var h="center"===s.horizontal_align?(Math.abs(s.wrapwidth/2)-(d.left+s.slide_width/2))/s.slide_width:(s.inneroffset-d.left)/s.slide_width,w="center"===s.horizontal_align?2:1;if((t&&Math.abs(h)<f||0===h)&&(f=Math.abs(h),s.focused=a),d.width=s.slide_width,d.x=0,d.transformPerspective=1200,d.transformOrigin="50% "+s.vertical_align,"on"===s.fadeout)if("on"===s.vary_fade)d.autoAlpha=1-Math.abs(1/Math.ceil(s.maxVisibleItems/w)*h);else switch(s.horizontal_align){case"center":d.autoAlpha=Math.abs(h)<Math.ceil(s.maxVisibleItems/w-1)?1:1-(Math.abs(h)-Math.floor(Math.abs(h)));break;case"left":d.autoAlpha=1>h&&h>0?1-h:Math.abs(h)>s.maxVisibleItems-1?1-(Math.abs(h)-(s.maxVisibleItems-1)):1;break;case"right":d.autoAlpha=h>-1&&0>h?1-Math.abs(h):h>s.maxVisibleItems-1?1-(Math.abs(h)-(s.maxVisibleItems-1)):1}else d.autoAlpha=Math.abs(h)<Math.ceil(s.maxVisibleItems/w)?1:0;if(void 0!==s.minScale&&s.minScale>0)if("on"===s.vary_scale){d.scale=1-Math.abs(s.minScale/100/Math.ceil(s.maxVisibleItems/w)*h);var c=(s.slide_width-s.slide_width*d.scale)*Math.abs(h)}else{d.scale=h>=1||-1>=h?1-s.minScale/100:(100-s.minScale*Math.abs(h))/100;var c=(s.slide_width-s.slide_width*(1-s.minScale/100))*Math.abs(h)}void 0!==s.maxRotation&&0!=Math.abs(s.maxRotation)&&("on"===s.vary_rotation?(d.rotationY=Math.abs(s.maxRotation)-Math.abs((1-Math.abs(1/Math.ceil(s.maxVisibleItems/w)*h))*s.maxRotation),d.autoAlpha=Math.abs(d.rotationY)>90?0:d.autoAlpha):d.rotationY=h>=1||-1>=h?s.maxRotation:Math.abs(h)*s.maxRotation,d.rotationY=0>h?-1*d.rotationY:d.rotationY),d.x=-1*s.space*h,d.left=Math.floor(d.left),d.x=Math.floor(d.x),void 0!==d.scale?0>h?d.x-c:d.x+c:d.x,d.zIndex=Math.round(100-Math.abs(5*h)),d.transformStyle="3D"!=e.parallax.type&&"3d"!=e.parallax.type?"flat":"preserve-3d",punchgs.TweenLite.set(r,d)}),a&&(e.c.find(".next-revslide").removeClass("next-revslide"),jQuery(s.slides[s.focused]).addClass("next-revslide"),e.c.trigger("revolution.nextslide.waiting"));s.wrapwidth/2-s.slide_offset,s.maxwidth+s.slide_offset-s.wrapwidth/2}});var i=function(e){var i=e.carousel;i.infbackup=i.infinity,i.maxVisiblebackup=i.maxVisibleItems,i.slide_globaloffset="none",i.slide_offset=0,i.wrap=e.c.find(".tp-carousel-wrapper"),i.slides=e.c.find(".tp-revslider-slidesli"),0!==i.maxRotation&&("3D"!=e.parallax.type&&"3d"!=e.parallax.type?punchgs.TweenLite.set(i.wrap,{perspective:1200,transformStyle:"flat"}):punchgs.TweenLite.set(i.wrap,{perspective:1600,transformStyle:"preserve-3d"})),void 0!==i.border_radius&&parseInt(i.border_radius,0)>0&&punchgs.TweenLite.set(e.c.find(".tp-revslider-slidesli"),{borderRadius:i.border_radius})},t=function(t){void 0===t.bw&&e.setSize(t);var a=t.carousel,s=e.getHorizontalOffset(t.c,"left"),l=e.getHorizontalOffset(t.c,"right");void 0===a.wrap&&i(t),a.slide_width="on"!==a.stretch?t.gridwidth[t.curWinRange]*t.bw:t.c.width(),a.maxwidth=t.slideamount*a.slide_width,a.maxVisiblebackup>a.slides.length+1&&(a.maxVisibleItems=a.slides.length+2),a.wrapwidth=a.maxVisibleItems*a.slide_width+(a.maxVisibleItems-1)*a.space,a.wrapwidth="auto"!=t.sliderLayout?a.wrapwidth>t.c.closest(".tp-simpleresponsive").width()?t.c.closest(".tp-simpleresponsive").width():a.wrapwidth:a.wrapwidth>t.ul.width()?t.ul.width():a.wrapwidth,a.infinity=a.wrapwidth>=a.maxwidth?"off":a.infbackup,a.wrapoffset="center"===a.horizontal_align?(t.c.width()-l-s-a.wrapwidth)/2:0,a.wrapoffset="auto"!=t.sliderLayout&&t.outernav?0:a.wrapoffset<s?s:a.wrapoffset;var o="hidden";("3D"==t.parallax.type||"3d"==t.parallax.type)&&(o="visible"),"right"===a.horizontal_align?punchgs.TweenLite.set(a.wrap,{left:"auto",right:a.wrapoffset+"px",width:a.wrapwidth,overflow:o}):punchgs.TweenLite.set(a.wrap,{right:"auto",left:a.wrapoffset+"px",width:a.wrapwidth,overflow:o}),a.inneroffset="right"===a.horizontal_align?a.wrapwidth-a.slide_width:0,a.realoffset=Math.abs(a.wrap.position().left),a.windhalf=jQuery(window).width()/2},a=function(e,i){return null===e||jQuery.isEmptyObject(e)?i:void 0===e?"right":e},s=function(i,t,s){var l=i.carousel;t=l.lastdirection=a(t,l.lastdirection);var o=new Object;o.from=0,o.to=l.slide_offset_target,void 0!==l.positionanim&&l.positionanim.pause(),l.positionanim=punchgs.TweenLite.to(o,1.2,{from:o.to,onUpdate:function(){l.slide_offset=l.slide_globaloffset+o.from,l.slide_offset=e.simp(l.slide_offset,l.maxwidth),e.organiseCarousel(i,t,!1,!1)},onComplete:function(){l.slide_globaloffset="off"===l.infinity?l.slide_globaloffset+l.slide_offset_target:e.simp(l.slide_globaloffset+l.slide_offset_target,l.maxwidth),l.slide_offset=e.simp(l.slide_offset,l.maxwidth),e.organiseCarousel(i,t,!1,!0);var a=jQuery(i.li[l.focused]);i.c.find(".next-revslide").removeClass("next-revslide"),s&&e.callingNewSlide(i,i.c,a.data("index"))},ease:punchgs.Expo.easeOut})},l=function(e,i){return Math.abs(e)>Math.abs(i)?e>0?e-Math.abs(Math.floor(e/i)*i):e+Math.abs(Math.floor(e/i)*i):e},o=function(e,i,t){var t,t,a=i-e,s=i-t-e;return a=l(a,t),s=l(s,t),Math.abs(a)>Math.abs(s)?s:a},r=function(i){var t=0,a=i.carousel;if(void 0!==a.positionanim&&a.positionanim.kill(),"none"==a.slide_globaloffset)a.slide_globaloffset=t="center"===a.horizontal_align?a.wrapwidth/2-a.slide_width/2:0;else{a.slide_globaloffset=a.slide_offset,a.slide_offset=0;var s=i.c.find(".processing-revslide").index(),l="center"===a.horizontal_align?(a.wrapwidth/2-a.slide_width/2-a.slide_globaloffset)/a.slide_width:(0-a.slide_globaloffset)/a.slide_width;l=e.simp(l,i.slideamount,!1),s=s>=0?s:i.c.find(".active-revslide").index(),s=s>=0?s:0,t="off"===a.infinity?l-s:-o(l,s,i.slideamount),t*=a.slide_width}return t}}(jQuery);
/********************************************
 * REVOLUTION 5.0 EXTENSION - KEN BURN
 * @version: 1.0.0 (03.08.2015)
 * @requires jquery.themepunch.revolution.js
 * @author ThemePunch
*********************************************/
!function(){var t=jQuery.fn.revolution;jQuery.extend(!0,t,{stopKenBurn:function(t){void 0!=t.data("kbtl")&&t.data("kbtl").pause()},startKenBurn:function(t,e,a){var r=t.data(),n=t.find(".defaultimg"),s=n.data("lazyload")||n.data("src"),i=(r.owidth/r.oheight,"carousel"===e.sliderType?e.carousel.slide_width:e.ul.width()),o=e.ul.height();t.data("kbtl")&&t.data("kbtl").kill(),a=a||0,0==t.find(".tp-kbimg").length&&(t.append('<div class="tp-kbimg-wrap" style="z-index:2;width:100%;height:100%;top:0px;left:0px;position:absolute;"><img class="tp-kbimg" src="'+s+'" style="position:absolute;" width="'+r.owidth+'" height="'+r.oheight+'"></div>'),t.data("kenburn",t.find(".tp-kbimg")));var d=function(t,e,a,r,n,s,i){var o=t*a,d=e*a,l=Math.abs(r-o),h=Math.abs(n-d),p=new Object;return p.l=(0-s)*l,p.r=p.l+o,p.t=(0-i)*h,p.b=p.t+d,p.h=s,p.v=i,p},l=function(t,e,a,r,n){var s=t.bgposition.split(" ")||"center center",i="center"==s[0]?"50%":"left"==s[0]||"left"==s[1]?"0%":"right"==s[0]||"right"==s[1]?"100%":s[0],o="center"==s[1]?"50%":"top"==s[0]||"top"==s[1]?"0%":"bottom"==s[0]||"bottom"==s[1]?"100%":s[1];i=parseInt(i,0)/100||0,o=parseInt(o,0)/100||0;var l=new Object;return l.start=d(n.start.width,n.start.height,n.start.scale,e,a,i,o),l.end=d(n.start.width,n.start.height,n.end.scale,e,a,i,o),l},h=function(t,e,a){var r=a.scalestart/100,n=a.scaleend/100,s=void 0!=a.oofsetstart?a.offsetstart.split(" ")||[0,0]:[0,0],i=void 0!=a.offsetend?a.offsetend.split(" ")||[0,0]:[0,0];a.bgposition="center center"==a.bgposition?"50% 50%":a.bgposition;{var o=new Object,d=t*r,h=(d/a.owidth*a.oheight,t*n);h/a.owidth*a.oheight}if(o.start=new Object,o.starto=new Object,o.end=new Object,o.endo=new Object,o.start.width=t,o.start.height=o.start.width/a.owidth*a.oheight,o.start.height<e){var p=e/o.start.height;o.start.height=e,o.start.width=o.start.width*p}o.start.transformOrigin=a.bgposition,o.start.scale=r,o.end.scale=n,o.start.rotation=a.rotatestart+"deg",o.end.rotation=a.rotateend+"deg";var g=l(a,t,e,s,o);s[0]=parseFloat(s[0])+g.start.l,i[0]=parseFloat(i[0])+g.end.l,s[1]=parseFloat(s[1])+g.start.t,i[1]=parseFloat(i[1])+g.end.t;var c=g.start.r-g.start.l,b=g.start.b-g.start.t,u=g.end.r-g.end.l,f=g.end.b-g.end.t;return s[0]=s[0]>0?0:c+s[0]<t?t-c:s[0],i[0]=i[0]>0?0:u+i[0]<t?t-u:i[0],s[1]=s[1]>0?0:b+s[1]<e?e-b:s[1],i[1]=i[1]>0?0:f+i[1]<e?e-f:i[1],o.starto.x=s[0]+"px",o.starto.y=s[1]+"px",o.endo.x=i[0]+"px",o.endo.y=i[1]+"px",o.end.ease=o.endo.ease=a.ease,o.end.force3D=o.endo.force3D=!0,o};void 0!=t.data("kbtl")&&(t.data("kbtl").kill(),t.removeData("kbtl"));var p=t.data("kenburn"),g=p.parent(),c=h(i,o,r),b=new punchgs.TimelineLite;b.pause(),c.start.transformOrigin="0% 0%",c.starto.transformOrigin="0% 0%",b.add(punchgs.TweenLite.fromTo(p,r.duration/1e3,c.start,c.end),0),b.add(punchgs.TweenLite.fromTo(g,r.duration/1e3,c.starto,c.endo),0),b.progress(a),b.play(),t.data("kbtl",b)}})}(jQuery);
/********************************************
 * REVOLUTION 5.0 EXTENSION - LAYER ANIMATION
 * @version: 1.4 (15.12.2015)
 * @requires jquery.themepunch.revolution.js
 * @author ThemePunch
*********************************************/
!function(a){function e(a,e,t,i,n,o,r){var d=a.find(e);d.css("borderWidth",o+"px"),d.css(t,0-o+"px"),d.css(i,"0px solid transparent"),d.css(n,r)}var t=jQuery.fn.revolution;t.is_mobile();jQuery.extend(!0,t,{animcompleted:function(a,e){var i=a.data("videotype"),n=a.data("autoplay"),o=a.data("autoplayonlyfirsttime");void 0!=i&&"none"!=i&&(1==n||"true"==n||"on"==n||"1sttime"==n||o?(t.playVideo(a,e),t.toggleState(a.data("videotoggledby")),(o||"1sttime"==n)&&(a.data("autoplayonlyfirsttime",!1),a.data("autoplay","off"))):("no1sttime"==n&&a.data("autoplay","on"),t.unToggleState(a.data("videotoggledby"))))},handleStaticLayers:function(a,e){var t=parseInt(a.data("startslide"),0),i=parseInt(a.data("endslide"),0);0>t&&(t=0),0>i&&(i=e.slideamount),0===t&&i===e.slideamount-1&&(i=e.slideamount+1),a.data("startslide",t),a.data("endslide",i)},animateTheCaptions:function(a,e,i,n){var o="carousel"===e.sliderType?0:e.width/2-e.gridwidth[e.curWinRange]*e.bw/2,r=0,d=a.data("index");e.layers=e.layers||new Object,e.layers[d]=e.layers[d]||a.find(".tp-caption"),e.layers["static"]=e.layers["static"]||e.c.find(".tp-static-layers").find(".tp-caption");var s=new Array;if(e.conh=e.c.height(),e.conw=e.c.width(),e.ulw=e.ul.width(),e.ulh=e.ul.height(),e.debugMode){a.addClass("indebugmode"),a.find(".helpgrid").remove(),e.c.find(".hglayerinfo").remove(),a.append('<div class="helpgrid" style="width:'+e.gridwidth[e.curWinRange]*e.bw+"px;height:"+e.gridheight[e.curWinRange]*e.bw+'px;"></div>');var l=a.find(".helpgrid");l.append('<div class="hginfo">Zoom:'+Math.round(100*e.bw)+"% &nbsp;&nbsp;&nbsp; Device Level:"+e.curWinRange+"&nbsp;&nbsp;&nbsp; Grid Preset:"+e.gridwidth[e.curWinRange]+"x"+e.gridheight[e.curWinRange]+"</div>"),e.c.append('<div class="hglayerinfo"></div>'),l.append('<div class="tlhg"></div>')}s&&jQuery.each(s,function(a){var e=jQuery(this);punchgs.TweenLite.set(e.find(".tp-videoposter"),{autoAlpha:1}),punchgs.TweenLite.set(e.find("iframe"),{autoAlpha:0})}),e.layers[d]&&jQuery.each(e.layers[d],function(a,e){s.push(e)}),e.layers["static"]&&jQuery.each(e.layers["static"],function(a,e){s.push(e)}),s&&jQuery.each(s,function(a){t.animateSingleCaption(jQuery(this),e,o,r,a,i)});var p=jQuery("body").find("#"+e.c.attr("id")).find(".tp-bannertimer");p.data("opt",e),void 0!=n&&setTimeout(function(){n.resume()},30)},animateSingleCaption:function(a,n,r,u,w,y,b){var x=y,T=h(a,n,"in",!0),L=a.data("_pw")||a.closest(".tp-parallax-wrap"),W=a.data("_lw")||a.closest(".tp-loop-wrap"),C=a.data("_mw")||a.closest(".tp-mask-wrap"),j=a.data("responsive")||"on",I=a.data("responsive_offset")||"on",R=a.data("basealign")||"grid",k="grid"===R?n.width:n.ulw,_="grid"===R?n.height:n.ulh,S=jQuery("body").hasClass("rtl");if(a.data("_pw")||(a.data("_pw",L),a.data("_lw",W),a.data("_mw",C)),"fullscreen"==n.sliderLayout&&(u=_/2-n.gridheight[n.curWinRange]*n.bh/2),("on"==n.autoHeight||void 0!=n.minHeight&&n.minHeight>0)&&(u=n.conh/2-n.gridheight[n.curWinRange]*n.bh/2),0>u&&(u=0),n.debugMode){a.closest("li").find(".helpgrid").css({top:u+"px",left:r+"px"});var z=n.c.find(".hglayerinfo");a.on("hover, mouseenter",function(){var e="";a.data()&&jQuery.each(a.data(),function(a,t){"object"!=typeof t&&(e=e+'<span style="white-space:nowrap"><span style="color:#27ae60">'+a+":</span>"+t+"</span>&nbsp; &nbsp; ")}),z.html(e)})}var Q=p(a.data("visibility"),n)[n.forcedWinRange]||p(a.data("visibility"),n)||"on";if("off"==Q||k<n.hideCaptionAtLimit&&"on"==a.data("captionhidden")||k<n.hideAllCaptionAtLimit?a.addClass("tp-hidden-caption"):a.removeClass("tp-hidden-caption"),a.data("layertype","html"),0>r&&(r=0),void 0!=a.data("thumbimage")&&void 0==a.data("videoposter")&&a.data("videoposter",a.data("thumbimage")),a.find("img").length>0){var M=a.find("img");a.data("layertype","image"),0==M.width()&&M.css({width:"auto"}),0==M.height()&&M.css({height:"auto"}),void 0==M.data("ww")&&M.width()>0&&M.data("ww",M.width()),void 0==M.data("hh")&&M.height()>0&&M.data("hh",M.height());var O=M.data("ww"),H=M.data("hh"),B="slide"==R?n.ulw:n.gridwidth[n.curWinRange],A="slide"==R?n.ulh:n.gridheight[n.curWinRange],O=p(M.data("ww"),n)[n.curWinRange]||p(M.data("ww"),n)||"auto",H=p(M.data("hh"),n)[n.curWinRange]||p(M.data("hh"),n)||"auto",F="full"===O||"full-proportional"===O,D="full"===H||"full-proportional"===H;if("full-proportional"===O){var P=M.data("owidth"),X=M.data("oheight");X/A>P/B?(O=B,H=X*(B/P)):(H=A,O=P*(A/X))}else O=F?B:parseFloat(O),H=D?A:parseFloat(H);void 0==O&&(O=0),void 0==H&&(H=0),"off"!==j?("grid"!=R&&F?M.width(O):M.width(O*n.bw),"grid"!=R&&D?M.height(H):M.height(H*n.bh)):(M.width(O),M.height(H))}if("slide"===R&&(r=0,u=0),a.hasClass("tp-videolayer")||a.find("iframe").length>0||a.find("video").length>0){if(a.data("layertype","video"),t.manageVideoLayer(a,n,y,x),!y&&!x){a.data("videotype");t.resetVideo(a,n)}var Y=a.data("aspectratio");void 0!=Y&&Y.split(":").length>1&&t.prepareCoveredVideo(Y,n,a);var M=a.find("iframe")?a.find("iframe"):M=a.find("video"),V=a.find("iframe")?!1:!0,N=a.hasClass("coverscreenvideo");M.css({display:"block"}),void 0==a.data("videowidth")&&(a.data("videowidth",M.width()),a.data("videoheight",M.height()));var Z,O=p(a.data("videowidth"),n)[n.curWinRange]||p(a.data("videowidth"),n)||"auto",H=p(a.data("videoheight"),n)[n.curWinRange]||p(a.data("videoheight"),n)||"auto";O=parseFloat(O),H=parseFloat(H),void 0===a.data("cssobj")&&(Z=g(a,0),a.data("cssobj",Z));var $=m(a.data("cssobj"),n);if("auto"==$.lineHeight&&($.lineHeight=$.fontSize+4),a.hasClass("fullscreenvideo")||N){r=0,u=0,a.data("x",0),a.data("y",0);var G=_;"on"==n.autoHeight&&(G=n.conh),a.css({width:k,height:G})}else punchgs.TweenLite.set(a,{paddingTop:Math.round($.paddingTop*n.bh)+"px",paddingBottom:Math.round($.paddingBottom*n.bh)+"px",paddingLeft:Math.round($.paddingLeft*n.bw)+"px",paddingRight:Math.round($.paddingRight*n.bw)+"px",marginTop:$.marginTop*n.bh+"px",marginBottom:$.marginBottom*n.bh+"px",marginLeft:$.marginLeft*n.bw+"px",marginRight:$.marginRight*n.bw+"px",borderTopWidth:Math.round($.borderTopWidth*n.bh)+"px",borderBottomWidth:Math.round($.borderBottomWidth*n.bh)+"px",borderLeftWidth:Math.round($.borderLeftWidth*n.bw)+"px",borderRightWidth:Math.round($.borderRightWidth*n.bw)+"px",width:O*n.bw+"px",height:H*n.bh+"px"});(0==V&&!N||1!=a.data("forcecover")&&!a.hasClass("fullscreenvideo")&&!N)&&(M.width(O*n.bw),M.height(H*n.bh))}a.find(".tp-resizeme, .tp-resizeme *").each(function(){v(jQuery(this),n,"rekursive",j)}),a.hasClass("tp-resizeme")&&a.find("*").each(function(){v(jQuery(this),n,"rekursive",j)}),v(a,n,0,j);var U=a.outerHeight(),q=a.css("backgroundColor");e(a,".frontcorner","left","borderRight","borderTopColor",U,q),e(a,".frontcornertop","left","borderRight","borderBottomColor",U,q),e(a,".backcorner","right","borderLeft","borderBottomColor",U,q),e(a,".backcornertop","right","borderLeft","borderTopColor",U,q),"on"==n.fullScreenAlignForce&&(r=0,u=0);var E=a.data("arrobj");if(void 0===E){var E=new Object;E.voa=p(a.data("voffset"),n)[n.curWinRange]||p(a.data("voffset"),n)[0],E.hoa=p(a.data("hoffset"),n)[n.curWinRange]||p(a.data("hoffset"),n)[0],E.elx=p(a.data("x"),n)[n.curWinRange]||p(a.data("x"),n)[0],E.ely=p(a.data("y"),n)[n.curWinRange]||p(a.data("y"),n)[0]}var J=0==E.voa.length?0:E.voa,K=0==E.hoa.length?0:E.hoa,aa=0==E.elx.length?0:E.elx,ea=0==E.ely.length?0:E.ely,ta=a.outerWidth(!0),ia=a.outerHeight(!0);0==ta&&0==ia&&(ta=n.ulw,ia=n.ulh);var na="off"!==I?parseInt(J,0)*n.bw:parseInt(J,0),oa="off"!==I?parseInt(K,0)*n.bw:parseInt(K,0),ra="grid"===R?n.gridwidth[n.curWinRange]*n.bw:k,da="grid"===R?n.gridheight[n.curWinRange]*n.bw:_;"on"==n.fullScreenAlignForce&&(ra=n.ulw,da=n.ulh),aa="center"===aa||"middle"===aa?ra/2-ta/2+oa:"left"===aa?oa:"right"===aa?ra-ta-oa:"off"!==I?aa*n.bw:aa,ea="center"==ea||"middle"==ea?da/2-ia/2+na:"top"==ea?na:"bottom"==ea?da-ia-na:"off"!==I?ea*n.bw:ea,S&&(aa+=ta);var sa=a.data("lasttriggerstate"),la=a.data("triggerstate"),pa=a.data("start")||100,ha=a.data("end"),ca=b?0:"bytrigger"===pa||"sliderenter"===pa?0:parseFloat(pa)/1e3,ga=aa+r,ma=ea+u,ua=a.css("z-Index");b||("reset"==sa&&"bytrigger"!=pa?(a.data("triggerstate","on"),a.data("animdirection","in"),la="on"):"reset"==sa&&"bytrigger"==pa&&(a.data("triggerstate","off"),a.data("animdirection","out"),la="off")),punchgs.TweenLite.set(L,{zIndex:ua,top:ma,left:ga,overwrite:"auto"}),0==T&&(x=!0),void 0==a.data("timeline")||x||(2!=T&&a.data("timeline").gotoAndPlay(0),x=!0),!y&&a.data("timeline_out")&&2!=T&&0!=T&&(a.data("timeline_out").kill(),a.data("outstarted",0)),b&&void 0!=a.data("timeline")&&(a.removeData("$anims"),a.data("timeline").pause(0),a.data("timeline").kill(),void 0!=a.data("newhoveranim")&&(a.data("newhoveranim").progress(0),a.data("newhoveranim").kill()),a.removeData("timeline"),punchgs.TweenLite.killTweensOf(a),a.unbind("hover"),a.removeClass("rs-hover-ready"),a.removeData("newhoveranim"));var va=a.data("timeline")?a.data("timeline").time():0,fa=void 0!==a.data("timeline")?a.data("timeline").progress():0,wa=a.data("timeline")||new punchgs.TimelineLite({smoothChildTiming:!0});if(fa=jQuery.isNumeric(fa)?fa:0,wa.pause(),1>fa&&1!=a.data("outstarted")||2==T||b){var ya=a;if(void 0!=a.data("mySplitText")&&a.data("mySplitText").revert(),void 0!=a.data("splitin")&&a.data("splitin").match(/chars|words|lines/g)||void 0!=a.data("splitout")&&a.data("splitout").match(/chars|words|lines/g)){var ba=a.find("a").length>0?a.find("a"):a;a.data("mySplitText",new punchgs.SplitText(ba,{type:"lines,words,chars",charsClass:"tp-splitted",wordsClass:"tp-splitted",linesClass:"tp-splitted"})),a.addClass("splitted")}void 0!==a.data("mySplitText")&&a.data("splitin")&&a.data("splitin").match(/chars|words|lines/g)&&(ya=a.data("mySplitText")[a.data("splitin")]);var xa=new Object,Ta=void 0!=a.data("transform_in")?a.data("transform_in").match(/\(R\)/gi):!1;if(!a.data("$anims")||b||Ta){var La=i(),Wa=i(),Ca=o(),ja=void 0!==a.data("transform_hover")||void 0!==a.data("style_hover");Wa=s(Wa,a.data("transform_idle")),La=s(Wa,a.data("transform_in"),1==n.sdir),ja&&(Ca=s(Ca,a.data("transform_hover")),Ca=c(Ca,a.data("style_hover")),a.data("hover",Ca)),La.elemdelay=void 0==a.data("elementdelay")?0:a.data("elementdelay"),Wa.anim.ease=La.anim.ease=La.anim.ease||punchgs.Power1.easeInOut,ja&&!a.hasClass("rs-hover-ready")&&(a.addClass("rs-hover-ready"),a.hover(function(a){var e=jQuery(a.currentTarget),t=e.data("hover"),i=e.data("timeline");i&&1==i.progress()&&(void 0===e.data("newhoveranim")||"none"===e.data("newhoveranim")?e.data("newhoveranim",punchgs.TweenLite.to(e,t.speed,t.anim)):(e.data("newhoveranim").progress(0),e.data("newhoveranim").play()))},function(a){var e=jQuery(a.currentTarget),t=e.data("timeline");t&&1==t.progress()&&void 0!=e.data("newhoveranim")&&e.data("newhoveranim").reverse()})),xa=new Object,xa.f=La,xa.r=Wa,a.data("$anims")}else xa=a.data("$anims");var Ia=l(a.data("mask_in")),Ra=new punchgs.TimelineLite;if(xa.f.anim.x=xa.f.anim.x*n.bw||d(xa.f.anim.x,n,ta,ia,ma,ga,"horizontal"),xa.f.anim.y=xa.f.anim.y*n.bw||d(xa.f.anim.y,n,ta,ia,ma,ga,"vertical"),2!=T||b){if(ya!=a){var ka=xa.r.anim.ease;wa.add(punchgs.TweenLite.set(a,xa.r.anim)),xa.r=i(),xa.r.anim.ease=ka}if(xa.f.anim.visibility="hidden",Ra.eventCallback("onStart",function(){punchgs.TweenLite.set(a,{visibility:"visible"}),a.data("iframes")&&a.find("iframe").each(function(){punchgs.TweenLite.set(jQuery(this),{autoAlpha:1})}),punchgs.TweenLite.set(L,{visibility:"visible"});var e={};e.layer=a,e.eventtype="enterstage",e.layertype=a.data("layertype"),e.layersettings=a.data(),n.c.trigger("revolution.layeraction",e)}),Ra.eventCallback("onComplete",function(){var e={};e.layer=a,e.eventtype="enteredstage",e.layertype=a.data("layertype"),e.layersettings=a.data(),n.c.trigger("revolution.layeraction",e),t.animcompleted(a,n)}),"sliderenter"==pa&&n.overcontainer&&(ca=.6),wa.add(Ra.staggerFromTo(ya,xa.f.speed,xa.f.anim,xa.r.anim,xa.f.elemdelay),ca),Ia){var _a=new Object;_a.ease=xa.r.anim.ease,_a.overflow=Ia.anim.overflow="hidden",_a.x=_a.y=0,Ia.anim.x=Ia.anim.x*n.bw||d(Ia.anim.x,n,ta,ia,ma,ga,"horizontal"),Ia.anim.y=Ia.anim.y*n.bw||d(Ia.anim.y,n,ta,ia,ma,ga,"vertical"),wa.add(punchgs.TweenLite.fromTo(C,xa.f.speed,Ia.anim,_a,La.elemdelay),ca)}else wa.add(punchgs.TweenLite.set(C,{overflow:"visible"},La.elemdelay),0)}a.data("timeline",wa),n.sliderscrope=void 0===n.sliderscrope?Math.round(99999*Math.random()):n.sliderscrope,T=h(a,n,"in"),0!==fa&&2!=T||"bytrigger"===ha||b||"sliderleave"==ha||(void 0==ha||-1!=T&&2!=T||"bytriger"===ha?punchgs.TweenLite.delayedCall(999999,t.endMoveCaption,[a,C,L,n],n.sliderscrope):punchgs.TweenLite.delayedCall(parseInt(a.data("end"),0)/1e3,t.endMoveCaption,[a,C,L,n],n.sliderscrope)),wa=a.data("timeline"),"on"==a.data("loopanimation")&&f(W,n.bw),("sliderenter"!=pa||"sliderenter"==pa&&n.overcontainer)&&(-1==T||1==T||b||0==T&&1>fa&&a.hasClass("rev-static-visbile"))&&(1>fa&&fa>0||0==fa&&"bytrigger"!=pa&&"keep"!=sa||0==fa&&"bytrigger"!=pa&&"keep"==sa&&"on"==la||"bytrigger"==pa&&"keep"==sa&&"on"==la)&&(wa.resume(va),t.toggleState(a.data("layertoggledby")))}"on"==a.data("loopanimation")&&punchgs.TweenLite.set(W,{minWidth:ta,minHeight:ia}),0==a.data("slidelink")||1!=a.data("slidelink")&&!a.hasClass("slidelink")?(punchgs.TweenLite.set(C,{width:"auto",height:"auto"}),a.data("slidelink",0)):(punchgs.TweenLite.set(C,{width:"100%",height:"100%"}),a.data("slidelink",1))},endMoveCaption:function(a,e,t,o){if(e=e||a.data("_mw"),t=t||a.data("_pw"),a.data("outstarted",1),a.data("timeline"))a.data("timeline").pause();else if(void 0===a.data("_pw"))return;var r=new punchgs.TimelineLite,p=new punchgs.TimelineLite,h=new punchgs.TimelineLite,c=s(i(),a.data("transform_in"),1==o.sdir),g=a.data("transform_out")?s(n(),a.data("transform_out"),1==o.sdir):s(n(),a.data("transform_in"),1==o.sdir),m=a.data("splitout")&&a.data("splitout").match(/words|chars|lines/g)?a.data("mySplitText")[a.data("splitout")]:a,u=void 0==a.data("endelementdelay")?0:a.data("endelementdelay"),v=a.innerWidth(),f=a.innerHeight(),w=t.position();a.data("transform_out")&&a.data("transform_out").match(/auto:auto/g)&&(c.speed=g.speed,c.anim.ease=g.anim.ease,g=c);var y=l(a.data("mask_out"));g.anim.x=g.anim.x*o.bw||d(g.anim.x,o,v,f,w.top,w.left,"horizontal"),g.anim.y=g.anim.y*o.bw||d(g.anim.y,o,v,f,w.top,w.left,"vertical"),p.eventCallback("onStart",function(){var e={};e.layer=a,e.eventtype="leavestage",e.layertype=a.data("layertype"),e.layersettings=a.data(),o.c.trigger("revolution.layeraction",e)}),p.eventCallback("onComplete",function(){punchgs.TweenLite.set(a,{visibility:"hidden"}),punchgs.TweenLite.set(t,{visibility:"hidden"});var e={};e.layer=a,e.eventtype="leftstage",e.layertype=a.data("layertype"),e.layersettings=a.data(),o.c.trigger("revolution.layeraction",e)}),r.add(p.staggerTo(m,g.speed,g.anim,u),0),y?(y.anim.ease=g.anim.ease,y.anim.overflow="hidden",y.anim.x=y.anim.x*o.bw||d(y.anim.x,o,v,f,w.top,w.left,"horizontal"),y.anim.y=y.anim.y*o.bw||d(y.anim.y,o,v,f,w.top,w.left,"vertical"),r.add(h.to(e,g.speed,y.anim,u),0)):r.add(h.set(e,{overflow:"visible",overwrite:"auto"},u),0),a.data("timeline_out",r)},removeTheCaptions:function(a,e){var i=a.data("index"),n=new Array;e.layers[i]&&jQuery.each(e.layers[i],function(a,e){n.push(e)}),e.layers["static"]&&jQuery.each(e.layers["static"],function(a,e){n.push(e)}),punchgs.TweenLite.killDelayedCallsTo(t.endMoveCaption,!1,e.sliderscrope),n&&jQuery.each(n,function(a){var i=jQuery(this),n=h(i,e,"out");0!=n&&(w(i),clearTimeout(i.data("videoplaywait")),t.stopVideo&&t.stopVideo(i,e),t.endMoveCaption(i,null,null,e),e.playingvideos=[],e.lastplayedvideos=[])})}});var i=function(){var a=new Object;return a.anim=new Object,a.anim.x=0,a.anim.y=0,a.anim.z=0,a.anim.rotationX=0,a.anim.rotationY=0,a.anim.rotationZ=0,a.anim.scaleX=1,a.anim.scaleY=1,a.anim.skewX=0,a.anim.skewY=0,a.anim.opacity=1,a.anim.transformOrigin="50% 50%",a.anim.transformPerspective=600,a.anim.rotation=0,a.anim.ease=punchgs.Power3.easeOut,a.anim.force3D="auto",a.speed=.3,a.anim.autoAlpha=1,a.anim.visibility="visible",a.anim.overwrite="all",a},n=function(){var a=new Object;return a.anim=new Object,a.anim.x=0,a.anim.y=0,a.anim.z=0,a},o=function(){var a=new Object;return a.anim=new Object,a.speed=.2,a},r=function(a,e){if(jQuery.isNumeric(parseFloat(a)))return parseFloat(a);if(void 0===a||"inherit"===a)return e;if(a.split("{").length>1){var t=a.split(","),i=parseFloat(t[1].split("}")[0]);t=parseFloat(t[0].split("{")[1]),a=Math.random()*(i-t)+t}return a},d=function(a,e,t,i,n,o,r){return!jQuery.isNumeric(a)&&a.match(/%]/g)?(a=a.split("[")[1].split("]")[0],"horizontal"==r?a=(t+2)*parseInt(a,0)/100:"vertical"==r&&(a=(i+2)*parseInt(a,0)/100)):(a="layer_left"===a?0-t:"layer_right"===a?t:a,a="layer_top"===a?0-i:"layer_bottom"===a?i:a,a="left"===a||"stage_left"===a?0-t-o:"right"===a||"stage_right"===a?e.conw-o:"center"===a||"stage_center"===a?e.conw/2-t/2-o:a,a="top"===a||"stage_top"===a?0-i-n:"bottom"===a||"stage_bottom"===a?e.conh-n:"middle"===a||"stage_middle"===a?e.conh/2-i/2-n:a),a},s=function(a,e,t){var i=new Object;if(i=jQuery.extend(!0,{},i,a),void 0===e)return i;var n=e.split(";");return n&&jQuery.each(n,function(a,e){var n=e.split(":"),o=n[0],d=n[1];t&&void 0!=d&&d.length>0&&d.match(/\(R\)/)&&(d=d.replace("(R)",""),d="right"===d?"left":"left"===d?"right":"top"===d?"bottom":"bottom"===d?"top":d,"["===d[0]&&"-"===d[1]?d=d.replace("[-","["):"["===d[0]&&"-"!==d[1]?d=d.replace("[","[-"):"-"===d[0]?d=d.replace("-",""):d[0].match(/[1-9]/)&&(d="-"+d)),void 0!=d&&(d=d.replace(/\(R\)/,""),("rotationX"==o||"rX"==o)&&(i.anim.rotationX=r(d,i.anim.rotationX)+"deg"),("rotationY"==o||"rY"==o)&&(i.anim.rotationY=r(d,i.anim.rotationY)+"deg"),("rotationZ"==o||"rZ"==o)&&(i.anim.rotation=r(d,i.anim.rotationZ)+"deg"),("scaleX"==o||"sX"==o)&&(i.anim.scaleX=r(d,i.anim.scaleX)),("scaleY"==o||"sY"==o)&&(i.anim.scaleY=r(d,i.anim.scaleY)),("opacity"==o||"o"==o)&&(i.anim.opacity=r(d,i.anim.opacity)),("skewX"==o||"skX"==o)&&(i.anim.skewX=r(d,i.anim.skewX)),("skewY"==o||"skY"==o)&&(i.anim.skewY=r(d,i.anim.skewY)),"x"==o&&(i.anim.x=r(d,i.anim.x)),"y"==o&&(i.anim.y=r(d,i.anim.y)),"z"==o&&(i.anim.z=r(d,i.anim.z)),("transformOrigin"==o||"tO"==o)&&(i.anim.transformOrigin=d.toString()),("transformPerspective"==o||"tP"==o)&&(i.anim.transformPerspective=parseInt(d,0)),("speed"==o||"s"==o)&&(i.speed=parseFloat(d)/1e3),("ease"==o||"e"==o)&&(i.anim.ease=d))}),i},l=function(a){if(void 0===a)return!1;var e=new Object;e.anim=new Object;var t=a.split(";");return t&&jQuery.each(t,function(a,t){t=t.split(":");var i=t[0],n=t[1];"x"==i&&(e.anim.x=n),"y"==i&&(e.anim.y=n),"s"==i&&(e.speed=parseFloat(n)/1e3),("e"==i||"ease"==i)&&(e.anim.ease=n)}),e},p=function(a,e,t){if(void 0==a&&(a=0),!jQuery.isArray(a)&&"string"===jQuery.type(a)&&(a.split(",").length>1||a.split("[").length>1)){a=a.replace("[",""),a=a.replace("]","");var i=a.match(/'/g)?a.split("',"):a.split(",");a=new Array,i&&jQuery.each(i,function(e,t){t=t.replace("'",""),t=t.replace("'",""),a.push(t)})}else{var n=a;jQuery.isArray(a)||(a=new Array,a.push(n))}var n=a[a.length-1];if(a.length<e.rle)for(var o=1;o<=e.curWinRange;o++)a.push(n);return a},h=function(a,e,t,i){var n=-1;if(a.hasClass("tp-static-layer")){var o=parseInt(a.data("startslide"),0),r=parseInt(a.data("endslide"),0),d=e.c.find(".processing-revslide").index(),s=-1!=d?d:e.c.find(".active-revslide").index();s=-1==s?0:s,"in"===t?a.hasClass("rev-static-visbile")?n=r==s||o>s||s>r?2:0:s>=o&&r>=s||o==s||r==s?(i||(a.addClass("rev-static-visbile"),a.removeClass("rev-static-hidden")),n=1):n=0:a.hasClass("rev-static-visbile")?o>s||s>r?(n=2,i||(a.removeClass("rev-static-visbile"),a.addClass("rev-static-hidden"))):n=0:n=2}return n},c=function(a,e){if(void 0===e)return a;e=e.replace("c:","color:"),e=e.replace("bg:","background-color:"),e=e.replace("bw:","border-width:"),e=e.replace("bc:","border-color:"),e=e.replace("br:","borderRadius:"),e=e.replace("bs:","border-style:"),e=e.replace("td:","text-decoration:");var t=e.split(";");return t&&jQuery.each(t,function(e,t){var i=t.split(":");i[0].length>0&&(a.anim[i[0]]=i[1])}),a},g=function(a,e){var t,i=new Object,n=!1;if("rekursive"==e&&(t=a.closest(".tp-caption"),t&&a.css("fontSize")===t.css("fontSize")&&(n=!0)),i.basealign=a.data("basealign")||"grid",i.fontSize=n?void 0===t.data("fontsize")?parseInt(t.css("fontSize"),0)||0:t.data("fontsize"):void 0===a.data("fontsize")?parseInt(a.css("fontSize"),0)||0:a.data("fontsize"),i.fontWeight=n?void 0===t.data("fontweight")?parseInt(t.css("fontWeight"),0)||0:t.data("fontweight"):void 0===a.data("fontweight")?parseInt(a.css("fontWeight"),0)||0:a.data("fontweight"),i.whiteSpace=n?void 0===t.data("whitespace")?t.css("whitespace")||"normal":t.data("whitespace"):void 0===a.data("whitespace")?a.css("whitespace")||"normal":a.data("whitespace"),i.lineHeight=n?void 0===t.data("lineheight")?parseInt(t.css("lineHeight"),0)||0:t.data("lineheight"):void 0===a.data("lineheight")?parseInt(a.css("lineHeight"),0)||0:a.data("lineheight"),i.letterSpacing=n?void 0===t.data("letterspacing")?parseFloat(t.css("letterSpacing"),0)||0:t.data("letterspacing"):void 0===a.data("letterspacing")?parseFloat(a.css("letterSpacing"))||0:a.data("letterspacing"),i.paddingTop=void 0===a.data("paddingtop")?parseInt(a.css("paddingTop"),0)||0:a.data("paddingtop"),i.paddingBottom=void 0===a.data("paddingbottom")?parseInt(a.css("paddingBottom"),0)||0:a.data("paddingbottom"),i.paddingLeft=void 0===a.data("paddingleft")?parseInt(a.css("paddingLeft"),0)||0:a.data("paddingleft"),i.paddingRight=void 0===a.data("paddingright")?parseInt(a.css("paddingRight"),0)||0:a.data("paddingright"),i.marginTop=void 0===a.data("margintop")?parseInt(a.css("marginTop"),0)||0:a.data("margintop"),i.marginBottom=void 0===a.data("marginbottom")?parseInt(a.css("marginBottom"),0)||0:a.data("marginbottom"),i.marginLeft=void 0===a.data("marginleft")?parseInt(a.css("marginLeft"),0)||0:a.data("marginleft"),i.marginRight=void 0===a.data("marginright")?parseInt(a.css("marginRight"),0)||0:a.data("marginright"),i.borderTopWidth=void 0===a.data("bordertopwidth")?parseInt(a.css("borderTopWidth"),0)||0:a.data("bordertopwidth"),i.borderBottomWidth=void 0===a.data("borderbottomwidth")?parseInt(a.css("borderBottomWidth"),0)||0:a.data("borderbottomwidth"),i.borderLeftWidth=void 0===a.data("borderleftwidth")?parseInt(a.css("borderLeftWidth"),0)||0:a.data("borderleftwidth"),i.borderRightWidth=void 0===a.data("borderrightwidth")?parseInt(a.css("borderRightWidth"),0)||0:a.data("borderrightwidth"),"rekursive"!=e){if(i.color=void 0===a.data("color")?"nopredefinedcolor":a.data("color"),i.whiteSpace=n?void 0===t.data("whitespace")?t.css("whiteSpace")||"nowrap":t.data("whitespace"):void 0===a.data("whitespace")?a.css("whiteSpace")||"nowrap":a.data("whitespace"),i.minWidth=void 0===a.data("width")?parseInt(a.css("minWidth"),0)||0:a.data("width"),i.minHeight=void 0===a.data("height")?parseInt(a.css("minHeight"),0)||0:a.data("height"),void 0!=a.data("videowidth")&&void 0!=a.data("videoheight")){var o=a.data("videowidth"),r=a.data("videoheight");o="100%"===o?"none":o,r="100%"===r?"none":r,a.data("width",o),a.data("height",r)}i.maxWidth=void 0===a.data("width")?parseInt(a.css("maxWidth"),0)||"none":a.data("width"),i.maxHeight=void 0===a.data("height")?parseInt(a.css("maxHeight"),0)||"none":a.data("height"),i.wan=void 0===a.data("wan")?parseInt(a.css("-webkit-transition"),0)||"none":a.data("wan"),i.moan=void 0===a.data("moan")?parseInt(a.css("-moz-animation-transition"),0)||"none":a.data("moan"),i.man=void 0===a.data("man")?parseInt(a.css("-ms-animation-transition"),0)||"none":a.data("man"),i.ani=void 0===a.data("ani")?parseInt(a.css("transition"),0)||"none":a.data("ani")}return i.styleProps=a.css(["background-color","border-top-color","border-bottom-color","border-right-color","border-left-color","border-top-style","border-bottom-style","border-left-style","border-right-style","border-left-width","border-right-width","border-bottom-width","border-top-width","color","text-decoration","font-style","border-radius"]),i},m=function(a,e){var t=new Object;return a&&jQuery.each(a,function(i,n){t[i]=p(n,e)[e.curWinRange]||a[i]}),t},u=function(a,e,t,i){return a=jQuery.isNumeric(a)?a*e+"px":a,a="full"===a?i:"auto"===a||"none"===a?t:a},v=function(a,e,t,i){var n;void 0===a.data("cssobj")?(n=g(a,t),a.data("cssobj",n)):n=a.data("cssobj");var o=m(n,e),r=e.bw,d=e.bh;if("off"===i&&(r=1,d=1),"auto"==o.lineHeight&&(o.lineHeight=o.fontSize+4),!a.hasClass("tp-splitted")){a.css("-webkit-transition","none"),a.css("-moz-transition","none"),a.css("-ms-transition","none"),a.css("transition","none");var s=void 0!==a.data("transform_hover")||void 0!==a.data("style_hover");if(s&&punchgs.TweenLite.set(a,o.styleProps),punchgs.TweenLite.set(a,{fontSize:Math.round(o.fontSize*r)+"px",fontWeight:o.fontWeight,letterSpacing:Math.floor(o.letterSpacing*r)+"px",paddingTop:Math.round(o.paddingTop*d)+"px",paddingBottom:Math.round(o.paddingBottom*d)+"px",paddingLeft:Math.round(o.paddingLeft*r)+"px",paddingRight:Math.round(o.paddingRight*r)+"px",marginTop:o.marginTop*d+"px",marginBottom:o.marginBottom*d+"px",marginLeft:o.marginLeft*r+"px",marginRight:o.marginRight*r+"px",borderTopWidth:Math.round(o.borderTopWidth*d)+"px",borderBottomWidth:Math.round(o.borderBottomWidth*d)+"px",borderLeftWidth:Math.round(o.borderLeftWidth*r)+"px",borderRightWidth:Math.round(o.borderRightWidth*r)+"px",lineHeight:Math.round(o.lineHeight*d)+"px",overwrite:"auto"}),"rekursive"!=t){var l="slide"==o.basealign?e.ulw:e.gridwidth[e.curWinRange],p="slide"==o.basealign?e.ulh:e.gridheight[e.curWinRange],h=u(o.maxWidth,r,"none",l),c=u(o.maxHeight,d,"none",p),v=u(o.minWidth,r,"0px",l),f=u(o.minHeight,d,"0px",p);punchgs.TweenLite.set(a,{maxWidth:h,maxHeight:c,minWidth:v,minHeight:f,whiteSpace:o.whiteSpace,overwrite:"auto"}),"nopredefinedcolor"!=o.color&&punchgs.TweenLite.set(a,{color:o.color,overwrite:"auto"})}setTimeout(function(){a.css("-webkit-transition",a.data("wan")),a.css("-moz-transition",a.data("moan")),a.css("-ms-transition",a.data("man")),a.css("transition",a.data("ani"))},30)}},f=function(a,e){if(a.hasClass("rs-pendulum")&&void 0==a.data("loop-timeline")){a.data("loop-timeline",new punchgs.TimelineLite);var t=void 0==a.data("startdeg")?-20:a.data("startdeg"),i=void 0==a.data("enddeg")?20:a.data("enddeg"),n=void 0==a.data("speed")?2:a.data("speed"),o=void 0==a.data("origin")?"50% 50%":a.data("origin"),r=void 0==a.data("easing")?punchgs.Power2.easeInOut:a.data("ease");t*=e,i*=e,a.data("loop-timeline").append(new punchgs.TweenLite.fromTo(a,n,{force3D:"auto",rotation:t,transformOrigin:o},{rotation:i,ease:r})),a.data("loop-timeline").append(new punchgs.TweenLite.fromTo(a,n,{force3D:"auto",rotation:i,transformOrigin:o},{rotation:t,ease:r,onComplete:function(){a.data("loop-timeline").restart()}}))}if(a.hasClass("rs-rotate")&&void 0==a.data("loop-timeline")){a.data("loop-timeline",new punchgs.TimelineLite);var t=void 0==a.data("startdeg")?0:a.data("startdeg"),i=void 0==a.data("enddeg")?360:a.data("enddeg");n=void 0==a.data("speed")?2:a.data("speed"),o=void 0==a.data("origin")?"50% 50%":a.data("origin"),r=void 0==a.data("easing")?punchgs.Power2.easeInOut:a.data("easing"),t*=e,i*=e,a.data("loop-timeline").append(new punchgs.TweenLite.fromTo(a,n,{force3D:"auto",rotation:t,transformOrigin:o},{rotation:i,ease:r,onComplete:function(){a.data("loop-timeline").restart()}}))}if(a.hasClass("rs-slideloop")&&void 0==a.data("loop-timeline")){a.data("loop-timeline",new punchgs.TimelineLite);var d=void 0==a.data("xs")?0:a.data("xs"),s=void 0==a.data("ys")?0:a.data("ys"),l=void 0==a.data("xe")?0:a.data("xe"),p=void 0==a.data("ye")?0:a.data("ye"),n=void 0==a.data("speed")?2:a.data("speed"),r=void 0==a.data("easing")?punchgs.Power2.easeInOut:a.data("easing");d*=e,s*=e,l*=e,p*=e,a.data("loop-timeline").append(new punchgs.TweenLite.fromTo(a,n,{force3D:"auto",x:d,y:s},{x:l,y:p,ease:r})),a.data("loop-timeline").append(new punchgs.TweenLite.fromTo(a,n,{force3D:"auto",x:l,y:p},{x:d,y:s,onComplete:function(){a.data("loop-timeline").restart()}}))}if(a.hasClass("rs-pulse")&&void 0==a.data("loop-timeline")){a.data("loop-timeline",new punchgs.TimelineLite);var h=void 0==a.data("zoomstart")?0:a.data("zoomstart"),c=void 0==a.data("zoomend")?0:a.data("zoomend"),n=void 0==a.data("speed")?2:a.data("speed"),r=void 0==a.data("easing")?punchgs.Power2.easeInOut:a.data("easing");a.data("loop-timeline").append(new punchgs.TweenLite.fromTo(a,n,{force3D:"auto",scale:h},{scale:c,ease:r})),a.data("loop-timeline").append(new punchgs.TweenLite.fromTo(a,n,{force3D:"auto",scale:c},{scale:h,onComplete:function(){a.data("loop-timeline").restart()}}))}if(a.hasClass("rs-wave")&&void 0==a.data("loop-timeline")){a.data("loop-timeline",new punchgs.TimelineLite);var g=void 0==a.data("angle")?10:parseInt(a.data("angle"),0),m=void 0==a.data("radius")?10:parseInt(a.data("radius"),0),n=void 0==a.data("speed")?-20:a.data("speed"),o=void 0==a.data("origin")?"50% 50%":a.data("origin"),u=o.split(" "),v=new Object;u.length>=1?(v.x=u[0],v.y=u[1]):(v.x="50%",v.y="50%"),g*=e,m*=e;var f=0-a.height()/2+m*(-1+parseInt(v.y,0)/100),w=a.width()*(-.5+parseInt(v.x,0)/100),y={a:0,ang:g,element:a,unit:m,xoffset:w,yoffset:f};a.data("loop-timeline").append(new punchgs.TweenLite.fromTo(y,n,{a:360},{a:0,force3D:"auto",ease:punchgs.Linear.easeNone,onUpdate:function(){var a=y.a*(Math.PI/180);punchgs.TweenLite.to(y.element,.1,{force3D:"auto",x:y.xoffset+Math.cos(a)*y.unit,y:y.yoffset+y.unit*(1-Math.sin(a))})},onComplete:function(){a.data("loop-timeline").restart()}}))}},w=function(a){a.find(".rs-pendulum, .rs-slideloop, .rs-pulse, .rs-wave").each(function(){var a=jQuery(this);void 0!=a.data("loop-timeline")&&(a.data("loop-timeline").pause(),a.data("loop-timeline",null))})}}(jQuery);
/*****************************************************************************************************
 * jquery.themepunch.revmigrate.js - jQuery Plugin for Revolution Slider Migration from 4.x to 5.0   
 * @version: 1.0.1 (18.08.2015)
 * @requires jQuery v1.7 or later (tested on 1.9)
 * @author ThemePunch
*****************************************************************************************************/
!function(){var t=jQuery.fn.revolution;jQuery.extend(!0,t,{migration:function(t,e){return e=a(e),o(t,e),e}});var a=function(t){if(t.parallaxLevels||t.parallaxBgFreeze){var a=new Object;a.type=t.parallax,a.levels=t.parallaxLevels,a.bgparallax="on"==t.parallaxBgFreeze?"off":"on",a.disable_onmobile=t.parallaxDisableOnMobile,t.parallax=a}if(void 0===t.disableProgressBar&&(t.disableProgressBar=t.hideTimerBar||"off"),(t.startwidth||t.startheight)&&(t.gridwidth=t.startwidth,t.gridheight=t.startheight),void 0===t.sliderType&&(t.sliderType="standard"),"on"===t.fullScreen&&(t.sliderLayout="fullscreen"),"on"===t.fullWidth&&(t.sliderLayout="fullwidth"),void 0===t.sliderLayout&&(t.sliderLayout="auto"),void 0===t.navigation){var o=new Object;if("solo"==t.navigationArrows||"nextto"==t.navigationArrows){var e=new Object;e.enable=!0,e.style=t.navigationStyle||"",e.hide_onmobile="on"===t.hideArrowsOnMobile?!0:!1,e.hide_onleave=t.hideThumbs>0?!0:!1,e.hide_delay=t.hideThumbs>0?t.hideThumbs:200,e.hide_delay_mobile=t.hideNavDelayOnMobile||1500,e.hide_under=0,e.tmp="",e.left={h_align:t.soloArrowLeftHalign,v_align:t.soloArrowLeftValign,h_offset:t.soloArrowLeftHOffset,v_offset:t.soloArrowLeftVOffset},e.right={h_align:t.soloArrowRightHalign,v_align:t.soloArrowRightValign,h_offset:t.soloArrowRightHOffset,v_offset:t.soloArrowRightVOffset},o.arrows=e}if("bullet"==t.navigationType){var r=new Object;r.style=t.navigationStyle||"",r.enable=!0,r.hide_onmobile="on"===t.hideArrowsOnMobile?!0:!1,r.hide_onleave=t.hideThumbs>0?!0:!1,r.hide_delay=t.hideThumbs>0?t.hideThumbs:200,r.hide_delay_mobile=t.hideNavDelayOnMobile||1500,r.hide_under=0,r.direction="horizontal",r.h_align=t.navigationHAlign||"center",r.v_align=t.navigationVAlign||"bottom",r.space=5,r.h_offset=t.navigationHOffset||0,r.v_offset=t.navigationVOffset||20,r.tmp='<span class="tp-bullet-image"></span><span class="tp-bullet-title"></span>',o.bullets=r}if("thumb"==t.navigationType){var i=new Object;i.style=t.navigationStyle||"",i.enable=!0,i.width=t.thumbWidth||100,i.height=t.thumbHeight||50,i.min_width=t.thumbWidth||100,i.wrapper_padding=2,i.wrapper_color="#f5f5f5",i.wrapper_opacity=1,i.visibleAmount=t.thumbAmount||3,i.hide_onmobile="on"===t.hideArrowsOnMobile?!0:!1,i.hide_onleave=t.hideThumbs>0?!0:!1,i.hide_delay=t.hideThumbs>0?t.hideThumbs:200,i.hide_delay_mobile=t.hideNavDelayOnMobile||1500,i.hide_under=0,i.direction="horizontal",i.span=!1,i.position="inner",i.space=2,i.h_align=t.navigationHAlign||"center",i.v_align=t.navigationVAlign||"bottom",i.h_offset=t.navigationHOffset||0,i.v_offset=t.navigationVOffset||20,i.tmp='<span class="tp-thumb-image"></span><span class="tp-thumb-title"></span>',o.thumbnails=i}t.navigation=o,t.navigation.keyboardNavigation=t.keyboardNavigation||"on",t.navigation.onHoverStop=t.onHoverStop||"on",t.navigation.touch={touchenabled:t.touchenabled||"on",swipe_treshold:t.swipe_treshold||75,swipe_min_touches:t.swipe_min_touches||1,drag_block_vertical:t.drag_block_vertical||!1}}return t.fallbacks={isJoomla:t.isJoomla||!1,panZoomDisableOnMobile:t.parallaxDisableOnMobile||"off",simplifyAll:t.simplifyAll||"on",nextSlideOnWindowFocus:t.nextSlideOnWindowFocus||"off",disableFocusListener:t.disableFocusListener||!0},t},o=function(t){var a=new Object,o=t.width(),e=t.height();a.skewfromleftshort="x:-50;skX:85;o:0",a.skewfromrightshort="x:50;skX:-85;o:0",a.sfl="x:-50;o:0",a.sfr="x:50;o:0",a.sft="y:-50;o:0",a.sfb="y:50;o:0",a.skewfromleft="x:top;skX:85;o:0",a.skewfromright="x:bottom;skX:-85;o:0",a.lfl="x:top;o:0",a.lfr="x:bottom;o:0",a.lft="y:left;o:0",a.lfb="y:right;o:0",a.fade="o:0";720*Math.random()-360;t.find(".tp-caption").each(function(){var t=jQuery(this),r=(2*Math.random()*o-o,2*Math.random()*e-e,3*Math.random(),720*Math.random()-360,70*Math.random()-35,70*Math.random()-35,t.attr("class"));a.randomrotate="x:{-400,400};y:{-400,400};sX:{0,2};sY:{0,2};rZ:{-180,180};rX:{-180,180};rY:{-180,180};o:0;",r.match("randomrotate")?t.data("transform_in",a.randomrotate):r.match(/\blfl\b/)?t.data("transform_in",a.lfl):r.match(/\blfr\b/)?t.data("transform_in",a.lfr):r.match(/\blft\b/)?t.data("transform_in",a.lft):r.match(/\blfb\b/)?t.data("transform_in",a.lfb):r.match(/\bsfl\b/)?t.data("transform_in",a.sfl):r.match(/\bsfr\b/)?t.data("transform_in",a.sfr):r.match(/\bsft\b/)?t.data("transform_in",a.sft):r.match(/\bsfb\b/)?t.data("transform_in",a.sfb):r.match(/\bskewfromleftshort\b/)?t.data("transform_in",a.skewfromleftshort):r.match(/\bskewfromrightshort\b/)?t.data("transform_in",a.skewfromrightshort):r.match(/\bskewfromleft\b/)?t.data("transform_in",a.skewfromleft):r.match(/\bskewfromright\b/)?t.data("transform_in",a.skewfromright):r.match(/\bfade\b/)&&t.data("transform_in",a.fade),r.match(/\brandomrotateout\b/)?t.data("transform_out",a.randomrotate):r.match(/\bltl\b/)?t.data("transform_out",a.lfl):r.match(/\bltr\b/)?t.data("transform_out",a.lfr):r.match(/\bltt\b/)?t.data("transform_out",a.lft):r.match(/\bltb\b/)?t.data("transform_out",a.lfb):r.match(/\bstl\b/)?t.data("transform_out",a.sfl):r.match(/\bstr\b/)?t.data("transform_out",a.sfr):r.match(/\bstt\b/)?t.data("transform_out",a.sft):r.match(/\bstb\b/)?t.data("transform_out",a.sfb):r.match(/\bskewtoleftshortout\b/)?t.data("transform_out",a.skewfromleftshort):r.match(/\bskewtorightshortout\b/)?t.data("transform_out",a.skewfromrightshort):r.match(/\bskewtoleftout\b/)?t.data("transform_out",a.skewfromleft):r.match(/\bskewtorightout\b/)?t.data("transform_out",a.skewfromright):r.match(/\bfadeout\b/)&&t.data("transform_out",a.fade),void 0!=t.data("customin")&&t.data("transform_in",t.data("customin")),void 0!=t.data("customout")&&t.data("transform_out",t.data("customout"))})}}(jQuery);
/********************************************
 * REVOLUTION 5.1.5 EXTENSION - NAVIGATION
 * @version: 1.1 (04.01.2016)
 * @requires jquery.themepunch.revolution.js
 * @author ThemePunch
*********************************************/
!function(t){var e=jQuery.fn.revolution,i=e.is_mobile();jQuery.extend(!0,e,{hideUnHideNav:function(t){var e=t.c.width(),i=t.navigation.arrows,a=t.navigation.bullets,n=t.navigation.thumbnails,s=t.navigation.tabs;p(i)&&T(t.c.find(".tparrows"),i.hide_under,e,i.hide_over),p(a)&&T(t.c.find(".tp-bullets"),a.hide_under,e,a.hide_over),p(n)&&T(t.c.parent().find(".tp-thumbs"),n.hide_under,e,n.hide_over),p(s)&&T(t.c.parent().find(".tp-tabs"),s.hide_under,e,s.hide_over),y(t)},resizeThumbsTabs:function(t,e){if(t.navigation&&t.navigation.tabs.enable||t.navigation&&t.navigation.thumbnails.enable){var i=(jQuery(window).width()-480)/500,a=new punchgs.TimelineLite,s=t.navigation.tabs,r=t.navigation.thumbnails,o=t.navigation.bullets;if(a.pause(),i=i>1?1:0>i?0:i,p(s)&&(e||s.width>s.min_width)&&n(i,a,t.c,s,t.slideamount,"tab"),p(r)&&(e||r.width>r.min_width)&&n(i,a,t.c,r,t.slideamount,"thumb"),p(o)&&e){var d=t.c.find(".tp-bullets");d.find(".tp-bullet").each(function(t){var e=jQuery(this),i=t+1,a=e.outerWidth()+parseInt(void 0===o.space?0:o.space,0),n=e.outerHeight()+parseInt(void 0===o.space?0:o.space,0);"vertical"===o.direction?(e.css({top:(i-1)*n+"px",left:"0px"}),d.css({height:(i-1)*n+e.outerHeight(),width:e.outerWidth()})):(e.css({left:(i-1)*a+"px",top:"0px"}),d.css({width:(i-1)*a+e.outerWidth(),height:e.outerHeight()}))})}a.play(),y(t)}return!0},updateNavIndexes:function(t){function i(t){a.find(t).lenght>0&&a.find(t).each(function(t){jQuery(this).data("liindex",t)})}var a=t.c;i(".tp-tab"),i(".tp-bullet"),i(".tp-thumb"),e.resizeThumbsTabs(t,!0),e.manageNavigation(t)},manageNavigation:function(t){var i=e.getHorizontalOffset(t.c.parent(),"left"),n=e.getHorizontalOffset(t.c.parent(),"right");p(t.navigation.bullets)&&("fullscreen"!=t.sliderLayout&&"fullwidth"!=t.sliderLayout&&(t.navigation.bullets.h_offset_old=void 0===t.navigation.bullets.h_offset_old?t.navigation.bullets.h_offset:t.navigation.bullets.h_offset_old,t.navigation.bullets.h_offset="center"===t.navigation.bullets.h_align?t.navigation.bullets.h_offset_old+i/2-n/2:t.navigation.bullets.h_offset_old+i-n),b(t.c.find(".tp-bullets"),t.navigation.bullets)),p(t.navigation.thumbnails)&&b(t.c.parent().find(".tp-thumbs"),t.navigation.thumbnails),p(t.navigation.tabs)&&b(t.c.parent().find(".tp-tabs"),t.navigation.tabs),p(t.navigation.arrows)&&("fullscreen"!=t.sliderLayout&&"fullwidth"!=t.sliderLayout&&(t.navigation.arrows.left.h_offset_old=void 0===t.navigation.arrows.left.h_offset_old?t.navigation.arrows.left.h_offset:t.navigation.arrows.left.h_offset_old,t.navigation.arrows.left.h_offset="right"===t.navigation.arrows.left.h_align?t.navigation.arrows.left.h_offset_old+n:t.navigation.arrows.left.h_offset_old+i,t.navigation.arrows.right.h_offset_old=void 0===t.navigation.arrows.right.h_offset_old?t.navigation.arrows.right.h_offset:t.navigation.arrows.right.h_offset_old,t.navigation.arrows.right.h_offset="right"===t.navigation.arrows.right.h_align?t.navigation.arrows.right.h_offset_old+n:t.navigation.arrows.right.h_offset_old+i),b(t.c.find(".tp-leftarrow.tparrows"),t.navigation.arrows.left),b(t.c.find(".tp-rightarrow.tparrows"),t.navigation.arrows.right)),p(t.navigation.thumbnails)&&a(t.c.parent().find(".tp-thumbs"),t.navigation.thumbnails),p(t.navigation.tabs)&&a(t.c.parent().find(".tp-tabs"),t.navigation.tabs)},createNavigation:function(t,e){var n=t.parent(),s=e.navigation.arrows,d=e.navigation.bullets,u=e.navigation.thumbnails,v=e.navigation.tabs,m=p(s),b=p(d),_=p(u),y=p(v);r(t,e),o(t,e),m&&f(t,s,e),e.li.each(function(i){var a=jQuery(this);b&&w(t,d,a,e),_&&x(t,u,a,"tp-thumb",e),y&&x(t,v,a,"tp-tab",e)}),t.bind("revolution.slide.onafterswap revolution.nextslide.waiting",function(){var i=0==t.find(".next-revslide").length?t.find(".active-revslide").data("index"):t.find(".next-revslide").data("index");t.find(".tp-bullet").each(function(){var t=jQuery(this);t.data("liref")===i?t.addClass("selected"):t.removeClass("selected")}),n.find(".tp-thumb, .tp-tab").each(function(){var t=jQuery(this);t.data("liref")===i?(t.addClass("selected"),t.hasClass("tp-tab")?a(n.find(".tp-tabs"),v):a(n.find(".tp-thumbs"),u)):t.removeClass("selected")});var r=0,o=!1;e.thumbs&&jQuery.each(e.thumbs,function(t,e){r=o===!1?t:r,o=e.id===i||t===i?!0:o});var d=r>0?r-1:e.slideamount-1,l=r+1==e.slideamount?0:r+1;if(s.enable===!0){var h=s.tmp;jQuery.each(e.thumbs[d].params,function(t,e){h=h.replace(e.from,e.to)}),s.left.j.html(h),h=s.tmp,jQuery.each(e.thumbs[l].params,function(t,e){h=h.replace(e.from,e.to)}),s.right.j.html(h),punchgs.TweenLite.set(s.left.j.find(".tp-arr-imgholder"),{backgroundImage:"url("+e.thumbs[d].src+")"}),punchgs.TweenLite.set(s.right.j.find(".tp-arr-imgholder"),{backgroundImage:"url("+e.thumbs[l].src+")"})}}),h(s),h(d),h(u),h(v),n.on("mouseenter mousemove",function(){n.hasClass("tp-mouseover")||(n.addClass("tp-mouseover"),punchgs.TweenLite.killDelayedCallsTo(g),m&&s.hide_onleave&&g(n.find(".tparrows"),s,"show"),b&&d.hide_onleave&&g(n.find(".tp-bullets"),d,"show"),_&&u.hide_onleave&&g(n.find(".tp-thumbs"),u,"show"),y&&v.hide_onleave&&g(n.find(".tp-tabs"),v,"show"),i&&(n.removeClass("tp-mouseover"),c(t,e)))}),n.on("mouseleave",function(){n.removeClass("tp-mouseover"),c(t,e)}),m&&s.hide_onleave&&g(n.find(".tparrows"),s,"hide",0),b&&d.hide_onleave&&g(n.find(".tp-bullets"),d,"hide",0),_&&u.hide_onleave&&g(n.find(".tp-thumbs"),u,"hide",0),y&&v.hide_onleave&&g(n.find(".tp-tabs"),v,"hide",0),_&&l(n.find(".tp-thumbs"),e),y&&l(n.find(".tp-tabs"),e),"carousel"===e.sliderType&&l(t,e,!0),"on"==e.navigation.touch.touchenabled&&l(t,e,"swipebased")}});var a=function(t,e){var i=(t.hasClass("tp-thumbs")?".tp-thumbs":".tp-tabs",t.hasClass("tp-thumbs")?".tp-thumb-mask":".tp-tab-mask"),a=t.hasClass("tp-thumbs")?".tp-thumbs-inner-wrapper":".tp-tabs-inner-wrapper",n=t.hasClass("tp-thumbs")?".tp-thumb":".tp-tab",s=t.find(i),r=s.find(a),o=e.direction,d="vertical"===o?s.find(n).first().outerHeight(!0)+e.space:s.find(n).first().outerWidth(!0)+e.space,l="vertical"===o?s.height():s.width(),h=parseInt(s.find(n+".selected").data("liindex"),0),p=l/d,u="vertical"===o?s.height():s.width(),c=0-h*d,g="vertical"===o?r.height():r.width(),f=0-(g-u)>c?0-(g-u):f>0?0:c,v=r.data("offset");p>2&&(f=0>=c-(v+d)?0-d>c-(v+d)?v:f+d:f,f=d>c-d+v+l&&c+(Math.round(p)-2)*d<v?c+(Math.round(p)-2)*d:f),f=0-(g-u)>f?0-(g-u):f>0?0:f,"vertical"!==o&&s.width()>=r.width()&&(f=0),"vertical"===o&&s.height()>=r.height()&&(f=0),t.hasClass("dragged")||("vertical"===o?r.data("tmmove",punchgs.TweenLite.to(r,.5,{top:f+"px",ease:punchgs.Power3.easeInOut})):r.data("tmmove",punchgs.TweenLite.to(r,.5,{left:f+"px",ease:punchgs.Power3.easeInOut})),r.data("offset",f))},n=function(t,e,i,a,n,s){var r=i.parent().find(".tp-"+s+"s"),o=r.find(".tp-"+s+"s-inner-wrapper"),d=r.find(".tp-"+s+"-mask"),l=a.width*t<a.min_width?a.min_width:Math.round(a.width*t),h=Math.round(l/a.width*a.height),p="vertical"===a.direction?l:l*n+a.space*(n-1),u="vertical"===a.direction?h*n+a.space*(n-1):h,c="vertical"===a.direction?{width:l+"px"}:{height:h+"px"};e.add(punchgs.TweenLite.set(r,c)),e.add(punchgs.TweenLite.set(o,{width:p+"px",height:u+"px"})),e.add(punchgs.TweenLite.set(d,{width:p+"px",height:u+"px"}));var g=o.find(".tp-"+s);return g&&jQuery.each(g,function(t,i){"vertical"===a.direction?e.add(punchgs.TweenLite.set(i,{top:t*(h+parseInt(void 0===a.space?0:a.space,0)),width:l+"px",height:h+"px"})):"horizontal"===a.direction&&e.add(punchgs.TweenLite.set(i,{left:t*(l+parseInt(void 0===a.space?0:a.space,0)),width:l+"px",height:h+"px"}))}),e},s=function(t){var e=0,i=0,a=0,n=0,s=1,r=1,o=1;return"detail"in t&&(i=t.detail),"wheelDelta"in t&&(i=-t.wheelDelta/120),"wheelDeltaY"in t&&(i=-t.wheelDeltaY/120),"wheelDeltaX"in t&&(e=-t.wheelDeltaX/120),"axis"in t&&t.axis===t.HORIZONTAL_AXIS&&(e=i,i=0),a=e*s,n=i*s,"deltaY"in t&&(n=t.deltaY),"deltaX"in t&&(a=t.deltaX),(a||n)&&t.deltaMode&&(1==t.deltaMode?(a*=r,n*=r):(a*=o,n*=o)),a&&!e&&(e=1>a?-1:1),n&&!i&&(i=1>n?-1:1),n=navigator.userAgent.match(/mozilla/i)?10*n:n,(n>300||-300>n)&&(n/=10),{spinX:e,spinY:i,pixelX:a,pixelY:n}},r=function(t,i){"on"===i.navigation.keyboardNavigation&&jQuery(document).keydown(function(a){("horizontal"==i.navigation.keyboard_direction&&39==a.keyCode||"vertical"==i.navigation.keyboard_direction&&40==a.keyCode)&&(i.sc_indicator="arrow",i.sc_indicator_dir=0,e.callingNewSlide(i,t,1)),("horizontal"==i.navigation.keyboard_direction&&37==a.keyCode||"vertical"==i.navigation.keyboard_direction&&38==a.keyCode)&&(i.sc_indicator="arrow",i.sc_indicator_dir=1,e.callingNewSlide(i,t,-1))})},o=function(t,i){if("on"===i.navigation.mouseScrollNavigation||"carousel"===i.navigation.mouseScrollNavigation){i.isIEEleven=!!navigator.userAgent.match(/Trident.*rv\:11\./),i.isSafari=!!navigator.userAgent.match(/safari/i),i.ischrome=!!navigator.userAgent.match(/chrome/i);var a=i.ischrome?-49:i.isIEEleven||i.isSafari?-9:navigator.userAgent.match(/mozilla/i)?-29:-49,n=i.ischrome?49:i.isIEEleven||i.isSafari?9:navigator.userAgent.match(/mozilla/i)?29:49;t.on("mousewheel DOMMouseScroll",function(r){var o=s(r.originalEvent),d=t.find(".tp-revslider-slidesli.active-revslide").index(),l=t.find(".tp-revslider-slidesli.processing-revslide").index(),h=-1!=d&&0==d||-1!=l&&0==l?!0:!1,p=-1!=d&&d==i.slideamount-1||1!=l&&l==i.slideamount-1?!0:!1,u=!0;return"carousel"==i.navigation.mouseScrollNavigation&&(h=p=!1),-1==l?o.pixelY<a?h||(i.sc_indicator="arrow",i.sc_indicator_dir=0,e.callingNewSlide(i,t,-1),u=!1):o.pixelY>n&&(p||(i.sc_indicator="arrow",i.sc_indicator_dir=1,e.callingNewSlide(i,t,1),u=!1)):u=!p&&o.spinY>0||!h&&o.spinY<=0?!1:!0,0==u?(r.preventDefault(r),!1):void 0})}},d=function(t,e,a){return t=i?jQuery(a.target).closest("."+t).length||jQuery(a.srcElement).closest("."+t).length:jQuery(a.toElement).closest("."+t).length||jQuery(a.originalTarget).closest("."+t).length,t===!0||1===t?1:0},l=function(t,a,n){t.data("opt",a);var s=a.carousel;jQuery(".bullet, .bullets, .tp-bullets, .tparrows").addClass("noSwipe"),s.Limit="endless";var r=(i||"Firefox"===e.get_browser(),t),o="vertical"===a.navigation.thumbnails.direction||"vertical"===a.navigation.tabs.direction?"none":"vertical",l=a.navigation.touch.swipe_direction||"horizontal";o="swipebased"==n&&"vertical"==l?"none":n?"vertical":o,jQuery.fn.swipetp||(jQuery.fn.swipetp=jQuery.fn.swipe),jQuery.fn.swipetp.defaults&&jQuery.fn.swipetp.defaults.excludedElements||jQuery.fn.swipetp.defaults||(jQuery.fn.swipetp.defaults=new Object),jQuery.fn.swipetp.defaults.excludedElements="label, button, input, select, textarea, .noSwipe",r.swipetp({allowPageScroll:o,triggerOnTouchLeave:!0,treshold:a.navigation.touch.swipe_treshold,fingers:a.navigation.touch.swipe_min_touches,excludeElements:jQuery.fn.swipetp.defaults.excludedElements,swipeStatus:function(i,n,r,o,h,p,u){var c=d("rev_slider_wrapper",t,i),g=d("tp-thumbs",t,i),f=d("tp-tabs",t,i),v=jQuery(this).attr("class"),m=v.match(/tp-tabs|tp-thumb/gi)?!0:!1;if("carousel"===a.sliderType&&(("move"===n||"end"===n||"cancel"==n)&&a.dragStartedOverSlider&&!a.dragStartedOverThumbs&&!a.dragStartedOverTabs||"start"===n&&c>0&&0===g&&0===f))switch(a.dragStartedOverSlider=!0,o=r&&r.match(/left|up/g)?Math.round(-1*o):o=Math.round(1*o),n){case"start":void 0!==s.positionanim&&(s.positionanim.kill(),s.slide_globaloffset="off"===s.infinity?s.slide_offset:e.simp(s.slide_offset,s.maxwidth)),s.overpull="none",s.wrap.addClass("dragged");break;case"move":if(s.slide_offset="off"===s.infinity?s.slide_globaloffset+o:e.simp(s.slide_globaloffset+o,s.maxwidth),"off"===s.infinity){var b="center"===s.horizontal_align?(s.wrapwidth/2-s.slide_width/2-s.slide_offset)/s.slide_width:(0-s.slide_offset)/s.slide_width;"none"!==s.overpull&&0!==s.overpull||!(0>b||b>a.slideamount-1)?b>=0&&b<=a.slideamount-1&&(b>=0&&o>s.overpull||b<=a.slideamount-1&&o<s.overpull)&&(s.overpull=0):s.overpull=o,s.slide_offset=0>b?s.slide_offset+(s.overpull-o)/1.1+Math.sqrt(Math.abs((s.overpull-o)/1.1)):b>a.slideamount-1?s.slide_offset+(s.overpull-o)/1.1-Math.sqrt(Math.abs((s.overpull-o)/1.1)):s.slide_offset}e.organiseCarousel(a,r,!0,!0);break;case"end":case"cancel":s.slide_globaloffset=s.slide_offset,s.wrap.removeClass("dragged"),e.carouselToEvalPosition(a,r),a.dragStartedOverSlider=!1,a.dragStartedOverThumbs=!1,a.dragStartedOverTabs=!1}else{if(("move"!==n&&"end"!==n&&"cancel"!=n||a.dragStartedOverSlider||!a.dragStartedOverThumbs&&!a.dragStartedOverTabs)&&!("start"===n&&c>0&&(g>0||f>0))){if("end"==n&&!m){if(a.sc_indicator="arrow","horizontal"==l&&"left"==r||"vertical"==l&&"up"==r)return a.sc_indicator_dir=0,e.callingNewSlide(a,a.c,1),!1;if("horizontal"==l&&"right"==r||"vertical"==l&&"down"==r)return a.sc_indicator_dir=1,e.callingNewSlide(a,a.c,-1),!1}return a.dragStartedOverSlider=!1,a.dragStartedOverThumbs=!1,a.dragStartedOverTabs=!1,!0}g>0&&(a.dragStartedOverThumbs=!0),f>0&&(a.dragStartedOverTabs=!0);var w=a.dragStartedOverThumbs?".tp-thumbs":".tp-tabs",_=a.dragStartedOverThumbs?".tp-thumb-mask":".tp-tab-mask",x=a.dragStartedOverThumbs?".tp-thumbs-inner-wrapper":".tp-tabs-inner-wrapper",y=a.dragStartedOverThumbs?".tp-thumb":".tp-tab",T=a.dragStartedOverThumbs?a.navigation.thumbnails:a.navigation.tabs;o=r&&r.match(/left|up/g)?Math.round(-1*o):o=Math.round(1*o);var j=t.parent().find(_),L=j.find(x),S=T.direction,C="vertical"===S?L.height():L.width(),I="vertical"===S?j.height():j.width(),k="vertical"===S?j.find(y).first().outerHeight(!0)+T.space:j.find(y).first().outerWidth(!0)+T.space,O=void 0===L.data("offset")?0:parseInt(L.data("offset"),0),Q=0;switch(n){case"start":t.parent().find(w).addClass("dragged"),O="vertical"===S?L.position().top:L.position().left,L.data("offset",O),L.data("tmmove")&&L.data("tmmove").pause();break;case"move":if(I>=C)return!1;Q=O+o,Q=Q>0?"horizontal"===S?Q-L.width()*(Q/L.width()*Q/L.width()):Q-L.height()*(Q/L.height()*Q/L.height()):Q;var M="vertical"===S?0-(L.height()-j.height()):0-(L.width()-j.width());Q=M>Q?"horizontal"===S?Q+L.width()*(Q-M)/L.width()*(Q-M)/L.width():Q+L.height()*(Q-M)/L.height()*(Q-M)/L.height():Q,"vertical"===S?punchgs.TweenLite.set(L,{top:Q+"px"}):punchgs.TweenLite.set(L,{left:Q+"px"});break;case"end":case"cancel":if(m)return Q=O+o,Q="vertical"===S?Q<0-(L.height()-j.height())?0-(L.height()-j.height()):Q:Q<0-(L.width()-j.width())?0-(L.width()-j.width()):Q,Q=Q>0?0:Q,Q=Math.abs(o)>k/10?0>=o?Math.floor(Q/k)*k:Math.ceil(Q/k)*k:0>o?Math.ceil(Q/k)*k:Math.floor(Q/k)*k,Q="vertical"===S?Q<0-(L.height()-j.height())?0-(L.height()-j.height()):Q:Q<0-(L.width()-j.width())?0-(L.width()-j.width()):Q,Q=Q>0?0:Q,"vertical"===S?punchgs.TweenLite.to(L,.5,{top:Q+"px",ease:punchgs.Power3.easeOut}):punchgs.TweenLite.to(L,.5,{left:Q+"px",ease:punchgs.Power3.easeOut}),Q=Q?Q:"vertical"===S?L.position().top:L.position().left,L.data("offset",Q),L.data("distance",o),setTimeout(function(){a.dragStartedOverSlider=!1,a.dragStartedOverThumbs=!1,a.dragStartedOverTabs=!1},100),t.parent().find(w).removeClass("dragged"),!1}}}})},h=function(t){t.hide_delay=jQuery.isNumeric(parseInt(t.hide_delay,0))?t.hide_delay/1e3:.2,t.hide_delay_mobile=jQuery.isNumeric(parseInt(t.hide_delay_mobile,0))?t.hide_delay_mobile/1e3:.2},p=function(t){return t&&t.enable},u=function(t){return t&&t.enable&&t.hide_onleave===!0&&(void 0===t.position?!0:!t.position.match(/outer/g))},c=function(t,e){var a=t.parent();u(e.navigation.arrows)&&punchgs.TweenLite.delayedCall(i?e.navigation.arrows.hide_delay_mobile:e.navigation.arrows.hide_delay,g,[a.find(".tparrows"),e.navigation.arrows,"hide"]),u(e.navigation.bullets)&&punchgs.TweenLite.delayedCall(i?e.navigation.bullets.hide_delay_mobile:e.navigation.bullets.hide_delay,g,[a.find(".tp-bullets"),e.navigation.bullets,"hide"]),u(e.navigation.thumbnails)&&punchgs.TweenLite.delayedCall(i?e.navigation.thumbnails.hide_delay_mobile:e.navigation.thumbnails.hide_delay,g,[a.find(".tp-thumbs"),e.navigation.thumbnails,"hide"]),u(e.navigation.tabs)&&punchgs.TweenLite.delayedCall(i?e.navigation.tabs.hide_delay_mobile:e.navigation.tabs.hide_delay,g,[a.find(".tp-tabs"),e.navigation.tabs,"hide"])},g=function(t,e,i,a){switch(a=void 0===a?.5:a,i){case"show":punchgs.TweenLite.to(t,a,{autoAlpha:1,ease:punchgs.Power3.easeInOut,overwrite:"auto"});break;case"hide":punchgs.TweenLite.to(t,a,{autoAlpha:0,ease:punchgs.Power3.easeInOu,overwrite:"auto"})}},f=function(t,e,i){e.style=void 0===e.style?"":e.style,e.left.style=void 0===e.left.style?"":e.left.style,e.right.style=void 0===e.right.style?"":e.right.style,0===t.find(".tp-leftarrow.tparrows").length&&t.append('<div class="tp-leftarrow tparrows '+e.style+" "+e.left.style+'">'+e.tmp+"</div>"),0===t.find(".tp-rightarrow.tparrows").length&&t.append('<div class="tp-rightarrow tparrows '+e.style+" "+e.right.style+'">'+e.tmp+"</div>");var a=t.find(".tp-leftarrow.tparrows"),n=t.find(".tp-rightarrow.tparrows");n.click(function(){i.sc_indicator="arrow",i.sc_indicator_dir=0,t.revnext()}),a.click(function(){i.sc_indicator="arrow",i.sc_indicator_dir=1,t.revprev()}),e.right.j=t.find(".tp-rightarrow.tparrows"),e.left.j=t.find(".tp-leftarrow.tparrows"),e.padding_top=parseInt(i.carousel.padding_top||0,0),e.padding_bottom=parseInt(i.carousel.padding_bottom||0,0),b(a,e.left),b(n,e.right),("outer-left"==e.position||"outer-right"==e.position)&&(i.outernav=!0)},v=function(t,e){var i=t.outerHeight(!0),a=(t.outerWidth(!0),"top"===e.v_align?{top:"0px",y:Math.round(e.v_offset)+"px"}:"center"===e.v_align?{top:"50%",y:Math.round(0-i/2+e.v_offset)+"px"}:{top:"100%",y:Math.round(0-(i+e.v_offset))+"px"});t.hasClass("outer-bottom")||punchgs.TweenLite.set(t,a)},m=function(t,e){var i=(t.outerHeight(!0),t.outerWidth(!0)),a="left"===e.h_align?{left:"0px",x:Math.round(e.h_offset)+"px"}:"center"===e.h_align?{left:"50%",x:Math.round(0-i/2+e.h_offset)+"px"}:{left:"100%",x:Math.round(0-(i+e.h_offset))+"px"};punchgs.TweenLite.set(t,a)},b=function(t,e){var i=t.closest(".tp-simpleresponsive").length>0?t.closest(".tp-simpleresponsive"):t.closest(".tp-revslider-mainul").length>0?t.closest(".tp-revslider-mainul"):t.closest(".rev_slider_wrapper").length>0?t.closest(".rev_slider_wrapper"):t.parent().find(".tp-revslider-mainul"),a=i.width(),n=i.height();if(v(t,e),m(t,e),"outer-left"!==e.position||"fullwidth"!=e.sliderLayout&&"fullscreen"!=e.sliderLayout?"outer-right"!==e.position||"fullwidth"!=e.sliderLayout&&"fullscreen"!=e.sliderLayout||punchgs.TweenLite.set(t,{right:0-t.outerWidth()+"px",x:e.h_offset+"px"}):punchgs.TweenLite.set(t,{left:0-t.outerWidth()+"px",x:e.h_offset+"px"}),t.hasClass("tp-thumbs")||t.hasClass("tp-tabs")){var s=t.data("wr_padding"),r=t.data("maxw"),o=t.data("maxh"),d=t.hasClass("tp-thumbs")?t.find(".tp-thumb-mask"):t.find(".tp-tab-mask"),l=parseInt(e.padding_top||0,0),h=parseInt(e.padding_bottom||0,0);r>a&&"outer-left"!==e.position&&"outer-right"!==e.position?(punchgs.TweenLite.set(t,{left:"0px",x:0,maxWidth:a-2*s+"px"}),punchgs.TweenLite.set(d,{maxWidth:a-2*s+"px"})):(punchgs.TweenLite.set(t,{maxWidth:r+"px"}),punchgs.TweenLite.set(d,{maxWidth:r+"px"})),o+2*s>n&&"outer-bottom"!==e.position&&"outer-top"!==e.position?(punchgs.TweenLite.set(t,{top:"0px",y:0,maxHeight:l+h+(n-2*s)+"px"}),punchgs.TweenLite.set(d,{maxHeight:l+h+(n-2*s)+"px"})):(punchgs.TweenLite.set(t,{maxHeight:o+"px"}),punchgs.TweenLite.set(d,{maxHeight:o+"px"})),"outer-left"!==e.position&&"outer-right"!==e.position&&(l=0,h=0),e.span===!0&&"vertical"===e.direction?(punchgs.TweenLite.set(t,{maxHeight:l+h+(n-2*s)+"px",height:l+h+(n-2*s)+"px",top:0-l,y:0}),v(d,e)):e.span===!0&&"horizontal"===e.direction&&(punchgs.TweenLite.set(t,{maxWidth:"100%",width:a-2*s+"px",left:0,x:0}),m(d,e))}},w=function(t,e,i,a){0===t.find(".tp-bullets").length&&(e.style=void 0===e.style?"":e.style,t.append('<div class="tp-bullets '+e.style+" "+e.direction+'"></div>'));var n=t.find(".tp-bullets"),s=i.data("index"),r=e.tmp;jQuery.each(a.thumbs[i.index()].params,function(t,e){r=r.replace(e.from,e.to)}),n.append('<div class="justaddedbullet tp-bullet">'+r+"</div>");var o=t.find(".justaddedbullet"),d=t.find(".tp-bullet").length,l=o.outerWidth()+parseInt(void 0===e.space?0:e.space,0),h=o.outerHeight()+parseInt(void 0===e.space?0:e.space,0);"vertical"===e.direction?(o.css({top:(d-1)*h+"px",left:"0px"}),n.css({height:(d-1)*h+o.outerHeight(),width:o.outerWidth()})):(o.css({left:(d-1)*l+"px",top:"0px"}),n.css({width:(d-1)*l+o.outerWidth(),height:o.outerHeight()})),o.find(".tp-bullet-image").css({backgroundImage:"url("+a.thumbs[i.index()].src+")"}),o.data("liref",s),o.click(function(){a.sc_indicator="bullet",t.revcallslidewithid(s),t.find(".tp-bullet").removeClass("selected"),jQuery(this).addClass("selected")}),o.removeClass("justaddedbullet"),e.padding_top=parseInt(a.carousel.padding_top||0,0),e.padding_bottom=parseInt(a.carousel.padding_bottom||0,0),("outer-left"==e.position||"outer-right"==e.position)&&(a.outernav=!0),b(n,e)},_=function(t,e){e=parseFloat(e),t=t.replace("#","");var i=parseInt(t.substring(0,2),16),a=parseInt(t.substring(2,4),16),n=parseInt(t.substring(4,6),16),s="rgba("+i+","+a+","+n+","+e+")";return s},x=function(t,e,i,a,n){var s="tp-thumb"===a?".tp-thumbs":".tp-tabs",r="tp-thumb"===a?".tp-thumb-mask":".tp-tab-mask",o="tp-thumb"===a?".tp-thumbs-inner-wrapper":".tp-tabs-inner-wrapper",d="tp-thumb"===a?".tp-thumb":".tp-tab",l="tp-thumb"===a?".tp-thumb-image":".tp-tab-image";if(e.visibleAmount=e.visibleAmount>n.slideamount?n.slideamount:e.visibleAmount,e.sliderLayout=n.sliderLayout,0===t.parent().find(s).length){e.style=void 0===e.style?"":e.style;var h=e.span===!0?"tp-span-wrapper":"",p='<div class="'+a+"s "+h+" "+e.position+" "+e.style+'"><div class="'+a+'-mask"><div class="'+a+'s-inner-wrapper" style="position:relative;"></div></div></div>';"outer-top"===e.position?t.parent().prepend(p):"outer-bottom"===e.position?t.after(p):t.append(p),e.padding_top=parseInt(n.carousel.padding_top||0,0),e.padding_bottom=parseInt(n.carousel.padding_bottom||0,0),("outer-left"==e.position||"outer-right"==e.position)&&(n.outernav=!0)}var u=i.data("index"),c=t.parent().find(s),g=c.find(r),f=g.find(o),v="horizontal"===e.direction?e.width*e.visibleAmount+e.space*(e.visibleAmount-1):e.width,m="horizontal"===e.direction?e.height:e.height*e.visibleAmount+e.space*(e.visibleAmount-1),w=e.tmp;jQuery.each(n.thumbs[i.index()].params,function(t,e){w=w.replace(e.from,e.to)}),f.append('<div data-liindex="'+i.index()+'" data-liref="'+u+'" class="justaddedthumb '+a+'" style="width:'+e.width+"px;height:"+e.height+'px;">'+w+"</div>");var x=c.find(".justaddedthumb"),y=c.find(d).length,T=x.outerWidth()+parseInt(void 0===e.space?0:e.space,0),j=x.outerHeight()+parseInt(void 0===e.space?0:e.space,0);x.find(l).css({backgroundImage:"url("+n.thumbs[i.index()].src+")"}),"vertical"===e.direction?(x.css({top:(y-1)*j+"px",left:"0px"}),f.css({height:(y-1)*j+x.outerHeight(),width:x.outerWidth()})):(x.css({left:(y-1)*T+"px",top:"0px"}),f.css({width:(y-1)*T+x.outerWidth(),height:x.outerHeight()})),c.data("maxw",v),c.data("maxh",m),c.data("wr_padding",e.wrapper_padding);var L="outer-top"===e.position||"outer-bottom"===e.position?"relative":"absolute";"outer-top"!==e.position&&"outer-bottom"!==e.position||"center"!==e.h_align?"0":"auto";g.css({maxWidth:v+"px",maxHeight:m+"px",overflow:"hidden",position:"relative"}),c.css({maxWidth:v+"px",maxHeight:m+"px",overflow:"visible",position:L,background:_(e.wrapper_color,e.wrapper_opacity),padding:e.wrapper_padding+"px",boxSizing:"contet-box"}),x.click(function(){n.sc_indicator="bullet";var e=t.parent().find(o).data("distance");e=void 0===e?0:e,Math.abs(e)<10&&(t.revcallslidewithid(u),t.parent().find(s).removeClass("selected"),jQuery(this).addClass("selected"))}),x.removeClass("justaddedthumb"),b(c,e)},y=function(t){var e=t.c.parent().find(".outer-top"),i=t.c.parent().find(".outer-bottom");t.top_outer=e.hasClass("tp-forcenotvisible")?0:e.outerHeight()||0,t.bottom_outer=i.hasClass("tp-forcenotvisible")?0:i.outerHeight()||0},T=function(t,e,i,a){e>i||i>a?t.addClass("tp-forcenotvisible"):t.removeClass("tp-forcenotvisible")}}(jQuery);
/********************************************
 * REVOLUTION 5.1.6 EXTENSION - PARALLAX
 * @version: 1.2 (04.01.2016)
 * @requires jquery.themepunch.revolution.js
 * @author ThemePunch
*********************************************/
!function(e){var a=jQuery.fn.revolution,r=a.is_mobile();jQuery.extend(!0,a,{checkForParallax:function(e,t){var o=t.parallax;if(r&&"on"==o.disable_onmobile)return!1;("3D"==o.type||"3d"==o.type)&&(punchgs.TweenLite.set(t.c,{overflow:o.ddd_overflow}),punchgs.TweenLite.set(t.ul,{overflow:o.ddd_overflow}),"carousel"!=t.sliderType&&"on"==o.ddd_shadow&&(t.c.prepend('<div class="dddwrappershadow"></div>'),punchgs.TweenLite.set(t.c.find(".dddwrappershadow"),{force3D:"auto",transformPerspective:1600,transformOrigin:"50% 50%",width:"100%",height:"100%",position:"absolute",top:0,left:0,zIndex:0}))),t.li.each(function(){var e=jQuery(this);if("3D"==o.type||"3d"==o.type){e.find(".slotholder").wrapAll('<div class="dddwrapper" style="width:100%;height:100%;position:absolute;top:0px;left:0px;overflow:hidden"></div>'),e.find(".tp-parallax-wrap").wrapAll('<div class="dddwrapper-layer" style="width:100%;height:100%;position:absolute;top:0px;left:0px;z-index:5;overflow:'+o.ddd_layer_overflow+';"></div>'),e.find(".rs-parallaxlevel-tobggroup").closest(".tp-parallax-wrap").wrapAll('<div class="dddwrapper-layertobggroup" style="position:absolute;top:0px;left:0px;z-index:50;width:100%;height:100%"></div>');var a=e.find(".dddwrapper"),r=e.find(".dddwrapper-layer"),l=e.find(".dddwrapper-layertobggroup");l.appendTo(a),"carousel"==t.sliderType&&("on"==o.ddd_shadow&&a.addClass("dddwrappershadow"),punchgs.TweenLite.set(a,{borderRadius:t.carousel.border_radius})),punchgs.TweenLite.set(e,{overflow:"visible",transformStyle:"preserve-3d",perspective:1600}),punchgs.TweenLite.set(a,{force3D:"auto",transformOrigin:"50% 50%"}),punchgs.TweenLite.set(r,{force3D:"auto",transformOrigin:"50% 50%",zIndex:5}),punchgs.TweenLite.set(t.ul,{transformStyle:"preserve-3d",transformPerspective:1600})}});for(var l=1;l<=o.levels.length;l++)t.c.find(".rs-parallaxlevel-"+l).each(function(){var e=jQuery(this),a=e.closest(".tp-parallax-wrap");a.data("parallaxlevel",o.levels[l-1]),a.addClass("tp-parallax-container")});("mouse"==o.type||"scroll+mouse"==o.type||"mouse+scroll"==o.type||"3D"==o.type||"3d"==o.type)&&(e.mouseenter(function(a){var r=e.find(".active-revslide"),t=e.offset().top,o=e.offset().left,l=a.pageX-o,i=a.pageY-t;r.data("enterx",l),r.data("entery",i)}),e.on("mousemove.hoverdir, mouseleave.hoverdir, trigger3dpath",function(a,r){var l=r&&r.li?r.li:e.find(".active-revslide");if("enterpoint"==o.origo){var i=e.offset().top,s=e.offset().left;void 0==l.data("enterx")&&l.data("enterx",a.pageX-s),void 0==l.data("entery")&&l.data("entery",a.pageY-i);var n=l.data("enterx")||a.pageX-s,d=l.data("entery")||a.pageY-i,p=n-(a.pageX-s),c=d-(a.pageY-i),u=o.speed/1e3||.4}else var i=e.offset().top,s=e.offset().left,p=t.conw/2-(a.pageX-s),c=t.conh/2-(a.pageY-i),u=o.speed/1e3||3;"mouseleave"==a.type&&(p=o.ddd_lasth||0,c=o.ddd_lastv||0,u=1.5);var h=[];if(l.find(".tp-parallax-container").each(function(e){h.push(jQuery(this))}),e.find(".tp-static-layers .tp-parallax-container").each(function(){h.push(jQuery(this))}),jQuery.each(h,function(){var e=jQuery(this),a=parseInt(e.data("parallaxlevel"),0),r="3D"==o.type||"3d"==o.type?a/200:a/100,t=p*r,l=c*r;"scroll+mouse"==o.type||"mouse+scroll"==o.type?punchgs.TweenLite.to(e,u,{force3D:"auto",x:t,ease:punchgs.Power3.easeOut,overwrite:"all"}):punchgs.TweenLite.to(e,u,{force3D:"auto",x:t,y:l,ease:punchgs.Power3.easeOut,overwrite:"all"})}),"3D"==o.type||"3d"==o.type){var f=".tp-revslider-slidesli .dddwrapper, .dddwrappershadow, .tp-revslider-slidesli .dddwrapper-layer";"carousel"===t.sliderType&&(f=".tp-revslider-slidesli .dddwrapper, .tp-revslider-slidesli .dddwrapper-layer"),t.c.find(f).each(function(){var e=jQuery(this),r=o.levels[o.levels.length-1]/200,l=p*r,i=c*r,s=0==t.conw?0:Math.round(p/t.conw*r*100)||0,n=0==t.conh?0:Math.round(c/t.conh*r*100)||0,d=e.closest("li"),h=0,f=!1;e.hasClass("dddwrapper-layer")&&(h=o.ddd_z_correction||65,f=!0),e.hasClass("dddwrapper-layer")&&(l=0,i=0),d.hasClass("active-revslide")||"carousel"!=t.sliderType?"on"!=o.ddd_bgfreeze||f?punchgs.TweenLite.to(e,u,{rotationX:n,rotationY:-s,x:l,z:h,y:i,ease:punchgs.Power3.easeOut,overwrite:"all"}):punchgs.TweenLite.to(e,.5,{force3D:"auto",rotationY:0,rotationX:0,z:0,ease:punchgs.Power3.easeOut,overwrite:"all"}):punchgs.TweenLite.to(e,.5,{force3D:"auto",rotationY:0,z:0,x:0,y:0,rotationX:0,z:0,ease:punchgs.Power3.easeOut,overwrite:"all"}),"mouseleave"==a.type&&punchgs.TweenLite.to(jQuery(this),3.8,{z:0,ease:punchgs.Power3.easeOut})})}}),r&&(window.ondeviceorientation=function(a){var r=Math.round(a.beta||0)-70,l=Math.round(a.gamma||0),i=e.find(".active-revslide");if(jQuery(window).width()>jQuery(window).height()){var s=l;l=r,r=s}var n=e.width(),d=e.height(),p=360/n*l,c=180/d*r,u=o.speed/1e3||3,h=[];if(i.find(".tp-parallax-container").each(function(e){h.push(jQuery(this))}),e.find(".tp-static-layers .tp-parallax-container").each(function(){h.push(jQuery(this))}),jQuery.each(h,function(){var e=jQuery(this),a=parseInt(e.data("parallaxlevel"),0),r=a/100,t=p*r*2,o=c*r*4;punchgs.TweenLite.to(e,u,{force3D:"auto",x:t,y:o,ease:punchgs.Power3.easeOut,overwrite:"all"})}),"3D"==o.type||"3d"==o.type){var f=".tp-revslider-slidesli .dddwrapper, .dddwrappershadow, .tp-revslider-slidesli .dddwrapper-layer";"carousel"===t.sliderType&&(f=".tp-revslider-slidesli .dddwrapper, .tp-revslider-slidesli .dddwrapper-layer"),t.c.find(f).each(function(){var e=jQuery(this),r=o.levels[o.levels.length-1]/200;offsh=p*r,offsv=c*r*3,offrv=0==t.conw?0:Math.round(p/t.conw*r*500)||0,offrh=0==t.conh?0:Math.round(c/t.conh*r*700)||0,li=e.closest("li"),zz=0,itslayer=!1,e.hasClass("dddwrapper-layer")&&(zz=o.ddd_z_correction||65,itslayer=!0),e.hasClass("dddwrapper-layer")&&(offsh=0,offsv=0),li.hasClass("active-revslide")||"carousel"!=t.sliderType?"on"!=o.ddd_bgfreeze||itslayer?punchgs.TweenLite.to(e,u,{rotationX:offrh,rotationY:-offrv,x:offsh,z:zz,y:offsv,ease:punchgs.Power3.easeOut,overwrite:"all"}):punchgs.TweenLite.to(e,.5,{force3D:"auto",rotationY:0,rotationX:0,z:0,ease:punchgs.Power3.easeOut,overwrite:"all"}):punchgs.TweenLite.to(e,.5,{force3D:"auto",rotationY:0,z:0,x:0,y:0,rotationX:0,z:0,ease:punchgs.Power3.easeOut,overwrite:"all"}),"mouseleave"==a.type&&punchgs.TweenLite.to(jQuery(this),3.8,{z:0,ease:punchgs.Power3.easeOut})})}})),a.scrollTicker(t,e)},scrollTicker:function(e,t){1!=e.scrollTicker&&(e.scrollTicker=!0,r?(punchgs.TweenLite.ticker.fps(150),punchgs.TweenLite.ticker.addEventListener("tick",function(){a.scrollHandling(e)},t,!1,1)):jQuery(window).on("scroll mousewheel DOMMouseScroll",function(){a.scrollHandling(e,!0)})),a.scrollHandling(e,!0)},scrollHandling:function(e,t){function o(e,a){e.lastscrolltop=a}e.lastwindowheight=e.lastwindowheight||jQuery(window).height();var l=e.c.offset().top,i=jQuery(window).scrollTop(),s=new Object,n=e.viewPort,d=e.parallax;if(e.lastscrolltop==i&&!e.duringslidechange&&!t)return!1;punchgs.TweenLite.delayedCall(.2,o,[e,i]),s.top=l-i,s.h=0==e.conh?e.c.height():e.conh,s.bottom=l-i+s.h;var p=s.top<0?s.top/s.h:s.bottom>e.lastwindowheight?(s.bottom-e.lastwindowheight)/s.h:0;if(e.scrollproc=p,a.callBackHandling&&a.callBackHandling(e,"parallax","start"),n.enable){var c=1-Math.abs(p);c=0>c?0:c,jQuery.isNumeric(n.visible_area)||-1!==n.visible_area.indexOf("%")&&(n.visible_area=parseInt(n.visible_area)/100),1-n.visible_area<=c?e.inviewport||(e.inviewport=!0,a.enterInViewPort(e)):e.inviewport&&(e.inviewport=!1,a.leaveViewPort(e))}if(r&&"on"==e.parallax.disable_onmobile)return!1;var u=new punchgs.TimelineLite;u.pause(),"3d"!=d.type&&"3D"!=d.type&&(("scroll"==d.type||"scroll+mouse"==d.type||"mouse+scroll"==d.type)&&e.c.find(".tp-parallax-container").each(function(a){var r=jQuery(this),t=parseInt(r.data("parallaxlevel"),0)/100,o=p*-(t*e.conh)||0;r.data("parallaxoffset",o),u.add(punchgs.TweenLite.set(r,{force3D:"auto",y:o}),0)}),e.c.find(".tp-revslider-slidesli .slotholder, .tp-revslider-slidesli .rs-background-video-layer").each(function(){var a=jQuery(this),r=a.data("bgparallax")||e.parallax.bgparallax;if(r="on"==r?1:r,void 0!==r||"off"!==r){var t=e.parallax.levels[parseInt(r,0)-1]/100,o=p*-(t*e.conh)||0;jQuery.isNumeric(o)&&u.add(punchgs.TweenLite.set(a,{position:"absolute",top:"0px",left:"0px",backfaceVisibility:"hidden",force3D:"true",y:o+"px"}),0)}})),a.callBackHandling&&a.callBackHandling(e,"parallax","end"),u.play(0)}})}(jQuery);
/************************************************
 * REVOLUTION 5.0 EXTENSION - SLIDE ANIMATIONS
 * @version: 1.1.0 (10.11.2015)
 * @requires jquery.themepunch.revolution.js
 * @author ThemePunch
************************************************/
!function(){var t=jQuery.fn.revolution;jQuery.extend(!0,t,{animateSlide:function(t,e,o,a,n,r,s,l,d){return i(t,e,o,a,n,r,s,l,d)}});var e=function(e,o,a,i){var n=e,r=n.find(".defaultimg"),s=n.data("zoomstart"),l=n.data("rotationstart");void 0!=r.data("currotate")&&(l=r.data("currotate")),void 0!=r.data("curscale")&&"box"==i?s=100*r.data("curscale"):void 0!=r.data("curscale")&&(s=r.data("curscale")),t.slotSize(r,o);var d=r.attr("src"),h=r.css("backgroundColor"),f=o.width,c=o.height,p=r.data("fxof"),u=0;"on"==o.autoHeight&&(c=o.c.height()),void 0==p&&(p=0);var g=0,w=r.data("bgfit"),v=r.data("bgrepeat"),m=r.data("bgposition");switch(void 0==w&&(w="cover"),void 0==v&&(v="no-repeat"),void 0==m&&(m="center center"),i){case"box":for(var x=0,y=0,T=0;T<o.slots;T++){y=0;for(var z=0;z<o.slots;z++)n.append('<div class="slot" style="position:absolute;top:'+(u+y)+"px;left:"+(p+x)+"px;width:"+o.slotw+"px;height:"+o.sloth+'px;overflow:hidden;"><div class="slotslide" data-x="'+x+'" data-y="'+y+'" style="position:absolute;top:0px;left:0px;width:'+o.slotw+"px;height:"+o.sloth+'px;overflow:hidden;"><div style="position:absolute;top:'+(0-y)+"px;left:"+(0-x)+"px;width:"+f+"px;height:"+c+"px;background-color:"+h+";background-image:url("+d+");background-repeat:"+v+";background-size:"+w+";background-position:"+m+';"></div></div></div>'),y+=o.sloth,void 0!=s&&void 0!=l&&punchgs.TweenLite.set(n.find(".slot").last(),{rotationZ:l});x+=o.slotw}break;case"vertical":case"horizontal":if("horizontal"==i){if(!a)var g=0-o.slotw;for(var z=0;z<o.slots;z++)n.append('<div class="slot" style="position:absolute;top:'+(0+u)+"px;left:"+(p+z*o.slotw)+"px;overflow:hidden;width:"+(o.slotw+.6)+"px;height:"+c+'px"><div class="slotslide" style="position:absolute;top:0px;left:'+g+"px;width:"+(o.slotw+.6)+"px;height:"+c+'px;overflow:hidden;"><div style="background-color:'+h+";position:absolute;top:0px;left:"+(0-z*o.slotw)+"px;width:"+f+"px;height:"+c+"px;background-image:url("+d+");background-repeat:"+v+";background-size:"+w+";background-position:"+m+';"></div></div></div>'),void 0!=s&&void 0!=l&&punchgs.TweenLite.set(n.find(".slot").last(),{rotationZ:l})}else{if(!a)var g=0-o.sloth;for(var z=0;z<o.slots+2;z++)n.append('<div class="slot" style="position:absolute;top:'+(u+z*o.sloth)+"px;left:"+p+"px;overflow:hidden;width:"+f+"px;height:"+o.sloth+'px"><div class="slotslide" style="position:absolute;top:'+g+"px;left:0px;width:"+f+"px;height:"+o.sloth+'px;overflow:hidden;"><div style="background-color:'+h+";position:absolute;top:"+(0-z*o.sloth)+"px;left:0px;width:"+f+"px;height:"+c+"px;background-image:url("+d+");background-repeat:"+v+";background-size:"+w+";background-position:"+m+';"></div></div></div>'),void 0!=s&&void 0!=l&&punchgs.TweenLite.set(n.find(".slot").last(),{rotationZ:l})}}},o=function(t,e,o,a,i){function n(){jQuery.each(y,function(t,e){(e[0]==o||e[8]==o)&&(w=e[1],v=e[2],m=x),x+=1})}var r=punchgs.Power1.easeIn,s=punchgs.Power1.easeOut,l=punchgs.Power1.easeInOut,d=punchgs.Power2.easeIn,h=punchgs.Power2.easeOut,f=punchgs.Power2.easeInOut,c=(punchgs.Power3.easeIn,punchgs.Power3.easeOut),p=punchgs.Power3.easeInOut,u=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45],g=[16,17,18,19,20,21,22,23,24,25,27],w=0,v=1,m=0,x=0,y=(new Array,[["boxslide",0,1,10,0,"box",!1,null,0,s,s,500,6],["boxfade",1,0,10,0,"box",!1,null,1,l,l,700,5],["slotslide-horizontal",2,0,0,200,"horizontal",!0,!1,2,f,f,700,3],["slotslide-vertical",3,0,0,200,"vertical",!0,!1,3,f,f,700,3],["curtain-1",4,3,0,0,"horizontal",!0,!0,4,s,s,300,5],["curtain-2",5,3,0,0,"horizontal",!0,!0,5,s,s,300,5],["curtain-3",6,3,25,0,"horizontal",!0,!0,6,s,s,300,5],["slotzoom-horizontal",7,0,0,400,"horizontal",!0,!0,7,s,s,300,7],["slotzoom-vertical",8,0,0,0,"vertical",!0,!0,8,h,h,500,8],["slotfade-horizontal",9,0,0,500,"horizontal",!0,null,9,h,h,500,25],["slotfade-vertical",10,0,0,500,"vertical",!0,null,10,h,h,500,25],["fade",11,0,1,300,"horizontal",!0,null,11,f,f,1e3,1],["crossfade",11,1,1,300,"horizontal",!0,null,11,f,f,1e3,1],["fadethroughdark",11,2,1,300,"horizontal",!0,null,11,f,f,1e3,1],["fadethroughlight",11,3,1,300,"horizontal",!0,null,11,f,f,1e3,1],["fadethroughtransparent",11,4,1,300,"horizontal",!0,null,11,f,f,1e3,1],["slideleft",12,0,1,0,"horizontal",!0,!0,12,p,p,1e3,1],["slideup",13,0,1,0,"horizontal",!0,!0,13,p,p,1e3,1],["slidedown",14,0,1,0,"horizontal",!0,!0,14,p,p,1e3,1],["slideright",15,0,1,0,"horizontal",!0,!0,15,p,p,1e3,1],["slideoverleft",12,7,1,0,"horizontal",!0,!0,12,p,p,1e3,1],["slideoverup",13,7,1,0,"horizontal",!0,!0,13,p,p,1e3,1],["slideoverdown",14,7,1,0,"horizontal",!0,!0,14,p,p,1e3,1],["slideoverright",15,7,1,0,"horizontal",!0,!0,15,p,p,1e3,1],["slideremoveleft",12,8,1,0,"horizontal",!0,!0,12,p,p,1e3,1],["slideremoveup",13,8,1,0,"horizontal",!0,!0,13,p,p,1e3,1],["slideremovedown",14,8,1,0,"horizontal",!0,!0,14,p,p,1e3,1],["slideremoveright",15,8,1,0,"horizontal",!0,!0,15,p,p,1e3,1],["papercut",16,0,0,600,"",null,null,16,p,p,1e3,2],["3dcurtain-horizontal",17,0,20,100,"vertical",!1,!0,17,l,l,500,7],["3dcurtain-vertical",18,0,10,100,"horizontal",!1,!0,18,l,l,500,5],["cubic",19,0,20,600,"horizontal",!1,!0,19,p,p,500,1],["cube",19,0,20,600,"horizontal",!1,!0,20,p,p,500,1],["flyin",20,0,4,600,"vertical",!1,!0,21,c,p,500,1],["turnoff",21,0,1,500,"horizontal",!1,!0,22,p,p,500,1],["incube",22,0,20,200,"horizontal",!1,!0,23,f,f,500,1],["cubic-horizontal",23,0,20,500,"vertical",!1,!0,24,h,h,500,1],["cube-horizontal",23,0,20,500,"vertical",!1,!0,25,h,h,500,1],["incube-horizontal",24,0,20,500,"vertical",!1,!0,26,f,f,500,1],["turnoff-vertical",25,0,1,200,"horizontal",!1,!0,27,f,f,500,1],["fadefromright",12,1,1,0,"horizontal",!0,!0,28,f,f,1e3,1],["fadefromleft",15,1,1,0,"horizontal",!0,!0,29,f,f,1e3,1],["fadefromtop",14,1,1,0,"horizontal",!0,!0,30,f,f,1e3,1],["fadefrombottom",13,1,1,0,"horizontal",!0,!0,31,f,f,1e3,1],["fadetoleftfadefromright",12,2,1,0,"horizontal",!0,!0,32,f,f,1e3,1],["fadetorightfadefromleft",15,2,1,0,"horizontal",!0,!0,33,f,f,1e3,1],["fadetobottomfadefromtop",14,2,1,0,"horizontal",!0,!0,34,f,f,1e3,1],["fadetotopfadefrombottom",13,2,1,0,"horizontal",!0,!0,35,f,f,1e3,1],["parallaxtoright",12,3,1,0,"horizontal",!0,!0,36,f,d,1500,1],["parallaxtoleft",15,3,1,0,"horizontal",!0,!0,37,f,d,1500,1],["parallaxtotop",14,3,1,0,"horizontal",!0,!0,38,f,r,1500,1],["parallaxtobottom",13,3,1,0,"horizontal",!0,!0,39,f,r,1500,1],["scaledownfromright",12,4,1,0,"horizontal",!0,!0,40,f,d,1e3,1],["scaledownfromleft",15,4,1,0,"horizontal",!0,!0,41,f,d,1e3,1],["scaledownfromtop",14,4,1,0,"horizontal",!0,!0,42,f,d,1e3,1],["scaledownfrombottom",13,4,1,0,"horizontal",!0,!0,43,f,d,1e3,1],["zoomout",13,5,1,0,"horizontal",!0,!0,44,f,d,1e3,1],["zoomin",13,6,1,0,"horizontal",!0,!0,45,f,d,1e3,1],["slidingoverlayup",27,0,1,0,"horizontal",!0,!0,47,l,s,2e3,1],["slidingoverlaydown",28,0,1,0,"horizontal",!0,!0,48,l,s,2e3,1],["slidingoverlayright",30,0,1,0,"horizontal",!0,!0,49,l,s,2e3,1],["slidingoverlayleft",29,0,1,0,"horizontal",!0,!0,50,l,s,2e3,1],["parallaxcirclesup",31,0,1,0,"horizontal",!0,!0,51,f,r,1500,1],["parallaxcirclesdown",32,0,1,0,"horizontal",!0,!0,52,f,r,1500,1],["parallaxcirclesright",33,0,1,0,"horizontal",!0,!0,53,f,r,1500,1],["parallaxcirclesleft",34,0,1,0,"horizontal",!0,!0,54,f,r,1500,1],["notransition",26,0,1,0,"horizontal",!0,null,46,f,d,1e3,1],["parallaxright",12,3,1,0,"horizontal",!0,!0,55,f,d,1500,1],["parallaxleft",15,3,1,0,"horizontal",!0,!0,56,f,d,1500,1],["parallaxup",14,3,1,0,"horizontal",!0,!0,57,f,r,1500,1],["parallaxdown",13,3,1,0,"horizontal",!0,!0,58,f,r,1500,1]]);e.duringslidechange=!0,e.testanims=!1,1==e.testanims&&(e.nexttesttransform=void 0===e.nexttesttransform?34:e.nexttesttransform+1,e.nexttesttransform=e.nexttesttransform>70?0:e.nexttesttransform,o=y[e.nexttesttransform][0],console.log(o+"  "+e.nexttesttransform+"  "+y[e.nexttesttransform][1]+"  "+y[e.nexttesttransform][2])),jQuery.each(["parallaxcircles","slidingoverlay","slide","slideover","slideremove","parallax"],function(t,e){o==e+"horizontal"&&(o=1!=i?e+"left":e+"right"),o==e+"vertical"&&(o=1!=i?e+"up":e+"down")}),"random"==o&&(o=Math.round(Math.random()*y.length-1),o>y.length-1&&(o=y.length-1)),"random-static"==o&&(o=Math.round(Math.random()*u.length-1),o>u.length-1&&(o=u.length-1),o=u[o]),"random-premium"==o&&(o=Math.round(Math.random()*g.length-1),o>g.length-1&&(o=g.length-1),o=g[o]);var T=[12,13,14,15,16,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45];if(1==e.isJoomla&&void 0!=window.MooTools&&-1!=T.indexOf(o)){var z=Math.round(Math.random()*(g.length-2))+1;z>g.length-1&&(z=g.length-1),0==z&&(z=1),o=g[z]}n(),w>30&&(w=30),0>w&&(w=0);var L=new Object;return L.nexttrans=w,L.STA=y[m],L.specials=v,L},a=function(t,e){return void 0==e||jQuery.isNumeric(t)?t:void 0==t?t:t.split(",")[e]},i=function(t,i,n,r,s,l,d,h,f){function c(t,e,o,a,i){var n=t.find(".slot"),r=6,s=[2,1.2,.9,.7,.55,.42],l=t.width(),h=t.height();n.wrap('<div class="slot-circle-wrapper" style="overflow:hidden;position:absolute;border:1px solid #fff"></div>');for(var c=0;r>c;c++)n.parent().clone(!1).appendTo(d);t.find(".slot-circle-wrapper").each(function(t){if(r>t){var a=jQuery(this),n=a.find(".slot"),d=l>h?s[t]*l:s[t]*h,c=d,p=0+(c/2-l/2),u=0+(d/2-h/2),g=0!=t?"50%":"0",w=31==o?h/2-d/2:32==o?h/2-d/2:h/2-d/2,v=33==o?l/2-c/2:34==o?l-c:l/2-c/2,m={scale:1,transformOrigo:"50% 50%",width:c+"px",height:d+"px",top:w+"px",left:v+"px",borderRadius:g},x={scale:1,top:h/2-d/2,left:l/2-c/2,ease:i},y=31==o?u:32==o?u:u,T=33==o?p:34==o?p+l/2:p,z={width:l,height:h,autoAlpha:1,top:y+"px",position:"absolute",left:T+"px"},L={top:u+"px",left:p+"px",ease:i},b=e,D=0;f.add(punchgs.TweenLite.fromTo(a,b,m,x),D),f.add(punchgs.TweenLite.fromTo(n,b,z,L),D),f.add(punchgs.TweenLite.fromTo(a,.001,{autoAlpha:0},{autoAlpha:1}),0)}})}var p=l.index(),u=s.index(),g=p>u?1:0;"arrow"==r.sc_indicator&&(g=r.sc_indicator_dir);var w=o(n,r,i,d,g),v=w.STA,m=w.specials,t=w.nexttrans;"on"==d.data("kenburns")&&(t=11);var x=s.data("nexttransid")||0,y=a(s.data("masterspeed"),x);y="default"===y?v[11]:"random"===y?Math.round(1e3*Math.random()+300):void 0!=y?parseInt(y,0):v[11],y=y>r.delay?r.delay:y,y+=v[4],r.slots=a(s.data("slotamount"),x),r.slots=void 0==r.slots||"default"==r.slots?v[12]:"random"==r.slots?Math.round(12*Math.random()+4):r.slots,r.slots=r.slots<1?"boxslide"==i?Math.round(6*Math.random()+3):"flyin"==i?Math.round(4*Math.random()+1):r.slots:r.slots,r.slots=(4==t||5==t||6==t)&&r.slots<3?3:r.slots,r.slots=0!=v[3]?Math.min(r.slots,v[3]):r.slots,r.slots=9==t?r.width/20:10==t?r.height/20:r.slots,r.rotate=a(s.data("rotate"),x),r.rotate=void 0==r.rotate||"default"==r.rotate?0:999==r.rotate||"random"==r.rotate?Math.round(360*Math.random()):r.rotate,r.rotate=!jQuery.support.transition||r.ie||r.ie9?0:r.rotate,11!=t&&(null!=v[7]&&e(h,r,v[7],v[5]),null!=v[6]&&e(d,r,v[6],v[5])),f.add(punchgs.TweenLite.set(d.find(".defaultvid"),{y:0,x:0,top:0,left:0,scale:1}),0),f.add(punchgs.TweenLite.set(h.find(".defaultvid"),{y:0,x:0,top:0,left:0,scale:1}),0),f.add(punchgs.TweenLite.set(d.find(".defaultvid"),{y:"+0%",x:"+0%"}),0),f.add(punchgs.TweenLite.set(h.find(".defaultvid"),{y:"+0%",x:"+0%"}),0),f.add(punchgs.TweenLite.set(d,{autoAlpha:1,y:"+0%",x:"+0%"}),0),f.add(punchgs.TweenLite.set(h,{autoAlpha:1,y:"+0%",x:"+0%"}),0),f.add(punchgs.TweenLite.set(d.parent(),{backgroundColor:"transparent"}),0),f.add(punchgs.TweenLite.set(h.parent(),{backgroundColor:"transparent"}),0);var T=a(s.data("easein"),x),z=a(s.data("easeout"),x);if(T="default"===T?v[9]||punchgs.Power2.easeInOut:T||v[9]||punchgs.Power2.easeInOut,z="default"===z?v[10]||punchgs.Power2.easeInOut:z||v[10]||punchgs.Power2.easeInOut,0==t){var L=Math.ceil(r.height/r.sloth),b=0;d.find(".slotslide").each(function(t){var e=jQuery(this);b+=1,b==L&&(b=0),f.add(punchgs.TweenLite.from(e,y/600,{opacity:0,top:0-r.sloth,left:0-r.slotw,rotation:r.rotate,force3D:"auto",ease:T}),(15*t+30*b)/1500)})}if(1==t){var D,A=0;d.find(".slotslide").each(function(t){var e=jQuery(this),o=Math.random()*y+300,a=500*Math.random()+200;o+a>D&&(D=a+a,A=t),f.add(punchgs.TweenLite.from(e,o/1e3,{autoAlpha:0,force3D:"auto",rotation:r.rotate,ease:T}),a/1e3)})}if(2==t){var j=new punchgs.TimelineLite;h.find(".slotslide").each(function(){var t=jQuery(this);j.add(punchgs.TweenLite.to(t,y/1e3,{left:r.slotw,ease:T,force3D:"auto",rotation:0-r.rotate}),0),f.add(j,0)}),d.find(".slotslide").each(function(){var t=jQuery(this);j.add(punchgs.TweenLite.from(t,y/1e3,{left:0-r.slotw,ease:T,force3D:"auto",rotation:r.rotate}),0),f.add(j,0)})}if(3==t){var j=new punchgs.TimelineLite;h.find(".slotslide").each(function(){var t=jQuery(this);j.add(punchgs.TweenLite.to(t,y/1e3,{top:r.sloth,ease:T,rotation:r.rotate,force3D:"auto",transformPerspective:600}),0),f.add(j,0)}),d.find(".slotslide").each(function(){var t=jQuery(this);j.add(punchgs.TweenLite.from(t,y/1e3,{top:0-r.sloth,rotation:r.rotate,ease:z,force3D:"auto",transformPerspective:600}),0),f.add(j,0)})}if(4==t||5==t){setTimeout(function(){h.find(".defaultimg").css({opacity:0})},100);var k=y/1e3,j=new punchgs.TimelineLite;h.find(".slotslide").each(function(e){var o=jQuery(this),a=e*k/r.slots;5==t&&(a=(r.slots-e-1)*k/r.slots/1.5),j.add(punchgs.TweenLite.to(o,3*k,{transformPerspective:600,force3D:"auto",top:0+r.height,opacity:.5,rotation:r.rotate,ease:T,delay:a}),0),f.add(j,0)}),d.find(".slotslide").each(function(e){var o=jQuery(this),a=e*k/r.slots;5==t&&(a=(r.slots-e-1)*k/r.slots/1.5),j.add(punchgs.TweenLite.from(o,3*k,{top:0-r.height,opacity:.5,rotation:r.rotate,force3D:"auto",ease:punchgs.eo,delay:a}),0),f.add(j,0)})}if(6==t){r.slots<2&&(r.slots=2),r.slots%2&&(r.slots=r.slots+1);var j=new punchgs.TimelineLite;setTimeout(function(){h.find(".defaultimg").css({opacity:0})},100),h.find(".slotslide").each(function(t){var e=jQuery(this);if(t+1<r.slots/2)var o=90*(t+2);else var o=90*(2+r.slots-t);j.add(punchgs.TweenLite.to(e,(y+o)/1e3,{top:0+r.height,opacity:1,force3D:"auto",rotation:r.rotate,ease:T}),0),f.add(j,0)}),d.find(".slotslide").each(function(t){var e=jQuery(this);if(t+1<r.slots/2)var o=90*(t+2);else var o=90*(2+r.slots-t);j.add(punchgs.TweenLite.from(e,(y+o)/1e3,{top:0-r.height,opacity:1,force3D:"auto",rotation:r.rotate,ease:z}),0),f.add(j,0)})}if(7==t){y=2*y,y>r.delay&&(y=r.delay);var j=new punchgs.TimelineLite;setTimeout(function(){h.find(".defaultimg").css({opacity:0})},100),h.find(".slotslide").each(function(){var t=jQuery(this).find("div");j.add(punchgs.TweenLite.to(t,y/1e3,{left:0-r.slotw/2+"px",top:0-r.height/2+"px",width:2*r.slotw+"px",height:2*r.height+"px",opacity:0,rotation:r.rotate,force3D:"auto",ease:T}),0),f.add(j,0)}),d.find(".slotslide").each(function(t){var e=jQuery(this).find("div");j.add(punchgs.TweenLite.fromTo(e,y/1e3,{left:0,top:0,opacity:0,transformPerspective:600},{left:0-t*r.slotw+"px",ease:z,force3D:"auto",top:"0px",width:r.width,height:r.height,opacity:1,rotation:0,delay:.1}),0),f.add(j,0)})}if(8==t){y=3*y,y>r.delay&&(y=r.delay);var j=new punchgs.TimelineLite;h.find(".slotslide").each(function(){var t=jQuery(this).find("div");j.add(punchgs.TweenLite.to(t,y/1e3,{left:0-r.width/2+"px",top:0-r.sloth/2+"px",width:2*r.width+"px",height:2*r.sloth+"px",force3D:"auto",ease:T,opacity:0,rotation:r.rotate}),0),f.add(j,0)}),d.find(".slotslide").each(function(t){var e=jQuery(this).find("div");j.add(punchgs.TweenLite.fromTo(e,y/1e3,{left:0,top:0,opacity:0,force3D:"auto"},{left:"0px",top:0-t*r.sloth+"px",width:d.find(".defaultimg").data("neww")+"px",height:d.find(".defaultimg").data("newh")+"px",opacity:1,ease:z,rotation:0}),0),f.add(j,0)})}if(9==t||10==t){var M=0;d.find(".slotslide").each(function(t){var e=jQuery(this);M++,f.add(punchgs.TweenLite.fromTo(e,y/1e3,{autoAlpha:0,force3D:"auto",transformPerspective:600},{autoAlpha:1,ease:T,delay:5*t/1e3}),0)})}if(27==t||28==t||29==t||30==t){var P=d.find(".slot"),Q=27==t||28==t?1:2,O=27==t||29==t?"-100%":"+100%",I=27==t||29==t?"+100%":"-100%",X=27==t||29==t?"-80%":"80%",Y=27==t||29==t?"80%":"-80%",S=27==t||29==t?"10%":"-10%",_={overwrite:"all"},C={autoAlpha:0,zIndex:1,force3D:"auto",ease:T},V={position:"inherit",autoAlpha:0,overwrite:"all",zIndex:1},Z={autoAlpha:1,force3D:"auto",ease:z},H={overwrite:"all",zIndex:2},J={autoAlpha:1,force3D:"auto",overwrite:"all",ease:T},N={overwrite:"all",zIndex:2},R={autoAlpha:1,force3D:"auto",ease:T},q=1==Q?"y":"x";_[q]="0px",C[q]=O,V[q]=S,Z[q]="0%",H[q]=I,J[q]=O,N[q]=X,R[q]=Y,P.append('<span style="background-color:rgba(0,0,0,0.6);width:100%;height:100%;position:absolute;top:0px;left:0px;display:block;z-index:2"></span>'),f.add(punchgs.TweenLite.fromTo(h,y/1e3,_,C),0),f.add(punchgs.TweenLite.fromTo(d.find(".defaultimg"),y/2e3,V,Z),y/2e3),f.add(punchgs.TweenLite.fromTo(P,y/1e3,H,J),0),f.add(punchgs.TweenLite.fromTo(P.find(".slotslide div"),y/1e3,N,R),0)}if(31==t||32==t||33==t||34==t){y=6e3,T=punchgs.Power3.easeInOut;var B=y/1e3;mas=B-B/5,_nt=t,fy=31==_nt?"+100%":32==_nt?"-100%":"0%",fx=33==_nt?"+100%":34==_nt?"-100%":"0%",ty=31==_nt?"-100%":32==_nt?"+100%":"0%",tx=33==_nt?"-100%":34==_nt?"+100%":"0%",f.add(punchgs.TweenLite.fromTo(h,B-.2*B,{y:0,x:0},{y:ty,x:tx,ease:z}),.2*B),f.add(punchgs.TweenLite.fromTo(d,B,{y:fy,x:fx},{y:"0%",x:"0%",ease:T}),0),d.find(".slot").remove(),d.find(".defaultimg").clone().appendTo(d).addClass("slot"),c(d,B,_nt,"in",T)}if(11==t){m>4&&(m=0);var M=0,E=2==m?"#000000":3==m?"#ffffff":"transparent";switch(m){case 0:f.add(punchgs.TweenLite.fromTo(d,y/1e3,{autoAlpha:0},{autoAlpha:1,force3D:"auto",ease:T}),0);break;case 1:f.add(punchgs.TweenLite.fromTo(d,y/1e3,{autoAlpha:0},{autoAlpha:1,force3D:"auto",ease:T}),0),f.add(punchgs.TweenLite.fromTo(h,y/1e3,{autoAlpha:1},{autoAlpha:0,force3D:"auto",ease:T}),0);break;case 2:case 3:case 4:f.add(punchgs.TweenLite.set(h.parent(),{backgroundColor:E,force3D:"auto"}),0),f.add(punchgs.TweenLite.set(d.parent(),{backgroundColor:"transparent",force3D:"auto"}),0),f.add(punchgs.TweenLite.to(h,y/2e3,{autoAlpha:0,force3D:"auto",ease:T}),0),f.add(punchgs.TweenLite.fromTo(d,y/2e3,{autoAlpha:0},{autoAlpha:1,force3D:"auto",ease:T}),y/2e3)}f.add(punchgs.TweenLite.set(d.find(".defaultimg"),{autoAlpha:1}),0),f.add(punchgs.TweenLite.set(h.find("defaultimg"),{autoAlpha:1}),0)}if(26==t){var M=0;y=0,f.add(punchgs.TweenLite.fromTo(d,y/1e3,{autoAlpha:0},{autoAlpha:1,force3D:"auto",ease:T}),0),f.add(punchgs.TweenLite.to(h,y/1e3,{autoAlpha:0,force3D:"auto",ease:T}),0),f.add(punchgs.TweenLite.set(d.find(".defaultimg"),{autoAlpha:1}),0),f.add(punchgs.TweenLite.set(h.find("defaultimg"),{autoAlpha:1}),0)}if(12==t||13==t||14==t||15==t){y=y,y>r.delay&&(y=r.delay),setTimeout(function(){punchgs.TweenLite.set(h.find(".defaultimg"),{autoAlpha:0})},100);var F=r.width,G=r.height,K=d.find(".slotslide, .defaultvid"),U=0,W=0,$=1,te=1,ee=1,oe=y/1e3,ae=oe;("fullwidth"==r.sliderLayout||"fullscreen"==r.sliderLayout)&&(F=K.width(),G=K.height()),12==t?U=F:15==t?U=0-F:13==t?W=G:14==t&&(W=0-G),1==m&&($=0),2==m&&($=0),3==m&&(oe=y/1300),(4==m||5==m)&&(te=.6),6==m&&(te=1.4),(5==m||6==m)&&(ee=1.4,$=0,F=0,G=0,U=0,W=0),6==m&&(ee=.6);7==m&&(F=0,G=0);var ie=d.find(".slotslide"),ne=h.find(".slotslide, .defaultvid");if(f.add(punchgs.TweenLite.set(l,{zIndex:15}),0),f.add(punchgs.TweenLite.set(s,{zIndex:20}),0),8==m?(f.add(punchgs.TweenLite.set(l,{zIndex:20}),0),f.add(punchgs.TweenLite.set(s,{zIndex:15}),0),f.add(punchgs.TweenLite.set(ie,{left:0,top:0,scale:1,opacity:1,rotation:0,ease:T,force3D:"auto"}),0)):f.add(punchgs.TweenLite.from(ie,oe,{left:U,top:W,scale:ee,opacity:$,rotation:r.rotate,ease:T,force3D:"auto"}),0),(4==m||5==m)&&(F=0,G=0),1!=m)switch(t){case 12:f.add(punchgs.TweenLite.to(ne,ae,{left:0-F+"px",force3D:"auto",scale:te,opacity:$,rotation:r.rotate,ease:z}),0);break;case 15:f.add(punchgs.TweenLite.to(ne,ae,{left:F+"px",force3D:"auto",scale:te,opacity:$,rotation:r.rotate,ease:z}),0);break;case 13:f.add(punchgs.TweenLite.to(ne,ae,{top:0-G+"px",force3D:"auto",scale:te,opacity:$,rotation:r.rotate,ease:z}),0);break;case 14:f.add(punchgs.TweenLite.to(ne,ae,{top:G+"px",force3D:"auto",scale:te,opacity:$,rotation:r.rotate,ease:z}),0)}}if(16==t){var j=new punchgs.TimelineLite;f.add(punchgs.TweenLite.set(l,{position:"absolute","z-index":20}),0),f.add(punchgs.TweenLite.set(s,{position:"absolute","z-index":15}),0),l.wrapInner('<div class="tp-half-one" style="position:relative; width:100%;height:100%"></div>'),l.find(".tp-half-one").clone(!0).appendTo(l).addClass("tp-half-two"),l.find(".tp-half-two").removeClass("tp-half-one");var F=r.width,G=r.height;"on"==r.autoHeight&&(G=n.height()),l.find(".tp-half-one .defaultimg").wrap('<div class="tp-papercut" style="width:'+F+"px;height:"+G+'px;"></div>'),l.find(".tp-half-two .defaultimg").wrap('<div class="tp-papercut" style="width:'+F+"px;height:"+G+'px;"></div>'),l.find(".tp-half-two .defaultimg").css({position:"absolute",top:"-50%"}),l.find(".tp-half-two .tp-caption").wrapAll('<div style="position:absolute;top:-50%;left:0px;"></div>'),f.add(punchgs.TweenLite.set(l.find(".tp-half-two"),{width:F,height:G,overflow:"hidden",zIndex:15,position:"absolute",top:G/2,left:"0px",transformPerspective:600,transformOrigin:"center bottom"}),0),f.add(punchgs.TweenLite.set(l.find(".tp-half-one"),{width:F,height:G/2,overflow:"visible",zIndex:10,position:"absolute",top:"0px",left:"0px",transformPerspective:600,transformOrigin:"center top"}),0);var re=(l.find(".defaultimg"),Math.round(20*Math.random()-10)),se=Math.round(20*Math.random()-10),le=Math.round(20*Math.random()-10),de=.4*Math.random()-.2,he=.4*Math.random()-.2,fe=1*Math.random()+1,ce=1*Math.random()+1,pe=.3*Math.random()+.3;f.add(punchgs.TweenLite.set(l.find(".tp-half-one"),{overflow:"hidden"}),0),f.add(punchgs.TweenLite.fromTo(l.find(".tp-half-one"),y/800,{width:F,height:G/2,position:"absolute",top:"0px",left:"0px",force3D:"auto",transformOrigin:"center top"},{scale:fe,rotation:re,y:0-G-G/4,autoAlpha:0,ease:T}),0),f.add(punchgs.TweenLite.fromTo(l.find(".tp-half-two"),y/800,{width:F,height:G,overflow:"hidden",position:"absolute",top:G/2,left:"0px",force3D:"auto",transformOrigin:"center bottom"},{scale:ce,rotation:se,y:G+G/4,ease:T,autoAlpha:0,onComplete:function(){punchgs.TweenLite.set(l,{position:"absolute","z-index":15}),punchgs.TweenLite.set(s,{position:"absolute","z-index":20}),l.find(".tp-half-one").length>0&&(l.find(".tp-half-one .defaultimg").unwrap(),l.find(".tp-half-one .slotholder").unwrap()),l.find(".tp-half-two").remove()}}),0),j.add(punchgs.TweenLite.set(d.find(".defaultimg"),{autoAlpha:1}),0),null!=l.html()&&f.add(punchgs.TweenLite.fromTo(s,(y-200)/1e3,{scale:pe,x:r.width/4*de,y:G/4*he,rotation:le,force3D:"auto",transformOrigin:"center center",ease:z},{autoAlpha:1,scale:1,x:0,y:0,rotation:0}),0),f.add(j,0)}if(17==t&&d.find(".slotslide").each(function(t){var e=jQuery(this);f.add(punchgs.TweenLite.fromTo(e,y/800,{opacity:0,rotationY:0,scale:.9,rotationX:-110,force3D:"auto",transformPerspective:600,transformOrigin:"center center"},{opacity:1,top:0,left:0,scale:1,rotation:0,rotationX:0,force3D:"auto",rotationY:0,ease:T,delay:.06*t}),0)}),18==t&&d.find(".slotslide").each(function(t){var e=jQuery(this);f.add(punchgs.TweenLite.fromTo(e,y/500,{autoAlpha:0,rotationY:110,scale:.9,rotationX:10,force3D:"auto",transformPerspective:600,transformOrigin:"center center"},{autoAlpha:1,top:0,left:0,scale:1,rotation:0,rotationX:0,force3D:"auto",rotationY:0,ease:T,delay:.06*t}),0)}),19==t||22==t){var j=new punchgs.TimelineLite;f.add(punchgs.TweenLite.set(l,{zIndex:20}),0),f.add(punchgs.TweenLite.set(s,{zIndex:20}),0),setTimeout(function(){h.find(".defaultimg").css({opacity:0})},100);var ue=90,$=1,ge="center center ";1==g&&(ue=-90),19==t?(ge=ge+"-"+r.height/2,$=0):ge+=r.height/2,punchgs.TweenLite.set(n,{transformStyle:"flat",backfaceVisibility:"hidden",transformPerspective:600}),d.find(".slotslide").each(function(t){var e=jQuery(this);j.add(punchgs.TweenLite.fromTo(e,y/1e3,{transformStyle:"flat",backfaceVisibility:"hidden",left:0,rotationY:r.rotate,z:10,top:0,scale:1,force3D:"auto",transformPerspective:600,transformOrigin:ge,rotationX:ue},{left:0,rotationY:0,top:0,z:0,scale:1,force3D:"auto",rotationX:0,delay:50*t/1e3,ease:T}),0),j.add(punchgs.TweenLite.to(e,.1,{autoAlpha:1,delay:50*t/1e3}),0),f.add(j)}),h.find(".slotslide").each(function(t){var e=jQuery(this),o=-90;1==g&&(o=90),j.add(punchgs.TweenLite.fromTo(e,y/1e3,{transformStyle:"flat",backfaceVisibility:"hidden",autoAlpha:1,rotationY:0,top:0,z:0,scale:1,force3D:"auto",transformPerspective:600,transformOrigin:ge,rotationX:0},{autoAlpha:1,rotationY:r.rotate,top:0,z:10,scale:1,rotationX:o,delay:50*t/1e3,force3D:"auto",ease:z}),0),f.add(j)}),f.add(punchgs.TweenLite.set(l,{zIndex:18}),0)}if(20==t){if(setTimeout(function(){h.find(".defaultimg").css({opacity:0})},100),1==g)var we=-r.width,ue=80,ge="20% 70% -"+r.height/2;else var we=r.width,ue=-80,ge="80% 70% -"+r.height/2;d.find(".slotslide").each(function(t){var e=jQuery(this),o=50*t/1e3;f.add(punchgs.TweenLite.fromTo(e,y/1e3,{left:we,rotationX:40,z:-600,opacity:$,top:0,scale:1,force3D:"auto",transformPerspective:600,transformOrigin:ge,transformStyle:"flat",rotationY:ue},{left:0,rotationX:0,opacity:1,top:0,z:0,scale:1,rotationY:0,delay:o,ease:T}),0)}),h.find(".slotslide").each(function(t){var e=jQuery(this),o=50*t/1e3;if(o=t>0?o+y/9e3:0,1!=g)var a=-r.width/2,i=30,n="20% 70% -"+r.height/2;else var a=r.width/2,i=-30,n="80% 70% -"+r.height/2;z=punchgs.Power2.easeInOut,f.add(punchgs.TweenLite.fromTo(e,y/1e3,{opacity:1,rotationX:0,top:0,z:0,scale:1,left:0,force3D:"auto",transformPerspective:600,transformOrigin:n,transformStyle:"flat",rotationY:0},{opacity:1,rotationX:20,top:0,z:-600,left:a,force3D:"auto",rotationY:i,delay:o,ease:z}),0)})}if(21==t||25==t){setTimeout(function(){h.find(".defaultimg").css({opacity:0})},100);var ue=90,we=-r.width,ve=-ue;if(1==g)if(25==t){var ge="center top 0";ue=r.rotate}else{var ge="left center 0";ve=r.rotate}else if(we=r.width,ue=-90,25==t){var ge="center bottom 0";ve=-ue,ue=r.rotate}else{var ge="right center 0";ve=r.rotate}d.find(".slotslide").each(function(){var t=jQuery(this),e=y/1.5/3;f.add(punchgs.TweenLite.fromTo(t,2*e/1e3,{left:0,transformStyle:"flat",rotationX:ve,z:0,autoAlpha:0,top:0,scale:1,force3D:"auto",transformPerspective:1200,transformOrigin:ge,rotationY:ue},{left:0,rotationX:0,top:0,z:0,autoAlpha:1,scale:1,rotationY:0,force3D:"auto",delay:e/1e3,ease:T}),0)}),1!=g?(we=-r.width,ue=90,25==t?(ge="center top 0",ve=-ue,ue=r.rotate):(ge="left center 0",ve=r.rotate)):(we=r.width,ue=-90,25==t?(ge="center bottom 0",ve=-ue,ue=r.rotate):(ge="right center 0",ve=r.rotate)),h.find(".slotslide").each(function(){var t=jQuery(this);f.add(punchgs.TweenLite.fromTo(t,y/1e3,{left:0,transformStyle:"flat",rotationX:0,z:0,autoAlpha:1,top:0,scale:1,force3D:"auto",transformPerspective:1200,transformOrigin:ge,rotationY:0},{left:0,rotationX:ve,top:0,z:0,autoAlpha:1,force3D:"auto",scale:1,rotationY:ue,ease:z}),0)})}if(23==t||24==t){setTimeout(function(){h.find(".defaultimg").css({opacity:0})},100);var ue=-90,$=1,me=0;if(1==g&&(ue=90),23==t){var ge="center center -"+r.width/2;$=0}else var ge="center center "+r.width/2;punchgs.TweenLite.set(n,{transformStyle:"preserve-3d",backfaceVisibility:"hidden",perspective:2500}),d.find(".slotslide").each(function(t){var e=jQuery(this);f.add(punchgs.TweenLite.fromTo(e,y/1e3,{left:me,rotationX:r.rotate,force3D:"auto",opacity:$,top:0,scale:1,transformPerspective:1200,transformOrigin:ge,rotationY:ue},{left:0,rotationX:0,autoAlpha:1,top:0,z:0,scale:1,rotationY:0,delay:50*t/500,ease:T}),0)}),ue=90,1==g&&(ue=-90),h.find(".slotslide").each(function(e){var o=jQuery(this);f.add(punchgs.TweenLite.fromTo(o,y/1e3,{left:0,rotationX:0,top:0,z:0,scale:1,force3D:"auto",transformStyle:"flat",transformPerspective:1200,transformOrigin:ge,rotationY:0},{left:me,rotationX:r.rotate,top:0,scale:1,rotationY:ue,delay:50*e/500,ease:z}),0),23==t&&f.add(punchgs.TweenLite.fromTo(o,y/2e3,{autoAlpha:1},{autoAlpha:0,delay:50*e/500+y/3e3,ease:z}),0)})}return f}}(jQuery);
/********************************************
 * REVOLUTION 5.1 EXTENSION - VIDEO FUNCTIONS
 * @version: 1.2.1 (26.11.2015)
 * @requires jquery.themepunch.revolution.js
 * @author ThemePunch
*********************************************/
!function(e){function t(e){return void 0==e?-1:jQuery.isNumeric(e)?e:e.split(":").length>1?60*parseInt(e.split(":")[0],0)+parseInt(e.split(":")[1],0):e}var a=jQuery.fn.revolution,i=a.is_mobile();jQuery.extend(!0,a,{resetVideo:function(e,d){switch(e.data("videotype")){case"youtube":e.data("player");try{if("on"==e.data("forcerewind")&&!i){var o=t(e.data("videostartat"));o=-1==o?0:o,void 0!=e.data("player")&&(e.data("player").seekTo(o),e.data("player").pauseVideo())}}catch(r){}0==e.find(".tp-videoposter").length&&punchgs.TweenLite.to(e.find("iframe"),.3,{autoAlpha:1,display:"block",ease:punchgs.Power3.easeInOut});break;case"vimeo":var n=$f(e.find("iframe").attr("id"));try{if("on"==e.data("forcerewind")&&!i){var o=t(e.data("videostartat"));o=-1==o?0:o,n.api("seekTo",o),n.api("pause")}}catch(r){}0==e.find(".tp-videoposter").length&&punchgs.TweenLite.to(e.find("iframe"),.3,{autoAlpha:1,display:"block",ease:punchgs.Power3.easeInOut});break;case"html5":if(i&&1==e.data("disablevideoonmobile"))return!1;var s=e.find("video"),l=s[0];if(punchgs.TweenLite.to(s,.3,{autoAlpha:1,display:"block",ease:punchgs.Power3.easeInOut}),"on"==e.data("forcerewind")&&!e.hasClass("videoisplaying"))try{var o=t(e.data("videostartat"));l.currentTime=-1==o?0:o}catch(r){}("mute"==e.data("volume")||a.lastToggleState(e.data("videomutetoggledby")))&&(l.muted=!0)}},isVideoMuted:function(e,t){var a=!1;switch(e.data("videotype")){case"youtube":try{var i=e.data("player");a=i.isMuted()}catch(d){}break;case"vimeo":try{$f(e.find("iframe").attr("id"));"mute"==e.data("volume")&&(a=!0)}catch(d){}break;case"html5":var o=e.find("video"),r=o[0];"mute"==e.data("volume")&&(r.muted=!0)}return a},muteVideo:function(e,t){switch(e.data("videotype")){case"youtube":try{var a=e.data("player");a.mute()}catch(i){}break;case"vimeo":try{var d=$f(e.find("iframe").attr("id"));e.data("volume","mute"),d.api("setVolume",0)}catch(i){}break;case"html5":var o=e.find("video"),r=o[0];r.muted=!0}},unMuteVideo:function(e,t){switch(e.data("videotype")){case"youtube":try{var a=e.data("player");a.unMute()}catch(i){}break;case"vimeo":try{var d=$f(e.find("iframe").attr("id"));e.data("volume","1"),d.api("setVolume",1)}catch(i){}break;case"html5":var o=e.find("video"),r=o[0];r.muted=!1}},stopVideo:function(e,t){switch(e.data("videotype")){case"youtube":try{var a=e.data("player");a.pauseVideo()}catch(i){}break;case"vimeo":try{var d=$f(e.find("iframe").attr("id"));d.api("pause")}catch(i){}break;case"html5":var o=e.find("video"),r=o[0];r.pause()}},playVideo:function(e,o){switch(clearTimeout(e.data("videoplaywait")),e.data("videotype")){case"youtube":if(0==e.find("iframe").length)e.append(e.data("videomarkup")),r(e,o,!0);else if(void 0!=e.data("player").playVideo){var n=t(e.data("videostartat")),s=e.data("player").getCurrentTime();1==e.data("nextslideatend-triggered")&&(s=-1,e.data("nextslideatend-triggered",0)),-1!=n&&n>s&&e.data("player").seekTo(n),e.data("player").playVideo()}else e.data("videoplaywait",setTimeout(function(){a.playVideo(e,o)},50));break;case"vimeo":if(0==e.find("iframe").length)e.append(e.data("videomarkup")),r(e,o,!0);else if(e.hasClass("rs-apiready")){var l=e.find("iframe").attr("id"),p=$f(l);void 0==p.api("play")?e.data("videoplaywait",setTimeout(function(){a.playVideo(e,o)},50)):setTimeout(function(){p.api("play");var a=t(e.data("videostartat")),i=e.data("currenttime");1==e.data("nextslideatend-triggered")&&(i=-1,e.data("nextslideatend-triggered",0)),-1!=a&&a>i&&p.api("seekTo",a)},510)}else e.data("videoplaywait",setTimeout(function(){a.playVideo(e,o)},50));break;case"html5":if(i&&1==e.data("disablevideoonmobile"))return!1;var v=e.find("video"),u=v[0],c=v.parent();if(1!=c.data("metaloaded"))d(u,"loadedmetadata",function(e){a.resetVideo(e,o),u.play();var i=t(e.data("videostartat")),d=u.currentTime;1==e.data("nextslideatend-triggered")&&(d=-1,e.data("nextslideatend-triggered",0)),-1!=i&&i>d&&(u.currentTime=i)}(e));else{u.play();var n=t(e.data("videostartat")),s=u.currentTime;1==e.data("nextslideatend-triggered")&&(s=-1,e.data("nextslideatend-triggered",0)),-1!=n&&n>s&&(u.currentTime=n)}}},isVideoPlaying:function(e,t){var a=!1;return void 0!=t.playingvideos&&jQuery.each(t.playingvideos,function(t,i){e.attr("id")==i.attr("id")&&(a=!0)}),a},prepareCoveredVideo:function(e,t,a){var i=a.find("iframe, video"),d=e.split(":")[0],o=e.split(":")[1],r=a.closest(".tp-revslider-slidesli"),n=r.width()/r.height(),s=d/o,l=n/s*100,p=s/n*100;n>s?punchgs.TweenLite.to(i,.001,{height:l+"%",width:"100%",top:-(l-100)/2+"%",left:"0px",position:"absolute"}):punchgs.TweenLite.to(i,.001,{width:p+"%",height:"100%",left:-(p-100)/2+"%",top:"0px",position:"absolute"})},checkVideoApis:function(e,t,a){var i="https:"===location.protocol?"https":"http";if((void 0!=e.data("ytid")||e.find("iframe").length>0&&e.find("iframe").attr("src").toLowerCase().indexOf("youtube")>0)&&(t.youtubeapineeded=!0),(void 0!=e.data("ytid")||e.find("iframe").length>0&&e.find("iframe").attr("src").toLowerCase().indexOf("youtube")>0)&&0==a.addedyt){t.youtubestarttime=jQuery.now(),a.addedyt=1;var d=document.createElement("script");d.src="https://www.youtube.com/iframe_api";var o=document.getElementsByTagName("script")[0],r=!0;jQuery("head").find("*").each(function(){"https://www.youtube.com/iframe_api"==jQuery(this).attr("src")&&(r=!1)}),r&&o.parentNode.insertBefore(d,o)}if((void 0!=e.data("vimeoid")||e.find("iframe").length>0&&e.find("iframe").attr("src").toLowerCase().indexOf("vimeo")>0)&&(t.vimeoapineeded=!0),(void 0!=e.data("vimeoid")||e.find("iframe").length>0&&e.find("iframe").attr("src").toLowerCase().indexOf("vimeo")>0)&&0==a.addedvim){t.vimeostarttime=jQuery.now(),a.addedvim=1;var n=document.createElement("script"),o=document.getElementsByTagName("script")[0],r=!0;n.src=i+"://f.vimeocdn.com/js/froogaloop2.min.js",jQuery("head").find("*").each(function(){jQuery(this).attr("src")==i+"://a.vimeocdn.com/js/froogaloop2.min.js"&&(r=!1)}),r&&o.parentNode.insertBefore(n,o)}return a},manageVideoLayer:function(e,o,s,l){var p=e.data("videoattributes"),v=e.data("ytid"),u=e.data("vimeoid"),c=e.data("videpreload"),g=e.data("videomp4"),f=e.data("videowebm"),y=e.data("videoogv"),m=e.data("allowfullscreenvideo"),h=e.data("videocontrols"),b="http",w="loop"==e.data("videoloop")?"loop":"loopandnoslidestop"==e.data("videoloop")?"loop":"",T=void 0!=g||void 0!=f?"html5":void 0!=v&&String(v).length>1?"youtube":void 0!=u&&String(u).length>1?"vimeo":"none",k="html5"==T&&0==e.find("video").length?"html5":"youtube"==T&&0==e.find("iframe").length?"youtube":"vimeo"==T&&0==e.find("iframe").length?"vimeo":"none";switch(e.data("videotype",T),k){case"html5":"controls"!=h&&(h="");var x='<video style="object-fit:cover;background-size:cover;visible:hidden;width:100%; height:100%" class="" '+w+' preload="'+c+'">';void 0!=f&&"firefox"==a.get_browser().toLowerCase()&&(x=x+'<source src="'+f+'" type="video/webm" />'),void 0!=g&&(x=x+'<source src="'+g+'" type="video/mp4" />'),void 0!=y&&(x=x+'<source src="'+y+'" type="video/ogg" />'),x+="</video>";var L="";("true"===m||m===!0)&&(L='<div class="tp-video-button-wrap"><button  type="button" class="tp-video-button tp-vid-full-screen">Full-Screen</button></div>'),"controls"==h&&(x+='<div class="tp-video-controls"><div class="tp-video-button-wrap"><button type="button" class="tp-video-button tp-vid-play-pause">Play</button></div><div class="tp-video-seek-bar-wrap"><input  type="range" class="tp-seek-bar" value="0"></div><div class="tp-video-button-wrap"><button  type="button" class="tp-video-button tp-vid-mute">Mute</button></div><div class="tp-video-vol-bar-wrap"><input  type="range" class="tp-volume-bar" min="0" max="1" step="0.1" value="1"></div>'+L+"</div>"),e.data("videomarkup",x),e.append(x),(i&&1==e.data("disablevideoonmobile")||a.isIE(8))&&e.find("video").remove(),e.find("video").each(function(t){var i=this,r=jQuery(this);r.parent().hasClass("html5vid")||r.wrap('<div class="html5vid" style="position:relative;top:0px;left:0px;width:100%;height:100%; overflow:hidden;"></div>');var s=r.parent();1!=s.data("metaloaded")&&d(i,"loadedmetadata",function(e){n(e,o),a.resetVideo(e,o)}(e))});break;case"youtube":b="http","https:"===location.protocol&&(b="https"),"none"==h&&(p=p.replace("controls=1","controls=0"),-1==p.toLowerCase().indexOf("controls")&&(p+="&controls=0"));var V=t(e.data("videostartat")),P=t(e.data("videoendat"));-1!=V&&(p=p+"&start="+V),-1!=P&&(p=p+"&end="+P);var I=p.split("origin="+b+"://"),C="";I.length>1?(C=I[0]+"origin="+b+"://",self.location.href.match(/www/gi)&&!I[1].match(/www/gi)&&(C+="www."),C+=I[1]):C=p;var j="true"===m||m===!0?"allowfullscreen":"";e.data("videomarkup",'<iframe style="visible:hidden" src="'+b+"://www.youtube.com/embed/"+v+"?"+C+'" '+j+' width="100%" height="100%" style="width:100%;height:100%"></iframe>');break;case"vimeo":"https:"===location.protocol&&(b="https"),e.data("videomarkup",'<iframe style="visible:hidden" src="'+b+"://player.vimeo.com/video/"+u+"?"+p+'" webkitallowfullscreen mozallowfullscreen allowfullscreen width="100%" height="100%" style="100%;height:100%"></iframe>')}var _=i&&"on"==e.data("noposteronmobile");if(void 0!=e.data("videoposter")&&e.data("videoposter").length>2&&!_)0==e.find(".tp-videoposter").length&&e.append('<div class="tp-videoposter noSwipe" style="cursor:pointer; position:absolute;top:0px;left:0px;width:100%;height:100%;z-index:3;background-image:url('+e.data("videoposter")+'); background-size:cover;background-position:center center;"></div>'),0==e.find("iframe").length&&e.find(".tp-videoposter").click(function(){if(a.playVideo(e,o),i){if(1==e.data("disablevideoonmobile"))return!1;punchgs.TweenLite.to(e.find(".tp-videoposter"),.3,{autoAlpha:0,force3D:"auto",ease:punchgs.Power3.easeInOut}),punchgs.TweenLite.to(e.find("iframe"),.3,{autoAlpha:1,display:"block",ease:punchgs.Power3.easeInOut})}});else{if(i&&1==e.data("disablevideoonmobile"))return!1;0!=e.find("iframe").length||"youtube"!=T&&"vimeo"!=T||(e.append(e.data("videomarkup")),r(e,o,!1))}"none"!=e.data("dottedoverlay")&&void 0!=e.data("dottedoverlay")&&1!=e.find(".tp-dottedoverlay").length&&e.append('<div class="tp-dottedoverlay '+e.data("dottedoverlay")+'"></div>'),e.addClass("HasListener"),1==e.data("bgvideo")&&punchgs.TweenLite.set(e.find("video, iframe"),{autoAlpha:0})}});var d=function(e,t,a){e.addEventListener?e.addEventListener(t,a,!1):e.attachEvent(t,a,!1)},o=function(e,t,a){var i={};return i.video=e,i.videotype=t,i.settings=a,i},r=function(e,d,r){var n=e.find("iframe"),p="iframe"+Math.round(1e5*Math.random()+1),v=e.data("videoloop"),u="loopandnoslidestop"!=v;if(v="loop"==v||"loopandnoslidestop"==v,1==e.data("forcecover")){e.removeClass("fullscreenvideo").addClass("coverscreenvideo");var c=e.data("aspectratio");void 0!=c&&c.split(":").length>1&&a.prepareCoveredVideo(c,d,e)}if(1==e.data("bgvideo")){var c=e.data("aspectratio");void 0!=c&&c.split(":").length>1&&a.prepareCoveredVideo(c,d,e)}if(n.attr("id",p),r&&e.data("startvideonow",!0),1!==e.data("videolistenerexist"))switch(e.data("videotype")){case"youtube":var g=new YT.Player(p,{events:{onStateChange:function(e){var i=e.target.getVideoEmbedCode(),r=jQuery("#"+i.split('id="')[1].split('"')[0]),n=r.closest(".tp-simpleresponsive"),p=r.parent(),c=r.parent().data("player");if(e.data==YT.PlayerState.PLAYING)punchgs.TweenLite.to(p.find(".tp-videoposter"),.3,{autoAlpha:0,force3D:"auto",ease:punchgs.Power3.easeInOut}),punchgs.TweenLite.to(p.find("iframe"),.3,{autoAlpha:1,display:"block",ease:punchgs.Power3.easeInOut}),"mute"==p.data("volume")||a.lastToggleState(p.data("videomutetoggledby"))?c.mute():(c.unMute(),c.setVolume(parseInt(p.data("volume"),0)||75)),d.videoplaying=!0,s(p,d),u?d.c.trigger("stoptimer"):d.videoplaying=!1,d.c.trigger("revolution.slide.onvideoplay",o(c,"youtube",p.data())),a.toggleState(p.data("videotoggledby"));else{if(0==e.data&&v){var g=t(p.data("videostartat"));-1!=g&&c.seekTo(g),c.playVideo(),a.toggleState(p.data("videotoggledby"))}(0==e.data||2==e.data)&&"on"==p.data("showcoveronpause")&&p.find(".tp-videoposter").length>0&&(punchgs.TweenLite.to(p.find(".tp-videoposter"),.3,{autoAlpha:1,force3D:"auto",ease:punchgs.Power3.easeInOut}),punchgs.TweenLite.to(p.find("iframe"),.3,{autoAlpha:0,ease:punchgs.Power3.easeInOut})),-1!=e.data&&3!=e.data&&(d.videoplaying=!1,l(p,d),n.trigger("starttimer"),d.c.trigger("revolution.slide.onvideostop",o(c,"youtube",p.data())),(void 0==d.currentLayerVideoIsPlaying||d.currentLayerVideoIsPlaying.attr("id")==p.attr("id"))&&a.unToggleState(p.data("videotoggledby"))),0==e.data&&1==p.data("nextslideatend")?(p.data("nextslideatend-triggered",1),d.c.revnext(),l(p,d)):(l(p,d),d.videoplaying=!1,n.trigger("starttimer"),d.c.trigger("revolution.slide.onvideostop",o(c,"youtube",p.data())),(void 0==d.currentLayerVideoIsPlaying||d.currentLayerVideoIsPlaying.attr("id")==p.attr("id"))&&a.unToggleState(p.data("videotoggledby")))}},onReady:function(e){var a=e.target.getVideoEmbedCode(),d=jQuery("#"+a.split('id="')[1].split('"')[0]),o=d.parent(),r=o.data("videorate");o.data("videostart");if(o.addClass("rs-apiready"),void 0!=r&&e.target.setPlaybackRate(parseFloat(r)),o.find(".tp-videoposter").unbind("click"),o.find(".tp-videoposter").click(function(){i||g.playVideo()}),o.data("startvideonow")){o.data("player").playVideo();var n=t(o.data("videostartat"));-1!=n&&o.data("player").seekTo(n)}o.data("videolistenerexist",1)}}});e.data("player",g);break;case"vimeo":for(var f,y=n.attr("src"),m={},h=y,b=/([^&=]+)=([^&]*)/g;f=b.exec(h);)m[decodeURIComponent(f[1])]=decodeURIComponent(f[2]);y=void 0!=m.player_id?y.replace(m.player_id,p):y+"&player_id="+p;try{y=y.replace("api=0","api=1")}catch(w){}y+="&api=1",n.attr("src",y);var g=e.find("iframe")[0],T=(jQuery("#"+p),$f(p));T.addEvent("ready",function(){if(e.addClass("rs-apiready"),T.addEvent("play",function(t){e.data("nextslidecalled",0),punchgs.TweenLite.to(e.find(".tp-videoposter"),.3,{autoAlpha:0,force3D:"auto",ease:punchgs.Power3.easeInOut}),punchgs.TweenLite.to(e.find("iframe"),.3,{autoAlpha:1,display:"block",ease:punchgs.Power3.easeInOut}),d.c.trigger("revolution.slide.onvideoplay",o(T,"vimeo",e.data())),d.videoplaying=!0,s(e,d),u?d.c.trigger("stoptimer"):d.videoplaying=!1,"mute"==e.data("volume")||a.lastToggleState(e.data("videomutetoggledby"))?T.api("setVolume","0"):T.api("setVolume",parseInt(e.data("volume"),0)/100||.75),a.toggleState(e.data("videotoggledby"))}),T.addEvent("playProgress",function(a){var i=t(e.data("videoendat"));if(e.data("currenttime",a.seconds),0!=i&&Math.abs(i-a.seconds)<.3&&i>a.seconds&&1!=e.data("nextslidecalled"))if(v){T.api("play");var o=t(e.data("videostartat"));-1!=o&&T.api("seekTo",o)}else 1==e.data("nextslideatend")&&(e.data("nextslideatend-triggered",1),e.data("nextslidecalled",1),d.c.revnext()),T.api("pause")}),T.addEvent("finish",function(t){l(e,d),d.videoplaying=!1,d.c.trigger("starttimer"),d.c.trigger("revolution.slide.onvideostop",o(T,"vimeo",e.data())),1==e.data("nextslideatend")&&(e.data("nextslideatend-triggered",1),d.c.revnext()),(void 0==d.currentLayerVideoIsPlaying||d.currentLayerVideoIsPlaying.attr("id")==e.attr("id"))&&a.unToggleState(e.data("videotoggledby"))}),T.addEvent("pause",function(t){e.find(".tp-videoposter").length>0&&"on"==e.data("showcoveronpause")&&(punchgs.TweenLite.to(e.find(".tp-videoposter"),.3,{autoAlpha:1,force3D:"auto",ease:punchgs.Power3.easeInOut}),punchgs.TweenLite.to(e.find("iframe"),.3,{autoAlpha:0,ease:punchgs.Power3.easeInOut})),d.videoplaying=!1,l(e,d),d.c.trigger("starttimer"),d.c.trigger("revolution.slide.onvideostop",o(T,"vimeo",e.data())),(void 0==d.currentLayerVideoIsPlaying||d.currentLayerVideoIsPlaying.attr("id")==e.attr("id"))&&a.unToggleState(e.data("videotoggledby"))}),e.find(".tp-videoposter").unbind("click"),e.find(".tp-videoposter").click(function(){return i?void 0:(T.api("play"),!1)}),e.data("startvideonow")){T.api("play");var r=t(e.data("videostartat"));-1!=r&&T.api("seekTo",r)}e.data("videolistenerexist",1)})}else{var k=t(e.data("videostartat"));switch(e.data("videotype")){case"youtube":r&&(e.data("player").playVideo(),-1!=k&&e.data("player").seekTo());break;case"vimeo":if(r){var T=$f(e.find("iframe").attr("id"));T.api("play"),-1!=k&&T.api("seekTo",k)}}}},n=function(e,r,n){if(i&&1==e.data("disablevideoonmobile"))return!1;var p=e.find("video"),v=p[0],u=p.parent(),c=e.data("videoloop"),g="loopandnoslidestop"!=c;if(c="loop"==c||"loopandnoslidestop"==c,u.data("metaloaded",1),void 0==p.attr("control")&&(0!=e.find(".tp-video-play-button").length||i||e.append('<div class="tp-video-play-button"><i class="revicon-right-dir"></i><span class="tp-revstop">&nbsp;</span></div>'),e.find("video, .tp-poster, .tp-video-play-button").click(function(){e.hasClass("videoisplaying")?v.pause():v.play()})),1==e.data("forcecover")||e.hasClass("fullscreenvideo")||1==e.data("bgvideo"))if(1==e.data("forcecover")||1==e.data("bgvideo")){u.addClass("fullcoveredvideo");var f=e.data("aspectratio")||"4:3";a.prepareCoveredVideo(f,r,e)}else u.addClass("fullscreenvideo");var y=e.find(".tp-vid-play-pause")[0],m=e.find(".tp-vid-mute")[0],h=e.find(".tp-vid-full-screen")[0],b=e.find(".tp-seek-bar")[0],w=e.find(".tp-volume-bar")[0];void 0!=y&&d(y,"click",function(){1==v.paused?v.play():v.pause()}),void 0!=m&&d(m,"click",function(){0==v.muted?(v.muted=!0,m.innerHTML="Unmute"):(v.muted=!1,m.innerHTML="Mute")}),void 0!=h&&h&&d(h,"click",function(){v.requestFullscreen?v.requestFullscreen():v.mozRequestFullScreen?v.mozRequestFullScreen():v.webkitRequestFullscreen&&v.webkitRequestFullscreen()}),void 0!=b&&(d(b,"change",function(){var e=v.duration*(b.value/100);v.currentTime=e}),d(b,"mousedown",function(){e.addClass("seekbardragged"),v.pause()}),d(b,"mouseup",function(){e.removeClass("seekbardragged"),v.play()})),d(v,"timeupdate",function(){var a=100/v.duration*v.currentTime,i=t(e.data("videoendat")),d=v.currentTime;if(void 0!=b&&(b.value=a),0!=i&&-1!=i&&Math.abs(i-d)<=.3&&i>d&&1!=e.data("nextslidecalled"))if(c){v.play();var o=t(e.data("videostartat"));-1!=o&&(v.currentTime=o)}else 1==e.data("nextslideatend")&&(e.data("nextslideatend-triggered",1),e.data("nextslidecalled",1),r.just_called_nextslide_at_htmltimer=!0,r.c.revnext(),setTimeout(function(){r.just_called_nextslide_at_htmltimer=!1},1e3)),v.pause()}),void 0!=w&&d(w,"change",function(){v.volume=w.value}),d(v,"play",function(){e.data("nextslidecalled",0),"mute"==e.data("volume")&&(v.muted=!0),e.addClass("videoisplaying"),s(e,r),g?(r.videoplaying=!0,r.c.trigger("stoptimer"),r.c.trigger("revolution.slide.onvideoplay",o(v,"html5",e.data()))):(r.videoplaying=!1,r.c.trigger("starttimer"),r.c.trigger("revolution.slide.onvideostop",o(v,"html5",e.data()))),punchgs.TweenLite.to(e.find(".tp-videoposter"),.3,{autoAlpha:0,force3D:"auto",ease:punchgs.Power3.easeInOut}),punchgs.TweenLite.to(e.find("video"),.3,{autoAlpha:1,display:"block",ease:punchgs.Power3.easeInOut});var t=e.find(".tp-vid-play-pause")[0],i=e.find(".tp-vid-mute")[0];void 0!=t&&(t.innerHTML="Pause"),void 0!=i&&v.muted&&(i.innerHTML="Unmute"),a.toggleState(e.data("videotoggledby"))}),d(v,"pause",function(){e.find(".tp-videoposter").length>0&&"on"==e.data("showcoveronpause")&&!e.hasClass("seekbardragged")&&(punchgs.TweenLite.to(e.find(".tp-videoposter"),.3,{autoAlpha:1,force3D:"auto",ease:punchgs.Power3.easeInOut}),punchgs.TweenLite.to(e.find("video"),.3,{autoAlpha:0,ease:punchgs.Power3.easeInOut})),e.removeClass("videoisplaying"),r.videoplaying=!1,l(e,r),r.c.trigger("starttimer"),r.c.trigger("revolution.slide.onvideostop",o(v,"html5",e.data()));var t=e.find(".tp-vid-play-pause")[0];void 0!=t&&(t.innerHTML="Play"),(void 0==r.currentLayerVideoIsPlaying||r.currentLayerVideoIsPlaying.attr("id")==e.attr("id"))&&a.unToggleState(e.data("videotoggledby"))}),d(v,"ended",function(){l(e,r),r.videoplaying=!1,l(e,r),r.c.trigger("starttimer"),r.c.trigger("revolution.slide.onvideostop",o(v,"html5",e.data())),1==e.data("nextslideatend")&&(1==!r.just_called_nextslide_at_htmltimer&&(e.data("nextslideatend-triggered",1),r.c.revnext(),r.just_called_nextslide_at_htmltimer=!0),setTimeout(function(){r.just_called_nextslide_at_htmltimer=!1},1500)),e.removeClass("videoisplaying")})},s=function(e,t){void 0==t.playingvideos&&(t.playingvideos=new Array),e.data("stopallvideos")&&void 0!=t.playingvideos&&t.playingvideos.length>0&&(t.lastplayedvideos=jQuery.extend(!0,[],t.playingvideos),jQuery.each(t.playingvideos,function(e,i){a.stopVideo(i,t)})),t.playingvideos.push(e),t.currentLayerVideoIsPlaying=e},l=function(e,t){void 0!=t.playingvideos&&t.playingvideos.splice(jQuery.inArray(e,t.playingvideos),1)}}(jQuery);
/*! iCheck v1.0.2 by Damir Sultanov, http://git.io/arlzeA, MIT Licensed */
(function(f){function A(a,b,d){var c=a[0],g=/er/.test(d)?_indeterminate:/bl/.test(d)?n:k,e=d==_update?{checked:c[k],disabled:c[n],indeterminate:"true"==a.attr(_indeterminate)||"false"==a.attr(_determinate)}:c[g];if(/^(ch|di|in)/.test(d)&&!e)x(a,g);else if(/^(un|en|de)/.test(d)&&e)q(a,g);else if(d==_update)for(var f in e)e[f]?x(a,f,!0):q(a,f,!0);else if(!b||"toggle"==d){if(!b)a[_callback]("ifClicked");e?c[_type]!==r&&q(a,g):x(a,g)}}function x(a,b,d){var c=a[0],g=a.parent(),e=b==k,u=b==_indeterminate,
v=b==n,s=u?_determinate:e?y:"enabled",F=l(a,s+t(c[_type])),B=l(a,b+t(c[_type]));if(!0!==c[b]){if(!d&&b==k&&c[_type]==r&&c.name){var w=a.closest("form"),p='input[name="'+c.name+'"]',p=w.length?w.find(p):f(p);p.each(function(){this!==c&&f(this).data(m)&&q(f(this),b)})}u?(c[b]=!0,c[k]&&q(a,k,"force")):(d||(c[b]=!0),e&&c[_indeterminate]&&q(a,_indeterminate,!1));D(a,e,b,d)}c[n]&&l(a,_cursor,!0)&&g.find("."+C).css(_cursor,"default");g[_add](B||l(a,b)||"");g.attr("role")&&!u&&g.attr("aria-"+(v?n:k),"true");
g[_remove](F||l(a,s)||"")}function q(a,b,d){var c=a[0],g=a.parent(),e=b==k,f=b==_indeterminate,m=b==n,s=f?_determinate:e?y:"enabled",q=l(a,s+t(c[_type])),r=l(a,b+t(c[_type]));if(!1!==c[b]){if(f||!d||"force"==d)c[b]=!1;D(a,e,s,d)}!c[n]&&l(a,_cursor,!0)&&g.find("."+C).css(_cursor,"pointer");g[_remove](r||l(a,b)||"");g.attr("role")&&!f&&g.attr("aria-"+(m?n:k),"false");g[_add](q||l(a,s)||"")}function E(a,b){if(a.data(m)){a.parent().html(a.attr("style",a.data(m).s||""));if(b)a[_callback](b);a.off(".i").unwrap();
f(_label+'[for="'+a[0].id+'"]').add(a.closest(_label)).off(".i")}}function l(a,b,f){if(a.data(m))return a.data(m).o[b+(f?"":"Class")]}function t(a){return a.charAt(0).toUpperCase()+a.slice(1)}function D(a,b,f,c){if(!c){if(b)a[_callback]("ifToggled");a[_callback]("ifChanged")[_callback]("if"+t(f))}}var m="iCheck",C=m+"-helper",r="radio",k="checked",y="un"+k,n="disabled";_determinate="determinate";_indeterminate="in"+_determinate;_update="update";_type="type";_click="click";_touch="touchbegin.i touchend.i";
_add="addClass";_remove="removeClass";_callback="trigger";_label="label";_cursor="cursor";_mobile=/ipad|iphone|ipod|android|blackberry|windows phone|opera mini|silk/i.test(navigator.userAgent);f.fn[m]=function(a,b){var d='input[type="checkbox"], input[type="'+r+'"]',c=f(),g=function(a){a.each(function(){var a=f(this);c=a.is(d)?c.add(a):c.add(a.find(d))})};if(/^(check|uncheck|toggle|indeterminate|determinate|disable|enable|update|destroy)$/i.test(a))return a=a.toLowerCase(),g(this),c.each(function(){var c=
f(this);"destroy"==a?E(c,"ifDestroyed"):A(c,!0,a);f.isFunction(b)&&b()});if("object"!=typeof a&&a)return this;var e=f.extend({checkedClass:k,disabledClass:n,indeterminateClass:_indeterminate,labelHover:!0},a),l=e.handle,v=e.hoverClass||"hover",s=e.focusClass||"focus",t=e.activeClass||"active",B=!!e.labelHover,w=e.labelHoverClass||"hover",p=(""+e.increaseArea).replace("%","")|0;if("checkbox"==l||l==r)d='input[type="'+l+'"]';-50>p&&(p=-50);g(this);return c.each(function(){var a=f(this);E(a);var c=this,
b=c.id,g=-p+"%",d=100+2*p+"%",d={position:"absolute",top:g,left:g,display:"block",width:d,height:d,margin:0,padding:0,background:"#fff",border:0,opacity:0},g=_mobile?{position:"absolute",visibility:"hidden"}:p?d:{position:"absolute",opacity:0},l="checkbox"==c[_type]?e.checkboxClass||"icheckbox":e.radioClass||"i"+r,z=f(_label+'[for="'+b+'"]').add(a.closest(_label)),u=!!e.aria,y=m+"-"+Math.random().toString(36).substr(2,6),h='<div class="'+l+'" '+(u?'role="'+c[_type]+'" ':"");u&&z.each(function(){h+=
'aria-labelledby="';this.id?h+=this.id:(this.id=y,h+=y);h+='"'});h=a.wrap(h+"/>")[_callback]("ifCreated").parent().append(e.insert);d=f('<ins class="'+C+'"/>').css(d).appendTo(h);a.data(m,{o:e,s:a.attr("style")}).css(g);e.inheritClass&&h[_add](c.className||"");e.inheritID&&b&&h.attr("id",m+"-"+b);"static"==h.css("position")&&h.css("position","relative");A(a,!0,_update);if(z.length)z.on(_click+".i mouseover.i mouseout.i "+_touch,function(b){var d=b[_type],e=f(this);if(!c[n]){if(d==_click){if(f(b.target).is("a"))return;
A(a,!1,!0)}else B&&(/ut|nd/.test(d)?(h[_remove](v),e[_remove](w)):(h[_add](v),e[_add](w)));if(_mobile)b.stopPropagation();else return!1}});a.on(_click+".i focus.i blur.i keyup.i keydown.i keypress.i",function(b){var d=b[_type];b=b.keyCode;if(d==_click)return!1;if("keydown"==d&&32==b)return c[_type]==r&&c[k]||(c[k]?q(a,k):x(a,k)),!1;if("keyup"==d&&c[_type]==r)!c[k]&&x(a,k);else if(/us|ur/.test(d))h["blur"==d?_remove:_add](s)});d.on(_click+" mousedown mouseup mouseover mouseout "+_touch,function(b){var d=
b[_type],e=/wn|up/.test(d)?t:v;if(!c[n]){if(d==_click)A(a,!1,!0);else{if(/wn|er|in/.test(d))h[_add](e);else h[_remove](e+" "+t);if(z.length&&B&&e==v)z[/ut|nd/.test(d)?_remove:_add](w)}if(_mobile)b.stopPropagation();else return!1}})})}})(window.jQuery||window.Zepto);

/*
 * A plugin for making Bootstrap's pagination more responsive
 * https://github.com/auxiliary/rpage
 */

(function ($){
    jQuery.fn.rPage = function () {
        var $this = $(this);
        for(var i = 0, max = $this.length; i < max; i++)
        {
        	new rPage($($this[i]));
        }

        function rPage($container)
        {
        	this.label = function()
        	{
        		var active_index = this.els.filter(".active").index();
        		var rp = this;
        		this.els.each(function(){
        			if (rp.isNextOrPrevLink($(this)) == false)
        			{
        				$(this).addClass("page-away-" + (Math.abs(active_index - $(this).index())).toString());
        			}
        			else
        			{
        				if ($(this).index() > active_index)
        				{
        					$(this).addClass("right-etc");
        				}
        				else
        				{
        					$(this).addClass("left-etc");
        				}
        			}
        		});
        	}

        	this.makeResponsive = function()
    	    {
    	    	this.reset();
    	    	var width = this.calculateWidth();

    	    	while (width > this.els.parent().parent().outerWidth() - 10)
    	    	{
    	    		var did_remove = this.removeOne();
    	    		if (did_remove == false)
    	    		{
    	    			break;
    	    		}
    	    		width = this.calculateWidth();
    	    	}
    	    }

        	this.isNextOrPrevLink = function(element)
        	{
                return (
                    element.hasClass('pagination-prev')
                    || element.hasClass('pagination-next')
                    || element.text() == "»"
                    || element.text() == "«"
                );
        	}

        	this.isRemovable = function(element)
        	{
        		if (this.isNextOrPrevLink(element))
        		{
        			return false;
        		}
        		var index = this.els.filter(element).index();
        		if (index == 1 || this.isNextOrPrevLink($container.find("li").eq(index + 1)))
        		{
        			return false;
        		}
        		if (element.text() == "...")
        		{
        			return false;
        		}
        		return true;
        	}

    	    this.removeOne = function()
    	    {
    	    	var active_index = this.els.filter(".active").index();
    	    	var farthest_index = $container.find("li").length - 1;
    	    	var next = active_index + 1;
    	    	var prev = active_index - 1;

    	    	for (var i = farthest_index - 1; i > 0; i--)
    	    	{
    	    		var candidates = this.els.filter(".page-away-" + i.toString());
    	    		var candidate = candidates.filter(function(){
    	    			return this.style["display"] != "none";
    	    		});
    	    		if (candidate.length > 0)
    	    		{
    	    			for (var j = 0; j < candidate.length; j++)
    	    			{
    	    				var candid_candidate = candidate.eq(j);
    	    				if (this.isRemovable(candid_candidate))
    		    			{
    			    			candid_candidate.css("display", "none");
    			    			if (this.needsEtcSign(active_index, farthest_index - 1))
    			    			{
    			    				this.els.eq(farthest_index - 2).before("<li class='disabled removable'><span>...</span></li>");
    			    			}
    			    			if (this.needsEtcSign(1, active_index))
    			    			{
    			    				this.els.eq(1).after("<li class='disabled removable'><span>...</span></li>");
    			    			}
    			    			return true;
    		    			}
    	    			}
    	    		}
    	    	}
    	    	return false;
    	    }

    	    this.needsEtcSign = function(el1_index, el2_index)
    	    {
    	    	if (el2_index - el1_index <= 1)
    	    	{
    	    		return false;
    	    	}
    	    	else
    	    	{
    	    		var hasEtcSign = false;
    	    		var hasHiddenElement = false;
    	    		for (var i = el1_index + 1; i < el2_index; i++)
    	    		{
    	    			var el = $container.find("li").eq(i);
    	    			if (el.css("display") == "none")
    	    			{
    	    				hasHiddenElement = true;
    	    			}
    	    			if (el.text() == "...")
    	    			{
    	    				hasEtcSign = true;
    	    			}
    	    		}
    	    		if (hasHiddenElement == true && hasEtcSign == false)
    	    		{
    	    			return true;
    	    		}
    	    	}
    	    	return false;
    	    }

    	    this.reset = function()
    	    {
    	    	for (var i = 0; i < this.els.length; i++)
    	    	{
    	    		this.els.eq(i).css("display", "inline");
    	    	}
    	    	$container.find("li").filter(".removable").remove();
    	    }

    	    this.calculateWidth = function()
    	    {
    	    	var width = 0;
    	    	for (var i = 0; i < $container.find("li").length; i++)
    	    	{
    	    		width += $container.find("li").eq(i).children("a").eq(0).outerWidth();
    	    		width += $container.find("li").eq(i).children("span").eq(0).outerWidth();
    	    	}
    	    	return width;
    	    }

    	    this.els = $container.find("li");
    	    this.label();
    	    this.makeResponsive();

    	    var resize_timer;

            $(window).resize(
            	$.proxy(function()
            	{
            		clearTimeout(resize_timer);
            		resize_timer = setTimeout($.proxy(function(){this.makeResponsive()}, this), 100);
            	}, this)
            );
        }
    };
}(jQuery));

/**
 * @license
 * =========================================================
 * bootstrap-datetimepicker.js
 * http://www.eyecon.ro/bootstrap-datepicker
 * =========================================================
 * Copyright 2012 Stefan Petre
 *
 * Contributions:
 *  - Andrew Rowls
 *  - Thiago de Arruda
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =========================================================
 */
(function($){var smartPhone=window.orientation!=undefined;var DateTimePicker=function(element,options){this.id=dpgId++;this.init(element,options)};var dateToDate=function(dt){if(typeof dt==="string"){return new Date(dt)}return dt};DateTimePicker.prototype={constructor:DateTimePicker,init:function(element,options){var icon;if(!(options.pickTime||options.pickDate))throw new Error("Must choose at least one picker");this.options=options;this.$element=$(element);this.language=options.language in dates?options.language:"en";this.pickDate=options.pickDate;this.pickTime=options.pickTime;this.isInput=this.$element.is("input");this.component=false;if(this.$element.find(".input-append")||this.$element.find(".input-prepend"))this.component=this.$element.find(".add-on");this.format=options.format;if(!this.format){if(this.isInput)this.format=this.$element.data("format");else this.format=this.$element.find("input").data("format");if(!this.format)this.format="MM/dd/yyyy"}this._compileFormat();if(this.component){icon=this.component.find("i")}if(this.pickTime){if(icon&&icon.length)this.timeIcon=icon.data("time-icon");if(!this.timeIcon)this.timeIcon="icon-time";icon.addClass(this.timeIcon)}if(this.pickDate){if(icon&&icon.length)this.dateIcon=icon.data("date-icon");if(!this.dateIcon)this.dateIcon="icon-calendar";icon.removeClass(this.timeIcon);icon.addClass(this.dateIcon)}this.widget=$(getTemplate(this.timeIcon,options.pickDate,options.pickTime,options.pick12HourFormat,options.pickSeconds,options.collapse)).appendTo("body");this.minViewMode=options.minViewMode||this.$element.data("date-minviewmode")||0;if(typeof this.minViewMode==="string"){switch(this.minViewMode){case"months":this.minViewMode=1;break;case"years":this.minViewMode=2;break;default:this.minViewMode=0;break}}this.viewMode=options.viewMode||this.$element.data("date-viewmode")||0;if(typeof this.viewMode==="string"){switch(this.viewMode){case"months":this.viewMode=1;break;case"years":this.viewMode=2;break;default:this.viewMode=0;break}}this.startViewMode=this.viewMode;this.weekStart=options.weekStart||this.$element.data("date-weekstart")||0;this.weekEnd=this.weekStart===0?6:this.weekStart-1;this.setStartDate(options.startDate||this.$element.data("date-startdate"));this.setEndDate(options.endDate||this.$element.data("date-enddate"));this.fillDow();this.fillMonths();this.fillHours();this.fillMinutes();this.fillSeconds();this.update();this.showMode();this._attachDatePickerEvents()},show:function(e){this.widget.show();this.height=this.component?this.component.outerHeight():this.$element.outerHeight();this.place();this.$element.trigger({type:"show",date:this._date});this._attachDatePickerGlobalEvents();if(e){e.stopPropagation();e.preventDefault()}},disable:function(){this.$element.find("input").prop("disabled",true);this._detachDatePickerEvents()},enable:function(){this.$element.find("input").prop("disabled",false);this._attachDatePickerEvents()},hide:function(){var collapse=this.widget.find(".collapse");for(var i=0;i<collapse.length;i++){var collapseData=collapse.eq(i).data("collapse");if(collapseData&&collapseData.transitioning)return}this.widget.hide();this.viewMode=this.startViewMode;this.showMode();this.set();this.$element.trigger({type:"hide",date:this._date});this._detachDatePickerGlobalEvents()},set:function(){var formatted="";if(!this._unset)formatted=this.formatDate(this._date);if(!this.isInput){if(this.component){var input=this.$element.find("input");input.val(formatted);this._resetMaskPos(input)}this.$element.data("date",formatted)}else{this.$element.val(formatted);this._resetMaskPos(this.$element)}},setValue:function(newDate){if(!newDate){this._unset=true}else{this._unset=false}if(typeof newDate==="string"){this._date=this.parseDate(newDate)}else if(newDate){this._date=new Date(newDate)}this.set();this.viewDate=UTCDate(this._date.getUTCFullYear(),this._date.getUTCMonth(),1,0,0,0,0);this.fillDate();this.fillTime()},getDate:function(){if(this._unset)return null;return new Date(this._date.valueOf())},setDate:function(date){if(!date)this.setValue(null);else this.setValue(date.valueOf())},setStartDate:function(date){if(date instanceof Date){this.startDate=date}else if(typeof date==="string"){this.startDate=new UTCDate(date);if(!this.startDate.getUTCFullYear()){this.startDate=-Infinity}}else{this.startDate=-Infinity}if(this.viewDate){this.update()}},setEndDate:function(date){if(date instanceof Date){this.endDate=date}else if(typeof date==="string"){this.endDate=new UTCDate(date);if(!this.endDate.getUTCFullYear()){this.endDate=Infinity}}else{this.endDate=Infinity}if(this.viewDate){this.update()}},getLocalDate:function(){if(this._unset)return null;var d=this._date;return new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),d.getUTCHours(),d.getUTCMinutes(),d.getUTCSeconds(),d.getUTCMilliseconds())},setLocalDate:function(localDate){if(!localDate)this.setValue(null);else this.setValue(Date.UTC(localDate.getFullYear(),localDate.getMonth(),localDate.getDate(),localDate.getHours(),localDate.getMinutes(),localDate.getSeconds(),localDate.getMilliseconds()))},place:function(){var position="absolute";var offset=this.component?this.component.offset():this.$element.offset();this.width=this.component?this.component.outerWidth():this.$element.outerWidth();offset.top=offset.top+this.height;var $window=$(window);if(this.options.width!=undefined){this.widget.width(this.options.width)}if(this.options.orientation=="left"){this.widget.addClass("left-oriented");offset.left=offset.left-this.widget.width()+20}if(this._isInFixed()){position="fixed";offset.top-=$window.scrollTop();offset.left-=$window.scrollLeft()}if($window.width()<offset.left+this.widget.outerWidth()){offset.right=$window.width()-offset.left-this.width;offset.left="auto";this.widget.addClass("pull-right")}else{offset.right="auto";this.widget.removeClass("pull-right")}this.widget.css({position:position,top:offset.top,left:offset.left,right:offset.right})},notifyChange:function(){this.$element.trigger({type:"changeDate",date:this.getDate(),localDate:this.getLocalDate()})},update:function(newDate){var dateStr=newDate;if(!dateStr){if(this.isInput){dateStr=this.$element.val()}else{dateStr=this.$element.find("input").val()}if(dateStr){this._date=this.parseDate(dateStr)}if(!this._date){var tmp=new Date;this._date=UTCDate(tmp.getFullYear(),tmp.getMonth(),tmp.getDate(),tmp.getHours(),tmp.getMinutes(),tmp.getSeconds(),tmp.getMilliseconds())}}this.viewDate=UTCDate(this._date.getUTCFullYear(),this._date.getUTCMonth(),1,0,0,0,0);this.fillDate();this.fillTime()},fillDow:function(){var dowCnt=this.weekStart;var html=$("<tr>");while(dowCnt<this.weekStart+7){html.append('<th class="dow">'+dates[this.language].daysMin[dowCnt++%7]+"</th>")}this.widget.find(".datepicker-days thead").append(html)},fillMonths:function(){var html="";var i=0;while(i<12){html+='<span class="month">'+dates[this.language].monthsShort[i++]+"</span>"}this.widget.find(".datepicker-months td").append(html)},fillDate:function(){var year=this.viewDate.getUTCFullYear();var month=this.viewDate.getUTCMonth();var currentDate=UTCDate(this._date.getUTCFullYear(),this._date.getUTCMonth(),this._date.getUTCDate(),0,0,0,0);var startYear=typeof this.startDate==="object"?this.startDate.getUTCFullYear():-Infinity;var startMonth=typeof this.startDate==="object"?this.startDate.getUTCMonth():-1;var endYear=typeof this.endDate==="object"?this.endDate.getUTCFullYear():Infinity;var endMonth=typeof this.endDate==="object"?this.endDate.getUTCMonth():12;this.widget.find(".datepicker-days").find(".disabled").removeClass("disabled");this.widget.find(".datepicker-months").find(".disabled").removeClass("disabled");this.widget.find(".datepicker-years").find(".disabled").removeClass("disabled");this.widget.find(".datepicker-days th:eq(1)").text(dates[this.language].months[month]+" "+year);var prevMonth=UTCDate(year,month-1,28,0,0,0,0);var day=DPGlobal.getDaysInMonth(prevMonth.getUTCFullYear(),prevMonth.getUTCMonth());prevMonth.setUTCDate(day);prevMonth.setUTCDate(day-(prevMonth.getUTCDay()-this.weekStart+7)%7);if(year==startYear&&month<=startMonth||year<startYear){this.widget.find(".datepicker-days th:eq(0)").addClass("disabled")}if(year==endYear&&month>=endMonth||year>endYear){this.widget.find(".datepicker-days th:eq(2)").addClass("disabled")}var nextMonth=new Date(prevMonth.valueOf());nextMonth.setUTCDate(nextMonth.getUTCDate()+42);nextMonth=nextMonth.valueOf();var html=[];var row;var clsName;while(prevMonth.valueOf()<nextMonth){if(prevMonth.getUTCDay()===this.weekStart){row=$("<tr>");html.push(row)}clsName="";if(prevMonth.getUTCFullYear()<year||prevMonth.getUTCFullYear()==year&&prevMonth.getUTCMonth()<month){clsName+=" old"}else if(prevMonth.getUTCFullYear()>year||prevMonth.getUTCFullYear()==year&&prevMonth.getUTCMonth()>month){clsName+=" new"}if(prevMonth.valueOf()===currentDate.valueOf()){clsName+=" active"}if(prevMonth.valueOf()+864e5<=this.startDate){clsName+=" disabled"}if(prevMonth.valueOf()>this.endDate){clsName+=" disabled"}row.append('<td class="day'+clsName+'">'+prevMonth.getUTCDate()+"</td>");prevMonth.setUTCDate(prevMonth.getUTCDate()+1)}this.widget.find(".datepicker-days tbody").empty().append(html);var currentYear=this._date.getUTCFullYear();var months=this.widget.find(".datepicker-months").find("th:eq(1)").text(year).end().find("span").removeClass("active");if(currentYear===year){months.eq(this._date.getUTCMonth()).addClass("active")}if(currentYear-1<startYear){this.widget.find(".datepicker-months th:eq(0)").addClass("disabled")}if(currentYear+1>endYear){this.widget.find(".datepicker-months th:eq(2)").addClass("disabled")}for(var i=0;i<12;i++){if(year==startYear&&startMonth>i||year<startYear){$(months[i]).addClass("disabled")}else if(year==endYear&&endMonth<i||year>endYear){$(months[i]).addClass("disabled")}}html="";year=parseInt(year/10,10)*10;var yearCont=this.widget.find(".datepicker-years").find("th:eq(1)").text(year+"-"+(year+9)).end().find("td");this.widget.find(".datepicker-years").find("th").removeClass("disabled");if(startYear>year){this.widget.find(".datepicker-years").find("th:eq(0)").addClass("disabled")}if(endYear<year+9){this.widget.find(".datepicker-years").find("th:eq(2)").addClass("disabled")}year-=1;for(var i=-1;i<11;i++){html+='<span class="year'+(i===-1||i===10?" old":"")+(currentYear===year?" active":"")+(year<startYear||year>endYear?" disabled":"")+'">'+year+"</span>";year+=1}yearCont.html(html)},fillHours:function(){var table=this.widget.find(".timepicker .timepicker-hours table");table.parent().hide();var html="";if(this.options.pick12HourFormat){var current=1;for(var i=0;i<3;i+=1){html+="<tr>";for(var j=0;j<4;j+=1){var c=current.toString();html+='<td class="hour">'+padLeft(c,2,"0")+"</td>";current++}html+="</tr>"}}else{var current=0;for(var i=0;i<6;i+=1){html+="<tr>";for(var j=0;j<4;j+=1){var c=current.toString();html+='<td class="hour">'+padLeft(c,2,"0")+"</td>";current++}html+="</tr>"}}table.html(html)},fillMinutes:function(){var table=this.widget.find(".timepicker .timepicker-minutes table");table.parent().hide();var html="";var current=0;for(var i=0;i<5;i++){html+="<tr>";for(var j=0;j<4;j+=1){var c=current.toString();html+='<td class="minute">'+padLeft(c,2,"0")+"</td>";current+=3}html+="</tr>"}table.html(html)},fillSeconds:function(){var table=this.widget.find(".timepicker .timepicker-seconds table");table.parent().hide();var html="";var current=0;for(var i=0;i<5;i++){html+="<tr>";for(var j=0;j<4;j+=1){var c=current.toString();html+='<td class="second">'+padLeft(c,2,"0")+"</td>";current+=3}html+="</tr>"}table.html(html)},fillTime:function(){if(!this._date)return;var timeComponents=this.widget.find(".timepicker span[data-time-component]");var table=timeComponents.closest("table");var is12HourFormat=this.options.pick12HourFormat;var hour=this._date.getUTCHours();var period="AM";if(is12HourFormat){if(hour>=12)period="PM";if(hour===0)hour=12;else if(hour!=12)hour=hour%12;this.widget.find(".timepicker [data-action=togglePeriod]").text(period)}hour=padLeft(hour.toString(),2,"0");var minute=padLeft(this._date.getUTCMinutes().toString(),2,"0");var second=padLeft(this._date.getUTCSeconds().toString(),2,"0");timeComponents.filter("[data-time-component=hours]").text(hour);timeComponents.filter("[data-time-component=minutes]").text(minute);timeComponents.filter("[data-time-component=seconds]").text(second)},click:function(e){e.stopPropagation();e.preventDefault();this._unset=false;var target=$(e.target).closest("span, td, th");if(target.length===1){if(!target.is(".disabled")){switch(target[0].nodeName.toLowerCase()){case"th":switch(target[0].className){case"switch":this.showMode(1);break;case"prev":case"next":var vd=this.viewDate;var navFnc=DPGlobal.modes[this.viewMode].navFnc;var step=DPGlobal.modes[this.viewMode].navStep;if(target[0].className==="prev")step=step*-1;vd["set"+navFnc](vd["get"+navFnc]()+step);this.fillDate();this.set();break}break;case"span":if(target.is(".month")){var month=target.parent().find("span").index(target);this.viewDate.setUTCMonth(month)}else{var year=parseInt(target.text(),10)||0;this.viewDate.setUTCFullYear(year)}if(this.viewMode!==0){this._date=UTCDate(this.viewDate.getUTCFullYear(),this.viewDate.getUTCMonth(),this.viewDate.getUTCDate(),this._date.getUTCHours(),this._date.getUTCMinutes(),this._date.getUTCSeconds(),this._date.getUTCMilliseconds());this.notifyChange()}this.showMode(-1);this.fillDate();this.set();break;case"td":if(target.is(".day")){var day=parseInt(target.text(),10)||1;var month=this.viewDate.getUTCMonth();var year=this.viewDate.getUTCFullYear();if(target.is(".old")){if(month===0){month=11;year-=1}else{month-=1}}else if(target.is(".new")){if(month==11){month=0;year+=1}else{month+=1}}this._date=UTCDate(year,month,day,this._date.getUTCHours(),this._date.getUTCMinutes(),this._date.getUTCSeconds(),this._date.getUTCMilliseconds());this.viewDate=UTCDate(year,month,Math.min(28,day),0,0,0,0);this.fillDate();this.set();this.notifyChange()}break}}}},actions:{incrementHours:function(e){this._date.setUTCHours(this._date.getUTCHours()+1)},incrementMinutes:function(e){this._date.setUTCMinutes(this._date.getUTCMinutes()+1)},incrementSeconds:function(e){this._date.setUTCSeconds(this._date.getUTCSeconds()+1)},decrementHours:function(e){this._date.setUTCHours(this._date.getUTCHours()-1)},decrementMinutes:function(e){this._date.setUTCMinutes(this._date.getUTCMinutes()-1)},decrementSeconds:function(e){this._date.setUTCSeconds(this._date.getUTCSeconds()-1)},togglePeriod:function(e){var hour=this._date.getUTCHours();if(hour>=12)hour-=12;else hour+=12;this._date.setUTCHours(hour)},showPicker:function(){this.widget.find(".timepicker > div:not(.timepicker-picker)").hide();this.widget.find(".timepicker .timepicker-picker").show()},showHours:function(){this.widget.find(".timepicker .timepicker-picker").hide();this.widget.find(".timepicker .timepicker-hours").show()},showMinutes:function(){this.widget.find(".timepicker .timepicker-picker").hide();this.widget.find(".timepicker .timepicker-minutes").show()},showSeconds:function(){this.widget.find(".timepicker .timepicker-picker").hide();this.widget.find(".timepicker .timepicker-seconds").show()},selectHour:function(e){var tgt=$(e.target);var value=parseInt(tgt.text(),10);if(this.options.pick12HourFormat){var current=this._date.getUTCHours();if(current>=12){if(value!=12)value=(value+12)%24}else{if(value===12)value=0;else value=value%12}}this._date.setUTCHours(value);this.actions.showPicker.call(this)},selectMinute:function(e){var tgt=$(e.target);var value=parseInt(tgt.text(),10);this._date.setUTCMinutes(value);this.actions.showPicker.call(this)},selectSecond:function(e){var tgt=$(e.target);var value=parseInt(tgt.text(),10);this._date.setUTCSeconds(value);this.actions.showPicker.call(this)}},doAction:function(e){e.stopPropagation();e.preventDefault();if(!this._date)this._date=UTCDate(1970,0,0,0,0,0,0);var action=$(e.currentTarget).data("action");var rv=this.actions[action].apply(this,arguments);this.set();this.fillTime();this.notifyChange();return rv},stopEvent:function(e){e.stopPropagation();e.preventDefault()},keydown:function(e){var self=this,k=e.which,input=$(e.target);if(k==8||k==46){setTimeout(function(){self._resetMaskPos(input)})}},keypress:function(e){var k=e.which;if(k==8||k==46){return}var input=$(e.target);var c=String.fromCharCode(k);var val=input.val()||"";val+=c;var mask=this._mask[this._maskPos];if(!mask){return false}if(mask.end!=val.length){return}if(!mask.pattern.test(val.slice(mask.start))){val=val.slice(0,val.length-1);while((mask=this._mask[this._maskPos])&&mask.character){val+=mask.character;this._maskPos++}val+=c;if(mask.end!=val.length){input.val(val);return false}else{if(!mask.pattern.test(val.slice(mask.start))){input.val(val.slice(0,mask.start));return false}else{input.val(val);this._maskPos++;return false}}}else{this._maskPos++}},change:function(e){var input=$(e.target);var val=input.val();if(this._formatPattern.test(val)){this.update();this.setValue(this._date.getTime());this.notifyChange();this.set()}else if(val&&val.trim()){this.setValue(this._date.getTime());if(this._date)this.set();else input.val("")}else{if(this._date){this.setValue(null);this.notifyChange();this._unset=true}}this._resetMaskPos(input)},showMode:function(dir){if(dir){this.viewMode=Math.max(this.minViewMode,Math.min(2,this.viewMode+dir))}this.widget.find(".datepicker > div").hide().filter(".datepicker-"+DPGlobal.modes[this.viewMode].clsName).show()},destroy:function(){this._detachDatePickerEvents();this._detachDatePickerGlobalEvents();this.widget.remove();this.$element.removeData("datetimepicker");this.component.removeData("datetimepicker")},formatDate:function(d){return this.format.replace(formatReplacer,function(match){var methodName,property,rv,len=match.length;if(match==="ms")len=1;property=dateFormatComponents[match].property;if(property==="Hours12"){rv=d.getUTCHours();if(rv===0)rv=12;else if(rv!==12)rv=rv%12}else if(property==="Period12"){if(d.getUTCHours()>=12)return"PM";else return"AM"}else{methodName="get"+property;rv=d[methodName]()}if(methodName==="getUTCMonth")rv=rv+1;if(methodName==="getUTCYear")rv=rv+1900-2e3;return padLeft(rv.toString(),len,"0")})},parseDate:function(str){var match,i,property,methodName,value,parsed={};if(!(match=this._formatPattern.exec(str)))return null;for(i=1;i<match.length;i++){property=this._propertiesByIndex[i];if(!property)continue;value=match[i];if(/^\d+$/.test(value))value=parseInt(value,10);parsed[property]=value}return this._finishParsingDate(parsed)},_resetMaskPos:function(input){var val=input.val();for(var i=0;i<this._mask.length;i++){if(this._mask[i].end>val.length){this._maskPos=i;break}else if(this._mask[i].end===val.length){this._maskPos=i+1;break}}},_finishParsingDate:function(parsed){var year,month,date,hours,minutes,seconds,milliseconds;year=parsed.UTCFullYear;if(parsed.UTCYear)year=2e3+parsed.UTCYear;if(!year)year=1970;if(parsed.UTCMonth)month=parsed.UTCMonth-1;else month=0;date=parsed.UTCDate||1;hours=parsed.UTCHours||0;minutes=parsed.UTCMinutes||0;seconds=parsed.UTCSeconds||0;milliseconds=parsed.UTCMilliseconds||0;if(parsed.Hours12){hours=parsed.Hours12}if(parsed.Period12){if(/pm/i.test(parsed.Period12)){if(hours!=12)hours=(hours+12)%24}else{hours=hours%12}}return UTCDate(year,month,date,hours,minutes,seconds,milliseconds)},_compileFormat:function(){var match,component,components=[],mask=[],str=this.format,propertiesByIndex={},i=0,pos=0;while(match=formatComponent.exec(str)){component=match[0];if(component in dateFormatComponents){i++;propertiesByIndex[i]=dateFormatComponents[component].property;components.push("\\s*"+dateFormatComponents[component].getPattern(this)+"\\s*");mask.push({pattern:new RegExp(dateFormatComponents[component].getPattern(this)),property:dateFormatComponents[component].property,start:pos,end:pos+=component.length})}else{components.push(escapeRegExp(component));mask.push({pattern:new RegExp(escapeRegExp(component)),character:component,start:pos,end:++pos})}str=str.slice(component.length)}this._mask=mask;this._maskPos=0;this._formatPattern=new RegExp("^\\s*"+components.join("")+"\\s*$");this._propertiesByIndex=propertiesByIndex},_attachDatePickerEvents:function(){var self=this;this.widget.on("click",".datepicker *",$.proxy(this.click,this));this.widget.on("click","[data-action]",$.proxy(this.doAction,this));this.widget.on("mousedown",$.proxy(this.stopEvent,this));if(this.pickDate&&this.pickTime){this.widget.on("click.togglePicker",".accordion-toggle",function(e){e.stopPropagation();var $this=$(this);var $parent=$this.closest("ul");var expanded=$parent.find(".collapse.in");var closed=$parent.find(".collapse:not(.in)");if(expanded&&expanded.length){var collapseData=expanded.data("collapse");if(collapseData&&collapseData.transitioning)return;expanded.collapse("hide");closed.collapse("show");$this.find("i").toggleClass(self.timeIcon+" "+self.dateIcon);self.$element.find(".add-on i").toggleClass(self.timeIcon+" "+self.dateIcon)}})}if(this.isInput){this.$element.on({focus:$.proxy(this.show,this),change:$.proxy(this.change,this)});if(this.options.maskInput){this.$element.on({keydown:$.proxy(this.keydown,this),keypress:$.proxy(this.keypress,this)})}}else{this.$element.on({change:$.proxy(this.change,this)},"input");if(this.options.maskInput){this.$element.on({keydown:$.proxy(this.keydown,this),keypress:$.proxy(this.keypress,this)},"input")}if(this.component){this.component.on("click",$.proxy(this.show,this))}else{this.$element.on("click",$.proxy(this.show,this))}}},_attachDatePickerGlobalEvents:function(){$(window).on("resize.datetimepicker"+this.id,$.proxy(this.place,this));if(!this.isInput){$(document).on("mousedown.datetimepicker"+this.id,$.proxy(this.hide,this))}},_detachDatePickerEvents:function(){this.widget.off("click",".datepicker *",this.click);this.widget.off("click","[data-action]");this.widget.off("mousedown",this.stopEvent);if(this.pickDate&&this.pickTime){this.widget.off("click.togglePicker")}if(this.isInput){this.$element.off({focus:this.show,change:this.change});if(this.options.maskInput){this.$element.off({keydown:this.keydown,keypress:this.keypress})}}else{this.$element.off({change:this.change},"input");if(this.options.maskInput){this.$element.off({keydown:this.keydown,keypress:this.keypress},"input")}if(this.component){this.component.off("click",this.show)}else{this.$element.off("click",this.show)}}},_detachDatePickerGlobalEvents:function(){$(window).off("resize.datetimepicker"+this.id);if(!this.isInput){$(document).off("mousedown.datetimepicker"+this.id)}},_isInFixed:function(){if(this.$element){var parents=this.$element.parents();var inFixed=false;for(var i=0;i<parents.length;i++){if($(parents[i]).css("position")=="fixed"){inFixed=true;break}}return inFixed}else{return false}}};$.fn.datetimepicker=function(option,val){return this.each(function(){var $this=$(this),data=$this.data("datetimepicker"),options=typeof option==="object"&&option;if(!data){$this.data("datetimepicker",data=new DateTimePicker(this,$.extend({},$.fn.datetimepicker.defaults,options)))}if(typeof option==="string")data[option](val)})};$.fn.datetimepicker.defaults={maskInput:false,pickDate:true,pickTime:true,pick12HourFormat:false,pickSeconds:true,startDate:-Infinity,endDate:Infinity,collapse:true};$.fn.datetimepicker.Constructor=DateTimePicker;var dpgId=0;var dates=$.fn.datetimepicker.dates={en:{days:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],daysShort:["Sun","Mon","Tue","Wed","Thu","Fri","Sat","Sun"],daysMin:["Su","Mo","Tu","We","Th","Fr","Sa","Su"],months:["January","February","March","April","May","June","July","August","September","October","November","December"],monthsShort:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]}};var dateFormatComponents={dd:{property:"UTCDate",getPattern:function(){return"(0?[1-9]|[1-2][0-9]|3[0-1])\\b"}},MM:{property:"UTCMonth",getPattern:function(){return"(0?[1-9]|1[0-2])\\b"}},yy:{property:"UTCYear",getPattern:function(){return"(\\d{2})\\b"}},yyyy:{property:"UTCFullYear",getPattern:function(){return"(\\d{4})\\b"}},hh:{property:"UTCHours",getPattern:function(){return"(0?[0-9]|1[0-9]|2[0-3])\\b"}},mm:{property:"UTCMinutes",getPattern:function(){return"(0?[0-9]|[1-5][0-9])\\b"}},ss:{property:"UTCSeconds",getPattern:function(){return"(0?[0-9]|[1-5][0-9])\\b"}},ms:{property:"UTCMilliseconds",getPattern:function(){return"([0-9]{1,3})\\b"}},HH:{property:"Hours12",getPattern:function(){return"(0?[1-9]|1[0-2])\\b"}},PP:{property:"Period12",getPattern:function(){return"(AM|PM|am|pm|Am|aM|Pm|pM)\\b"}}};var keys=[];for(var k in dateFormatComponents)keys.push(k);keys[keys.length-1]+="\\b";keys.push(".");var formatComponent=new RegExp(keys.join("\\b|"));keys.pop();var formatReplacer=new RegExp(keys.join("\\b|"),"g");function escapeRegExp(str){return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,"\\$&")}function padLeft(s,l,c){if(l<s.length)return s;else return Array(l-s.length+1).join(c||" ")+s}function getTemplate(timeIcon,pickDate,pickTime,is12Hours,showSeconds,collapse){if(pickDate&&pickTime){return'<div class="bootstrap-datetimepicker-widget dropdown-menu">'+"<ul>"+"<li"+(collapse?' class="collapse in"':"")+">"+'<div class="datepicker">'+DPGlobal.template+"</div>"+"</li>"+'<li class="picker-switch accordion-toggle"><a><i class="'+timeIcon+'"></i></a></li>'+"<li"+(collapse?' class="collapse"':"")+">"+'<div class="timepicker">'+TPGlobal.getTemplate(is12Hours,showSeconds)+"</div>"+"</li>"+"</ul>"+"</div>"}else if(pickTime){return'<div class="bootstrap-datetimepicker-widget dropdown-menu">'+'<div class="timepicker">'+TPGlobal.getTemplate(is12Hours,showSeconds)+"</div>"+"</div>"}else{return'<div class="bootstrap-datetimepicker-widget dropdown-menu">'+'<div class="datepicker">'+DPGlobal.template+"</div>"+"</div>"}}function UTCDate(){return new Date(Date.UTC.apply(Date,arguments))}var DPGlobal={modes:[{clsName:"days",navFnc:"UTCMonth",navStep:1},{clsName:"months",navFnc:"UTCFullYear",navStep:1},{clsName:"years",navFnc:"UTCFullYear",navStep:10}],isLeapYear:function(year){return year%4===0&&year%100!==0||year%400===0},getDaysInMonth:function(year,month){return[31,DPGlobal.isLeapYear(year)?29:28,31,30,31,30,31,31,30,31,30,31][month]},headTemplate:"<thead>"+"<tr>"+'<th class="prev">&lsaquo;</th>'+'<th colspan="5" class="switch"></th>'+'<th class="next">&rsaquo;</th>'+"</tr>"+"</thead>",contTemplate:'<tbody><tr><td colspan="7"></td></tr></tbody>'};DPGlobal.template='<div class="datepicker-days">'+'<table class="table-condensed">'+DPGlobal.headTemplate+"<tbody></tbody>"+"</table>"+"</div>"+'<div class="datepicker-months">'+'<table class="table-condensed">'+DPGlobal.headTemplate+DPGlobal.contTemplate+"</table>"+"</div>"+'<div class="datepicker-years">'+'<table class="table-condensed">'+DPGlobal.headTemplate+DPGlobal.contTemplate+"</table>"+"</div>";var TPGlobal={hourTemplate:'<span data-action="showHours" data-time-component="hours" class="timepicker-hour"></span>',minuteTemplate:'<span data-action="showMinutes" data-time-component="minutes" class="timepicker-minute"></span>',secondTemplate:'<span data-action="showSeconds" data-time-component="seconds" class="timepicker-second"></span>'};TPGlobal.getTemplate=function(is12Hours,showSeconds){return'<div class="timepicker-picker">'+'<table class="table-condensed"'+(is12Hours?' data-hour-format="12"':"")+">"+"<tr>"+'<td><a href="#" class="btn" data-action="incrementHours"><i class="icon-chevron-up"></i></a></td>'+'<td class="separator"></td>'+'<td><a href="#" class="btn" data-action="incrementMinutes"><i class="icon-chevron-up"></i></a></td>'+(showSeconds?'<td class="separator"></td>'+'<td><a href="#" class="btn" data-action="incrementSeconds"><i class="icon-chevron-up"></i></a></td>':"")+(is12Hours?'<td class="separator"></td>':"")+"</tr>"+"<tr>"+"<td>"+TPGlobal.hourTemplate+"</td> "+'<td class="separator">:</td>'+"<td>"+TPGlobal.minuteTemplate+"</td> "+(showSeconds?'<td class="separator">:</td>'+"<td>"+TPGlobal.secondTemplate+"</td>":"")+(is12Hours?'<td class="separator"></td>'+"<td>"+'<button type="button" class="btn btn-primary" data-action="togglePeriod"></button>'+"</td>":"")+"</tr>"+"<tr>"+'<td><a href="#" class="btn" data-action="decrementHours"><i class="icon-chevron-down"></i></a></td>'+'<td class="separator"></td>'+'<td><a href="#" class="btn" data-action="decrementMinutes"><i class="icon-chevron-down"></i></a></td>'+(showSeconds?'<td class="separator"></td>'+'<td><a href="#" class="btn" data-action="decrementSeconds"><i class="icon-chevron-down"></i></a></td>':"")+(is12Hours?'<td class="separator"></td>':"")+"</tr>"+"</table>"+"</div>"+'<div class="timepicker-hours" data-action="selectHour">'+'<table class="table-condensed">'+"</table>"+"</div>"+'<div class="timepicker-minutes" data-action="selectMinute">'+'<table class="table-condensed">'+"</table>"+"</div>"+(showSeconds?'<div class="timepicker-seconds" data-action="selectSecond">'+'<table class="table-condensed">'+"</table>"+"</div>":"")}})(window.jQuery);
/**
 * Traditional Chinese translation for bootstrap-datetimepicker
 * Rung-Sheng Jang <daniel@i-trend.co.cc>
 */
;(function($){
	$.fn.datetimepicker.dates['zh-TW'] = {
				days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],
			daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六", "周日"],
			daysMin:  ["日", "一", "二", "三", "四", "五", "六", "日"],
			months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
			monthsShort: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]
	};
}(jQuery));
/* jQuery Nice Select - v1.0 - http://hernansartorio.github.io/jquery-nice-select */
!function(a){a.fn.niceSelect=function(){this.each(function(){var b=a(this);if(!b.next().hasClass("nice-select")){b.after('<div class="nice-select '+(b.attr("class")||"")+(b.attr("disabled")?"disabled":'" tabindex="0')+'"><span class="current"></span><ul class="list"></ul></div>');var c=b.next(),d=b.find("option"),e=b.find("option:selected");c.find(".current").html(e.data("display")||e.text()),d.each(function(){var b=a(this).data("display");c.find("ul").append('<li class="option '+(a(this).is(":selected")?"selected":"")+'" data-value="'+a(this).val()+(b?'" data-display="'+b:"")+'">'+a(this).text()+"</li>")})}}),a(document).off(".nice_select"),a(document).on("click.nice_select",".nice-select",function(b){var c=a(this);a(".nice-select").not(c).removeClass("open"),c.toggleClass("open"),c.hasClass("open")?(c.find(".option"),c.find(".focus").removeClass("focus"),c.find(".selected").addClass("focus")):c.focus()}),a(document).on("click.nice_select",function(b){0===a(b.target).closest(".nice-select").length&&a(".nice-select").removeClass("open").find(".option")}),a(document).on("click.nice_select",".nice-select .option",function(b){var c=a(this),d=c.closest(".nice-select");d.find(".selected").removeClass("selected"),c.addClass("selected");var e=c.data("display")||c.text();d.find(".current").text(e),d.prev("select").val(c.data("value")).trigger("change")}),a(document).on("keydown.nice_select",".nice-select",function(b){var c=a(this),d=a(c.find(".focus")||c.find(".list .option.selected"));if(32==b.keyCode||13==b.keyCode)return c.hasClass("open")?d.trigger("click"):c.trigger("click"),!1;if(40==b.keyCode)return c.hasClass("open")?d.next().length>0&&(c.find(".focus").removeClass("focus"),d.next().addClass("focus")):c.trigger("click"),!1;if(38==b.keyCode)return c.hasClass("open")?d.prev().length>0&&(c.find(".focus").removeClass("focus"),d.prev().addClass("focus")):c.trigger("click"),!1;if(27==b.keyCode)c.hasClass("open")&&c.trigger("click");else if(9==b.keyCode&&c.hasClass("open"))return!1})}}(jQuery);
/*! Magnific Popup - v1.0.0 - 2015-01-03
* http://dimsemenov.com/plugins/magnific-popup/
* Copyright (c) 2015 Dmitry Semenov; */
!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):a("object"==typeof exports?require("jquery"):window.jQuery||window.Zepto)}(function(a){var b,c,d,e,f,g,h="Close",i="BeforeClose",j="AfterClose",k="BeforeAppend",l="MarkupParse",m="Open",n="Change",o="mfp",p="."+o,q="mfp-ready",r="mfp-removing",s="mfp-prevent-close",t=function(){},u=!!window.jQuery,v=a(window),w=function(a,c){b.ev.on(o+a+p,c)},x=function(b,c,d,e){var f=document.createElement("div");return f.className="mfp-"+b,d&&(f.innerHTML=d),e?c&&c.appendChild(f):(f=a(f),c&&f.appendTo(c)),f},y=function(c,d){b.ev.triggerHandler(o+c,d),b.st.callbacks&&(c=c.charAt(0).toLowerCase()+c.slice(1),b.st.callbacks[c]&&b.st.callbacks[c].apply(b,a.isArray(d)?d:[d]))},z=function(c){return c===g&&b.currTemplate.closeBtn||(b.currTemplate.closeBtn=a(b.st.closeMarkup.replace("%title%",b.st.tClose)),g=c),b.currTemplate.closeBtn},A=function(){a.magnificPopup.instance||(b=new t,b.init(),a.magnificPopup.instance=b)},B=function(){var a=document.createElement("p").style,b=["ms","O","Moz","Webkit"];if(void 0!==a.transition)return!0;for(;b.length;)if(b.pop()+"Transition"in a)return!0;return!1};t.prototype={constructor:t,init:function(){var c=navigator.appVersion;b.isIE7=-1!==c.indexOf("MSIE 7."),b.isIE8=-1!==c.indexOf("MSIE 8."),b.isLowIE=b.isIE7||b.isIE8,b.isAndroid=/android/gi.test(c),b.isIOS=/iphone|ipad|ipod/gi.test(c),b.supportsTransition=B(),b.probablyMobile=b.isAndroid||b.isIOS||/(Opera Mini)|Kindle|webOS|BlackBerry|(Opera Mobi)|(Windows Phone)|IEMobile/i.test(navigator.userAgent),d=a(document),b.popupsCache={}},open:function(c){var e;if(c.isObj===!1){b.items=c.items.toArray(),b.index=0;var g,h=c.items;for(e=0;e<h.length;e++)if(g=h[e],g.parsed&&(g=g.el[0]),g===c.el[0]){b.index=e;break}}else b.items=a.isArray(c.items)?c.items:[c.items],b.index=c.index||0;if(b.isOpen)return void b.updateItemHTML();b.types=[],f="",b.ev=c.mainEl&&c.mainEl.length?c.mainEl.eq(0):d,c.key?(b.popupsCache[c.key]||(b.popupsCache[c.key]={}),b.currTemplate=b.popupsCache[c.key]):b.currTemplate={},b.st=a.extend(!0,{},a.magnificPopup.defaults,c),b.fixedContentPos="auto"===b.st.fixedContentPos?!b.probablyMobile:b.st.fixedContentPos,b.st.modal&&(b.st.closeOnContentClick=!1,b.st.closeOnBgClick=!1,b.st.showCloseBtn=!1,b.st.enableEscapeKey=!1),b.bgOverlay||(b.bgOverlay=x("bg").on("click"+p,function(){b.close()}),b.wrap=x("wrap").attr("tabindex",-1).on("click"+p,function(a){b._checkIfClose(a.target)&&b.close()}),b.container=x("container",b.wrap)),b.contentContainer=x("content"),b.st.preloader&&(b.preloader=x("preloader",b.container,b.st.tLoading));var i=a.magnificPopup.modules;for(e=0;e<i.length;e++){var j=i[e];j=j.charAt(0).toUpperCase()+j.slice(1),b["init"+j].call(b)}y("BeforeOpen"),b.st.showCloseBtn&&(b.st.closeBtnInside?(w(l,function(a,b,c,d){c.close_replaceWith=z(d.type)}),f+=" mfp-close-btn-in"):b.wrap.append(z())),b.st.alignTop&&(f+=" mfp-align-top"),b.wrap.css(b.fixedContentPos?{overflow:b.st.overflowY,overflowX:"hidden",overflowY:b.st.overflowY}:{top:v.scrollTop(),position:"absolute"}),(b.st.fixedBgPos===!1||"auto"===b.st.fixedBgPos&&!b.fixedContentPos)&&b.bgOverlay.css({height:d.height(),position:"absolute"}),b.st.enableEscapeKey&&d.on("keyup"+p,function(a){27===a.keyCode&&b.close()}),v.on("resize"+p,function(){b.updateSize()}),b.st.closeOnContentClick||(f+=" mfp-auto-cursor"),f&&b.wrap.addClass(f);var k=b.wH=v.height(),n={};if(b.fixedContentPos&&b._hasScrollBar(k)){var o=b._getScrollbarSize();o&&(n.marginRight=o)}b.fixedContentPos&&(b.isIE7?a("body, html").css("overflow","hidden"):n.overflow="hidden");var r=b.st.mainClass;return b.isIE7&&(r+=" mfp-ie7"),r&&b._addClassToMFP(r),b.updateItemHTML(),y("BuildControls"),a("html").css(n),b.bgOverlay.add(b.wrap).prependTo(b.st.prependTo||a(document.body)),b._lastFocusedEl=document.activeElement,setTimeout(function(){b.content?(b._addClassToMFP(q),b._setFocus()):b.bgOverlay.addClass(q),d.on("focusin"+p,b._onFocusIn)},16),b.isOpen=!0,b.updateSize(k),y(m),c},close:function(){b.isOpen&&(y(i),b.isOpen=!1,b.st.removalDelay&&!b.isLowIE&&b.supportsTransition?(b._addClassToMFP(r),setTimeout(function(){b._close()},b.st.removalDelay)):b._close())},_close:function(){y(h);var c=r+" "+q+" ";if(b.bgOverlay.detach(),b.wrap.detach(),b.container.empty(),b.st.mainClass&&(c+=b.st.mainClass+" "),b._removeClassFromMFP(c),b.fixedContentPos){var e={marginRight:""};b.isIE7?a("body, html").css("overflow",""):e.overflow="",a("html").css(e)}d.off("keyup"+p+" focusin"+p),b.ev.off(p),b.wrap.attr("class","mfp-wrap").removeAttr("style"),b.bgOverlay.attr("class","mfp-bg"),b.container.attr("class","mfp-container"),!b.st.showCloseBtn||b.st.closeBtnInside&&b.currTemplate[b.currItem.type]!==!0||b.currTemplate.closeBtn&&b.currTemplate.closeBtn.detach(),b._lastFocusedEl&&a(b._lastFocusedEl).focus(),b.currItem=null,b.content=null,b.currTemplate=null,b.prevHeight=0,y(j)},updateSize:function(a){if(b.isIOS){var c=document.documentElement.clientWidth/window.innerWidth,d=window.innerHeight*c;b.wrap.css("height",d),b.wH=d}else b.wH=a||v.height();b.fixedContentPos||b.wrap.css("height",b.wH),y("Resize")},updateItemHTML:function(){var c=b.items[b.index];b.contentContainer.detach(),b.content&&b.content.detach(),c.parsed||(c=b.parseEl(b.index));var d=c.type;if(y("BeforeChange",[b.currItem?b.currItem.type:"",d]),b.currItem=c,!b.currTemplate[d]){var f=b.st[d]?b.st[d].markup:!1;y("FirstMarkupParse",f),b.currTemplate[d]=f?a(f):!0}e&&e!==c.type&&b.container.removeClass("mfp-"+e+"-holder");var g=b["get"+d.charAt(0).toUpperCase()+d.slice(1)](c,b.currTemplate[d]);b.appendContent(g,d),c.preloaded=!0,y(n,c),e=c.type,b.container.prepend(b.contentContainer),y("AfterChange")},appendContent:function(a,c){b.content=a,a?b.st.showCloseBtn&&b.st.closeBtnInside&&b.currTemplate[c]===!0?b.content.find(".mfp-close").length||b.content.append(z()):b.content=a:b.content="",y(k),b.container.addClass("mfp-"+c+"-holder"),b.contentContainer.append(b.content)},parseEl:function(c){var d,e=b.items[c];if(e.tagName?e={el:a(e)}:(d=e.type,e={data:e,src:e.src}),e.el){for(var f=b.types,g=0;g<f.length;g++)if(e.el.hasClass("mfp-"+f[g])){d=f[g];break}e.src=e.el.attr("data-mfp-src"),e.src||(e.src=e.el.attr("href"))}return e.type=d||b.st.type||"inline",e.index=c,e.parsed=!0,b.items[c]=e,y("ElementParse",e),b.items[c]},addGroup:function(a,c){var d=function(d){d.mfpEl=this,b._openClick(d,a,c)};c||(c={});var e="click.magnificPopup";c.mainEl=a,c.items?(c.isObj=!0,a.off(e).on(e,d)):(c.isObj=!1,c.delegate?a.off(e).on(e,c.delegate,d):(c.items=a,a.off(e).on(e,d)))},_openClick:function(c,d,e){var f=void 0!==e.midClick?e.midClick:a.magnificPopup.defaults.midClick;if(f||2!==c.which&&!c.ctrlKey&&!c.metaKey){var g=void 0!==e.disableOn?e.disableOn:a.magnificPopup.defaults.disableOn;if(g)if(a.isFunction(g)){if(!g.call(b))return!0}else if(v.width()<g)return!0;c.type&&(c.preventDefault(),b.isOpen&&c.stopPropagation()),e.el=a(c.mfpEl),e.delegate&&(e.items=d.find(e.delegate)),b.open(e)}},updateStatus:function(a,d){if(b.preloader){c!==a&&b.container.removeClass("mfp-s-"+c),d||"loading"!==a||(d=b.st.tLoading);var e={status:a,text:d};y("UpdateStatus",e),a=e.status,d=e.text,b.preloader.html(d),b.preloader.find("a").on("click",function(a){a.stopImmediatePropagation()}),b.container.addClass("mfp-s-"+a),c=a}},_checkIfClose:function(c){if(!a(c).hasClass(s)){var d=b.st.closeOnContentClick,e=b.st.closeOnBgClick;if(d&&e)return!0;if(!b.content||a(c).hasClass("mfp-close")||b.preloader&&c===b.preloader[0])return!0;if(c===b.content[0]||a.contains(b.content[0],c)){if(d)return!0}else if(e&&a.contains(document,c))return!0;return!1}},_addClassToMFP:function(a){b.bgOverlay.addClass(a),b.wrap.addClass(a)},_removeClassFromMFP:function(a){this.bgOverlay.removeClass(a),b.wrap.removeClass(a)},_hasScrollBar:function(a){return(b.isIE7?d.height():document.body.scrollHeight)>(a||v.height())},_setFocus:function(){(b.st.focus?b.content.find(b.st.focus).eq(0):b.wrap).focus()},_onFocusIn:function(c){return c.target===b.wrap[0]||a.contains(b.wrap[0],c.target)?void 0:(b._setFocus(),!1)},_parseMarkup:function(b,c,d){var e;d.data&&(c=a.extend(d.data,c)),y(l,[b,c,d]),a.each(c,function(a,c){if(void 0===c||c===!1)return!0;if(e=a.split("_"),e.length>1){var d=b.find(p+"-"+e[0]);if(d.length>0){var f=e[1];"replaceWith"===f?d[0]!==c[0]&&d.replaceWith(c):"img"===f?d.is("img")?d.attr("src",c):d.replaceWith('<img src="'+c+'" class="'+d.attr("class")+'" />'):d.attr(e[1],c)}}else b.find(p+"-"+a).html(c)})},_getScrollbarSize:function(){if(void 0===b.scrollbarSize){var a=document.createElement("div");a.style.cssText="width: 99px; height: 99px; overflow: scroll; position: absolute; top: -9999px;",document.body.appendChild(a),b.scrollbarSize=a.offsetWidth-a.clientWidth,document.body.removeChild(a)}return b.scrollbarSize}},a.magnificPopup={instance:null,proto:t.prototype,modules:[],open:function(b,c){return A(),b=b?a.extend(!0,{},b):{},b.isObj=!0,b.index=c||0,this.instance.open(b)},close:function(){return a.magnificPopup.instance&&a.magnificPopup.instance.close()},registerModule:function(b,c){c.options&&(a.magnificPopup.defaults[b]=c.options),a.extend(this.proto,c.proto),this.modules.push(b)},defaults:{disableOn:0,key:null,midClick:!1,mainClass:"",preloader:!0,focus:"",closeOnContentClick:!1,closeOnBgClick:!0,closeBtnInside:!0,showCloseBtn:!0,enableEscapeKey:!0,modal:!1,alignTop:!1,removalDelay:0,prependTo:null,fixedContentPos:"auto",fixedBgPos:"auto",overflowY:"auto",closeMarkup:'<button title="%title%" type="button" class="mfp-close">&times;</button>',tClose:"Close (Esc)",tLoading:"Loading..."}},a.fn.magnificPopup=function(c){A();var d=a(this);if("string"==typeof c)if("open"===c){var e,f=u?d.data("magnificPopup"):d[0].magnificPopup,g=parseInt(arguments[1],10)||0;f.items?e=f.items[g]:(e=d,f.delegate&&(e=e.find(f.delegate)),e=e.eq(g)),b._openClick({mfpEl:e},d,f)}else b.isOpen&&b[c].apply(b,Array.prototype.slice.call(arguments,1));else c=a.extend(!0,{},c),u?d.data("magnificPopup",c):d[0].magnificPopup=c,b.addGroup(d,c);return d};var C,D,E,F="inline",G=function(){E&&(D.after(E.addClass(C)).detach(),E=null)};a.magnificPopup.registerModule(F,{options:{hiddenClass:"hide",markup:"",tNotFound:"Content not found"},proto:{initInline:function(){b.types.push(F),w(h+"."+F,function(){G()})},getInline:function(c,d){if(G(),c.src){var e=b.st.inline,f=a(c.src);if(f.length){var g=f[0].parentNode;g&&g.tagName&&(D||(C=e.hiddenClass,D=x(C),C="mfp-"+C),E=f.after(D).detach().removeClass(C)),b.updateStatus("ready")}else b.updateStatus("error",e.tNotFound),f=a("<div>");return c.inlineElement=f,f}return b.updateStatus("ready"),b._parseMarkup(d,{},c),d}}});var H,I="ajax",J=function(){H&&a(document.body).removeClass(H)},K=function(){J(),b.req&&b.req.abort()};a.magnificPopup.registerModule(I,{options:{settings:null,cursor:"mfp-ajax-cur",tError:'<a href="%url%">The content</a> could not be loaded.'},proto:{initAjax:function(){b.types.push(I),H=b.st.ajax.cursor,w(h+"."+I,K),w("BeforeChange."+I,K)},getAjax:function(c){H&&a(document.body).addClass(H),b.updateStatus("loading");var d=a.extend({url:c.src,success:function(d,e,f){var g={data:d,xhr:f};y("ParseAjax",g),b.appendContent(a(g.data),I),c.finished=!0,J(),b._setFocus(),setTimeout(function(){b.wrap.addClass(q)},16),b.updateStatus("ready"),y("AjaxContentAdded")},error:function(){J(),c.finished=c.loadError=!0,b.updateStatus("error",b.st.ajax.tError.replace("%url%",c.src))}},b.st.ajax.settings);return b.req=a.ajax(d),""}}});var L,M=function(c){if(c.data&&void 0!==c.data.title)return c.data.title;var d=b.st.image.titleSrc;if(d){if(a.isFunction(d))return d.call(b,c);if(c.el)return c.el.attr(d)||""}return""};a.magnificPopup.registerModule("image",{options:{markup:'<div class="mfp-figure"><div class="mfp-close"></div><figure><div class="mfp-img"></div><figcaption><div class="mfp-bottom-bar"><div class="mfp-title"></div><div class="mfp-counter"></div></div></figcaption></figure></div>',cursor:"mfp-zoom-out-cur",titleSrc:"title",verticalFit:!0,tError:'<a href="%url%">The image</a> could not be loaded.'},proto:{initImage:function(){var c=b.st.image,d=".image";b.types.push("image"),w(m+d,function(){"image"===b.currItem.type&&c.cursor&&a(document.body).addClass(c.cursor)}),w(h+d,function(){c.cursor&&a(document.body).removeClass(c.cursor),v.off("resize"+p)}),w("Resize"+d,b.resizeImage),b.isLowIE&&w("AfterChange",b.resizeImage)},resizeImage:function(){var a=b.currItem;if(a&&a.img&&b.st.image.verticalFit){var c=0;b.isLowIE&&(c=parseInt(a.img.css("padding-top"),10)+parseInt(a.img.css("padding-bottom"),10)),a.img.css("max-height",b.wH-c)}},_onImageHasSize:function(a){a.img&&(a.hasSize=!0,L&&clearInterval(L),a.isCheckingImgSize=!1,y("ImageHasSize",a),a.imgHidden&&(b.content&&b.content.removeClass("mfp-loading"),a.imgHidden=!1))},findImageSize:function(a){var c=0,d=a.img[0],e=function(f){L&&clearInterval(L),L=setInterval(function(){return d.naturalWidth>0?void b._onImageHasSize(a):(c>200&&clearInterval(L),c++,void(3===c?e(10):40===c?e(50):100===c&&e(500)))},f)};e(1)},getImage:function(c,d){var e=0,f=function(){c&&(c.img[0].complete?(c.img.off(".mfploader"),c===b.currItem&&(b._onImageHasSize(c),b.updateStatus("ready")),c.hasSize=!0,c.loaded=!0,y("ImageLoadComplete")):(e++,200>e?setTimeout(f,100):g()))},g=function(){c&&(c.img.off(".mfploader"),c===b.currItem&&(b._onImageHasSize(c),b.updateStatus("error",h.tError.replace("%url%",c.src))),c.hasSize=!0,c.loaded=!0,c.loadError=!0)},h=b.st.image,i=d.find(".mfp-img");if(i.length){var j=document.createElement("img");j.className="mfp-img",c.el&&c.el.find("img").length&&(j.alt=c.el.find("img").attr("alt")),c.img=a(j).on("load.mfploader",f).on("error.mfploader",g),j.src=c.src,i.is("img")&&(c.img=c.img.clone()),j=c.img[0],j.naturalWidth>0?c.hasSize=!0:j.width||(c.hasSize=!1)}return b._parseMarkup(d,{title:M(c),img_replaceWith:c.img},c),b.resizeImage(),c.hasSize?(L&&clearInterval(L),c.loadError?(d.addClass("mfp-loading"),b.updateStatus("error",h.tError.replace("%url%",c.src))):(d.removeClass("mfp-loading"),b.updateStatus("ready")),d):(b.updateStatus("loading"),c.loading=!0,c.hasSize||(c.imgHidden=!0,d.addClass("mfp-loading"),b.findImageSize(c)),d)}}});var N,O=function(){return void 0===N&&(N=void 0!==document.createElement("p").style.MozTransform),N};a.magnificPopup.registerModule("zoom",{options:{enabled:!1,easing:"ease-in-out",duration:300,opener:function(a){return a.is("img")?a:a.find("img")}},proto:{initZoom:function(){var a,c=b.st.zoom,d=".zoom";if(c.enabled&&b.supportsTransition){var e,f,g=c.duration,j=function(a){var b=a.clone().removeAttr("style").removeAttr("class").addClass("mfp-animated-image"),d="all "+c.duration/1e3+"s "+c.easing,e={position:"fixed",zIndex:9999,left:0,top:0,"-webkit-backface-visibility":"hidden"},f="transition";return e["-webkit-"+f]=e["-moz-"+f]=e["-o-"+f]=e[f]=d,b.css(e),b},k=function(){b.content.css("visibility","visible")};w("BuildControls"+d,function(){if(b._allowZoom()){if(clearTimeout(e),b.content.css("visibility","hidden"),a=b._getItemToZoom(),!a)return void k();f=j(a),f.css(b._getOffset()),b.wrap.append(f),e=setTimeout(function(){f.css(b._getOffset(!0)),e=setTimeout(function(){k(),setTimeout(function(){f.remove(),a=f=null,y("ZoomAnimationEnded")},16)},g)},16)}}),w(i+d,function(){if(b._allowZoom()){if(clearTimeout(e),b.st.removalDelay=g,!a){if(a=b._getItemToZoom(),!a)return;f=j(a)}f.css(b._getOffset(!0)),b.wrap.append(f),b.content.css("visibility","hidden"),setTimeout(function(){f.css(b._getOffset())},16)}}),w(h+d,function(){b._allowZoom()&&(k(),f&&f.remove(),a=null)})}},_allowZoom:function(){return"image"===b.currItem.type},_getItemToZoom:function(){return b.currItem.hasSize?b.currItem.img:!1},_getOffset:function(c){var d;d=c?b.currItem.img:b.st.zoom.opener(b.currItem.el||b.currItem);var e=d.offset(),f=parseInt(d.css("padding-top"),10),g=parseInt(d.css("padding-bottom"),10);e.top-=a(window).scrollTop()-f;var h={width:d.width(),height:(u?d.innerHeight():d[0].offsetHeight)-g-f};return O()?h["-moz-transform"]=h.transform="translate("+e.left+"px,"+e.top+"px)":(h.left=e.left,h.top=e.top),h}}});var P="iframe",Q="//about:blank",R=function(a){if(b.currTemplate[P]){var c=b.currTemplate[P].find("iframe");c.length&&(a||(c[0].src=Q),b.isIE8&&c.css("display",a?"block":"none"))}};a.magnificPopup.registerModule(P,{options:{markup:'<div class="mfp-iframe-scaler"><div class="mfp-close"></div><iframe class="mfp-iframe" src="//about:blank" frameborder="0" allowfullscreen></iframe></div>',srcAction:"iframe_src",patterns:{youtube:{index:"youtube.com",id:"v=",src:"//www.youtube.com/embed/%id%?autoplay=1"},vimeo:{index:"vimeo.com/",id:"/",src:"//player.vimeo.com/video/%id%?autoplay=1"},gmaps:{index:"//maps.google.",src:"%id%&output=embed"}}},proto:{initIframe:function(){b.types.push(P),w("BeforeChange",function(a,b,c){b!==c&&(b===P?R():c===P&&R(!0))}),w(h+"."+P,function(){R()})},getIframe:function(c,d){var e=c.src,f=b.st.iframe;a.each(f.patterns,function(){return e.indexOf(this.index)>-1?(this.id&&(e="string"==typeof this.id?e.substr(e.lastIndexOf(this.id)+this.id.length,e.length):this.id.call(this,e)),e=this.src.replace("%id%",e),!1):void 0});var g={};return f.srcAction&&(g[f.srcAction]=e),b._parseMarkup(d,g,c),b.updateStatus("ready"),d}}});var S=function(a){var c=b.items.length;return a>c-1?a-c:0>a?c+a:a},T=function(a,b,c){return a.replace(/%curr%/gi,b+1).replace(/%total%/gi,c)};a.magnificPopup.registerModule("gallery",{options:{enabled:!1,arrowMarkup:'<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>',preload:[0,2],navigateByImgClick:!0,arrows:!0,tPrev:"Previous (Left arrow key)",tNext:"Next (Right arrow key)",tCounter:"%curr% of %total%"},proto:{initGallery:function(){var c=b.st.gallery,e=".mfp-gallery",g=Boolean(a.fn.mfpFastClick);return b.direction=!0,c&&c.enabled?(f+=" mfp-gallery",w(m+e,function(){c.navigateByImgClick&&b.wrap.on("click"+e,".mfp-img",function(){return b.items.length>1?(b.next(),!1):void 0}),d.on("keydown"+e,function(a){37===a.keyCode?b.prev():39===a.keyCode&&b.next()})}),w("UpdateStatus"+e,function(a,c){c.text&&(c.text=T(c.text,b.currItem.index,b.items.length))}),w(l+e,function(a,d,e,f){var g=b.items.length;e.counter=g>1?T(c.tCounter,f.index,g):""}),w("BuildControls"+e,function(){if(b.items.length>1&&c.arrows&&!b.arrowLeft){var d=c.arrowMarkup,e=b.arrowLeft=a(d.replace(/%title%/gi,c.tPrev).replace(/%dir%/gi,"left")).addClass(s),f=b.arrowRight=a(d.replace(/%title%/gi,c.tNext).replace(/%dir%/gi,"right")).addClass(s),h=g?"mfpFastClick":"click";e[h](function(){b.prev()}),f[h](function(){b.next()}),b.isIE7&&(x("b",e[0],!1,!0),x("a",e[0],!1,!0),x("b",f[0],!1,!0),x("a",f[0],!1,!0)),b.container.append(e.add(f))}}),w(n+e,function(){b._preloadTimeout&&clearTimeout(b._preloadTimeout),b._preloadTimeout=setTimeout(function(){b.preloadNearbyImages(),b._preloadTimeout=null},16)}),void w(h+e,function(){d.off(e),b.wrap.off("click"+e),b.arrowLeft&&g&&b.arrowLeft.add(b.arrowRight).destroyMfpFastClick(),b.arrowRight=b.arrowLeft=null})):!1},next:function(){b.direction=!0,b.index=S(b.index+1),b.updateItemHTML()},prev:function(){b.direction=!1,b.index=S(b.index-1),b.updateItemHTML()},goTo:function(a){b.direction=a>=b.index,b.index=a,b.updateItemHTML()},preloadNearbyImages:function(){var a,c=b.st.gallery.preload,d=Math.min(c[0],b.items.length),e=Math.min(c[1],b.items.length);for(a=1;a<=(b.direction?e:d);a++)b._preloadItem(b.index+a);for(a=1;a<=(b.direction?d:e);a++)b._preloadItem(b.index-a)},_preloadItem:function(c){if(c=S(c),!b.items[c].preloaded){var d=b.items[c];d.parsed||(d=b.parseEl(c)),y("LazyLoad",d),"image"===d.type&&(d.img=a('<img class="mfp-img" />').on("load.mfploader",function(){d.hasSize=!0}).on("error.mfploader",function(){d.hasSize=!0,d.loadError=!0,y("LazyLoadError",d)}).attr("src",d.src)),d.preloaded=!0}}}});var U="retina";a.magnificPopup.registerModule(U,{options:{replaceSrc:function(a){return a.src.replace(/\.\w+$/,function(a){return"@2x"+a})},ratio:1},proto:{initRetina:function(){if(window.devicePixelRatio>1){var a=b.st.retina,c=a.ratio;c=isNaN(c)?c():c,c>1&&(w("ImageHasSize."+U,function(a,b){b.img.css({"max-width":b.img[0].naturalWidth/c,width:"100%"})}),w("ElementParse."+U,function(b,d){d.src=a.replaceSrc(d,c)}))}}}}),function(){var b=1e3,c="ontouchstart"in window,d=function(){v.off("touchmove"+f+" touchend"+f)},e="mfpFastClick",f="."+e;a.fn.mfpFastClick=function(e){return a(this).each(function(){var g,h=a(this);if(c){var i,j,k,l,m,n;h.on("touchstart"+f,function(a){l=!1,n=1,m=a.originalEvent?a.originalEvent.touches[0]:a.touches[0],j=m.clientX,k=m.clientY,v.on("touchmove"+f,function(a){m=a.originalEvent?a.originalEvent.touches:a.touches,n=m.length,m=m[0],(Math.abs(m.clientX-j)>10||Math.abs(m.clientY-k)>10)&&(l=!0,d())}).on("touchend"+f,function(a){d(),l||n>1||(g=!0,a.preventDefault(),clearTimeout(i),i=setTimeout(function(){g=!1},b),e())})})}h.on("click"+f,function(){g||e()})})},a.fn.destroyMfpFastClick=function(){a(this).off("touchstart"+f+" click"+f),c&&v.off("touchmove"+f+" touchend"+f)}}(),A()});