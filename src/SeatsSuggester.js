export default function SeatsSuggester() {
    let nearSeatIndex;
    let stickToIndex;
    const STATUS_AVAILABLE = 1;

    this.suggestNewSeats = function(nearSeat, selectedSeats, details) {
        let suggestedIndexes = null;
        const amount = selectedSeats.length;

        //are some places selected at all
        if (!amount) {
            return false;
        }

        //do we have seats in section?
        if (typeof details.seatsInfo === 'undefined') {
            return false;
        }

        const row = gatherRowSeats(details.seatsInfo, nearSeat);

        //if row has been found
        if (!row) {
            return false;
        }

        suggestedIndexes = checkFromRowStart(nearSeatIndex, row, amount);
        if (stickToIndex === false) {
            let potentialIndexes = checkFromRowEnd(nearSeatIndex, row, amount);
            if (stickToIndex !== false) {
                suggestedIndexes = potentialIndexes;
            }
        }
        const result = [];
        suggestedIndexes.map(function(index) {
            result.push(row[index]);
        });
        return result;
    };
    const checkFromRowStart = function(nearSeatIndex, row, amount) {
        stickToIndex = false;
        const checkedIndexes = [];
        //take row boundaries into account
        let startIndex = Math.max(nearSeatIndex - amount + 1, 0);
        //start from "start of row", move to end searching for free places
        for (let seatIndex = startIndex; seatIndex < nearSeatIndex + amount; seatIndex++) {
            //previous place doesnt exist, we should stick to it
            if (typeof row[seatIndex - 1] === 'undefined') {
                stickToIndex = seatIndex;
            } else if (row[seatIndex - 1].status !== STATUS_AVAILABLE) {
                stickToIndex = seatIndex;
            }

            let checkAmount = amount;
            //now check all forward seats to find whether they are all free for taking
            do {
                //if place is not free or doesnt exist
                //then go out and check next chain of seats
                if (typeof row[seatIndex] === 'undefined' || row[seatIndex].status !== STATUS_AVAILABLE) {
                    stickToIndex = false;
                    break;
                }
                checkedIndexes.push(seatIndex);
                seatIndex++;
            } while (--checkAmount);

            //if we found needed chain of free seats from this direction then go out
            if (checkedIndexes.length === amount) {
                break;
            }
        }
        return checkedIndexes;
    };

    const checkFromRowEnd = function(nearSeatIndex, row, amount) {
        stickToIndex = false;
        const checkedIndexes = [];
        //take row boundaries into account
        let startIndex = Math.min(nearSeatIndex + amount - 1, row.length - 1);
        //start from "end of row", move to start, searching for free places
        for (let seatIndex = startIndex; seatIndex >= 0; seatIndex--) {
            //previous place doesnt exist, we should stick to it
            if (typeof row[seatIndex + 1] === 'undefined') {
                stickToIndex = seatIndex;
            } else if (row[seatIndex + 1].status !== STATUS_AVAILABLE) {
                stickToIndex = seatIndex;
            }

            let checkAmount = amount;
            //now check all forward seats to find whether they are all free for taking
            do {
                //if place is not free or doesnt exist
                //then go out and check next chain of seats
                if (typeof row[seatIndex] === 'undefined' || row[seatIndex].status !== STATUS_AVAILABLE) {
                    stickToIndex = false;
                    break;
                }
                checkedIndexes.push(seatIndex);
                seatIndex--;
            } while (--checkAmount);

            //if we found needed chain of free seats from this direction then go out
            if (checkedIndexes.length === amount) {
                break;
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
};
