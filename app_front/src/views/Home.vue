<template>
  <div class="home">
    <app-header />
    <app-content />
  </div>
</template>

<script>
import AppHeader from "@/components/AppHeader.vue";
import AppContent from "@/components/AppContent.vue";

export default {
  name: "Home",
  components: {
    AppHeader,
    AppContent,
  },
};
</script>
