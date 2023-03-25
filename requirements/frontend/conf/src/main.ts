import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueCookies from "vue3-cookies";
import axios from 'axios'
import VueAxios from 'vue-axios'

const app = createApp(App)
app.use(VueCookies, {
    expireTimes: "45MIN",
    secure: true,
});
app.use(VueAxios, axios)
app.config.globalProperties.$global = { socket: undefined };
app.use(router).mount('#app')
