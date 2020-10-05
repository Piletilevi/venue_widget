import './place_tooltip.css';

export default function(venueMap) {
    const self = this;
    let componentElement;
    let sectionElement;
    let sectionTitleElement;
    let rowRowElement;
    let rowElement;
    let placeRowElement;
    let placeElement;
    let priceElement;
    let statusElement;
    let priceRowElement;
    let statusRowElement;
    let popupOffset = 0;
    let displayed = false;
    let statuses = {
        0: 'booked',
        1: 'available',
        2: 'selected',
        3: 'not_sold'
    };

    const createDomElements = function() {
        componentElement = document.createElement('div');
        componentElement.className = 'place_tooltip';
        document.body.appendChild(componentElement);

        let contentElement = document.createElement('div');
        contentElement.className = 'place_tooltip_content';
        componentElement.appendChild(contentElement);

        let tableElement = document.createElement('table');
        contentElement.appendChild(tableElement);
        let tBodyElement = document.createElement('tbody');
        tableElement.appendChild(tBodyElement);

        let labelElement;
        sectionElement = document.createElement('tr');
        tBodyElement.appendChild(sectionElement);
        labelElement = document.createElement('td');
        labelElement.className = 'place_tooltip_label';
        labelElement.appendChild(document.createTextNode(venueMap.getTranslation('section')));
        sectionElement.appendChild(labelElement);
        sectionTitleElement = document.createElement('td');
        sectionTitleElement.className = 'place_tooltip_value';
        sectionElement.appendChild(sectionTitleElement);

        rowRowElement = document.createElement('tr');
        tBodyElement.appendChild(rowRowElement);
        labelElement = document.createElement('td');
        labelElement.className = 'place_tooltip_label';
        labelElement.appendChild(document.createTextNode(venueMap.getTranslation('row')));
        rowRowElement.appendChild(labelElement);
        rowElement = document.createElement('td');
        rowElement.className = 'place_tooltip_value';
        rowRowElement.appendChild(rowElement);

        placeRowElement = document.createElement('tr');
        tBodyElement.appendChild(placeRowElement);
        labelElement = document.createElement('td');
        labelElement.className = 'place_tooltip_label';
        labelElement.appendChild(document.createTextNode(venueMap.getTranslation('place')));
        placeRowElement.appendChild(labelElement);
        placeElement = document.createElement('td');
        placeElement.className = 'place_tooltip_value';
        placeRowElement.appendChild(placeElement);

        priceRowElement = document.createElement('tr');
        tBodyElement.appendChild(priceRowElement);
        labelElement = document.createElement('td');
        labelElement.className = 'place_tooltip_label';
        labelElement.appendChild(document.createTextNode(venueMap.getTranslation('price')));
        priceRowElement.appendChild(labelElement);
        priceElement = document.createElement('td');
        priceElement.className = 'place_tooltip_value';
        priceRowElement.appendChild(priceElement);

        statusRowElement = document.createElement('tr');
        tBodyElement.appendChild(statusRowElement);
        statusElement = document.createElement('td');
        statusElement.setAttribute('colspan', '2');
        statusElement.className = 'place_tooltip_status';
        statusRowElement.appendChild(statusElement);
    };
    this.clear = function() {
        while (rowElement.firstChild) {
            rowElement.removeChild(rowElement.firstChild);
        }
        while (placeElement.firstChild) {
            placeElement.removeChild(placeElement.firstChild);
        }
        while (priceElement.firstChild) {
            priceElement.removeChild(priceElement.firstChild);
        }
        while (statusElement.firstChild) {
            statusElement.removeChild(statusElement.firstChild);
        }
        while (sectionTitleElement.firstChild) {
            sectionTitleElement.removeChild(sectionTitleElement.firstChild);
        }
        rowRowElement.style.display = 'none';
        placeRowElement.style.display = 'none';
        priceRowElement.style.display = 'none';
        statusRowElement.style.display = 'none';
        sectionElement.style.display = 'none';
    };
    this.display = function(seat, status, x, y) {
        if (!componentElement) {
            createDomElements();
        }
        updateContents(seat, status);
        if (!displayed) {
            displayed = true;
            componentElement.style.display = 'block';
            componentElement.classList.add('place_tooltip_display');
        }
        updatePosition(x, y);
    };
    this.hide = function() {
        if (displayed) {
            displayed = false;
            if (componentElement) {
                componentElement.classList.remove('place_tooltip_display');
                componentElement.addEventListener('animationend', () => {
                    if (!displayed) {
                        componentElement.style.display = 'none';
                    }
                });
            }
        }
    };
    this.dispose = function() {
        window.removeEventListener('resize', self.resize);

        if (componentElement && componentElement.parentNode) {
            componentElement.parentNode.removeChild(componentElement);
        }
        componentElement = null;
    };
    const updateContents = function(seat, status) {
        self.clear();
        let statusCode = statuses[status] || statuses[0];
        let sectionTitle = '';
        if (venueMap.getSectionsMapType() === 'full_venue') {
            let section = venueMap.getSectionBySeatId(seat.id);
            sectionTitle = section ? section.title : '';
        }
        if (sectionTitle) {
            sectionTitleElement.appendChild(document.createTextNode(sectionTitle));
            sectionElement.style.display = '';
        }
        if (statusCode !== 'not_sold') {
            if (seat.row) {
                rowElement.appendChild(document.createTextNode(seat.row));
                rowRowElement.style.display = '';
            }
            if (seat.place) {
                placeElement.appendChild(document.createTextNode(seat.place));
                placeRowElement.style.display = '';
            }
        }
        if (venueMap.isSeatSelectionEnabled()) {
            let text = venueMap.getTranslation(statusCode);
            statusElement.appendChild(document.createTextNode(text));
            statusRowElement.style.display = '';
        }

        if (seat.price && statusCode !== 'booked' && statusCode !== 'not_sold') {
            priceElement.appendChild(document.createTextNode(seat.price));
            priceRowElement.style.display = '';
        }
    };
    const updatePosition = function(x, y) {
        let viewPortWidth;
        if (window.innerHeight) {
            viewPortWidth = window.innerWidth;
        } else {
            viewPortWidth = document.documentElement.offsetWidth;
        }
        componentElement.style.left = 0 + 'px';
        componentElement.style.top = 0 + 'px';
        let popupWidth = componentElement.offsetWidth;
        let popupHeight = componentElement.offsetHeight;
        let leftPosition = x + popupOffset;
        leftPosition -= popupWidth / 2;
        let topPosition = y - popupHeight - popupOffset;
        if (leftPosition + popupWidth + popupOffset >= viewPortWidth) {
            leftPosition = x - popupOffset - popupWidth;
        }
        if (topPosition - popupOffset < 0) {
            topPosition = (y + popupOffset + popupHeight);
        }
        componentElement.style.left = leftPosition + 'px';
        componentElement.style.top = topPosition + 'px';
    };
};