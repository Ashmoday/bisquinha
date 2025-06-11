const { Server } = require('socket.io');
import { v4 as uuidv4 } from 'uuid';

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173"
    }
});

const roomId = uuidv4();
const games = {};

function createGame(owner) {
    games[roomId] = {
        owner: owner,
        players: [owner.playerData]
    };
    return roomId;
}

function addPlayerToGame(playerData, roomId) {
    if (!games[roomId]) {
        console.error(`Sala ${roomId} não existe.`);
        return;
    }

    if (!games[roomId].players) {
        games[roomId].players = [];
    }

    games[roomId].players.push(playerData);
}


async function main() {

    io.on("connect", (socket) => {

        socket.playerData = {
            name: '',
            id: socket.id,
            cards: [],
            team: 0
        };

        socket.on("createRoom", () => {
            createGame(socket)
        })

        socket.on("enterGame", (playerName, roomId) => {
            socket.playerData.name = playerName;
            addPlayerToGame(socket.playerData, roomId)
        })
    
    
    
    })


}