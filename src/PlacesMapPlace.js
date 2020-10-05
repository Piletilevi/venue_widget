import './css/seat.css';
import touchManager from './TouchManager';

export default function PlacesMapPlace(venueMap, placeElement) {
    const self = this;
    const STATUS_TAKEN = 0;
    const STATUS_AVAILABLE = 1;
    const STATUS_SELECTED = 2;
    const STATUS_BUFFERED = 3;

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
        if (status !== STATUS_BUFFERED){
            venueMap.getPlaceToolTip().display(seatInfo, status, x, y);
        }
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
        if (seatInfo && seatInfo.status === STATUS_AVAILABLE) {
            venueMap.suggestSeats(sectionId, seatInfo);
        }
    };
    this.refreshStatus = function() {
        if (status === STATUS_BUFFERED) {
            self.renderBuffered();
        } else {
            let seatColor;
            let textColor;

            withText = true;
            textColor = '#ffffff';
            if (status === STATUS_SELECTED) {
                seatColor = venueMap.getSeatColor('active');
            } else if (priceClass && (status === STATUS_AVAILABLE || !seatsStatusDisplayed)) {
                seatColor = priceClass.color;
            } else {
                seatColor = venueMap.getSeatColor('inactive');
                withText = inactiveNumbered;
                textColor = '#000000';
            }
            if (textElement) {
                textElement.style.display = withText ? '' : 'none';
            }
            setSeatColor(seatColor);
            setTextColor(textColor);
        }

        if (seatInfo) {
            if (venueMap.isSeatSuggestingEnabled()) {
                touchManager.addEventListener(placeElement, 'start', pointerStart);
                placeElement.addEventListener('mouseenter', pointerStart);
            }

            placeElement.addEventListener('mousemove', mouseMove);
            placeElement.addEventListener('mouseleave', mouseOut);
        } else {
            if (venueMap.isSeatSuggestingEnabled()) {
                touchManager.removeEventListener(placeElement, 'start', pointerStart);
                placeElement.removeEventListener('mouseenter', pointerStart);
            }

            placeElement.removeEventListener('mousemove', mouseMove);
            placeElement.removeEventListener('mouseleave', mouseOut);
        }
        if (seatInfo && manuallySelectable && (status === STATUS_AVAILABLE || status === STATUS_SELECTED)) {
            touchManager.addEventListener(placeElement, 'end', pointerEnd);
        } else {
            touchManager.removeEventListener(placeElement, 'end', pointerEnd);
        }
    };
    const setSeatColor = function(seatColor) {
        if (placeElement) {
            if (manuallySelectable) {
                placeElement.setAttribute('style', 'cursor:pointer;fill:' + seatColor);
            } else {
                placeElement.setAttribute('style', 'fill:' + seatColor);
            }
        }
    };
    const setSeatBorderColor = function(seatBorderColor) {
        if (placeElement) {
            placeElement.setAttribute('stroke', seatBorderColor);
        }
    };
    const setTextColor = function(textColor) {
        if (textElement && withText) {
            textElement.setAttribute('fill', textColor);
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
        placeElement.setAttribute('data-seat-id', seatInfo.id);
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
        setSeatColor(venueMap.getSeatColor('hover'));
    };
    this.renderBuffered = function() {
        let seatColor = venueMap.getSeatColor('buffered');
        let seatBorderColor = venueMap.getSeatColor('bufferedBorder');
        setSeatColor(seatColor);
        setSeatBorderColor(seatBorderColor);
    };
    init();
};