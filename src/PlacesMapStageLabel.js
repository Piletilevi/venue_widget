export default function(venueMap, textElement) {
    const self = this;
    const init = function() {
        let type = self.getText();
        if (type) {
            self.setText(venueMap.getTranslation('stage-' + type));
        }
        if (venueMap.isPlacesMapFlipped()) {
            let x = textElement.getAttribute('x');
            let y = textElement.getAttribute('y');
            textElement.setAttribute('transform', 'rotate(180 ' + x + ' ' + y + ')');
        }
    };
    this.setText = function(newText) {
        if (textElement.String) {
            textElement.String = newText;
        } else {
            while (textElement.firstChild) {
                textElement.removeChild(textElement.firstChild);
            }
            let node = document.createTextNode(newText);
            textElement.appendChild(node);
        }
    };
    this.getText = function() {
        return textElement.textContent || textElement.String;
    };
    init();
};

