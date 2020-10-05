import PlaceTooltip from './PlaceToolTip';
import Utilities from './Utilities';
import SectionsMap from './SectionsMap';
import PlacesMap from './PlacesMap';
import Constants from './Constants';
import SeatsSuggester from 'piletilevi-venuemap/src/SeatsSuggester';

export default function() {
    const self = this;
    let shopDomain = Constants.SHOP_DOMAIN;
    let connectionSecure = false;
    let confId = '';
    let seatSelectionEnabled = false;
    let seatsStatusDisplayed = false;
    let seatSuggestingEnabled = false;
    let sectionsMapType = 'vector';
    let currency = '';
    let sectionsMapImageUrl = '';
    let sections = [];
    let enabledSections = [];
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
    let previousSuggestedSeatsIndex = null;
    this.displayMapInPlaces = false;

    const seatColors = {
        'hover': Constants.DEFAULT_SEAT_HOVER_COLOR,
        'active': Constants.DEFAULT_SEAT_ACTIVE_COLOR,
        'inactive': Constants.DEFAULT_SEAT_INACTIVE_COLOR
    };

    const init = function() {
        componentElement = document.createElement('div');
        componentElement.className = 'piletilevi_venue_map';
        componentElement.style.display = 'none';
        componentElement.style['-moz-user-select'] = 'none';
        componentElement.style['-ms-user-select'] = 'none';
        componentElement.style['-webkit-user-select'] = 'none';
        componentElement.style.userSelect = 'none';
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
            sectionsMap = new SectionsMap(self);
            componentElement.appendChild(sectionsMap.getComponentElement());
        }
        placesMap = new PlacesMap(self);
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
                        placesMap.drawNewMap({
                            data: placesMapData,
                            relevantSections: [activeSection]
                        });
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
                    placesMap.drawNewMap({
                        data: placesMapData,
                        relevantSections: enabledSections,
                        withStage: true
                    });
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
    this.setSeatSuggestingEnabled = function(newSeatSuggestingEnabled) {
        seatSuggestingEnabled = newSeatSuggestingEnabled;
    };
    this.isSeatSuggestingEnabled = function() {
        return seatSuggestingEnabled;
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
        for (let i = newSelectedSeats.length; i--;) {
            selectedSeatsIndex[newSelectedSeats[i]] = true;
        }
    };
    this.unSetSelectedSeats = function(unSelectedSeats) {
        for (let i = unSelectedSeats.length; i--;) {
            delete selectedSeatsIndex[unSelectedSeats[i]];
        }
    };
    this.unSelectSeat = function(seatId) {
        delete selectedSeatsIndex[seatId];
    };
    this.setSeatColors = function(newColors) {
        seatColors.hover = newColors.hover || Constants.DEFAULT_SEAT_HOVER_COLOR;
        seatColors.active = newColors.active || Constants.DEFAULT_SEAT_ACTIVE_COLOR;
        seatColors.inactive = newColors.inactive || Constants.DEFAULT_SEAT_INACTIVE_COLOR;
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
            requestDomain = Constants.SHOP_DOMAIN;
        }
        if (requestDomain === Constants.SHOP_DOMAIN) {
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
    this.suggestSeats = function(sectionId, nearSeat) {
        const seatsSuggester = new SeatsSuggester();
        const details = sectionsDetails[sectionId];
        const suggestedSeats = seatsSuggester.suggestNewSeats(nearSeat, Object.values(selectedSeatsIndex), details);
        let unmarkSeats = {};
        if (previousSuggestedSeatsIndex){
            unmarkSeats = previousSuggestedSeatsIndex;
        }
        previousSuggestedSeatsIndex = {};

        if (suggestedSeats) {
            for (let seat of suggestedSeats) {
                previousSuggestedSeatsIndex[seat.id] = seat.id;
                if (typeof unmarkSeats[seat.id] !== 'undefined') {
                    delete unmarkSeats[seat.id];
                }
            }

            placesMap.markSuggestedSeats(suggestedSeats);
        }
        if (unmarkSeats) {
            placesMap.unmarkSuggestedSeats(Object.values(unmarkSeats));
        }
    };
    const clearAllSuggestedSeats = function() {
        if (previousSuggestedSeatsIndex) {
            placesMap.unmarkSuggestedSeats(Object.values(previousSuggestedSeatsIndex));
            previousSuggestedSeatsIndex = false;
        }
    };
    init();
};
