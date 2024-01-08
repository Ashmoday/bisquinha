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
  let trump = ref([])
  const gameCards = ref([]);

  onMounted(() => {
    socket.on('connect', () => {
      if (gameStarted.value) {
        applyWhiteBackground();
      }
    });
  });

  socket.on('gameStart', (cards) => {
    // gameCards.value = [];
    gameCards.value = cards
    console.log(gameCards.value);
    console.log("oi", gameCards.value.cards.length)
    trump = gameCards.value.cards[gameCards.value.cards.length - 1];

  })

  // socket.on('gameStart', ({gameStart, trump2}) => {
  //   gameStarted.value = gameStart;

  //   trump.value.push({trump2})
  //   console.log('oii', gameStarted.value)
  //   console.log('trump', trump)
  // })

  socket.on('nextPlayer', (currentPlayerIndex) => {
    currentPlayer = players[currentPlayerIndex];
  })
  socket.on('clearTable', () => {
    playedCards.value = [];
    playingHand = [];
  })
  
  socket.on('cardPlayed', ({ card, cardOwner }) => {
    playedCards.value.push({ card, cardOwner });
});
  socket.on('players', (serverPlayers) => {
        players = serverPlayers;
  })
      socket.on('gameData', ({ hands, playerNames }) => {
      playerHands.value = hands;
      playerNames.value = playerNames;
    });

    function applyWhiteBackground() {
    const appElement = document.getElementById('app');
    const logoElement = document.querySelector('.logo');

    if (appElement && logoElement) {
      appElement.style.backgroundColor = 'white';
      appElement.style.border = '1px solid #636363';
      appElement.style.width = '50%';
      appElement.style.height = '100%';  // Corrigido para cobrir toda a altura da página
      appElement.style.margin = '0 auto';
      appElement.style.background = 'linear-gradient(to right, #f0f0f0, white)';

      logoElement.style.width = '150px'; 
      logoElement.style.height = '150px'; 
      logoElement.style.margin = '10px'; 
      logoElement.style.position = 'fixed'; 
      logoElement.style.top = '10px'; 
      logoElement.style.left = '40px'; 
    }

    enteringGame.value = true;
  }

  function enterGame(){
      socket.emit("enterGame", playerName.value);
      applyWhiteBackground();
  }

  function startGame() {
        socket.emit("start")
        socket.on('gameData', ({ hands, playerNames }) => {
        playerHands.value = hands;
        playerNames.value = playerNames; 
        // gameStarted.value = true;
      
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

  function nextHand(playingHand) {
    socket.emit('nextHand', (playingHand));
  }

  function selectTeam(team) {
    socket.emit("selectTeam", team);
  }





function getPipCount(value) {
      const numericValue = parseInt(value);
      return isNaN(numericValue) ? 1 : numericValue;
    }
  
</script>
<template>
  <div class="app">
    <img src="./logo.png" alt="Logo" class="logo" />
    <div class="center-container">
      <div class="player-name-container">
        <input v-model="playerName" placeholder="Seu nome" />
        <button type="submit" @click="enterGame">Entrar</button>
      </div>
      <button id="iniciar_partida" type="submit" @click="startGame">Iniciar Partida</button>
    </div>    

    <h2 v-if="enteringGame">Aguardando a conexão de todos os jogadores...</h2>
    <p v-if="gameStarted && currentPlayer">{{ currentPlayer.name }}</p>

    <div v-for="(hand, index) in playerHands" :key="hand.id">
      <p>{{ hand.name }}'s Mão do time {{ hand.team }}:</p>
      <ul class="card-container">
        <li v-for="card in hand.cards" :key="card.id" @click="playCard(card, hand.name)">
          <div class="card" :data-suit="card.cardSuit" :data-value="card.cardValue">
          <div v-for="index in getPipCount(card.cardValue)" :key="index" class="pip"></div>
          <div class="corner-number top">{{ card.cardValue }}</div>
          <div class="corner-number bottom">{{ card.cardValue }}</div>
          </div>
        </li>
      </ul>
    </div>

    <div v-if="playedCards.length > 0">
    <h2>Cartas Jogadas:</h2>
    <ul class="card-container">
        <li v-for="(play, index) in playedCards" :key="index" class="played-card">
        (Jogador: {{ play.cardOwner }}) 
        <div class="card" :data-suit="play.card.cardSuit" :data-value="play.card.cardValue">
        <div v-for="index in getPipCount(play.card.cardValue)" :key="index" class="pip"></div>
        <div class="corner-number top">{{ play.card.cardValue }}</div>
        <div class="corner-number bottom">{{ play.card.cardValue }}</div>
        </div>
        </li>
      </ul>
    </div>

    <button type="submit" @click="nextHand(playedCards)">Next Hand</button>
    <button type="submit" @click="selectTeam(1)">Time 1</button>
    <button type="submit" @click="selectTeam(2)">Time 2</button>

  </div>
  <div class="trump">
        Trunfo
        <div class="card" :data-suit="trump.cardSuit" :data-value="trump.cardValue">
        <div v-for="index in getPipCount(trump.cardValue)" :key="index" class="pip"></div>
        <div class="corner-number top">{{ trump.cardValue }}</div>
        <div class="corner-number bottom">{{ trump.cardValue }}</div>
         </div>
  </div>
</template>



<style>
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  background-color: #DDD;
  display: flex;
  flex-wrap: wrap;
  gap: .5em;
}

.card-container {
  display: flex;
  list-style-type: none; 
  padding: 0; 
  margin: 0; 
}

.card {
  --width: 10em; /* Alterado para um valor maior */
  --height: calc(var(--width) * 1.4);
  width: var(--width);
  height: var(--height);
  background-color: white;
  border: 1px solid black;
  border-radius: .25em;
  padding: 1em;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(8, 1fr);
  align-items: center;
  position: relative;
  margin-left: 5px;
}


[data-suit="heart"].card,
[data-suit="diamond"].card {
  color: red;
}

[data-suit="spade"].card,
[data-suit="club"].card {
  color: black;
}

.pip {
  grid-row-end: span 2;
  width: 100%;
  aspect-ratio: 1 / 1;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}

[data-suit="heart"] .pip {
  background-image: url("assets/imgs/heart.svg");
}

[data-suit="diamond"] .pip {
  background-image: url("assets/imgs/diamond.svg");
}

[data-suit="spade"] .pip {
  background-image: url("assets/imgs/spade.svg");
}

[data-suit="club"] .pip {
  background-image: url("assets/imgs/club.svg");
}

.corner-number {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  letter-spacing: -.1em;
  font-size: 1.5em;
}

.corner-number.top {
  top: .25em;
  left: .25em;
}

.corner-number.bottom {
  bottom: .25em;
  right: .25em;
  transform: rotate(180deg);
}

.corner-number::after {
  line-height: 0;
  display: block;
  width: .5em;
}

[data-suit="heart"] .corner-number::after {
  content: url("assets/imgs/heart.svg");
}

[data-suit="spade"] .corner-number::after {
  content: url("assets/imgs/spade.svg");
}

[data-suit="club"] .corner-number::after {
  content: url("assets/imgs/club.svg");
}

[data-suit="diamond"] .corner-number::after {
  content: url("assets/imgs/diamond.svg");
}

[data-value="J"][data-suit="diamond"] .pip{
  background-image: url("assets/imgs/3_11.svg");
}

[data-value="J"][data-suit="heart"] .pip {
  background-image: url("assets/imgs/1_11.svg");
}

[data-value="J"][data-suit="spade"] .pip{
  background-image: url("assets/imgs/0_11.svg");
}

[data-value="J"][data-suit="club"] .pip {
  background-image: url("assets/imgs/2_11.svg");
}

[data-value="Q"][data-suit="diamond"] .pip{
  background-image: url("assets/imgs/3_12.svg");
}
[data-value="Q"][data-suit="heart"] .pip {
  background-image: url("assets/imgs/1_12.svg");
}

[data-value="Q"][data-suit="spade"] .pip{
  background-image: url("assets/imgs/0_12.svg");
}

[data-value="Q"][data-suit="club"] .pip {
  background-image: url("assets/imgs/2_12.svg");
}

[data-value="K"][data-suit="diamond"] .pip{
  background-image: url("assets/imgs/3_13.svg");
}

[data-value="K"][data-suit="heart"] .pip {
  background-image: url("assets/imgs/1_13.svg");
}

[data-value="K"][data-suit="spade"] .pip{
  background-image: url("assets/imgs/0_13.svg");
}

[data-value="K"][data-suit="club"] .pip {
  background-image: url("assets/imgs/2_13.svg");
}

[data-value="A"] .pip,
[data-value="J"] .pip,
[data-value="Q"] .pip,
[data-value="K"] .pip {
  grid-row-start: 2;
  grid-column-start: 1;
  grid-row-end: span 6;
  grid-column-end: span 3;
}

[data-value="2"] .pip:first-child {
  grid-row-start: 1;
  grid-column-start: 2;
}

[data-value="2"] .pip:nth-child(2) {
  grid-row-start: 7;
  grid-column-start: 2;
  transform: rotate(180deg);
}

[data-value="3"] .pip:first-child {
  grid-row-start: 1;
  grid-column-start: 2;
}

[data-value="3"] .pip:nth-child(2) {
  grid-row-start: 4;
  grid-column-start: 2;
}

[data-value="3"] .pip:nth-child(3) {
  grid-row-start: 7;
  grid-column-start: 2;
  transform: rotate(180deg);
}

[data-value="4"] .pip:first-child {
  grid-row-start: 1;
  grid-column-start: 1;
}

[data-value="4"] .pip:nth-child(2) {
  grid-row-start: 1;
  grid-column-start: 3;
}

[data-value="4"] .pip:nth-child(3) {
  grid-row-start: 7;
  grid-column-start: 1;
  transform: rotate(180deg);
}

[data-value="4"] .pip:nth-child(4) {
  grid-row-start: 7;
  grid-column-start: 3;
  transform: rotate(180deg);
}

[data-value="5"] .pip:first-child {
  grid-row-start: 1;
  grid-column-start: 1;
}

[data-value="5"] .pip:nth-child(2) {
  grid-row-start: 1;
  grid-column-start: 3;
}

[data-value="5"] .pip:nth-child(3) {
  grid-row-start: 7;
  grid-column-start: 1;
  transform: rotate(180deg);
}

[data-value="5"] .pip:nth-child(4) {
  grid-row-start: 7;
  grid-column-start: 3;
  transform: rotate(180deg);
}

[data-value="5"] .pip:nth-child(5) {
  grid-row-start: 4;
  grid-column-start: 2;
}

[data-value="6"] .pip:first-child {
  grid-row-start: 1;
  grid-column-start: 1;
}

[data-value="6"] .pip:nth-child(2) {
  grid-row-start: 1;
  grid-column-start: 3;
}

[data-value="6"] .pip:nth-child(3) {
  grid-row-start: 7;
  grid-column-start: 1;
  transform: rotate(180deg);
}

[data-value="6"] .pip:nth-child(4) {
  grid-row-start: 7;
  grid-column-start: 3;
  transform: rotate(180deg);
}

[data-value="6"] .pip:nth-child(5) {
  grid-row-start: 4;
  grid-column-start: 1;
}

[data-value="6"] .pip:nth-child(6) {
  grid-row-start: 4;
  grid-column-start: 3;
}

[data-value="7"] .pip:first-child {
  grid-row-start: 1;
  grid-column-start: 1;
}

[data-value="7"] .pip:nth-child(2) {
  grid-row-start: 1;
  grid-column-start: 3;
}

[data-value="7"] .pip:nth-child(3) {
  grid-row-start: 7;
  grid-column-start: 1;
  transform: rotate(180deg);
}

[data-value="7"] .pip:nth-child(4) {
  grid-row-start: 7;
  grid-column-start: 3;
  transform: rotate(180deg);
}

[data-value="7"] .pip:nth-child(5) {
  grid-row-start: 4;
  grid-column-start: 1;
}

[data-value="7"] .pip:nth-child(6) {
  grid-row-start: 4;
  grid-column-start: 3;
}

[data-value="7"] .pip:nth-child(7) {
  grid-row-start: 2;
  grid-column-start: 2;
}

</style>
