<template>
  <div class="home">
    <app-content />
  </div>
</template>

<script>
import AppContent from "@/components/AppContent.vue";

export default {
  name: "Home",
  components: {
    AppContent,
  },
};
</script>
