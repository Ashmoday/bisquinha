const { Server } = require('socket.io');
const {
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
    handleCardBuying,
    kickPlayer,
} = require('./gameManager');



const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173"
    }
});

init(io)    

async function main() {

    io.on("connect", (socket) => {

        socket.playerData = {
            name: '',
            roomId: null,
        };

        socket.on("createRoom", () => {
            createGame(socket)
            updateRooms();
        });

        socket.on("enterGame", (playerName, roomId) => {
            socket.playerData.name = playerName;
            addPlayerToGame(socket, roomId)
        });

        socket.on("selectTeam", (team) => {
            switchTeams(socket, team);
        });
            
        socket.on("start", (roomId) => {
            let playerRoom = socket.playerData.roomId;
            if (playerRoom != roomId) return;
            let gameRoom = games[roomId];
            if (gameRoom.owner != socket.id) return;
            
            if (gameRoom.players.length < 4) return;
            
            checkTeam(gameRoom.players);
            createGameCards(roomId);
        });

        socket.on("playCard", (roomId, card) => {
            playCard(socket, roomId, card);
        })

        socket.on("nextHand", (roomId) => {
            let gameRoom = games[roomId];
            if (!gameRoom) return;
            nextHand(roomId)
            handleCardBuying(roomId)
        })

        socket.on("disconnect", () => {
            const roomId = socket.playerData.roomId;
            kickPlayer(roomId, socket.id);
        })



    })


}