<template>
  <!-- La div pour le contenu -->
  <div id="content"  class="wrapper">
    <div id="alert-box"></div>
    <button id="skyrocket" v-on:click="skyrocket">Retour en haut</button>
    
    <!-- La barre laterale or side bar -->
    <nav id="sidebar">
    <div id="lateral-bar" >
      <!-- Bloc "compte" (infos sur le compte) -->
      <account :logged="logged" :u_id="user.u_id" />
      <!-- Bloc pour les réglages -->
      <div id="settings-block">
        <div class="sidebar-header">
           <h1>Settings</h1>
      </div>

        <!-- On affiche toutes les règles connues -->
        
          <ul class="list-unstyled components">
            <li
                v-for= "(r, idx) in rules"
                :title= "r.title"
                :filter-function= "r.filter"
                :requires-logged= "r.requiresLogged"
                :key= "idx"
                v-show= "r.requiresLogged ? logged : true"
                class="active"
            >      
                <div class="input-group mb-3" data-toggle="buttons">
                  <label class="btn btn-primary">{{ r.title }}
                    <input type="checkbox"  v-model= "r.active" :disabled= "r.requiresLogged ? !logged : false" :id= "btn-check"  autocomplete="off"/>      
                  </label>  
                  <input type="text" class="form-control" v-if= "r.isInput" :placeholder= "r.placeholder" :id= "r.id" v-model= "r.val" />               
                 </div>
            </li>
            <p v-if="!logged">
              Envie de plus de fonctionnalités? Connectez vous ! (ou créez vous un
              compte, c'est gratuit)
            </p>
          </ul>
      </div>
      <!-- Connecté : on peut envoyer un message -->
      <div id="message-block" v-if="logged">
        <textarea
          id="message-box"
          v-model="messageBox"
          :disabled="!logged"
          :placeholder="get_welcome_message"
        />
        <button v-on:click="create_post" :disabled="!logged">
          Envoyer le post
        </button>
      </div>
    </div>
    </nav>
    <!-- Le feed contenant les publications -->
   
    <div id="feed" class="gridCentered">
      <nav class="navbar navbar-expand-lg navbar-light bg-light">
                <div class="container-fluid">

                    <button type="button" id="sidebarCollapse" class="btn btn-info">
                        <i class="fas fa-align-left"></i>
                         <span>Toggle Sidebar</span>
                    </button>

                  </div>
      </nav>
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
        :image-url="p.clientId + '.png'"
        :mentions="p.mentions"
        :hashtags="p.hashtags"
        :pub-click="pub_click"
        :key="p.postId"
        id="publication"
        class="grid-item"
        style="margin-top:20px;"
      >
      <div class="grid-sizer col-md-3"></div>
        <!-- Checkbox pour s'abonner -->
        <template v-slot:subscribe>
          <input
            type="checkbox"
            v-on:click="subscribe(p)"
            v-model="p.subscribed"
            v-if="logged && p.clientId != user.u_id"
            :disabled="!logged"
          />
        </template>
        <!-- Checkbox pour liker le post -->
        <template v-slot:like>
          <input
            type="checkbox"
            v-on:click="like_post(p)"
            v-if="logged"
            v-model="p.liked"
            :disabled="!logged"
          />
        </template>
        <template v-slot:answer>
          <button v-if="logged" @click="answer(p.clientUsername)">
            Répondre
          </button>
        </template>
      </publication>
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
            return post.mentions.includes("@" + this.get_username);
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
            if (this.val.trim() === "") return true;
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
            if (this.val.trim() === "") return true;
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
              // Et on les push en première position
              self.publications.unshift({
                datePublication: new Date(p.post_date),
                postContent: p.content,
                likesCount: p.likes.length,
                postId: p.id_post,
                likesInfos: p.likes,
                liked: p.liked,
                clientUsername: p.username,
                clientId: p.id_client,
                mentions: p.mentions,
                hashtags: p.hashtags,
                subscribed: self.user.subscribed.includes(p.id_client),
              });
            }
          } else {
            for (let e of res.errors) {
              alertMessage(e, "ERROR");
            }
          }
        });
    },
    // Permet d'envoyer un post a la BD
    create_post: function () {
      let msg = this.messageBox;
      // Si le message est non vide
      if (msg.length > 0 && !(msg.trim() === "")) {
        // On prépare l'envoie du message
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
            alertMessage("Action effectuée avec succès !", "SUCCESS");
          } else {
            for (let e of res.errors) {
              alertMessage(e, "ERROR");
            }
          }
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
            alertMessage("Action effectuée avec succès !", "SUCCESS");
          } else {
            for (let e of res.errors) {
              alertMessage(e, "ERROR");
            }
          }
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
      return msg.match(reg);
    },
    // Retourne toutes les mentions d'un message
    get_mentions: function (msg) {
      let reg = /(@[a-zA-Z]+)/g;
      return msg.match(reg);
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

var scrollPos = 0;

document.addEventListener("scroll", function () {
  var skyrocket = document.getElementById("skyrocket");

  var st = window.pageYOffset || document.documentElement.scrollTop; // Credits: "https://github.com/qeremy/so/blob/master/so.dom.js#L426"

  // Quand on scroll en bas
  if (st > scrollPos || st == 0) {
    skyrocket.style.opacity = 0;
  } else {
    // En haut
    skyrocket.style.opacity = 1;
  }

  scrollPos = st <= 0 ? 0 : st;
});



</script>

<style>
#skyrocket {
  position: fixed;
  opacity: 0;
  transition: opacity 0.2s;
}
#alert-box {
  position: fixed;
  width: 1000px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 10;
}
.alert-msg {
  width: fit-content;
  /* To adjust the height as well */
  height: fit-content;
  margin-left: auto;
  margin-right: auto;
}

.gridCentered{
  margin-left: auto; 
  margin-right: auto;
}

.gridCentered .static, 
.gridCentered .Masonry-Premount .Collection-Item{
  position: absolute; 
  visibility: hidden;
}

.gridCentered .Masonry-Premount, 
.gridCentered .Masonry-Premount .AutoSizer, 
.gridCentered .Masonry-Premount .Collection {
  width: auto !important;
  background: black;
}

@media (min-width: 0px) and(max-width: 755px){
  .gridCentered{
    width: 504px;
  }
  .gridCentered .Masonry-Premount .Collection-Item:nth-child(-n+2), 
  .gridCentered .static:nth-child(-n+2){
    position: static !important ; 
    visibility: visible  !important;
    float: left;
    display: block;
  }
}

</style>
