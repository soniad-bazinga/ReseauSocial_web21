<template>
  <div id="content">
    <div id="lateral-bar">
      <h1>Settings</h1>
    </div>
    <div id="feed">
      <h1>Content</h1>
      <publication v-for="pub in publications" :key="pub"
        ><p>{{ pub }}</p></publication
      >
    </div>
  </div>
</template>

<script>
export default {
  name: "AppContent",
  data: function () {
    return {
      publications: ["bonjour"],
    };
  },
  components: {
    publication: {
      props: {},
      template: "<p>yo !<slot></slot></p>",
    },
  },
};
</script>

<style>
</style>
