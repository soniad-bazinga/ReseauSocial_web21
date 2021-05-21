<template>
  <div id="account-block" class="account">
    <div>
      <h3>Compte</h3>
    </div>
    <!-- Non connecté : on affiche le form de connexion -->
    <div id="unregistered-block" v-if="!logged">
      <form method="post" id="login-form" @submit.prevent="login">
        <div class="mb-3 form-group">
          <label>Ton blaze : </label>
          <input
            type="text"
            class="form-control"
            v-model="inputs.username"
            placeholder="Entrez votre pseudo"
          />
        </div>
        <div class="mb-3 form-group">
          <label>Le mot de passe :</label>
          <input
            type="password"
            class="form-control"
            v-model="inputs.password"
            placeholder="Mot de passe"
          />
        </div>
        <button type="submit" class="btn btn-outline-light col-12">
          Connexion
        </button>
      </form>
      <p id="register-advert" class="form-text">
        Pas encore de compte?
        <span id="register" @click="register">Rejoignez-nous!</span>
      </p>
      <modal v-show="registerModalVisible" @close="closeRegiModal">
        <template v-slot:body>
          <div class="mb-2 form-group">
            <label>Pseudo : </label>
            <input
              class="form-control"
              v-model="inputs.register.username"
              type="text"
            /><br />
          </div>
          <div class="mb-2 form-group">
            <label>Mot de passe <i>(plus de 6 caractères)</i> : </label>
            <input
              class="form-control"
              v-model="inputs.register.password"
              type="password"
            /><br />
          </div>
          <div class="mb-2 form-group">
            <label>Entrez le mot de passe une seconde fois : </label>
            <input
              v-model="inputs.register.password_check"
              type="password"
              class="form-control"
            /><br />
          </div>
          <button class="btn btn-outline-light col-12" @click="checkRegi">
            S'inscrire
          </button>
        </template>
      </modal>
    </div>
    <!-- Connecté : Bouton de deconnexion -->
    <div v-if="logged">
      <div id="profil-picture">
        <button class="btn btn-outline-light col-12 mb-3" @click="showImgModal">
          Changer son avatar
        </button>
        <modal v-show="imgModalVisibile" @close="closeImgModal">
          <template v-slot:body>
            <input
              type="file"
              id="avatar"
              name="avatar"
              accept="image/png, image/jpeg"
              @change="storeImg"
              class="form-control-file mb-3"
            />
            <button class="btn btn-outline-light" @click="changeImg">
              Envoyer
            </button>
          </template>
        </modal>
      </div>
      <button
        class="btn btn-outline-light col-12 mb-3"
        @click="showUsernameModal"
      >
        Changer son pseudo
      </button>
      <modal v-show="usernameModalVisible" @close="closeUsernameModal">
        <template v-slot:body>
          <label>Nouveau pseudo : </label>
          <input
            class="form-control mb-3"
            v-model="inputs.new_username"
            type="text"
            placeholder="monsuperpeusdo63"
          />
          <button class="btn btn-outline-light col-12" @click="changeUsername">
            Envoyer
          </button>
        </template>
      </modal>
      <br />
      <button class="btn btn-outline-light col-12 mb-3" v-on:click="logout">
        Deconnexion
      </button>
    </div>
  </div>
</template>

<script>
const LOGIN_URL = "http://localhost:4000/login";
const REGI_URL = "http://localhost:4000/register";
const CHANGE_IMG_URL = "http://localhost:4000/change_img";
const CHANGE_USER_URL = "http://localhost:4000/change_username";

import Modal from "./Modal.vue";
import alertMessage from "../assets/scripts/alertError.js";

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
        new_username: "",
      },
      imgModalVisibile: false,
      registerModalVisible: false,
      usernameModalVisible: false,
      image: null,
    };
  },
  props: {
    logged: Boolean,
    u_id: Number,
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
            for (let e of res.errors) {
              alertMessage(e, "ERROR");
            }
          }
        })
        .catch(function (error) {
          console.log(error);
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
    showUsernameModal() {
      this.usernameModalVisible = true;
    },
    closeImgModal() {
      this.imgModalVisibile = false;
    },
    closeRegiModal() {
      this.registerModalVisible = false;
    },
    closeUsernameModal() {
      this.usernameModalVisible = false;
    },
    changeImg() {
      if (this.image) {
        this.sendImage();
        this.closeImgModal();
      } else {
        alertMessage("Veuillez inclure une image", "ERROR");
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
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    changeUsername() {
      let user = this.inputs.new_username;
      if (!user || user.trim() === "")
        return alertMessage("Impossible de mettre un pseudo vide", "ERROR");
      if (!/^[a-z0-9]+$/i.test(user))
        return alertMessage(
          "Veuillez n'utiliser que des caractères alphanumériques pour le pseudo",
          "ERROR"
        );
      // Tous les prérequis sont validés
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user,
          u_id: this.u_id,
        }),
      };
      // On l'envoie
      fetch(CHANGE_USER_URL, requestOptions)
        .then((res) => res.json())
        .then((res) => {
          if (res.worked) {
            alertMessage(
              "Changement de pseudo effectué avec succès ! Vous allez être redirigé.e dans un instant...",
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
        })
        .catch(function (error) {
          console.log(error);
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
        alertMessage("Un des champs est vide", "ERROR");
        return;
      }
      if (!/^[a-z0-9]+$/i.test(user)) {
        alertMessage(
          "Veuillez n'utiliser que des caractères alphanumériques pour le pseudo",
          "ERROR"
        );
        return;
      }
      if (pwd1.length < 6) {
        alertMessage("Mot de passe trop court", "ERROR");
        return;
      }
      if (pwd1 !== pwd2) {
        alertMessage("Les mots de passes ne correspondent pas", "ERROR");
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
              "Enregistrement effectué avec succès ! Vous allez être redirigé.e dans un instant...",
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
        })
        .catch(function (error) {
          console.log(error);
        });
    },
  },
};
</script>



<style>
#register {
  text-decoration: underline;
  color: rgb(201, 201, 201);
  cursor: pointer;
}
#register-advert {
  color: white;
}
</style>