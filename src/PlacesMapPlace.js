import touchManager from "./TouchManager";

export default function PlacesMapPlace(venueMap, placeElement) {
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
        if (manuallySelectable) {
            self.highlight();
        }
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
            venueMap.suggestSeats(sectionId, seatInfo);
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
            if (venueMap.isSeatSuggestingEnabled()) {
                touchManager.addEventListener(placeElement, 'start', pointerStart);
            }

            placeElement.addEventListener('mousemove', mouseMove);
            placeElement.addEventListener('mouseout', mouseOut);
        } else {
            if (venueMap.isSeatSuggestingEnabled()) {
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
        setColor(venueMap.getSeatColor('hover'));
    };
    init();
};