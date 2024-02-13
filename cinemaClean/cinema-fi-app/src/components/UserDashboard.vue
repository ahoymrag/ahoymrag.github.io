<template>
    <div class="user-dashboard">
      <h1>User Dashboard</h1>
      <p>Welcome to your User Dashboard. Here you can view your app's analytics and manage content.</p>
      <section id="left-dashy">
        This is going to be the first section <br>
        Do you dig?
      </section>
      <section id="dashy-2">
        <p>This is where all that sweet content will go</p>
      </section>
    </div>
</template>

<script>
export default {
  name: 'UserDashboard', // Updated component name to be multi-word
}
</script>

<style scoped>
@import '../assets/user-dashboard.css';
</style>