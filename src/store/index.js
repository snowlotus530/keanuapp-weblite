import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersist from 'vuex-persist'

Vue.use(Vuex)


// A Vuex plugin to persist the user object to either session or local storage, based on flag in the store state.
//
const persistUserPlugin = store => {
    var user;
    if (store.state.useLocalStorage) {
        user = JSON.parse(window.localStorage.getItem('user'));
    } else {
        user = JSON.parse(window.sessionStorage.getItem('user'));
    }
    const initialState = user ? { status: { loggedIn: true }, user } : { status: { loggedIn: false }, user: null };
    store.state.auth = initialState;

    store.subscribe((mutation, state) => {
        if (mutation.type == 'setUser' || mutation.type == 'setUseLocalStorage') {
            if (state.useLocalStorage) {
                window.localStorage.setItem('user', JSON.stringify(state.auth.user));
                window.sessionStorage.removeItem('user');
            } else {
                window.sessionStorage.setItem('user', JSON.stringify(state.auth.user));
                window.localStorage.removeItem('user');
            }
        }
    })
}


const vuexPersistLocalStorage = new VuexPersist({
    key: 'settings',
    storage: localStorage,
    reducer: state => {
        if (state.useLocalStorage) {
            return {
                currentRoomId: state.currentRoomId,
            };
        } else {
            return {};
        }
    }
})

const vuexPersistSessionStorage = new VuexPersist({
    key: 'settings',
    storage: sessionStorage,
    reducer: state => {
        if (!state.useLocalStorage) {
            return {
                currentRoomId: state.currentRoomId,
            };
        } else {
            return {};
        }
    }
})

const defaultUseSessionStorage = (sessionStorage.getItem('user') != null);

export default new Vuex.Store({
    state: { currentRoomId: null, auth: null, tempuser: null, useLocalStorage: !defaultUseSessionStorage },
    mutations: {
        loginSuccess(state, user) {
            state.auth.status.loggedIn = true;
            state.auth.user = user;
        },
        loginFailure(state) {
            state.auth.status.loggedIn = false;
            state.auth.user = null;
        },
        logout(state) {
            state.auth.status.loggedIn = false;
            state.auth.user = null;
        },
        setCurrentRoomId(state, roomId) {
            state.currentRoomId = roomId;
        },
        setUser(state, user) {
            state.auth.user = JSON.stringify(user);
        },
        setTempUser(state, user) {
            state.tempuser = JSON.stringify(user);
        },
        setUseLocalStorage(state, useLocalStorage) {
            state.useLocalStorage = useLocalStorage;
        }
    },
    actions: {
        login({ commit }, user) {
            return this._vm.$matrix.login(user).then(
                user => {
                    commit('loginSuccess', user);
                    return Promise.resolve(user);
                },
                error => {
                    commit('loginFailure');
                    return Promise.reject(error);
                }
            );
        },
        logout({ commit }) {
            this._vm.$matrix.logout();
            commit('logout');
        },
    },
    getters: {
        storage: state => {
            if (state.useLocalStorage) {
                return window.localStorage;
            } else {
                return window.sessionStorage;
            }
        }
    },
    plugins: [vuexPersistLocalStorage.plugin, vuexPersistSessionStorage.plugin, persistUserPlugin]
})
