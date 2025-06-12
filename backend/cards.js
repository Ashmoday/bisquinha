const cardValues= ['2', '3', '4', '5', '6', 'Q', 'J', 'K', '7', 'A'];
const cardSuits = ['heart', 'diamond', 'club', 'spade'];

function compareCards(cards, trump) {
    if (cards.length !== 4) {
        console.error("Deve haver exatamente 4 cartas na mesa.");
        return;
    }

    const trumpsInHand = cards.filter(card => card.cardSuit === trump.cardSuit);

    if (trumpsInHand.length > 0) {
        trumpsInHand.sort((card1, card2) => {
            const valueIndex1 = cardValues.indexOf(card1.cardValue);
            const valueIndex2 = cardValues.indexOf(card2.cardValue);
            return valueIndex2 - valueIndex1; 
        });

        cards[cards.indexOf(trumpsInHand[0])] = cards[0];
        cards[0] = trumpsInHand[0];

        return cards[0];
    }

    const firstSuit = cards[0].cardSuit;

    const suitsInHand = cards.filter(card => card.cardSuit === firstSuit);

    if (suitsInHand.length > 0) {
        suitsInHand.sort((card1, card2) => {
            const valueIndex1 = cardValues.indexOf(card1.cardValue);
            const valueIndex2 = cardValues.indexOf(card2.cardValue);
            return valueIndex2 - valueIndex1; 
        });

        cards[cards.indexOf(suitsInHand[0])] = cards[0];
        cards[0] = suitsInHand[0];

        console.log(cards)

        return cards[0];
    }

    return cards[0];
}

function createCards() {
    let id = 1;
    const cards = [];
    for (const cardSuit of cardSuits) {
        for (const cardValue of cardValues) {
            const card = { cardValue, cardSuit, id: id++ };
            cards.push(card);
         }
        }
        return cards;
}

function shuffle(cards) {
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }

}

function selectTrump(cards) {
    let trump = cards[cards.length -1]
    while (trump.cardValue == "A" || trump.cardValue == "7" ) {
        shuffle(cards)
        trump = cards[cards.length -1]
    }
    return trump;
}

function distributeCards(cards, numberOfPlayers, cardsPerPlayer) {
    const hand = [];

    for (let player = 0; player < numberOfPlayers; player++) {
        const playerHand = [];

        for (let card = 0; card < cardsPerPlayer; card++) {
            playerHand.push(cards.pop());
        }
        hand.push(playerHand);
    }
    return hand;
}



module.exports = {
    createCards,
    shuffle,
    selectTrump,
    compareCards,
    distributeCards
}