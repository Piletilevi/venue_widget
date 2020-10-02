import Controls from "./Controls";
import Utilities from "./Utilities";
import SelectionRectangle from "./SelectionRectangle";
import PlaceMapLegendItem from "./PlaceMapLegendItem"
import PlacesMapCanvasFactory from "./PlacesMapCanvasFactory";

export default function PlacesMap(venueMap) {
    const self = this;
    let sectionsThumbnailElement;
    let legendElement;
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
        mainElement.addEventListener('wheel', onWheel);

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

        sectionsThumbnailElement = document.createElement('div');
        sectionsThumbnailElement.className = 'places_map_sections_thumbnail';
        componentElement.appendChild(sectionsThumbnailElement);

        let sectionsThumbnailOverflowElement = document.createElement('div');
        sectionsThumbnailOverflowElement.className = 'places_map_sections_thumbnail_overflow';
        sectionsThumbnailElement.appendChild(sectionsThumbnailOverflowElement);

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
            controls = new Controls(venueMap);
            mainElement.appendChild(controls.getComponentElement());
            Utilities.addClass(componentElement, 'piletilevi_venue_map_places_with_controls');
        }
    };
    this.getSectionsThumbnailElement = function() {
        return sectionsThumbnailElement;
    };
    const keydown = function(event) {
        if (event.code !== 17 || !canvas) // ctrl
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
        if (event.code !== 17) // ctrl
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
    const mouseup = function() {
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
        selectionRectangle = new SelectionRectangle(cursorOffset);
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
        if (rectangleSelectionMode === RSM_IN_PROGRESS) {
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
        if (rectangleSelectionMode !== RSM_NONE) {
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
        let elementOffset = Utilities.getPosition(mainElement);
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
        if (rectangleSelectionMode !== RSM_NONE || event.deltaY === 0) {
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
    this.drawNewMap = function(data) {
        if (canvas) {
            canvas.remove();
        }
        let canvasFactory = new PlacesMapCanvasFactory(venueMap);

        canvas = canvasFactory.createCanvas(data);
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
            if (sectionsDetails.hasOwnProperty(key)) {
                details[key] = sectionsDetails[key];
                updateCanvasDetails(sectionsDetails[key]);
                let priceClasses = sectionsDetails[key].priceClasses || [];
                combinedPriceClasses = combinedPriceClasses.concat(priceClasses);
            }
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
            componentElement.classList.add('piletilevi_venue_map_places_with_map');
        }
        if (!newDetails) {
            return;
        }
        details[newDetails.id] = newDetails;
        let priceClasses = newDetails.priceClasses || [];
        updateLegend(priceClasses);
        updateCanvasDetails(newDetails);
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
        if (displayed === newDisplayed) {
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
        let displayed = legendType === 'price' || legendType === 'title';
        legendElement.style.display = displayed ? 'block' : 'none';
        if (!displayed) {
            return;
        }

        let label = venueMap.getTranslation('booked');
        legendItem = new PlaceMapLegendItem(label, venueMap.getSeatColor('inactive'), 'booked');
        legendElement.appendChild(legendItem.getComponentElement());
        let sorter = legendType === 'price'
            ? function(a, b) {
                return parseFloat(a.price) - parseFloat(b.price);
            }
            : function(a, b) {
                return a.title.localeCompare(b.title);
            };
        priceClasses.sort(sorter);
        for (let i = 0; i < priceClasses.length; i++) {
            if (priceClasses[i][legendType]) {
                legendItem = new PlaceMapLegendItem(priceFormatter(priceClasses[i][legendType]), priceClasses[i].color, '', venueMap.getCurrency());
                legendElement.appendChild(legendItem.getComponentElement());
            }
        }
    };
    this.getMainElement = function() {
        return mainElement;
    };
    this.markSuggestedSeats = function(seats) {
        canvas.markSuggestedSeats(seats);
    }
    this.unmarkSuggestedSeats = function(seats) {
        canvas.unmarkSuggestedSeats(seats);
    }
    init();
};