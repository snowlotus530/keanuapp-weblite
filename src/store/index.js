import Vue from 'vue'
import Vuex from 'vuex'

import { auth } from './auth.module';

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        currentRoom: null
    },
    mutations: {
        setCurrentRoom(state, room) {
            state.currentRoom = room;
        },
    },
    actions: {
    },
    modules: {
        auth
    },
})
