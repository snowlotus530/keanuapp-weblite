import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import icUser from '@/assets/icons/user.vue';
import icPassword from '@/assets/icons/password.vue';
import icEdit from '@/assets/icons/edit.vue';
import icGlobe from '@/assets/icons/globe.vue';

Vue.use(Vuetify);

export default new Vuetify({
  icons: {
    iconfont: 'md',
    values: {
      user: {
        component: icUser
      },
      password: {
        component: icPassword        
      },
      edit: {
        component: icEdit
      },
      globe: {
        component: icGlobe
      },
    },
    user: icUser
  },
});
