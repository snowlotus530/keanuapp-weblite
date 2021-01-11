import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersist from 'vuex-persist'

import { auth } from './auth.module';

Vue.use(Vuex)

const vuexPersist = new VuexPersist({
    key: 'settings',
    storage: localStorage,
    reducer: state => ({
      currentRoomId: state.currentRoomId
    })
  })

export default new Vuex.Store({
    state: {
        currentRoomId: null
    },
    mutations: {
        setCurrentRoomId(state, roomId) {
            state.currentRoomId = roomId;
        },
    },
    actions: {
    },
    modules: {
        auth
    },
    plugins: [vuexPersist.plugin]
})
