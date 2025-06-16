import { v4 as uuidv4 } from 'uuid';
const Deck = require('./cards.js');
import { v4 as uuidv4 } from 'uuid';

const games = {};
let io = null;

function init(ioInstance) {
    io = ioInstance;
}

function createGame(owner) {
    const roomId = uuidv4();

    if(owner == null || owner.playerData == null) return;
    if (owner.playerData.name == '' || owner.playerData.name == null) return;

    games[roomId] = {
        id: roomId,
        owner: owner.id,
        players: [
            {
                id: owner.id,
                name: owner.playerData.name,
                cards: [],
                team: 0
            }
        ],
        deck: [],        
        trumpCard: {},
        playersWhoPlayedThisHand: [],
        currentPlayerIndex: 0,
        newPlayingHand: [],
        allCardsPlayed: [],
        currentPlayer: [],
        

    };
    owner.join(roomId);
    owner.playerData.roomId = roomId;
    io.to(room).emit("playerConnect", owner);
    return roomId;
}

function addPlayerToGame(player, roomId) {
    if (!games[roomId]) {
        console.error(`Sala ${roomId} não existe.`);
        return;
    }

    if (!games[roomId].players) {
        games[roomId].players = [];
    }
    let isInRoom = games[roomId].players.some(p => p.id === socket.id)
    if (isInRoom) return;
    player.join(roomId);
    player.playerData.roomId = roomId;
    io.to(roomId).emit("playerConnect", player);

}

function switchTeams(socket, team) {
    const roomId = socket.playerData.roomId;
    if (!games[roomId]) {
        console.error(`Sala ${roomId} não existe.`);
        return;
    }

    if (!games[roomId].players) {
        return;
    }
    const players = games[roomId].players;
    const player = games.players.find(p => p.id === socket.id);
    if (!player) {
        console.error(`Jogador ${socket.id} não encontrado na sala ${roomId}.`);
        return;
    }

    player.team = team;
    io.to(roomId).emit("playerSwitchTeam", { players })

}
function updateRooms() {
    io.emit("updateRooms", games);
}

function checkTeam(players) {
    if (players.some(player => player.team == 0)) return;
    let isTeam1Full = players.filter(player => player.team == 1).length > 2;
    let isTeam2Full = players.filter(player => player.team == 2).length > 2;

    if (isTeam1Full || isTeam2Full) return;
}

function createGameCards(roomId) {
    const game = games[roomId];
    const cards = Deck.createCards();
    Deck.shuffle(cards);
    const trump = Deck.selectTrump(cards);
    const hands = Deck.distributeCards(cards, game.players.length, 3);
    const players = game.players;
    players.forEach((player, index) => {
        player.cards = hands[index];        
    })
    game.trumpCard = trump;

    io.to(roomId).emit("gameStart", game);
}

function nextPlayer(game) { 
    const players = game.players;
    const currentPlayerIndex = game.currentPlayerIndex;
    const playersWhoPlayedThisHand = game.playersWhoPlayedThisHand
    
    for (let i = 1; i <= players.length; i++) {
      const nextIndex = (currentPlayerIndex + i) % players.length;
      const nextPlayer = players[nextIndex];
  
      if (nextPlayer.team !== players[currentPlayerIndex].team && !playersWhoPlayedThisHand.includes(nextPlayer.id)) {
        currentPlayerIndex = nextIndex;
        io.to(game.id).emit("nextPlayer", game);
        return nextPlayer;
      }
    }
  
    return null;    
  }

  function buyCardForPlayer(game) {
    let cards = game.cards;
    let currentPlayer = game.currentPlayer;
    if (cards.length > 0 && currentPlayer.cards.length < 3) {
        const newCard = cards.shift();
        currentPlayer.cards.push(newCard);
        io.emit('gameData', game);
    } else {
        console.log("Não é possível comprar mais cartas.");
        return;
    }
  }

  
  function playCard(socket, roomId, card) {
    const game = games[roomId];
    const player = game.players.find(player => player.id === socket.id);
    if (game.playersWhoPlayedThisHand.includes(player.id)) return;
    const currentPlayer = game.players[game.currentPlayerIndex];
    if (player != currentPlayer) return;
    const newPlayingHand = game.newPlayingHand;

    const index = player.cards.findIndex(c => c.id === card.id);
    const allCardsPlayed = game.allCardsPlayed;

    if (card.cardValue === '7' && card.cardSuit === trump.cardSuit) {
        const hasAceOfTrump = player.cards.some(c => c.cardValue === 'A' && c.cardSuit === trump.cardSuit);
        let isLastRound = false;
        if (player.cards.length < 2) {
            isLastRound = true;
        }

        if (!hasAceOfTrump && !isLastRound && newPlayingHand.length < 3 ) {
            console.log("Você só pode jogar o '7' de trunfo se tiver o ás de trunfo na mão ou for a última rodada.");
            return;
        }   
    }

    if (card.cardValue === 'A' && card.cardSuit === trump.cardSuit) {
        const hasSevenOfTrump = player.cards.some(c => c.cardValue === '7' && c.cardSuit === trump.cardSuit);
        let isLastRound = false;
        const sevenOutGame = (allCardsPlayed && allCardsPlayed.cards) ? allCardsPlayed.cards.some(c => c.cardValue === '7' && c.cardSuit === trump.cardSuit) : false;                    
        
        if (player.cards.length < 2) {
            isLastRound = true;
        }
        if (!hasSevenOfTrump && !isLastRound && !sevenOutGame) {
            console.log("Você só pode jogar Ás de trunfo se tiver o 7 na mão, for na última rodada OU o 7 já ter sido jogado!");
            return;
        }

        if (index !== -1)
        {
            player.cards.splice(index, 1);
            game.newPlayingHand.push({
                card,
                cardOwner: player
            });
            allCardsPlayed.cards.push(card)
            game.playersWhoPlayedThisHand.push(socket.id)
            io.to(roomId).emit("gameData", game)
        } else {
            console.log("Carta não encontrada na mão do jogador");
            return;
        }

        nextPlayer(game);
    }
  }

function nextHand(game) {
    let playingHand = game.playingHand
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
    let winnerTeam = players[bigCardOwnerIndex].team

    if (winnerTeam == 1) {
        cardsTeam1.push(...playingHand.map(item => item.card));
        console.log(cardsTeam1);
        countPoints(cardsTeam1, winnerTeam);

    }
    if (winnerTeam == 2) {
        cardsTeam2.push(...playingHand.map(item => item.card));
        countPoints(cardsTeam2, winnerTeam);
    }   

    playersWhoPlayedThisHand = [];
    playingHand = [];
    newPlayingHand = []
}

module.exports = {
    games,
    init,
    createGame,
    addPlayerToGame,
    switchTeams,
    updateRooms,
    checkTeam,
    createGameCards,
    nextPlayer,
    buyCardForPlayer,
    playCard,
    nextHand,
};