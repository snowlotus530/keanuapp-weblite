import Vue from 'vue'
import VueRouter from 'vue-router'
//import Home from '../components/Home.vue'
import Chat from '../components/Chat.vue'
import Login from '../components/Login.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Chat
  },
  {
    path: '/room/',
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
    path: '/join/',
    name: 'Join',
    component: () => import('../components/Join.vue'),
    props: true
  },
]

const router = new VueRouter({
  routes
});

router.beforeEach((to, from, next) => {
  const publicPages = ['/login'];
  var authRequired = !publicPages.includes(to.path) && !to.path.startsWith('/join');
  const loggedIn = localStorage.getItem('user');

  if (to.path.startsWith('/room/')) {
    if (to.hash && to.hash.startsWith('#')) {
      //Invite to public room
      router.app.$matrix.setCurrentRoomId(to.hash);
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
