<template>
  <div class="post-container">
    <modal class="pp-modal" v-show="ppModalVisible" @close="closePpModal">
      <template v-slot:body>
        <img :src="getImage" alt="profil picture" class="post-img-zoom" />
      </template>
    </modal>
    <div class="publication-post">
      <div class="img-container">
        <img :src="getImage" class="post-img" alt="profil picture" />
      </div>
      <div class="publication-content">
        <slot name="subscribe" />
        <p class="publication-text">
          <span class="publication-header">
            <button class="img-button" @click="showPpModal">
              <img :src="getImage" alt="profil picture" class="post-img-min" />
            </button>
            <span class="at">@{{ clientUsername }} </span>
            le {{ printDate }}
          </span>
        </p>
        <hr style="color: white" />
        <span
          v-html="hashText"
          class="publication-body publication-text mb-4"
        ></span>
        <div class="publication-footer">
          <slot name="like" />
          <slot name="answer" />
        </div>
      </div>
    </div>
  </div>
</template>
    
<script>
import marked from "marked";
import Modal from "./Modal.vue";

export default {
  name: "Publication",
  data: function () {
    return {
      ppModalVisible: false,
    };
  },
  components: {
    Modal,
  },
  props: {
    "date-publication": Date,
    "post-content": String,
    "likes-count": Number,
    "likes-infos": Array,
    "post-id": Number,
    "client-username": String,
    "client-id": Number,
    "image-url": String,
    "pub-click": Function,
    mentions: Array,
    hashtags: Array,
    liked: Boolean,
  },
  methods: {
    closePpModal() {
      this.ppModalVisible = false;
    },
    showPpModal() {
      this.ppModalVisible = true;
    },
  },
  computed: {
    hashText: function () {
      if (!this.postContent) return "";
      let hashReg = /#\w+/gm;
      let atReg = /@\w+/gm;
      return marked(
        this.postContent
          .replace(hashReg, "<span class = 'hashtag'>$&</span>")
          .replace(atReg, "<span class = 'at'>$&</span>")
      );
    },
    getImage() {
      try {
        return require("@/assets/profil_pictures/" + this.imageUrl);
      } catch {
        return require("@/assets/profil_pictures/default_picture.png");
      }
    },
    printDate() {
      let date = this.datePublication;
      return (
        date.getDate() +
        "/" +
        (date.getMonth() + 1) +
        "/" +
        date.getFullYear() +
        " à " +
        date.getHours() +
        ":" +
        date.getMinutes()
      );
    },
  },
  mounted: function () {
    let self = this;
    document.getElementsByClassName("hashtag").forEach((h) => {
      h.onclick = function () {
        self.pubClick(h.innerHTML.replace("#", ""), "#");
      };
    });
    document.getElementsByClassName("at").forEach((a) => {
      a.onclick = function () {
        self.pubClick(a.innerHTML.replace("@", ""), "@");
      };
    });
  },
};
</script>
    
<style>
.hashtag,
.at {
  font-weight: bold;
  cursor: pointer;
}
.hashtag {
  color: rgb(67, 182, 218) !important;
}

.at {
  color: violet !important;
}
.post-container {
}
.publication-post {
  position: relative;
  padding: 10px;
  z-index: 0;
  box-shadow: 10px 10px 0px 3px rgb(124, 149, 196);
  margin-bottom: 30px;
  max-width: 80%;
  min-width: 80%;
  margin-left: auto;
  margin-right: auto;
}
.img-container {
  position: absolute;
  z-index: 1;
  width: 100%;
  height: 100%;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  overflow: hidden;
}
.post-img {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  bottom: 0;
}
.publication-content {
  position: relative;
  z-index: 2;
}
.publication-body {
  display: block;
  padding-left: 10px;
  padding-right: 10px;
  overflow-wrap: break-word;
}
.publication-content {
  display: block;
  width: 100%;
  background-color: black;
  opacity: 80%;
  padding: 5px;
}
.subscribed-check {
  position: absolute;
  right: 5px;
  top: 5px;
}
.publication-text * {
  color: white;
  text-overflow: clip;
}
.pp-modal .modal-content {
  opacity: 95%;
}
.post-img-zoom {
  width: 300px;
  height: 300px;
  object-fit: cover;
  border-radius: 100%;
}
.img-button {
  background-color: transparent;
  color: white;
  border: none;
}
.post-img-min {
  width: 35px;
  height: 35px;
  border-radius: 100%;
  border: 2px solid white;
}
p {
  display: inline;
}
</style> 