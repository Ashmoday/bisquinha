<script setup>
  import { io } from "socket.io-client";
  import { onMounted } from "vue";

  const socket = io("ws://localhost:3002");

  onMounted( () => {
    socket.on('connect', () => {

    })
    console.log("test")
    
  })

  function startGame(){
      console.log('meu ovo');
      socket.emit("start");
    }

</script>

<template>
  <h1>hello</h1>
  <button type="submit" @click="startGame">Start</button>
</template>