import Utilities from './Utilities';

export default function(venueMap) {
    this.createCanvas = function(options) {
        let data = JSON.parse(JSON.stringify(options.data));
        let relevantSections = options.relevantSections || [];
        let svgElement = Utilities.createSvgNode('svg', {
            viewBox: '0 0 ' + data.width + ' ' + data.height,
            width: '100%',
            height: '100%',
        });
        let node;
        let sectionsSeats = {};
        let rowEdges = {};
        let rowEdgeStruct = function() {
            this.firstSeat = null;
            this.lastSeat = null;
        };
        let relevantSeats = [];
        let relevantSectionsIndex = {};
        for (let i = relevantSections.length; i--;) {
            relevantSectionsIndex[relevantSections[i]] = true;
        }
        for (let i = 0; i < data.seats.length; ++i) {
            let seat = data.seats[i];
            let section = seat.section;
            if (!relevantSectionsIndex[section]) {
                continue;
            }
            if (!sectionsSeats[section]) {
                sectionsSeats[section] = [];
            }
            let rowKey = section + '_' + seat.row;
            if (!rowEdges[rowKey]) {
                rowEdges[rowKey] = new rowEdgeStruct();
            }
            let rowEdge = rowEdges[rowKey];
            if (!rowEdge.firstSeat || +rowEdge.firstSeat.place > +seat.place) {
                rowEdge.firstSeat = seat;
            }
            if (!rowEdge.lastSeat || +rowEdge.lastSeat.place < +seat.place) {
                rowEdge.lastSeat = seat;
            }
            sectionsSeats[section].push(seat);
            relevantSeats.push(seat);
        }
        // trim the map
        let mapRegion = calculateSeatsRegion(relevantSeats);
        let paddingX = 0;
        let paddingY = 0;
        let maxAspectRatio = 2.25;
        let minAspectRatio = 0.75;
        if (mapRegion.width / mapRegion.height > maxAspectRatio) {
            // too short
            let newHeight = mapRegion.width / maxAspectRatio;
            paddingY = (newHeight - mapRegion.height) / 2;
        } else if (mapRegion.width / mapRegion.height < minAspectRatio) {
            // too slim
            let newWidth = mapRegion.height * minAspectRatio;
            paddingX = (newWidth - mapRegion.width) / 2;
        }
        let paddingForRowLabels = Piletilevi.venuemap.SEAT_CIRCLE_RADIUS * 4.5;
        if (paddingForRowLabels > paddingX || paddingForRowLabels > paddingY) {
            paddingX += paddingForRowLabels;
            paddingY += paddingForRowLabels;
        }
        mapRegion.x -= paddingX;
        mapRegion.y -= paddingY;
        mapRegion.width += paddingX * 2;
        mapRegion.height += paddingY * 2;

        if (options.withStage && data.stageType) {
            let textSize = Utilities.getSvgTextBBox(venueMap.getTranslation('stage-' + data.stageType), {
                'font-size': Piletilevi.venuemap.STAGE_TEXT_SIZE,
                'font-weight': 'bold',
            });
            let textX = data.stageX - textSize.width / 2;
            let textY = data.stageY - textSize.height / 2;
            if (textX < mapRegion.x) {
                mapRegion.width += mapRegion.x - textX;
                mapRegion.x = textX;
            }
            if (textY < mapRegion.y) {
                mapRegion.height += mapRegion.y - textY;
                mapRegion.y = textY;
            }
            if (mapRegion.width < textX + textSize.width) {
                mapRegion.width = textX + textSize.width;
            }
            if (mapRegion.height < textY + textSize.height) {
                mapRegion.height = textY + textSize.height;
            }
        }
        svgElement.setAttribute('viewBox', '0 0 ' + mapRegion.width + ' ' + mapRegion.height);
        data.stageX -= mapRegion.x;
        data.stageY -= mapRegion.y;
        for (let i = relevantSeats.length; i--;) {
            let seat = relevantSeats[i];
            seat.x -= mapRegion.x;
            seat.y -= mapRegion.y;
        }

        if (options.withStage && data.stageType) {
            node = Utilities.createSvgNode('text', {
                id: 'stagename',
                'text-anchor': 'middle',
                x: data.stageX,
                y: data.stageY,
                fill: '#999999',
                'font-size': Piletilevi.venuemap.STAGE_TEXT_SIZE,
                'font-weight': 'bold',
                'dy': '0.3em',
            });
            let textNode = document.createTextNode(data.stageType);
            node.appendChild(textNode);
            svgElement.appendChild(node);
        }
        for (let key in rowEdges) {
            let edge = rowEdges[key];
            if (!edge.firstSeat || !edge.lastSeat) {
                continue;
            }
            svgElement.appendChild(createRowNumberNode(edge.firstSeat, edge.lastSeat));
            svgElement.appendChild(createRowNumberNode(edge.lastSeat, edge.firstSeat));
        }
        for (let i = 0; i < relevantSeats.length; ++i) {
            let seat = relevantSeats[i];
            let groupNode = Utilities.createSvgNode('g', {
                'class': 'place',
                id: 'place_' + seat.code,
                cx: seat.x,
                cy: seat.y,
            });
            svgElement.appendChild(groupNode);
            let node = Utilities.createSvgNode('circle', {
                cx: seat.x,
                cy: seat.y,
                r: Piletilevi.venuemap.SEAT_CIRCLE_RADIUS
            });
            groupNode.appendChild(node);
            if (seat.place) {
                let attributes = {
                    'class': 'place_detail seat_text',
                    x: seat.x,
                    y: seat.y,
                    dy: '0.35em', // center align vertically
                    'stroke-width': 0,
                    'text-anchor': 'middle',  // center align horizontally
                    'font-size': 6.9,
                };
                if (venueMap.isPlacesMapFlipped()) {
                    attributes['transform'] = 'rotate(180 ' + seat.x
                        + ' ' + seat.y + ')';
                }
                node = Utilities.createSvgNode('text', attributes);
                let textNode = document.createTextNode(seat.place);
                node.appendChild(textNode);
                groupNode.appendChild(node);
            }
        }
        let boundaries = {};
        let sectionLabelElements = {};
        for (let sectionId in sectionsSeats) {
            let sectionRegion = calculateSeatsRegion(sectionsSeats[sectionId]);
            if (Piletilevi.venuemap.DEBUG_FULL_PLACESMAP_SECTIONS) {
                let node = Utilities.createSvgNode('rect', {
                    x: sectionRegion.x,
                    y: sectionRegion.y,
                    width: sectionRegion.width,
                    height: sectionRegion.height,
                    fill: '#7f52ff',
                    'data-section': sectionId,
                });
                svgElement.appendChild(node);
            }
            let node = Utilities.createSvgNode('text', {
                'class': 'section_label',
                x: sectionRegion.x + sectionRegion.width / 2,
                y: sectionRegion.y + sectionRegion.height / 2,
                dy: '-0.35em', // center align vertically
                'text-anchor': 'middle',  // center align horizontally
                'font-size': 14,
                'fill': '#000000'
            });
            sectionLabelElements[sectionId] = node;
            svgElement.appendChild(node);
            boundaries[sectionId] = sectionRegion;
        }

        venueMap.displayMapInPlaces = (data.displayMapInPlaces === 1);

        let canvas = new Piletilevi.venuemap.PlacesMapCanvas(venueMap, svgElement, sectionLabelElements);
        canvas.setSectionsBoundaries(boundaries);
        return canvas;
    };
    const calculateSeatsRegion = function(seats) {
        let topLeft = {
            x: -1,
            y: -1,
        };
        let bottomRight = {
            x: -1,
            y: -1,
        };
        for (let i = 0; i < seats.length; ++i) {
            let seat = seats[i];
            let x = +seat.x;
            let y = +seat.y;
            if (topLeft.x < 0 || x < topLeft.x) {
                topLeft.x = x;
            }
            if (topLeft.y < 0 || y < topLeft.y) {
                topLeft.y = y;
            }
            if (bottomRight.x < 0 || x > bottomRight.x) {
                bottomRight.x = x;
            }
            if (bottomRight.y < 0 || y > bottomRight.y) {
                bottomRight.y = y;
            }
        }
        let seatRadius = Piletilevi.venuemap.SEAT_CIRCLE_RADIUS;
        return {
            x: topLeft.x - seatRadius,
            y: topLeft.y - seatRadius,
            width: bottomRight.x - topLeft.x + seatRadius * 2,
            height: bottomRight.y - topLeft.y + seatRadius * 2,
        };
    };
    const createRowNumberNode = function(seat1, seat2) {
        let alignedLeft = seat1.x <= seat2.x;
        let position = seat1.x;
        if (alignedLeft) {
            position -= Piletilevi.venuemap.SEAT_CIRCLE_RADIUS * 2;
        } else {
            position += Piletilevi.venuemap.SEAT_CIRCLE_RADIUS * 2;
        }
        let calculateAngle = function(x1, y1, x2, y2) {
            return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        };
        let angle = Math.round(
            alignedLeft
                ? calculateAngle(
                seat1.x,
                seat1.y,
                seat2.x,
                seat2.y
                ) : calculateAngle(
                seat2.x,
                seat2.y,
                seat1.x,
                seat1.y
                ));
        let transform = 'rotate(' + angle + ',' + seat1.x + ',' + seat1.y + ')';
        let flipped = venueMap.isPlacesMapFlipped();
        if (flipped) {
            transform += ', rotate(180 ' + position + ' ' + seat1.y + ')';
        }
        let anchor = alignedLeft && !flipped || !alignedLeft && flipped
            ? 'end' : 'start';
        let node = Utilities.createSvgNode('text', {
            'class': 'place_detail',
            x: position,
            y: seat1.y,
            dy: '0.35em', // center align vertically
            'transform': transform,
            'stroke-width': 0,
            'text-anchor': anchor,  // center align horizontally
            'font-size': 10,
            'fill': '#999999'
        });
        let textNode = document.createTextNode(seat1.row);
        node.appendChild(textNode);
        return node;
    };
};