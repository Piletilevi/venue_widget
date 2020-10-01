import Utilities from "./Utilities";

export default function(venueMap) {
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
            if (changes.hasOwnProperty(key)) {
                let button = buttonElements[key];
                if (!button) {
                    continue;
                }
                if (changes[key]) {
                    Utilities.addClass(button, CLASS_ACTIVE);
                    button.addEventListener('click', handlers[key], true);
                } else {
                    Utilities.removeClass(button, CLASS_ACTIVE);
                    button.removeEventListener('click', handlers[key], true);
                }
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
