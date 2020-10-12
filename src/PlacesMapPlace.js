import './css/seat.css';
import touchManager from './TouchManager';
import Constants from './Constants';
import Utilities from './Utilities';

export default function PlacesMapPlace(venueMap, placeElement) {
    const self = this;

    this.id = false;
    let seatInfo;
    let sectionId;
    let manuallySelectable = false;
    let seatsStatusDisplayed = false;
    let inactiveNumbered = false;
    let withText = true;
    let priceClass;
    let status = Constants.STATUS_TAKEN;
    let textElement;
    let bufferedPlacePath;

    const init = function() {
        textElement = placeElement.querySelector('text');

        inactiveNumbered = venueMap.areInactiveSeatsNumbered();
        self.refreshStatus();
    };
    const mouseMove = function(event) {
        const x = Math.max(0, event.pageX);
        const y = Math.max(0, event.pageY - 2);
        if (status !== Constants.STATUS_BUFFERED) {
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
        venueMap.removeSuggestedSeats();
    };
    const pointerEnd = function(event) {
        event.preventDefault();
        if (manuallySelectable && seatInfo) {
            if (status === Constants.STATUS_AVAILABLE) {
                status = Constants.STATUS_SELECTED;
                self.refreshStatus();
                venueMap.trigger('seatsSelected', [seatInfo.id]);
                venueMap.trigger('seatSelected', seatInfo.id);
            } else if (status === Constants.STATUS_SELECTED) {
                status = Constants.STATUS_AVAILABLE;
                self.refreshStatus();
                venueMap.trigger('seatsDeselected', [seatInfo.id]);
                venueMap.trigger('seatUnSelected', seatInfo.id);
            }
        }
        venueMap.seatClicked(sectionId, seatInfo.id);
    };
    const pointerStart = function(event) {
        event.preventDefault();
        if (seatInfo && seatInfo.status === Constants.STATUS_AVAILABLE) {
            venueMap.suggestSeats(sectionId, seatInfo);
        }
    };
    this.refreshStatus = function() {
        if ((status === Constants.STATUS_BUFFERED) && seatsStatusDisplayed) {
            self.renderBuffered();
        } else {
            let seatColor;
            let textColor;

            withText = true;
            textColor = '#ffffff';
            if (status === Constants.STATUS_SELECTED) {
                seatColor = venueMap.getSeatColor('active');
            } else if (priceClass && (status === Constants.STATUS_AVAILABLE || !seatsStatusDisplayed)) {
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
            setSeatBorderColor(false);
            enableBufferedPlacePath(false);
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
        if (seatInfo && (status === Constants.STATUS_AVAILABLE || status === Constants.STATUS_SELECTED)) {
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
            if (seatBorderColor) {
                placeElement.setAttribute('stroke', seatBorderColor);
            } else {
                placeElement.removeAttribute('stroke');
            }
        }
    };
    const setTextColor = function(textColor) {
        if (textElement && withText) {
            textElement.setAttribute('fill', textColor);
        }
    };
    this.canBeSelected = function() {
        return manuallySelectable && seatInfo && (status === Constants.STATUS_AVAILABLE || status === Constants.STATUS_SELECTED);
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
            case Constants.STATUS_AVAILABLE:
            case Constants.STATUS_SELECTED:
                status = newSelected ? Constants.STATUS_SELECTED : Constants.STATUS_AVAILABLE;
                break;
        }

    };
    this.isSelected = function() {
        return status === Constants.STATUS_SELECTED;
    };
    this.getElement = function() {
        return placeElement;
    };
    this.highlight = function() {
        setSeatColor(venueMap.getSeatColor('hover'));
        setSeatBorderColor(false);
        enableBufferedPlacePath(false);
    };
    this.renderBuffered = function() {
        const seatColor = venueMap.getSeatColor('buffered');
        const seatBorderColor = venueMap.getSeatColor('bufferedBorder');
        setSeatColor(seatColor);
        setSeatBorderColor(seatBorderColor);
        enableBufferedPlacePath(true);
    };
    const enableBufferedPlacePath = function(enabled) {
        if (enabled) {
            const o = Constants.SEAT_CIRCLE_PADDING;
            const l = Constants.SEAT_CIRCLE_RADIUS - o * 2;
            const seatBorderColor = venueMap.getSeatColor('bufferedBorder');

            if (!bufferedPlacePath) {
                bufferedPlacePath = Utilities.createSvgNode('path', {
                    d: 'M ' + o + ' ' + o + ', ' + (o + l) + ' ' + (o + l) + ' Z' + ' M ' + o + ' ' + (o + l) + ', ' + (o + l) + ' ' + o + ' Z',
                    stroke: seatBorderColor
                });
            }
            placeElement.appendChild(bufferedPlacePath);
        } else if (bufferedPlacePath && bufferedPlacePath.parentNode === placeElement) {
            placeElement.removeChild(bufferedPlacePath);
        }
    };
    init();
};