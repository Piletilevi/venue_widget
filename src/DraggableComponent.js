import touchManager from 'TouchManager'
export default function() {
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

            if (typeof parameters.beforeStartCallback === 'function') {
                beforeStartCallback = parameters.beforeStartCallback;
            }
            if (typeof parameters.startCallback === 'function') {
                startCallback = parameters.startCallback;
            }
            if (typeof parameters.beforeMoveCallback === 'function') {
                beforeMoveCallback = parameters.beforeMoveCallback;
            }
            if (typeof parameters.afterMoveCallback === 'function') {
                afterMoveCallback = parameters.afterMoveCallback;
            }
            if (typeof parameters.endCallback === 'function') {
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
        if (touchInfo.touches !== undefined && touchInfo.touches.length === 1) {
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

            if ((beforeMoveCallback === undefined) || beforeMoveCallback(compileInfo())) {
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
}
