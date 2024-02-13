<template>
  <div class="app-header">
    <div class="app-header-left">
      <span class="app-icon"></span>
      <p class="app-name">Cinema.fi Portfolio</p>
      <!-- Search and other header elements go here -->
    </div>
  </div>
</template>

<script>
export default {
  name: "TheHeader"
}
</script>

<style scoped>
/* Your CSS here */
</style>

<template>
    <button @click="connectWallet">Connect Wallet</button>
  </template>
  
  <script>
  export default {
    methods: {
      async connectWallet() {
        this.$store.dispatch('connectWallet');
      }
    }
  }
  </script>
  

  <template>
    <div class="app-header">
      <div class="app-header-left">
        <!-- Logo Image -->
        <img src="@/assets/A_cinemaFI.png" alt="Cinema.fi Logo" class="logo"/>
        <p class="app-name">Cinema.fi</p>
        <!-- Rest of your header content -->
      </div>
      <!-- Rest of your header content -->
    </div>
  </template>
  
  <script>
  export default {
    name: "TheHeader"
    // Component logic here
  }
  </script>
  
  <style scoped>
  .logo {
    /* Adjust width and height as needed */
    width: 100px; 
    height: auto;
  }
  /* Rest of your styles */
  </style>
  