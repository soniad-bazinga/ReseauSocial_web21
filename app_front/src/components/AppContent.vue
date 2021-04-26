<template>
  <div id="content">
    <div id="lateral-bar">
      <h1>Bloc compte</h1>
      <div id="account-block">
        <!--- On affiche le forme ssi !logged -->
        <form
          method="post"
          v-if="!logged"
          id="login-form"
          @submit.prevent="login"
        >
          <input type="text" v-model="inputs.username" placeholder="Pseudo" />
          <input
            type="password"
            v-model="inputs.password"
            placeholder="Mot de passe"
          />
          <input type="submit" value="Se connecter" />
        </form>
        <div v-if="logged">
          <button v-on:click="logout">Deconnexion</button>
        </div>
      </div>
      <h1>Settings</h1>
      <div id="settings-block">
        <ul>
          <li v-for="(r, idx) in rules" :key="idx">
            {{ r.title }}
            <input type="checkbox" v-model="r.active" :checked="r.active" />
          </li>
        </ul>
      </div>
    </div>
    <div id="feed">
      <input type="text" id="message-box" :disabled="!logged" />
      <button v-on:click="create_post" :disabled="!logged">
        Envoyer le post
      </button>
      <publication
        v-for="p in filtered_publications"
        v-bind:date-publication="p.datePublication"
        v-bind:post-content="p.postContent"
        v-bind:likes-count="p.likesCount"
        v-bind:likes-infos="p.likes"
        v-bind:post-id="p.postId"
        v-bind:mentions="p.mentions"
        v-bind:hashtags="p.hashtags"
        v-bind:key="p.postId"
      >
        <input
          type="checkbox"
          v-on:click="like_post(p)"
          v-model="p.liked"
          :disabled="!logged"
        />
      </publication>
    </div>
  </div>
</template>

<script>
const PUBLICATIONS_URL = "http://localhost:4000/publications";
const SEND_PUBLICATION_URL = "http://localhost:4000/send_publication";
const LIKE_URL = "http://localhost:4000/like_publication";
const LOGIN_URL = "http://localhost:4000/login";

export default {
  name: "AppContent",
  data: function () {
    return {
      publications: [],
      u_id: -1,
      username: "",
      logged: false,
      inputs: {
        username: "",
        password: "",
      },
      rules: [
        {
          title: "@everyone",
          active: true,
          filtering: function (post) {
            return post.mentions.includes("@everyone");
          },
          requiresLogged: false,
        },
        {
          title: "@myself",
          active: false,
          filtering: function (post) {
            return post.mentions.includes("@" + this.get_username);
          }.bind(this),
          requiresLogged: true,
        },
        {
          title: "subscribed peoples",
          active: false,
          filtering: function (post) {
            return post;
          },
          requiresLogged: true,
        },
        {
          title: "@someone",
          active: false,
          filtering: function (post) {
            return post;
          },
          requiresLogged: false,
        },
        {
          title: "#something",
          active: false,
          filtering: function (post) {
            return post;
          },
          requiresLogged: false,
        },
      ],
    };
  },
  methods: {
    // Fonction pour load les posts depuis la BD
    get_posts: function () {
      let self = this;
      // On fetch l'adresse permettant de charger les messages, en utilisant le dernier message
      fetch(
        PUBLICATIONS_URL +
          "?max_id=" +
          this.get_last_post_id +
          "&user_id=" +
          this.u_id
      )
        .then((res) => res.json())
        .then((res) => {
          // On parcourt toutes les nouvelles publications
          for (let i = 0; i < res.length; i++) {
            let p = res[i];
            // Et on les push en première position
            self.publications.unshift({
              datePublication: p.post_date,
              postContent: p.content,
              likesCount: p.likes.length,
              postId: p.id_post,
              likesInfos: p.likes,
              liked: p.liked,
              mentions: p.mentions,
              hashtags: p.hashtags,
            });
          }
        });
    },
    create_post: function () {
      let msg = document.getElementById("message-box").value;
      let self = this;
      // Si le message est non vide
      if (msg.length > 0 && !(msg.trim() === "")) {
        // On prépare l'envoie du message
        console.log("### Sending '" + msg + "'");
        let hashtags = this.get_hashtags(msg);
        let mentions = this.get_mentions(msg);
        const requestOptions = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: this.u_id,
            message: msg,
            hashtags: hashtags,
            mentions: mentions,
          }),
        };
        // On l'envoie
        fetch(SEND_PUBLICATION_URL, requestOptions).then(() =>
          self.get_posts()
        );
        document.getElementById("message-box").value = "";
      } else {
        console.log("/!\\ Cannot send empty messages");
      }
    },
    like_post: function (post) {
      let id = post.postId;
      let like = !post.liked;
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: this.u_id, post_id: id, liked: like }),
      };
      // On l'envoie
      fetch(LIKE_URL, requestOptions);
      if (like) post.likesCount++;
      else post.likesCount--;
    },
    login: function () {
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: this.inputs.username,
          password: this.inputs.password,
        }),
      };
      // On l'envoie
      fetch(LOGIN_URL, requestOptions)
        .then((res) => res.json())
        .then((res) => {
          let logged = res.logged;
          if (logged) {
            console.log("Logged !");
            localStorage.setItem("u_id", res.u_id);
            localStorage.setItem("username", res.username);

            this.$router.go();
          } else {
            console.log("Not logged :(");
          }
        });
    },
    logout: function () {
      localStorage.removeItem("u_id");
      localStorage.removeItem("username");

      this.$router.go();
    },
    get_hashtags: function (msg) {
      let reg = /(#[a-zA-Z]+)/g;
      return msg.match(reg);
    },
    get_mentions: function (msg) {
      let reg = /(@[a-zA-Z]+)/g;
      return msg.match(reg);
    },
  },
  computed: {
    get_last_post_id: function () {
      return this.publications.length > 0 ? this.publications[0].postId : 0;
    },
    filtered_publications: function () {
      let filters = this.rules;
      return this.publications.filter((p) => {
        let respects = true;
        for (let i in filters) {
          if (!filters[i].active) continue;
          if (!filters[i].filtering(p)) return false;
        }
        return respects;
      });
    },
    get_username: function () {
      return this.username;
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
        mentions: Array,
        hashtags: Array,
        liked: Boolean,
      },
      template:
        "<div><p>#{{ postId }} // {{ postContent }} (le {{ datePublication }}). {{ likesCount }} likes.</p><slot></slot>" +
        "</div>",
    },
  },
  created: function () {
    if (localStorage.getItem("u_id") !== null) {
      this.u_id = localStorage.u_id;
      this.username = localStorage.username;
      this.logged = true;
    } else {
      this.u_id = -1;
      this.username = "";
      this.logged = false;
    }
  },
  mounted: function () {
    let self = this;
    this.get_posts();
    // On recharge les messages tout les demi secondes
    setInterval(() => self.get_posts(), 500);
  },
};
</script>

<style>
</style>
