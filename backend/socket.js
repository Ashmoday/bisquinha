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
    nextPlayer
} = require('./gameManager');



const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173"
    }
});



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
        })
    })


}