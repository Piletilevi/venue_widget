const __DraggableComponent = function() {
    let draggableElement;
    let parentElement;
    let gestureElement;
    let boundariesElement;

    let boundariesPadding;

    let startElementX;
    let startElementY;
    let currentElementX;
    let currentElementY;

    let startTouchX;
    let startTouchY;
    let currentTouchX;
    let currentTouchY;

    let beforeStartCallback;
    let startCallback;
    let beforeMoveCallback;
    let afterMoveCallback;
    let endCallback;

    const dragTolerance = 2;


    this.registerDraggableElement = function(parameters) {
        if (typeof parameters == 'object') {
            if (parameters.draggableElement !== undefined) {
                draggableElement = parameters.draggableElement;
            }

            if (parameters.parentElement !== undefined) {
                parentElement = parameters.parentElement;
            } else if (draggableElement) {
                parentElement = draggableElement.parentNode;
            }

            if (parameters.gestureElement !== undefined) {
                gestureElement = parameters.gestureElement;
            } else if (draggableElement) {
                gestureElement = draggableElement;
            }

            if (parameters.boundariesElement !== undefined) {
                boundariesElement = parameters.boundariesElement;
            }
            if (parameters.boundariesPadding !== undefined) {
                boundariesPadding = parseFloat(parameters.boundariesPadding);
            } else {
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

    const initDraggableElement = function() {
        removeDraggableElement();
        draggableElement.setAttribute('data-draggable-state', 'draggable');
        touchManager.addEventListener(gestureElement, 'start', startHandler, true);
    };
    const removeDraggableElement = function() {
        draggableElement.removeAttribute('data-draggable-state');
        touchManager.removeEventListener(gestureElement, 'start', startHandler);
        touchManager.removeEventListener(gestureElement, 'move', moveHandler);
        touchManager.removeEventListener(gestureElement, 'cancel', endHandler);
        touchManager.removeEventListener(gestureElement, 'end', endHandler);
    };
    const startHandler = function(eventInfo, touchInfo) {
        if ((typeof touchInfo.touches !== 'undefined') && (touchInfo.touches.length === 1)) {
            draggableElement.setAttribute('data-draggable-state', 'dragging');
            startElementX = draggableElement.offsetLeft;
            startElementY = draggableElement.offsetTop;

            startTouchX = touchInfo.touches[0].pageX;
            startTouchY = touchInfo.touches[0].pageY;

            currentTouchX = startTouchX;
            currentTouchY = startTouchY;

            if ((typeof beforeStartCallback === 'undefined') || beforeStartCallback(compileInfo())) {
                touchManager.addEventListener(gestureElement, 'move', moveHandler, true);
                touchManager.addEventListener(gestureElement, 'end', endHandler, true);
                touchManager.addEventListener(gestureElement, 'cancel', endHandler, true);

                if (startCallback) {
                    startCallback(compileInfo());
                }
            }
        }
    };
    const moveHandler = function(eventInfo, touchInfo) {
        if (touchInfo.touches !== undefined && touchInfo.touches.length == 1) {
            eventInfo.preventDefault();
            currentTouchX = touchInfo.touches[0].pageX;
            currentTouchY = touchInfo.touches[0].pageY;

            currentElementX = startElementX + currentTouchX - startTouchX;
            currentElementY = startElementY + currentTouchY - startTouchY;

            if (boundariesElement) {
                let minX;
                let maxX;
                let minY;
                let maxY;

                if (currentElementX > (minX = boundariesElement.offsetWidth * boundariesPadding)) {
                    currentElementX = minX;
                } else if (currentElementX < (maxX = (boundariesElement.offsetWidth * (1 - boundariesPadding) - draggableElement.offsetWidth))) {
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
    const endHandler = function(eventInfo) {
        if (Math.abs(startTouchX - currentTouchX) > dragTolerance || Math.abs(startTouchY - currentTouchY) > dragTolerance) {
            eventInfo.stopPropagation();
        }
        eventInfo.preventDefault();

        draggableElement.setAttribute('data-draggable-state', 'draggable');
        touchManager.removeEventListener(gestureElement, 'move', moveHandler);
        touchManager.removeEventListener(gestureElement, 'end', endHandler);
        touchManager.removeEventListener(gestureElement, 'cancel', endHandler);

        if (endCallback) {
            endCallback(compileInfo());
        }
    };

    const compileInfo = function() {
        return {
            'draggableElement': draggableElement,
            'parentElement': parentElement,
            'gestureElement': gestureElement,
            'startElementX': startElementX,
            'startElementY': startElementY,
            'currentElementX': currentElementX,
            'currentElementY': currentElementY,

            'startTouchX': startTouchX,
            'startTouchY': startTouchY,
            'currentTouchX': currentTouchX,
            'currentTouchY': currentTouchY
        };
    };
};

const __ScalableComponent = function() {
    let scaledElement;
    let gestureElement;
    let beforeStartCallback;
    let afterStartCallback;
    let afterChangeCallback;
    let preChangeCallback;
    let endCallback;
    let speedX = 1;
    let speedY = 1;
    let minWidth;
    let minHeight;
    let maxWidth;
    let maxHeight;
    let scale;
    let startWidth;
    let startHeight;
    let currentWidth;
    let currentHeight;

    let startF0x;
    let startF0y;
    let startF1x;
    let startF1y;
    let startDistance;

    let f0x;
    let f0y;
    let f1x;
    let f1y;

    this.registerScalableElement = function(parameters) {
        if (typeof parameters == 'object') {
            if (parameters.scaledElement !== undefined) {
                scaledElement = parameters.scaledElement;
            }

            if (parameters.gestureElement !== undefined) {
                gestureElement = parameters.gestureElement;
            } else {
                gestureElement = scaledElement;
            }

            if (parameters.scaledElement !== undefined) {
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
            } else {
                speedX = 1;
            }
            if (typeof parameters.speedY != 'undefined') {
                speedY = parseFloat(parameters.speedY, 10);
            } else {
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
    const initScalableElement = function() {
        removeScalableElement();
        //	0005505: Täissaaliplaani kiirus
        if (window.userAgent != 'Firefox') {
            touchManager.setTouchAction(gestureElement, 'none'); // disable browser-related touch manipulation
        }
        touchManager.addEventListener(gestureElement, 'start', startHandler, true);
    };
    const removeScalableElement = function() {
        touchManager.removeEventListener(gestureElement, 'start', startHandler);
        touchManager.removeEventListener(gestureElement, 'move', moveHandler);
        touchManager.removeEventListener(gestureElement, 'cancel', endHandler);
        touchManager.removeEventListener(gestureElement, 'end', endHandler);
    };
    const startHandler = function(eventInfo, touchInfo) {
        if (typeof touchInfo.touches !== 'undefined' && touchInfo.touches.length > 1) {
            eventInfo.preventDefault();
            scale = 1;
            if (scaledElement.tagName.toUpperCase() == 'SVG') {
                // not all browsers provide offsetWidth/Height for SVGs
                let svgBoxInfo = scaledElement.getBoundingClientRect();
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
                touchManager.addEventListener(gestureElement, 'move', moveHandler, true);
                touchManager.addEventListener(gestureElement, 'end', endHandler, true);
                touchManager.addEventListener(gestureElement, 'cancel', endHandler, true);

                if (afterStartCallback) {
                    afterStartCallback(compileInfo());
                }
            }
        }
    };
    const moveHandler = function(eventInfo, touchInfo) {
        if (typeof touchInfo.touches !== 'undefined' && touchInfo.touches.length > 1) {
            eventInfo.preventDefault();
            f0x = touchInfo.touches[0].pageX;
            f0y = touchInfo.touches[0].pageY;
            f1x = touchInfo.touches[1].pageX;
            f1y = touchInfo.touches[1].pageY;

            const distance = Math.pow(Math.pow(f1x - f0x, 2) + Math.pow(f1y - f0y, 2), 0.5);
            scale = distance / startDistance;
            if (scale != 1) {
                const scaleChange = 1 - scale;
                currentWidth = startWidth - startWidth * scaleChange * speedX;

                if (currentWidth > maxWidth) {
                    currentWidth = maxWidth;
                }
                if (currentWidth < minWidth) {
                    currentWidth = minWidth;
                }

                currentHeight = startHeight - startHeight * scaleChange * speedY;
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
    const endHandler = function(eventInfo, touchInfo) {
        eventInfo.preventDefault();
        eventInfo.stopPropagation();

        //end event can be fired multiple times. we should only remove handlers after all pointers are removed.
        if (typeof touchInfo.touches !== 'undefined' && touchInfo.touches.length === 0) {
            touchManager.removeEventListener(gestureElement, 'move', moveHandler);
            touchManager.removeEventListener(gestureElement, 'end', endHandler);
            touchManager.removeEventListener(gestureElement, 'cancel', endHandler);

            if (endCallback) {
                endCallback(compileInfo());
            }
        }
    };

    const compileInfo = function() {
        return {
            'speedX': speedX,
            'speedY': speedY,
            'minWidth': minWidth,
            'minHeight': minHeight,
            'maxWidth': maxWidth,
            'maxHeight': maxHeight,
            'scale': scale,
            'startWidth': startWidth,
            'startHeight': startHeight,
            'currentWidth': currentWidth,
            'currentHeight': currentHeight,

            'startF0x': startF0x,
            'startF0y': startF0y,
            'startF1x': startF1x,
            'startF1y': startF1y,
            'startDistance': startDistance,

            'f0x': f0x,
            'f0y': f0y,
            'f1x': f1x,
            'f1y': f1y
        };
    };
};

window.touchManager = new function() {
    const self = this;
    let handlers = {};
    let eventsSet;
    let startEventName;
    let moveEventName;
    let endEventName;
    let cancelEventName;
    let pointerCache = {};

    const init = function() {
        handlers['start'] = [];
        handlers['end'] = [];
        handlers['move'] = [];
        handlers['cancel'] = [];
        eventsSet = self.getEventsSet();
        if (eventsSet === 'mouse') {
            captureStartEvent = captureStartEvent_mouse;
            captureEndEvent = captureEndEvent_mouse;
            compileEventInfo = compileEventInfo_mouse;
            startEventName = 'mousedown';
            moveEventName = 'mousemove';
            endEventName = 'mouseup';
            cancelEventName = 'mouseleave';
        } else if (eventsSet === 'touch') {
            compileEventInfo = compileEventInfo_touch;
            startEventName = 'touchstart';
            moveEventName = 'touchmove';
            endEventName = 'touchend';
            cancelEventName = 'touchcancel';
        } else if (eventsSet === 'pointer') {
            compileEventInfo = compileEventInfo_pointer;
            startEventName = 'pointerdown';
            moveEventName = 'pointermove';
            endEventName = 'pointerup';
            cancelEventName = 'pointercancel';
        } else if (eventsSet === 'mspointer') {
            compileEventInfo = compileEventInfo_mouse;
            startEventName = 'mspointerdown';
            moveEventName = 'mspointermove';
            endEventName = 'mspointerup';
            cancelEventName = 'mspointercancel';
        }
        window.addEventListener('load', initDom);
    };
    const initDom = function() {
        switch (eventsSet) {
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
    const getEventsSet_return = function() {
        return eventsSet;
    };
    let captureStartEvent = function(event) {
        fireCallback('start', event);
    };
    const captureStartEvent_mouse = function(event) {
        if (event.button === 0) {
            fireCallback('start', event);
        }
    };
    const captureMoveEvent = function(event) {
        fireCallback('move', event);
    };
    let captureEndEvent = function(event) {
        fireCallback('end', event);
    };
    const captureCancelEvent = function(event) {
        fireCallback('cancel', event);
    };
    const captureEndEvent_mouse = function(event) {
        if (event.button === 0) {
            let eventType = 'end';
            fireCallback(eventType, event);
        }
    };
    const fireCallback = function(eventType, event) {
        const eventInfo = compileEventInfo(event);

        //first gather callbacks, then run them. just in case they modify handlers.
        let callBacks = [];
        for (let i = 0; i < handlers[eventType].length; i++) {
            if (handlers[eventType][i]['element'] === eventInfo['currentTarget']) {
                callBacks.push(handlers[eventType][i]['callback']);
            }
        }
        for (let i = 0; i < callBacks.length; i++) {
            callBacks[i](event, eventInfo);
        }
    };
    let compileEventInfo;
    const compileEventInfo_touch = function(event) {
        let eventInfo = {
            'target': event.target,
            'currentTarget': event.currentTarget,
            'touches': event.touches
        };
        if (typeof event.touches[0] != 'undefined') {
            let firstTouch = event.touches[0];
            eventInfo['clientX'] = firstTouch.clientX;
            eventInfo['clientY'] = firstTouch.clientY;
            eventInfo['pageX'] = firstTouch.pageX;
            eventInfo['pageY'] = firstTouch.pageY;
        }
        return eventInfo;
    };
    const compileEventInfo_pointer = function(event) {
        let touches = [];
        for (let id in pointerCache) {
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
    const compileEventInfo_mouse = function(event) {
        let currentTouchInfo = {
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
    let cachePointerEvent = function(event) {
        if (typeof event.pointerId != 'undefined') {
            pointerCache[event.pointerId] = {
                'clientX': event.clientX,
                'clientY': event.clientY,
                'pageX': event.pageX,
                'pageY': event.pageY,
            };
        }
    };
    const uncachePointerEvent = function(event) {
        if (typeof event.pointerId != 'undefined') {
            if (typeof pointerCache[event.pointerId] !== 'undefined') {
                delete pointerCache[event.pointerId];
            }
        }
    };
    const pointerUp = function(event) {
        uncachePointerEvent(event);
    };
    const pointerDown = function(event) {
        cachePointerEvent(event);
    };
    const pointerMove = function(event) {
        cachePointerEvent(event);
    };
    this.addEventListener = function(element, eventType, callback, useCapture) {
        if (!useCapture) {
            useCapture = false;
        }
        if (typeof handlers[eventType] != 'undefined') {
            let handlerExists = false;

            for (let i = 0; i < handlers[eventType].length; i++) {
                if (handlers[eventType][i]['callback'] === callback && handlers[eventType][i]['element'] === element) {
                    handlerExists = true;
                    break;
                }
            }
            if (!handlerExists) {
                const handlerObject = {};
                handlerObject['callback'] = callback;
                handlerObject['element'] = element;
                handlers[eventType].push(handlerObject);
            }
            if (typeof element !== 'undefined' && typeof callback !== 'undefined') {
                if (eventType === 'start') {
                    element.addEventListener(startEventName, captureStartEvent, useCapture);
                } else if (eventType === 'move') {
                    element.addEventListener(moveEventName, captureMoveEvent, useCapture);
                } else if (eventType === 'end') {
                    element.addEventListener(endEventName, captureEndEvent, useCapture);
                } else if (eventType === 'cancel') {
                    element.addEventListener(cancelEventName, captureCancelEvent, useCapture);
                }
            }
        }
    };
    this.removeEventListener = function(element, eventType, callback) {
        if (typeof handlers[eventType] != 'undefined') {
            for (let i = 0; i < handlers[eventType].length; i++) {
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

let piletilevi = {};

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
    let self = this;
    let animations = [];
    let transitionsAndEvents = {
        'transition': 'transitionend',
        'OTransition': 'oTransitionEnd',
        'MozTransition': 'transitionend',
        'WebkitTransition': 'webkitTransitionEnd'
    };
    let supportedTransition = '';
    let transitionSupportChecked = false;

    const anim = function(element, properties, duration, easeMode, onComplete) {
        let init = function() {
            this.element = element;
            self.checkTransitionSupport();
            if (supportedTransition) {
                let transitions = [];
                for (let key in properties) {
                    transitions.push(key + ' ' + duration + 'ms' + ' ' + (easeMode || 'linear'));
                }
                element.style[supportedTransition] = transitions.join(', ');
            }
            for (let key in properties) {
                element.style[key] = properties[key];
            }
            if (supportedTransition) {
                element.addEventListener(transitionsAndEvents[supportedTransition], transitionend);
            } else if (typeof onComplete == 'function') {
                onComplete();
            }
        };
        let transitionend = function(event) {
            finish();
            element.removeEventListener(transitionsAndEvents[supportedTransition], transitionend);
        };
        let finish = function() {
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
        for (let key in transitionsAndEvents) {
            if (key in document.body.style) {
                supportedTransition = key;
                break;
            }
        }
        transitionSupportChecked = true;
    };
    this.animate = function(element, properties, duration, easeMode, onComplete) {
        for (let i = animations.length; i--;) {
            if (animations[i].element == element) {
                animations[i].cancel();
                animations.splice(i, 1);
            }
        }
        animations.push(new anim(element, properties, duration, easeMode, onComplete));
    };
    this.sendXhr = function(options) {
        let xhr = new XMLHttpRequest();
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
        let result = document.createElementNS('http://www.w3.org/2000/svg', name);
        attributes = attributes || {};
        for (let i in attributes) {
            result.setAttributeNS(null, i, attributes[i]);
        }
        return result;
    };
    this.getSvgTextBBox = function(text, attributes) {
        let svgElement = piletilevi.venuemap.Utilities.createSvgNode('svg');
        let node = piletilevi.venuemap.Utilities.createSvgNode('text', attributes);

        let textNode = document.createTextNode(text);
        node.appendChild(textNode);
        svgElement.appendChild(node);
        document.body.appendChild(svgElement);
        let result = node.getBBox();
        document.body.removeChild(svgElement);
        return result;
    };
    this.addClass = function(element, className) {
        if (element) {
            let elementClassName = element.getAttribute('class') || '';
            if (-1 == elementClassName.indexOf(className)) {
                if (elementClassName == '') {
                    element.setAttribute('class', className);
                } else {
                    element.setAttribute('class', elementClassName + ' ' + className);
                }
            }
        }
    };
    this.removeClass = function(element, className) {
        if (element) {
            let elementClassName = element.getAttribute('class') + '';
            if (-1 != elementClassName.indexOf(className)) {
                if (-1 != elementClassName.indexOf(className + ' ')) {
                    className += ' ';
                } else if (-1 != elementClassName.indexOf(' ' + className)) {
                    className = ' ' + className;
                }
                elementClassName = elementClassName.replace(className, '');
                element.setAttribute('class', elementClassName);
            }
        }
    };
    this.isTransformSupported = function() {
        return 'transform' in document.body.style;
    };
    this.getPosition = function(obj) {
        let curleft = curtop = 0;
        if (obj.offsetParent) {
            do {
                curleft += obj.offsetLeft;
                curtop += obj.offsetTop;
            } while (obj = obj.offsetParent);
        }
        return {'x': curleft, 'y': curtop};
    };
    this.getPageScroll = function() {
        let xScroll, yScroll;
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
        return {'x': xScroll, 'y': yScroll};
    };
    this.createStretchHackElement = function(viewBox) {
        let result = document.createElement('img');
        result.src = 'data:image/svg+xml,%3Csvg viewBox=\'' + viewBox
            + '\' xmlns=\'http://www.w3.org/2000/svg\'/%3E';
        result.style.width = '100%';
        //result.style.height = '100%';
        result.style.maxWidth = '100%';
        result.style.maxHeight = '100%';
        result.style.verticalAlign = 'top';
        return result;
    };
};

piletilevi.venuemap.VenueMap = function() {
    const self = this;
    let shopDomain = piletilevi.venuemap.SHOP_DOMAIN;
    let connectionSecure = false;
    let confId = '';
    let seatSelectionEnabled = false;
    let sectionsMapType = 'vector';
    let currency = '';
    let sectionsMapImageUrl = '';
    let sections = [];
    let enabledSections = [];
    let selectedSeats = [];
    let selectedSeatsIndex = {};
    let eventHandlers = {};
    let sectionsDetails = {};
    let sectionsMap;
    let placesMap;
    let previousSection;
    let activeSection;
    let componentElement;
    let zoomLevel = 0;
    let translations = [];
    let placeToolTip;
    let built = false;
    let displayed = true;
    let inactiveSeatsNumbered = false;
    let lastLoadedVenueConf = 0;
    let lastLoadedVenueSuccessful = false;
    let lastLoadedPlacesConf = 0;
    let lastLoadedPlacesSuccessful = false;
    let withControls = false;
    let extensionHandler;
    let seatsSections = {};
    let requestCache = {};
    let canvasFactory;
    let extended = false;
    let massSelectable = false;
    let placesMapFlipped = false;
    let legendType = 'price';
    let concertId = ''; // temporary solution 0004087
    let loadingOverrides = false; // temporary solution 0004087
    let configOverrides = {}; // temporary solution 0004087
    let zoomLimit = 16; // max seat radius in pixels
    let placesMapData;
    let placesMapAvailableSections = {};
    let fullMapGenerated = false;
    let fixedHeight = 0;
    this.displayMapInPlaces = false;

    const seatColors = {
        'hover': piletilevi.venuemap.DEFAULT_SEAT_HOVER_COLOR,
        'active': piletilevi.venuemap.DEFAULT_SEAT_ACTIVE_COLOR,
        'inactive': piletilevi.venuemap.DEFAULT_SEAT_INACTIVE_COLOR
    };

    const init = function() {
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
    const adjustToZoom = function(withAnimation, focalPoint) {
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
    const loadOverrides = function() {
        // temporary solution 0004087
        loadingOverrides = true;
        self.requestShopData(
            '/public/seatingPlanOverrides',
            function(response) {
                configOverrides = null;
                try {
                    configOverrides = JSON.parse(response);
                } catch (error) {
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
    const loadVenuePlacesMap = function(onSuccess, onFail) {
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
                self.trigger('placesMapLoadSuccess');
                onSuccess();
            },
            function() {
                onFail();
                lastLoadedPlacesSuccessful = false;
                self.trigger('placesMapLoadFailure');
            },
            false
        );

    };
    const receiveVenuePlacesMap = function(response) {
        placesMapData = JSON.parse(response);
        placesMapAvailableSections = {};
        for (let i = 0; i < placesMapData.seats.length; ++i) {
            let seat = placesMapData.seats[i];
            placesMapAvailableSections[seat.section] = true;
        }
    };

    const loadVenueMap = function(onSuccess, onFail) {
        if (lastLoadedVenueConf == confId) {
            if (lastLoadedVenueSuccessful) {
                onSuccess();
            } else {
                onFail();
            }
            return;
        }
        lastLoadedVenueConf = confId;
        if (sectionsMapType === 'image') {
            sectionsMap.createImageElement(sectionsMapImageUrl);
            onSuccess();
        } else {
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

    const receiveVenueMap = function(response) {
        let mapData = response;
        let parser = new DOMParser();
        try {
            let svgDocument = parser.parseFromString(mapData, 'image/svg+xml');
            if (svgDocument && svgDocument.getElementsByTagName('parsererror').length > 0) {
                svgDocument = null;
            }
            if (svgDocument) {
                let elements = svgDocument.getElementsByTagName('image');
                let protocol = connectionSecure ? 'https' : 'http';
                let hrefBase = protocol + '://' + shopDomain;
                for (let i = elements.length; i--;) {
                    elements[i].setAttribute('xlink:href', hrefBase + elements[i].getAttribute('xlink:href'));
                }
                sectionsMap.mapElement = document.adoptNode(svgDocument.documentElement);
                sectionsMap.mapElement.style.verticalAlign = 'top';
                sectionsMap.checkMapElement();
            }
        } catch (e) {
        }
    };

    const adjustZoomControls = function() {
        placesMap.adjustZoomControls();
    };

    const moveSectionsMapToPlaces = function() {
        let sectionsThumbnailElement = placesMap.getSectionsThumbnailElement();
        let sectionsMapElement = sectionsMap.getComponentElement();
        sectionsThumbnailElement.insertBefore(sectionsMapElement, sectionsThumbnailElement.firstChild);
    };

    const moveSectionsMapToSections = function() {
        let sectionsMapElement = sectionsMap.getComponentElement();
        componentElement.appendChild(sectionsMapElement);
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
            let regions = sectionsMap.getMapRegions();
            if (activeSection) {
                if (self.displayMapInPlaces) {
                    sectionsMap.display();
                    moveSectionsMapToPlaces();
                    if (typeof regions[activeSection] !== 'undefined') {
                        regions[activeSection].markActivePermanently();
                        for (let sectionId in regions) {
                            if (sectionId != activeSection) {
                                regions[sectionId].markInactivePermanently();
                            }
                        }
                    }
                } else {
                    sectionsMap.hide();
                }

                placesMap.setDisplayed(true);

                let sectionDetails = self.getSectionDetails(activeSection);
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
                        let canvas = canvasFactory.createCanvas({
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
                if (self.displayMapInPlaces) {
                    moveSectionsMapToSections();
                    for (let sectionId in regions) {
                        regions[sectionId].unLockActive();
                        regions[sectionId].refreshStatus();
                    }
                }
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
                    let canvas = canvasFactory.createCanvas({
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
        for (let i = details.seatsInfo.length; i--;) {
            let seat = details.seatsInfo[i];
            seatsSections[seat.id] = details;
        }
    };
    this.getSectionDetails = function(id) {
        return sectionsDetails[id] || null;
    };
    this.setSelectedSeats = function(newSelectedSeats) {
        selectedSeats = newSelectedSeats;
        for (let i = selectedSeats.length; i--;) {
            selectedSeatsIndex[selectedSeats[i]] = true;
        }
    };
    this.unSetSelectedSeats = function(unSelectedSeats) {
        for (let i = unSelectedSeats.length; i--;) {
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
        for (let type in eventHandlers) {
            if (type != event) {
                continue;
            }
            for (let i = eventHandlers[type].length; i--;) {
                let handler = eventHandlers[type][i];
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
        let dupe = componentElement.cloneNode(false);
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
        let protocol = connectionSecure ? 'https' : 'http';
        let requestDomain = shopDomain;
        if (path.indexOf('seatingPlanOverrides') >= 0) {
            requestDomain = piletilevi.venuemap.SHOP_DOMAIN;
        }
        if (requestDomain == piletilevi.venuemap.SHOP_DOMAIN) {
            // http would get redirected
            protocol = 'https';
        }
        let url = protocol + '://' + requestDomain + path;
        if (withCacheWorkaround) {
            let date = new Date;
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
    this.setCurrency = function(input) {
        currency = input;
    };
    this.getCurrency = function() {
        return currency;
    };
    this.extend = function() {
        if (!extensionHandler) {
            return;
        }
        extended = !extended;
        extensionHandler();
        let extensionClass = 'piletilevi_venue_map_extended';
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
    const self = this;
    let CLASS_ACTIVE = 'piletilevi_venue_map_control_active';
    let buttonElements = {};
    const handlers = {
        extend: function(event) {
            event.preventDefault();
            event.stopPropagation();

            venueMap.extend();
        },
        zoomin: function(event) {
            event.preventDefault();
            event.stopPropagation();
            venueMap.zoomIn();
        },
        zoomout: function(event) {
            event.preventDefault();
            event.stopPropagation();
            venueMap.zoomOut();
        },
        resetzoom: function(event) {
            event.preventDefault();
            event.stopPropagation();
            venueMap.setZoomLevel(0);
        }
    };
    let componentElement;

    const init = function() {
        createDomStructure();
    };
    const createDomStructure = function() {
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
    const createButton = function(type) {
        let buttonElement = document.createElement('div');
        buttonElement.className = 'piletilevi_venue_map_control piletilevi_venue_map_control_' + type;
        componentElement.appendChild(buttonElement);
        buttonElements[type] = buttonElement;
        return buttonElement;
    };
    this.changeStates = function(changes) {
        for (let key in changes) {
            let button = buttonElements[key];
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
};

piletilevi.venuemap.SectionsMap = function(venueMap) {
    let mapRegions = {};
    this.imageElement = false;
    this.mapElement = false;
    this.vectorDocument = false;
    let componentElement;
    let stretchElement;
    const self = this;
    const init = function() {
        componentElement = document.createElement('div');
        componentElement.className = 'piletilevi_venue_map_sections';
    };
    this.update = function() {
        let enabledSectionsIndex = {};
        let enabledSections = venueMap.getEnabledSections();
        for (let i = enabledSections.length; i--;) {
            enabledSectionsIndex[enabledSections[i]] = true;
        }
        for (let key in mapRegions) {
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
        let element = document.createElement('img');
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
            let vectorDocument = self.mapElement;
            self.vectorDocument = vectorDocument;
            parseMapElement();
            self.update();
        }
    };
    const parseMapElement = function() {
        if (self.mapElement && self.vectorDocument) {
            let vectorDocument = self.vectorDocument;

            for (let j = 0; j < vectorDocument.childNodes.length; j++) {
                if (vectorDocument.childNodes[j].id) {
                    let sectionId = vectorDocument.childNodes[j].id.split('section')[1];
                    let sectionVector = vectorDocument.childNodes[j];
                    if (!mapRegions[sectionId]) {
                        let regionObject = new piletilevi.venuemap.SectionsMapRegion(venueMap, self
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
    const self = this;
    let enabled = false;
    let activeLocked = false;
    this.id = false;

    const init = function() {
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
            sectionVector.setAttribute('style', 'display: none;');
        }
    };
    this.markActive = function() {
        if (sectionVector && !activeLocked) {
            sectionVector.setAttribute('fill', '#75bb01');
            sectionVector.setAttribute('opacity', '0.8');
            sectionVector.setAttribute('style', 'display: block;');
        }
    };
    this.markInactive = function() {
        if (sectionVector && !activeLocked) {
            sectionVector.setAttribute('fill', '#cccccc');
            sectionVector.setAttribute('opacity', '0');
            sectionVector.setAttribute('style', 'display: block;');
        }
    };
    this.markActivePermanently = function() {
        self.markActive();
        activeLocked = true;
    };
    this.markInactivePermanently = function() {
        self.markInactive();
        activeLocked = true;
    };
    this.unLockActive = function() {
        activeLocked = false;
        self.markInactive();
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
    const self = this;
    let sectionsThumbnailElement;
    let legendElement;
    let legendItems = [];
    let componentElement, mainElement;
    let canvas;
    let displayed = false;
    let controls;
    let selectionRectangle;
    let details = {};
    let pendingCanvasDetails = [];
    let blockingOverlayElement;
    const RSM_NONE = 0;
    const RSM_WAITING = 1;
    const RSM_IN_PROGRESS = 2;
    let rectangleSelectionMode = RSM_NONE;
    let seatsBeforeRectSelection = {};

    const init = function() {
        createDomStructure();
        //temporary fix 0005272: Täissaaliplaani sektorite kattumine - kiire võimalik lahendus
        if (venueMap.getConfId() != 6964 || window.userAgent != 'Firefox') {
            mainElement.addEventListener('wheel', onWheel);
        }
        if (venueMap.isMassSelectable()) {
            document.addEventListener('keydown', keydown);
        }
    };
    const createDomStructure = function() {
        componentElement = document.createElement('div');
        componentElement.className = 'piletilevi_venue_map_places';
        componentElement.style.display = 'none';

        legendElement = document.createElement('div');
        legendElement.className = 'places_map_legend';
        componentElement.appendChild(legendElement);

        //if(venueMap.displayMapInPlaces) {
        sectionsThumbnailElement = document.createElement('div');
        sectionsThumbnailElement.className = 'places_map_sections_thumbnail';
        componentElement.appendChild(sectionsThumbnailElement);

        let sectionsThumbnailOverflowElement = document.createElement('div');
        sectionsThumbnailOverflowElement.className = 'places_map_sections_thumbnail_overflow';
        sectionsThumbnailElement.appendChild(sectionsThumbnailOverflowElement);
        //}
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
    this.getSectionsThumbnailElement = function() {
        return sectionsThumbnailElement;
    };
    const keydown = function(event) {
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
    const keyup = function(event) {
        if (event.keyCode != 17) // ctrl
        {
            return;
        }
        endRectangleSelection();
    };
    const mousedown = function(event) {
        mainElement.removeEventListener('mousedown', mousedown);
        startRectangleSelection(getCursorOffset(event));
    };
    const mousemove = function(event) {
        selectionRectangle.setOtherPoint(getCursorOffset(event));
        let region = selectionRectangle.getRegion();
        canvas.selectSeatsInRegion(region, seatsBeforeRectSelection);
    };
    const mouseup = function(event) {
        endRectangleSelection();
    };
    const startRectangleSelection = function(cursorOffset) {
        rectangleSelectionMode = RSM_IN_PROGRESS;
        let selectedSeats = canvas.getSelectedSeats();
        seatsBeforeRectSelection = {};
        for (let i = selectedSeats.length; i--;) {
            let info = selectedSeats[i].getSeatInfo();
            if (info) {
                seatsBeforeRectSelection[info.id] = true;
            }
        }
        selectionRectangle = new piletilevi.venuemap.SelectionRectangle(cursorOffset);
        mainElement.appendChild(selectionRectangle.getComponentElement());
        mainElement.addEventListener('mousemove', mousemove);
        mainElement.addEventListener('mouseup', mouseup);
    };
    const endRectangleSelection = function() {
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
            let selectedSeatsIds = [];
            let selectedSeats = canvas.getSelectedSeats();
            for (let i = selectedSeats.length; i--;) {
                let info = selectedSeats[i].getSeatInfo();
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
    const finalizeRectangleSelectionEnding = function() {
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
    const getCursorOffset = function(mouseEvent) {
        let elementOffset = piletilevi.venuemap.Utilities.getPosition(mainElement);
        return {
            top: Math.max(0, mouseEvent.pageY - elementOffset.y),
            left: Math.max(0, mouseEvent.pageX - elementOffset.x)
        };
    };
    const onWheel = function(event) {
        if (event.preventDefault) {
            event.preventDefault();
        }
        event.returnValue = false;
        if (rectangleSelectionMode != RSM_NONE || event.deltaY == 0) {
            return;
        }
        let e = event;
        let rect = mainElement.getBoundingClientRect();
        let x = e.pageX - rect.left - window.pageXOffset;
        let y = e.pageY - rect.top - window.pageYOffset;
        let scrollLocation = canvas.getPointRelativeToContainer(x, y);
        let scrolledUp = event.deltaY < 0;
        let zoom = venueMap.getZoomLevel();
        if (scrolledUp) {
            ++zoom;
        } else {
            --zoom;
        }
        let maxZoomLevel = canvas ? canvas.getMaxZoomLevel() : 0;
        if (zoom >= 0 && zoom <= maxZoomLevel) {
            venueMap.setZoomLevel(zoom, true, scrollLocation);
        }
    };
    const priceFormatter = function(input) {
        return input;
    };
    this.adjustZoomControls = function() {
        if (!controls) {
            return;
        }
        let maxZoom = canvas ? canvas.getMaxZoomLevel() : 0;
        let currentZoom = venueMap.getZoomLevel();
        let states = {
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
        for (let key in details) {
            canvas.updateSectionDetails(details[key]);
        }
        pendingCanvasDetails = [];
        canvas.setDisplayed(displayed);
    };
    this.updateSectionsDetails = function(sectionsDetails) {
        let combinedPriceClasses = [];
        for (let key in sectionsDetails) {
            details[key] = sectionsDetails[key];
            updateCanvasDetails(sectionsDetails[key]);
            let priceClasses = sectionsDetails[key].priceClasses || [];
            combinedPriceClasses = combinedPriceClasses.concat(priceClasses);
        }
        let index = {};
        for (let i = 0; i < combinedPriceClasses.length;) {
            let priceClass = combinedPriceClasses[i];
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
        if (venueMap.displayMapInPlaces) {
            domHelper.addClass(componentElement, 'piletilevi_venue_map_places_with_map');
        }
        if (!newDetails) {
            return;
        }
        details[newDetails.id] = newDetails;
        let priceClasses = newDetails.priceClasses || [];
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
        let style = window.getComputedStyle(legendElement);
        let margins = parseFloat(style.marginTop) + parseFloat(style.marginBottom);
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
    const updateCanvasDetails = function(sectionDetails) {
        if (!canvas) {
            return;
        }
        canvas.updateSectionDetails(sectionDetails);
    };
    const updateLegend = function(priceClasses) {
        let legendItem;
        while (legendElement.firstChild) {
            legendElement.removeChild(legendElement.firstChild);
        }
        let legendType = venueMap.getLegendType();
        let displayed = legendType == 'price' || legendType == 'title';
        legendElement.style.display = displayed ? 'block' : 'none';
        if (!displayed) {
            return;
        }

        let label = venueMap.getTranslation('booked');
        legendItem = new piletilevi.venuemap.PlaceMapLegendItem(label, venueMap.getSeatColor('inactive'), 'booked');
        legendItems.push(legendItem);
        legendElement.appendChild(legendItem.getComponentElement());
        let sorter = legendType == 'price'
            ? function(a, b) {
                return parseFloat(a.price) - parseFloat(b.price);
            }
            : function(a, b) {
                return a.title.localeCompare(b.title);
            };
        priceClasses.sort(sorter);
        for (let i = 0; i < priceClasses.length; i++) {
            if (priceClasses[i][legendType]) {
                legendItem = new piletilevi.venuemap.PlaceMapLegendItem(priceFormatter(priceClasses[i][legendType]), priceClasses[i].color, '', venueMap.getCurrency());
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
    const self = this;
    let otherPoint;
    let style;
    let region;
    let componentElement;

    const init = function() {
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
    const applyRegionStyle = function() {
        for (let key in region) {
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
    const self = this;
    let placesIndex = {};
    let componentElement;
    let displayed = false;
    let aspectRatio;
    let svgDimensions = {
        width: 0,
        height: 0
    };
    let containerElement;
    let boundariesPadding = 0;
    let sectionsBoundaries = {};
    let lastZoomlevel = -1;
    let sectionZoomSeatRadius = 8;
    let seatNumbersRequirement = 7;
    let sectionLabelsRequirement = 2.9;
    let sectionLabelSize = 14;
    let zoomFactor = 1.25;
    let touchScalingPoint;
    let containerDimensions;
    let containerInnerDimensions;
    let maxZoomLevel = 0;
    let maxZoomWidth = 0;
    let container;

    const init = function() {
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
        let viewBox = svgElement.getAttribute('viewBox').split(' ');
        svgDimensions.width = +viewBox[2];
        svgDimensions.height = +viewBox[3];
        aspectRatio = svgDimensions.width / svgDimensions.height;
        let elements = svgElement.querySelectorAll('.place');
        if (!elements.length) {
            elements = svgElement.querySelectorAll('circle');
        }
        for (let i = elements.length; i--;) {
            let element = elements[i];
            let id = element.id;
            if (id.indexOf('place_') == 0) {
                id = id.substring(6);
            }
            if (!id) {
                continue;
            }
            let textElement = element.querySelector('text');
            if (!placesIndex[id]) {
                let placeObject = new piletilevi.venuemap.PlacesMapPlace(venueMap, element, textElement);
                placesIndex[id] = placeObject;
            }
        }
        componentElement.appendChild(svgElement);

        let arrowTextElement;
        if (arrowTextElement = svgElement.getElementById('stagename')) {
            //temporary workaround, no merge needed to main branch
            if (venueMap.getConfId() == 6602) {
                domHelper.addClass(componentElement, 'labels_hidden_important');
            } else if (venueMap.getConfId() == 6527) {
                arrowTextElement.parentNode.style.display = 'none';
            } else {
                new piletilevi.venuemap.PlacesMapStageLabel(venueMap, arrowTextElement);
            }
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
    const scaleStartCallback = function(info) {
        let rect = containerElement.getBoundingClientRect();
        let touchPosition = {
            x: (info.startF0x + info.startF1x) / 2 - rect.left - window.pageXOffset,
            y: (info.startF0y + info.startF1y) / 2 - rect.top - window.pageYOffset
        };
        touchScalingPoint = self.getPointRelativeToContainer(touchPosition.x, touchPosition.y);
        return true;
    };
    const scaleChangeCallback = function(info) {
        let scaledPosition = getScaledMapPosition(info.currentWidth, info.currentHeight, touchScalingPoint);
        componentElement.style.left = scaledPosition.x + 'px';
        componentElement.style.top = scaledPosition.y + 'px';
    };
    const scaleEndCallback = function() {
        lastZoomlevel = calculateZoomLevelFromMapWidth(componentElement.offsetWidth);
        venueMap.setCurrentZoomLevel(lastZoomlevel);
        zoomAdjusted();
    };
    const calculateZoomLevelFromMapWidth = function(zoomedWidth) {
        let scale = zoomedWidth / containerDimensions.width;
        let zoomLevel = Math.round(Math.log(scale) / Math.log(zoomFactor));
        return zoomLevel;
    };
    const calculateMaxZoomLevel = function() {
        let maxSeatRadius = venueMap.getZoomLimit();
        let diff = maxSeatRadius / piletilevi.venuemap.SEAT_CIRCLE_RADIUS;
        maxZoomWidth = svgDimensions.width * diff;
        let paddings = getPaddings();
        maxZoomWidth += paddings.left + paddings.right;
        maxZoomLevel = Math.max(0, calculateZoomLevelFromMapWidth(maxZoomWidth));
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
        let priceClasses = sectionDetails.priceClasses || [];
        let priceClassesIndex = {};
        for (let i = priceClasses.length; i--;) {
            priceClassesIndex[priceClasses[i].id] = priceClasses[i];
        }
        let seatsSelectable = venueMap.isSeatSelectionEnabled() && sectionDetails.selectableSeats;
        let seatsInfo = sectionDetails.seatsInfo || [];
        for (let i = 0; i < seatsInfo.length; i++) {
            let seatInfo = seatsInfo[i];
            if (!placesIndex[seatInfo.id]) {
                continue;
            }
            let placeObject = placesIndex[seatInfo.id];
            placeObject.setSeatInfo(seatInfo);
            let seatPriceClass = priceClassesIndex[seatInfo.priceClass] || null;
            let selectable = seatsSelectable && seatInfo;
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

        let paddings = getPaddings();
        let svgStyle = svgElement.style;
        if (venueMap.getFixedHeight()) {
            containerElement.style.height = venueMap.getFixedHeight() - container.getLegendHeight() + 'px';
        } else {
            let svgWidth, svgHeight;
            svgWidth = componentElement.offsetWidth - paddings.left - paddings.right;
            svgHeight = svgWidth / aspectRatio;

            svgStyle.width = svgWidth + 'px';
            svgStyle.height = svgHeight + 'px';
            let highSvg = componentElement.offsetHeight > containerElement.offsetHeight;
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
        let focalPoint = getCurrentRelativeFocalPoint();
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
    const getPaddings = function() {
        let style = window.getComputedStyle(componentElement);
        return {
            top: parseFloat(style.paddingTop),
            bottom: parseFloat(style.paddingBottom),
            left: parseFloat(style.paddingLeft),
            right: parseFloat(style.paddingRight),
        };
    };
    this.adjustToZoom = function(withAnimation, newFocalPoint) {
        withAnimation = withAnimation || typeof withAnimation == 'undefined';
        let zoomLevel = venueMap.getZoomLevel();
        if (zoomLevel == lastZoomlevel) {
            return;
        }
        let zoomDiff = Math.abs(lastZoomlevel - zoomLevel);
        if (zoomDiff > 1) {
            // for smoother resizing
            adjustNumberingVisibility(false);
        }
        lastZoomlevel = zoomLevel;
        adjustSectionLabelsVisibility(false);
        let mapWidth = applyZoom(containerDimensions.width, zoomLevel);
        let mapHeight = applyZoom(containerDimensions.height, zoomLevel);

        let top = 0, left = 0;
        if (zoomLevel > 0) {
            let focalPoint = newFocalPoint;
            if (!focalPoint) {
                focalPoint = getCurrentRelativeFocalPoint();
            }
            let scaledPosition = getScaledMapPosition(mapWidth, mapHeight, focalPoint);
            top = scaledPosition.y;
            left = scaledPosition.x;
        }
        if (withAnimation) {
            let animDuration = Math.min(zoomDiff * 150, 800);
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
    const getScaledMapPosition = function(newWidth, newHeight, focalPoint) {
        let top = 0, left = 0;
        if (focalPoint.centered) {
            let concreteFocalPoint = {
                x: newWidth * focalPoint.x,
                y: newHeight * focalPoint.y
            };
            let centerY = containerDimensions.height / 2;
            top = centerY - concreteFocalPoint.y;
            let centerX = containerDimensions.width / 2;
            left = centerX - concreteFocalPoint.x;
        } else {
            let originalX = componentElement.offsetWidth * focalPoint.x;
            let newX = newWidth * focalPoint.x;

            let originalY = componentElement.offsetHeight * focalPoint.y;
            let newY = newHeight * focalPoint.y;
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
    const getCurrentRelativeFocalPoint = function() {
        return self.getPointRelativeToContainer(
            containerDimensions.width / 2,
            containerDimensions.height / 2
        );
    };
    const zoomAdjusted = function() {
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
        let boundary = sectionsBoundaries[sectionId] || null;
        if (!boundary) {
            return;
        }
        let maxZoomLevel = 32;
        let endWidth;
        let endHeight;
        let endZoom = 0;
        let endDimensions;
        let endSvgDimensions;

        for (let testZoom = 0; testZoom <= maxZoomLevel; ++testZoom) {
            let zoomDimensions = {
                width: applyZoom(containerInnerDimensions.width, testZoom),
                height: applyZoom(containerInnerDimensions.height, testZoom)
            };
            let zoomSvgDimensions = getNaturalSvgDimensions({
                width: zoomDimensions.width,
                height: zoomDimensions.height
            });
            let svgZoomRatio = zoomSvgDimensions.width / svgDimensions.width;
            endWidth = svgZoomRatio * boundary.width;
            endHeight = svgZoomRatio * boundary.height;
            if (endWidth > containerInnerDimensions.width
                || endHeight > containerInnerDimensions.height) {
                break;
            }
            endZoom = testZoom;
            endDimensions = zoomDimensions;
            endSvgDimensions = zoomSvgDimensions;
            let seatRadius = getSeatRadiusByMapWidth(zoomSvgDimensions.width);
            if (seatRadius > sectionZoomSeatRadius) {
                break;
            }
        }
        let nextFocalPoint = null;
        if (endZoom > 0) {
            let boundarySvgPoint = {
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
        let result = [];
        for (let key in placesIndex) {
            if (placesIndex[key].isSelected()) {
                result.push(placesIndex[key]);
            }
        }
        return result;
    };
    this.selectSeatsInRegion = function(region, exclusions) {
        exclusions = exclusions || {};
        let svgRect = svgElement.getBoundingClientRect();
        let componentRect = componentElement.getBoundingClientRect();
        let svgOffsetTop = svgRect.top - componentRect.top;
        let svgOffsetLeft = svgRect.left - componentRect.left;

        let regionTop = region.top - componentElement.offsetTop;
        let regionLeft = region.left - componentElement.offsetLeft;
        let naturalDimensions = getNaturalSvgDimensions(svgRect);
        let mapSizeDiff = naturalDimensions.width / svgDimensions.width;
        // since SVG has been stretched to fill whole container, but its aspect ratio preserved,
        // its contents have shifted from the element's position in DOM
        let svgContentsOffsetTop = (svgRect.height - naturalDimensions.height) / 2;
        let svgContentsOffsetLeft = (svgRect.width - naturalDimensions.width) / 2;
        svgContentsOffsetTop += svgOffsetTop;
        svgContentsOffsetLeft += svgOffsetLeft;

        for (let key in placesIndex) {
            let place = placesIndex[key];
            let info = place.getSeatInfo();
            if (!place.canBeSelected() || exclusions[info.id]) {
                continue;
            }
            let element = place.getElement();
            let x = element.getAttribute('cx') * mapSizeDiff + svgContentsOffsetLeft;
            let y = element.getAttribute('cy') * mapSizeDiff + svgContentsOffsetTop;
            let outside = x < regionLeft || x > regionLeft + region.width
                || y < regionTop || y > regionTop + region.height;
            if (place.isSelected() == !outside) {
                continue;
            }
            place.setSelected(!outside);
            place.refreshStatus();
        }
    };
    const adjustDetailsDisplaying = function() {
        let currentSvgDimensions = getNaturalSvgDimensions();
        let currentSeatRadius = getSeatRadiusByMapWidth(currentSvgDimensions.width);
        let showSeats = currentSeatRadius >= seatNumbersRequirement;
        adjustNumberingVisibility(showSeats);

        let showSections = venueMap.getSectionsMapType() == 'full_venue'
            && !showSeats && currentSeatRadius >= sectionLabelsRequirement;
        if (showSections) {
            let ratio = currentSvgDimensions.width / svgDimensions.width;
            let labelSize = sectionLabelSize / ratio;
            for (let key in sectionLabelElements) {
                let element = sectionLabelElements[key];
                element.setAttribute('font-size', labelSize);
            }
        }
        adjustSectionLabelsVisibility(showSections);
    };
    const getNaturalSvgDimensions = function(dimensions) {
        // SVG has been stretched to fill whole container, this returns
        // dimensions as if only height or width had been stretched
        dimensions = dimensions || svgElement.getBoundingClientRect();
        let result = {
            width: dimensions.width,
            height: dimensions.height
        };
        let dimensionsByRatio = {
            width: result.height * aspectRatio,
            height: result.width / aspectRatio
        };
        let heightReliable = result.width / dimensionsByRatio.width
            > result.height / dimensionsByRatio.height;
        if (heightReliable) {
            result.width = dimensionsByRatio.width;
        } else {
            result.height = dimensionsByRatio.height;
        }
        return result;
    };
    const getSeatRadiusByMapWidth = function(width) {
        let diff = width / svgDimensions.width;
        return Math.round(piletilevi.venuemap.SEAT_CIRCLE_RADIUS * diff);
    };
    const adjustNumberingVisibility = function(visible) {
        if (visible) {
            piletilevi.venuemap.Utilities.addClass(svgElement, 'with_seat_numbers');
        } else {
            piletilevi.venuemap.Utilities.removeClass(svgElement, 'with_seat_numbers');
        }
    };
    const adjustSectionLabelsVisibility = function(visible) {
        if (visible) {
            piletilevi.venuemap.Utilities.addClass(svgElement, 'with_section_labels');
        } else {
            piletilevi.venuemap.Utilities.removeClass(svgElement, 'with_section_labels');
        }
    };
    const applyZoom = function(value, zoomLevel) {
        return value * Math.pow(zoomFactor, zoomLevel);
    };
    init();
};
__ScalableComponent.call(piletilevi.venuemap.PlacesMapCanvas.prototype);
__DraggableComponent.call(piletilevi.venuemap.PlacesMapCanvas.prototype);

piletilevi.venuemap.PlacesMapPlace = function(venueMap, placeElement, textElement) {
    const self = this;
    this.id = false;
    let seatInfo;
    let selectable = false;
    let inactiveNumbered = false;
    let withText = true;
    let priceClass;
    let status = 0;
    const STATUS_TAKEN = 0;
    const STATUS_AVAILABLE = 1;
    const STATUS_SELECTED = 2;

    const init = function() {
        inactiveNumbered = venueMap.areInactiveSeatsNumbered();
        self.refreshStatus();
    };
    const mouseMove = function(event) {
        const x = Math.max(0, event.pageX);
        const y = Math.max(0, event.pageY - 2);
        venueMap.getPlaceToolTip().display(seatInfo, status, x, y);
        if (selectable) {
            self.setColor(venueMap.getSeatColor('hover'));
        }
    };
    const mouseOut = function() {
        venueMap.getPlaceToolTip().hide();
        if (selectable) {
            self.refreshStatus();
        }
    };
    const pointerEnd = function(event) {
        event.preventDefault();
        if (selectable && seatInfo) {
            if (status == STATUS_AVAILABLE) {
                status = STATUS_SELECTED;
                self.refreshStatus();
                venueMap.trigger('seatsSelected', [seatInfo.id]);
                venueMap.trigger('seatSelected', seatInfo.id);
            } else if (status == STATUS_SELECTED) {
                status = STATUS_AVAILABLE;
                self.refreshStatus();
                venueMap.trigger('seatsDeselected', [seatInfo.id]);
                venueMap.trigger('seatUnSelected', seatInfo.id);
            }
        }
    };
    this.refreshStatus = function() {
        let seatColor;
        withText = true;
        if (status == STATUS_SELECTED) {
            seatColor = venueMap.getSeatColor('active');
        } else if (priceClass && (status == STATUS_AVAILABLE || !selectable)) {
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
        if (seatInfo && selectable && (status == STATUS_AVAILABLE || status == STATUS_SELECTED)) {
            touchManager.addEventListener(placeElement, 'end', pointerEnd);
        } else {
            touchManager.removeEventListener(placeElement, 'end', pointerEnd);
        }
    };
    this.setColor = function(seatColor) {
        if (placeElement) {
            if (selectable) {
                placeElement.setAttribute('style', 'cursor:pointer;fill:' + seatColor);
            } else {
                placeElement.setAttribute('style', 'fill:' + seatColor);
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
        return selectable && seatInfo && (status == STATUS_AVAILABLE
            || status == STATUS_SELECTED);
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
        if (typeof newSeatInfo['status'] == 'undefined') {
            // left for backwards compatibility
            status = +seatInfo['available'] || 0;
        } else {
            status = +seatInfo['status'];
        }
    };
    this.setPriceClass = function(newPriceClass) {
        priceClass = newPriceClass;
    };
    this.setSelected = function(newSelected) {
        switch (status) {
            case STATUS_AVAILABLE:
            case STATUS_SELECTED:
                status = newSelected ? STATUS_SELECTED : STATUS_AVAILABLE;
                break;
        }
    };
    this.isSelected = function() {
        return status == STATUS_SELECTED;
    };
    this.getElement = function() {
        return placeElement;
    };
    init();
};

piletilevi.venuemap.PlaceMapLegendItem = function(text, color, extraClass, suffix) {
    this.colorElement = false;
    this.titleElement = false;
    this.suffixElement = false;
    this.text = false;
    this.color = false;
    let componentElement;
    const self = this;

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
        if (suffix) {
            this.suffixElement = document.createElement('span');
            this.suffixElement.className = 'places_map_legend_suffix';
            componentElement.appendChild(this.suffixElement);
        }
        this.refreshContents();
    };
    this.refreshContents = function() {
        let titleText = this.text;
        this.setTextContent(this.titleElement, titleText);
        if (suffix) {
            this.setTextContent(this.suffixElement, suffix);
        }
        this.colorElement.style.backgroundColor = this.color;
    };
    this.setTextContent = function(element, text) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        let textNode = document.createTextNode(text);
        element.appendChild(textNode);
    };
    this.getComponentElement = function() {
        return componentElement;
    };
    this.init();
};
piletilevi.venuemap.PlacesMapStageLabel = function(venueMap, textElement) {
    const self = this;
    const init = function() {
        let type = self.getText();
        if (type) {
            self.setText(venueMap.getTranslation('stage-' + type));
        }
        if (venueMap.isPlacesMapFlipped()) {
            let x = textElement.getAttribute('x');
            let y = textElement.getAttribute('y');
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
            let node = document.createTextNode(newText);
            textElement.appendChild(node);
        }
    };
    this.getText = function() {
        return textElement.textContent || textElement.String;
    };
    init();
};

piletilevi.venuemap.PlaceTooltip = function(venueMap) {
    const self = this;
    let componentElement;
    let sectionElement;
    let sectionTitleElement;
    let rowRowElement;
    let rowElement;
    let placeRowElement;
    let placeElement;
    let priceElement;
    let statusElement;
    let priceRowElement;
    let statusRowElement;
    let popupOffset = 0;

    const createDomElements = function() {
        componentElement = document.createElement('div');
        componentElement.className = 'place_tooltip';
        componentElement.style.display = 'none';
        document.body.appendChild(componentElement);

        let contentElement = document.createElement('div');
        contentElement.className = 'place_tooltip_content';
        componentElement.appendChild(contentElement);

        let tableElement = document.createElement('table');
        contentElement.appendChild(tableElement);
        let tBodyElement = document.createElement('tbody');
        tableElement.appendChild(tBodyElement);

        let labelElement;
        sectionElement = document.createElement('tr');
        tBodyElement.appendChild(sectionElement);
        labelElement = document.createElement('td');
        labelElement.className = 'place_tooltip_label';
        labelElement.appendChild(document.createTextNode(venueMap.getTranslation('section')));
        sectionElement.appendChild(labelElement);
        sectionTitleElement = document.createElement('td');
        sectionTitleElement.className = 'place_tooltip_value';
        sectionElement.appendChild(sectionTitleElement);

        rowRowElement = document.createElement('tr');
        tBodyElement.appendChild(rowRowElement);
        labelElement = document.createElement('td');
        labelElement.className = 'place_tooltip_label';
        labelElement.appendChild(document.createTextNode(venueMap.getTranslation('row')));
        rowRowElement.appendChild(labelElement);
        rowElement = document.createElement('td');
        rowElement.className = 'place_tooltip_value';
        rowRowElement.appendChild(rowElement);

        placeRowElement = document.createElement('tr');
        tBodyElement.appendChild(placeRowElement);
        labelElement = document.createElement('td');
        labelElement.className = 'place_tooltip_label';
        labelElement.appendChild(document.createTextNode(venueMap.getTranslation('place')));
        placeRowElement.appendChild(labelElement);
        placeElement = document.createElement('td');
        placeElement.className = 'place_tooltip_value';
        placeRowElement.appendChild(placeElement);

        priceRowElement = document.createElement('tr');
        tBodyElement.appendChild(priceRowElement);
        labelElement = document.createElement('td');
        labelElement.className = 'place_tooltip_label';
        labelElement.appendChild(document.createTextNode(venueMap.getTranslation('price')));
        priceRowElement.appendChild(labelElement);
        priceElement = document.createElement('td');
        priceElement.className = 'place_tooltip_value';
        priceRowElement.appendChild(priceElement);

        statusRowElement = document.createElement('tr');
        tBodyElement.appendChild(statusRowElement);
        statusElement = document.createElement('td');
        statusElement.setAttribute('colspan', '2');
        statusElement.className = 'place_tooltip_status';
        statusRowElement.appendChild(statusElement);
    };
    this.clear = function() {
        while (rowElement.firstChild) {
            rowElement.removeChild(rowElement.firstChild);
        }
        while (placeElement.firstChild) {
            placeElement.removeChild(placeElement.firstChild);
        }
        while (priceElement.firstChild) {
            priceElement.removeChild(priceElement.firstChild);
        }
        while (statusElement.firstChild) {
            statusElement.removeChild(statusElement.firstChild);
        }
        while (sectionTitleElement.firstChild) {
            sectionTitleElement.removeChild(sectionTitleElement.firstChild);
        }
        rowRowElement.style.display = 'none';
        placeRowElement.style.display = 'none';
        priceRowElement.style.display = 'none';
        statusRowElement.style.display = 'none';
        sectionElement.style.display = 'none';
    };
    this.display = function(seat, status, x, y) {
        if (!componentElement) {
            createDomElements();
        }
        self.clear();
        let statuses = {
            0: 'booked',
            1: 'available',
            2: 'selected',
            3: 'not_sold'
        };
        let statusCode = statuses[status] || statuses[0];
        let sectionTitle = '';
        if (venueMap.getSectionsMapType() == 'full_venue') {
            let section = venueMap.getSectionBySeatId(seat.id);
            sectionTitle = section ? section.title : '';
        }
        if (sectionTitle) {
            sectionTitleElement.appendChild(document.createTextNode(sectionTitle));
            sectionElement.style.display = '';
        }
        if (statusCode != 'not_sold') {
            if (seat.row) {
                rowElement.appendChild(document.createTextNode(seat.row));
                rowRowElement.style.display = '';
            }
            if (seat.place) {
                placeElement.appendChild(document.createTextNode(seat.place));
                placeRowElement.style.display = '';
            }
        }
        if (venueMap.isSeatSelectionEnabled()) {
            let text = venueMap.getTranslation(statusCode);
            statusElement.appendChild(document.createTextNode(text));
            statusRowElement.style.display = '';
        }

        if (seat.price && statusCode != 'booked' && statusCode != 'not_sold') {
            priceElement.appendChild(document.createTextNode(seat.price));
            priceRowElement.style.display = '';
        }
        if (window.innerHeight) {
            let viewPortWidth = window.innerWidth;
            let viewPortHeight = window.innerHeight;
        } else {
            let viewPortWidth = document.documentElement.offsetWidth;
            let viewPortHeight = document.documentElement.offsetHeight;
        }
        componentElement.style.left = 0 + 'px';
        componentElement.style.top = 0 + 'px';
        componentElement.style.visibility = 'hidden';
        componentElement.style.display = 'block';
        let popupWidth = componentElement.offsetWidth;
        let popupHeight = componentElement.offsetHeight;
        let leftPosition = x + popupOffset;
        leftPosition -= popupWidth / 2;
        let topPosition = y - popupHeight - popupOffset;
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
        let data = JSON.parse(JSON.stringify(options.data));
        let relevantSections = options.relevantSections || [];
        let svgElement = piletilevi.venuemap.Utilities.createSvgNode('svg', {
            viewBox: '0 0 ' + data.width + ' ' + data.height,
            width: '100%',
            height: '100%',
        });
        let node;
        let sectionsSeats = {};
        let rowEdges = {};
        let rowEdgeStruct = function() {
            this.firstSeat = null;
            this.lastSeat = null;
        };
        let relevantSeats = [];
        let relevantSectionsIndex = {};
        for (let i = relevantSections.length; i--;) {
            relevantSectionsIndex[relevantSections[i]] = true;
        }
        for (let i = 0; i < data.seats.length; ++i) {
            let seat = data.seats[i];
            let section = seat.section;
            if (!relevantSectionsIndex[section]) {
                continue;
            }
            if (!sectionsSeats[section]) {
                sectionsSeats[section] = [];
            }
            let rowKey = section + '_' + seat.row;
            if (!rowEdges[rowKey]) {
                rowEdges[rowKey] = new rowEdgeStruct();
            }
            let rowEdge = rowEdges[rowKey];
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
        let mapRegion = calculateSeatsRegion(relevantSeats);
        let paddingX = 0;
        let paddingY = 0;
        let maxAspectRatio = 2.25;
        let minAspectRatio = 0.75;
        if (mapRegion.width / mapRegion.height > maxAspectRatio) {
            // too short
            let newHeight = mapRegion.width / maxAspectRatio;
            paddingY = (newHeight - mapRegion.height) / 2;
        } else if (mapRegion.width / mapRegion.height < minAspectRatio) {
            // too slim
            let newWidth = mapRegion.height * minAspectRatio;
            paddingX = (newWidth - mapRegion.width) / 2;
        }
        let paddingForRowLabels = piletilevi.venuemap.SEAT_CIRCLE_RADIUS * 4.5;
        if (paddingForRowLabels > paddingX || paddingForRowLabels > paddingY) {
            paddingX += paddingForRowLabels;
            paddingY += paddingForRowLabels;
        }
        mapRegion.x -= paddingX;
        mapRegion.y -= paddingY;
        mapRegion.width += paddingX * 2;
        mapRegion.height += paddingY * 2;

        if (options.withStage && data.stageType) {
            let textSize = piletilevi.venuemap.Utilities.getSvgTextBBox(venueMap.getTranslation('stage-' + data.stageType), {
                'font-size': piletilevi.venuemap.STAGE_TEXT_SIZE,
                'font-weight': 'bold',
            });
            let textX = data.stageX - textSize.width / 2;
            let textY = data.stageY - textSize.height / 2;
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
        for (let i = relevantSeats.length; i--;) {
            let seat = relevantSeats[i];
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
                'font-size': piletilevi.venuemap.STAGE_TEXT_SIZE,
                'font-weight': 'bold',
                'dy': '0.3em',
            });
            let textNode = document.createTextNode(data.stageType);
            node.appendChild(textNode);
            svgElement.appendChild(node);
        }
        for (let key in rowEdges) {
            let edge = rowEdges[key];
            if (!edge.firstSeat || !edge.lastSeat) {
                continue;
            }
            svgElement.appendChild(createRowNumberNode(edge.firstSeat, edge.lastSeat));
            svgElement.appendChild(createRowNumberNode(edge.lastSeat, edge.firstSeat));
        }
        for (let i = 0; i < relevantSeats.length; ++i) {
            let seat = relevantSeats[i];
            let section = seat.section;
            let groupNode = piletilevi.venuemap.Utilities.createSvgNode('g', {
                'class': 'place',
                id: 'place_' + seat.code,
                cx: seat.x,
                cy: seat.y,
            });
            svgElement.appendChild(groupNode);
            let node = piletilevi.venuemap.Utilities.createSvgNode('circle', {
                cx: seat.x,
                cy: seat.y,
                r: piletilevi.venuemap.SEAT_CIRCLE_RADIUS
            });
            groupNode.appendChild(node);
            if (seat.place) {
                let attributes = {
                    'class': 'place_detail seat_text',
                    x: seat.x,
                    y: seat.y,
                    dy: '0.35em', // center align vertically
                    'stroke-width': 0,
                    'text-anchor': 'middle',  // center align horizontally
                    'font-size': 6.9,
                };
                if (venueMap.isPlacesMapFlipped()) {
                    attributes['transform'] = 'rotate(180 ' + seat.x
                        + ' ' + seat.y + ')';
                }
                node = piletilevi.venuemap.Utilities.createSvgNode('text', attributes);
                let textNode = document.createTextNode(seat.place);
                node.appendChild(textNode);
                groupNode.appendChild(node);
            }
        }
        let boundaries = {};
        let sectionLabelElements = {};
        for (let sectionId in sectionsSeats) {
            let sectionRegion = calculateSeatsRegion(sectionsSeats[sectionId]);
            if (piletilevi.venuemap.DEBUG_FULL_PLACESMAP_SECTIONS) {
                let node = piletilevi.venuemap.Utilities.createSvgNode('rect', {
                    x: sectionRegion.x,
                    y: sectionRegion.y,
                    width: sectionRegion.width,
                    height: sectionRegion.height,
                    fill: '#7f52ff',
                    'data-section': sectionId,
                });
                svgElement.appendChild(node);
            }
            let node = piletilevi.venuemap.Utilities.createSvgNode('text', {
                'class': 'section_label',
                x: sectionRegion.x + sectionRegion.width / 2,
                y: sectionRegion.y + sectionRegion.height / 2,
                dy: '-0.35em', // center align vertically
                'text-anchor': 'middle',  // center align horizontally
                'font-size': 14,
                'fill': '#000000'
            });
            sectionLabelElements[sectionId] = node;
            svgElement.appendChild(node);
            boundaries[sectionId] = sectionRegion;
        }

        venueMap.displayMapInPlaces = (data.displayMapInPlaces == '1');

        let canvas = new piletilevi.venuemap.PlacesMapCanvas(venueMap, svgElement, sectionLabelElements);
        canvas.setSectionsBoundaries(boundaries);
        return canvas;
    };
    const calculateSeatsRegion = function(seats) {
        let topLeft = {
            x: -1,
            y: -1,
        };
        let bottomRight = {
            x: -1,
            y: -1,
        };
        for (let i = 0; i < seats.length; ++i) {
            let seat = seats[i];
            let x = +seat.x;
            let y = +seat.y;
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
        let seatRadius = piletilevi.venuemap.SEAT_CIRCLE_RADIUS;
        let result = {
            x: topLeft.x - seatRadius,
            y: topLeft.y - seatRadius,
            width: bottomRight.x - topLeft.x + seatRadius * 2,
            height: bottomRight.y - topLeft.y + seatRadius * 2,
        };
        return result;
    };
    const createRowNumberNode = function(seat1, seat2) {
        let alignedLeft = seat1.x <= seat2.x;
        let position = seat1.x;
        if (alignedLeft) {
            position -= piletilevi.venuemap.SEAT_CIRCLE_RADIUS * 2;
        } else {
            position += piletilevi.venuemap.SEAT_CIRCLE_RADIUS * 2;
        }
        let calculateAngle = function(x1, y1, x2, y2) {
            return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        };
        let angle = Math.round(
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
        let transform = 'rotate(' + angle + ',' + seat1.x + ',' + seat1.y + ')';
        let flipped = venueMap.isPlacesMapFlipped();
        if (flipped) {
            transform += ', rotate(180 ' + position + ' ' + seat1.y + ')';
        }
        let anchor = alignedLeft && !flipped || !alignedLeft && flipped
            ? 'end' : 'start';
        let node = piletilevi.venuemap.Utilities.createSvgNode('text', {
            'class': 'place_detail',
            x: position,
            y: seat1.y,
            dy: '0.35em', // center align vertically
            'transform': transform,
            'stroke-width': 0,
            'text-anchor': anchor,  // center align horizontally
            'font-size': 10,
            'fill': '#999999'
        });
        let textNode = document.createTextNode(seat1.row);
        node.appendChild(textNode);
        return node;
    };
};