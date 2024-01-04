<script setup>
  import { io } from "socket.io-client";
  import { onMounted, ref } from "vue";
  const socket = io("ws://localhost:3002");
  let players = [];
  const playerName = ref('');
  const playerHands = ref([]);
  let playingHand = [];
  const playedCards = ref([]);
  let currentPlayer = ref([]);
  let gameStarted = ref(false);



  onMounted(() => {
    socket.on('connect', () => {
    });
       
  })


  socket.on('nextPlayer', (currentPlayerIndex) => {
    currentPlayer = players[currentPlayerIndex];
  })
  socket.on('clearTable', () => {
    playedCards.value = [];
    playingHand = [];
  })
  
  socket.on('cardPlayed', ({ card, cardOwner }) => {
    // Adicione a carta jogada à lista
    playedCards.value.push({ card, cardOwner });
});
  socket.on('players', (serverPlayers) => {
        players = serverPlayers;
  })
      socket.on('gameData', ({ hands, playerNames }) => {
      playerHands.value = hands;
      playerNames.value = playerNames;
    });

  function enterGame(){
      socket.emit("enterGame", playerName.value);
      
  }

  function startGame() {
        socket.emit("start")
        socket.on('gameData', ({ hands, playerNames }) => {
        playerHands.value = hands;
        playerNames.value = playerNames; 
        gameStarted.value = true;
      
    })
  }
  function playCard(card, cardOwner) {
    
    if (cardOwner === playerName.value) {
      playingHand.push({card, cardOwner});
      // playedCards.value.push({ card, cardOwner });

      socket.emit("playCard", (card))
    } else {
      console.log(`Você não pode jogar a carta da mão de ${cardOwner}.`);
    }
  }

  function buyCard() {
    socket.emit("buyCard");

  }

  function nextHand(playingHand) {
    socket.emit('nextHand', (playingHand));
  }

  function selectTeam(team) {
    socket.emit("selectTeam", team);
  }




  function getCardSuitSymbol(cardSuit) {
  switch (cardSuit) {
    case 'Copas':
      return '&#x2665;'; // Coração
    case 'Ouros':
      return '&#x2666;'; // Diamante
    case 'Paus':
      return '&#x2663;'; // Paus
    case 'Espadas':
      return '&#x2660;'; // Espadas
    default:
      return '';
  }
}


function getCardSuitColor(cardSuit) {
  switch (cardSuit) {
    case 'Copas':
      return 'red';
    case 'Ouros':
      return 'orange';
    case 'Paus':
    case 'Espadas':
      return 'black';
    default:
      return '';
  }
}

</script>
<template>
  <div>
    <img src="./logo.png" alt="Logo" class="logo" />
    <div class="center-container">
      <div class="player-name-container">
      <input v-model="playerName" placeholder="Seu nome" />
      <button type="submit" @click="enterGame">Entrar</button>
    </div>
      <button id="iniciar_partida" type="submit" @click="startGame">Iniciar Partida</button>
      </div>    

      <p v-if="gameStarted && currentPlayer">{{ currentPlayer.name }}</p>

       <div v-for="(hand, index) in playerHands" :key="hand.id">
      <p>{{ hand.name }}'s Mão do time {{ hand.team }}:</p>
      <ul class="card-container">
        <li v-for="card in hand.cards" :key="card.id" @click="playCard(card, hand.name)" class="card">
          <span class="card-value" :style="{ color: getCardSuitColor(card.cardSuit) }"  >{{ card.cardValue }}</span>
          <span class="card-suit" :style="{ color: getCardSuitColor(card.cardSuit) }" v-html="getCardSuitSymbol(card.cardSuit)"></span>
        </li>
      </ul>
    </div>
    <div v-if="playedCards.length > 0">
    <h2>Cartas Jogadas:</h2>
    <ul>
        <li v-for="(play, index) in playedCards" :key="index" class="played-card">
            {{ play.card }} (Jogador: {{ play.cardOwner }})
        </li>
    </ul>
</div>

    <button type="submit" @click="buyCard">Buy Card</button>

    <button type="submit" @click="nextHand(playedCards)">Next Hand</button>

    <button type="submit" @click="selectTeam(1)">Time 1</button>
    <button type="submit" @click="selectTeam(2)">Time 2</button>

    

  </div>
</template>



<style scoped>
.card {
  width: 100px;
  height: 150px;
  border: 1px solid #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 10px;
  border-radius: 6px;
}

.card-suit {
  font-size: 20px;
}

.card-value {
  font-size: 24px;
}
.card-container {
  display: flex; /* Torna os elementos filhos flexíveis (um ao lado do outro) */
  list-style-type: none; /* Remove os marcadores de lista padrão */
  padding: 0; /* Remove o preenchimento padrão da lista */
  margin: 0; /* Remove a margem padrão da lista */
}
</style>
