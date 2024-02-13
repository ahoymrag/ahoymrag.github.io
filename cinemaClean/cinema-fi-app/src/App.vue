<template>
  <div id="app">
    <div class="content">
      <TheSidebar /> <!-- Moved Sidebar component here -->
      <img alt="Vue logo" src="./assets/A_cinemaFI.png" class="logo">
     
      <UserDashboard /> <!-- Correctly referencing the updated component name -->
      <HelloWorld msg="Welcome to Your Vue.js App"/>
     
    </div>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import UserDashboard from './components/UserDashboard.vue' // Correctly importing the renamed component
import TheSidebar from './components/TheSidebar.vue' // Import TheSidebar component here

export default {
  name: 'App',
  components: {
    HelloWorld,
    UserDashboard, // Correctly registering the renamed component
    TheSidebar // Register TheSidebar component here
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.logo {
  max-width: 50%; /* Adjust based on your needs */
  height: auto;
  margin-bottom: 20px; /* Space between logo and text */
}
</style>