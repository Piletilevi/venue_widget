export default function(anchorPoint) {
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
            if (region.hasOwnProperty(key)) {
                style[key] = region[key] + 'px';
            }
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