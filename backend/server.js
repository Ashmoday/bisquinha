const express = require('express');
const app = express();
const { createServer } = require('http');
const { Server } = require('socket.io');
const PORT = 3002;

const httpServer = createServer(app);



const cardValues= ['2', '3', '4', '5', '6', '7', 'J', 'Q', 'K', 'A'];
const cardSuits = ['Copas', 'Ouros', 'Paus', 'Espadas'];


let players = [];
let playerNames = {}

let playersWhoPlayedThisHand = [];



function compareCards(cards, trump) {
    if (cards.length < 1) return;
    const firstSuit = cards[0].cardSuit;    
    const hasTrump = cards.some(card => card.cardSuit === trump.cardSuit);

    cards.sort((card1, card2) => {
        // Se um trunfo foi jogado, considere apenas as cartas do mesmo naipe que o trunfo
        if (hasTrump) {
            if (card1.cardSuit === trump.cardSuit && card2.cardSuit === trump.cardSuit) {
                const valueIndex1 = cardValues.indexOf(card1.cardValue);
                const valueIndex2 = cardValues.indexOf(card2.cardValue);
                return valueIndex1 - valueIndex2;
            } else if (card1.cardSuit === trump.cardSuit) {
                return -1; // A primeira carta é do mesmo naipe do trunfo, então é maior
            } else if (card2.cardSuit === trump.cardSuit) {
                return 1; // A segunda carta é do mesmo naipe do trunfo, então é maior
            }
        }

        // Se nenhum trunfo foi jogado, considere apenas as cartas do mesmo naipe que a primeira carta
        if (card1.cardSuit === firstSuit && card2.cardSuit === firstSuit) {
            const valueIndex1 = cardValues.indexOf(card1.cardValue);
            const valueIndex2 = cardValues.indexOf(card2.cardValue);
            return valueIndex1 - valueIndex2;
        } else if (card1.cardSuit === firstSuit) {
            return -1; // A primeira carta é do mesmo naipe da primeira carta, então é maior
        } else if (card2.cardSuit === firstSuit) {
            return 1; // A segunda carta é do mesmo naipe da primeira carta, então é maior
        }

        // Se nenhum dos casos acima se aplicar, compare pelos valores normais
        const valueIndex1 = cardValues.indexOf(card1.cardValue);
        const valueIndex2 = cardValues.indexOf(card2.cardValue);
        return valueIndex1 - valueIndex2;
    });

    return cards[cards.length - 1];
}

function nextHand(playingHand, trump) {
    if (playingHand.length < 1) return;
    const bigCard = compareCards(playingHand.map(entry => entry.card), trump);
    const bigCardOwner = playingHand.find(entry => entry.card === bigCard).cardOwner;

    console.log('A maior carta na mão jogada é:', bigCard);

    // Adicione a lógica adicional aqui, se necessário

    // Emitir um evento para informar a todos sobre a conclusão da mão
    // io.emit('handResult', { bigCard, playingHand });

    // Limpar a mão jogada para a próxima rodada
    playersWhoPlayedThisHand = [];
    playingHand = [];
    
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

function cardTrump(cards) {
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



const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173"
    }
});


function tick(delta) {
    io.emit('players', players); 
    io.emit('gameData', {hands: players, playerNames});
}

async function main() {
    let cards;
    let trump;

    io.on('connect', (socket) => {
        console.log('user connected', socket.id);

        socket.on("enterGame", (playerName) => {
            players.push({
                id: socket.id,
                name: playerName,
                cards: []
            });
            io.emit('players', players);
            io.emit('gameData', {hands: players, playerNames});

        })

        socket.on("start", () => {
            // players.push({
            //     id: socket.id,
            //     name: playerName,
            //     cards: []
            // });


            io.emit('players', players);    

            cards = createCards();
            shuffle(cards);
            const hands = distributeCards(cards, players.length, 3);

            for (let i = 0; i < players.length; i++) {
                players[i].cards = hands[i];
            }
            trump = cardTrump(cards);
            console.log("o trunfo é", trump)

        });

        socket.on("playCard", (card) => {
            const player = players.find(player => player.id === socket.id);
            
            if (playersWhoPlayedThisHand.includes(socket.id)) {
                console.log('Você já jogou uma carta nesta mão.');
                return;
            }

            if (player) {
                const index = player.cards.findIndex(c => c.id === card.id);
                if (index !== -1) {
                    player.cards.splice(index, 1);
                    io.emit('gameData', { hands: players, playerNames });
                    io.emit('cardPlayed', { card, cardOwner: player.name });
                    playersWhoPlayedThisHand.push(socket.id);

                } else {
                    console.log("Carta não encontrada na mão do jogador");
                }
            } else {
                console.log("Jogador não encontrado");
            }
        });

        socket.on("buyCard", () => {
            const player = players.find(player => player.id === socket.id);
            if (player) {
                if (cards.length > 0 && player.cards.length < 3) {
                    const newCard = cards.shift();
                    player.cards.push(newCard);
                    
                    io.emit('gameData', { hands: players, playerNames});
                } else {
                    console.log("Não é possível comprar cartas.")
                }
            } else {
                console.log("Player not found")
            }
        })

        socket.on("nextHand", (playingHand) => {
            nextHand(playingHand, trump);
            io.emit('clearTable');
            
        })

        io.emit('gameData', {hands: players, playerNames});


        socket.on('disconnect', () => {
            players = players.filter((player) => player.id !== socket.id);

        });
    })

    httpServer.listen(PORT, () => {
        console.log("server started")
    })

    let lastUpdate = Date.now();

    setInterval(() => {
        const now = Date.now();
        const delta = now - lastUpdate;
        tick(delta);
        lastUpdate = now;
    }, 1000 / 32);
    
}


main();