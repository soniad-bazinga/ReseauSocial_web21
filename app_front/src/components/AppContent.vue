<template>
  <!-- La div pour le contenu -->
  <div id="content">
    <!-- La barre laterale -->
    <div id="lateral-bar">
      <!-- Bloc "compte" (infos sur le compte) -->
      <div id="account-block">
        <h1>Bloc compte</h1>
        <h3>{{ user.username }}</h3>
        <!-- Non connecté : on affiche le form de connexion -->
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
        <!-- Connecté : Bouton de deconnexion -->
        <div v-if="logged">
          <button v-on:click="logout">Deconnexion</button>
        </div>
      </div>
      <!-- Bloc pour les réglages -->
      <div id="settings-block">
        <h1>Settings</h1>
        <!-- On affiche toutes les règles connues -->
        <ul>
          <li
            v-for="(r, idx) in rules"
            :title="r.title"
            :filter-function="r.filter"
            :requires-logged="r.requiresLogged"
            :key="idx"
          >
            <p style="display: inline-block">{{ r.title }}</p>
            <input
              type="text"
              v-if="r.isInput"
              :placeholder="r.placeholder"
              v-model="r.val"
            />
            <input
              type="checkbox"
              v-model="r.active"
              :disabled="r.requiresLogged ? !logged : false"
              :id="'chckb' + idx"
            />
          </li>
        </ul>
      </div>
    </div>
    <!-- Le feed contenant les publications -->
    <div id="feed">
      <!-- Connecté : on peut envoyer un message -->
      <div id="message-block" v-if="logged">
        <input type="text" id="message-box" :disabled="!logged" />
        <button v-on:click="create_post" :disabled="!logged">
          Envoyer le post
        </button>
      </div>
      <!-- On affiche toutes les publications -->
      <!-- on les filtres avant en utilisant les fonctions de filtrage -->
      <publication
        v-for="p in filtered_publications"
        :post-id="p.postId"
        :client-username="p.clientUsername"
        :client-id="p.clientId"
        :date-publication="p.datePublication"
        :post-content="p.postContent"
        :likes-count="p.likesCount"
        :likes-infos="p.likes"
        :image-url="p.imageUrl"
        :mentions="p.mentions"
        :hashtags="p.hashtags"
        :key="p.postId"
      >
        <!-- Checkbox pour liker le post -->
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
// Les liens pour faire des requêtes au back-end
const PUBLICATIONS_URL = "http://localhost:4000/publications";
const SEND_PUBLICATION_URL = "http://localhost:4000/send_publication";
const LIKE_URL = "http://localhost:4000/like_publication";
const LOGIN_URL = "http://localhost:4000/login";

import Publication from "./Publication.vue";

// On export le composant actuel
export default {
  name: "AppContent",
  data: function () {
    return {
      // Tableau contenant les publications
      publications: [],
      // Connecté.e ?
      logged: false,
      // Infos sur l'utilisateur
      user: {
        // L'id (-1 si non connecté)
        u_id: -1,
        // Le pseudo
        username: "",
        // Le tableau des comptes auquel l'utilisateur est abonné
        subscribed: [],
      },
      // Les inputs pour se connecter
      inputs: {
        username: "",
        password: "",
      },
      // Les règles pour filtrer le feed
      // title : l'html inseré
      // active : actif?
      // filtering : fonction de filtrage (publication => boolean)
      // requiresLogged : nécessite d'être connecté?
      start_rules: {
        logged: ["@everyone", "@myself", "following"],
        unregistred: ["@everyone"],
      },
      rules: [
        {
          title: "@everyone",
          active: true,
          isInput: false,
          filtering: function (post) {
            return post.mentions.includes("@everyone");
          },
          requiresLogged: false,
        },
        {
          title: "@myself",
          active: false,
          isInput: false,
          filtering: function (post) {
            return post.mentions.includes("@" + this.get_username);
          }.bind(this),
          requiresLogged: true,
        },
        {
          title: "following",
          active: false,
          isInput: false,
          filtering: function (post) {
            return this.user.subscribed.some((e) => e.id_to === post.clientId);
          }.bind(this),
          requiresLogged: true,
        },
        {
          title: "@",
          placeholder: "someone",
          active: false,
          isInput: true,
          val: "",
          filtering: function (post) {
            if (this.val.trim() === "") return true;
            return post.mentions.includes("@" + this.val);
          },
          requiresLogged: false,
        },
        {
          title: "#",
          placeholder: "something",
          active: false,
          isInput: true,
          val: "",
          filtering: function (post) {
            if (this.val.trim() === "") return true;
            return post.hashtags.includes("#" + this.val);
          },
          requiresLogged: false,
        },
      ],
    };
  },
  // On stock toutes les méthodes utiles
  methods: {
    // Fonction pour load les posts depuis la BD
    get_posts: function () {
      let self = this;
      // On fetch l'adresse permettant de charger les messages, en utilisant le dernier message
      // pour éviter de tout re-load
      fetch(
        PUBLICATIONS_URL +
          "?max_id=" +
          this.get_last_post_id +
          "&user_id=" +
          this.user.u_id
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
              clientUsername: p.username,
              clientId: p.id_client,
              mentions: p.mentions,
              hashtags: p.hashtags,
              imageUrl: p.image_url,
            });
          }
        });
    },
    // Permet d'envoyer un post a la BD
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
            user_id: this.user.u_id,
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
    // Permet d'aimer un post
    like_post: function (post) {
      let id = post.postId;
      let like = !post.liked;
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: this.user.u_id,
          post_id: id,
          liked: like,
        }),
      };
      // On l'envoie
      fetch(LIKE_URL, requestOptions);
      if (like) post.likesCount++;
      else post.likesCount--;
    },
    // Permet de se login
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
            // On stock toutes les informations dans le localStorage
            console.log("Logged !");
            localStorage.setItem("u_id", res.u_id);
            localStorage.setItem("username", res.username);
            localStorage.setItem("subscribed", JSON.stringify(res.subscribed));

            // On refresh
            this.$router.go();
          } else {
            console.log("Not logged :(");
          }
        });
    },
    // Pour se deconnecter
    logout: function () {
      // On vide le storage et on refresh
      localStorage.clear();

      this.$router.go();
    },
    // Retourne tout les hashtags d'un message
    get_hashtags: function (msg) {
      let reg = /(#[a-zA-Z]+)/g;
      return msg.match(reg);
    },
    // Retourne toutes les mentions d'un message
    get_mentions: function (msg) {
      let reg = /(@[a-zA-Z]+)/g;
      return msg.match(reg);
    },
  },
  // Fonctions calculant une valeur
  computed: {
    // Permet de récuperer l'id du dernier post chargé
    get_last_post_id: function () {
      return this.publications.length > 0 ? this.publications[0].postId : 0;
    },
    // Filtre les publications en utilisant les règles de filtrage
    filtered_publications: function () {
      let filters = this.rules;
      return this.publications.filter((p) => {
        for (let i in filters) {
          if (!filters[i].active) continue;
          if (filters[i].filtering(p)) return true;
        }
        return false;
      });
    },
  },
  // Stock tout les components
  components: {
    // Une publication
    Publication,
  },
  // Lors de la creation du component
  created: function () {
    // Si on est connecté => on charge les infos du localStorage (mime les effets d'une session)
    if (localStorage.getItem("u_id") !== null) {
      this.user.u_id = localStorage.getItem("u_id");
      this.user.username = localStorage.getItem("username");
      this.user.subscribed = JSON.parse(localStorage.getItem("subscribed"));

      this.logged = true;
    } else {
      // Sinon "déconnecte"
      this.user.u_id = -1;
      this.user.username = "";

      this.user.logged = false;
    }
  },
  // Lors du montage
  mounted: function () {
    let self = this;
    // On charge une fois les posts
    this.get_posts();
    // On recharge les messages tout les demi secondes
    setInterval(() => self.get_posts(), 500);
    // On met a jour les checkbox en fonctions de valeurs de base
    for (let i in this.rules) {
      document.getElementById("chckb" + i).checked = (this.logged
        ? this.start_rules.logged
        : this.start_rules.unregistred
      ).includes(this.rules[i].title);
    }
  },
};
</script>

<style>
</style>
