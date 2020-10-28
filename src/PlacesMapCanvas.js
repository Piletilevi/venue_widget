import PlacesMapPlace from './PlacesMapPlace';
import PlacesMapStageLabel from './PlacesMapStageLabel';
import Constants from './Constants';
import Utilities from './Utilities';
import ScalableComponent from './ScalableComponent';
import DraggableComponent from './DraggableComponent';

export default function PlacesMapCanvas(venueMap, svgElement, sectionLabelElements) {
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
        componentElement.style.position = 'absolute';
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
        for (let i = elements.length; i--;) {
            let element = elements[i];
            let id = element.id;
            if (id.indexOf('place_') === 0) {
                id = id.substring(6);
            }
            if (!id) {
                continue;
            }
            if (!placesIndex[id]) {
                placesIndex[id] = new PlacesMapPlace(venueMap, element);
            }
        }
        componentElement.appendChild(svgElement);

        let arrowTextElement;
        if ((arrowTextElement = svgElement.getElementById('stagename'))) {
            new PlacesMapStageLabel(venueMap, arrowTextElement);
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
        return Math.round(Math.log(scale) / Math.log(zoomFactor));
    };
    const calculateMaxZoomLevel = function() {
        let maxSeatRadius = venueMap.getZoomLimit();
        let diff = maxSeatRadius / Constants.SEAT_CIRCLE_RADIUS;
        maxZoomWidth = svgDimensions.width * diff;
        // let paddings = getPaddings();
        // maxZoomWidth += paddings.left + paddings.right;
        maxZoomLevel = Math.max(0, calculateZoomLevelFromMapWidth(maxZoomWidth));
    };
    this.getMaxZoomLevel = function() {
        return maxZoomLevel;
    };
    this.updateSeat = function(seatInfo) {
        if (!placesIndex[seatInfo.id]) {
            return;
        }
        let placeObject = placesIndex[seatInfo.id];
        placeObject.setSeatInfo(seatInfo);
        placeObject.refreshStatus();
    };
    this.updateSection = function(sectionDetails) {
        if (!sectionDetails) {
            return;
        }
        if (sectionLabelElements[sectionDetails.id]) {
            sectionLabelElements[sectionDetails.id].textContent = sectionDetails.title;
        }
        let priceClasses = sectionDetails.priceClasses || [];
        let priceClassesIndex = {};
        for (let i = priceClasses.length; i--;) {
            priceClassesIndex[priceClasses[i].id] = priceClasses[i];
        }
        let seatsManuallySelectable = venueMap.isSeatSelectionEnabled() && sectionDetails.selectableSeats;
        let seatsInfo = sectionDetails.seatsInfo || [];
        for (let i = 0; i < seatsInfo.length; i++) {
            let seatInfo = seatsInfo[i];
            if (!placesIndex[seatInfo.id]) {
                continue;
            }
            let placeObject = placesIndex[seatInfo.id];
            placeObject.setSeatInfo(seatInfo);
            placeObject.setSectionId(sectionDetails.id);
            let seatPriceClass = priceClassesIndex[seatInfo.priceClass] || null;
            let selectable = seatsManuallySelectable && seatInfo;
            placeObject.setPriceClass(seatPriceClass);
            placeObject.setSelected(venueMap.isSeatSelected(seatInfo.id) || seatInfo.status === Constants.STATUS_SELECTED);
            placeObject.allowManuallySelectable(selectable);
            placeObject.allowSeatsStatusDisplaying(venueMap.isSeatsStatusDisplayed());
            placeObject.refreshStatus();
        }
    };
    this.setSectionsBoundaries = function(newSectionsBoundaries) {
        sectionsBoundaries = newSectionsBoundaries;
    };
    this.resize = function() {
        // let svgStyle = svgElement.style;
        // if (venueMap.getFixedHeight()) {
        //     containerElement.style.height = venueMap.getFixedHeight() - container.getLegendHeight() + 'px';
        // }
        containerDimensions = {
            width: containerElement.offsetWidth,
            height: containerElement.offsetHeight
        };
        containerInnerDimensions = {
            width: containerDimensions.width,
            height: containerDimensions.height
        };
        let width = containerDimensions.width;
        let height = width / aspectRatio;
        componentElement.style.width = width + 'px';
        componentElement.style.height = height + 'px';

        containerElement.style.height = height + 'px';
        
        // lastZoomlevel = -1;
        // let focalPoint = getCurrentRelativeFocalPoint();
        // focalPoint.centered = true;
        // calculateMaxZoomLevel();
        // self.registerScalableElement({
        //     'scaledElement': componentElement,
        //     'gestureElement': componentElement,
        //     'minWidth': width,
        //     'minHeight': height,
        //     'maxWidth': maxZoomWidth,
        //     'afterStartCallback': scaleStartCallback,
        //     'preChangeCallback': scaleChangeCallback,
        //     'endCallback': scaleEndCallback
        // });
        // if (venueMap.getZoomLevel() > maxZoomLevel) {
        //     venueMap.setZoomLevel(maxZoomLevel, false);
        // } else {
        //     self.adjustToZoom(false, focalPoint);
        //     container.adjustZoomControls();
        // }
    };
    // const getPaddings = function() {
    //     let style = window.getComputedStyle(componentElement);
    //     return {
    //         top: parseFloat(style.paddingTop),
    //         bottom: parseFloat(style.paddingBottom),
    //         left: parseFloat(style.paddingLeft),
    //         right: parseFloat(style.paddingRight),
    //     };
    // };
    this.adjustToZoom = function(withAnimation, newFocalPoint) {
        withAnimation = withAnimation || typeof withAnimation == 'undefined';
        let zoomLevel = venueMap.getZoomLevel();
        if (zoomLevel === lastZoomlevel) {
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
            Utilities.animate(componentElement, {
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
        let top, left;
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
        if (displayed !== newDisplayed) {
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
            if (place.isSelected() === !outside) {
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

        let showSections = venueMap.getSectionsMapType() === 'full_venue'
            && !showSeats && currentSeatRadius >= sectionLabelsRequirement;
        if (showSections) {
            let ratio = currentSvgDimensions.width / svgDimensions.width;
            let labelSize = sectionLabelSize / ratio;
            for (let key in sectionLabelElements) {
                if (sectionLabelElements.hasOwnProperty(key)) {
                    sectionLabelElements[key].setAttribute('font-size', labelSize);
                }
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
        return Math.round(Constants.SEAT_CIRCLE_RADIUS * diff);
    };
    const adjustNumberingVisibility = function(visible) {
        if (visible) {
            Utilities.addClass(svgElement, 'with_seat_numbers');
        } else {
            Utilities.removeClass(svgElement, 'with_seat_numbers');
        }
    };
    const adjustSectionLabelsVisibility = function(visible) {
        if (visible) {
            Utilities.addClass(svgElement, 'with_section_labels');
        } else {
            Utilities.removeClass(svgElement, 'with_section_labels');
        }
    };
    const applyZoom = function(value, zoomLevel) {
        return value * Math.pow(zoomFactor, zoomLevel);
    };
    this.markSuggestedSeats = function(seats, offsetPlaces) {
        seats.map(function(seat, key) {
            if (key < offsetPlaces || key >= seats.length - offsetPlaces) {
                placesIndex[seat.id].renderBuffered();
            } else {
                placesIndex[seat.id].highlight();
            }
        });
    };
    this.unmarkSuggestedSeats = function(seatIds) {
        seatIds.map(function(seatId) {
            placesIndex[seatId].refreshStatus();
        });
    };
    init();
};
ScalableComponent.call(PlacesMapCanvas.prototype);
DraggableComponent.call(PlacesMapCanvas.prototype);