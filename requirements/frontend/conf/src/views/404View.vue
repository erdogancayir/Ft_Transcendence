<template>
  <div class="about w3-animate-zoom">
    <div class="video-background">
      <div class="video-foreground">
        <iframe src="https://www.youtube.com/embed/ApmDVDkLLS8?controls=0&showinfo=0&rel=0&autoplay=1&mute=1&loop=1"
          frameborder="0" allowfullscreen></iframe>
      </div>
    </div>
    <div class="content">
      <br>
      <h1 style="font-size: 15rem;">404 Not Found!</h1>
    </div>
  </div>
</template>

<style>
  .video-background {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    overflow: hidden;
    z-index: -1;
  }

  .video-foreground,
  .video-background iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .content {
    position: relative;
    z-index: 1;
    text-align: center;
    margin-top: 15%;
  }

  h1 {
    font-size: 3rem;
    color: white;
    text-shadow: 2px 2px 5px #000000;
  }
</style>