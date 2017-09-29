/**
* requestAnimationFrame polyfill
*/
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame) window.requestAnimationFrame = function(callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function() {
            callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };
    if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
    };
}());

/**
 * frameEvent
 * @description Run callbacks on requestAnimationFrame event
 */
(function($) {
    function FrameEvent() {
        this.init();
    };
    $.extend(FrameEvent.prototype, {
        callbacks: {
            'resize': [],
            'scroll': []
        },
        init: function() {
            for (var type in this.callbacks) {
                window.addEventListener(type, this.run.bind(this));
            }
        },
        add: function(type, func, context) {
            this.callbacks[type].push({
                func: func,
                context: context,
                reqId: null
            });
        },
        run: function(evt) {
            var self = this,
                cbList = self.callbacks[evt.type];
            for (var i = 0; i < cbList.length; i++) {
                var cb = cbList[i],
                    func = cb.func,
                    context = cb.context;
                if (cb.reqId === null) {
                    self.createRequest(cb);
                }
            }
        },
        createRequest: function(cb) {
            cb.reqId = requestAnimationFrame(function() {
                cb.func.call(cb.context);
                cancelAnimationFrame(cb.reqId);
                cb.reqId = null;
            });
        }
    });
    if (typeof module === 'object' && module.exports) {
        module.exports = FrameEvent;
    } else {
        window.FrameEvent = FrameEvent;
    }
}(jQuery));
/**
 * inView
 * @description Indicates when an element is considered "in view" (i.e. within the viewport)
 */
(function($) {
var FrameEvent = window.FrameEvent || require('../lib/FrameEvent');
// Private
var _defaults = {
	stage: {
		element: 'section', // the element to look for
		attr: 'data-inview', // the name of the inview attribute
		inVal: 'in', // the value of the attribute when in view
		outVal: 'out', // the value of the attribute when out of view
		offsetTop: 0, // pixels
		offsetBottom: 0, // pixels
		delayIn: 0, // in milliseconds
		delayOut: 0, // in milliseconds
		inCallback: false, // callback when element comes into view
		outCallback: false // callback when element goes out of view
	}
};
// Constructor
function InView() {
	this.init();
}
// Prototype
$.extend(InView.prototype, {
	config: {},
	winHgt: 0,
	currPos: 0,
	prevPos: 0,
	direction: null,
	stages: [],
	init: function() {
		this.fe = new FrameEvent();
		this.fe.add('resize', this.handleResize, this);
		this.fe.add('scroll', this.handleScroll, this);
	},
	addStage: function(options) {
		var options = options || {},
			stage = {};
		for (var o in _defaults.stage) stage[o] = (options[o]) ? options[o] : _defaults.stage[o];
		$(stage.element).attr(stage.attr, stage.outVal);
		this.stages.push(stage);
		this.handleResize();
		this.handleScroll();
	},
	removeStage: function(element) {
		var remove = this.stages.filter(function(n, i, a) {
			return n.element == element;
		});
		for (var i = 0; i < remove.length; i++) {
			$(remove.element).removeAttr(this.config.attr);
			this.stages.splice(this.stages.indexOf(remove[i], 1));
		}
	},
	clearStages: function() {
		this.stages = [];
	},
	handleScroll: function() {
		this.prevPos = this.currPos;
		this.currPos = $(window).scrollTop();
		this.checkDirection();
		this.checkStagePositions();
	},
	handleResize: function() {
		this.winHgt = $(window).innerHeight();
	},
	checkDirection: function() {
		// Indicate scroll direction via body attribute
		this.direction = this.currPos > this.prevPos ? 'down' : 'up';
		$('body').attr('scroll-direction', this.direction);
	},
	checkStagePositions: function() {
		var self = this;
		$(self.stages).each(function(i, stage) {
			$(stage.element).each(function(j, el) {
				var el = $(el),
					elTop = el.offset().top,
					topPos = elTop + stage.offsetTop,
					botPos = (elTop + el.innerHeight()) - stage.offsetBottom;
				// If element comes into view and has an attribute value of outVal
				if (self.currPos + self.winHgt > topPos && self.currPos < botPos && el.attr(stage.attr) == stage.outVal) {
					if (stage.delayIn > 0) {
						el.data('delay-in-' + j, setTimeout(function() {
							el.attr(stage.attr, stage.inVal);
							clearTimeout(el.data('delay-in-' + j));
						}, stage.delayIn));
					} else {
						el.attr(stage.attr, stage.inVal);
					}
					if ('function' == typeof stage.inCallback) stage.inCallback.call(el);
				}
				// If element goes out of view and has an attribute value of inVal
				if ((self.currPos + self.winHgt < topPos || self.currPos > botPos) && el.attr(stage.attr) == stage.inVal) {
					if (stage.delayOut > 0) {
						el.data('delay-out-' + j, setTimeout(function() {
							el.attr(stage.attr, stage.outVal);
							clearTimeout(el.data('delay-out-' + j));
						}, stage.delayOut));
					} else {
						el.attr(stage.attr, stage.outVal);
					}
					if ('function' == typeof stage.outCallback) stage.outCallback.call(el);
				}
			});
		});
	}
});
if (typeof module === 'object' && module.exports) {
    module.exports = InView;
} else {
    window.InView = InView;
}
}(jQuery));

var inview = new InView();

inview.addStage({
	element: '.item',
	offsetTop: 100
});