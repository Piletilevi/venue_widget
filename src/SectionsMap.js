import Utilities from "./Utilities";
import SectionsMapRegion from "./SectionsMapRegion";

export default function SectionsMap(venueMap) {
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
                        mapRegions[sectionId] = new SectionsMapRegion(venueMap, self
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
