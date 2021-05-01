<template>
  <div id="account-block">
    <h1>Bloc compte</h1>
    <!-- Non connecté : on affiche le form de connexion -->
    <div id="unregistered-block" v-if="!logged">
      <form method="post" id="login-form" @submit.prevent="login">
        <input type="text" v-model="inputs.username" placeholder="Pseudo" />
        <input
          type="password"
          v-model="inputs.password"
          placeholder="Mot de passe"
        />
        <input type="submit" value="Se connecter" />
      </form>
      <p>
        Pas encore de compte?
        <span id="register" @click="register">Cliquez ici !</span>
      </p>
      <modal v-show="registerModalVisible" @close="closeRegiModal">
        <template v-slot:body>
          <label>Pseudo : </label>
          <input v-model="inputs.register.username" type="text" /><br />
          <label>Mot de passe (>=6) : </label>
          <input v-model="inputs.register.password" type="password" /><br />
          <label>Entrez le mot de passe une seconde fois : </label>
          <input
            v-model="inputs.register.password_check"
            type="password"
          /><br />
          <button @click="checkRegi">S'inscrire</button>
        </template>
      </modal>
    </div>
    <!-- Connecté : Bouton de deconnexion -->
    <div v-if="logged">
      <div id="profil-picture">
        <button @click="showImgModal">Changer son avatar</button>
        <modal v-show="imgModalVisibile" @close="closeImgModal">
          <template v-slot:body>
            <input
              type="file"
              id="avatar"
              name="avatar"
              accept="image/png, image/jpeg"
              @change="storeImg"
            />
            <button @click="changeImg">Envoyer</button>
          </template>
        </modal>
      </div>
      <button v-on:click="logout">Deconnexion</button>
    </div>
  </div>
</template>

<script>
const LOGIN_URL = "http://localhost:4000/login";
const REGI_URL = "http://localhost:4000/register";
const CHANGE_IMG_URL = "http://localhost:4000/change_img";

import Modal from "./Modal.vue";
import alertMessage from "../assets/alertError.js";

export default {
  name: "Account",
  data: function () {
    return {
      inputs: {
        username: "",
        password: "",
        register: {
          username: "",
          password: "",
          password_check: "",
        },
      },
      imgModalVisibile: false,
      registerModalVisible: false,
      image: null,
    };
  },
  props: {
    logged: Boolean,
  },
  components: {
    Modal,
  },
  methods: {
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
          if (res.worked) {
            this.$session.set("u_id", res.result.u_id);
            this.$session.set("username", res.result.username);
            this.$session.set(
              "subscribed",
              JSON.stringify(res.result.subscribed)
            );

            // On refresh
            this.$router.go();
          } else {
            console.log("err");
            for (let e of res.errors) {
              console.log(e);
              alertMessage(e, "ERROR");
            }
          }
        });
    },
    // Pour se deconnecter
    logout: function () {
      // On vide le storage et on refresh
      this.$session.destroy();

      this.$router.go();
    },
    showImgModal() {
      this.imgModalVisibile = true;
    },
    showRegiModal() {
      this.registerModalVisible = true;
    },
    closeImgModal() {
      this.imgModalVisibile = false;
    },
    closeRegiModal() {
      this.registerModalVisible = false;
    },
    changeImg() {
      if (this.image) {
        this.sendImage();
        this.closeImgModal();
      } else {
        console.log("No image :(");
      }
    },
    storeImg(e) {
      if (e.target.files.length > 0) {
        this.image = e.target.files[0];
      }
    },
    sendImage() {
      let id = this.$session.get("u_id");

      let formData = new FormData();
      formData.append("u_id", id);
      formData.append("image", this.image);

      const requestOptions = {
        method: "POST",
        body: formData,
      };
      // On l'envoie
      fetch(CHANGE_IMG_URL, requestOptions)
        .then((res) => res.json())
        .then((res) => {
          if (res.worked) {
            alertMessage("Avatar changé avec succès !", "SUCCESS");
          } else {
            for (let e of res.errors) {
              alertMessage(e, "ERROR");
            }
          }
        });
    },
    register() {
      this.showRegiModal();
    },
    checkRegi() {
      let user = this.inputs.register.username;
      let pwd1 = this.inputs.register.password;
      let pwd2 = this.inputs.register.password_check;
      if (user.trim() === "" || pwd1.trim() === "" || pwd2.trim() === "") {
        console.log("Un des champs est vide");
        return;
      }
      if (!/^[a-z0-9]+$/i.test(user)) {
        console.log(
          "Veuillez n'utiliser que des caractères alphanumériques pour le pseudo"
        );
        return;
      }
      if (pwd1.length < 6) {
        console.log("Mot de passe trop court");
        return;
      }
      if (pwd1 !== pwd2) {
        console.log("Les mots de passes ne correspondent pas");
        return;
      }
      // Tous les prérequis sont validés
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user,
          password: pwd1,
        }),
      };
      // On l'envoie
      fetch(REGI_URL, requestOptions)
        .then((res) => res.json())
        .then((res) => {
          if (res.worked) {
            alertMessage(
              "Enregistrement effectué avec succès ! Vous allez être redirigé dans un instant...",
              "SUCCESS"
            );

            setTimeout(() => {
              this.$router.go();
            }, 2500);
          } else {
            for (let e of res.errors) {
              alertMessage(e, "ERROR");
            }
          }
        });
    },
  },
};
</script>

<style>
#register {
  text-decoration: underline;
  color: rgb(40, 75, 97);
  cursor: pointer;
}
</style>