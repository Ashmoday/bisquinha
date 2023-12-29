<script>
  import { io } from "socket.io-client";
  import { onMounted } from "vue";

  const socket = io("ws://localhost:3002");

  onMounted( () => {
    socket.on('connect', () => {

    })
  })

</script>

<template>
  <h1>hello</h1>
</template>