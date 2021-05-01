<template>
  <div class="modal-bg">
    <div class="modal-content">
      <button @click="close">X</button><br />
      <slot name="header"></slot>
      <slot name="body"></slot>
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script>
export default {
  data: function () {
    return {};
  },
  methods: {
    close: function () {
      this.$emit("close");
    },
  },
};
</script>

<style>
.modal-bg {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
