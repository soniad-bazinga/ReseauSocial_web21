<template>
  <!-- La div pour le contenu -->
  <div id="content" class="wrapper">
    <div id="alert-box"></div>
    <button id="skyrocket" v-on:click="skyrocket" class="btn btn-outline-dark">
      Retour en haut
    </button>

    <!-- La barre laterale or side bar -->
    <nav id="sidebar" class="shadow text-white">
      <div id="lateral-bar">
        <div id="lateral-bar-content">
          <!-- Bloc "compte" (infos sur le compte) -->
          <account :logged="logged" :u_id="user.u_id" />
          <!-- Bloc pour les réglages -->
          <hr />
          <div id="settings-block">
            <div>
              <h3>Filtres</h3>
            </div>

            <!-- On affiche toutes les règles connues -->

            <ul class="list-unstyled components">
              <li
                v-for="(r, idx) in rules"
                :title="r.title"
                :filter-function="r.filter"
                :requires-logged="r.requiresLogged"
                :key="idx"
                v-show="r.requiresLogged ? logged : true"
                class="active"
              >
                <div class="input-group mb-3" data-toggle="buttons">
                  <input
                    type="checkbox"
                    v-model="r.active"
                    :disabled="r.requiresLogged ? !logged : false"
                    autocomplete="off"
                    class="btn-check"
                    :id="'rule-' + r.title"
                  />
                  <label
                    :for="'rule-' + r.title"
                    class="btn btn-outline-light col-12"
                    autocomplete="off"
                    >{{ r.title }}
                  </label>
                  <input
                    type="text"
                    class="form-control"
                    v-if="r.isInput"
                    :placeholder="r.placeholder"
                    :id="r.id"
                    v-model="r.val"
                  />
                </div>
              </li>
              <p class="form-text" v-if="!logged">
                Envie de plus de fonctionnalités? <b>Connectez vous !</b
                ><i> (ou créez vous un compte, c'est gratuit)</i>
              </p>
            </ul>
          </div>
          <!-- Connecté : on peut envoyer un message -->
          <div id="message-block" v-if="logged">
            <hr />
            <div>
              <h3>Publication</h3>
            </div>
            <textarea
              class="form-control mb-3"
              id="message-box"
              v-model="messageBox"
              :disabled="!logged"
              :placeholder="get_welcome_message"
            />
            <button
              class="btn btn-outline-light col-12"
              v-on:click="create_post"
              :disabled="!logged"
            >
              Envoyer le post
            </button>
          </div>
        </div>
        <nav id="expendable" class="navbar navbar-expand-lg navbar-light">
          <div class="container-fluid">
            <button type="button" id="sidebarCollapse">
              <span>></span>
            </button>
          </div>
        </nav>
      </div>
    </nav>
    <!-- Le feed contenant les publications -->

    <div id="feed" class="gridCentered">
      <div id="yasm-title">
        <h1>- Yet Another Social Media</h1>
      </div>
      <!-- Si on a aucune publication à afficher -->
      <transition name="empty">
        <div id="empty-feed" v-if="filtered_publications.length == 0">
          <h3>
            Votre feed est vide...<br />
            Essayez de suivre du monde en cliquant sur la [
            <i class="bi bi-bell-fill"></i> ]<br />
            ou de jetter un oeil à <b>`@everyone`</b>!
          </h3>
        </div>
      </transition>
      <!-- On affiche toutes les publications -->
      <!-- on les filtres avant en utilisant les fonctions de filtrage -->
      <transition-group name="list">
        <publication
          v-for="p in filtered_publications"
          :post-id="p.postId"
          :client-username="p.clientUsername"
          :client-id="p.clientId"
          :date-publication="p.datePublication"
          :post-content="p.postContent"
          :likes-count="p.likesCount"
          :likes-infos="p.likes"
          :image-url="p.clientId + '.png'"
          :mentions="p.mentions"
          :hashtags="p.hashtags"
          :pub-click="pub_click"
          :key="p.postId"
          :id="p.postId"
          class="publication"
          style="margin-top: 20px"
        >
          <div class="grid-sizer col-md-3"></div>
          <!-- Checkbox pour s'abonner -->
          <template v-slot:subscribe v-if="logged && p.clientId != user.u_id">
            <input
              type="checkbox"
              v-on:click="subscribe(p)"
              v-model="p.subscribed"
              :id="'sub-' + p.postId"
              :disabled="!logged"
              class="subscribed-check form-check-input btn-check"
            />
            <label
              v-if="!user.subscribed.includes(p.clientId)"
              :for="'sub-' + p.postId"
              class="btn btn-outline-light m-1 subscribed-check"
              ><i class="bi bi-bell-fill"></i
            ></label>
            <label
              v-else
              :for="'sub-' + p.postId"
              class="btn btn-outline-light m-1 subscribed-check"
              ><i class="bi bi-bell-slash-fill"></i
            ></label>
          </template>
          <!-- Checkbox pour liker le post -->
          <template v-slot:like>
            <input
              type="checkbox"
              :id="'like-' + p.postId"
              v-on:click="like_post(p)"
              v-if="logged"
              v-model="p.liked"
              :disabled="!logged"
              class="form-check-input btn-check"
              autocomplete="off"
            />
            <label :for="'like-' + p.postId" class="btn btn-outline-light m-1">
              {{ p.likesCount }} <i class="bi bi-heart-fill"></i>
            </label>
          </template>
          <template v-slot:answer>
            <button
              class="btn btn-outline-light m-1"
              v-if="logged"
              @click="answer(p.clientUsername)"
            >
              Répondre
            </button>
          </template>
        </publication>
      </transition-group>
    </div>
  </div>
</template>




<script>
// Les liens pour faire des requêtes au back-end
const PUBLICATIONS_URL = "http://localhost:4000/publications";
const SEND_PUBLICATION_URL = "http://localhost:4000/send_publication";
const LIKE_URL = "http://localhost:4000/like_publication";
const SUB_URL = "http://localhost:4000/subscribe";

import Publication from "./Publication.vue";
import Account from "./Account.vue";
import alertMessage from "../assets/scripts/alertError.js";

// On export le composant actuel
export default {
  name: "AppContent",
  data: function () {
    return {
      // Tableau contenant les publications
      publications: [],
      messageBox: "",
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
        hashtags: "",
        mentions: "",
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
      rules: {
        "@everyone": {
          title: "@everyone",
          active: false,
          isInput: false,
          filtering: function (post) {
            return post.mentions.includes("@everyone");
          },
          requiresLogged: false,
        },
        "@myself": {
          title: "@myself",
          active: false,
          isInput: false,
          filtering: function (post) {
            return post.mentions.includes("@" + this.user.username);
          }.bind(this),
          requiresLogged: true,
        },
        following: {
          title: "following",
          active: false,
          isInput: false,
          filtering: function (post) {
            return this.user.subscribed.includes(post.clientId);
          }.bind(this),
          requiresLogged: true,
        },
        "@": {
          title: "@",
          placeholder: "someone",
          active: false,
          isInput: true,
          val: "",
          filtering: function (post) {
            if (this.val.trim() === "") return false;
            return post.clientUsername === this.val;
          },
          requiresLogged: false,
        },
        "#": {
          title: "#",
          placeholder: "something",
          active: false,
          isInput: true,
          val: "",
          id: "hashInput",
          filtering: function (post) {
            if (this.val.trim() === "") return false;
            return post.hashtags.includes("#" + this.val);
          },
          requiresLogged: false,
        },
      },
      welcome_messages: [
        "Dites bonjour!",
        "Racontez votre journée!",
        "Quoi de neuf?",
        "Cher journal...",
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
          if (res.worked) {
            let pubs = res.result;
            for (let p of pubs) {
              // Et on les push en première position (ssi il n'existe pas déjà)
              // (des erreurs de réseau peuvent provoquer des doublons)
              if (!self.publications.some((e) => e.postId == p.id_post))
                self.publications.unshift({
                  datePublication: new Date(p.post_date),
                  postContent: p.content,
                  likesCount: p.likes.length,
                  postId: p.id_post,
                  likesInfos: p.likes,
                  liked: p.liked,
                  clientUsername: p.username,
                  clientId: p.id_client,
                  mentions: this.get_mentions(p.content),
                  hashtags: this.get_hashtags(p.content),
                  subscribed: self.user.subscribed.includes(p.id_client),
                });
            }
          } else {
            for (let e of res.errors) {
              alertMessage(e, "ERROR");
            }
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    // Permet d'envoyer un post a la BD
    create_post: function () {
      let msg = this.messageBox;
      // Si le message est non vide
      if (msg.length > 0 && !(msg.trim() === "")) {
        const requestOptions = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: this.user.u_id,
            message: msg,
          }),
        };
        // On l'envoie
        fetch(SEND_PUBLICATION_URL, requestOptions)
          .then((res) => res.json())
          .then((res) => {
            if (res.worked) {
              alertMessage("Publication postée avec succès !", "SUCCESS");
            } else {
              for (let e of res.errors) {
                alertMessage(e, "ERROR");
              }
            }
          })
          .catch(function (error) {
            console.log(error);
          });
        this.messageBox = "";
      } else {
        alertMessage("Impossible d'envoyer des messages vide", "ERROR");
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
      fetch(LIKE_URL, requestOptions)
        .then((res) => res.json())
        .then((res) => {
          if (res.worked) {
            // Trop lourd d'envoyer 'action effectuée' a chaque like
            // alertMessage("Action effectuée avec succès !", "SUCCESS");
          } else {
            for (let e of res.errors) {
              alertMessage(e, "ERROR");
            }
          }
        })
        .catch(function (error) {
          console.log(error);
        });
      if (like) post.likesCount++;
      else post.likesCount--;
    },
    subscribe: function (post) {
      let id = post.clientId;
      let sub = !post.subscribed;
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_id: this.user.u_id,
          to_id: id,
          subbing: sub,
        }),
      };
      fetch(SUB_URL, requestOptions)
        .then((res) => res.json())
        .then((res) => {
          if (res.worked) {
            // Trop lourd d'envoyer 'action effectuée' a chaque abonnement
            // alertMessage("Action effectuée avec succès !", "SUCCESS");
          } else {
            for (let e of res.errors) {
              alertMessage(e, "ERROR");
            }
          }
        })
        .catch(function (error) {
          console.log(error);
        });
      if (!sub)
        this.user.subscribed = this.user.subscribed.filter((e) => e !== id);
      else this.user.subscribed.push(id);

      for (let pub of this.publications) {
        pub.subscribed = this.user.subscribed.includes(pub.clientId);
      }

      this.$session.set("subscribed", JSON.stringify(this.user.subscribed));
    },
    answer: function (username) {
      this.messageBox = "@" + username + " ";
      document.getElementById("message-box").focus();
    },
    // Retourne tout les hashtags d'un message
    get_hashtags: function (msg) {
      let reg = /(#[a-zA-Z]+)/g;
      let val = msg.match(reg);
      return val !== null ? val : [];
    },
    // Retourne toutes les mentions d'un message
    get_mentions: function (msg) {
      let reg = /(@[a-zA-Z]+)/g;
      let val = msg.match(reg);
      return val !== null ? val : [];
    },
    pub_click: function (hash, rule) {
      this.rules[rule].val = hash;
    },
    skyrocket: function () {
      document.body.scrollTop = 0; // For Safari
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
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
    get_welcome_message() {
      return this.welcome_messages[
        Math.floor(Math.random() * this.welcome_messages.length)
      ];
    },
  },
  // Stock tout les components
  components: {
    // Une publication
    Publication,
    Account,
  },
  // Lors de la creation du component
  created: function () {
    if (!this.$session.exists()) {
      this.$session.start();
    }

    if (this.$session.has("u_id")) {
      this.user.u_id = this.$session.get("u_id");
      this.user.username = this.$session.get("username");
      this.user.subscribed = JSON.parse(this.$session.get("subscribed"));

      this.logged = true;
    }
  },
  // Lors du montage
  mounted: function () {
    let self = this;
    // Si on est connecté, on change le titre de la page
    if (this.user.username !== "")
      document.title = "YASM @" + this.user.username;
    // On charge une fois les posts
    this.get_posts();
    // On recharge les messages tout les demi secondes
    setInterval(() => self.get_posts(), 500);
    // On met a jour les checkbox en fonctions de valeurs de base
    for (let i in this.rules) {
      this.rules[i].active = (this.logged
        ? this.start_rules.logged
        : this.start_rules.unregistred
      ).includes(this.rules[i].title);
    }
  },
};

// Evenements sur le scroll
document.addEventListener("scroll", function () {
  var skyrocket = document.getElementById("skyrocket");
  var yasm = document.getElementById("yasm-title");

  var st = window.pageYOffset || document.documentElement.scrollTop; // Credits: "https://github.com/qeremy/so/blob/master/so.dom.js#L426"

  // Quand on scroll en bas
  if (st == 0) {
    skyrocket.style.opacity = 0;
    yasm.style.opacity = 1;
  } else {
    // En haut
    skyrocket.style.opacity = 1;
    yasm.style.opacity = 0;
  }
});
</script>

<style>
@font-face {
  font-family: "Akira";
  src: url("../assets/fonts/akira.otf");
}
#skyrocket {
  position: fixed;
  bottom: 50px;
  right: 50px;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 1000;
}
#feed {
  position: relative;
}
#yasm-title {
  position: sticky;
  width: 100%;
  top: 25px;
  z-index: 2;
  text-align: center;
  font-family: "Akira";
  margin: 25px;
  transition: all 0.25s;
}
#empty-feed {
  position: absolute;
  top: 250px;
  left: 0;
  right: 0;
}
.empty-enter-active {
  transition: opacity 1s ease-in-out;
}
.empty-leave-active {
  transition: opacity 0.1s ease-in-out;
}
.empty-enter, .empty-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
#alert-box {
  position: fixed;
  width: 1000px;
  left: 50%;
  top: 25px;
  transform: translateX(-50%);
  text-align: center;
  z-index: 10;
  opacity: 0.9;
}
#lateral-bar {
  position: fixed;
  z-index: 5;
  height: 100vh;
  width: 250px;
}
#lateral-bar-content {
  overflow-y: scroll;
  height: 100vh;
  padding: 10px;
  width: 250px;
}
#expendable {
  z-index: 100;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 250px;
}
#sidebarCollapse {
  border: none;
  background-color: transparent;
  color: black;
  font-size: 35px;
}
.alert-msg {
  width: fit-content;
  /* To adjust the height as well */
  height: fit-content;
  margin-left: auto;
  margin-right: auto;
}

.gridCentered {
  margin-left: auto;
  margin-right: auto;
  min-width: 50%;
}
.publication {
  transition: all 0.5s;
  width: 100%;
  overflow: hidden;
}
.list-enter,
.list-leave-to {
  opacity: 0;
}

.list-enter {
  transform: translateX(50px);
}
.list-leave-to {
  opacity: 0;
}

.list-leave-active {
  position: absolute;
}

@media (min-width: 0px) and(max-width: 755px) {
  .gridCentered {
    width: 504px;
  }
}
</style>
