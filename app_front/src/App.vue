<template>
  <div>
    <app-header></app-header>
    <app-content></app-content>
  </div>
</template>

<script>
import AppHeader from "/components/AppHeader";
import AppContent from "/components/AppContent";

export default {
  name: "App",
  components: {
    AppHeader,
    AppContent,
  },
};
</script>

<style>
</style>
