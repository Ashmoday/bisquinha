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
        console.log(cards);
        return cards;

}

const valores = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const naipes = ['Copas', 'Ouros', 'Paus', 'Espadas'];

// Função para criar um baralho completo com cartas únicas
// function criarBaralho() {
//     let id = 0;
//   const baralho = [];
//   for (const naipe of naipes) {
//     for (const valor of valores) {
//       const carta = { valor, naipe, id: id++  };
//       baralho.push(carta);
//     }
//   }
//   console.log(baralho);
//   return baralho;
// }


// function generateId() {
//     return '-' + Math.random().toString(36).substr(2, 9);
// }

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173"
    }
});

async function main() {
    io.on('connect', (socket) => {
        console.log('user connected', socket.id);
        createCards();
    })

    httpServer.listen(PORT, () => {
        console.log("server started")
    })
    
}


main();