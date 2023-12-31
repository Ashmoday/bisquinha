<script setup>
  import { io } from "socket.io-client";
  import { onMounted, ref } from "vue";

  const socket = io("ws://localhost:3002");
  let players = [];
  const playerName = ref('');
  const playerNames = ref({});
  const playerHands = ref([]);
  let playingHand = [];

  onMounted( () => {
    socket.on('connect', () => {
    });
       
     

  })
  socket.on('players', (serverPlayers) => {
        players = serverPlayers;
      })

  function startGame(){
      socket.emit("start", playerName.value);
      
      socket.on('gameData', ({ hands, playerNames }) => {
        playerHands.value = hands;
        playerNames.value = playerNames;
        console.log(playerHands.value[0].cards);

        
    })
  }
  function playCard(card, cardOwner) {
    if (cardOwner === playerName.value) {
      console.log(`Carta jogada por ${playerName.value}: ${card.cardValue} de ${card.cardSuit}`);
      playingHand.push({card, cardOwner});
      console.log("mao jogada", playingHand);
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
    console.log('rodou1');
  }

</script>

<template>
  <div>
      <h1>hello</h1>
      <input v-model="playerName" placeholder="Seu nome" />
      <button type="submit" @click="startGame">Start</button>

       <div v-for="(hand, index) in playerHands" :key="hand.id">
      <p>{{ hand.name }}'s Mão:</p>
      <ul>
        <li v-for="card in hand.cards" :key="card.id" @click="playCard(card, hand.name)">
          {{ card.cardValue }} de {{ card.cardSuit }}
        </li>
      </ul>
    </div>

    <button type="submit" @click="buyCard">Buy Card</button>

    <button type="submit" @click="nextHand(playingHand)">Next Hand</button>

  </div>
</template>