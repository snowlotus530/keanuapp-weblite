import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../components/Home.vue'
import Chat from '../components/Chat.vue'
import Join from '../components/Join.vue'
import Login from '../components/Login.vue'
import Profile from '../components/Profile.vue'
import CreateRoom from '../components/CreateRoom.vue'

import util from '../plugins/utils'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/room/:roomId?',
    name: 'Chat',
    component: Chat,
    meta: {
      includeRoom: true
    }
  },
  {
    path: '/info',
    name: 'RoomInfo',
    component: () => import('../components/RoomInfo.vue'),
    props: true,
    meta: {
      title: 'Info',
      includeRoom: true
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: {
      title: 'Profile'
    }
  },
  {
    path: '/createroom',
    name: 'CreateRoom',
    component: CreateRoom,
    meta: {
      title: 'Create room'
    }
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
  {
    path: '/invite/:roomId?',
    name: 'Invite',
    component: () => import('../components/Invite.vue'),
    meta: {
      title: 'Add Friends'
    }
  },
  {
    path: '/goodbye',
    name: 'Goodbye',
    component: () => import('../components/QuoteView.vue'),
  }
]

const router = new VueRouter({
  routes
});

router.beforeEach((to, from, next) => {
  const publicPages = ['/login'];
  var authRequired = !publicPages.includes(to.path);
  const loggedIn = router.app.$store.state.auth.user;

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
  } else if (to.name == 'Invite') {
    if (to.params.roomId) {
      const roomId = util.sanitizeRoomId(to.params.roomId);
      router.app.$matrix.setCurrentRoomId(roomId);
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

router.getRoomLink = function(roomId) {
  return window.location.origin + window.location.pathname + "#/room/" + encodeURIComponent(util.sanitizeRoomId(roomId));
}

export default router
