var __DraggableComponent = function() {
	var draggableElement;
	var parentElement;
	var gestureElement;
	var boundariesElement;

	var boundariesPadding;

	var startElementX;
	var startElementY;
	var currentElementX;
	var currentElementY;

	var startTouchX;
	var startTouchY;
	var currentTouchX;
	var currentTouchY;

	var beforeStartCallback;
	var startCallback;
	var beforeMoveCallback;
	var afterMoveCallback;
	var endCallback;

	var self = this;
	this.registerDraggableElement = function(parameters) {
		if (typeof parameters == 'object') {
			if (parameters.draggableElement != undefined) {
				draggableElement = parameters.draggableElement;
			}

			if (parameters.parentElement != undefined) {
				parentElement = parameters.parentElement;
			}
			else if (draggableElement) {
				parentElement = draggableElement.parentNode;
			}

			if (parameters.gestureElement != undefined) {
				gestureElement = parameters.gestureElement;
			}
			else if (draggableElement) {
				gestureElement = draggableElement;
			}

			if (parameters.boundariesElement != undefined) {
				boundariesElement = parameters.boundariesElement;
			}
			if (parameters.boundariesPadding != undefined) {
				boundariesPadding = parseFloat(parameters.boundariesPadding);
			}
			else {
				boundariesPadding = 0;
			}

			if (typeof parameters.beforeStartCallback == 'function') {
				beforeStartCallback = parameters.beforeStartCallback;
			}
			if (typeof parameters.startCallback == 'function') {
				startCallback = parameters.startCallback;
			}
			if (typeof parameters.beforeMoveCallback == 'function') {
				beforeMoveCallback = parameters.beforeMoveCallback;
			}
			if (typeof parameters.afterMoveCallback == 'function') {
				afterMoveCallback = parameters.afterMoveCallback;
			}
			if (typeof parameters.endCallback == 'function') {
				endCallback = parameters.endCallback;
			}

			initDraggableElement();
		}
	};
	this.disableDragging = function() {
		if (!draggableElement) {
			return;
		}
		removeDraggableElement();
	};
	this.enableDragging = function() {
		if (!draggableElement) {
			return;
		}
		initDraggableElement();
	};

	var initDraggableElement = function() {
		removeDraggableElement();
		draggableElement.setAttribute('data-draggable-state', 'draggable');
		touchManager.addEventListener(gestureElement, 'start', startHandler);
	};
	var removeDraggableElement = function() {
		draggableElement.removeAttribute('data-draggable-state');
		touchManager.removeEventListener(gestureElement, 'start', startHandler);
		touchManager.removeEventListener(gestureElement, 'move', moveHandler);
		touchManager.removeEventListener(gestureElement, 'cancel', endHandler);
		touchManager.removeEventListener(gestureElement, 'end', endHandler);
	};
	var startHandler = function(eventInfo, touchInfo) {
		if (touchInfo.touches != undefined && touchInfo.touches.length == 1) {
			draggableElement.setAttribute('data-draggable-state', 'dragging');
			startElementX = draggableElement.offsetLeft;
			startElementY = draggableElement.offsetTop;

			startTouchX = touchInfo.touches[0].pageX;
			startTouchY = touchInfo.touches[0].pageY;

			if ((beforeStartCallback == undefined) || beforeStartCallback(compileInfo())) {
				touchManager.addEventListener(gestureElement, 'move', moveHandler);
				touchManager.addEventListener(gestureElement, 'end', endHandler);
				touchManager.addEventListener(gestureElement, 'cancel', endHandler);

				if (startCallback) {
					startCallback(compileInfo());
				}
			}
		}
	};
	var moveHandler = function(eventInfo, touchInfo) {
		if (touchInfo.touches != undefined && touchInfo.touches.length == 1) {
			eventInfo.preventDefault();
			currentTouchX = touchInfo.touches[0].pageX;
			currentTouchY = touchInfo.touches[0].pageY;

			currentElementX = startElementX + currentTouchX - startTouchX;
			currentElementY = startElementY + currentTouchY - startTouchY;

			if (boundariesElement) {
				var minX;
				var maxX;
				var minY;
				var maxY;

				if (currentElementX > (minX = boundariesElement.offsetWidth * boundariesPadding)) {
					currentElementX = minX;
				}
				else if (currentElementX < (maxX = (boundariesElement.offsetWidth * (1 - boundariesPadding) - draggableElement.offsetWidth))) {
					currentElementX = maxX;
				}

				if (currentElementY > (minY = boundariesElement.offsetHeight * boundariesPadding)) {
					currentElementY = minY;
				}
				if (currentElementY < (maxY = boundariesElement.offsetHeight * (1 - boundariesPadding) - draggableElement.offsetHeight)) {
					currentElementY = maxY;
				}
			}

			if ((beforeMoveCallback == undefined) || beforeMoveCallback(compileInfo())) {
				draggableElement.style.left = currentElementX + 'px';
				draggableElement.style.top = currentElementY + 'px';

				if (afterMoveCallback) {
					afterMoveCallback(compileInfo());
				}
			}
		}

	};
	var endHandler = function(eventInfo) {
		eventInfo.preventDefault();
		draggableElement.setAttribute('data-draggable-state', 'draggable');
		touchManager.removeEventListener(gestureElement, 'move', moveHandler);
		touchManager.removeEventListener(gestureElement, 'end', endHandler);
		touchManager.removeEventListener(gestureElement, 'cancel', endHandler);

		if (endCallback) {
			endCallback(compileInfo());
		}
	};

	var compileInfo = function() {
		return {
			"draggableElement": draggableElement,
			"parentElement": parentElement,
			"gestureElement": gestureElement,
			"startElementX": startElementX,
			"startElementY": startElementY,
			"currentElementX": currentElementX,
			"currentElementY": currentElementY,

			"startTouchX": startTouchX,
			"startTouchY": startTouchY,
			"currentTouchX": currentTouchX,
			"currentTouchY": currentTouchY
		}
	}
};

var __ScalableComponent = function() {
	var scaledElement;
	var gestureElement;
	var beforeStartCallback;
	var afterStartCallback;
	var afterChangeCallback;
	var preChangeCallback;
	var endCallback;
	var speedX = 1;
	var speedY = 1;
	var minWidth;
	var minHeight;
	var maxWidth;
	var maxHeight;
	var scale;
	var startWidth;
	var startHeight;
	var currentWidth;
	var currentHeight;

	var startF0x;
	var startF0y;
	var startF1x;
	var startF1y;
	var startDistance;

	var f0x;
	var f0y;
	var f1x;
	var f1y;

	var self = this;
	this.registerScalableElement = function(parameters) {
		if (typeof parameters == 'object') {
			if (parameters.scaledElement != undefined) {
				scaledElement = parameters.scaledElement;
			}

			if (parameters.gestureElement != undefined) {
				gestureElement = parameters.gestureElement;
			}
			else {
				gestureElement = scaledElement;
			}

			if (parameters.scaledElement != undefined) {
				scaledElement = parameters.scaledElement;
			}
			if (typeof parameters.beforeStartCallback == 'function') {
				beforeStartCallback = parameters.beforeStartCallback;
			}
			if (typeof parameters.afterStartCallback == 'function') {
				afterStartCallback = parameters.afterStartCallback;
			}
			if (typeof parameters.afterChangeCallback == 'function') {
				afterChangeCallback = parameters.afterChangeCallback;
			}
			if (typeof parameters.preChangeCallback == 'function') {
				preChangeCallback = parameters.preChangeCallback;
			}
			if (typeof parameters.endCallback == 'function') {
				endCallback = parameters.endCallback;
			}
			if (typeof parameters.speedX != 'undefined') {
				speedX = parseFloat(parameters.speedX, 10);
			}
			else {
				speedX = 1;
			}
			if (typeof parameters.speedY != 'undefined') {
				speedY = parseFloat(parameters.speedY, 10);
			}
			else {
				speedY = 1;
			}
			if (typeof parameters.minWidth != 'undefined') {
				minWidth = parseInt(parameters.minWidth, 10);
			}
			if (typeof parameters.minHeight != 'undefined') {
				minHeight = parseInt(parameters.minHeight, 10);
			}
			if (typeof parameters.maxWidth != 'undefined') {
				maxWidth = parseInt(parameters.maxWidth, 10);
			}
			if (typeof parameters.maxHeight != 'undefined') {
				maxHeight = parseInt(parameters.maxHeight, 10);
			}
			initScalableElement();
		}
	};
	this.unRegisterScalableElement = function() {
		removeScalableElement();
	};
	var initScalableElement = function() {
		removeScalableElement();
		touchManager.setTouchAction(gestureElement, 'none'); // disable browser-related touch manipulation
		touchManager.addEventListener(gestureElement, 'start', startHandler);
	};
	var removeScalableElement = function() {
		touchManager.removeEventListener(gestureElement, 'start', startHandler);
		touchManager.removeEventListener(gestureElement, 'move', moveHandler);
		touchManager.removeEventListener(gestureElement, 'cancel', endHandler);
		touchManager.removeEventListener(gestureElement, 'end', endHandler);
	};
	var startHandler = function(eventInfo, touchInfo) {
		if (touchInfo.touches != undefined && touchInfo.touches.length > 1) {
			eventInfo.preventDefault();
			scale = 1;
			if (scaledElement.tagName.toUpperCase() == 'SVG') {
				// not all browsers provide offsetWidth/Height for SVGs
				var svgBoxInfo = scaledElement.getBoundingClientRect();
				startWidth = svgBoxInfo.width;
				startHeight = svgBoxInfo.height;
			} else {
				startWidth = scaledElement.offsetWidth;
				startHeight = scaledElement.offsetHeight;
			}
			startF0x = touchInfo.touches[0].pageX;
			startF0y = touchInfo.touches[0].pageY;
			startF1x = touchInfo.touches[1].pageX;
			startF1y = touchInfo.touches[1].pageY;

			startDistance = Math.pow(Math.pow(startF1x - startF0x, 2) + Math.pow(startF1y - startF0y, 2), 0.5);

			if ((beforeStartCallback == undefined) || beforeStartCallback(compileInfo())) {
				touchManager.addEventListener(gestureElement, 'move', moveHandler);
				touchManager.addEventListener(gestureElement, 'end', endHandler);
				touchManager.addEventListener(gestureElement, 'cancel', endHandler);

				if (afterStartCallback) {
					afterStartCallback(compileInfo());
				}
			}
		}
	};
	var moveHandler = function(eventInfo, touchInfo) {
		if (touchInfo.touches != undefined && touchInfo.touches.length > 1) {
			eventInfo.preventDefault();
			f0x = touchInfo.touches[0].pageX;
			f0y = touchInfo.touches[0].pageY;
			f1x = touchInfo.touches[1].pageX;
			f1y = touchInfo.touches[1].pageY;

			var distance = Math.pow(Math.pow(f1x - f0x, 2) + Math.pow(f1y - f0y, 2), 0.5);
			scale = distance / startDistance;
			if (scale != 1) {
				var change = 1 - scale;
				currentWidth = startWidth - startWidth * change * speedX;

				if (currentWidth > maxWidth) {
					currentWidth = maxWidth;
				}
				if (currentWidth < minWidth) {
					currentWidth = minWidth;
				}

				currentHeight = startHeight - startHeight * change * speedY;
				if (currentHeight > maxHeight) {
					currentHeight = maxHeight;
				}
				if (currentHeight < minHeight) {
					currentHeight = minHeight;
				}

				if (preChangeCallback) {
					preChangeCallback(compileInfo());
				}

				scaledElement.style.width = currentWidth + 'px';
				scaledElement.style.height = currentHeight + 'px';

				if (afterChangeCallback) {
					afterChangeCallback(compileInfo());
				}
			}
		}
	};
	var endHandler = function(eventInfo, touchInfo) {
		eventInfo.preventDefault();
		touchManager.removeEventListener(gestureElement, 'move', moveHandler);
		touchManager.removeEventListener(gestureElement, 'end', endHandler);
		touchManager.removeEventListener(gestureElement, 'cancel', endHandler);

		if (endCallback) {
			endCallback(compileInfo());
		}
	};

	var compileInfo = function() {
		return {
			"speedX": speedX,
			"speedY": speedY,
			"minWidth": minWidth,
			"minHeight": minHeight,
			"maxWidth": maxWidth,
			"maxHeight": maxHeight,
			"scale": scale,
			"startWidth": startWidth,
			"startHeight": startHeight,
			"currentWidth": currentWidth,
			"currentHeight": currentHeight,

			"startF0x": startF0x,
			"startF0y": startF0y,
			"startF1x": startF1x,
			"startF1y": startF1y,
			"startDistance": startDistance,

			"f0x": f0x,
			"f0y": f0y,
			"f1x": f1x,
			"f1y": f1y
		}
	}
};

window.touchManager = new function() {
	var self = this;
	var handlers = {};
	var eventsSet;
	var startEventName;
	var moveEventName;
	var endEventName;
	var cancelEventName;
	var pointerCache = {};

	var init = function() {
		handlers['start'] = [];
		handlers['end'] = [];
		handlers['move'] = [];
		handlers['cancel'] = [];
		eventsSet = self.getEventsSet();
		if (eventsSet == 'mouse') {
			captureStartEvent = captureStartEvent_mouse;
			captureEndEvent = captureEndEvent_mouse;
			compileEventInfo = compileEventInfo_mouse;
			startEventName = 'mousedown';
			moveEventName = 'mousemove';
			endEventName = 'mouseup';
			cancelEventName = 'mouseleave';
		} else if (eventsSet == 'touch') {
			compileEventInfo = compileEventInfo_touch;
			startEventName = 'touchstart';
			moveEventName = 'touchmove';
			endEventName = 'touchend';
			cancelEventName = 'touchcancel';
		} else if (eventsSet == 'pointer') {
			compileEventInfo = compileEventInfo_pointer;
			startEventName = 'pointerdown';
			moveEventName = 'pointermove';
			endEventName = 'pointerup';
			cancelEventName = 'pointercancel';
		} else if (eventsSet == 'mspointer') {
			compileEventInfo = compileEventInfo_mouse;
			startEventName = 'mspointerdown';
			moveEventName = 'mspointermove';
			endEventName = 'mspointerup';
			cancelEventName = 'mspointercancel';
		}
		window.addEventListener('load', initDom);
	};
	var initDom = function() {
		switch(eventsSet) {
			case 'pointer':
			case 'mspointer':
				// cache pointers in these events for multi touch support
				document.body.addEventListener(endEventName, pointerUp, true);
				document.body.addEventListener(cancelEventName, pointerUp, true);
				document.body.addEventListener(startEventName, pointerDown, true);
				document.body.addEventListener(moveEventName, pointerMove, true);
				break;
		}
	};
	this.getEventsSet = function() {
		eventsSet = false;
		if (window.PointerEvent) {
			//IE >=11, somebody else?
			eventsSet = 'pointer';
		} else if (window.navigator.msPointerEnabled) {
			//IE mobile <=10
			eventsSet = 'mspointer';
		} else if ('ontouchstart' in window) {
			eventsSet = 'touch';
		} else if ('onmousedown' in window) {
			eventsSet = 'mouse';
		}
		self.getEventsSet = getEventsSet_return;
		return eventsSet;
	};
	var getEventsSet_return = function() {
		return eventsSet;
	};
	var captureStartEvent = function(event) {
		var eventType = 'start';
		fireCallback(eventType, event);
	};
	var captureStartEvent_mouse = function(event) {
		if (event.button == 0) {
			var eventType = 'start';
			fireCallback(eventType, event);
		}
	};
	var captureMoveEvent = function(event) {
		var eventType = 'move';
		fireCallback(eventType, event);
	};
	var captureEndEvent = function(event) {
		var eventType = 'end';
		fireCallback(eventType, event);
	};
	var captureCancelEvent = function(event) {
		var eventType = 'cancel';
		fireCallback(eventType, event);
	};
	var captureEndEvent_mouse = function(event) {
		if (event.button == 0) {
			var eventType = 'end';
			fireCallback(eventType, event);
		}
	};
	var fireCallback = function(eventType, event) {
		var eventInfo = compileEventInfo(event);

		for (var i = 0; i < handlers[eventType].length; i++) {
			if (handlers[eventType][i]['element'] == eventInfo['currentTarget']) {
				handlers[eventType][i]['callback'](event, eventInfo);
			}
		}
	};
	var compileEventInfo;
	var compileEventInfo_touch = function(event) {
		var eventInfo = {
			'target': event.target,
			'currentTarget': event.currentTarget,
			'touches': event.touches
		};
		if (typeof event.touches[0] != 'undefined') {
			var firstTouch = event.touches[0];
			eventInfo['clientX'] = firstTouch.clientX;
			eventInfo['clientY'] = firstTouch.clientY;
			eventInfo['pageX'] = firstTouch.pageX;
			eventInfo['pageY'] = firstTouch.pageY;
		}
		return eventInfo;
	};
	var compileEventInfo_pointer = function(event) {
		var touches = [];
		for (var id in pointerCache) {
			touches.push(pointerCache[id]);
		}
		return {
			'touches': touches,
			'target': event.target,
			'currentTarget': event.currentTarget,
			'clientX': event.clientX,
			'clientY': event.clientY,
			'pageX': event.pageX,
			'pageY': event.pageY
		};
	};
	var compileEventInfo_mouse = function(event) {
		var currentTouchInfo = {
			'clientX': event.clientX,
			'clientY': event.clientY,
			'pageX': event.pageX,
			'pageY': event.pageY
		};
		return {
			'touches': [currentTouchInfo],
			'target': event.target,
			'currentTarget': event.currentTarget,
			'clientX': event.clientX,
			'clientY': event.clientY,
			'pageX': event.pageX,
			'pageY': event.pageY,
		};
	};
	var cachePointerEvent = function(event) {
		if (event.pointerId) {
			pointerCache[event.pointerId] = {
				'clientX': event.clientX,
				'clientY': event.clientY,
				'pageX': event.pageX,
				'pageY': event.pageY,
			};
		}
	};
	var uncachePointerEvent = function(event) {
		if (event.pointerId && pointerCache[event.pointerId]) {
			delete pointerCache[event.pointerId];
		}
	};
	var pointerUp = function(event) {
		uncachePointerEvent(event);
	};
	var pointerDown = function(event) {
		cachePointerEvent(event);
	};
	var pointerMove = function(event) {
		cachePointerEvent(event);
	};
	this.addEventListener = function(element, eventType, callback, useCapture) {
		if (!useCapture) {
			useCapture = false;
		}
		if (typeof handlers[eventType] != 'undefined') {
			var handlerExists = false;

			for (var i = 0; i < handlers[eventType].length; i++) {
				if (handlers[eventType][i]['callback'] == callback && handlers[eventType][i]['element'] == element) {
					handlerExists = true;
				}
			}
			if (!handlerExists) {
				var handlerObject = {};
				handlerObject['callback'] = callback;
				handlerObject['element'] = element;
				handlers[eventType].push(handlerObject);
			}
			if (typeof element != 'undefined' && typeof callback != 'undefined') {
				if (eventType == 'start') {
					element.addEventListener(startEventName, captureStartEvent, useCapture);
				}
				else if (eventType == 'move') {
					element.addEventListener(moveEventName, captureMoveEvent, useCapture);
				}
				else if (eventType == 'end') {
					element.addEventListener(endEventName, captureEndEvent, useCapture);
				}
				else if (eventType == 'cancel') {
					element.addEventListener(cancelEventName, captureCancelEvent, useCapture);
				}
			}
		}
	};
	this.removeEventListener = function(element, eventType, callback) {
		if (typeof handlers[eventType] != 'undefined') {
			for (var i = 0; i < handlers[eventType].length; i++) {
				if (handlers[eventType][i]['callback'] == callback && handlers[eventType][i]['element'] == element) {
					handlers[eventType][i] = null;
					handlers[eventType].splice(i, 1);
				}
			}
		}
	};
	this.setTouchAction = function(element, action) {
		if (eventsSet == 'mspointer') {
			// IE10
			element.style.msTouchAction = action;
		} else {
			element.style.touchAction = action;
		}
	};
	init();
};

var piletilevi = piletilevi || {};

piletilevi.venuemap = {
	SHOP_DOMAIN: 'shop.piletilevi.ee',
	DEFAULT_SEAT_HOVER_COLOR: '#27272e',
	DEFAULT_SEAT_ACTIVE_COLOR: '#27272e',
	DEFAULT_SEAT_INACTIVE_COLOR: '#d0d0d0',
	SEAT_CIRCLE_RADIUS: 6,
	STAGE_TEXT_SIZE: 20,
	DEBUG_FULL_PLACESMAP_SECTIONS: false,
};

piletilevi.venuemap.PlacesMapSeatInfo = function(id, row, place, price, available, priceClass) {
	this.id = id;
	this.row = row;
	this.place = place;
	this.price = price;
	this.available = !!available;
	this.priceClass = priceClass;
};

piletilevi.venuemap.PlacesMapPriceClassInfo = function(id, color, price) {
	this.id = id;
	this.color = color;
	this.price = price;
};

piletilevi.venuemap.SectionDetails = function(id, selectableSeats, seatsInfo, priceClasses) {
	this.id = id;
	this.selectableSeats = selectableSeats;
	this.seatsInfo = seatsInfo;
	this.priceClasses = priceClasses;
};

piletilevi.venuemap.Utilities = new function() {
	var self = this;
	var animations = [];
	var transitionsAndEvents = {
		'transition': 'transitionend',
		'OTransition': 'oTransitionEnd',
		'MozTransition': 'transitionend',
		'WebkitTransition': 'webkitTransitionEnd'
	}
	var supportedTransition = '';
	var transitionSupportChecked = false;

	var anim = function(element, properties, duration, easeMode, onComplete) {
		var init = function() {
			this.element = element;
			self.checkTransitionSupport();
			if (supportedTransition) {
				var transitions = [];
				for (var key in properties) {
					transitions.push(key + ' ' + duration + 'ms' + ' ' + (easeMode || 'linear'));
				}
				element.style[supportedTransition] = transitions.join(', ');
			}
			for (var key in properties) {
				element.style[key] = properties[key];
			}
			if (supportedTransition) {
				element.addEventListener(transitionsAndEvents[supportedTransition], transitionend);
			} else if (typeof onComplete == 'function') {
				onComplete();
			}
		};
		var transitionend = function(event) {
			finish();
			element.removeEventListener(transitionsAndEvents[supportedTransition], transitionend);
		};
		var finish = function() {
			if (element) {
				element.style[supportedTransition] = '';
			}
			if (typeof onComplete == 'function') {
				onComplete();
			}
		};
		this.cancel = function() {
			element.removeEventListener(transitionsAndEvents[supportedTransition], transitionend);
		};
		init();
	};
	this.checkTransitionSupport = function() {
		if (transitionSupportChecked) {
			return;
		}
		for (var key in transitionsAndEvents) {
			if (key in document.body.style) {
				supportedTransition = key;
				break;
			}
		}
		transitionSupportChecked = true;
	};
	this.animate = function(element, properties, duration, easeMode, onComplete) {
		for (var i = animations.length; i--;) {
			if (animations[i].element == element) {
				animations[i].cancel();
				animations.splice(i, 1);
			}
		}
		animations.push(new anim(element, properties, duration, easeMode, onComplete));
	};
	this.sendXhr = function(options) {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if (xhr.status == 200) {
					options.onSuccess(xhr.responseText);
				} else if (options.onFailure) {
					options.onFailure();
				}
			}
		};
		xhr.open('GET', options.url, true);
		xhr.send(null);
	};
	this.calculateAngle = function(x1, y1, x2, y2) {
		return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
	};
	this.createSvgNode = function(name, attributes) {
		var result = document.createElementNS("http://www.w3.org/2000/svg", name);
		attributes = attributes || {};
		for (var i in attributes) {
			result.setAttributeNS(null, i, attributes[i]);
		}
		return result;
	};
	this.getSvgTextBBox = function(text, attributes) {
		var svgElement = piletilevi.venuemap.Utilities.createSvgNode('svg');
		var node = piletilevi.venuemap.Utilities.createSvgNode('text', attributes);

		var textNode = document.createTextNode(text);
		node.appendChild(textNode);
		svgElement.appendChild(node);
		document.body.appendChild(svgElement);
		var result = node.getBBox();
		document.body.removeChild(svgElement);
		return result;
	};
	this.addClass = function(element, className) {
		if (element) {
			var elementClassName = element.getAttribute('class') || "";
			if (-1 == elementClassName.indexOf(className)) {
				if (elementClassName == '') {
					element.setAttribute('class', className);
				}
				else {
					element.setAttribute('class', elementClassName + ' ' + className);
				}
			}
		}
	};
	this.removeClass = function(element, className) {
		if (element) {
			var elementClassName = element.getAttribute('class') + "";
			if (-1 != elementClassName.indexOf(className)) {
				if (-1 != elementClassName.indexOf(className + " ")) {
					className += " ";
				}
				else if (-1 != elementClassName.indexOf(" " + className)) {
					className = " " + className;
				}
				elementClassName = elementClassName.replace(className, "");
				element.setAttribute('class', elementClassName);
			}
		}
	};
	this.isTransformSupported = function() {
		return 'transform' in document.body.style;
	};
	this.getPosition = function(obj) {
		var curleft = curtop = 0;
		if (obj.offsetParent) {
			do {
				curleft += obj.offsetLeft;
				curtop += obj.offsetTop;
			} while (obj = obj.offsetParent);
		}
		return {"x": curleft, "y": curtop};
	};
	this.getPageScroll = function() {
		var xScroll, yScroll;
		if (window.pageYOffset) {
			yScroll = window.pageYOffset;
			xScroll = window.pageXOffset;
		} else if (document.documentElement && document.documentElement.scrollTop) {
			yScroll = document.documentElement.scrollTop;
			xScroll = document.documentElement.scrollLeft;
		} else if (document.body) {// all other Explorers
			yScroll = document.body.scrollTop;
			xScroll = document.body.scrollLeft;
		}
		return {"x": xScroll, "y": yScroll};
	};
	this.debugOnScreen = function(text) {
		if (!window.debugElement) {
			window.debugElement = document.createElement('div');
			var s = window.debugElement.style;
			s.background = 'red';
			s.color = 'white';
			s.position = 'fixed';
			s.bottom = 0;
			s.left = 0;
			s.width = '100%';
			s.zIndex = '9001';
			document.body.appendChild(window.debugElement);
		}
		window.debugElement.innerHTML = (+new Date()) + ': ' + text;
	};
	this.createStretchHackElement = function(viewBox) {
		var result = document.createElement('img');
		result.src = "data:image/svg+xml,%3Csvg viewBox='" + viewBox
			+ "' xmlns='http://www.w3.org/2000/svg'/%3E";
		result.style.width = '100%';
		//result.style.height = '100%';
		result.style.maxWidth = '100%';
		result.style.maxHeight = '100%';
		result.style.verticalAlign = 'top';
		return result;
	};
};

piletilevi.venuemap.VenueMap = function() {
	var self = this;
	var shopDomain = piletilevi.venuemap.SHOP_DOMAIN;
	var connectionSecure = false;
	var confId = '';
	var seatSelectionEnabled = false;
	var sectionsMapType = 'vector';
	var sectionsMapImageUrl = '';
	var sections = [];
	var enabledSections = [];
	var selectedSeats = [];
	var selectedSeatsIndex = {};
	var eventHandlers = {};
	var sectionsDetails = {};
	var sectionsMap;
	var placesMap;
	var previousSection;
	var activeSection;
	var componentElement;
	var zoomLevel = 0;
	var translations = [];
	var placeToolTip;
	var built = false;
	var displayed = true;
	var inactiveSeatsNumbered = false;
	var lastLoadedVenueConf = 0;
	var lastLoadedVenueSuccessful = false;
	var lastLoadedPlacesConf = 0;
	var lastLoadedPlacesSuccessful = false;
	var withControls = false;
	var extensionHandler;
	var seatsSections = {};
	var requestCache = {};
	var canvasFactory;
	var extended = false;
	var massSelectable = false;
	var placesMapFlipped = false;
	var legendType = 'price';
	var concertId = ''; // temporary solution 0004087
	var loadingOverrides = false; // temporary solution 0004087
	var configOverrides = {}; // temporary solution 0004087
	var zoomLimit = 16; // max seat radius in pixels
	var placesMapData;
	var placesMapAvailableSections = {};
	var fullMapGenerated = false;
	var fixedHeight = 0;

	var seatColors = {
		'hover': piletilevi.venuemap.DEFAULT_SEAT_HOVER_COLOR,
		'active': piletilevi.venuemap.DEFAULT_SEAT_ACTIVE_COLOR,
		'inactive': piletilevi.venuemap.DEFAULT_SEAT_INACTIVE_COLOR
	};

	var init = function() {
		componentElement = document.createElement('div');
		componentElement.className = 'piletilevi_venue_map';
		componentElement.style.display = 'none';
		componentElement.style['-moz-user-select'] = 'none';
		componentElement.style['-ms-user-select'] = 'none';
		componentElement.style['-webkit-user-select'] = 'none';
		componentElement.style.userSelect = 'none';
		canvasFactory = new piletilevi.venuemap.VenuePlacesMapCanvasFactory(self);
		self.hide();
		window.addEventListener('resize', self.resize);
	};
	var adjustToZoom = function(withAnimation, focalPoint) {
		adjustZoomControls();
		if (activeSection || sectionsMapType == 'full_venue') {
			placesMap.adjustToZoom(withAnimation, focalPoint);
		} else if (sectionsMap) {
			//sectionsMap.position(); // broken
		}
	};
	this.build = function() {
		if (sectionsMapType != 'full_venue') {
			sectionsMap = new piletilevi.venuemap.SectionsMap(self);
			componentElement.appendChild(sectionsMap.getComponentElement());
		}
		placesMap = new piletilevi.venuemap.PlacesMap(self);
		componentElement.appendChild(placesMap.getComponentElement());
		placeToolTip = new piletilevi.venuemap.PlaceTooltip(self);
		built = true;
		if (concertId) {
			// temporary solution 0004087
			loadOverrides();
		} else {
			self.update();
		}
	};
	var loadOverrides = function() {
		// temporary solution 0004087
		loadingOverrides = true;
		self.requestShopData(
			'/public/seatingPlanOverrides',
			function(response) {
				configOverrides = null;
				try {
					configOverrides = JSON.parse(response);
				} catch(error) {
					console.error('Failed parsing config overrides response');
					return;
				}
				if (typeof configOverrides != 'object') {
					console.error('Received invalid config overrides response');
					return;
				}
				loadingOverrides = false;
				self.update();
			},
			function() {
				console.error('Failed loading config overrides');
			}
		);
	};
	var loadVenuePlacesMap = function(onSuccess, onFail) {
		if (lastLoadedPlacesConf == confId) {
			if (lastLoadedPlacesSuccessful) {
				onSuccess();
			} else {
				onFail();
			}
			return;
		}
		lastLoadedPlacesConf = confId;
		self.requestShopData(
			'/public/upload/seatingplan_json/' + confId + '.json',
			function(response) {
				receiveVenuePlacesMap(response);
				lastLoadedPlacesSuccessful = true;
				onSuccess();
			},
			function() {
				onFail();
				lastLoadedPlacesSuccessful = false;
				self.trigger('placesMapLoadFailure');
			},
			true
		);
	};
	var receiveVenuePlacesMap = function(response) {
		placesMapData = JSON.parse(response);
		placesMapAvailableSections = {};
		for (var i = 0; i < placesMapData.seats.length; ++i) {
			var seat = placesMapData.seats[i];
			placesMapAvailableSections[seat.section] = true;
		}
	};

	var loadVenueMap = function(onSuccess, onFail) {
		if (lastLoadedVenueConf == confId) {
			if (lastLoadedVenueSuccessful) {
				onSuccess();
			} else {
				onFail();
			}
			return;
		}
		lastLoadedVenueConf = confId;
		if (sectionsMapType == 'image') {
			sectionsMap.createImageElement(sectionsMapImageUrl);
			onSuccess();
		}
		else {
			self.requestShopData(
				'/public/upload/seatingplan_svg/' + confId + '.svg',
				function(response) {
					onSuccess();
					lastLoadedVenueSuccessful = true;
					receiveVenueMap(response);
				},
				function() {
					onFail();
					lastLoadedVenueSuccessful = false;
					self.trigger('sectionsMapLoadFailure');
				}
			);
		}
	};
	var receiveVenueMap = function(response) {
		var mapData = response;
		var parser = new DOMParser();
		try {
			var svgDocument = parser.parseFromString(mapData, 'image/svg+xml');
			if (svgDocument && svgDocument.getElementsByTagName('parsererror').length > 0) {
				svgDocument = null;
			}
			if (svgDocument) {
				var elements = svgDocument.getElementsByTagName('image');
				var protocol = connectionSecure ? 'https' : 'http';
				var hrefBase = protocol + '://' + shopDomain;
				for (var i = elements.length; i--;) {
					elements[i].setAttribute('xlink:href', hrefBase + elements[i].getAttribute('xlink:href'));
				}
				sectionsMap.mapElement = document.adoptNode(svgDocument.documentElement);
				sectionsMap.mapElement.style.verticalAlign = 'top';
				sectionsMap.checkMapElement();
			}
		} catch(e) {
		}
	};
	var adjustZoomControls = function() {
		placesMap.adjustZoomControls();
	};
	this.update = function() {
		if (loadingOverrides) {
			// temporary solution 0004087
			return;
		}
		if (!built) {
			self.build();
			return;
		}
		if (concertId && configOverrides[concertId]) {
			// temporary solution 0004087
			confId = configOverrides[concertId];
		}
		if (sectionsMapType != 'full_venue') {
			if (activeSection) {
				sectionsMap.hide();
				placesMap.setDisplayed(true);

				var sectionDetails = self.getSectionDetails(activeSection);
				placesMap.updateSectionDetails(sectionDetails);
				if (activeSection == previousSection) {
					return;
				}
				previousSection = activeSection;
				self.hide();
				self.setCurrentZoomLevel(0);
				loadVenuePlacesMap(
					function() {
						if (!placesMapAvailableSections[activeSection]) {
							self.hide();
							return;
						}
						placesMap.setDisplayed(true);
						self.display();
						var canvas = canvasFactory.createCanvas({
							data: placesMapData,
							relevantSections: [activeSection]
						});
						placesMap.changeCanvas(canvas);
					},
					function() {
						self.hide();
					}
				);
			} else {
				self.setCurrentZoomLevel(0);
				previousSection = 0;
				placesMap.setDisplayed(false);
				sectionsMap.update();
				sectionsMap.display();
				loadVenueMap(
					function() {
						self.display();
					},
					function() {
						self.hide();
					}
				);
			}
		} else {
			placesMap.updateSectionsDetails(sectionsDetails);
			if (fullMapGenerated) {
				return;
			}
			loadVenuePlacesMap(
				function() {
					placesMap.setDisplayed(true);
					self.display();
					var canvas = canvasFactory.createCanvas({
						data: placesMapData,
						relevantSections: enabledSections,
						withStage: true
					});
					placesMap.changeCanvas(canvas);
					fullMapGenerated = true;
				},
				function() {
					self.hide();
				}
			);
		}
	};
	this.display = function() {
		if (displayed) {
			return;
		}
		componentElement.style.display = '';
		displayed = true;
		self.resize();
		self.trigger('visibilityChange', displayed);
	};
	this.hide = function() {
		if (!displayed) {
			return;
		}
		componentElement.style.display = 'none';
		displayed = false;
		self.trigger('visibilityChange', displayed);
	};
	this.setConfId = function(newConfId) {
		confId = newConfId;
	};
	this.setConcertId = function(newConcertId) {
		// temporary solution 0004087
		concertId = newConcertId;
	};
	this.getConfId = function() {
		return confId;
	};
	this.getZoomLimit = function() {
		return zoomLimit;
	};
	this.setZoomLimit = function(newZoomLimit) {
		zoomLimit = newZoomLimit;
	};
	this.getSectionsMap = function() {
		return sectionsMap;
	};
	this.setSectionsMapType = function(newMapType) {
		sectionsMapType = newMapType;
	};
	this.getSectionsMapType = function() {
		return sectionsMapType;
	};
	this.setSectionsMapImageUrl = function(newMapImageUrl) {
		sectionsMapImageUrl = newMapImageUrl;
	};
	this.getSectionsMapImageUrl = function() {
		return sectionsMapImageUrl;
	};
	this.setSections = function(newSections) {
		sections = newSections;
	};
	this.getSections = function() {
		return sections;
	};
	this.setEnabledSections = function(newEnabledSections) {
		enabledSections = newEnabledSections;
	};
	this.getEnabledSections = function() {
		return enabledSections;
	};
	this.setSeatSelectionEnabled = function(newSeatSelectionEnabled) {
		seatSelectionEnabled = newSeatSelectionEnabled;
	};
	this.isSeatSelectionEnabled = function() {
		return seatSelectionEnabled;
	};
	this.addSectionDetails = function(details) {
		sectionsDetails[details.id] = details;
		for (var i = details.seatsInfo.length; i--;) {
			var seat = details.seatsInfo[i];
			seatsSections[seat.id] = details;
		}
	};
	this.getSectionDetails = function(id) {
		return sectionsDetails[id] || null;
	};
	this.setSelectedSeats = function(newSelectedSeats) {
		selectedSeats = newSelectedSeats;
		for (var i = selectedSeats.length; i--;) {
			selectedSeatsIndex[selectedSeats[i]] = true;
		}
	};
	this.unSetSelectedSeats = function(unSelectedSeats) {
		for (var i = unSelectedSeats.length; i--;) {
			selectedSeatsIndex[unSelectedSeats[i]] = false;
		}
	};
	this.unSelectSeat = function(seatId) {
		selectedSeatsIndex[seatId] = false;
	};
	this.setSeatColors = function(newColors) {
		seatColors.hover = newColors.hover || piletilevi.venuemap.DEFAULT_SEAT_HOVER_COLOR;
		seatColors.active = newColors.active || piletilevi.venuemap.DEFAULT_SEAT_ACTIVE_COLOR;
		seatColors.inactive = newColors.inactive || piletilevi.venuemap.DEFAULT_SEAT_INACTIVE_COLOR;
	};
	this.getSeatColor = function(state) {
		return seatColors[state];
	};
	this.isSeatSelected = function(seatId) {
		return selectedSeatsIndex[seatId] || false;
	};
	this.getSectionBySeatId = function(seatId) {
		return seatsSections[seatId] || null;
	};
	this.addHandler = function(eventName, callBack) {
		if (typeof eventHandlers[eventName] == 'undefined') {
			eventHandlers[eventName] = [];
		}
		eventHandlers[eventName].push(callBack);
	};
	this.trigger = function(event, param) {
		for (var type in eventHandlers) {
			if (type != event) {
				continue;
			}
			for (var i = eventHandlers[type].length; i--;) {
				var handler = eventHandlers[type][i];
				handler(param);
			}
			break;
		}
	};
	this.setSelectedSection = function(sectionId) {
		activeSection = sectionId;
		if (placesMap && sectionsMapType == 'full_venue') {
			placesMap.selectSection(sectionId);
		}
	};
	this.setShopDomain = function(newShopDomain) {
		shopDomain = newShopDomain;
	};
	this.setConnectionSecure = function(newConnectionSecure) {
		connectionSecure = newConnectionSecure;
	};
	this.isConnectionSecure = function() {
		return connectionSecure;
	};
	this.getShopDomain = function() {
		return shopDomain;
	};
	this.getSelectedSection = function() {
		return activeSection;
	};
	this.getComponentElement = function() {
		return componentElement;
	};
	this.zoomIn = function() {
		++zoomLevel;
		adjustToZoom();
	};
	this.zoomOut = function() {
		--zoomLevel >= 0 || (zoomLevel = 0);
		adjustToZoom();
	};
	this.setZoomLevel = function(newZoom, withAnimation, focalPoint) {
		zoomLevel = newZoom;
		adjustToZoom(withAnimation, focalPoint);
	};
	this.setCurrentZoomLevel = function(currentZoom) {
		zoomLevel = currentZoom;
		adjustZoomControls();
	};
	this.resize = function() {
		var dupe = componentElement.cloneNode(false);
		dupe.style.visibility = 'hidden';
		dupe.style.display = 'block';
		componentElement.parentNode.appendChild(dupe);
		fixedHeight = dupe.offsetHeight;
		componentElement.parentNode.removeChild(dupe);
		if (placesMap) {
			placesMap.resize();
		}
	};
	this.getFixedHeight = function() {
		return fixedHeight;
	};
	this.getZoomLevel = function() {
		return zoomLevel;
	};
	this.addTranslation = function(key, value) {
		translations[key] = value;
	};
	this.getTranslation = function(key) {
		if (translations[key]) {
			return translations[key];
		} else {
			return key;
		}
	};
	this.getPlaceToolTip = function() {
		return placeToolTip;
	};
	this.requestShopData = function(path, onSuccess, onFail, withCacheWorkaround) {
		if (typeof requestCache[path] != 'undefined') {
			if (requestCache[path] === false) {
				onFail();
			} else {
				onSuccess(requestCache[path]);
			}
			return;
		}
		var protocol = connectionSecure ? 'https' : 'http';
		var requestDomain = path.indexOf('seatingPlanOverrides') < 0
			? shopDomain
			: piletilevi.venuemap.SHOP_DOMAIN;
		var url = protocol + '://' + requestDomain + path;
		if (withCacheWorkaround) {
			var date = new Date;
			url += '?' + date.getTime();
		}
		piletilevi.venuemap.Utilities.sendXhr({
			'url': url,
			'onSuccess': function(response) {
				requestCache[path] = response;
				onSuccess(response);
			},
			'onFailure': function() {
				requestCache[path] = false;
				onFail();
			}
		});
	};
	this.areInactiveSeatsNumbered = function() {
		return inactiveSeatsNumbered;
	};
	this.setInactiveSeatsNumbered = function(enabled) {
		inactiveSeatsNumbered = !!enabled;
	};
	this.getWithControls = function() {
		return withControls;
	};
	this.setWithControls = function(enabled) {
		withControls = !!enabled;
	};
	this.getExtensionHandler = function() {
		return extensionHandler;
	};
	this.setExtensionHandler = function(input) {
		extensionHandler = input;
	};
	this.getLegendType = function() {
		return legendType;
	};
	this.setLegendType = function(input) {
		legendType = input;
	};
	this.isMassSelectable = function() {
		return massSelectable;
	};
	this.setMassSelectable = function(input) {
		massSelectable = !!input;
	};
	this.isPlacesMapFlipped = function() {
		return placesMapFlipped;
	};
	this.setPlacesMapFlipped = function(input) {
		placesMapFlipped = input
			&& piletilevi.venuemap.Utilities.isTransformSupported();
	};
	this.extend = function() {
		if (!extensionHandler) {
			return;
		}
		extended = !extended;
		extensionHandler();
		var extensionClass = 'piletilevi_venue_map_extended';
		if (extended) {
			piletilevi.venuemap.Utilities.addClass(componentElement, extensionClass);
		} else {
			piletilevi.venuemap.Utilities.removeClass(componentElement, extensionClass);
		}
	};
	this.dispose = function() {
		if (componentElement && componentElement.parentNode) {
			componentElement.parentNode.removeChild(componentElement);
		}
		componentElement = null;
		if (placeToolTip) {
			placeToolTip.dispose();
		}
	};
	init();
};

piletilevi.venuemap.Controls = function(venueMap) {
	var self = this;
	var CLASS_ACTIVE = 'piletilevi_venue_map_control_active';
	var buttonElements = {};
	var handlers = {
		extend: function(event) {
			event.preventDefault();
			event.cancelBubble = true;

			venueMap.extend();
		},
		zoomin: function(event) {
			event.preventDefault();
			event.cancelBubble = true;
			venueMap.zoomIn();
		},
		zoomout: function(event) {
			event.preventDefault();
			event.cancelBubble = true;
			venueMap.zoomOut();
		},
		resetzoom: function(event) {
			event.preventDefault();
			event.cancelBubble = true;
			venueMap.setZoomLevel(0);
		}
	};
	var componentElement;

	var init = function() {
		createDomStructure();
	};
	var createDomStructure = function() {
		componentElement = document.createElement('div');
		componentElement.className = 'piletilevi_venue_map_controls';
		if (venueMap.getExtensionHandler()) {
			createButton('extend');
		}
		createButton('zoomin');
		createButton('zoomout');
		createButton('resetzoom');
		self.changeStates({extend: true});
	};
	var createButton = function(type) {
		var buttonElement = document.createElement('div');
		buttonElement.className = 'piletilevi_venue_map_control piletilevi_venue_map_control_' + type;
		componentElement.appendChild(buttonElement);
		buttonElements[type] = buttonElement;
		return buttonElement;
	};
	this.changeStates = function(changes) {
		for (var key in changes) {
			var button = buttonElements[key];
			if (!button) {
				continue;
			}
			if (changes[key]) {
				piletilevi.venuemap.Utilities.addClass(button, CLASS_ACTIVE);
				button.addEventListener('click', handlers[key], true);
			} else {
				piletilevi.venuemap.Utilities.removeClass(button, CLASS_ACTIVE);
				button.removeEventListener('click', handlers[key], true);
			}
		}
	};
	this.setVisible = function(visible) {
		componentElement.style.display = visible ? 'block' : 'none';
	};
	this.getComponentElement = function() {
		return componentElement;
	};
	init();
}

piletilevi.venuemap.SectionsMap = function(venueMap) {
	var mapRegions = {};
	this.imageElement = false;
	this.mapElement = false;
	this.vectorDocument = false;
	var componentElement;
	var stretchElement;
	var self = this;
	var init = function() {
		componentElement = document.createElement('div');
		componentElement.className = 'piletilevi_venue_map_sections';
	};
	this.update = function() {
		var enabledSectionsIndex = {};
		var enabledSections = venueMap.getEnabledSections();
		for (var i = enabledSections.length; i--;) {
			enabledSectionsIndex[enabledSections[i]] = true;
		}
		for (var key in mapRegions) {
			mapRegions[key].setEnabled(key in enabledSectionsIndex);
			mapRegions[key].refreshStatus();
		}
	};
	this.display = function() {
		componentElement.style.display = '';
	};
	this.hide = function() {
		componentElement.style.display = 'none';
	};
	this.createImageElement = function(imageSource) {
		if (self.imageElement) {
			componentElement.removeChild(self.imageElement);
		}
		var element = document.createElement('img');
		element.setAttribute('src', imageSource);
		self.imageElement = element;
		componentElement.appendChild(element);
	};
	this.checkMapElement = function() {
		if (stretchElement) {
			componentElement.removeChild(stretchElement);
		}
		if (self.mapElement) {
			stretchElement = piletilevi.venuemap.Utilities.createStretchHackElement(self.mapElement.getAttribute('viewBox'));
			componentElement.appendChild(stretchElement);
			componentElement.appendChild(self.mapElement);
			var vectorDocument = self.mapElement;
			self.vectorDocument = vectorDocument;
			parseMapElement();
			self.update();
		}
	};
	var parseMapElement = function() {
		if (self.mapElement && self.vectorDocument) {
			var vectorDocument = self.vectorDocument;

			for (var j = 0; j < vectorDocument.childNodes.length; j++) {
				if (vectorDocument.childNodes[j].id) {
					var sectionId = vectorDocument.childNodes[j].id.split('section')[1];
					var sectionVector = vectorDocument.childNodes[j];
					if (!mapRegions[sectionId]) {
						var regionObject = new piletilevi.venuemap.SectionsMapRegion(venueMap, self
							, sectionId, sectionVector);
						mapRegions[sectionId] = regionObject;
					}
				}
			}
			self.mapElement.style.visibility = 'visible';
		}
	};
	this.getComponentElement = function() {
		return componentElement;
	};
	this.getMapRegions = function() {
		return mapRegions;
	};
	init();
};

piletilevi.venuemap.SectionsMapRegion = function(venueMap, sectionsMap, id, sectionVector) {
	var self = this;
	var enabled = false;
	this.id = false;

	var init = function() {
		self.id = id;
		sectionVector.addEventListener('click', self.click);
		sectionVector.addEventListener('mouseover', self.mouseOver);
		sectionVector.addEventListener('mouseout', self.mouseOut);
	};
	this.refreshStatus = function() {
		if (!enabled) {
			this.markDisabled();
		} else {
			this.markInactive();
		}
	};
	this.mouseOver = function(event) {
		self.markActive();
		venueMap.trigger('sectionMouseover', id);
	};
	this.mouseOut = function(event) {
		self.markInactive();
		venueMap.trigger('sectionMouseout', id);
	};
	this.markDisabled = function() {
		if (sectionVector) {
			sectionVector.setAttribute("style", "display: none;");
		}
	};
	this.markActive = function() {
		if (sectionVector) {
			sectionVector.setAttribute("fill", "#75bb01");
			sectionVector.setAttribute("opacity", "0.8");
			sectionVector.setAttribute("style", "display: block;");
		}
	};
	this.markInactive = function() {
		if (sectionVector) {
			sectionVector.setAttribute("fill", "#cccccc");
			sectionVector.setAttribute("opacity", "0");
			sectionVector.setAttribute("style", "display: block;");
		}
	};
	this.setEnabled = function(input) {
		enabled = !!input;
	};
	this.isEnabled = function() {
		return enabled;
	};
	this.click = function(event) {
		venueMap.trigger('sectionSelected', id);
	};
	init();
};

piletilevi.venuemap.PlacesMap = function(venueMap) {
	var legendElement;
	var legendItems = [];
	var self = this;
	var componentElement, mainElement;
	var canvas;
	var displayed = false;
	var controls;
	var selectionRectangle;
	var details = {};
	var pendingCanvasDetails = [];
	var blockingOverlayElement;
	var RSM_NONE = 0;
	var RSM_WAITING = 1;
	var RSM_IN_PROGRESS = 2;
	var rectangleSelectionMode = RSM_NONE;
	var seatsBeforeRectSelection = {};

	var init = function() {
		createDomStructure();
		mainElement.addEventListener('wheel', onWheel);
		if (venueMap.isMassSelectable()) {
			document.addEventListener('keydown', keydown);
		}
	};
	var createDomStructure = function() {
		componentElement = document.createElement('div');
		componentElement.className = 'piletilevi_venue_map_places';
		componentElement.style.display = 'none';
		legendElement = document.createElement('div');
		legendElement.className = 'places_map_legend';
		componentElement.appendChild(legendElement);
		mainElement = document.createElement('div');
		mainElement.className = 'piletilevi_venue_map_places_main';
		mainElement.style.position = 'relative';
		mainElement.style.overflow = 'hidden';
		blockingOverlayElement = document.createElement('div');
		blockingOverlayElement.style.position = 'absolute';
		blockingOverlayElement.style.left = '0';
		blockingOverlayElement.style.right = '0';
		blockingOverlayElement.style.top = '0';
		blockingOverlayElement.style.bottom = '0';
		blockingOverlayElement.style.display = 'none';
		mainElement.appendChild(blockingOverlayElement);
		componentElement.appendChild(mainElement);
		if (venueMap.getWithControls()) {
			controls = new piletilevi.venuemap.Controls(venueMap);
			mainElement.appendChild(controls.getComponentElement());
			piletilevi.venuemap.Utilities.addClass(componentElement, 'piletilevi_venue_map_places_with_controls');
		}
	};
	var keydown = function(event) {
		if (event.keyCode != 17 || !canvas) // ctrl
		{
			return;
		}
		rectangleSelectionMode = RSM_WAITING;
		if (controls) {
			controls.setVisible(false);
		}
		canvas.disableDragging();
		mainElement.style.cursor = 'crosshair';
		blockingOverlayElement.style.display = 'block';
		mainElement.addEventListener('mousedown', mousedown);
		document.removeEventListener('keydown', keydown);
		document.addEventListener('keyup', keyup);
	};
	var keyup = function(event) {
		if (event.keyCode != 17) // ctrl
		{
			return;
		}
		endRectangleSelection();
	};
	var mousedown = function(event) {
		mainElement.removeEventListener('mousedown', mousedown);
		startRectangleSelection(getCursorOffset(event));
	};
	var mousemove = function(event) {
		selectionRectangle.setOtherPoint(getCursorOffset(event));
		var region = selectionRectangle.getRegion();
		canvas.selectSeatsInRegion(region, seatsBeforeRectSelection);
	};
	var mouseup = function(event) {
		endRectangleSelection();
	};
	var startRectangleSelection = function(cursorOffset) {
		rectangleSelectionMode = RSM_IN_PROGRESS;
		var selectedSeats = canvas.getSelectedSeats();
		seatsBeforeRectSelection = {};
		for (var i = selectedSeats.length; i--;) {
			var info = selectedSeats[i].getSeatInfo();
			if (info) {
				seatsBeforeRectSelection[info.id] = true;
			}
		}
		selectionRectangle = new piletilevi.venuemap.SelectionRectangle(cursorOffset);
		mainElement.appendChild(selectionRectangle.getComponentElement());
		mainElement.addEventListener('mousemove', mousemove);
		mainElement.addEventListener('mouseup', mouseup);
	};
	var endRectangleSelection = function() {
		if (venueMap.getZoomLevel() > 0) {
			canvas.enableDragging();
		}
		document.removeEventListener('keyup', keyup);
		mainElement.removeEventListener('mousedown', mousedown);
		mainElement.removeEventListener('mouseup', mouseup);
		mainElement.removeEventListener('mousemove', mousemove);
		if (selectionRectangle) {
			mainElement.removeChild(selectionRectangle.getComponentElement());
			selectionRectangle = null;
		}
		if (rectangleSelectionMode == RSM_IN_PROGRESS) {
			var selectedSeatsIds = [];
			var selectedSeats = canvas.getSelectedSeats();
			for (var i = selectedSeats.length; i--;) {
				var info = selectedSeats[i].getSeatInfo();
				if (info && !seatsBeforeRectSelection[info.id]) {
					selectedSeatsIds.push(info.id);
				}
			}
			if (selectedSeatsIds.length > 0) {
				venueMap.trigger('seatsSelected', selectedSeatsIds);
			}
		}
		rectangleSelectionMode = RSM_NONE;
		document.addEventListener('keydown', keydown);
		// defer controls hiding and such, in case the key is still down and selection restarts
		window.setTimeout(finalizeRectangleSelectionEnding, 100);
	};
	var finalizeRectangleSelectionEnding = function() {
		if (rectangleSelectionMode != RSM_NONE) {
			// selection restarted immeditely
			return;
		}
		mainElement.style.cursor = '';
		blockingOverlayElement.style.display = 'none';
		if (controls) {
			controls.setVisible(true);
		}
	};
	var getCursorOffset = function(mouseEvent) {
		var elementOffset = piletilevi.venuemap.Utilities.getPosition(mainElement);
		return {
			top: Math.max(0, mouseEvent.pageY - elementOffset.y),
			left: Math.max(0, mouseEvent.pageX - elementOffset.x)
		};
	};
	var onWheel = function(event) {
		if (event.preventDefault) {
			event.preventDefault();
		}
		event.returnValue = false;
		if (rectangleSelectionMode != RSM_NONE || event.deltaY == 0) {
			return;
		}
		var e = event;
		var rect = mainElement.getBoundingClientRect();
		var x = e.pageX - rect.left - window.pageXOffset;
		var y = e.pageY - rect.top - window.pageYOffset;
		var scrollLocation = canvas.getPointRelativeToContainer(x, y);
		var scrolledUp = event.deltaY < 0;
		var zoom = venueMap.getZoomLevel();
		if (scrolledUp) {
			++zoom;
		} else {
			--zoom;
		}
		var maxZoomLevel = canvas ? canvas.getMaxZoomLevel() : 0;
		if (zoom >= 0 && zoom <= maxZoomLevel) {
			venueMap.setZoomLevel(zoom, true, scrollLocation);
		}
	};
	var priceFormatter = function(input) {
		return input;
	};
	this.adjustZoomControls = function() {
		if (!controls) {
			return;
		}
		var maxZoom = canvas ? canvas.getMaxZoomLevel() : 0;
		var currentZoom = venueMap.getZoomLevel();
		var states = {
			zoomin: currentZoom < maxZoom,
			zoomout: currentZoom > 0,
			resetzoom: currentZoom > 0
		};
		controls.changeStates(states);
	};
	this.changeCanvas = function(newCanvas) {
		if (canvas) {
			canvas.remove();
		}
		canvas = newCanvas;
		canvas.attachTo(self);
		for (var key in details) {
			canvas.updateSectionDetails(details[key]);
		}
		pendingCanvasDetails = [];
		canvas.setDisplayed(displayed);
	};
	this.updateSectionsDetails = function(sectionsDetails) {
		var combinedPriceClasses = [];
		for (var key in sectionsDetails) {
			details[key] = sectionsDetails[key];
			updateCanvasDetails(sectionsDetails[key]);
			var priceClasses = sectionsDetails[key].priceClasses || [];
			combinedPriceClasses = combinedPriceClasses
				.concat(priceClasses);
		}
		var index = {};
		for (var i = 0; i < combinedPriceClasses.length;) {
			var priceClass = combinedPriceClasses[i];
			if (index[priceClass.id]) {
				combinedPriceClasses.splice(i, 1);
				continue;
			}
			index[priceClass.id] = true;
			++i;
		}
		updateLegend(combinedPriceClasses);
	};
	this.updateSectionDetails = function(newDetails) {
		if (!newDetails) {
			return;
		}
		details[newDetails.id] = newDetails;
		var priceClasses = newDetails.priceClasses || [];
		updateLegend(priceClasses);
		updateCanvasDetails(newDetails);
		//canvas.setDisplayed(true);
	};
	this.adjustToZoom = function(withAnimation, focalPoint) {
		if (canvas) {
			canvas.adjustToZoom(withAnimation, focalPoint);
		}
	};
	this.resize = function() {
		if (!displayed || !canvas) {
			return;
		}
		if (canvas) {
			canvas.resize();
		}
	};
	this.getLegendHeight = function() {
		var style = window.getComputedStyle(legendElement);
		var margins = parseFloat(style.marginTop) + parseFloat(style.marginBottom);
		return legendElement.offsetHeight + margins;
	};
	this.setDisplayed = function(newDisplayed) {
		if (displayed == newDisplayed) {
			return;
		}
		displayed = newDisplayed;
		if (canvas) {
			canvas.setDisplayed(true);
		}
		componentElement.style.display = displayed ? '' : 'none';

	};
	this.getComponentElement = function() {
		return componentElement;
	};
	this.selectSection = function(sectionId) {
		if (!canvas) {
			return;
		}
		canvas.selectSection(sectionId);
	};
	var updateCanvasDetails = function(sectionDetails) {
		if (!canvas) {
			return;
		}
		canvas.updateSectionDetails(sectionDetails);
	};
	var updateLegend = function(priceClasses) {
		var legendItem;
		while (legendElement.firstChild) {
			legendElement.removeChild(legendElement.firstChild);
		}
		var legendType = venueMap.getLegendType();
		var displayed = legendType == 'price' || legendType == 'title';
		legendElement.style.display = displayed ? 'block' : 'none';
		if (!displayed) {
			return;
		}

		var label = venueMap.getTranslation('booked');
		legendItem = new piletilevi.venuemap.PlaceMapLegendItem(label, '#f3f3f5', 'booked');
		legendItems.push(legendItem);
		legendElement.appendChild(legendItem.getComponentElement());
		var sorter = legendType == 'price'
			? function(a, b) {
			return parseFloat(a.price) - parseFloat(b.price);
		}
			: function(a, b) {
			return a.title.localeCompare(b.title);
		};
		priceClasses.sort(sorter);
		for (var i = 0; i < priceClasses.length; i++) {
			if (priceClasses[i][legendType]) {
				legendItem = new piletilevi.venuemap.PlaceMapLegendItem(priceFormatter(priceClasses[i][legendType]), priceClasses[i].color);
				legendItems.push(legendItem);
				legendElement.appendChild(legendItem.getComponentElement());
			}
		}
	};
	this.getMainElement = function() {
		return mainElement;
	};
	init();
};

piletilevi.venuemap.SelectionRectangle = function(anchorPoint) {
	var self = this;
	var otherPoint;
	var style;
	var region;
	var componentElement;

	var init = function() {
		componentElement = document.createElement('div');
		componentElement.className = 'piletilevi_venuemap_selection_rectangle';
		style = componentElement.style;
		style.position = 'absolute';
		style.borderWidth = '1px';
		region = {
			top: anchorPoint.top,
			left: anchorPoint.left,
			width: 0,
			height: 0,
		};
		applyRegionStyle();
	};
	this.setOtherPoint = function(_otherPoint) {
		otherPoint = _otherPoint;
		region = {
			top: Math.min(anchorPoint.top, otherPoint.top),
			left: Math.min(anchorPoint.left, otherPoint.left),
			width: Math.abs(anchorPoint.left - otherPoint.left),
			height: Math.abs(anchorPoint.top - otherPoint.top),
		};
		applyRegionStyle();
	};
	var applyRegionStyle = function() {
		for (var key in region) {
			style[key] = region[key] + 'px';
		}
	};
	this.getRegion = function() {
		return region;
	};
	this.getComponentElement = function() {
		return componentElement;
	};
	init();
};

piletilevi.venuemap.PlacesMapCanvas = function(venueMap, svgElement, sectionLabelElements) {
	var self = this;
	var placesIndex = {};
	var componentElement;
	var displayed = false;
	var aspectRatio;
	var svgDimensions = {
		width: 0,
		height: 0
	};
	var containerElement;
	var boundariesPadding = 0;
	var sectionsBoundaries = {};
	var lastZoomlevel = -1;
	var sectionZoomSeatRadius = 8;
	var seatNumbersRequirement = 7;
	var sectionLabelsRequirement = 2.9;
	var sectionLabelSize = 17;
	var zoomFactor = 1.25;
	var touchScalingPoint;
	var containerDimensions;
	var containerInnerDimensions;
	var maxZoomLevel = 0;
	var maxZoomWidth = 0;
	var container;

	var init = function() {
		sectionLabelElements = sectionLabelElements || {};
		componentElement = document.createElement('div');
		componentElement.className = 'piletilevi_venue_map_canvas';
		componentElement.style.overflow = 'hidden';
		componentElement.style.position = 'relative';
		componentElement.style.textAlign = 'center';
		componentElement.style.display = 'none';
		if (venueMap.isPlacesMapFlipped()) {
			componentElement.style.transform = 'rotate(180deg)';
		}

		svgElement.style.verticalAlign = 'middle';
		svgElement.style.position = 'relative';
		var viewBox = svgElement.getAttribute('viewBox').split(' ');
		svgDimensions.width = +viewBox[2];
		svgDimensions.height = +viewBox[3];
		aspectRatio = svgDimensions.width / svgDimensions.height;
		var elements = svgElement.querySelectorAll('.place');
		if (!elements.length) {
			elements = svgElement.querySelectorAll('circle');
		}
		for (var i = elements.length; i--;) {
			var element = elements[i];
			var id = element.id;
			if (id.indexOf('place_') == 0) {
				id = id.substring(6);
			}
			if (!id) {
				continue;
			}
			var textElement = element.querySelector('text');
			if (!placesIndex[id]) {
				var placeObject = new piletilevi.venuemap.PlacesMapPlace(venueMap, element, textElement);
				placesIndex[id] = placeObject;
			}
		}
		componentElement.appendChild(svgElement);

		var arrowTextElement;
		if (arrowTextElement = svgElement.getElementById('stagename')) {
			new piletilevi.venuemap.PlacesMapStageLabel(venueMap, arrowTextElement);
		}

	};

	this.attachTo = function(destination) {
		container = destination;
		containerElement = container.getMainElement();
		if (containerElement.firstChild) {
			containerElement.insertBefore(componentElement, containerElement.firstChild);
		} else {
			containerElement.appendChild(componentElement);
		}
		self.registerDraggableElement({
			'draggableElement': componentElement,
			'gestureElement': componentElement,
			'boundariesElement': containerElement,
			'boundariesPadding': boundariesPadding
		});
	};
	this.remove = function() {
		self.unRegisterScalableElement();
		self.disableDragging();
		if (componentElement.parentNode) {
			componentElement.parentNode.removeChild(componentElement);
		}
	};
	var scaleStartCallback = function(info) {
		var rect = containerElement.getBoundingClientRect();
		var touchPosition = {
			x: (info.startF0x + info.startF1x) / 2 - rect.left - window.pageXOffset,
			y: (info.startF0y + info.startF1y) / 2 - rect.top - window.pageYOffset
		};
		touchScalingPoint = self.getPointRelativeToContainer(touchPosition.x, touchPosition.y);
		return true;
	};
	var scaleChangeCallback = function(info) {
		var scaledPosition = getScaledMapPosition(info.currentWidth, info.currentHeight, touchScalingPoint);
		componentElement.style.left = scaledPosition.x + 'px';
		componentElement.style.top = scaledPosition.y + 'px';
	};
	var scaleEndCallback = function() {
		lastZoomlevel = calculateZoomLevelFromMapWidth(componentElement.offsetWidth);
		venueMap.setCurrentZoomLevel(lastZoomlevel);
		zoomAdjusted();
	};
	var calculateZoomLevelFromMapWidth = function(zoomedWidth) {
		var scale = zoomedWidth / containerDimensions.width;
		var zoomLevel = Math.round(Math.log(scale) / Math.log(zoomFactor));
		return zoomLevel;
	};
	var calculateMaxZoomLevel = function() {
		var maxSeatRadius = venueMap.getZoomLimit();
		var diff = maxSeatRadius / piletilevi.venuemap.SEAT_CIRCLE_RADIUS;
		maxZoomWidth = svgDimensions.width * diff;
		var paddings = getPaddings();
		maxZoomWidth += paddings.left + paddings.right;
		maxZoomLevel = calculateZoomLevelFromMapWidth(maxZoomWidth);
	};
	this.getMaxZoomLevel = function() {
		return maxZoomLevel;
	};
	this.updateSectionDetails = function(sectionDetails) {
		if (!sectionDetails) {
			return;
		}
		if (sectionLabelElements[sectionDetails.id]) {
			self.setTextContent(sectionLabelElements[sectionDetails.id], sectionDetails.title);
		}
		var priceClasses = sectionDetails.priceClasses || [];
		var priceClassesIndex = {};
		for (var i = priceClasses.length; i--;) {
			priceClassesIndex[priceClasses[i].id] = priceClasses[i];
		}
		var seatsSelectable = venueMap.isSeatSelectionEnabled() && sectionDetails.selectableSeats;
		var seatsInfo = sectionDetails.seatsInfo || [];
		for (var i = 0; i < seatsInfo.length; i++) {
			var seatInfo = seatsInfo[i];
			if (!placesIndex[seatInfo.id]) {
				continue;
			}
			var placeObject = placesIndex[seatInfo.id];
			placeObject.setSeatInfo(seatInfo);
			var seatPriceClass = priceClassesIndex[seatInfo.priceClass] || null;
			var selectable = seatsSelectable && seatInfo;
			placeObject.setPriceClass(seatPriceClass);
			placeObject.setSelected(venueMap.isSeatSelected(seatInfo.id));
			placeObject.setSelectable(selectable);
			placeObject.refreshStatus();
		}
	};
	this.setTextContent = function(element, text) {
		text = text || '';
		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}
		element.appendChild(document.createTextNode(text));
	};
	this.setSectionsBoundaries = function(newSectionsBoundaries) {
		sectionsBoundaries = newSectionsBoundaries;
	};
	this.resize = function() {
		componentElement.style.width = '';
		componentElement.style.height = '';
		containerElement.style.width = '';
		containerElement.style.height = '';

		var paddings = getPaddings();
		var svgStyle = svgElement.style;
		if (venueMap.getFixedHeight()) {
			containerElement.style.height = venueMap.getFixedHeight() - container.getLegendHeight() + 'px';
		} else {
			var svgWidth, svgHeight;
			svgWidth = componentElement.offsetWidth - paddings.left - paddings.right;
			svgHeight = svgWidth / aspectRatio;

			svgStyle.width = svgWidth + 'px';
			svgStyle.height = svgHeight + 'px';
			var highSvg = componentElement.offsetHeight > containerElement.offsetHeight;
			if (highSvg) {
				// container has limited height
				svgHeight = containerElement.offsetHeight - paddings.top - paddings.bottom;
				svgWidth = svgHeight * aspectRatio;
			}
			svgStyle.width = svgWidth + 'px';
			svgStyle.height = svgHeight + 'px';
		}
		containerDimensions = {
			width: containerElement.offsetWidth,
			height: containerElement.offsetHeight
		};
		containerInnerDimensions = {
			width: containerDimensions.width - paddings.left - paddings.right,
			height: containerDimensions.height - paddings.top - paddings.bottom
		};
		componentElement.style.width = containerDimensions.width + 'px';
		componentElement.style.height = containerDimensions.height + 'px';
		containerElement.style.width = containerDimensions.width + 'px';
		containerElement.style.height = containerDimensions.height + 'px';

		svgStyle.width = '';
		svgStyle.height = '';
		lastZoomlevel = -1;
		var focalPoint = getCurrentRelativeFocalPoint();
		focalPoint.centered = true;
		calculateMaxZoomLevel();
		self.registerScalableElement({
			'scaledElement': componentElement,
			'gestureElement': componentElement,
			'minWidth': containerElement.offsetWidth,
			'minHeight': containerElement.offsetWidth / aspectRatio,
			'maxWidth': maxZoomWidth,
			'afterStartCallback': scaleStartCallback,
			'preChangeCallback': scaleChangeCallback,
			'endCallback': scaleEndCallback
		});
		if (venueMap.getZoomLevel() > maxZoomLevel) {
			venueMap.setZoomLevel(maxZoomLevel, false);
		} else {
			self.adjustToZoom(false, focalPoint);
			container.adjustZoomControls();
		}
	};
	var getPaddings = function() {
		var style = window.getComputedStyle(componentElement);
		return {
			top: parseFloat(style.paddingTop),
			bottom: parseFloat(style.paddingBottom),
			left: parseFloat(style.paddingLeft),
			right: parseFloat(style.paddingRight),
		};
	};
	this.adjustToZoom = function(withAnimation, newFocalPoint) {
		withAnimation = withAnimation || typeof withAnimation == 'undefined';
		var zoomLevel = venueMap.getZoomLevel();
		if (zoomLevel == lastZoomlevel) {
			return;
		}
		var zoomDiff = Math.abs(lastZoomlevel - zoomLevel);
		if (zoomDiff > 1) {
			// for smoother resizing
			adjustNumberingVisibility(false);
		}
		lastZoomlevel = zoomLevel;
		adjustSectionLabelsVisibility(false);
		var mapWidth = applyZoom(containerDimensions.width, zoomLevel);
		var mapHeight = applyZoom(containerDimensions.height, zoomLevel);

		var top = 0, left = 0;
		if (zoomLevel > 0) {
			var focalPoint = newFocalPoint;
			if (!focalPoint) {
				focalPoint = getCurrentRelativeFocalPoint();
			}
			var scaledPosition = getScaledMapPosition(mapWidth, mapHeight, focalPoint);
			top = scaledPosition.y;
			left = scaledPosition.x;
		}
		if (withAnimation) {
			var animDuration = Math.min(zoomDiff * 150, 800);
			piletilevi.venuemap.Utilities.animate(componentElement, {
				top: top + 'px',
				left: left + 'px',
				width: mapWidth + 'px',
				height: mapHeight + 'px'
			}, animDuration, 'ease-in-out', zoomAdjusted);
		} else {
			componentElement.style.top = top + 'px';
			componentElement.style.left = left + 'px';
			componentElement.style.width = mapWidth + 'px';
			componentElement.style.height = mapHeight + 'px';
			zoomAdjusted();
		}
	};
	var getScaledMapPosition = function(newWidth, newHeight, focalPoint) {
		var top = 0, left = 0;
		if (focalPoint.centered) {
			var concreteFocalPoint = {
				x: newWidth * focalPoint.x,
				y: newHeight * focalPoint.y
			};
			var centerY = containerDimensions.height / 2;
			top = centerY - concreteFocalPoint.y;
			var centerX = containerDimensions.width / 2;
			left = centerX - concreteFocalPoint.x;
		} else {
			var originalX = componentElement.offsetWidth * focalPoint.x;
			var newX = newWidth * focalPoint.x;

			var originalY = componentElement.offsetHeight * focalPoint.y;
			var newY = newHeight * focalPoint.y;
			top = componentElement.offsetTop - (newY - originalY);
			left = componentElement.offsetLeft - (newX - originalX);
		}
		top = Math.min(top, 0);
		top = Math.max(top, containerDimensions.height - newHeight);
		top = Math.round(top);
		left = Math.min(left, 0);
		left = Math.max(left, containerDimensions.width - newWidth);
		left = Math.round(left);
		return {x: left, y: top};
	};
	var getCurrentRelativeFocalPoint = function() {
		return self.getPointRelativeToContainer(
			containerDimensions.width / 2,
			containerDimensions.height / 2
		);
	};
	var zoomAdjusted = function() {
		adjustDetailsDisplaying();
		if (lastZoomlevel > 0) {
			self.enableDragging();
		} else {
			self.disableDragging();
		}
	};
	this.setDisplayed = function(newDisplayed) {
		if (displayed != newDisplayed) {
			displayed = newDisplayed;
			componentElement.style.display = displayed ? '' : 'none';
			if (displayed) {
				self.resize();
			}
		}
	};
	this.getPointRelativeToContainer = function(x, y) {
		return {
			x: (x - componentElement.offsetLeft) / componentElement.offsetWidth,
			y: (y - componentElement.offsetTop) / componentElement.offsetHeight
		};
	};
	this.getComponentElement = function() {
		return componentElement;
	};
	this.getContainerElement = function() {
		return containerElement;
	};
	this.selectSection = function(sectionId) {
		if (!sectionId) {
			venueMap.setZoomLevel(0);
			return;
		}
		var boundary = sectionsBoundaries[sectionId] || null;
		if (!boundary) {
			return;
		}
		var maxZoomLevel = 32;
		var endWidth;
		var endHeight;
		var endZoom = 0;
		var endDimensions;
		var endSvgDimensions;

		for (var testZoom = 0; testZoom <= maxZoomLevel; ++testZoom) {
			var zoomDimensions = {
				width: applyZoom(containerInnerDimensions.width, testZoom),
				height: applyZoom(containerInnerDimensions.height, testZoom)
			};
			var zoomSvgDimensions = getNaturalSvgDimensions({
				width: zoomDimensions.width,
				height: zoomDimensions.height
			});
			var svgZoomRatio = zoomSvgDimensions.width / svgDimensions.width;
			endWidth = svgZoomRatio * boundary.width;
			endHeight = svgZoomRatio * boundary.height;
			if (endWidth > containerInnerDimensions.width
				|| endHeight > containerInnerDimensions.height) {
				break;
			}
			endZoom = testZoom;
			endDimensions = zoomDimensions;
			endSvgDimensions = zoomSvgDimensions;
			var seatRadius = getSeatRadiusByMapWidth(zoomSvgDimensions.width);
			if (seatRadius > sectionZoomSeatRadius) {
				break;
			}
		}
		var nextFocalPoint = null;
		if (endZoom > 0) {
			var boundarySvgPoint = {
				x: (boundary.x + boundary.width / 2) / svgDimensions.width,
				y: (boundary.y + boundary.height / 2) / svgDimensions.height
			};
			nextFocalPoint = {
				x: (endSvgDimensions.width * boundarySvgPoint.x
				+ (endDimensions.width - endSvgDimensions.width) / 2) / endDimensions.width,
				y: (endSvgDimensions.height * boundarySvgPoint.y
				+ (endDimensions.height - endSvgDimensions.height) / 2) / endDimensions.height,
				centered: true
			};
		}
		venueMap.setZoomLevel(endZoom, true, nextFocalPoint);
	};
	this.getSelectedSeats = function() {
		var result = [];
		for (var key in placesIndex) {
			if (placesIndex[key].isSelected()) {
				result.push(placesIndex[key]);
			}
		}
		return result;
	};
	this.selectSeatsInRegion = function(region, exclusions) {
		exclusions = exclusions || {};
		var svgRect = svgElement.getBoundingClientRect();
		var componentRect = componentElement.getBoundingClientRect();
		var svgOffsetTop = svgRect.top - componentRect.top;
		var svgOffsetLeft = svgRect.left - componentRect.left;

		var regionTop = region.top - componentElement.offsetTop;
		var regionLeft = region.left - componentElement.offsetLeft;
		var naturalDimensions = getNaturalSvgDimensions(svgRect);
		var mapSizeDiff = naturalDimensions.width / svgDimensions.width;
		// since SVG has been stretched to fill whole container, but its aspect ratio preserved,
		// its contents have shifted from the element's position in DOM
		var svgContentsOffsetTop = (svgRect.height - naturalDimensions.height) / 2;
		var svgContentsOffsetLeft = (svgRect.width - naturalDimensions.width) / 2;
		svgContentsOffsetTop += svgOffsetTop;
		svgContentsOffsetLeft += svgOffsetLeft;

		for (var key in placesIndex) {
			var place = placesIndex[key];
			var info = place.getSeatInfo();
			if (!place.canBeSelected() || exclusions[info.id]) {
				continue;
			}
			var element = place.getElement();
			var x = element.getAttribute('cx') * mapSizeDiff + svgContentsOffsetLeft;
			var y = element.getAttribute('cy') * mapSizeDiff + svgContentsOffsetTop;
			var outside = x < regionLeft || x > regionLeft + region.width
				|| y < regionTop || y > regionTop + region.height;
			if (place.isSelected() == !outside) {
				continue;
			}
			place.setSelected(!outside);
			place.refreshStatus();
		}
	};
	var adjustDetailsDisplaying = function() {
		var currentSvgDimensions = getNaturalSvgDimensions();
		var currentSeatRadius = getSeatRadiusByMapWidth(currentSvgDimensions.width);
		var showSeats = currentSeatRadius >= seatNumbersRequirement;
		adjustNumberingVisibility(showSeats);

		var showSections = venueMap.getSectionsMapType() == 'full_venue'
			&& !showSeats && currentSeatRadius >= sectionLabelsRequirement;
		if (showSections) {
			var ratio = currentSvgDimensions.width / svgDimensions.width;
			var labelSize = sectionLabelSize / ratio;
			for (var key in sectionLabelElements) {
				var element = sectionLabelElements[key];
				element.setAttribute('font-size', labelSize);
			}
		}
		adjustSectionLabelsVisibility(showSections);
	};
	var getNaturalSvgDimensions = function(dimensions) {
		// SVG has been stretched to fill whole container, this returns
		// dimensions as if only height or width had been stretched
		dimensions = dimensions || svgElement.getBoundingClientRect();
		var result = {
			width: dimensions.width,
			height: dimensions.height
		};
		var dimensionsByRatio = {
			width: result.height * aspectRatio,
			height: result.width / aspectRatio
		};
		var heightReliable = result.width / dimensionsByRatio.width
			> result.height / dimensionsByRatio.height;
		if (heightReliable) {
			result.width = dimensionsByRatio.width;
		} else {
			result.height = dimensionsByRatio.height;
		}
		return result;
	};
	var getSeatRadiusByMapWidth = function(width) {
		var diff = width / svgDimensions.width;
		return Math.round(piletilevi.venuemap.SEAT_CIRCLE_RADIUS * diff);
	};
	var adjustNumberingVisibility = function(visible) {
		if (visible) {
			piletilevi.venuemap.Utilities.addClass(svgElement, 'with_seat_numbers');
		} else {
			piletilevi.venuemap.Utilities.removeClass(svgElement, 'with_seat_numbers');
		}
	};
	var adjustSectionLabelsVisibility = function(visible) {
		if (visible) {
			piletilevi.venuemap.Utilities.addClass(svgElement, 'with_section_labels');
		} else {
			piletilevi.venuemap.Utilities.removeClass(svgElement, 'with_section_labels');
		}
	};
	var applyZoom = function(value, zoomLevel) {
		return value * Math.pow(zoomFactor, zoomLevel);
	};
	init();
};
__ScalableComponent.call(piletilevi.venuemap.PlacesMapCanvas.prototype);
__DraggableComponent.call(piletilevi.venuemap.PlacesMapCanvas.prototype);

piletilevi.venuemap.PlacesMapPlace = function(venueMap, placeElement, textElement) {
	var self = this;
	this.id = false;
	var selected = false;
	var seatInfo = null;
	var selectable = false;
	var inactiveNumbered = false;
	var withText = true;
	var priceClass = null;

	var init = function() {
		inactiveNumbered = venueMap.areInactiveSeatsNumbered();
		self.refreshStatus();
	};
	var mouseMove = function(event) {
		var x = Math.max(0, event.pageX);
		var y = Math.max(0, event.pageY - 2);
		venueMap.getPlaceToolTip().display(seatInfo, selected, x, y);
		if (selectable) {
			self.setColor(venueMap.getSeatColor('hover'))
		}
	};
	var mouseOut = function(event) {
		venueMap.getPlaceToolTip().hide();
		if (selectable) {
			self.refreshStatus();
		}
	};
	var click = function(event) {
		event.preventDefault();
		event.cancelBubble = true;
		if (selectable && seatInfo) {
			if (seatInfo.available && !selected) {
				selected = true;
				self.refreshStatus();
				venueMap.trigger('seatsSelected', [seatInfo.id]);
				venueMap.trigger('seatSelected', seatInfo.id);
			} else if (selected) {
				selected = false;
				self.refreshStatus();
				venueMap.trigger('seatsDeselected', [seatInfo.id]);
				venueMap.trigger('seatUnSelected', seatInfo.id);
			}
		}
	};
	this.refreshStatus = function() {
		var seatColor;
		withText = true;
		if (selected) {
			seatColor = venueMap.getSeatColor('active');
		} else if (priceClass && (seatInfo.available || !selectable)) {
			seatColor = priceClass.color;
		} else {
			seatColor = venueMap.getSeatColor('inactive');
			withText = inactiveNumbered;
		}
		if (textElement) {
			textElement.style.display = withText ? '' : 'none';
		}
		this.setColor(seatColor);
		if (seatInfo) {
			placeElement.addEventListener('mousemove', mouseMove);
			placeElement.addEventListener('mouseout', mouseOut);
		} else {
			placeElement.removeEventListener('mousemove', mouseMove);
			placeElement.removeEventListener('mouseout', mouseOut);
		}
		if (seatInfo && selectable && (selected || seatInfo.available)) {
			touchManager.addEventListener(placeElement, 'start', click, true);
		} else {
			touchManager.removeEventListener(placeElement, 'start', click);
		}
	};
	this.setColor = function(seatColor) {
		if (placeElement) {
			if (selectable) {
				placeElement.setAttribute("style", "cursor:pointer;fill:" + seatColor);
			} else {
				placeElement.setAttribute("style", "fill:" + seatColor);
			}
			if (textElement && withText) {
				if (seatColor == venueMap.getSeatColor('inactive')) {
					textElement.setAttribute('fill', '#000000');
				} else {
					textElement.setAttribute('fill', '#ffffff');
				}
			}
		}
	};
	this.canBeSelected = function() {
		return selectable && seatInfo && seatInfo.available;
	};
	this.setSelectable = function(newSelectable) {
		selectable = !!newSelectable;
	};
	this.isSelectable = function() {
		return selectable;
	};
	this.getSeatInfo = function() {
		return seatInfo;
	};
	this.setSeatInfo = function(newSeatInfo) {
		seatInfo = newSeatInfo;
	};
	this.setPriceClass = function(newPriceClass) {
		priceClass = newPriceClass;
	};
	this.setSelected = function(newSelected) {
		selected = !!newSelected;
	};
	this.isSelected = function() {
		return selected;
	};
	this.getElement = function() {
		return placeElement;
	};
	init();
};

piletilevi.venuemap.PlaceMapLegendItem = function(text, color, extraClass) {
	this.colorElement = false;
	this.titleElement = false;
	this.text = false;
	this.color = false;
	var componentElement;
	var self = this;

	this.init = function() {
		this.text = text;
		this.color = color;
		componentElement = document.createElement('span');
		componentElement.className = 'places_map_legend_item';
		if (extraClass) {
			componentElement.className += ' places_map_legend_item_' + extraClass;
		}
		this.colorElement = document.createElement('span');
		this.colorElement.className = 'places_map_legend_color';
		componentElement.appendChild(this.colorElement);
		this.titleElement = document.createElement('span');
		this.titleElement.className = 'places_map_legend_title';
		componentElement.appendChild(this.titleElement);
		this.refreshContents();
	};
	this.refreshContents = function() {
		var titleText = this.text;
		this.setTextContent(this.titleElement, titleText);
		this.colorElement.style.backgroundColor = this.color;
	};
	this.setTextContent = function(element, text) {
		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}
		var textNode = document.createTextNode(text);
		element.appendChild(textNode);
	};
	this.getComponentElement = function() {
		return componentElement;
	};
	this.init();
};
piletilevi.venuemap.PlacesMapStageLabel = function(venueMap, textElement) {
	var self = this;
	var init = function() {
		var type = self.getText();
		if (type) {
			self.setText(venueMap.getTranslation('stage-' + type));
		}
		if (venueMap.isPlacesMapFlipped()) {
			var x = textElement.getAttribute('x');
			var y = textElement.getAttribute('y');
			textElement.setAttribute('transform', 'rotate(180 ' + x + ' ' + y + ')');
		}
	};
	this.setText = function(newText) {
		if (textElement.String) {
			textElement.String = newText;
		} else {
			while (textElement.firstChild) {
				textElement.removeChild(textElement.firstChild);
			}
			var node = document.createTextNode(newText);
			textElement.appendChild(node);
		}
	};
	this.getText = function() {
		return textElement.textContent || textElement.String;
	};
	init();
};

piletilevi.venuemap.PlaceTooltip = function(venueMap) {
	var self = this;
	var componentElement;
	var sectionElement;
	var sectionTitleElement;
	var row1Element;
	var row2Element;
	var row3Element;
	var row4Element;
	var statusRowElement;
	var popupOffset = 0;

	var createDomElements = function() {
		componentElement = document.createElement('div');
		componentElement.className = 'place_tooltip';
		componentElement.style.display = 'none';
		document.body.appendChild(componentElement);

		var contentElement = document.createElement('div');
		contentElement.className = 'place_tooltip_content';
		componentElement.appendChild(contentElement);

		var tableElement = document.createElement('table');
		contentElement.appendChild(tableElement);
		var tBodyElement = document.createElement('tbody');
		tableElement.appendChild(tBodyElement);

		var rowElement, labelElement;
		sectionElement = document.createElement('tr');
		tBodyElement.appendChild(sectionElement);
		labelElement = document.createElement('td');
		labelElement.className = 'place_tooltip_label';
		labelElement.appendChild(document.createTextNode(venueMap.getTranslation('section')));
		sectionElement.appendChild(labelElement);
		sectionTitleElement = document.createElement('td');
		sectionTitleElement.className = 'place_tooltip_value';
		sectionElement.appendChild(sectionTitleElement);

		rowElement = document.createElement('tr');
		tBodyElement.appendChild(rowElement);
		labelElement = document.createElement('td');
		labelElement.className = 'place_tooltip_label';
		labelElement.appendChild(document.createTextNode(venueMap.getTranslation('row')));
		rowElement.appendChild(labelElement);
		row1Element = document.createElement('td');
		row1Element.className = 'place_tooltip_value';
		rowElement.appendChild(row1Element);

		var rowElement = document.createElement('tr');
		tBodyElement.appendChild(rowElement);
		labelElement = document.createElement('td');
		labelElement.className = 'place_tooltip_label';
		labelElement.appendChild(document.createTextNode(venueMap.getTranslation('place')));
		rowElement.appendChild(labelElement);
		row2Element = document.createElement('td');
		row2Element.className = 'place_tooltip_value';
		rowElement.appendChild(row2Element);

		var rowElement = document.createElement('tr');
		tBodyElement.appendChild(rowElement);
		labelElement = document.createElement('td');
		labelElement.className = 'place_tooltip_label';
		labelElement.appendChild(document.createTextNode(venueMap.getTranslation('price')));
		rowElement.appendChild(labelElement);
		row3Element = document.createElement('td');
		row3Element.className = 'place_tooltip_value';
		rowElement.appendChild(row3Element);

		statusRowElement = document.createElement('tr');
		tBodyElement.appendChild(statusRowElement);
		row4Element = document.createElement('td');
		row4Element.setAttribute('colspan', '2');
		row4Element.className = 'place_tooltip_status';
		statusRowElement.appendChild(row4Element);
	};
	this.clear = function() {
		while (row1Element.firstChild) {
			row1Element.removeChild(row1Element.firstChild);
		}
		while (row2Element.firstChild) {
			row2Element.removeChild(row2Element.firstChild);
		}
		while (row3Element.firstChild) {
			row3Element.removeChild(row3Element.firstChild);
		}
		while (row4Element.firstChild) {
			row4Element.removeChild(row4Element.firstChild);
		}
		while (sectionTitleElement.firstChild) {
			sectionTitleElement.removeChild(sectionTitleElement.firstChild);
		}
	};
	this.display = function(seat, selected, x, y) {
		if (!componentElement) {
			createDomElements();
		}
		self.clear();
		var sectionTitle = '';
		if (venueMap.getSectionsMapType() == 'full_venue') {
			var section = venueMap.getSectionBySeatId(seat.id);
			sectionTitle = section ? section.title : '';
		}
		if (sectionTitle) {
			sectionTitleElement.appendChild(document.createTextNode(sectionTitle));
		}
		sectionElement.style.display = sectionTitle ? '' : 'none';
		if (seat.row) {
			row1Element.appendChild(document.createTextNode(seat.row));
		}
		if (seat.place) {
			row2Element.appendChild(document.createTextNode(seat.place));
		}
		var displayStyle = 'none';
		if (venueMap.isSeatSelectionEnabled()) {
			displayStyle = '';
			var status = 'booked';
			if (selected) {
				status = 'selected';
			} else if (seat.available) {
				status = 'available';
			}
			var text = venueMap.getTranslation(status);
			row4Element.appendChild(document.createTextNode(text));
		}

		if (seat.price && status != 'booked') {
			priceElement.appendChild(document.createTextNode(seat.price));
			priceRowElement.style.display = '';
		} else {
			priceRowElement.style.display = 'none';
		}

		statusRowElement.style.display = displayStyle;
		if (window.innerHeight) {
			var viewPortWidth = window.innerWidth;
			var viewPortHeight = window.innerHeight;
		}
		else {
			var viewPortWidth = document.documentElement.offsetWidth;
			var viewPortHeight = document.documentElement.offsetHeight;
		}
		componentElement.style.left = 0 + 'px';
		componentElement.style.top = 0 + 'px';
		componentElement.style.visibility = 'hidden';
		componentElement.style.display = 'block';
		var popupWidth = componentElement.offsetWidth;
		var popupHeight = componentElement.offsetHeight;
		var leftPosition = x + popupOffset;
		leftPosition -= popupWidth / 2;
		var topPosition = y - popupHeight - popupOffset;
		if (leftPosition + popupWidth + popupOffset >= viewPortWidth) {
			leftPosition = x - popupOffset - popupWidth;
		}
		if (topPosition - popupOffset < 0) {
			topPosition = (y + popupOffset + popupHeight);
		}
		componentElement.style.left = leftPosition + 'px';
		componentElement.style.top = topPosition + 'px';
		componentElement.style.visibility = 'visible';
	};
	this.hide = function() {
		if (componentElement) {
			componentElement.style.display = 'none';
		}
	};
	this.dispose = function() {
		window.removeEventListener('resize', self.resize);

		if (componentElement && componentElement.parentNode) {
			componentElement.parentNode.removeChild(componentElement);
		}
		componentElement = null;
	};
};

piletilevi.venuemap.VenuePlacesMapCanvasFactory = function(venueMap) {
	this.createCanvas = function(options) {
		var data = JSON.parse(JSON.stringify(options.data));
		var relevantSections = options.relevantSections || [];
		var svgElement = piletilevi.venuemap.Utilities.createSvgNode('svg', {
			viewBox: '0 0 ' + data.width + ' ' + data.height,
			width: '100%',
			height: '100%',
		});
		var node;
		var sectionsSeats = {};
		var rowEdges = {};
		var rowEdgeStruct = function() {
			this.firstSeat = null;
			this.lastSeat = null;
		};
		var relevantSeats = [];
		var relevantSectionsIndex = {};
		for (var i = relevantSections.length; i--;) {
			relevantSectionsIndex[relevantSections[i]] = true;
		}
		for (var i = 0; i < data.seats.length; ++i) {
			var seat = data.seats[i];
			var section = seat.section;
			if (!relevantSectionsIndex[section]) {
				continue;
			}
			if (!sectionsSeats[section]) {
				sectionsSeats[section] = [];
			}
			var rowKey = section + '_' + seat.row;
			if (!rowEdges[rowKey]) {
				rowEdges[rowKey] = new rowEdgeStruct();
			}
			var rowEdge = rowEdges[rowKey];
			if (!rowEdge.firstSeat || +rowEdge.firstSeat.place > +seat.place) {
				rowEdge.firstSeat = seat;
			}
			if (!rowEdge.lastSeat || +rowEdge.lastSeat.place < +seat.place) {
				rowEdge.lastSeat = seat;
			}
			sectionsSeats[section].push(seat);
			relevantSeats.push(seat);
		}
		// trim the map
		var mapRegion = calculateSeatsRegion(relevantSeats);
		var paddingX = piletilevi.venuemap.SEAT_CIRCLE_RADIUS * 4;
		var paddingY = piletilevi.venuemap.SEAT_CIRCLE_RADIUS * 2;
		mapRegion.x -= paddingX;
		mapRegion.y -= paddingY;
		mapRegion.width += paddingX * 2;
		mapRegion.height += paddingY * 2;
		if (options.withStage && data.stageType) {
			var textSize = piletilevi.venuemap.Utilities.getSvgTextBBox(venueMap.getTranslation('stage-' + data.stageType), {
				'font-family': 'Arial',
				'font-size': piletilevi.venuemap.STAGE_TEXT_SIZE,
				'font-weight': 'bold',
			});
			var textX = data.stageX - textSize.width / 2;
			var textY = data.stageY - textSize.height / 2;
			if (textX < mapRegion.x) {
				mapRegion.width += mapRegion.x - textX;
				mapRegion.x = textX;
			}
			if (textY < mapRegion.y) {
				mapRegion.height += mapRegion.y - textY;
				mapRegion.y = textY;
			}
			if (mapRegion.width < textX + textSize.width) {
				mapRegion.width = textX + textSize.width;
			}
			if (mapRegion.height < textY + textSize.height) {
				mapRegion.height = textY + textSize.height;
			}
		}
		svgElement.setAttribute('viewBox', '0 0 ' + mapRegion.width + ' ' + mapRegion.height);
		data.stageX -= mapRegion.x;
		data.stageY -= mapRegion.y;
		for (var i = relevantSeats.length; i--;) {
			var seat = relevantSeats[i];
			seat.x -= mapRegion.x;
			seat.y -= mapRegion.y;
		}

		if (options.withStage && data.stageType) {
			node = piletilevi.venuemap.Utilities.createSvgNode('text', {
				id: 'stagename',
				'text-anchor': 'middle',
				x: data.stageX,
				y: data.stageY,
				fill: '#999999',
				'font-family': 'Arial',
				'font-size': piletilevi.venuemap.STAGE_TEXT_SIZE,
				'font-weight': 'bold',
				'dy': '0.3em',
			});
			var textNode = document.createTextNode(data.stageType);
			node.appendChild(textNode);
			svgElement.appendChild(node);
		}
		for (var key in rowEdges) {
			var edge = rowEdges[key];
			if (!edge.firstSeat || !edge.lastSeat) {
				continue;
			}
			svgElement.appendChild(createRowNumberNode(edge.firstSeat, edge.lastSeat));
			svgElement.appendChild(createRowNumberNode(edge.lastSeat, edge.firstSeat));
		}
		for (var i = 0; i < relevantSeats.length; ++i) {
			var seat = relevantSeats[i];
			var section = seat.section;
			var groupNode = piletilevi.venuemap.Utilities.createSvgNode('g', {
				'class': 'place',
				id: 'place_' + seat.code,
				cx: seat.x,
				cy: seat.y,
			});
			svgElement.appendChild(groupNode);
			var node = piletilevi.venuemap.Utilities.createSvgNode('circle', {
				cx: seat.x,
				cy: seat.y,
				r: piletilevi.venuemap.SEAT_CIRCLE_RADIUS
			});
			groupNode.appendChild(node);
			if (seat.place) {
				var attributes = {
					'class': 'place_detail seat_text',
					x: seat.x,
					y: seat.y,
					dy: '0.35em', // center align vertically
					'stroke-width': 0,
					'text-anchor': 'middle',  // center align horizontally
					'font-family': 'Verdana',
					'font-size': 6.9,
				};
				if (venueMap.isPlacesMapFlipped()) {
					attributes['transform'] = 'rotate(180 ' + seat.x
						+ ' ' + seat.y + ')';
				}
				node = piletilevi.venuemap.Utilities.createSvgNode('text', attributes);
				var textNode = document.createTextNode(seat.place);
				node.appendChild(textNode);
				groupNode.appendChild(node);
			}
		}
		var boundaries = {};
		var sectionLabelElements = {};
		for (var sectionId in sectionsSeats) {
			var sectionRegion = calculateSeatsRegion(sectionsSeats[sectionId]);
			if (piletilevi.venuemap.DEBUG_FULL_PLACESMAP_SECTIONS) {
				var node = piletilevi.venuemap.Utilities.createSvgNode('rect', {
					x: sectionRegion.x,
					y: sectionRegion.y,
					width: sectionRegion.width,
					height: sectionRegion.height,
					fill: '#7f52ff',
					'data-section': sectionId,
				});
				svgElement.appendChild(node);
			}
			var node = piletilevi.venuemap.Utilities.createSvgNode('text', {
				'class': 'section_label',
				x: sectionRegion.x + sectionRegion.width / 2,
				y: sectionRegion.y + sectionRegion.height / 2,
				dy: '-0.35em', // center align vertically
				'text-anchor': 'middle',  // center align horizontally
				'font-family': 'Verdana',
				'font-size': 14,
				'fill': '#000000'
			});
			sectionLabelElements[sectionId] = node;
			svgElement.appendChild(node);
			boundaries[sectionId] = sectionRegion;
		}
		var canvas = new piletilevi.venuemap.PlacesMapCanvas(venueMap, svgElement, sectionLabelElements);
		canvas.setSectionsBoundaries(boundaries);
		return canvas;
	};
	var calculateSeatsRegion = function(seats) {
		var topLeft = {
			x: -1,
			y: -1,
		};
		var bottomRight = {
			x: -1,
			y: -1,
		};
		for (var i = 0; i < seats.length; ++i) {
			var seat = seats[i];
			var x = +seat.x;
			var y = +seat.y;
			if (topLeft.x < 0 || x < topLeft.x) {
				topLeft.x = x;
			}
			if (topLeft.y < 0 || y < topLeft.y) {
				topLeft.y = y;
			}
			if (bottomRight.x < 0 || x > bottomRight.x) {
				bottomRight.x = x;
			}
			if (bottomRight.y < 0 || y > bottomRight.y) {
				bottomRight.y = y;
			}
		}
		var seatRadius = piletilevi.venuemap.SEAT_CIRCLE_RADIUS;
		var result = {
			x: topLeft.x - seatRadius,
			y: topLeft.y - seatRadius,
			width: bottomRight.x - topLeft.x + seatRadius * 2,
			height: bottomRight.y - topLeft.y + seatRadius * 2,
		};
		return result;
	};
	var createRowNumberNode = function(seat1, seat2) {
		var alignedLeft = seat1.x <= seat2.x;
		var position = seat1.x;
		if (alignedLeft) {
			position -= piletilevi.venuemap.SEAT_CIRCLE_RADIUS * 2;
		} else {
			position += piletilevi.venuemap.SEAT_CIRCLE_RADIUS * 2;
		}
		var calculateAngle = function(x1, y1, x2, y2) {
			return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
		};
		var angle = Math.round(
			alignedLeft
				? calculateAngle(
				seat1.x,
				seat1.y,
				seat2.x,
				seat2.y
			) : calculateAngle(
				seat2.x,
				seat2.y,
				seat1.x,
				seat1.y
			));
		var transform = 'rotate(' + angle + ',' + seat1.x + ',' + seat1.y + ')';
		var flipped = venueMap.isPlacesMapFlipped();
		if (flipped) {
			transform += ', rotate(180 ' + position + ' ' + seat1.y + ')';
		}
		var anchor = alignedLeft && !flipped || !alignedLeft && flipped
			? 'end' : 'start';
		var node = piletilevi.venuemap.Utilities.createSvgNode('text', {
			'class': 'place_detail',
			x: position,
			y: seat1.y,
			dy: '0.35em', // center align vertically
			'transform': transform,
			'stroke-width': 0,
			'text-anchor': anchor,  // center align horizontally
			'font-family': 'Verdana',
			'font-size': 10,
			'fill': '#999999'
		});
		var textNode = document.createTextNode(seat1.row);
		node.appendChild(textNode);
		return node;
	};
};
