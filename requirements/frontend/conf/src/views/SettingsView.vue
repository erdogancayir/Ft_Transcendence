<template>
  <div class="settings w3-animate-zoom">
    <h1>Settings</h1>
    <br>
    <button class="w3-btn w3-btn-block w3-green" v-if="!isActive" v-on:click="AuthActive()">Authenticator on</button>
    <button class="w3-btn w3-btn-block w3-green" v-if="isActive" v-on:click="AuthDeactive()">Authenticator off</button>
    <br>
    <br>
    <button class="w3-btn w3-btn-block w3-green" v-on:click="SingOut()">SingOut</button>
    <br>
    <br>
    <button class="w3-btn w3-btn-block w3-red" v-on:click="DeleteAccount()">Delete Account</button> <br>
    <img :src="qrData" v-if="imageActive" alt=""><br>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useCookies } from "vue3-cookies";
import axios from 'axios'
const { cookies } = useCookies();

export default defineComponent({
  data() {
    return {
      isActive: true,
      qrData: "",
      imageActive: false
    }
  },
  beforeMount() {
    if (cookies.get("token") == null)
      this.$router.push({ path: '/' });
  },
  async created() {
    const Article = {
        state: false
      }

    axios.post(process.env.VUE_APP_BACKEND_URL + "/users/getfactory", Article, {
        headers: { 'Authorization': 'Bearer ' + cookies.get("token") }
      }).then(response => {
        if (response.data == true)
          this.isActive = true
        else if (response.data == false)
          this.isActive = false
      }).catch(error => {
        return ;  
      })
  },
  methods: {
    getQr() {
    const QrArticle = {
        code: "empty"
    };
    const qrheaders = {
        headers: {
          'Authorization': 'Bearer ' + cookies.get("token")
        }
      }
    axios.post(process.env.VUE_APP_BACKEND_URL + "/users/qrcode", QrArticle, qrheaders)
      .then(response => {
        this.qrData = response.data.qrData;
        }).catch(error => {
        return;
    })
  },
    SingOut() {
      let answer = confirm("Hesabından çıkış yapılsın mı?");
      if (answer == false)
        return;

      cookies.remove('token');
      this.$router.push({ path: '/' }).then(() => {
        this.$router.go(0);
      });
    },
    AuthDeactive() {
      const Article = {
        state: false
      }

      axios.post(process.env.VUE_APP_BACKEND_URL + "/users/twofactory", Article, {
        headers: { 'Authorization': 'Bearer ' + cookies.get("token") }
      }).then(response => {
          this.isActive = false;
          this.imageActive = false;
      })
    },
    AuthActive() {
      const Article = {
        state: true
      }

      axios.post(process.env.VUE_APP_BACKEND_URL + "/users/twofactory", Article, {
        headers: { 'Authorization': 'Bearer ' + cookies.get("token") }
      }).then(response => {
          this.getQr();
          this.isActive = true;
          this.imageActive = true; 
      })
    },
    async DeleteAccount() {
      let answer = confirm("Hesabın kalıcı olarak silinsin mi?");
      if (answer == false)
        return;
      await fetch(process.env.VUE_APP_BACKEND_URL + '/users/deleteAccount', {
        headers: {
          'Authorization': 'Bearer ' + cookies.get("token")
        }
      });
      cookies.remove('token');
      this.$router.push({ path: '/' });
    }
  },
});
</script>