const express = require('express');
const app = express();
const { createServer } = require('http');
const { Server } = require('socket.io');
const PORT = 3002;

const httpServer = createServer(app);



const  cardValues= ['A', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'];
const cardSuits = ['Copas', 'Ouros', 'Paus', 'Espadas'];

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
    console.log(cards);
}


const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173"
    }
});

async function main() {
    io.on('connect', (socket) => {
        console.log('user connected', socket.id);

        socket.on("start", () => {
            const cards = createCards();
            shuffle(cards);
        });
    })

    httpServer.listen(PORT, () => {
        console.log("server started")
    })
    
}


main();