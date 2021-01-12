import Vue from 'vue'
import VueRouter from 'vue-router'
//import Home from '../components/Home.vue'
import Chat from '../components/Chat.vue'
import Join from '../components/Join.vue'
import Login from '../components/Login.vue'
import util from '../plugins/utils'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Chat
  },
  {
    path: '/room/:roomId?',
    name: 'Chat',
    component: Chat
  },
  {
    path: '/info',
    name: 'RoomInfo',
    component: () => import('../components/RoomInfo.vue'),
    props: true,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    props: true
  },
  {
    path: '/join/:roomId?',
    name: 'Join',
    component: Join
  },
]

const router = new VueRouter({
  routes
});

router.beforeEach((to, from, next) => {
  const publicPages = ['/login'];
  var authRequired = !publicPages.includes(to.path);
  const loggedIn = localStorage.getItem('user');

  if (to.name == 'Chat' || to.name == 'Join') {
    if (!to.params.roomId && to.hash) {
      // Public rooms start with '#', confuses the router. If hash but no roomId param, set it.
      to.params.roomId = to.hash;
    }
    const roomId = util.sanitizeRoomId(to.params.roomId);
    router.app.$matrix.setCurrentRoomId(roomId);
    if (roomId && roomId.startsWith('#')) {
      //Invite to public room
      authRequired = false;
    }
  }

  // trying to access a restricted page + not logged in
  // redirect to login page
  if (authRequired && !loggedIn) {
    next('/login');
  } else {
    next();
  }
});

export default router
