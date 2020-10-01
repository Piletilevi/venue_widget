import touchManager from './TouchManager';

export default function() {
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
            if (typeof parameters.beforeStartCallback === 'function') {
                beforeStartCallback = parameters.beforeStartCallback;
            }
            if (typeof parameters.afterStartCallback === 'function') {
                afterStartCallback = parameters.afterStartCallback;
            }
            if (typeof parameters.afterChangeCallback === 'function') {
                afterChangeCallback = parameters.afterChangeCallback;
            }
            if (typeof parameters.preChangeCallback === 'function') {
                preChangeCallback = parameters.preChangeCallback;
            }
            if (typeof parameters.endCallback === 'function') {
                endCallback = parameters.endCallback;
            }
            if (typeof parameters.speedX !== 'undefined') {
                speedX = parseFloat(parameters.speedX, 10);
            } else {
                speedX = 1;
            }
            if (typeof parameters.speedY !== 'undefined') {
                speedY = parseFloat(parameters.speedY, 10);
            } else {
                speedY = 1;
            }
            if (typeof parameters.minWidth !== 'undefined') {
                minWidth = parseInt(parameters.minWidth, 10);
            }
            if (typeof parameters.minHeight !== 'undefined') {
                minHeight = parseInt(parameters.minHeight, 10);
            }
            if (typeof parameters.maxWidth !== 'undefined') {
                maxWidth = parseInt(parameters.maxWidth, 10);
            }
            if (typeof parameters.maxHeight !== 'undefined') {
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
        if (window.userAgent !== 'Firefox') {
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
            if (scaledElement.tagName.toUpperCase() === 'SVG') {
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

            if ((beforeStartCallback === undefined) || beforeStartCallback(compileInfo())) {
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
            if (scale !== 1) {
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
}