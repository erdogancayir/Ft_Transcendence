<template>
  <div class="register w3-animate-zoom">
    <h1 style="text-align:center">Register</h1>
    <div class="w3-modal-content w3-card-8" style="max-width:300px">
      <br>
      <form>
        <input @keyup.enter="Register()" class="w3-input" v-model="email" type="email" placeholder="Email Address"> <br>
        <input @keyup.enter="Register()" class="w3-input" v-model="firstName" type="text" placeholder="First Name"> <br>
        <input @keyup.enter="Register()" class="w3-input" v-model="lastName" type="text" placeholder="Last Name"> <br>
        <input @keyup.enter="Register()" class="w3-input" v-model="userName" type="text" placeholder="User Name"> <br>
        <input @keyup.enter="Register()" autocomplete="new-password" class="w3-input" v-model="password" type="password"
          placeholder="Password">
        <br>
      </form>
      <br>
      <button class="w3-btn w3-btn-block w3-green" v-on:click="GoToSingInPage()">SingIn Page</button> <button
        :class="(email == '' || password == '' || firstName == '' || lastName == '' || userName == '') ? 'w3-disabled' : ''"
        class="w3-btn w3-btn-block w3-green" v-on:click="Register()">Register</button> <br>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { useCookies } from "vue3-cookies";
const { cookies } = useCookies();

import axios from 'axios'
import { sha256 } from 'js-sha256';


export default defineComponent({

  data() {
    return {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      userName: "",
      qrData: "",
      code: "",
      secret: "",
      encoding: "ASCII",
      showCodeInput: true,
    }
  },
  beforeMount() {
    if (cookies.get("token") != null)
      this.$router.push({ path: '/profile/me' });
  },
  methods: {
    GoToSingInPage() {
      this.$router.push({ path: 'singIn' });
    },

    async Register() {
      if (this.email == "" || this.password == "" || this.firstName == "" || this.lastName == "" || this.userName == "")
        return;

      const article = {
        email: this.email,
        hash: sha256(this.password),
        firstName: this.firstName,
        lastName: this.lastName,
        userName: this.userName,
      };
      const headers = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
      axios.post(process.env.VUE_APP_BACKEND_URL + "/auth/signup", article, headers)
        .then(response => {
          if (response.data == "Mail Duplicate!") {
            alert("Bu maile ait bir kullanıcı zaten var!")
            return;
          }
          if (response.data != "success") {
            alert("Bir hata oluştu!")
            return;
          }
          this.$router.push({ path : "/singIn"})
        })
        .catch(error => {
          if (error.response.data.message[0] == "email must be an email") {
            alert("Email doğru değil!")
            return;
          }
          alert("Bir hata oluştu. Lütfen daha sonra tekrar deneyin!")
        });
    }
  }
});
</script>