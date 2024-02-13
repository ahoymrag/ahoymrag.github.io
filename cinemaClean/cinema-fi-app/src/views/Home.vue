<template>
  <div class="home">
    <ProjectList />
    <MessageSection />
  </div>
</template>

<script>
import ProjectList from '../components/ProjectList.vue';
import MessageSection from '../components/MessageSection.vue';

export default {
  components: {
    ProjectList,
    MessageSection
  }
}
</script>

<style scoped>
/* Home component styles */
</style>
