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
  let trump = ref(null)
  const gameCards = ref([]);
  let player;


  onMounted(() => {
    socket.on('connect', () => {
    });
  });

  socket.on('gameStart', (cards) => {
    gameCards.value = cards;
    trump = gameCards.value.cards[gameCards.value.cards.length - 1];
    // console.log(trump)
    console.log(playerHands)
    player = players.find(player => player.name === playerName.value);
    console.log(player);

  })

  // socket.on('gameStart', ({gameStart, trump2}) => {
  //   gameStarted.value = gameStart;

  //   trump.value.push({trump2})
  //   console.log('oii', gameStarted.value)
  //   console.log('trump', trump)
  // })
  socket.on('started', (gameStatus) => {
      gameStarted= gameStatus
      console.log(gameStarted);
  })

  socket.on('nextPlayer', (currentPlayerIndex) => {
    currentPlayer = players[currentPlayerIndex];
  });

  socket.on('clearTable', () => {
    playedCards.value = [];
    playingHand = [];
  });

  socket.on('cardPlayed', ({ card, cardOwner }) => {
    playedCards.value.push({ card, cardOwner });
  });

  let connectedPlayers = ref(0);  

  socket.on('players', (serverPlayers) => {
    players = serverPlayers;
    connectedPlayers.value = players.length;
  });

  socket.on('gameData', ({ hands, playerNames }) => {
    playerHands.value = hands;
    playerNames.value = playerNames;
  });

  const waitingForPlayers = ref(true);

  const enteringGame = ref(true);

  const enteredGame = ref(false);

  function enterGame() {
    socket.emit("enterGame", playerName.value);
    waitingForPlayers.value = false;
    enteringGame.value = false;
    enteredGame.value = true;
  }

  function startGame() {
        socket.emit("start")
        socket.on('gameData', ({ hands, playerNames }) => {
        playerHands.value = hands;
        playerNames.value = playerNames;      
    })
  }

  function playCard(card, cardOwner) {
    if (cardOwner === playerName.value) {
      playingHand.push({ card, cardOwner });
      socket.emit("playCard", card);
    } else {
      console.log(`Você não pode jogar a carta da mão de ${cardOwner}.`);
    }
  }

  function nextHand(playingHand) {
    socket.emit('nextHand', playingHand);
  }

  function selectTeam(team) {
    if (gameStarted == true) return;
    socket.emit("selectTeam", team);
  }

  function getPipCount(value) {
    const numericValue = parseInt(value);
    return isNaN(numericValue) ? 1 : numericValue;
  }
</script>

<template>
  <div :class="{ 'app': true, 'white-background': !waitingForPlayers }">-
    <img v-if="waitingForPlayers && !enteredGame" src="\logo2.png" alt="Logo" class="logo" :class="{ 'logo-entered': enteredGame }" />
    <div class="center-container" v-if="waitingForPlayers">
      <div class="player-name-container">
        <input v-model="playerName" placeholder="Seu nome" />
        <button type="submit" @click="enterGame">Entrar</button>
      </div>
    </div>
    <div class="top-container"></div>
    <h1 class="player-greeting" v-if="enteredGame && playerName">
      Olá, <span class="player-name">{{ playerName }}.</span>
    </h1>
    <div class="botoes-times" v-if="enteredGame">
      <button type="submit" @click="nextHand(playedCards)">Next Hand</button>
      <button type="submit" @click="selectTeam(1)">Time 1</button>
      <button type="submit" @click="selectTeam(2)">Time 2</button>
    </div>
    <button v-if="!waitingForPlayers" id="iniciar_partida" type="submit" @click="startGame">Iniciar Partida</button>
    <h2 v-if="enteredGame && !gameStarted">
      {{ connectedPlayers < 4 ? 'Aguardando a conexão dos jogadores...' : '4 jogadores conectados. Aguardando o início da partida!' }}
    </h2>
    <p v-if="gameStarted && currentPlayer">{{ currentPlayer.name }}</p>



    <div v-for="(hand, index) in playerHands" :key="hand.id">
      <p>{{ hand.name }}'s Mão do time {{ hand.team }}:</p>
      <ul v-if="gameStarted && player.team == hand.team" class="card-container">
        <li v-for="card in hand.cards" :key="card.id" @click="playCard(card, hand.name)">
          <div class="card" :data-suit="card.cardSuit" :data-value="card.cardValue">
            <div v-for="index in getPipCount(card.cardValue)" :key="index" class="pip"></div>
            <div class="corner-number top">{{ card.cardValue }}</div>
            <div class="corner-number bottom">{{ card.cardValue }}</div>
          </div>
        </li>
      </ul>
      <ul v-else class="card-container">
        <li v-for="card in hand.cards" :key="card.id">
          <div class="back"></div> 
        </li>
      </ul> 
    </div>
      <div v-if="trump" class="trump">
        Trunfo
        <div class="card" :data-suit="trump.cardSuit" :data-value="trump.cardValue">
          <div v-for="index in getPipCount(trump.cardValue)" :key="index" class="pip"></div>
          <div class="corner-number top">{{ trump.cardValue }}</div>
          <div class="corner-number bottom">{{ trump.cardValue }}</div>
        </div>
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
    <div class="footer" v-if="waitingForPlayers">
      <p><strong>Criado por:</strong> Henrique Krause e Guilherme Lima</p>
      <p>Todos os direitos reservados. ©</p>
    </div>
    
  </div>



</template>




<style>

@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap');

*, *::before, *::after {
  box-sizing: border-box;
}

.footer{
    font-family: 'Poppins', sans-serif;
    background-color: #333;
    color: #fff;
    height: 60px;
    width: 100%;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 30px;
}

.sair{
    color: white;
    text-decoration: none;
}

.botoes-times button{
  flex-direction: flex;
  padding: 15px;
  background-color: #d6d5d5;
  color: rgb(0, 0, 0); /* Cor do texto branco */
  border: 2px solid black;
  padding: 10px 20px; /* Preenchimento interno */
  font-size: 16px; /* Tamanho da fonte */
  border: none; /* Remover borda */
  border-radius: 5px; /* Borda arredondada */
  cursor: pointer; /* Cursor ao passar por cima */
  margin-right: 10px; /* Margem à direita para espaçamento entre os botões */
  margin-bottom: 20px;
  }

.botoes-times button:hover{
  background-color: #a2a2a2;
  }

.white-background {
  height: 100vh; 
  width: 70vw; 
  background-color: white;
}


.logo-corner {
  position: fixed;
  height: 150px;
  width: 150px;
  top: 10px;
  left: 10px;
}

.logo {
  height: 350px;
  width: 350px;
  margin: 0 auto;
  display: block;
  transition: transform 0.5s ease-in-out;
}

.logo:hover {
  transform: scale(1.2); 
}

.player-greeting {
  margin: 0;
  font-size: 1.5em;
  color: black; /* Cor do "Olá" */
  margin-bottom: 10px;
}

.player-name {
  font-weight: bold;
  color: green; /* Cor do nome do jogador */
}


.card-container {
  display: flex;
  list-style-type: none; 
  padding: 0; 
  margin: 0; 
}

.card {
  font-family: Verdana;
  --width: 10em; 
  --height: calc(var(--width) * 1.4);
  width: var(--width);
  height: var(--height);
  background-color: white;
  border: 1px solid black;
  border-radius: .25em;
  padding: 1.5em;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(8, 1fr);
  align-items: center;
  position: relative; 
  margin-left: 5px;
}

.back {
  --width: 5em;
  --height: calc(var(--width) * 1.4);
  width: var(--width);
  height: var(--height);
  background-color: rgb(92, 39, 39);
  background-image: url("assets/imgs/back.png");
  background-size: cover;  /* Adicione esta linha para cobrir completamente o espaço */
  background-position: center;
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

.card:hover{
    transform: scale(1.05);
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
  top: .10em;
  left: .20em;
}

.corner-number.bottom {
  bottom: .10em;
  right: .20em;
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

[data-value="A"] .pip {
  grid-row-start: 2;
  grid-column-start: 1;
  grid-row-end: span 6;
  grid-column-end: span 3;
}

[data-value="J"] .pip,
[data-value="Q"] .pip,
[data-value="K"] .pip {
  grid-row-start: 1; 
  grid-column-start: 1; 
  grid-row-end: span 8; 
  grid-column-end: span 3; 
  height: 100%; 
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