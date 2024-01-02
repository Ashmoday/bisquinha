<script setup>
  import { io } from "socket.io-client";
  import { onMounted, ref } from "vue";

  const socket = io("ws://localhost:3002");
  let players = [];
  const playerName = ref('');
  const playerHands = ref([]);
  let playingHand = [];
  const playedCards = ref([]); // Adicione isso para manter o controle das cartas jogadas


  onMounted( () => {
    socket.on('connect', () => {
    });
       

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
    })
  }
  function playCard(card, cardOwner) {
    
    if (cardOwner === playerName.value) {
      playingHand.push({card, cardOwner});
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

</script>

<template>
  <div>
      <h1>hello</h1>
      <input v-model="playerName" placeholder="Seu nome" />
      <button type="submit" @click="enterGame">Entrar</button>

      <button type="submit" @click="startGame">Iniciar Partida</button>



       <div v-for="(hand, index) in playerHands" :key="hand.id">
      <p>{{ hand.name }}'s Mão do time {{ hand.team }}:</p>
      <ul>
        <li v-for="card in hand.cards" :key="card.id" @click="playCard(card, hand.name)">
          {{ card.cardValue }} de {{ card.cardSuit }}
        </li>
      </ul>
    </div>
    <div v-if="playedCards.length > 0">
    <h2>Cartas Jogadas:</h2>
    <ul>
        <li v-for="(play, index) in playedCards" :key="index">
            {{ play.card }} (Jogador: {{ play.cardOwner }})
        </li>
    </ul>
</div>

    <button type="submit" @click="buyCard">Buy Card</button>

    <button type="submit" @click="nextHand(playingHand)">Next Hand</button>

    <button type="submit" @click="selectTeam(1)">Time 1</button>
    <button type="submit" @click="selectTeam(2)">Time 2</button>

    

  </div>
</template>