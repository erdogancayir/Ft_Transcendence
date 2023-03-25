<template>
  <div class="singIn w3-animate-zoom" v-if="!showQrInput">
    <br>
    <p v-if="intra">Waiting intra api</p>
    <div v-if="!intra" class="w3-modal-content w3-card-8" style="max-width:300px">
      <br>
      <input v-model="email" @keyup.enter="SingIn()" class="w3-input" type="text" placeholder="Email Address"><br>
      <input v-model="password" @keyup.enter="SingIn()" class="w3-input" type="password" placeholder="Password"><br>
      <br>
      <button class="w3-btn w3-btn-block w3-green" v-on:click="GoToRegisterInPage()">Register Page</button> <button
        :class="(email == '' || password == '') ? 'w3-disabled' : ''" class="w3-btn w3-btn-block w3-green"
        v-on:click="SingIn()">SingIn</button>
      <br>
      <br>
      <button class="w3-btn w3-btn-block w3-blue" v-on:click="SingInWithIntra()">SingIn With 42 Intra</button> <br>
    </div>
  </div>
  <div class="singIn w3-animate-zoom" v-if="showQrInput">
    <div class="w3-modal-content w3-card-8 mt-50" style="max-width:300px">
    <br>
      <br>
      <input v-model="code" @keyup.enter="postCode()" class="w3-input" type="text" placeholder="Code Type"><br>
      <button class="w3-btn w3-btn-block w3-blue" v-on:click="postCode()">Authorization Code</button> <br>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import axios from 'axios'
import { useCookies } from "vue3-cookies";
const { cookies } = useCookies();
import jwt_decode from "jwt-decode";
import { io } from "socket.io-client";
import { sha256 } from 'js-sha256';


export default defineComponent({

  data() {
    return {
      global: this.$global as any,
      email: "",
      password: "",
      intra: false,
      checker: false,
      showQrInput: false,
      code: "",
      resdata: ""
    }
  },
  beforeMount() {
    if (cookies.get("token") != null) {
      this.$router.push({ path: '/profile/me' });
      return;
    }
    this.IntraControl();
  },
  methods: {
    async postCode() {
      this.SetTimeOut(this.resdata);
      const _headers = {
        headers: {
          'Authorization': 'Bearer ' + cookies.get("token")
        }
      }
      const _article = {
        secret: "encoding",
        encoding: "ascii",
        code: this.code,
      };
      const response = await axios.post(process.env.VUE_APP_BACKEND_URL + "/users/Code", _article, _headers)
      if (response.data == true) {
        this.SocketConnect();
        this.$router.push({ path: '/profile/me' });
      }
      else { 
        cookies.remove("token");
        alert("Wrong auth code !");
      }
    },
    SocketConnect() {
      const token = cookies.get("token");
      if (token != null) {
        const socketOptions = { transportOptions: { polling: { extraHeaders: { Authorization: token, } } } };
        this.global.socket = io(process.env.VUE_APP_BACKEND_URL, socketOptions);
      }
    },
    SetTimeOut(token: string) {
      cookies.set("token", token, "45MIN");
      const decoded: any = jwt_decode(token);
      setTimeout(this.TimeOut, (decoded.exp * 1000) - Date.now())
    },
    TimeOut() {
      alert("Connection timed out!");
      this.$router.push({ path: '/' }).then(() => {
        this.$router.go(0);
      });
    },
    IntraControl() {
      var code: string | null = this.$route.query.code as string;
      if (code == null)
        return;
      this.intra = true;
      this.GetTokenWithIntra(code);
    },

    async FactoryControl() {
      const Article = {
        state: false
      }
      const response = await axios.post(process.env.VUE_APP_BACKEND_URL + "/users/getfactory", Article, {
        headers: { 'Authorization': 'Bearer ' + cookies.get("token") }
      })
      this.checker = response.data;
    },

    async GetTokenWithSingIn() {
      const article = {
        email: this.email,
        hash: sha256(this.password),
      };

      const headers = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }

      await axios.post(process.env.VUE_APP_BACKEND_URL + "/auth/signin", article, headers)
        .then(async response => {
          if (response.data == "Wrong Email Or Password!") {
            alert("Email veya şifre yanlış!")
            return;
          }
          this.resdata = response.data;
          this.SetTimeOut(response.data);
          await this.FactoryControl();
          if (this.checker == true) {
            this.showQrInput = true;
            cookies.remove("token");
            return;
          }

          this.SocketConnect();
          this.$router.push({ path: '/profile/me' });
        })
        .catch(error => {
          if (error.response.data.message[0] == "email must be an email") {
            alert("Email doğru değil!")
            return;
          }
          alert("Bir hata oluştu. Lütfen daha sonra tekrar deneyin!")
        });
    },
    GetTokenWithIntra(code: string) {
      const article = {
        code: code
      };

      const headers = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
      axios.post(process.env.VUE_APP_BACKEND_URL + "/auth/signin_intra", article, headers)
        .then(response => {
          this.SetTimeOut(response.data);
          this.SocketConnect();
          this.$router.push({ path: '/profile/me' });
        })
        .catch(error => {
          alert("Bir hata oluştu. Lütfen daha sonra tekrar deneyin!")
        });
    },
    SingInWithIntra() {
      window.open(process.env.VUE_APP_INTRA_URL, '_self');
    },
    GoToRegisterInPage() {
      this.$router.push({ path: 'register' });
    },
    SingIn() {
      if (this.email == "" || this.password == "")
        return;

      this.GetTokenWithSingIn();
    }
  }
});
</script>