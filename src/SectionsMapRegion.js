export default function(venueMap, sectionsMap, id, sectionVector) {
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