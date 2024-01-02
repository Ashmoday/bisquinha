<script setup>
  import { io } from "socket.io-client";
  import { onMounted, ref } from "vue";
  const socket = io("ws://localhost:3002");
  const playerName = ref('');

  onMounted(() => {
    socket.on('connect', () => {
    });

    socket.on('gameData', ({ hands, players }) => {
      console.log("Mãos: ", hands);
      console.log("Jogadores: ", players);
    });
  });

  function startGame() {
    socket.emit("start", playerName.value);
  }
</script>
<template>
  <div id="app">
    <img src="./logo.png" alt="Logo" class="logo" />

    <div class="center-container">
      <div class="player-name-container">
        <input v-model="playerName" placeholder="Seu nome" />
        <button type="submit" @click="startGame">Jogar</button>
      </div>
    </div>
  </div>
</template>
