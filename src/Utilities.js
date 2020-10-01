import Utilities from './Utilities';

export default new function() {
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
                if (properties.hasOwnProperty(key)) {
                    element.style[key] = properties[key];
                }
            }
            if (supportedTransition) {
                element.addEventListener(transitionsAndEvents[supportedTransition], transitionend);
            } else if (typeof onComplete === 'function') {
                onComplete();
            }
        };
        let transitionend = function() {
            finish();
            element.removeEventListener(transitionsAndEvents[supportedTransition], transitionend);
        };
        let finish = function() {
            if (element) {
                element.style[supportedTransition] = '';
            }
            if (typeof onComplete === 'function') {
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
            if (animations[i].element === element) {
                animations[i].cancel();
                animations.splice(i, 1);
            }
        }
        animations.push(new anim(element, properties, duration, easeMode, onComplete));
    };
    this.sendXhr = function(options) {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    options.onSuccess(xhr.responseText);
                } else if (options.onFailure) {
                    options.onFailure();
                }
            }
        };
        xhr.open('GET', options.url, true);
        xhr.send(null);
    };
    this.createSvgNode = function(name, attributes) {
        let result = document.createElementNS('http://www.w3.org/2000/svg', name);
        attributes = attributes || {};
        for (let i in attributes) {
            if (attributes.hasOwnProperty(i)) {
                result.setAttributeNS(null, i, attributes[i]);
            }
        }
        return result;
    };
    this.getSvgTextBBox = function(text, attributes) {
        let svgElement = Utilities.createSvgNode('svg');
        let node = Utilities.createSvgNode('text', attributes);

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
            if (-1 === elementClassName.indexOf(className)) {
                if (elementClassName === '') {
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
            if (-1 !== elementClassName.indexOf(className)) {
                if (-1 !== elementClassName.indexOf(className + ' ')) {
                    className += ' ';
                } else if (-1 !== elementClassName.indexOf(' ' + className)) {
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
        let curleft = 0, curtop = 0;
        if (obj.offsetParent) {
            do {
                curleft += obj.offsetLeft;
                curtop += obj.offsetTop;
            } while ((obj = obj.offsetParent));
        }
        return {'x': curleft, 'y': curtop};
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