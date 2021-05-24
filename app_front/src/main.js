import Vue from 'vue'
import App from './App.vue'
import VueSession from 'vue-session'

Vue.config.productionTip = false

Vue.use(VueSession)

new Vue({
  render: h => h(App)
}).$mount('#app')


