import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import router from './router'
import store from './store'
import matrix from './services/matrix.service'
import navigation from './services/navigation.service'
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import VEmojiPicker from 'v-emoji-picker';
import VueResize from 'vue-resize';
import 'vue-resize/dist/vue-resize.css';

Vue.config.productionTip = false

Vue.use(VueResize);
Vue.use(VEmojiPicker);
Vue.use(matrix, {store: store});

// Add bubble functionality to custom events.
// From here: https://stackoverflow.com/questions/41993508/vuejs-bubbling-custom-events
Vue.use((Vue) => {
  Vue.prototype.$bubble = function $bubble(eventName, ...args) {
    // Emit the event on all parent components
    let component = this;
    do {
      component.$emit(eventName, ...args);
      component = component.$parent;
    } while (component);
  };
});

Vue.use(navigation, router);

new Vue({
  vuetify,
  router,
  store,
  matrix,
  render: h => h(App)
}).$mount('#app');