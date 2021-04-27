<template>
  <div class="publication-post">
    <p>
      #{{ postId }} [{{ clientUsername }} #{{ clientId }}] //
      {{ postContent }} (le {{ datePublication }}). <br />
      {{ likesCount }} likes
    </p>
    <img
      style="width: 50px; height: 50px"
      :src="require('@/assets/' + imageUrl)"
      alt="profil picture"
    />
    <slot></slot>
  </div>
</template>
    
<script>
export default {
  name: "Publication",
  data: function () {
    return {};
  },
  props: {
    "date-publication": String,
    "post-content": String,
    "likes-count": Number,
    "likes-infos": Array,
    "post-id": Number,
    "client-username": String,
    "client-id": Number,
    "image-url": String,
    mentions: Array,
    hashtags: Array,
    liked: Boolean,
  },
};
</script>
    
<style>
</style> 