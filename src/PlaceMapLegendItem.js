export default function PlaceMapLegendItem(text, color, extraClass, suffix, imageSrc) {
    let colorElement;
    let titleElement;
    let suffixElement;
    let componentElement;

    const init = function() {
        componentElement = document.createElement('span');
        componentElement.className = 'places_map_legend_item';
        if (extraClass) {
            componentElement.className += ' places_map_legend_item_' + extraClass;
        }
        colorElement = document.createElement('span');
        colorElement.className = 'places_map_legend_color';
        componentElement.appendChild(colorElement);
        titleElement = document.createElement('span');
        titleElement.className = 'places_map_legend_title';
        componentElement.appendChild(titleElement);
        if (suffix) {
            suffixElement = document.createElement('span');
            suffixElement.className = 'places_map_legend_suffix';
            componentElement.appendChild(suffixElement);
        }
        refreshContents();
    };
    const refreshContents = function() {
        titleElement.innerHTML = text;
        if (suffix) {
            suffixElement.innerHTML = suffix;
        }
        if (color) {
            colorElement.style.backgroundColor = color;
        } else if (imageSrc) {
            colorElement.style.backgroundImage = 'url(' + imageSrc + ')';
        }
    };
    this.getComponentElement = function() {
        return componentElement;
    };
    init();
};
