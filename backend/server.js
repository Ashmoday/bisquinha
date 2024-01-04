const express = require('express');
const app = express();
const { createServer } = require('http');
const { Server } = require('socket.io');
const PORT = 3002;

const httpServer = createServer(app);



const cardValues= ['2', '3', '4', '5', '6', 'Q', 'J', 'K', '7', 'A'];
const cardSuits = ['Copas', 'Ouros', 'Paus', 'Espadas'];


let players = [];
let playerNames = {}

let playersWhoPlayedThisHand = [];
let newPlayingHand = []


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

        console.log(cards)

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





function nextHand(playingHand, trump) {
    if (!playingHand) return;
    if (playingHand.length < 1) return;
    const bigCard = compareCards(playingHand.map(entry => entry.card), trump);
    const bigCardOwner = playingHand.find(entry => entry.card === bigCard).cardOwner;


    const bigCardOwnerIndex = players.findIndex(player => player.name === bigCardOwner);
    if (bigCardOwnerIndex !== -1) {
        console.log('O índice do jogador correspondente é:', bigCardOwnerIndex);
        currentPlayerIndex = bigCardOwnerIndex
    } else {
        console.log('Jogador não encontrado no array.');
    }

    console.log('A maior carta na mão jogada é:', bigCard);

    playersWhoPlayedThisHand = [];
    playingHand = [];
    newPlayingHand = []
    
}


let currentPlayerIndex = 0;

function nextPlayer() {
    for (let i = 1; i <= players.length; i++) {
      const nextIndex = (currentPlayerIndex + i) % players.length;
      const nextPlayer = players[nextIndex];
  
      if (nextPlayer.team !== players[currentPlayerIndex].team && !playersWhoPlayedThisHand.includes(nextPlayer.id)) {
        currentPlayerIndex = nextIndex;
        return nextPlayer;
      }
    }
  
    return null;
  }
  
function nextPlayerIndex(startingIndex, condition) {
    for (let i = 1; i <= players.length; i++) {
        const nextIndex = (startingIndex + i) % players.length;
        const nextPlayer = players[nextIndex];

        if (condition(nextPlayer)) {
            return nextIndex;
        }
    }

    return null;
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
    io.emit('nextPlayer', currentPlayerIndex)
}

function checkTeam(players) {
    let error = [];
    
    if (players.some(player => player.team === 0)) {
        return error = "Existem jogadores sem time";
    };
    let team1 = players.filter(player => player.team == 1 );
    let team2 = players.filter(player => player.team == 2 );

    if (team1.length > 2 || team2.length > 2) {
        return error = "Times não balanceados";
    }

}
async function main() {
    let cards;
    let trump;

    io.on('connect', (socket) => {
        console.log('user connected', socket.id);

        socket.on("enterGame", (playerName) => {
            if (players.length >= 4) return console.log("Lotado");
            players.push({
                id: socket.id,
                name: playerName,
                cards: [],
                team: 0
            });
            io.emit('players', players);
            io.emit('gameData', {hands: players, playerNames});

        })

        socket.on("selectTeam", (team) =>  {
            const player = players.find(player => player.id === socket.id);
            if (!player) {
                return
            }
            player.team = team;
            io.emit('players', players);
            io.emit('gameData', {hands: players, playerNames});
        })

        socket.on("start", () => {
            if (players.length < 4) {
                return console.log('nem da meu querido')
            }
            let error = checkTeam(players);
            if (error) return console.log(error);

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
            const currentPlayer = players[currentPlayerIndex];
            if (player != currentPlayer) {

                return console.log("otario");
            }
         

            if (player) {
                const index = player.cards.findIndex(c => c.id === card.id);

                if (card.cardValue === '7' && card.cardSuit === trump.cardSuit) {
                    const hasAceOfTrump = player.cards.some(c => c.cardValue === 'A' && c.cardSuit === trump.cardSuit);
                    let isLastRound = false;
                    if (player.cards.length < 2) {
                        isLastRound = true;
                    }
            
                    if (hasAceOfTrump || isLastRound || newPlayingHand.length < 3) {
                       
                    } else {
                        console.log("Você só pode jogar o '7' de trunfo se tiver o ás de trunfo na mão ou for a última rodada.");
                        return;
                    }
                }

                if (card.cardValue === 'A' && card.cardSuit === trump.cardSuit) {
                    const hasSevenOfTrump = player.cards.some(c => c.cardValue === '7' && c.cardSuit === trump.cardSuit);

                }


                if (index !== -1) {
                    player.cards.splice(index, 1);
                    io.emit('gameData', { hands: players, playerNames });
                    io.emit('cardPlayed', { card, cardOwner: player.name });
                    newPlayingHand.push(card);
                    playersWhoPlayedThisHand.push(socket.id);

                } else {
                    console.log("Carta não encontrada na mão do jogador");
                }
            } else {
                console.log("Jogador não encontrado");
            }

            const nextPlayerToPlay = nextPlayer();
            
            if (nextPlayerToPlay) {
              console.log(`Após o jogador ${currentPlayer.name} do time ${currentPlayer.team} jogar, o próximo a jogar é ${nextPlayerToPlay.name} do time ${nextPlayerToPlay.team}`);
            } else {
              console.log(`Não foi possível encontrar o próximo jogador do outro time após ${currentPlayer.name} do time ${currentPlayer.team} jogar.`);
            }
          

        });

        function buyCardForPlayer(currentPlayer) {
            if (cards.length > 0 && currentPlayer.cards.length < 3) {
                const newCard = cards.shift();
                currentPlayer.cards.push(newCard);
                io.emit('gameData', { hands: players, playerNames });
            } else {
                console.log("Não é possível comprar mais cartas.");
            }
        }

        socket.on("buyCard", () => {
            const currentPlayer = players[currentPlayerIndex];
            console.log(newPlayingHand.length)
            if (newPlayingHand.length > 0) {
                return
            }
            if (currentPlayer) {
                for (let i = 0; i < 4; i++) {
                    buyCardForPlayer(currentPlayer);
                }
        
                const nextBuyerIndex = nextPlayerIndex(currentPlayerIndex, (nextPlayer) =>
                    nextPlayer.team !== currentPlayer.team &&
                    !playersWhoPlayedThisHand.includes(nextPlayer.id)
                );
        
                if (nextBuyerIndex !== null) {
                    currentPlayerIndex = nextBuyerIndex;
                    console.log(`Jogador ${players[currentPlayerIndex].name} está comprando cartas.`);
                    io.emit('nextPlayer', currentPlayerIndex);
                } else {
                    console.log("Todos os jogadores compraram cartas. Iniciar próxima fase do jogo.");
                }
            } else {
                console.log("Player not found");
            }
        });
        

        socket.on("nextHand", (playingHand) => {
            console.log("catinga",trump)
            console.log('hmm', playingHand)
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