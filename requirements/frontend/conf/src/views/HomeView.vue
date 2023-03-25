<template>
  <div class="home w3-animate-zoom">
    <br>
    <img alt="Vue logo" src="../assets/pongGame.jpg"  style="border-radius: 50%;max-width: 500px; width: 80%;">
    <h1>Welcome to pong game</h1>
    <button class="w3-btn w3-btn-block w3-green" v-on:click="SingInClick()">SingIn</button> <button
      class="w3-btn w3-btn-block w3-green" v-on:click="RegisterClick()">Register</button> <br>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useCookies } from "vue3-cookies";
const { cookies } = useCookies();

export default defineComponent({
  methods: {
    SingInClick() {
      this.$router.push({ path: 'singIn' });
    },
    RegisterClick() {
      this.$router.push({ path: 'register' });
    }
  },
  beforeMount() {
    if (cookies.get("token") != null)
      this.$router.push({ path: '/profile/me' });
  }
});
</script>
