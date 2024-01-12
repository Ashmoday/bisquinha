const express = require('express');
const app = express();
const { createServer } = require('http');
const { Server } = require('socket.io');
const PORT = 3002;

const httpServer = createServer(app);



const cardValues= ['2', '3', '4', '5', '6', 'Q', 'J', 'K', '7', 'A'];
const cardSuits = ['heart', 'diamond', 'club', 'spade'];


let players = [];
let playerNames = {}
let lobbies = [];

let playersWhoPlayedThisHand = [];
let newPlayingHand = []
let allCardsPlayed = [];

let cardsTeam1 = [];
let cardsTeam2 = [];

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173"
    }
});



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


        return cards[0];
    }

    return cards[0];
}

let team1Points = 0;
let team2Points = 0;

function countPoints(cards) {
    let Points = 0;

    
    cards.forEach(card => {
        switch (card.cardValue) {
                case 'K':
                Points += 4;
                break;
                case 'A':
                Points += 11;
                break;
                case '7':
                Points += 10;
                break;
                case 'J':
                Points += 3;
                break;
                case 'Q':
                Points += 2;
                break;
            }
        })

        return Points;
  
  }




function nextHand(lobby, playingHand, trump) {
    if (!playingHand) return;
    if (playingHand.length < 1) return;
    const bigCard = compareCards(playingHand.map(entry => entry.card), trump);
    const bigCardOwner = playingHand.find(entry => entry.card === bigCard).cardOwner;

    const bigCardOwnerIndex = lobby.players.findIndex(player => player.name === bigCardOwner);
    if (bigCardOwnerIndex !== -1) {
        console.log('O índice do jogador correspondente é:', bigCardOwnerIndex);
        lobby.currentPlayerIndex = bigCardOwnerIndex
    } else {
        console.log('Jogador não encontrado no array.');
    }

    console.log('A maior carta na mão jogada é:', bigCard);
    let winnerTeam = players[bigCardOwnerIndex].team

    if (winnerTeam == 1) {
        lobby.cardsTeam1.push(...playingHand.map(item => item.card));
        let points = countPoints(lobby.cardsTeam1);
        lobby.team1Points =+ points;
    }
    if (winnerTeam == 2) {
        lobby.cardsTeam2.push(...playingHand.map(item => item.card));
        let points = countPoints(lobby.cardsTeam2);
        lobby.team2Points =+ points;
    }   

    lobby.playersWhoPlayedThisHand = [];
    playingHand = [];
    lobby.newPlayingHand = []
}


// let currentPlayerIndex = 0;

function nextPlayer(lobby) {
    for (let i = 1; i <= lobby.players.length; i++) {
      const nextIndex = (lobby.currentPlayerIndex + i) % lobby.players.length;
      const nextPlayer = lobby.players[nextIndex];

  
      if (nextPlayer.team !== lobby.players[lobby.currentPlayerIndex].team && !lobby.playersWhoPlayedThisHand.includes(nextPlayer.id)) {
        lobby.currentPlayerIndex = nextIndex;
        return nextPlayer;
      }
    }
  
    return null;    
  }
  
function nextPlayerIndex(lobby, startingIndex, condition) {
    for (let i = 1; i <= lobby.players.length; i++) {
        const nextIndex = (startingIndex + i) % lobby.players.length;
        const nextPlayer = lobby.players[nextIndex];

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





function tick(delta) {
    for (let id in lobbies) {
        io.to(lobbies[id].id).emit('players', lobbies[id].players); 
        io.to(lobbies[id].id).emit('gameData', {hands: lobbies[id].players, playerNames});
        io.to(lobbies[id].id).emit('nextPlayer', lobbies[id].currentPlayerIndex)
    }

    io.emit("updateLobbies", lobbies);

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

        socket.on("createLobby", (lobbyData) => {
            const { lobbyName, password } = lobbyData;
            const player = players.find(player => player.id === socket.id);
            if (!player) {
                console.log("Erro: jogador não encontrado.");
                return;
            }
    
            const lobby = {
                id: socket.id,
                name: lobbyName,
                password: password || null,
                players: [player],
                createdBy: player.name,
                gameStarted: false,
                newPlayingHand: [],
                allCardsPlayed: [],
                playersWhoPlayedThisHand: [],
                currentPlayerIndex: 0,
                trump: [],
                cards: [],
                team1Points: 0,
                team2Points: 0,
                cardsTeam1: [],
                cardsTeam2: []
            };  

            lobbies.push(lobby);
            player.lobbyId = lobby.id;
            io.to(socket.id).emit("lobbyCreated", lobby);
            socket.join(lobby.id);        
            io.emit("updateLobbies", lobbies);
            console.log(lobbies)

            socket.on("disconnect", () => {
                const lobbyIndex = lobbies.findIndex(lobby => lobby.id === socket.id);
                if (lobbyIndex !== -1) {
                    const lobbyId = lobbies[lobbyIndex].id;

                    // Se o criador saiu, destrua a lobby
                    io.to(lobbyId).emit('players', []); 
                    io.to(lobbyId).emit('gameData', {hands: [], playerNames});


                    lobbies.splice(lobbyIndex, 1)[0];

                    console.log(lobbies)

                    io.emit("updateLobbies", lobbies);
                }
            });
        });

        socket.on("joinLobby", (lobbyData) => {
            const { lobbyId, password, player } = lobbyData;

            const lobby = lobbies.find((lobby) => lobby.id === lobbyId);
            const myPlayer = players.find(player => player.id === socket.id);
            if (lobby) {
                if (lobby.password && lobby.password !== password) {
                    io.to(socket.id).emit("invalidPassword");
                    return;
                }
                if (lobby.players.length >= 4) return console.log("Lotado");

                let playerInLobby = lobby.players.find((p) => p.id === myPlayer.id);
                
                if (playerInLobby) return console.log("Jogador já na lobby");

                lobby.players.push({
                    id: socket.id,
                    name: player,
                    cards: [],
                    team: 0,
                });
                myPlayer.lobbyId = lobbyId;



                socket.join(lobbyId);
                socket.to(lobbyId).emit('user-connected', socket.id);
        
                io.to(socket.id).emit("joinedLobby", lobby);
                io.emit("updateLobbies", lobbies);
                // io.emit('players', players)
                // console.log(players)
                // console.log(lobbies)
            } else {
                io.to(socket.id).emit("lobbyNotFound");
            }
        });

        socket.on("enterGame", (playerName) => {
            if (players.some(player => player.name === playerName)) {
                console.log("Jogador com o mesmo nome já existe");
                return;
            }

            players.push({
                id: socket.id,
                name: playerName,
                cards: [],
                team: 0,
                lobbyId: null
            });
            // io.emit('players', players);
            // io.emit('gameData', {hands: players, playerNames});

        });


        socket.on("selectTeam", (team) =>  {
            const player = players.find(player => player.id === socket.id);
            if (!player) {
                return
            }

            const lobby = lobbies.find((lobby) => lobby.id === player.lobbyId);
            if (lobby) {
                const myPlayer = lobby.players.find((p) => p.id === player.id)
                if (myPlayer) {
                    myPlayer.team = team
                  } else {
                    console.log("Jogador não encontrado no lobby");
                  }
                } else {
                  console.log("Lobby não encontrado");
            }
            io.to(player.lobbyId).emit('players', lobby.players);
            // console.log(player.lobbyId)
            // console.log('oii', players)
            io.to(player.lobbyId).emit('gameData', {hands: lobby.players, playerNames});
        })

        socket.on("start", () => {


            // io.emit('players', players);    
            const player = players.find(player => player.id === socket.id);
            const lobby = lobbies.find((lobby) => lobby.id === player.lobbyId);

            if (lobby.players.length < 4) {
                return console.log('nem da meu querido')
            }
            let error = checkTeam(lobby.players);
            if (error) return console.log(error);


            lobby.cards = createCards();
            shuffle(lobby.cards);
            const hands = distributeCards(lobby.cards, lobby.players.length, 3);

            for (let i = 0; i < lobby.players.length; i++) {
               lobby.players[i].cards = hands[i];
            }
            lobby.trump = cardTrump(lobby.cards);
            console.log("o trunfo é", lobby.trump)
            
            io.to(lobby.id).emit('gameStart', (lobby.cards));
            let gameStart = true;
            io.to(lobby.id).emit('started', (gameStart));

        });

        socket.on("playCard", (card) => {
            const player = players.find(player => player.id === socket.id);
            const lobby = lobbies.find((lobby) => lobby.id === player.lobbyId);
            if (lobby) {
                const myPlayer = lobby.players.find((p) => p.id === player.id)

            if (lobby.playersWhoPlayedThisHand.includes(socket.id)) {
                console.log('Você já jogou uma carta nesta mão.');
                return;
            }


            const currentPlayer = lobby.players[lobby.currentPlayerIndex];
            if (myPlayer != currentPlayer) {

                return console.log("otario");
            }
         

            if (myPlayer) {
                const index = myPlayer.cards.findIndex(c => c.id === card.id);

                if (card.cardValue === '7' && card.cardSuit === lobby.trump.cardSuit) {
                    const hasAceOfTrump = player.cards.some(c => c.cardValue === 'A' && c.cardSuit === lobby.trump.cardSuit);
                    let isLastRound = false;
                    if (myPlayer.cards.length < 2) {
                        isLastRound = true;
                    }
            
                    if (hasAceOfTrump || isLastRound || lobby.newPlayingHand.length < 3) {
                       
                    } else {
                        console.log("Você só pode jogar o '7' de trunfo se tiver o ás de trunfo na mão ou for a última rodada.");
                        return;
                    }
                }

                if (card.cardValue === 'A' && card.cardSuit === lobby.trump.cardSuit) {
                    const hasSevenOfTrump = myPlayer.cards.some(c => c.cardValue === '7' && c.cardSuit === lobby.trump.cardSuit);
                    let isLastRound = false;
                    const sevenOutGame = (lobby.allCardsPlayed && lobby.allCardsPlayed.cards) ? lobby.allCardsPlayed.cards.some(c => c.cardValue === '7' && c.cardSuit === lobby.trump.cardSuit) : false;                    
                    
                    if (myPlayer.cards.length < 2) {
                        isLastRound = true;
                    }
                    if (hasSevenOfTrump || isLastRound || sevenOutGame) {

                    } else {
                        console.log("Você só pode jogar Ás de trunfo se tiver o 7 na mão, for na última rodada OU o 7 já ter sido jogado!");
                    }


                }


                if (index !== -1) {
                    myPlayer.cards.splice(index, 1);
                    io.to(lobby.id).emit('gameData', { hands: lobby.players, playerNames });
                    io.to(lobby.id).emit('cardPlayed', { card, cardOwner: myPlayer.name });

                    lobby.newPlayingHand.push(card);
                    lobby.allCardsPlayed.push(card);
                    lobby.playersWhoPlayedThisHand.push(socket.id);
                } else {
                    console.log("Carta não encontrada na mão do jogador");
                }
            } else {
                console.log("Jogador não encontrado");
            }

            const nextPlayerToPlay = nextPlayer(lobby);
            
            if (nextPlayerToPlay) {
              console.log(`Após o jogador ${currentPlayer.name} do time ${currentPlayer.team} jogar, o próximo a jogar é ${nextPlayerToPlay.name} do time ${nextPlayerToPlay.team}`);
            } else {
              console.log(`Não foi possível encontrar o próximo jogador do outro time após ${currentPlayer.name} do time ${currentPlayer.team} jogar.`);
            }
        
        }

        });

        function buyCardForPlayer(lobby, currentPlayer) {
            if (lobby.cards.length > 0 && currentPlayer.cards.length < 3) {
                const newCard = lobby.cards.shift();
                currentPlayer.cards.push(newCard);
                io.to(lobby.id).emit('gameData', { hands: lobby.players, playerNames });
            } else {
                console.log("Não é possível comprar mais cartas.");
            }
        }
        

        socket.on("nextHand", (playingHand) => {
            const player = players.find(player => player.id === socket.id);
            const lobby = lobbies.find((lobby) => lobby.id === player.lobbyId);
            nextHand(lobby, playingHand, lobby.trump);

            for (let i = 0; i < 4; i++) {
                const currentPlayer = lobby.players[lobby.currentPlayerIndex];
                if (lobby.newPlayingHand.length > 0) {
                    return
                }
                if (currentPlayer) {    
                        buyCardForPlayer(lobby, currentPlayer);
                    const nextBuyerIndex = nextPlayerIndex(lobby, lobby.currentPlayerIndex, (nextPlayer) =>
                        nextPlayer.team !== currentPlayer.team &&
                        !lobby.playersWhoPlayedThisHand.includes(nextPlayer.id)
                    );

                    if (nextBuyerIndex !== null) {
                        lobby.currentPlayerIndex = nextBuyerIndex;
                        console.log(`Jogador ${lobby.players[lobby.currentPlayerIndex].name} está comprando cartas.`);
                        io.to(lobby.id).emit('nextPlayer', lobby.currentPlayerIndex);

                    } else {
                        console.log("Todos os jogadores compraram cartas. Iniciar próxima fase do jogo.");
                    }
                
                } else {
                    console.log("Player not found");
                }
            }

            io.to(lobby.id).emit('clearTable');

            if (lobby.cards.length === 0 && lobby.players.every(player => player.cards.length === 0)) {
                gameInProgress = false;
                console.log("Fim do jogo!");
                console.log("Time 1", team1Points);
                console.log('time2', team2Points);
            }
            
        })

        // io.emit('gameData', {hands: players, playerNames});


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
    }, 1000 / 16);
    
}


main();