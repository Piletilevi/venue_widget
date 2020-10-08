import Constants from './Constants';

export default function SeatsSuggester() {
    let nearSeatIndex;
    let stickToIndex;

    this.suggestNewSeats = function(nearSeat, customerSeats, details, offsetAmount) {
        let suggestedIndexes = [];

        //do we have seats in section?
        if (typeof details.seatsInfo === 'undefined') {
            return false;
        }
        let selectedSeats = [];
        //leave only selected places from customerSeats, without buffer-places
        for (let seatId of customerSeats) {
            for (let seat of details.seatsInfo) {
                if (seat.id === seatId) {
                    if (seat.status === Constants.STATUS_SELECTED) {
                        selectedSeats.push(seatId);
                    }
                }
            }
        }

        //are some places selected at all
        if (!selectedSeats.length) {
            return false;
        }

        const row = gatherRowSeats(details.seatsInfo, nearSeat);

        //if row has been found
        if (!row) {
            return false;
        }
        //try sticking to row start side
        let potentialIndexes = checkFromRowStart(nearSeatIndex, row, selectedSeats.length, offsetAmount);
        if (stickToIndex !== false) {
            suggestedIndexes = potentialIndexes;
        } else {
            //now try sticking to row end side
            let potentialIndexes = checkFromRowEnd(nearSeatIndex, row, selectedSeats.length, offsetAmount);
            if (stickToIndex !== false) {
                suggestedIndexes = potentialIndexes;
            } else {
                nearSeatIndex = nearSeatIndex + Math.floor((selectedSeats.length + offsetAmount * 2) / 2);
                nearSeatIndex = Math.min(nearSeatIndex, row.length - 1);
                nearSeatIndex = Math.max(nearSeatIndex, 0);
                suggestedIndexes = checkFromRowStart(nearSeatIndex, row, selectedSeats.length, offsetAmount);
            }
        }
        const result = [];
        suggestedIndexes.map(function(index) {
            result.push(row[index]);
        });
        return result;
    };
    const checkFromRowStart = function(nearSeatIndex, row, selectedSeatsAmount, offsetAmount) {
        const amount = selectedSeatsAmount + offsetAmount * 2;

        stickToIndex = false;
        let checkedIndexes = [];
        //take row boundaries into account
        let startIndex = Math.max(nearSeatIndex - amount + 1, 0);
        //start from "start of row", move to end searching for free places
        for (let seatIndex = startIndex; seatIndex < nearSeatIndex + amount; seatIndex++) {
            //previous place doesnt exist, we should stick to it
            if (typeof row[seatIndex - 1] === 'undefined') {
                stickToIndex = seatIndex;
            } else if (row[seatIndex - 1].status !== Constants.STATUS_AVAILABLE) {
                stickToIndex = seatIndex;
            }

            let checkAmount = amount;
            let startOffsetAmount = offsetAmount;
            let endOffsetAmount = offsetAmount;
            //now check all forward seats to find whether they are all free for taking
            do {
                //if place is not free or doesnt exist
                //then reset indexes chaing and move to next seat
                if (typeof row[seatIndex] === 'undefined' || row[seatIndex].status !== Constants.STATUS_AVAILABLE) {
                    checkedIndexes = [];
                    stickToIndex = false;
                    break;
                }
                checkedIndexes.push(seatIndex);
                seatIndex++;
            } while (--checkAmount);

            //if we found needed chain of free seats from this direction then go out
            if (checkedIndexes.length === amount) {
                return checkedIndexes;
            }
        }
        return checkedIndexes;
    };

    const checkFromRowEnd = function(nearSeatIndex, row, selectedSeatsAmount, offsetPlacesAmount) {
        const amount = selectedSeatsAmount + offsetPlacesAmount * 2;

        stickToIndex = false;
        let checkedIndexes = [];
        //take row boundaries into account
        let startIndex = Math.min(nearSeatIndex + amount - 1, row.length - 1);
        //start from "end of row", move to start, searching for free places
        for (let seatIndex = startIndex; seatIndex >= 0; seatIndex--) {
            //previous place doesnt exist, we should stick to it
            if (typeof row[seatIndex + 1] === 'undefined') {
                stickToIndex = seatIndex;
            } else if (row[seatIndex + 1].status !== Constants.STATUS_AVAILABLE) {
                stickToIndex = seatIndex;
            }

            let checkAmount = amount;
            //now check all forward seats to find whether they are all free for taking
            do {
                //if place is not free or doesnt exist
                //then reset indexes chaing and move to next seat
                if (typeof row[seatIndex] === 'undefined' || row[seatIndex].status !== Constants.STATUS_AVAILABLE) {
                    checkedIndexes = [];
                    stickToIndex = false;
                    break;
                }
                checkedIndexes.push(seatIndex);
                seatIndex--;
            } while (--checkAmount);

            //if we found needed chain of free seats from this direction then go out
            if (checkedIndexes.length === amount) {
                return checkedIndexes;
            }
        }
        return checkedIndexes;
    };
    const gatherRowSeats = function(seatsInfo, nearSeat) {
        const row = [];
        //gather seats from same row into one array
        for (let i = 0; i < seatsInfo.length; i++) {
            let seat = seatsInfo[i];
            if (seat.row === nearSeat.row) {
                if (seat === nearSeat) {
                    nearSeatIndex = row.length;
                }
                row.push(seat);
            }
        }
        return row;
    };
}