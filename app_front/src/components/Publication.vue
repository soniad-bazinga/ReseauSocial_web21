<template>
  <div class="publication-post">
    <div class="img-container">
      <img :src="getImage" class="post-img" alt="profil picture" />
    </div>
    <div class="publication-content">
      <slot name="subscribe" />
      <p class="publication-text">
        <span class="publication-header"
          ><span class="at">@{{ clientUsername }}</span> le
          {{ printDate }} :</span
        >
        <span v-html="hashText" class="publication-body"></span>
      </p>
      <div class="publication-footer">
        <p>{{ likesCount }} likes &nbsp;</p>
        <slot name="like" />
        <br />
        <slot name="answer" />
      </div>
    </div>
  </div>
</template>
    
<script>
import marked from "marked";

export default {
  name: "Publication",
  data: function () {
    return {};
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
  computed: {
    hashText: function () {
      if (!this.postContent) return "";
      let hashReg = /#\w+/gm;
      let atReg = /@\w+/gm;
      let hashed = this.postContent
        .replace(hashReg, "<span class = 'hashtag'>$&</span>")
        .replace(atReg, "<span class = 'at'>$&</span>");

      return marked(hashed);
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
.publication-post {
  position: relative;
  padding: 10px;
  z-index: -1;
  box-shadow: 10px 10px 0px 3px rgb(124, 149, 196);
  margin-bottom: 30px;
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
}
p {
  display: inline;
}
</style> 