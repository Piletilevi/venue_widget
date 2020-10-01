export default new TouchManager();
const TouchManager = function() {
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
        if (typeof event.touches[0] !== 'undefined') {
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
        if (typeof event.pointerId !== 'undefined') {
            pointerCache[event.pointerId] = {
                'clientX': event.clientX,
                'clientY': event.clientY,
                'pageX': event.pageX,
                'pageY': event.pageY,
            };
        }
    };
    const uncachePointerEvent = function(event) {
        if (typeof event.pointerId !== 'undefined') {
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
        if (typeof handlers[eventType] !== 'undefined') {
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
        if (typeof handlers[eventType] !== 'undefined') {
            for (let i = 0; i < handlers[eventType].length; i++) {
                if (handlers[eventType][i]['callback'] === callback && handlers[eventType][i]['element'] === element) {
                    handlers[eventType][i] = null;
                    handlers[eventType].splice(i, 1);
                }
            }
        }
    };
    this.setTouchAction = function(element, action) {
        if (eventsSet === 'mspointer') {
            // IE10
            element.style.msTouchAction = action;
        } else {
            element.style.touchAction = action;
        }
    };
    init();
}