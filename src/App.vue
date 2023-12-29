<script setup>
  import { io } from "socket.io-client";
  import { onMounted, ref } from "vue";

  const socket = io("ws://localhost:3002");
  const playerName = ref('');

  onMounted( () => {
    socket.on('connect', () => {
    });
    
    socket.on('gameData', ({ hands, players }) => {
      console.log("Mãos: ", hands);
      console.log("Jogadores: ", players);
    })
    


  })

  function startGame(){
      socket.emit("start", playerName.value);
    }

</script>

<template>
  <h1>hello</h1>
  <input v-model="playerName" placeholder="Seu nome" />
  <button type="submit" @click="startGame">Start</button>
</template>