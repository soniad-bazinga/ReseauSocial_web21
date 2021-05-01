<template>
  <div class="publication-post">
    <img
      :src="getImage"
      style="width: 50px; height: 50px"
      alt="profil picture"
    />
    <slot name="subscribe" />
    <p>
      [#{{ postId }}] <span class="at">{{ clientUsername }}</span> :
      <span v-html="hashText"></span><br />
      (le {{ printDate }}). {{ likesCount }} likes
    </p>
    <slot name="like" />
    <slot name="answer" />
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
  color: rgb(67, 182, 218);
}

.at {
  color: violet;
}
.publication-post {
  padding: 5px;
  margin: 5px;
  border: 1px solid grey;
}
p {
  display: inline;
}
</style> 