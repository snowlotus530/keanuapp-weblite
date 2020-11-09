import Vue from 'vue'
import Vuex from 'vuex'

import { auth } from './auth.module';

Vue.use(Vuex)

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
})
