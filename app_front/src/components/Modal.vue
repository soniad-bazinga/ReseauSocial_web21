<template>
  <div class="modal-bg">
    <div class="modal-content">
      <button id="close-btn" @click="close">X</button><br />
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
.modal-bg,
.modal-bg * {
  z-index: 10000;
}
.modal-content {
  width: auto;
  padding: 20px;
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.3);
  color: white;
  background-color: #2e3957;
}
#close-btn {
  border: none;
  text-align: left;
  background-color: transparent;
  color: white;
  margin-bottom: 10px;
}
</style>
