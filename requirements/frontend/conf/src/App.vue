<template>
  <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">

  <button v-on:click="leftPanelVisibility = true" class=" w3-button w3-green" style="left: 0px; z-index: 1; position: absolute;"><i
      class="fa fa-bars w3-large"></i></button>
  <div v-if="leftPanelVisibility" class="w3-overlay w3-animate-opacity"
    v-on:click="leftPanelVisibility = false" style="cursor:pointer" :style="{display:'block'}">
  </div>
  <nav v-if="leftPanelVisibility" class="w3-sidebar w3-light-grey w3-bar-block w3-animate-left w3-card" style="width:200px;z-index: 3;">
    Pong Game
    <br>
    <br>
    <router-link v-if="signedIn" to="/profile/me" class="w3-bar-item w3-button">Profile</router-link>
    <router-link v-if="signedIn" to="/game" class="w3-bar-item w3-button">Game</router-link>
    <router-link v-if="signedIn" to="/chat" class="w3-bar-item w3-button">Chat</router-link>
    <router-link v-if="signedIn" to="/settings" class="w3-bar-item w3-button">Settings</router-link>

    <router-link v-if="!signedIn" to="/" class="w3-bar-item w3-button">Home</router-link>
    <router-link v-if="!signedIn" to="/singIn" class="w3-bar-item w3-button">Sing In</router-link>
    <router-link v-if="!signedIn" to="/register" class="w3-bar-item w3-button">Register</router-link>
    <router-link to="/about" class="w3-bar-item w3-button">About</router-link>
    <button v-on:click="leftPanelVisibility = false" class="w3-button w3-red " style="margin-top: 30px;"><i
        class="fa fa-close w3-large"></i></button>
  </nav>
  <br>
  <br>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>

<script lang="ts">
import { defineComponent } from 'vue';
import { useCookies } from "vue3-cookies";
const { cookies } = useCookies();
import jwt_decode, { JwtPayload } from "jwt-decode";
import { io } from "socket.io-client";

export default defineComponent({
  data() {
    return {
      user: false,
      signedIn: false,
      global: this.$global as any,
      store: this.$store as any,
      leftPanelVisibility: false,
    }
  },
  watch: {
    '$router.currentRoute.value.fullPath': function (newValue) {
      this.signedIn = cookies.get("token") != null;
    },
  },
  methods: {
    TimeOut() {
      alert("Connection timed out!");
      this.$router.push({ path: '/' }).then(() => {
        this.$router.go(0);
      });
    }
  },
  created() {
    const token = cookies.get("token");
    if (token != null) {
      const decoded: any = jwt_decode(token);
      setTimeout(this.TimeOut, (decoded.exp * 1000) - Date.now())

      const socketOptions = { transportOptions: { polling: { extraHeaders: { Authorization: token, } } } };
      this.global.socket = io(process.env.VUE_APP_BACKEND_URL, socketOptions);
    }
    this.signedIn = (token != null);
  }
});
</script>