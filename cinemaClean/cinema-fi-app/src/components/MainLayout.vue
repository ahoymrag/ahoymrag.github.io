<!-- src/components/MainLayout.vue -->
<template>
    <div class="main-layout">
      <TheSidebar />
      <div class="content-area">
        <router-view />
      </div>
    </div>
  </template>
  
  <script>
  import TheSidebar from './TheSidebar.vue';
  
  export default {
    components: {
      TheSidebar
    }
  }
  </script>
  
  <style scoped>
  .main-layout {
    display: flex;
    height: 100vh;
  }
  
  .content-area {
    flex-grow: 2;
    padding: 20px; /* Adjust as needed */
  }
  </style>
  