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
        return nextPlayer;
      }
    }
  
    return null;    
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
    nextPlayer
};