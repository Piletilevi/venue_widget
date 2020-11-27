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
    let basketPlacePath;

    const init = function() {
        textElement = placeElement.querySelector('text');

        inactiveNumbered = venueMap.areInactiveSeatsNumbered();
        self.refreshStatus();
    };
    const pointerEnter = function(event) {
        event.preventDefault();
        if (event.pointerType === 'mouse') {
            if (seatInfo && seatInfo.status === Constants.STATUS_AVAILABLE) {
                venueMap.suggestSeats(sectionId, seatInfo);
            }
        }
    };

    const pointerLeave = function(event) {
        event.preventDefault();
        venueMap.getPlaceToolTip().hide();
        if (event.pointerType === 'mouse') {
            venueMap.removeSuggestedSeats();
        }
        if (manuallySelectable) {
            self.refreshStatus();
        }
    };

    const pointerMove = function(event) {
        if (status !== Constants.STATUS_BUFFERED) {
            const x = Math.max(0, event.pageX);
            const y = Math.max(0, event.pageY - 2);

            venueMap.getPlaceToolTip().display(seatInfo, status, x, y);
        }
        if (manuallySelectable) {
            self.highlight();
        }
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
        if (event.pointerType !== 'mouse') {
            if (seatInfo && seatInfo.status === Constants.STATUS_AVAILABLE) {
                venueMap.suggestSeats(sectionId, seatInfo);
            }
        }
        venueMap.seatClicked(sectionId, seatInfo.id);
    };
    this.refreshStatus = function() {
        withText = true;
        if ((status === Constants.STATUS_BUFFERED) && seatsStatusDisplayed) {
            self.renderBuffered();
        } else if ((status === Constants.STATUS_BASKET)) {
            setSeatColor(venueMap.getSeatColor('basket'));
            setSeatBorderColor(false);
            withText = false;
            enableBasketPlacePath(true);
        } else {
            let seatColor = false;
            let borderColor = false;
            let textColor;

            textColor = '#ffffff';
            if (status === Constants.STATUS_SELECTED) {
                borderColor = venueMap.getSeatColor('active');
            } else if (priceClass && (status === Constants.STATUS_AVAILABLE || !seatsStatusDisplayed)) {
                seatColor = priceClass.color;
            } else {
                seatColor = venueMap.getSeatColor('inactive');
                withText = inactiveNumbered;
                textColor = '#000000';
            }

            setSeatColor(seatColor);
            setTextColor(textColor);
            setSeatBorderColor(borderColor);
            enableBufferedPlacePath(false);
            enableBasketPlacePath(false);
        }
        if (textElement) {
            textElement.style.display = withText ? '' : 'none';
        }
        if (seatInfo) {
            if (venueMap.isSeatSuggestingEnabled()) {
                placeElement.addEventListener('pointerenter', pointerEnter);
            }
            placeElement.addEventListener('pointerleave', pointerLeave);
            placeElement.addEventListener('pointermove', pointerMove);
        } else {
            if (venueMap.isSeatSuggestingEnabled()) {
                placeElement.removeEventListener('pointerenter', pointerEnter);
            }
            placeElement.removeEventListener('pointerleave', pointerLeave);
            placeElement.removeEventListener('pointermove', pointerMove);
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
        setSeatColor(venueMap.getSeatColor('buffered'));
        setSeatBorderColor(venueMap.getSeatColor('bufferedBorder'));
        enableBufferedPlacePath(true);
    };
    const renderInBasket = function() {
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
    const enableBasketPlacePath = function(enabled) {
        if (enabled) {
            const fillColor = venueMap.getSeatColor('basketIcon');
            if (!basketPlacePath) {
                basketPlacePath = Utilities.createSvgNode('path', {
                    d: "M 7.59375 3.6875 L 2.386719 4.511719 C 1.90625 4.925781 2.417969 5.28125 2.417969 5.28125 L 7.507812 5.308594 L 7.507812 5.996094 L 1.90625 5.941406 C 1.675781 5.804688 1.507812 5.363281 1.449219 4.980469 C 1.394531 4.59375 1.820312 4.183594 1.820312 4.183594 L 0.9375 0.96875 L 0.453125 0.96875 L 0.339844 0.367188 L 1.5625 0.367188 L 1.875 1.355469 L 7.707031 1.328125 Z M 2.902344 6.242188 C 3.324219 6.242188 3.667969 6.574219 3.667969 6.984375 C 3.667969 7.394531 3.324219 7.726562 2.902344 7.726562 C 2.476562 7.726562 2.132812 7.394531 2.132812 6.984375 C 2.132812 6.574219 2.476562 6.242188 2.902344 6.242188 Z M 6.652344 6.242188 C 7.078125 6.242188 7.421875 6.574219 7.421875 6.984375 C 7.421875 7.394531 7.078125 7.726562 6.652344 7.726562 C 6.230469 7.726562 5.886719 7.394531 5.886719 6.984375 C 5.886719 6.574219 6.230469 6.242188 6.652344 6.242188 Z M 6.652344 6.242188 ",
                    style: "fill: " + fillColor + ";",
                    transform: 'translate(1.8, 2)'
                });
            }
            placeElement.appendChild(basketPlacePath);
        } else if (basketPlacePath && basketPlacePath.parentNode === placeElement) {
            placeElement.removeChild(basketPlacePath);
        }
    };
    init();
};