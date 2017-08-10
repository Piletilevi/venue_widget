var piletilevi = piletilevi || {};

piletilevi.venuemap = {
	SHOP_DOMAIN: 'shop.piletilevi.ee',
	DEFAULT_SEAT_HOVER_COLOR: '#27272e',
	DEFAULT_SEAT_ACTIVE_COLOR: '#27272e',
	DEFAULT_SEAT_INACTIVE_COLOR: '#d0d0d0'
};

piletilevi.venuemap.PlacesMapSeatInfo = function(id, row, place, price, available, priceClass) {
	this.id = id;
	this.row = row;
	this.place = place;
	this.price = price;
	this.available = !!available;
	this.priceClass = priceClass;
};

piletilevi.venuemap.PlacesMapPriceClassInfo = function(id, color, price) {
	this.id = id;
	this.color = color;
	this.price = price;
};

piletilevi.venuemap.SectionDetails = function(id, selectableSeats, seatsInfo, priceClasses) {
	this.id = id;
	this.selectableSeats = selectableSeats;
	this.seatsInfo = seatsInfo;
	this.priceClasses = priceClasses;
};

piletilevi.venuemap.Utilities = new function() {
	this.sendXhr = function(options) {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if (xhr.responseText) {
					options.onSuccess(xhr.responseText);
				} else if (options.onFailure) {
					options.onFailure();
				}
			}
		};
		xhr.open('GET', options.url, true);
		xhr.send(null);
	};
};

piletilevi.venuemap.VenueMap = function() {
	var self = this;
	var shopDomain = piletilevi.venuemap.SHOP_DOMAIN;
	var connectionSecure = false;
	var confId = '';
	var seatSelectionEnabled = false;
	var sectionsMapType = 'image';
	var sectionsMapImageUrl = '';
	var sections = [];
	var enabledSections = [];
	var selectedSeats = [];
	var selectedSeatsIndex = {};
	var eventHandlers = {};
	var sectionsDetails = {};
	var sectionsMap;
	var placesMap;
	var activeSection;
	var componentElement;
	var zoomLevel = 0;
	var translations = [];
	var placeToolTip;

	var seatColors = {
		'hover': piletilevi.venuemap.DEFAULT_SEAT_HOVER_COLOR,
		'active': piletilevi.venuemap.DEFAULT_SEAT_ACTIVE_COLOR,
		'inactive': piletilevi.venuemap.DEFAULT_SEAT_INACTIVE_COLOR
	};

	var init = function() {
		componentElement = document.createElement('div');
		componentElement.className = 'piletilevi_venue_map';
		self.hide();
		sectionsMap = new piletilevi.venuemap.SectionsMap(self);
		componentElement.appendChild(sectionsMap.getComponentElement());
		placesMap = new piletilevi.venuemap.PlacesMap(self);
		componentElement.appendChild(placesMap.getComponentElement());
		placeToolTip = new piletilevi.venuemap.PlaceTooltip(self);
	};
	var adjustToZoom = function()
	{
		if (activeSection) {
			if (placesMap) {

				placesMap.adjustToZoom();
			}
		} else if (sectionsMap) {
			sectionsMap.position();
		}
	};
	this.build = function() {
		self.update();
		self.display();
	};
	this.update = function() {
		if (activeSection) {
			placesMap.update();
			placesMap.setDisplayed(true);
			sectionsMap.hide();
		} else {
			sectionsMap.update();
			sectionsMap.display();
			placesMap.setDisplayed(false);
		}
		self.display();
	};
	this.display = function() {
		componentElement.style.display = '';
	};
	this.hide = function() {
		componentElement.style.display = 'none';
	};
	this.setConfId = function(newConfId) {
		confId = newConfId;
	};
	this.getConfId = function() {
		return confId;
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
	this.isSeatSelectionEnabled = function() {
		return seatSelectionEnabled;
	};
	this.addSectionDetails = function(details) {
		sectionsDetails[details.id] = details;
	};
	this.getSectionDetails = function(id) {
		return sectionsDetails[id] || null;
	};
	this.setSelectedSeats = function(newSelectedSeats) {
		selectedSeats = newSelectedSeats;
		for (var i = selectedSeats.length; i--;) {
			selectedSeatsIndex[selectedSeats[i]] = true;
		}
	};
	this.unSelectSeat = function(seatId) {
		selectedSeatsIndex[seatId] = false;
	};
	this.setSeatColors = function(newColors) {
		seatColors.hover = newColors.hover || piletilevi.venuemap.DEFAULT_SEAT_HOVER_COLOR;
		seatColors.active = newColors.active || piletilevi.venuemap.DEFAULT_SEAT_ACTIVE_COLOR;
		seatColors.inactive = newColors.inactive || piletilevi.venuemap.DEFAULT_SEAT_INACTIVE_COLOR;
	};
	this.getSeatColor = function(state) {
		return seatColors[state];
	};
	this.isSeatSelected = function(seatId) {
		return selectedSeatsIndex[seatId] || false;
	};
	this.addHandler = function(eventName, callBack) {
		if (typeof eventHandlers[eventName] == 'undefined') {
			eventHandlers[eventName] = [];
		}
		eventHandlers[eventName].push(callBack);
	};
	this.trigger = function(event, param) {
		for (var type in eventHandlers) {
			if (type != event) {
				continue;
			}
			for (var i = eventHandlers[type].length; i--;) {
				var handler = eventHandlers[type][i];
				handler(param);
			}
			break;
		}
	};
	this.setSelectedSection = function(sectionId) {
		activeSection = sectionId;
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
	this.setZoomLevel = function(newZoom, withoutAdjust) {
		zoomLevel = newZoom;
		if(!withoutAdjust) {
			adjustToZoom();
		}
	};
	this.getZoomLevel = function() {
		return zoomLevel;
	};
	this.addTranslation = function(key, value) {
		translations[key] = value;
	};
	this.getTranslation = function(key) {
		if(translations[key]) {
			return translations[key];
		}else {
			return key;
		}
	};
	init();
	this.getPlaceToolTip = function() {
		return placeToolTip;
	};
};

piletilevi.venuemap.SectionsMap = function(venueMap) {
	var mapRegions = {};
	this.imageElement = false;
	this.mapElement = false;
	this.vectorDocument = false;
	var componentElement;
	var self = this;
	var init = function() {
		componentElement = document.createElement('div');
		componentElement.className = 'piletilevi_venue_map_sections';
	};
	this.update = function() {
		var mapType = venueMap.getSectionsMapType();
		if (mapType) {
			if (mapType == 'image') {
				if (!self.imageElement) {
					self.createImageElement(venueMap.getSectionsMapImageUrl());
				}
			}
			else if (mapType == 'vector') {
				if (!self.mapElement) {
					self.createMapElement();
				}
			}
			self.updateMapElement();
		}
	};
	this.display = function() {
		componentElement.style.display = '';
	};
	this.hide = function() {
		componentElement.style.display = 'none';
	};
	this.createImageElement = function(imageSource) {
		var element = document.createElement('img');
		element.setAttribute('src', imageSource);
		self.imageElement = element;
		componentElement.appendChild(element);
	};

	var requestMapData = function() {
		var protocol = venueMap.isConnectionSecure() ? 'https' : 'http';
		var url = protocol + '://' + venueMap.getShopDomain() + '/public/upload/seatingplan_svg/'
			+ venueMap.getConfId() + '.svg';
		piletilevi.venuemap.Utilities.sendXhr({
			'url': url,
			'onSuccess': receiveMapData,
			'onFailure': function() {
				venueMap.trigger('sectionsMapLoadFailure');
			}
		});
	};
	var receiveMapData = function(response) {
		var mapData = response;
		var parser = new DOMParser();
		try {
			var svgDocument = parser.parseFromString(mapData, 'image/svg+xml');
			if (svgDocument && svgDocument.getElementsByTagName('parsererror').length > 0) {
				svgDocument = null;
			}
			if (svgDocument) {
				var elements = svgDocument.getElementsByTagName('image');
				var protocol = venueMap.isConnectionSecure() ? 'https' : 'http';
				var hrefBase = protocol + '://' + venueMap.getShopDomain();
				for (var i = elements.length; i--;) {
					elements[i].setAttribute('xlink:href', hrefBase + elements[i].getAttribute('xlink:href'));
				}
				componentElement.appendChild(document.adoptNode(svgDocument.documentElement));
				self.mapElement = componentElement.firstChild;
				self.mapElement.style.verticalAlign = 'top';
				self.checkMapElement();
			}
		} catch(e) {
		}
	};
	this.createMapElement = function() {
		requestMapData();
	};
	this.checkMapElement = function() {
		if (self.mapElement) {
			var vectorDocument = self.mapElement;
			if (vectorDocument) {
				self.vectorDocument = vectorDocument;
				self.updateMapElement();
			}
		}
	};
	this.updateMapElement = function() {
		if (self.mapElement && self.vectorDocument) {
			var vectorDocument = self.vectorDocument;
			var sectionsToRemove = [];
			var sectionsIndex = {};
			var sections = venueMap.getSections();
			for (var i = sections.length; i--;) {
				sectionsIndex[sections[i]] = true;
			}
			var enabledSectionsIndex = {};
			var enabledSections = venueMap.getEnabledSections();
			for (var i = enabledSections.length; i--;) {
				enabledSectionsIndex[enabledSections[i]] = true;
			}
			for (var j = 0; j < vectorDocument.childNodes.length; j++) {
				if (vectorDocument.childNodes[j].id) {
					var sectionId = vectorDocument.childNodes[j].id.split('section')[1];
					var sectionVector = vectorDocument.childNodes[j];
					if (sectionsIndex[sectionId]) {
						if (!mapRegions[sectionId]) {
							var regionObject = new piletilevi.venuemap.SectionsMapRegion(venueMap, self, sectionId,
								sectionVector, enabledSectionsIndex[sectionId]);
							mapRegions[sectionId] = regionObject;
						}
					} else {
						sectionsToRemove.push(sectionVector);
					}
				}
			}
			for (var i = 0; i < sectionsToRemove.length; i++) {
				sectionsToRemove[i].style.display = 'none';
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

piletilevi.venuemap.SectionsMapRegion = function(venueMap, sectionsMap, id, sectionVector, enabled) {
	var self = this;
	this.id = false;

	var init = function() {
		self.id = id;
		sectionVector.addEventListener('click', self.click);
		sectionVector.addEventListener('mouseover', self.mouseOver);
		sectionVector.addEventListener('mouseout', self.mouseOut);
		self.refreshStatus();
	};
	this.refreshStatus = function() {
		if (!enabled) {
			this.markDisabled();
		} else {
			this.markInactive();
		}
	};
	this.mouseOver = function(event) {
		self.markActive();
		venueMap.trigger('sectionMouseover', id);
	};
	this.mouseOut = function(event) {
		self.markInactive();
		venueMap.trigger('sectionMouseout', id);
	};
	this.markDisabled = function() {
		if (sectionVector) {
			sectionVector.setAttribute("style", "display: none;");
		}
	};
	this.markActive = function() {
		if (sectionVector) {
			sectionVector.setAttribute("fill", "#75bb01");
			sectionVector.setAttribute("opacity", "0.8");
			sectionVector.setAttribute("style", "display: block;");
		}
	};
	this.markInactive = function() {
		if (sectionVector) {
			sectionVector.setAttribute("fill", "#cccccc");
			sectionVector.setAttribute("opacity", "0");
			sectionVector.setAttribute("style", "display: block;");
		}
	};
	this.click = function(event) {
		venueMap.trigger('sectionSelected', id);
	};
	init();
};

window.touchManager = new function() {
	var self = this;
	var handlers = {};
	var eventsSet;
	var startEventName;
	var moveEventName;
	var endEventName;
	var cancelEventName;
	var pointerCache = {};

	var init = function() {
		handlers['start'] = [];
		handlers['end'] = [];
		handlers['move'] = [];
		handlers['cancel'] = [];
		eventsSet = self.getEventsSet();
		if (eventsSet == 'mouse') {
			captureStartEvent = captureStartEvent_mouse;
			captureEndEvent = captureEndEvent_mouse;
			compileEventInfo = compileEventInfo_mouse;
			startEventName = 'mousedown';
			moveEventName = 'mousemove';
			endEventName = 'mouseup';
			cancelEventName = 'mouseleave';
		} else if (eventsSet == 'touch') {
			compileEventInfo = compileEventInfo_touch;
			startEventName = 'touchstart';
			moveEventName = 'touchmove';
			endEventName = 'touchend';
			cancelEventName = 'touchcancel';
		} else if (eventsSet == 'pointer') {
			compileEventInfo = compileEventInfo_pointer;
			startEventName = 'pointerdown';
			moveEventName = 'pointermove';
			endEventName = 'pointerup';
			cancelEventName = 'pointercancel';
		} else if (eventsSet == 'mspointer') {
			compileEventInfo = compileEventInfo_mouse;
			startEventName = 'mspointerdown';
			moveEventName = 'mspointermove';
			endEventName = 'mspointerup';
			cancelEventName = 'mspointercancel';
		}
		window.addEventListener('load', initDom);
	};
	var initDom = function() {
		switch(eventsSet) {
			case 'pointer':
			case 'mspointer':
				// cache pointers in these events for multi touch support
				document.body.addEventListener(endEventName, pointerUp, true);
				document.body.addEventListener(cancelEventName, pointerUp, true);
				document.body.addEventListener(startEventName, pointerDown, true);
				document.body.addEventListener(moveEventName, pointerMove, true);
				break;
		}
	};
	this.getEventsSet = function() {
		eventsSet = false;
		if (window.PointerEvent) {
			//IE >=11, somebody else?
			eventsSet = 'pointer';
		} else if (window.navigator.msPointerEnabled) {
			//IE mobile <=10
			eventsSet = 'mspointer';
		} else if ('ontouchstart' in window) {
			eventsSet = 'touch';
		} else if ('onmousedown' in window) {
			eventsSet = 'mouse';
		}
		self.getEventsSet = getEventsSet_return;
		return eventsSet;
	};
	var getEventsSet_return = function() {
		return eventsSet;
	};
	var captureStartEvent = function(event) {
		var eventType = 'start';
		fireCallback(eventType, event);
	};
	var captureStartEvent_mouse = function(event) {
		if (event.button == 0) {
			var eventType = 'start';
			fireCallback(eventType, event);
		}
	};
	var captureMoveEvent = function(event) {
		var eventType = 'move';
		fireCallback(eventType, event);
	};
	var captureEndEvent = function(event) {
		var eventType = 'end';
		fireCallback(eventType, event);
	};
	var captureCancelEvent = function(event) {
		var eventType = 'cancel';
		fireCallback(eventType, event);
	};
	var captureEndEvent_mouse = function(event) {
		if (event.button == 0) {
			var eventType = 'end';
			fireCallback(eventType, event);
		}
	};
	var fireCallback = function(eventType, event) {
		var eventInfo = compileEventInfo(event);

		for (var i = 0; i < handlers[eventType].length; i++) {
			if (handlers[eventType][i]['element'] == eventInfo['currentTarget']) {
				handlers[eventType][i]['callback'](event, eventInfo);
			}
		}
	};
	var compileEventInfo;
	var compileEventInfo_touch = function(event) {
		var eventInfo = {
			'target': event.target,
			'currentTarget': event.currentTarget,
			'touches': event.touches
		};
		if (typeof event.touches[0] != 'undefined') {
			var firstTouch = event.touches[0];
			eventInfo['clientX'] = firstTouch.clientX;
			eventInfo['clientY'] = firstTouch.clientY;
			eventInfo['pageX'] = firstTouch.pageX;
			eventInfo['pageY'] = firstTouch.pageY;
		}
		return eventInfo;
	};
	var compileEventInfo_pointer = function(event) {
		var touches = [];
		for (var id in pointerCache) {
			touches.push(pointerCache[id]);
		}
		return {
			'touches': touches,
			'target': event.target,
			'currentTarget': event.currentTarget,
			'clientX': event.clientX,
			'clientY': event.clientY,
			'pageX': event.pageX,
			'pageY': event.pageY
		};
	};
	var compileEventInfo_mouse = function(event) {
		var currentTouchInfo = {
			'clientX': event.clientX,
			'clientY': event.clientY,
			'pageX': event.pageX,
			'pageY': event.pageY
		};
		return {
			'touches': [currentTouchInfo],
			'target': event.target,
			'currentTarget': event.currentTarget,
			'clientX': event.clientX,
			'clientY': event.clientY,
			'pageX': event.pageX,
			'pageY': event.pageY,
		};
	};
	var cachePointerEvent = function(event) {
		if (event.pointerId) {
			pointerCache[event.pointerId] = {
				'clientX': event.clientX,
				'clientY': event.clientY,
				'pageX': event.pageX,
				'pageY': event.pageY,
			};
		}
	};
	var uncachePointerEvent = function(event) {
		if (event.pointerId && pointerCache[event.pointerId]) {
			delete pointerCache[event.pointerId];
		}
	};
	var pointerUp = function(event) {
		uncachePointerEvent(event);
	};
	var pointerDown = function(event) {
		cachePointerEvent(event);
	};
	var pointerMove = function(event) {
		cachePointerEvent(event);
	};
	this.addEventListener = function(element, eventType, callback, useCapture) {
		if (!useCapture) {
			useCapture = false;
		}
		if (typeof handlers[eventType] != 'undefined') {
			var handlerExists = false;

			for (var i = 0; i < handlers[eventType].length; i++) {
				if (handlers[eventType][i]['callback'] == callback && handlers[eventType][i]['element'] == element) {
					handlerExists = true;
				}
			}
			if (!handlerExists) {
				var handlerObject = {};
				handlerObject['callback'] = callback;
				handlerObject['element'] = element;
				handlers[eventType].push(handlerObject);
			}
			if (typeof element != 'undefined' && typeof callback != 'undefined') {
				if (eventType == 'start') {
					element.addEventListener(startEventName, captureStartEvent, useCapture);
				}
				else if (eventType == 'move') {
					element.addEventListener(moveEventName, captureMoveEvent, useCapture);
				}
				else if (eventType == 'end') {
					element.addEventListener(endEventName, captureEndEvent, useCapture);
				}
				else if (eventType == 'cancel') {
					element.addEventListener(cancelEventName, captureCancelEvent, useCapture);
				}
			}
		}
	};
	this.removeEventListener = function(element, eventType, callback) {
		if (typeof handlers[eventType] != 'undefined') {
			for (var i = 0; i < handlers[eventType].length; i++) {
				if (handlers[eventType][i]['callback'] == callback && handlers[eventType][i]['element'] == element) {
					handlers[eventType][i] = null;
					handlers[eventType].splice(i, 1);
				}
			}
		}
	};
	this.setTouchAction = function(element, action) {
		if (eventsSet == 'mspointer') {
			// IE10
			element.style.msTouchAction = action;
		} else {
			element.style.touchAction = action;
		}
	};
	init();
};

var ScalableComponent = function() {
	var scaledElement;
	var gestureElement;
	var beforeStartCallback;
	var afterStartCallback;
	var afterChangeCallback;
	var endCallback;
	var speedX = 1;
	var speedY = 1;
	var minWidth;
	var minHeight;
	var maxWidth;
	var maxHeight;
	var scale;
	var startWidth;
	var startHeight;
	var currentWidth;
	var currentHeight;

	var startF0x;
	var startF0y;
	var startF1x;
	var startF1y;
	var startDistance;

	var f0x;
	var f0y;
	var f1x;
	var f1y;

	var self = this;
	this.registerScalableElement = function(parameters) {
		if (typeof parameters == 'object') {
			if (parameters.scaledElement != undefined) {
				scaledElement = parameters.scaledElement;
			}

			if (parameters.gestureElement != undefined) {
				gestureElement = parameters.gestureElement;
			}
			else {
				gestureElement = scaledElement;
			}

			if (parameters.scaledElement != undefined) {
				scaledElement = parameters.scaledElement;
			}
			if (typeof parameters.beforeStartCallback == 'function') {
				beforeStartCallback = parameters.beforeStartCallback;
			}
			if (typeof parameters.afterStartCallback == 'function') {
				afterStartCallback = parameters.afterStartCallback;
			}
			if (typeof parameters.afterChangeCallback == 'function') {
				afterChangeCallback = parameters.afterChangeCallback;
			}
			if (typeof parameters.endCallback == 'function') {
				endCallback = parameters.endCallback;
			}
			if (typeof parameters.speedX != 'undefined') {
				speedX = parseFloat(parameters.speedX, 10);
			}
			else {
				speedX = 1;
			}
			if (typeof parameters.speedY != 'undefined') {
				speedY = parseFloat(parameters.speedY, 10);
			}
			else {
				speedY = 1;
			}
			if (typeof parameters.minWidth != 'undefined') {
				minWidth = parseInt(parameters.minWidth, 10);
			}
			if (typeof parameters.minHeight != 'undefined') {
				minHeight = parseInt(parameters.minHeight, 10);
			}
			if (typeof parameters.maxWidth != 'undefined') {
				maxWidth = parseInt(parameters.maxWidth, 10);
			}
			if (typeof parameters.maxHeight != 'undefined') {
				maxHeight = parseInt(parameters.maxHeight, 10);
			}
			initScalableElement();
		}
	};
	this.unRegisterScalableElement = function() {
		removeScalableElement();
	};
	this.setMinHeight = function(minHeightValue) {
		minHeight = parseInt(minHeightValue, 10);
	};
	var initScalableElement = function() {
		removeScalableElement();
		touchManager.setTouchAction(gestureElement, 'none'); // disable browser-related touch manipulation
		touchManager.addEventListener(gestureElement, 'start', startHandler);
	};
	var removeScalableElement = function() {
		touchManager.removeEventListener(gestureElement, 'start', startHandler);
		touchManager.removeEventListener(gestureElement, 'move', moveHandler);
		touchManager.removeEventListener(gestureElement, 'cancel', endHandler);
		touchManager.removeEventListener(gestureElement, 'end', endHandler);
	};
	var startHandler = function(eventInfo, touchInfo) {
		if (touchInfo.touches != undefined && touchInfo.touches.length > 1) {
			eventInfo.preventDefault();
			scale = 1;
			if (scaledElement.tagName.toUpperCase() == 'SVG') {
				// not all browsers provide offsetWidth/Height for SVGs
				var svgBoxInfo = scaledElement.getBoundingClientRect();
				startWidth = svgBoxInfo.width;
				startHeight = svgBoxInfo.height;
			} else {
				startWidth = scaledElement.offsetWidth;
				startHeight = scaledElement.offsetHeight;
			}
			startF0x = touchInfo.touches[0].pageX;
			startF0y = touchInfo.touches[0].pageY;
			startF1x = touchInfo.touches[1].pageX;
			startF1y = touchInfo.touches[1].pageY;

			startDistance = Math.pow(Math.pow(startF1x - startF0x, 2) + Math.pow(startF1y - startF0y, 2), 0.5);

			if ((beforeStartCallback == undefined) || beforeStartCallback(compileInfo())) {
				touchManager.addEventListener(gestureElement, 'move', moveHandler);
				touchManager.addEventListener(gestureElement, 'end', endHandler);
				touchManager.addEventListener(gestureElement, 'cancel', endHandler);

				if (afterStartCallback) {
					afterStartCallback(compileInfo());
				}
			}
		}
	};
	var moveHandler = function(eventInfo, touchInfo) {
		if (touchInfo.touches != undefined && touchInfo.touches.length > 1) {
			eventInfo.preventDefault();
			f0x = touchInfo.touches[0].pageX;
			f0y = touchInfo.touches[0].pageY;
			f1x = touchInfo.touches[1].pageX;
			f1y = touchInfo.touches[1].pageY;

			var distance = Math.pow(Math.pow(f1x - f0x, 2) + Math.pow(f1y - f0y, 2), 0.5);
			scale = distance / startDistance;
			if (scale != 1) {
				var change = 1 - scale;
				currentWidth = startWidth - startWidth * change * speedX;

				if (currentWidth > maxWidth) {
					currentWidth = maxWidth;
				}
				if (currentWidth < minWidth) {
					currentWidth = minWidth;
				}

				currentHeight = startHeight - startHeight * change * speedY;
				if (currentHeight > maxHeight) {
					currentHeight = maxHeight;
				}
				if (currentHeight < minHeight) {
					currentHeight = minHeight;
				}

				scaledElement.style.width = currentWidth + 'px';
				scaledElement.style.height = currentHeight + 'px';

				if (afterChangeCallback) {
					afterChangeCallback(compileInfo());
				}
			}
		}
	};
	var endHandler = function(eventInfo, touchInfo) {
		eventInfo.preventDefault();
		touchManager.removeEventListener(gestureElement, 'move', moveHandler);
		touchManager.removeEventListener(gestureElement, 'end', endHandler);
		touchManager.removeEventListener(gestureElement, 'cancel', endHandler);

		if (endCallback) {
			endCallback(compileInfo());
		}
	};

	var compileInfo = function() {
		return {
			"speedX": speedX,
			"speedY": speedY,
			"minWidth": minWidth,
			"minHeight": minHeight,
			"maxWidth": maxWidth,
			"maxHeight": maxHeight,
			"scale": scale,
			"startWidth": startWidth,
			"startHeight": startHeight,
			"currentWidth": currentWidth,
			"currentHeight": currentHeight,

			"startF0x": startF0x,
			"startF0y": startF0y,
			"startF1x": startF1x,
			"startF1y": startF1y,
			"startDistance": startDistance,

			"f0x": f0x,
			"f0y": f0y,
			"f1x": f1x,
			"f1y": f1y
		}
	}
};

var DraggableComponent = function() {
	var draggableElement;
	var parentElement;
	var gestureElement;
	var boundariesElement;

	var boundariesPadding;

	var startElementX;
	var startElementY;
	var currentElementX;
	var currentElementY;

	var startTouchX;
	var startTouchY;
	var currentTouchX;
	var currentTouchY;

	var beforeStartCallback;
	var startCallback;
	var beforeMoveCallback;
	var afterMoveCallback;
	var endCallback;

	var self = this;
	this.registerDraggableElement = function(parameters) {
		if (typeof parameters == 'object') {
			if (parameters.draggableElement != undefined) {
				draggableElement = parameters.draggableElement;
			}

			if (parameters.parentElement != undefined) {
				parentElement = parameters.parentElement;
			}
			else if (draggableElement) {
				parentElement = draggableElement.parentNode;
			}

			if (parameters.gestureElement != undefined) {
				gestureElement = parameters.gestureElement;
			}
			else if (draggableElement) {
				gestureElement = draggableElement;
			}

			if (parameters.boundariesElement != undefined) {
				boundariesElement = parameters.boundariesElement;
			}
			if (parameters.boundariesPadding != undefined) {
				boundariesPadding = parseFloat(parameters.boundariesPadding);
			}
			else {
				boundariesPadding = 0;
			}

			if (typeof parameters.beforeStartCallback == 'function') {
				beforeStartCallback = parameters.beforeStartCallback;
			}
			if (typeof parameters.startCallback == 'function') {
				startCallback = parameters.startCallback;
			}
			if (typeof parameters.beforeMoveCallback == 'function') {
				beforeMoveCallback = parameters.beforeMoveCallback;
			}
			if (typeof parameters.afterMoveCallback == 'function') {
				afterMoveCallback = parameters.afterMoveCallback;
			}
			if (typeof parameters.endCallback == 'function') {
				endCallback = parameters.endCallback;
			}

			initDraggableElement();
		}
	};
	this.unRegisterDraggableElement = function() {
		removeDraggableElement();
	};
	var initDraggableElement = function() {
		removeDraggableElement();
		touchManager.setTouchAction(gestureElement, 'none');
		touchManager.setTouchAction(draggableElement, 'none');
		touchManager.addEventListener(gestureElement, 'start', startHandler);
	};
	var removeDraggableElement = function() {
		touchManager.removeEventListener(gestureElement, 'start', startHandler);
		touchManager.removeEventListener(gestureElement, 'move', moveHandler);
		touchManager.removeEventListener(gestureElement, 'cancel', endHandler);
		touchManager.removeEventListener(gestureElement, 'end', endHandler);
	};
	var startHandler = function(eventInfo, touchInfo) {
		if (touchInfo.touches != undefined && touchInfo.touches.length == 1) {
			eventsManager.preventDefaultAction(eventInfo);

			startElementX = draggableElement.offsetLeft;
			startElementY = draggableElement.offsetTop;

			startTouchX = touchInfo.touches[0].pageX;
			startTouchY = touchInfo.touches[0].pageY;

			if ((beforeStartCallback == undefined) || beforeStartCallback(compileInfo())) {
				touchManager.addEventListener(gestureElement, 'move', moveHandler);
				touchManager.addEventListener(gestureElement, 'end', endHandler);
				touchManager.addEventListener(gestureElement, 'cancel', endHandler);

				if (startCallback) {
					startCallback(compileInfo());
				}
			}
		}
	};
	var moveHandler = function(eventInfo, touchInfo) {
		if (touchInfo.touches != undefined && touchInfo.touches.length == 1) {
			eventsManager.preventDefaultAction(eventInfo);
			currentTouchX = touchInfo.touches[0].pageX;
			currentTouchY = touchInfo.touches[0].pageY;

			currentElementX = startElementX + currentTouchX - startTouchX;
			currentElementY = startElementY + currentTouchY - startTouchY;

			if (boundariesElement) {
				var minX;
				var maxX;
				var minY;
				var maxY;

				if (currentElementX > (minX = boundariesElement.offsetWidth * boundariesPadding)) {
					currentElementX = minX;
				}
				else if (currentElementX < (maxX = (boundariesElement.offsetWidth * (1 - boundariesPadding) - draggableElement.offsetWidth))) {
					currentElementX = maxX;
				}

				if (currentElementY > (minY = boundariesElement.offsetHeight * boundariesPadding)) {
					currentElementY = minY;
				}
				if (currentElementY < (maxY = boundariesElement.offsetHeight * (1 - boundariesPadding) - draggableElement.offsetHeight)) {
					currentElementY = maxY;
				}
			}

			if ((beforeMoveCallback == undefined) || beforeMoveCallback(compileInfo())) {
				draggableElement.style.left = currentElementX + 'px';
				draggableElement.style.top = currentElementY + 'px';

				if (afterMoveCallback) {
					afterMoveCallback(compileInfo());
				}
			}
		}

	};
	var endHandler = function(eventInfo) {
		eventsManager.preventDefaultAction(eventInfo);
		touchManager.removeEventListener(gestureElement, 'move', moveHandler);
		touchManager.removeEventListener(gestureElement, 'end', endHandler);
		touchManager.removeEventListener(gestureElement, 'cancel', endHandler);

		if (endCallback) {
			endCallback(compileInfo());
		}
	};

	var compileInfo = function() {
		return {
			"draggableElement": draggableElement,
			"parentElement": parentElement,
			"gestureElement": gestureElement,
			"startElementX": startElementX,
			"startElementY": startElementY,
			"currentElementX": currentElementX,
			"currentElementY": currentElementY,

			"startTouchX": startTouchX,
			"startTouchY": startTouchY,
			"currentTouchX": currentTouchX,
			"currentTouchY": currentTouchY
		}
	}
};

piletilevi.venuemap.PlacesMap = function(venueMap) {
	var legendElement;
	var legendItems = [];
	var self = this;
	var mapData = '';
	var currentSection;
	var componentElement, sectionsElement;
	var maps = {};
	var displayed = false;
	var failedMapLoads = {};

	var init = function() {
		createDomStructure();
	};
	var createDomStructure = function() {
		componentElement = document.createElement('div');
		componentElement.className = 'piletilevi_venue_map_places';
		legendElement = document.createElement('div');
		legendElement.className = 'places_map_legend';
		componentElement.appendChild(legendElement);
		sectionsElement = document.createElement('div');
		sectionsElement.className = 'piletilevi_venue_map_places_sections';
		sectionsElement.style.position = 'relative';
		sectionsElement.style.overflow = 'hidden';
		componentElement.appendChild(sectionsElement);
	};
	var loadSectionMap = function(sectionId) {
		var protocol = venueMap.isConnectionSecure() ? 'https' : 'http';
		var url = protocol + '://' + venueMap.getShopDomain() + '/public/upload/seatingplan_section_svg/'
			+ venueMap.getConfId() + '_' + sectionId + '.svg';
		piletilevi.venuemap.Utilities.sendXhr({
			'url': url,
			'onSuccess': function(response) {
				receiveMapData(sectionId, response);
			},
			'onFailure': function() {
				failedMapLoads[sectionId] = true;
				venueMap.trigger('placesMapLoadFailure');
			}
		});
	};
	var priceFormatter = function(input) {
		return input;
	};
	var receiveMapData = function(sectionId, response) {
		mapData = response;

		var map = new piletilevi.venuemap.PlacesMapSection(venueMap, mapData, sectionId, sectionsElement);
		sectionsElement.appendChild(map.getComponentElement());
		maps[sectionId] = map;

		if (sectionId == currentSection) {
			self.update();
		}
	};
	this.update = function() {
		if (currentSection != venueMap.getSelectedSection() && maps[currentSection]) {
			maps[currentSection].setDisplayed(false);
		}
		currentSection = venueMap.getSelectedSection();
		if (!currentSection) {
			return;
		}
		if (maps[currentSection]) {
			maps[currentSection].update();

			var sectionDetails = venueMap.getSectionDetails(currentSection);
			if (sectionDetails) {
				var priceClasses = sectionDetails.priceClasses || [];
				var legendItem;
				if (legendElement) {
					while (legendElement.firstChild) {
						legendElement.removeChild(legendElement.firstChild);
					}
					var label = venueMap.getTranslation('booked');
					legendItem = new piletilevi.venuemap.PlaceMapLegendItem(label, '#f3f3f5', 'booked');
					legendItems.push(legendItem);
					legendElement.appendChild(legendItem.getComponentElement());

					for (var i = 0; i < priceClasses.length; i++) {
						if (priceClasses[i].price) {
							legendItem = new piletilevi.venuemap.PlaceMapLegendItem(priceFormatter(priceClasses[i].price), priceClasses[i].color);
							legendItems.push(legendItem);
							legendElement.appendChild(legendItem.getComponentElement());
						}
					}
				}
			}
			if (displayed) {
				maps[currentSection].setDisplayed(true);
			}
		} else if (!failedMapLoads[currentSection]) {
			loadSectionMap(currentSection);
		}
	};
	this.adjustToZoom = function() {
		if (currentSection && maps[currentSection]) {
			maps[currentSection].adjustToZoom();
		}
	};
	this.setDisplayed = function(newDisplayed) {
		if (displayed == newDisplayed) {
			return;
		}
		displayed = newDisplayed;
		if (displayed && currentSection && maps[currentSection]) {
			maps[currentSection].setDisplayed(true);
		}
		componentElement.style.display = displayed ? '' : 'none';
	};
	this.getComponentElement = function() {
		return componentElement;
	};
	init();
};

piletilevi.venuemap.PlacesMapSection = function(venueMap, mapData, sectionId, sectionsElement) {
	var self = this;
	var placesIndex = {};
	var componentElement, svgElement;
	var displayed = false;
	var svgHeightCoefficient;
	var boundariesPadding = 0;
	var startX;
	var startY;

	var init = function()
	{
		var parser = new DOMParser();
		try {
			var svgDocument = parser.parseFromString(mapData, 'image/svg+xml');
			if (svgDocument && svgDocument.getElementsByTagName('parsererror').length > 0) {
				svgDocument = null;
			}
			if (svgDocument) {
				componentElement = document.createElement('div');
				componentElement.className = 'places_map_section places_map_section_' + sectionId;
				componentElement.style.overflow = 'auto';
				componentElement.style.position = 'absolute';
				componentElement.style.textAlign = 'center';
				svgElement = document.adoptNode(svgDocument.documentElement);
				svgElement.style.verticalAlign = 'top';
				svgElement.style.top = '0';
				svgElement.style.left = '0';

				componentElement.style.display = 'none';
				componentElement.appendChild(svgElement);

				window.eventsManager.addHandler(window, 'resize', self.resize);

				var arrowTextElement;
				if (arrowTextElement = svgElement.getElementById('stagename')) {
					new piletilevi.venuemap.PlacesMapStageLabel(arrowTextElement);
				}

				self.registerScalableElement({
					'scaledElement': svgElement,
					'gestureElement': sectionsElement,
					'minWidth': sectionsElement.offsetWidth,
					//'minHeight': sectionsElement.offsetHeight, //0
					'afterStartCallback': scaleStartCallback,
					'afterChangeCallback': scaleChangeCallback,
					'endCallback': scaleEndCallback
				});
				self.registerDraggableElement({
					'draggableElement': componentElement,
					'gestureElement': sectionsElement,
					'boundariesElement': sectionsElement,
					'boundariesPadding': boundariesPadding
				});
			}
		} catch(e) {
		}
	};
	var scaleStartCallback = function() {
		startX = componentElement.offsetLeft;
		startY = componentElement.offsetTop;

		return true;
	};
	var scaleChangeCallback = function(info) {
		var x = startX + (info.startWidth - info.currentWidth) / 2;
		var y = startY + (info.startHeight - info.currentHeight) / 2;

		var maxX = 0 + boundariesPadding * sectionsElement.offsetWidth;
		var minX = sectionsElement.offsetWidth * (1 - boundariesPadding) - componentElement.offsetWidth;
		var maxY = 0 + boundariesPadding * sectionsElement.offsetHeight;
		var minY = sectionsElement.offsetHeight * (1 - boundariesPadding) - componentElement.offsetHeight;

		if (x > maxX) {
			x = maxX;
		} else if (x < minX) {
			x = minX;
		}

		if (y > maxY) {
			y = maxY;
		} else if (y < minY) {
			y = minY;
		}

		componentElement.style.left = x + 'px';
		componentElement.style.top = y + 'px';

		return true;
	};
	var scaleEndCallback = function() {
		var zoomCoefficient = (100 / 32 * (componentElement.offsetWidth / sectionsElement.offsetWidth - 1));
		venueMap.setZoomLevel(zoomCoefficient, true);
	};
	this.update = function() {
		var sectionDetails = venueMap.getSectionDetails(sectionId);
		if (sectionDetails) {
			var priceClasses = sectionDetails.priceClasses || [];
			var priceClassesIndex = {};
			for (var i = priceClasses.length; i--;) {
				priceClassesIndex[priceClasses[i].id] = priceClasses[i];
			}
			var seatsSelectable = venueMap.isSeatSelectionEnabled() && sectionDetails.selectableSeats;
			var seatsInfo = sectionDetails.seatsInfo;
			if (seatsInfo && seatsInfo.length) {
				var placeElement = false;
				for (var i = 0; i < seatsInfo.length; i++) {
					var seatInfo = seatsInfo[i];
					if (placeElement = svgElement.getElementById('place_' + seatInfo.id)) {
						if (!placesIndex[seatInfo.id]) {
							var placeObject = new piletilevi.venuemap.PlacesMapPlace(venueMap, placeElement, self);
							placesIndex[seatInfo.id] = placeObject;
						} else {
							placeObject = placesIndex[seatInfo.id];
						}
						placeObject.setSeatInfo(seatInfo);
						var seatPriceClass = priceClassesIndex[seatInfo.priceClass] || null;
						var selectable = seatsSelectable && seatInfo;
						placeObject.setPriceClass(seatPriceClass);
						placeObject.setSelected(selectable && venueMap.isSeatSelected(seatInfo.id));
						placeObject.setSelectable(selectable);
						placeObject.refreshStatus();
					}
				}
			}
		}
	};
	this.position = function() {
		svgElement.style.position = 'relative';
		svgElement.style.top = '0';
		svgElement.style.left = '0';
		var boxInfo = svgElement.getBoundingClientRect();
		//var startWidth = boxInfo.width;
		var startHeight = boxInfo.height;
		svgHeightCoefficient = boxInfo.width / boxInfo.height;

		//sectionsElement.style.width = startWidth + 'px';
		sectionsElement.style.height = startHeight + 'px';

		self.resize();
	};
	this.adjustToZoom = function() {
		var oldWidth = componentElement.offsetWidth;
		var oldHeight = componentElement.offsetHeight;

		var zoomLevel = venueMap.getZoomLevel();
		var zoomStep = 32;
		var zoomPercentage = zoomLevel * zoomStep;
		var mapWidth = sectionsElement.offsetWidth / 100 * (100 + zoomPercentage);
		var mapHeight = sectionsElement.offsetHeight / 100 * (100 + zoomPercentage);
		svgElement.style.width = mapWidth + 'px';
		svgElement.style.height = mapHeight + 'px';

		var widthDifference = oldWidth - mapWidth;
		var heightDifference = oldHeight - mapHeight;

		var newLeft = componentElement.offsetLeft + (widthDifference / 2);
		var newTop = componentElement.offsetTop + (heightDifference / 2);

		if(newLeft > 0) {
			componentElement.style.left = 0;
		}else if(sectionsElement.offsetWidth >= componentElement.offsetWidth + newLeft) {
			componentElement.style.left = sectionsElement.offsetWidth - componentElement.offsetWidth + 'px';
		}else {
			componentElement.style.left = newLeft + 'px';
		}

		if(newTop > 0) {
			componentElement.style.top = 0;
		}else if(sectionsElement.offsetHeight >= componentElement.offsetHeight + newTop) {
			componentElement.style.top = sectionsElement.offsetHeight - componentElement.offsetHeight + 'px';
		}else {
			componentElement.style.top = newTop + 'px';
		}
	};
	this.setDisplayed = function(newDisplayed) {
		if (displayed != newDisplayed) {
			displayed = newDisplayed;
			componentElement.style.display = displayed ? '' : 'none';
			if (displayed) {
				self.position();
			}
		}
	};
	this.getComponentElement = function() {
		return componentElement;
	};
	this.resize = function() {
		sectionsElement.style.height = sectionsElement.offsetWidth / svgHeightCoefficient + 'px';
		var minHeight = sectionsElement.offsetWidth / svgHeightCoefficient;
		self.setMinHeight(minHeight);
		self.adjustToZoom();
	};
	init();
};
ScalableComponent.call(piletilevi.venuemap.PlacesMapSection.prototype);
DraggableComponent.call(piletilevi.venuemap.PlacesMapSection.prototype);

piletilevi.venuemap.PlacesMapPlace = function(venueMap, placeElement, placesMapObject) {
	var self = this;
	this.id = false;
	var selected = false;
	var seatInfo = null;
	var selectable = null;
	var priceClass = null;

	var init = function() {
		placeElement.addEventListener('click', click);
		placeElement.addEventListener('mousemove', mouseMove);
		placeElement.addEventListener('mouseout', mouseOut);
		self.refreshStatus();
	};
	var mouseMove = function(event) {
		var x = Math.max(0, event.pageX);
		var y = Math.max(0, event.pageY - 2);

		var status = '';
		if (seatInfo.available) {
			status = venueMap.getTranslation('available');
		}
		else {
			//status = window.translationsManager.get('placepopup.booked');
			status = venueMap.getTranslation('booked');
		}
		venueMap.getPlaceToolTip().display(x, y, seatInfo.row, seatInfo.place, seatInfo.price, status);

		if (selectable) {
			self.setColor(venueMap.getSeatColor('hover'))
		}
	};
	var mouseOut = function(event) {
		venueMap.getPlaceToolTip().hide();
		if (selectable) {
			self.refreshStatus();
		}
	};
	var click = function(event) {
		if (selectable && seatInfo) {
			if (seatInfo.available && !selected) {
				selected = true;
				self.refreshStatus();
				venueMap.trigger('seatSelected', seatInfo.id);
			} else if (selected) {
				selected = false;
				self.refreshStatus();
				venueMap.trigger('seatUnSelected', seatInfo.id);
			}
		}
	};
	this.refreshStatus = function() {
		var seatColor = venueMap.getSeatColor('inactive');
		if (selected) {
			seatColor = venueMap.getSeatColor('active');
		} else if (priceClass && (seatInfo.available || !selectable)) {
			seatColor = priceClass.color;
		}
		this.setColor(seatColor);
	};
	this.setColor = function(seatColor) {
		if (placeElement) {
			if (selectable) {
				placeElement.setAttribute("style", "cursor:pointer;stroke:#1F1A17;stroke-width:0.4;fill:" + seatColor);
			} else {
				placeElement.setAttribute("style", "stroke:#1F1A17;stroke-width:0.4;fill:" + seatColor);
			}
		}
	};
	this.setSelectable = function(newSelectable) {
		selectable = !!newSelectable;
	};
	this.setSeatInfo = function(newSeatInfo) {
		seatInfo = newSeatInfo;
	};
	this.setPriceClass = function(newPriceClass) {
		priceClass = newPriceClass;
	};
	this.setSelected = function(newSelected) {
		selected = !!newSelected;
	};
	init();
};

piletilevi.venuemap.PlaceMapLegendItem = function(text, color, extraClass) {
	this.colorElement = false;
	this.titleElement = false;
	this.text = false;
	this.color = false;
	var componentElement;
	var self = this;

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
		this.refreshContents();
	};
	this.refreshContents = function() {
		var titleText = this.text;
		this.setTextContent(this.titleElement, titleText);
		this.colorElement.style.backgroundColor = this.color;
	};
	this.setTextContent = function(element, text) {
		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}
		var textNode = document.createTextNode(text);
		element.appendChild(textNode);
	};
	this.getComponentElement = function() {
		return componentElement;
	};
	this.init();
};
piletilevi.venuemap.PlacesMapStageLabel = function(textElement) {
	var self = this;
	this.setText = function(newText) {
		if (textElement.String) {
			textElement.String = newText;
		} else {
			while (textElement.firstChild) {
				textElement.removeChild(textElement.firstChild);
			}
			var node = document.createTextNode(newText);
			textElement.appendChild(node);
		}
	};
	this.getText = function() {
		return textElement.textContent || textElement.String;
	};
};

piletilevi.venuemap.PlaceTooltip = function(venueMap) {
	var self = this;
	var componentElement;
	this.row1Element = false;
	this.row2Element = false;
	this.row3Element = false;
	this.row4Element = false;
	this.statusRowElement = false;
	this.popupOffset = 0;

	var createDomElements = function() {
		componentElement = document.createElement('div');
		componentElement.className = 'place_tooltip';
		componentElement.style.display = 'none';
		componentElement = componentElement;
		document.body.appendChild(componentElement);

		var contentElement = document.createElement('div');
		contentElement.className = 'place_tooltip_content';
		componentElement.appendChild(contentElement);
		var tableElement = document.createElement('table');
		contentElement.appendChild(tableElement);
		var tBodyElement = document.createElement('tbody');
		tableElement.appendChild(tBodyElement);
		var rowElement = document.createElement('tr');
		tBodyElement.appendChild(rowElement);
		var subElement = document.createElement('td');
		subElement.className = 'place_tooltip_label';
		subElement.appendChild(document.createTextNode(venueMap.getTranslation('row')));
		rowElement.appendChild(subElement);
		self.row1Element = document.createElement('td');
		self.row1Element.className = 'place_tooltip_value';
		rowElement.appendChild(self.row1Element);
		var rowElement = document.createElement('tr');
		tBodyElement.appendChild(rowElement);
		var subElement = document.createElement('td');
		subElement.className = 'place_tooltip_label';
		subElement.appendChild(document.createTextNode(venueMap.getTranslation('place')));
		rowElement.appendChild(subElement);
		self.row2Element = document.createElement('td');
		self.row2Element.className = 'place_tooltip_value';
		rowElement.appendChild(self.row2Element);
		var rowElement = document.createElement('tr');
		tBodyElement.appendChild(rowElement);
		var subElement = document.createElement('td');
		subElement.className = 'place_tooltip_label';
		subElement.appendChild(document.createTextNode(venueMap.getTranslation('price')));
		rowElement.appendChild(subElement);
		self.row3Element = document.createElement('td');
		self.row3Element.className = 'place_tooltip_value';
		rowElement.appendChild(self.row3Element);
		self.statusRowElement = document.createElement('tr');
		tBodyElement.appendChild(self.statusRowElement);
		self.row4Element = document.createElement('td');
		self.row4Element.setAttribute('colspan', '2');
		self.row4Element.className = 'place_tooltip_status';
		self.statusRowElement.appendChild(self.row4Element);
	};
	this.clear = function() {
		while (self.row1Element.firstChild) {
			self.row1Element.removeChild(self.row1Element.firstChild);
		}
		while (self.row2Element.firstChild) {
			self.row2Element.removeChild(self.row2Element.firstChild);
		}
		while (self.row3Element.firstChild) {
			self.row3Element.removeChild(self.row3Element.firstChild);
		}
		while (self.row4Element.firstChild) {
			self.row4Element.removeChild(self.row4Element.firstChild);
		}
	};
	this.display = function(x, y, row, place, price, status) {
		if (!componentElement) {
			createDomElements();
		}
		self.clear();
		if (row) {
			self.row1Element.appendChild(document.createTextNode(row));
		}
		if (place) {
			self.row2Element.appendChild(document.createTextNode(place));
		}
		if (price) {
			self.row3Element.appendChild(document.createTextNode(price));
		}
		var statusDisplay = '';
		if (status) {
			self.row4Element.appendChild(document.createTextNode(status));
		} else {
			statusDisplay = 'none';
		}
		self.statusRowElement.style.display = statusDisplay;

		if (window.innerHeight) {
			var viewPortWidth = window.innerWidth;
			var viewPortHeight = window.innerHeight;
		}
		else {
			var viewPortWidth = document.documentElement.offsetWidth;
			var viewPortHeight = document.documentElement.offsetHeight;
		}
		componentElement.style.left = 0 + 'px';
		componentElement.style.top = 0 + 'px';
		componentElement.style.visibility = 'hidden';
		componentElement.style.display = 'block';
		var popupWidth = componentElement.offsetWidth;
		var popupHeight = componentElement.offsetHeight;
		var leftPosition = x + self.popupOffset;
		leftPosition -= popupWidth / 2;
		var topPosition = y - popupHeight - self.popupOffset;
		if (leftPosition + popupWidth + self.popupOffset >= viewPortWidth) {
			leftPosition = x - self.popupOffset - popupWidth;
		}
		if (topPosition - self.popupOffset < 0) {
			topPosition = (y + self.popupOffset + popupHeight);
		}
		componentElement.style.left = leftPosition + 'px';
		componentElement.style.top = topPosition + 'px';
		componentElement.style.visibility = 'visible';
	};
	this.hide = function() {
		if (componentElement) {
			componentElement.style.display = 'none';
		}
	};
};
