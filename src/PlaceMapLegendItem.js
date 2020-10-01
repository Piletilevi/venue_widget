export default function(text, color, extraClass, suffix) {
    this.colorElement = false;
    this.titleElement = false;
    this.suffixElement = false;
    this.text = false;
    this.color = false;
    let componentElement;

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
