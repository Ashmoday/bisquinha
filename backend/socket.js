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
    if(owner == null || owner.playerData == null) return;
    if (owner.playerData.name == '' || owner.playerData.name == null) return;

    games[roomId] = {
        owner: owner,
        players: [
            {
                id: owner.id,
                name: owner.playerData.name,
                cards: [],
                team: 0
            }
        ]
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

    games[roomId].players.push(player);
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
    const player = game.players.find(p => p.id === socket.id);
    if (!player) {
        console.error(`Jogador ${socket.id} não encontrado na sala ${roomId}.`);
        return;
    }

    player.playerData.team = team;
    io.to(roomId).emit("playerSwitchTeam", games[roomId])

}
function updateRooms() {
    io.emit("updateRooms", games);
}

async function main() {

    io.on("connect", (socket) => {

        socket.playerData = {
            name: '',
            roomId: null,
        };

        socket.on("createRoom", () => {
            createGame(socket)
            updateRooms();
        })

        socket.on("enterGame", (playerName, roomId) => {
            socket.playerData.name = playerName;
            addPlayerToGame(socket, roomId)
        })
            
    
    })


}