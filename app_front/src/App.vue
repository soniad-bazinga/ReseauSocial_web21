<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import router from "./router";

export default {
  name: "App",
  router,
};
</script>


<style>
body {
  scroll-behavior: smooth;
}
</style>
