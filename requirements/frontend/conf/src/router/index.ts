import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/404View.vue')
  },
  {
    path: '/singIn',
    name: 'singIn',
    component: () => import('../views/SingInView.vue')
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue')
  },
  {
    path: '/game',
    name: 'game',
    component: () => import('../views/GameView.vue')
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import('../views/ChatView.vue')
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue')
  },
  {
    path: '/profile/:userId',
    name: 'profile',
    component: () => import('../views/ProfileView.vue')

  },
  {
    path: '/profile',
    redirect: "/profile/me"
  },
  {
    path: '/:pathMatch(.*)*',
    name: '404NotFound',
    component: () => import('../views/404View.vue')
  },
  {
    path: '/ProfileNotFound',
    name: 'I_cant_found',
    component: () => import('../views/ProfileNotFoundView.vue')
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue')
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
