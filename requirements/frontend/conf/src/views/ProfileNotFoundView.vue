<template>
  <div class="about w3-animate-zoom" style="text-align: center;">
    <h1>Profile not found</h1>
    <p>Sorry, we could not find the requested profile.</p>
    <button class="w3-button w3-teal" @click="$router.push('/profile/me')">Go to my Profile</button>
  </div>
</template>