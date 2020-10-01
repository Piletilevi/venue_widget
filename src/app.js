import './style.css';
import DraggableComponent from './DraggableComponent';
import ScalableComponent from './ScalableComponent';
import TouchManager from './TouchManager';
import VenuePlacesMapCanvasFactory from './VenuePlacesMapCanvasFactory';
import Utilities from './Utilities';
import Controls from './Controls';
import PlaceTooltip from './PlaceTooltip';

export default function Piletilevi() {

}


Piletilevi.venuemap = {
    SHOP_DOMAIN: 'shop.piletilevi.ee',
    DEFAULT_SEAT_HOVER_COLOR: '#27272e',
    DEFAULT_SEAT_ACTIVE_COLOR: '#27272e',
    DEFAULT_SEAT_INACTIVE_COLOR: '#d0d0d0',
    SEAT_CIRCLE_RADIUS: 6,
    STAGE_TEXT_SIZE: 20,
    DEBUG_FULL_PLACESMAP_SECTIONS: false,
};

Piletilevi.venuemap.PlacesMapSeatInfo = function(id, row, place, price, available, priceClass) {
    this.id = id;
    this.row = row;
    this.place = place;
    this.price = price;
    this.available = !!available;
    this.priceClass = priceClass;
};

Piletilevi.venuemap.PlacesMapPriceClassInfo = function(id, color, price) {
    this.id = id;
    this.color = color;
    this.price = price;
};

Piletilevi.venuemap.SectionDetails = function(id, selectableSeats, seatsInfo, priceClasses) {
    this.id = id;
    this.selectableSeats = selectableSeats;
    this.seatsInfo = seatsInfo;
    this.priceClasses = priceClasses;
};

Piletilevi.venuemap.VenueMap = function() {
    const self = this;
    let shopDomain = Piletilevi.venuemap.SHOP_DOMAIN;
    let connectionSecure = false;
    let confId = '';
    let seatSelectionEnabled = false;
    let seatsStatusDisplayed = false;
    let seatDraggingEnabled = false;
    let sectionsMapType = 'vector';
    let currency = '';
    let sectionsMapImageUrl = '';
    let sections = [];
    let enabledSections = [];
    let selectedSeats = [];
    let selectedSeatsIndex = {};
    let eventHandlers = {};
    let sectionsDetails = {};
    let sectionsMap;
    let placesMap;
    let previousSection;
    let activeSection;
    let componentElement;
    let zoomLevel = 0;
    let translations = [];
    let placeToolTip;
    let built = false;
    let displayed = true;
    let inactiveSeatsNumbered = false;
    let lastLoadedVenueConf = 0;
    let lastLoadedVenueSuccessful = false;
    let lastLoadedPlacesConf = 0;
    let lastLoadedPlacesSuccessful = false;
    let withControls = false;
    let extensionHandler;
    let seatsSections = {};
    let requestCache = {};
    let canvasFactory;
    let extended = false;
    let massSelectable = false;
    let placesMapFlipped = false;
    let legendType = 'price';
    let concertId = ''; // temporary solution 0004087
    let loadingOverrides = false; // temporary solution 0004087
    let configOverrides = {}; // temporary solution 0004087
    let zoomLimit = 16; // max seat radius in pixels
    let placesMapData;
    let placesMapAvailableSections = {};
    let fullMapGenerated = false;
    let fixedHeight = 0;
    this.displayMapInPlaces = false;

    const seatColors = {
        'hover': Piletilevi.venuemap.DEFAULT_SEAT_HOVER_COLOR,
        'active': Piletilevi.venuemap.DEFAULT_SEAT_ACTIVE_COLOR,
        'inactive': Piletilevi.venuemap.DEFAULT_SEAT_INACTIVE_COLOR
    };

    const init = function() {
        componentElement = document.createElement('div');
        componentElement.className = 'piletilevi_venue_map';
        componentElement.style.display = 'none';
        componentElement.style['-moz-user-select'] = 'none';
        componentElement.style['-ms-user-select'] = 'none';
        componentElement.style['-webkit-user-select'] = 'none';
        componentElement.style.userSelect = 'none';
        canvasFactory = new VenuePlacesMapCanvasFactory(self);
        self.hide();
        window.addEventListener('resize', self.resize);
    };
    const adjustToZoom = function(withAnimation, focalPoint) {
        adjustZoomControls();
        if (activeSection || sectionsMapType === 'full_venue') {
            placesMap.adjustToZoom(withAnimation, focalPoint);
        } else if (sectionsMap) {
            //sectionsMap.position(); // broken
        }
    };
    this.build = function() {
        if (sectionsMapType !== 'full_venue') {
            sectionsMap = new Piletilevi.venuemap.SectionsMap(self);
            componentElement.appendChild(sectionsMap.getComponentElement());
        }
        placesMap = new Piletilevi.venuemap.PlacesMap(self);
        componentElement.appendChild(placesMap.getComponentElement());
        placeToolTip = new PlaceTooltip(self);
        built = true;
        if (concertId) {
            // temporary solution 0004087
            loadOverrides();
        } else {
            self.update();
        }
    };
    const loadOverrides = function() {
        // temporary solution 0004087
        loadingOverrides = true;
        self.requestShopData(
            '/public/seatingPlanOverrides',
            function(response) {
                configOverrides = null;
                try {
                    configOverrides = JSON.parse(response);
                } catch (error) {
                    console.error('Failed parsing config overrides response');
                    return;
                }
                if (typeof configOverrides != 'object') {
                    console.error('Received invalid config overrides response');
                    return;
                }
                loadingOverrides = false;
                self.update();
            },
            function() {
                console.error('Failed loading config overrides');
            }
        );
    };
    const loadVenuePlacesMap = function(onSuccess, onFail) {
        if (lastLoadedPlacesConf === confId) {
            if (lastLoadedPlacesSuccessful) {
                onSuccess();
            } else {
                onFail();
            }
            return;
        }
        lastLoadedPlacesConf = confId;
        self.requestShopData(
            '/public/upload/seatingplan_json/' + confId + '.json',
            function(response) {
                receiveVenuePlacesMap(response);
                lastLoadedPlacesSuccessful = true;
                self.trigger('placesMapLoadSuccess');
                onSuccess();
            },
            function() {
                onFail();
                lastLoadedPlacesSuccessful = false;
                self.trigger('placesMapLoadFailure');
            },
            false
        );

    };
    const receiveVenuePlacesMap = function(response) {
        placesMapData = JSON.parse(response);
        placesMapAvailableSections = {};
        for (let i = 0; i < placesMapData.seats.length; ++i) {
            let seat = placesMapData.seats[i];
            placesMapAvailableSections[seat.section] = true;
        }
    };

    const loadVenueMap = function(onSuccess, onFail) {
        if (lastLoadedVenueConf === confId) {
            if (lastLoadedVenueSuccessful) {
                onSuccess();
            } else {
                onFail();
            }
            return;
        }
        lastLoadedVenueConf = confId;
        if (sectionsMapType === 'image') {
            sectionsMap.createImageElement(sectionsMapImageUrl);
            onSuccess();
        } else {
            self.requestShopData(
                '/public/upload/seatingplan_svg/' + confId + '.svg',
                function(response) {
                    onSuccess();
                    lastLoadedVenueSuccessful = true;
                    receiveVenueMap(response);
                },
                function() {
                    onFail();
                    lastLoadedVenueSuccessful = false;
                    self.trigger('sectionsMapLoadFailure');
                }
            );
        }
    };

    const receiveVenueMap = function(response) {
        let mapData = response;
        let parser = new DOMParser();
        try {
            let svgDocument = parser.parseFromString(mapData, 'image/svg+xml');
            if (svgDocument && svgDocument.getElementsByTagName('parsererror').length > 0) {
                svgDocument = null;
            }
            if (svgDocument) {
                let elements = svgDocument.getElementsByTagName('image');
                let protocol = connectionSecure ? 'https' : 'http';
                let hrefBase = protocol + '://' + shopDomain;
                for (let i = elements.length; i--;) {
                    elements[i].setAttribute('xlink:href', hrefBase + elements[i].getAttribute('xlink:href'));
                }
                sectionsMap.mapElement = document.adoptNode(svgDocument.documentElement);
                sectionsMap.mapElement.style.verticalAlign = 'top';
                sectionsMap.checkMapElement();
            }
        } catch (e) {
        }
    };

    const adjustZoomControls = function() {
        placesMap.adjustZoomControls();
    };

    const moveSectionsMapToPlaces = function() {
        let sectionsThumbnailElement = placesMap.getSectionsThumbnailElement();
        let sectionsMapElement = sectionsMap.getComponentElement();
        sectionsThumbnailElement.insertBefore(sectionsMapElement, sectionsThumbnailElement.firstChild);
    };

    const moveSectionsMapToSections = function() {
        let sectionsMapElement = sectionsMap.getComponentElement();
        componentElement.appendChild(sectionsMapElement);
    };
    this.update = function() {
        if (loadingOverrides) {
            // temporary solution 0004087
            return;
        }
        if (!built) {
            self.build();
            return;
        }
        if (concertId && configOverrides[concertId]) {
            // temporary solution 0004087
            confId = configOverrides[concertId];
        }
        if (sectionsMapType !== 'full_venue') {
            let regions = sectionsMap.getMapRegions();
            if (activeSection) {
                if (self.displayMapInPlaces) {
                    sectionsMap.display();
                    moveSectionsMapToPlaces();
                    if (typeof regions[activeSection] !== 'undefined') {
                        regions[activeSection].markActivePermanently();
                        for (let sectionId in regions) {
                            if (sectionId !== activeSection) {
                                regions[sectionId].markInactivePermanently();
                            }
                        }
                    }
                } else {
                    sectionsMap.hide();
                }

                placesMap.setDisplayed(true);

                let sectionDetails = self.getSectionDetails(activeSection);
                placesMap.updateSectionDetails(sectionDetails);
                if (activeSection === previousSection) {
                    return;
                }
                previousSection = activeSection;
                self.hide();
                self.setCurrentZoomLevel(0);
                loadVenuePlacesMap(
                    function() {
                        if (!placesMapAvailableSections[activeSection]) {
                            self.hide();
                            return;
                        }
                        placesMap.setDisplayed(true);
                        self.display();
                        let canvas = canvasFactory.createCanvas({
                            data: placesMapData,
                            relevantSections: [activeSection]
                        });
                        placesMap.changeCanvas(canvas);
                    },
                    function() {
                        self.hide();
                    }
                );
            } else {
                if (self.displayMapInPlaces) {
                    moveSectionsMapToSections();
                    for (let sectionId in regions) {
                        regions[sectionId].unLockActive();
                        regions[sectionId].refreshStatus();
                    }
                }
                self.setCurrentZoomLevel(0);
                previousSection = 0;
                placesMap.setDisplayed(false);
                sectionsMap.update();
                sectionsMap.display();
                loadVenueMap(
                    function() {
                        self.display();
                    },
                    function() {
                        self.hide();
                    }
                );
            }
        } else {
            placesMap.updateSectionsDetails(sectionsDetails);
            if (fullMapGenerated) {
                return;
            }
            loadVenuePlacesMap(
                function() {
                    placesMap.setDisplayed(true);
                    self.display();
                    let canvas = canvasFactory.createCanvas({
                        data: placesMapData,
                        relevantSections: enabledSections,
                        withStage: true
                    });
                    placesMap.changeCanvas(canvas);
                    fullMapGenerated = true;
                },
                function() {
                    self.hide();
                }
            );
        }
    };
    this.display = function() {
        if (displayed) {
            return;
        }
        componentElement.style.display = '';
        displayed = true;
        self.resize();
        self.trigger('visibilityChange', displayed);
    };
    this.hide = function() {
        if (!displayed) {
            return;
        }
        componentElement.style.display = 'none';
        displayed = false;
        self.trigger('visibilityChange', displayed);
    };
    this.setConfId = function(newConfId) {
        confId = newConfId;
    };
    this.setConcertId = function(newConcertId) {
        // temporary solution 0004087
        concertId = newConcertId;
    };
    this.getConfId = function() {
        return confId;
    };
    this.getZoomLimit = function() {
        return zoomLimit;
    };
    this.setZoomLimit = function(newZoomLimit) {
        zoomLimit = newZoomLimit;
    };
    this.getSectionsMap = function() {
        return sectionsMap;
    };
    this.setSectionsMapType = function(newMapType) {
        sectionsMapType = newMapType;
    };
    this.getSectionsMapType = function() {
        return sectionsMapType;
    };
    this.setSectionsMapImageUrl = function(newMapImageUrl) {
        sectionsMapImageUrl = newMapImageUrl;
    };
    this.getSectionsMapImageUrl = function() {
        return sectionsMapImageUrl;
    };
    this.setSections = function(newSections) {
        sections = newSections;
    };
    this.getSections = function() {
        return sections;
    };
    this.setEnabledSections = function(newEnabledSections) {
        enabledSections = newEnabledSections;
    };
    this.getEnabledSections = function() {
        return enabledSections;
    };
    this.setSeatSelectionEnabled = function(newSeatSelectionEnabled) {
        seatSelectionEnabled = newSeatSelectionEnabled;
    };
    this.setSeatDraggingEnabled = function(newSeatDraggingEnabled) {
        seatDraggingEnabled = newSeatDraggingEnabled;
    };
    this.isSeatDraggingEnabled = function() {
        return seatDraggingEnabled;
    };
    this.isSeatSelectionEnabled = function() {
        return seatSelectionEnabled;
    };
    this.enableSeatsStatusDisplaying = function(newSeatStatusDisplayed) {
        seatsStatusDisplayed = newSeatStatusDisplayed;
    };
    this.isSeatsStatusDisplayed = function() {
        return seatsStatusDisplayed;
    };
    this.addSectionDetails = function(details) {
        sectionsDetails[details.id] = details;
        for (let i = details.seatsInfo.length; i--;) {
            let seat = details.seatsInfo[i];
            seatsSections[seat.id] = details;
        }
    };
    this.getSectionDetails = function(id) {
        return sectionsDetails[id] || null;
    };
    this.setSelectedSeats = function(newSelectedSeats) {
        selectedSeats = newSelectedSeats;
        for (let i = selectedSeats.length; i--;) {
            selectedSeatsIndex[selectedSeats[i]] = true;
        }
    };
    this.unSetSelectedSeats = function(unSelectedSeats) {
        for (let i = unSelectedSeats.length; i--;) {
            selectedSeatsIndex[unSelectedSeats[i]] = false;
        }
    };
    this.unSelectSeat = function(seatId) {
        selectedSeatsIndex[seatId] = false;
    };
    this.setSeatColors = function(newColors) {
        seatColors.hover = newColors.hover || Piletilevi.venuemap.DEFAULT_SEAT_HOVER_COLOR;
        seatColors.active = newColors.active || Piletilevi.venuemap.DEFAULT_SEAT_ACTIVE_COLOR;
        seatColors.inactive = newColors.inactive || Piletilevi.venuemap.DEFAULT_SEAT_INACTIVE_COLOR;
    };
    this.getSeatColor = function(state) {
        return seatColors[state];
    };
    this.isSeatSelected = function(seatId) {
        return selectedSeatsIndex[seatId] || false;
    };
    this.getSectionBySeatId = function(seatId) {
        return seatsSections[seatId] || null;
    };
    this.addHandler = function(eventName, callBack) {
        if (typeof eventHandlers[eventName] == 'undefined') {
            eventHandlers[eventName] = [];
        }
        eventHandlers[eventName].push(callBack);
    };
    this.trigger = function(event, param) {
        for (let type in eventHandlers) {
            if (type !== event) {
                continue;
            }
            for (let i = eventHandlers[type].length; i--;) {
                let handler = eventHandlers[type][i];
                handler(param);
            }
            break;
        }
    };
    this.setSelectedSection = function(sectionId) {
        activeSection = sectionId;
        if (placesMap && sectionsMapType === 'full_venue') {
            placesMap.selectSection(sectionId);
        }
    };
    this.setShopDomain = function(newShopDomain) {
        shopDomain = newShopDomain;
    };
    this.setConnectionSecure = function(newConnectionSecure) {
        connectionSecure = newConnectionSecure;
    };
    this.isConnectionSecure = function() {
        return connectionSecure;
    };
    this.getShopDomain = function() {
        return shopDomain;
    };
    this.getSelectedSection = function() {
        return activeSection;
    };
    this.getComponentElement = function() {
        return componentElement;
    };
    this.zoomIn = function() {
        ++zoomLevel;
        adjustToZoom();
    };
    this.zoomOut = function() {
        --zoomLevel >= 0 || (zoomLevel = 0);
        adjustToZoom();
    };
    this.setZoomLevel = function(newZoom, withAnimation, focalPoint) {
        zoomLevel = newZoom;
        adjustToZoom(withAnimation, focalPoint);
    };
    this.setCurrentZoomLevel = function(currentZoom) {
        zoomLevel = currentZoom;
        adjustZoomControls();
    };
    this.resize = function() {
        let dupe = componentElement.cloneNode(false);
        dupe.style.visibility = 'hidden';
        dupe.style.display = 'block';
        componentElement.parentNode.appendChild(dupe);
        fixedHeight = dupe.offsetHeight;
        componentElement.parentNode.removeChild(dupe);
        if (placesMap) {
            placesMap.resize();
        }
    };
    this.getFixedHeight = function() {
        return fixedHeight;
    };
    this.getZoomLevel = function() {
        return zoomLevel;
    };
    this.addTranslation = function(key, value) {
        translations[key] = value;
    };
    this.getTranslation = function(key) {
        if (translations[key]) {
            return translations[key];
        } else {
            return key;
        }
    };
    this.getPlaceToolTip = function() {
        return placeToolTip;
    };
    this.requestShopData = function(path, onSuccess, onFail, withCacheWorkaround) {
        if (typeof requestCache[path] !== 'undefined') {
            if (requestCache[path] === false) {
                onFail();
            } else {
                onSuccess(requestCache[path]);
            }
            return;
        }
        let protocol = connectionSecure ? 'https' : 'http';
        let requestDomain = shopDomain;
        if (path.indexOf('seatingPlanOverrides') >= 0) {
            requestDomain = Piletilevi.venuemap.SHOP_DOMAIN;
        }
        if (requestDomain === Piletilevi.venuemap.SHOP_DOMAIN) {
            // http would get redirected
            protocol = 'https';
        }
        let url = protocol + '://' + requestDomain + path;
        if (withCacheWorkaround) {
            let date = new Date;
            url += '?' + date.getTime();
        }
        Utilities.sendXhr({
            'url': url,
            'onSuccess': function(response) {
                requestCache[path] = response;
                onSuccess(response);
            },
            'onFailure': function() {
                requestCache[path] = false;
                onFail();
            }
        });
    };
    this.areInactiveSeatsNumbered = function() {
        return inactiveSeatsNumbered;
    };
    this.setInactiveSeatsNumbered = function(enabled) {
        inactiveSeatsNumbered = !!enabled;
    };
    this.getWithControls = function() {
        return withControls;
    };
    this.setWithControls = function(enabled) {
        withControls = !!enabled;
    };
    this.getExtensionHandler = function() {
        return extensionHandler;
    };
    this.setExtensionHandler = function(input) {
        extensionHandler = input;
    };
    this.getLegendType = function() {
        return legendType;
    };
    this.setLegendType = function(input) {
        legendType = input;
    };
    this.isMassSelectable = function() {
        return massSelectable;
    };
    this.setMassSelectable = function(input) {
        massSelectable = !!input;
    };
    this.isPlacesMapFlipped = function() {
        return placesMapFlipped;
    };
    this.setPlacesMapFlipped = function(input) {
        placesMapFlipped = input
            && Utilities.isTransformSupported();
    };
    this.setCurrency = function(input) {
        currency = input;
    };
    this.getCurrency = function() {
        return currency;
    };
    this.extend = function() {
        if (!extensionHandler) {
            return;
        }
        extended = !extended;
        extensionHandler();
        let extensionClass = 'piletilevi_venue_map_extended';
        if (extended) {
            Utilities.addClass(componentElement, extensionClass);
        } else {
            Utilities.removeClass(componentElement, extensionClass);
        }
    };
    this.dispose = function() {
        if (componentElement && componentElement.parentNode) {
            componentElement.parentNode.removeChild(componentElement);
        }
        componentElement = null;
        if (placeToolTip) {
            placeToolTip.dispose();
        }
    };

    init();
};
Piletilevi.venuemap.DragTicketsPositioner = function() {
    let nearSeatIndex;
    let stickToIndex;
    const STATUS_AVAILABLE = 1;

    this.findNewSeats = function(nearSeat, selectedSeats, details) {
        let checkedIndexes = null;
        const amount = selectedSeats.length;
        //are some places selected at all
        if (!amount) {
            return false;
        }

        //do we have seats in section?
        if (typeof details.seatsInfo === 'undefined') {
            return false;
        }

        const row = gatherRowSeats(details.seatsInfo, nearSeat);
        //if row has been found
        if (!row) {
            return false;
        }

        checkedIndexes = checkFromStart(nearSeatIndex, row, amount);
        if (!stickToIndex) {
            checkedIndexes = checkFromEnd(nearSeatIndex, row, amount);
        }
        const result = [];
        checkedIndexes.map(function(item, index) {
            result.push(row[index]);
        });

        return result;
    };
    const checkFromStart = function(nearSeatIndex, row, amount) {
        const checkedIndexes = [];
        //take row boundaries into account
        let startIndex = Math.max(nearSeatIndex - amount, 0);
        //start from "left" go to right searching for free places
        for (let seatIndex = startIndex; seatIndex < nearSeatIndex + amount; seatIndex++) {
            //previous place doesnt exist, we should stick to it
            if (typeof row[seatIndex - 1] === 'undefined') {
                stickToIndex = seatIndex;
            } else if (row[seatIndex - 1].status !== STATUS_AVAILABLE) {
                stickToIndex = seatIndex;
            }

            let checkAmount = amount;
            //now check all forward seats to find whether they are all free for taking
            do {
                //if place is not free or doesnt exist
                //then go out and check next chain of seats
                if (typeof row[seatIndex] === 'undefined' || row[seatIndex].status !== STATUS_AVAILABLE) {
                    stickToIndex = false;
                    break;
                }
                checkedIndexes.push(seatIndex);
                seatIndex++;
            } while (--checkAmount);

            //if we found needed chain of free seats from this direction then go out
            if (checkedIndexes.length === amount) {
                break;
            }
        }
        return checkedIndexes;
    };

    const checkFromEnd = function(nearSeatIndex, row, amount) {
        const checkedIndexes = [];
        //take row boundaries into account
        let startIndex = Math.min(nearSeatIndex + amount, row.length - 1);
        //start from "left" go to right searching for free places
        for (let seatIndex = startIndex; seatIndex >= 0; seatIndex--) {
            //previous place doesnt exist, we should stick to it
            if (typeof row[seatIndex + 1] === 'undefined') {
                stickToIndex = seatIndex;
            } else if (row[seatIndex + 1].status !== STATUS_AVAILABLE) {
                stickToIndex = seatIndex;
            }

            let checkAmount = amount;
            //now check all forward seats to find whether they are all free for taking
            do {
                //if place is not free or doesnt exist
                //then go out and check next chain of seats
                if (typeof row[seatIndex] === 'undefined' || row[seatIndex].status !== STATUS_AVAILABLE) {
                    stickToIndex = false;
                    break;
                }
                checkedIndexes.push(seatIndex);
                seatIndex--;
            } while (--checkAmount);

            //if we found needed chain of free seats from this direction then go out
            if (checkedIndexes.length === amount) {
                break;
            }
        }
        return checkedIndexes;
    };
    const gatherRowSeats = function(seatsInfo, nearSeat) {
        const row = [];
        //gather seats from same row into one array
        for (let i = 0; i < seatsInfo.length; i++) {
            let seat = seatsInfo[i];
            if (seat.row === nearSeat.row) {
                if (seat === nearSeat) {
                    nearSeatIndex = row.length;
                }
                row.push(seat);
            }
        }
        return row;
    };
};

Piletilevi.venuemap.SectionsMap = function(venueMap) {
    let mapRegions = {};
    this.imageElement = false;
    this.mapElement = false;
    this.vectorDocument = false;
    let componentElement;
    let stretchElement;
    const self = this;
    const init = function() {
        componentElement = document.createElement('div');
        componentElement.className = 'piletilevi_venue_map_sections';
    };
    this.update = function() {
        let enabledSectionsIndex = {};
        let enabledSections = venueMap.getEnabledSections();
        for (let i = enabledSections.length; i--;) {
            enabledSectionsIndex[enabledSections[i]] = true;
        }
        for (let key in mapRegions) {
            mapRegions[key].setEnabled(key in enabledSectionsIndex);
            mapRegions[key].refreshStatus();
        }
    };
    this.display = function() {
        componentElement.style.display = '';
    };
    this.hide = function() {
        componentElement.style.display = 'none';
    };
    this.createImageElement = function(imageSource) {
        if (self.imageElement) {
            componentElement.removeChild(self.imageElement);
        }
        let element = document.createElement('img');
        element.setAttribute('src', imageSource);
        self.imageElement = element;
        componentElement.appendChild(element);
    };
    this.checkMapElement = function() {
        if (stretchElement) {
            componentElement.removeChild(stretchElement);
        }
        if (self.mapElement) {
            stretchElement = Utilities.createStretchHackElement(self.mapElement.getAttribute('viewBox'));
            componentElement.appendChild(stretchElement);
            componentElement.appendChild(self.mapElement);
            self.vectorDocument = self.mapElement;
            parseMapElement();
            self.update();
        }
    };
    const parseMapElement = function() {
        if (self.mapElement && self.vectorDocument) {
            let vectorDocument = self.vectorDocument;

            for (let j = 0; j < vectorDocument.childNodes.length; j++) {
                if (vectorDocument.childNodes[j].id) {
                    let sectionId = vectorDocument.childNodes[j].id.split('section')[1];
                    let sectionVector = vectorDocument.childNodes[j];
                    if (!mapRegions[sectionId]) {
                        mapRegions[sectionId] = new Piletilevi.venuemap.SectionsMapRegion(venueMap, self
                            , sectionId, sectionVector);
                    }
                }
            }
            self.mapElement.style.visibility = 'visible';
        }
    };
    this.getComponentElement = function() {
        return componentElement;
    };
    this.getMapRegions = function() {
        return mapRegions;
    };
    init();
};

Piletilevi.venuemap.SectionsMapRegion = function(venueMap, sectionsMap, id, sectionVector) {
    const self = this;
    let enabled = false;
    let activeLocked = false;
    this.id = false;

    const init = function() {
        self.id = id;
        sectionVector.addEventListener('click', self.click);
        sectionVector.addEventListener('mouseover', self.mouseOver);
        sectionVector.addEventListener('mouseout', self.mouseOut);
    };
    this.refreshStatus = function() {
        if (!enabled) {
            this.markDisabled();
        } else {
            this.markInactive();
        }
    };
    this.mouseOver = function() {
        self.markActive();
        venueMap.trigger('sectionMouseover', id);
    };
    this.mouseOut = function() {
        self.markInactive();
        venueMap.trigger('sectionMouseout', id);
    };
    this.markDisabled = function() {
        if (sectionVector) {
            sectionVector.setAttribute('style', 'display: none;');
        }
    };
    this.markActive = function() {
        if (sectionVector && !activeLocked) {
            sectionVector.setAttribute('fill', '#75bb01');
            sectionVector.setAttribute('opacity', '0.8');
            sectionVector.setAttribute('style', 'display: block;');
        }
    };
    this.markInactive = function() {
        if (sectionVector && !activeLocked) {
            sectionVector.setAttribute('fill', '#cccccc');
            sectionVector.setAttribute('opacity', '0');
            sectionVector.setAttribute('style', 'display: block;');
        }
    };
    this.markActivePermanently = function() {
        self.markActive();
        activeLocked = true;
    };
    this.markInactivePermanently = function() {
        self.markInactive();
        activeLocked = true;
    };
    this.unLockActive = function() {
        activeLocked = false;
        self.markInactive();
    };
    this.setEnabled = function(input) {
        enabled = !!input;
    };
    this.isEnabled = function() {
        return enabled;
    };
    this.click = function() {
        venueMap.trigger('sectionSelected', id);
    };
    init();
};

Piletilevi.venuemap.PlacesMap = function(venueMap) {
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
        if (event.keyCode !== 17 || !canvas) // ctrl
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
        if (event.keyCode !== 17) // ctrl
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
        selectionRectangle = new Piletilevi.venuemap.SelectionRectangle(cursorOffset);
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
    this.changeCanvas = function(newCanvas) {
        if (canvas) {
            canvas.remove();
        }
        canvas = newCanvas;
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
            domHelper.addClass(componentElement, 'piletilevi_venue_map_places_with_map');
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
        legendItem = new Piletilevi.venuemap.PlaceMapLegendItem(label, venueMap.getSeatColor('inactive'), 'booked');
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
                legendItem = new Piletilevi.venuemap.PlaceMapLegendItem(priceFormatter(priceClasses[i][legendType]), priceClasses[i].color, '', venueMap.getCurrency());
                legendElement.appendChild(legendItem.getComponentElement());
            }
        }
    };
    this.getMainElement = function() {
        return mainElement;
    };
    init();
};

Piletilevi.venuemap.SelectionRectangle = function(anchorPoint) {
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

Piletilevi.venuemap.PlacesMapCanvas = function(venueMap, svgElement, sectionLabelElements) {
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
        componentElement.style.overflow = 'hidden';
        componentElement.style.position = 'relative';
        componentElement.style.textAlign = 'center';
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
        if (!elements.length) {
            elements = svgElement.querySelectorAll('circle');
        }
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
                placesIndex[id] = new Piletilevi.venuemap.PlacesMapPlace(venueMap, element);
            }
        }
        componentElement.appendChild(svgElement);

        let arrowTextElement;
        if (arrowTextElement = svgElement.getElementById('stagename')) {
            new Piletilevi.venuemap.PlacesMapStageLabel(venueMap, arrowTextElement);
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
        let diff = maxSeatRadius / Piletilevi.venuemap.SEAT_CIRCLE_RADIUS;
        maxZoomWidth = svgDimensions.width * diff;
        let paddings = getPaddings();
        maxZoomWidth += paddings.left + paddings.right;
        maxZoomLevel = Math.max(0, calculateZoomLevelFromMapWidth(maxZoomWidth));
    };
    this.getMaxZoomLevel = function() {
        return maxZoomLevel;
    };
    this.updateSectionDetails = function(sectionDetails) {
        if (!sectionDetails) {
            return;
        }
        if (sectionLabelElements[sectionDetails.id]) {
            self.setTextContent(sectionLabelElements[sectionDetails.id], sectionDetails.title);
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
            placeObject.setSelected(venueMap.isSeatSelected(seatInfo.id));
            placeObject.allowManuallySelectable(selectable);
            placeObject.allowSeatsStatusDisplaying(venueMap.isSeatsStatusDisplayed());
            placeObject.refreshStatus();
        }
    };
    this.setTextContent = function(element, text) {
        text = text || '';
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        element.appendChild(document.createTextNode(text));
    };
    this.setSectionsBoundaries = function(newSectionsBoundaries) {
        sectionsBoundaries = newSectionsBoundaries;
    };
    this.resize = function() {
        componentElement.style.width = '';
        componentElement.style.height = '';
        containerElement.style.width = '';
        containerElement.style.height = '';

        let paddings = getPaddings();
        let svgStyle = svgElement.style;
        if (venueMap.getFixedHeight()) {
            containerElement.style.height = venueMap.getFixedHeight() - container.getLegendHeight() + 'px';
        } else {
            let svgWidth, svgHeight;
            svgWidth = componentElement.offsetWidth - paddings.left - paddings.right;
            svgHeight = svgWidth / aspectRatio;

            svgStyle.width = svgWidth + 'px';
            svgStyle.height = svgHeight + 'px';
            let highSvg = componentElement.offsetHeight > containerElement.offsetHeight;
            if (highSvg) {
                // container has limited height
                svgHeight = containerElement.offsetHeight - paddings.top - paddings.bottom;
                svgWidth = svgHeight * aspectRatio;
            }
            svgStyle.width = svgWidth + 'px';
            svgStyle.height = svgHeight + 'px';
        }
        containerDimensions = {
            width: containerElement.offsetWidth,
            height: containerElement.offsetHeight
        };
        containerInnerDimensions = {
            width: containerDimensions.width - paddings.left - paddings.right,
            height: containerDimensions.height - paddings.top - paddings.bottom
        };
        componentElement.style.width = containerDimensions.width + 'px';
        componentElement.style.height = containerDimensions.height + 'px';
        containerElement.style.width = containerDimensions.width + 'px';
        containerElement.style.height = containerDimensions.height + 'px';

        svgStyle.width = '';
        svgStyle.height = '';
        lastZoomlevel = -1;
        let focalPoint = getCurrentRelativeFocalPoint();
        focalPoint.centered = true;
        calculateMaxZoomLevel();
        self.registerScalableElement({
            'scaledElement': componentElement,
            'gestureElement': componentElement,
            'minWidth': containerElement.offsetWidth,
            'minHeight': containerElement.offsetWidth / aspectRatio,
            'maxWidth': maxZoomWidth,
            'afterStartCallback': scaleStartCallback,
            'preChangeCallback': scaleChangeCallback,
            'endCallback': scaleEndCallback
        });
        if (venueMap.getZoomLevel() > maxZoomLevel) {
            venueMap.setZoomLevel(maxZoomLevel, false);
        } else {
            self.adjustToZoom(false, focalPoint);
            container.adjustZoomControls();
        }
    };
    const getPaddings = function() {
        let style = window.getComputedStyle(componentElement);
        return {
            top: parseFloat(style.paddingTop),
            bottom: parseFloat(style.paddingBottom),
            left: parseFloat(style.paddingLeft),
            right: parseFloat(style.paddingRight),
        };
    };
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
    this.getContainerElement = function() {
        return containerElement;
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

    this.dragSeats = function(sectionId, nearSeat) {
        const dragger = new Piletilevi.venuemap.DragTicketsPositioner();
        const details = sectionsDetails[sectionId];
        const seats = dragger.findNewSeats(nearSeat, selectedSeats, details);
        seats.map(function(seat) {
            placesIndex[seat.id].highlight();
        });
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
        return Math.round(Piletilevi.venuemap.SEAT_CIRCLE_RADIUS * diff);
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
    init();
};
ScalableComponent.call(Piletilevi.venuemap.PlacesMapCanvas.prototype);
DraggableComponent.call(Piletilevi.venuemap.PlacesMapCanvas.prototype);

let touchManager = new TouchManager();
Piletilevi.venuemap.PlacesMapPlace = function(venueMap, placeElement) {
    const self = this;
    const STATUS_TAKEN = 0;
    const STATUS_AVAILABLE = 1;
    const STATUS_SELECTED = 2;

    this.id = false;
    let seatInfo;
    let sectionId;
    let manuallySelectable = false;
    let seatsStatusDisplayed = false;
    let inactiveNumbered = false;
    let withText = true;
    let priceClass;
    let status = STATUS_TAKEN;
    let textElement;

    const init = function() {
        textElement = placeElement.querySelector('text');

        inactiveNumbered = venueMap.areInactiveSeatsNumbered();
        self.refreshStatus();
    };
    const mouseMove = function(event) {
        const x = Math.max(0, event.pageX);
        const y = Math.max(0, event.pageY - 2);
        venueMap.getPlaceToolTip().display(seatInfo, status, x, y);
        self.highlight();
    };
    const mouseOut = function() {
        venueMap.getPlaceToolTip().hide();
        if (manuallySelectable) {
            self.refreshStatus();
        }
    };
    const pointerEnd = function(event) {
        event.preventDefault();
        if (manuallySelectable && seatInfo) {
            if (status === STATUS_AVAILABLE) {
                status = STATUS_SELECTED;
                self.refreshStatus();
                venueMap.trigger('seatsSelected', [seatInfo.id]);
                venueMap.trigger('seatSelected', seatInfo.id);
            } else if (status === STATUS_SELECTED) {
                status = STATUS_AVAILABLE;
                self.refreshStatus();
                venueMap.trigger('seatsDeselected', [seatInfo.id]);
                venueMap.trigger('seatUnSelected', seatInfo.id);
            }
        }
    };
    const pointerStart = function(event) {
        event.preventDefault();
        if (seatInfo) {
            venueMap.dragSeats(sectionId, seatInfo);
        }
    };
    this.refreshStatus = function() {
        let seatColor;
        withText = true;
        if (status === STATUS_SELECTED) {
            seatColor = venueMap.getSeatColor('active');
        } else if (priceClass && (status === STATUS_AVAILABLE || !seatsStatusDisplayed)) {
            seatColor = priceClass.color;
        } else {
            seatColor = venueMap.getSeatColor('inactive');
            withText = inactiveNumbered;
        }
        if (textElement) {
            textElement.style.display = withText ? '' : 'none';
        }
        setColor(seatColor);
        if (seatInfo) {
            if (venueMap.isSeatDraggingEnabled()) {
                touchManager.addEventListener(placeElement, 'start', pointerStart);
            }

            placeElement.addEventListener('mousemove', mouseMove);
            placeElement.addEventListener('mouseout', mouseOut);
        } else {
            if (venueMap.isSeatDraggingEnabled()) {
                touchManager.removeEventListener(placeElement, 'start', pointerStart);
            }

            placeElement.removeEventListener('mousemove', mouseMove);
            placeElement.removeEventListener('mouseout', mouseOut);
        }
        if (seatInfo && manuallySelectable && (status === STATUS_AVAILABLE || status === STATUS_SELECTED)) {
            touchManager.addEventListener(placeElement, 'end', pointerEnd);
        } else {
            touchManager.removeEventListener(placeElement, 'end', pointerEnd);
        }
    };
    const setColor = function(seatColor) {
        if (placeElement) {
            if (manuallySelectable) {
                placeElement.setAttribute('style', 'cursor:pointer;fill:' + seatColor);
            } else {
                placeElement.setAttribute('style', 'fill:' + seatColor);
            }
            if (textElement && withText) {
                if (seatColor === venueMap.getSeatColor('inactive')) {
                    textElement.setAttribute('fill', '#000000');
                } else {
                    textElement.setAttribute('fill', '#ffffff');
                }
            }
        }
    };
    this.canBeSelected = function() {
        return manuallySelectable && seatInfo && (status === STATUS_AVAILABLE || status === STATUS_SELECTED);
    };
    this.allowManuallySelectable = function(newSelectable) {
        manuallySelectable = !!newSelectable;
    };
    this.allowSeatsStatusDisplaying = function(newSelectable) {
        seatsStatusDisplayed = !!newSelectable;
    };
    this.isSelectable = function() {
        return manuallySelectable;
    };
    this.getSeatInfo = function() {
        return seatInfo;
    };
    this.setSeatInfo = function(newSeatInfo) {
        seatInfo = newSeatInfo;
        if (typeof seatInfo['status'] !== 'undefined') {
            status = seatInfo['status'];
        }
    };
    this.setSectionId = function(newSectionId) {
        sectionId = newSectionId;
    };
    this.setPriceClass = function(newPriceClass) {
        priceClass = newPriceClass;
    };
    this.setSelected = function(newSelected) {
        switch (status) {
            case STATUS_AVAILABLE:
            case STATUS_SELECTED:
                status = newSelected ? STATUS_SELECTED : STATUS_AVAILABLE;
                break;
        }
    };
    this.isSelected = function() {
        return status === STATUS_SELECTED;
    };
    this.getElement = function() {
        return placeElement;
    };
    this.highlight = function() {
        if (manuallySelectable) {
            setColor(venueMap.getSeatColor('hover'));
        }
    };
    init();
};

Piletilevi.venuemap.PlaceMapLegendItem = function(text, color, extraClass, suffix) {
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
