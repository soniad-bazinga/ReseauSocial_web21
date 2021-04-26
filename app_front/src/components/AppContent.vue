<template>
  <div id="content">
    <button v-on:click="get_posts">Reload</button>
    <div id="lateral-bar">
      <h1>Settings</h1>
    </div>
    <div id="feed">
      <h1>Content</h1>
      <input type="text" />
      <publication
        v-for="(p, idx) in publications"
        v-bind:date-publication="p.datePublication"
        v-bind:post-content="p.postContent"
        v-bind:likes-count="p.likesCount"
        v-bind:likes-infos="p.likes"
        v-bind:post-id="p.postId"
        v-bind:key="idx"
        ><p>{{ p }}</p></publication
      >
    </div>
  </div>
</template>

<script>
const PUBLICATIONS_URL = "http://localhost:4000/publications";

export default {
  name: "AppContent",
  data: function () {
    return {
      truc: false,
      publications: [],
    };
  },
  methods: {
    // Fonction pour load les posts depuis la BD
    get_posts: function () {
      let self = this;
      // On fetch l'adresse permettant de charger les messages, en utilisant le dernier message
      fetch(PUBLICATIONS_URL + "?max_id=" + this.get_last_post_id)
        .then((res) => res.json())
        .then((res) => {
          // On parcourt toutes les nouvelles publications
          for (let i = 0; i < res.length; i++) {
            let p = res[i];
            // Et on les push
            self.publications.push({
              datePublication: p.post_date,
              postContent: p.content,
              likesCount: p.likes.length,
              postId: p.id_post,
              likesInfos: p.likes,
            });
          }
        });
    },
  },
  computed: {
    get_last_post_id: function () {
      return this.publications.length > 0 ? this.publications[0].postId : 0;
    },
  },
  components: {
    publication: {
      props: {
        "date-publication": String,
        "post-content": String,
        "likes-count": Number,
        "likes-infos": Array,
        "post-id": Number,
      },
      template:
        "<div>#{{ postId }} // {{ postContent }} (le {{ datePublication }}). {{ likesCount }} likes.</div>",
    },
  },
  mounted: function () {
    this.get_posts();
  },
};
</script>

<style>
</style>
