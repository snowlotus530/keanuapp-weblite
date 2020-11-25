global.Olm = require("olm");
import sdk from "matrix-js-sdk";

const LocalStorageCryptoStore = require("matrix-js-sdk/lib/crypto/store/localStorage-crypto-store")
    .LocalStorageCryptoStore;
sdk.setCryptoStoreFactory(
    () => new LocalStorageCryptoStore(window.localStorage)
);

export default {
    install(Vue, options) {
        if (!options || !options.store) {
            throw new Error('Please initialise plugin with a Vuex store.')
        }

        const store = options.store;

        const matrixService = new Vue({
            store,

            data() {
                return {
                    matrixClient: null,
                    matrixClientReady: false,
                    rooms: [],
                }
            },
            mounted() {
                console.log("Matrix service mounted");
            },

            computed: {
                ready() {
                    return this.matrixClient != null && this.matrixClientReady;
                },

                currentUser() {
                    return this.$store.state.auth.user;
                },

                currentUserId() {
                    const user = this.currentUser || {}
                    return user.user_id;
                },

                currentRoomId() {
                    return this.$store.state.currentRoomId;
                },

                currentRoom() {
                    return this.getRoom(this.currentRoomId);
                },

            },

            methods: {
                login(user) {
                    const tempMatrixClient = sdk.createClient(user.server);
                    var promiseLogin;

                    if (user.is_guest) {
                        promiseLogin = tempMatrixClient
                            .registerGuest({}, undefined)
                            .then((response) => {
                                console.log("Response", response);
                                response.is_guest = true;
                                localStorage.setItem('user', JSON.stringify(response));
                                return response;
                            })
                    } else {
                        promiseLogin = tempMatrixClient
                            .login("m.login.password", { user: user.username, password: user.password, type: "m.login.password" })
                            .then((response) => {
                                localStorage.setItem('user', JSON.stringify(response));
                                return response;
                            })
                    }

                    return promiseLogin
                        .then(user => {
                            return this.getMatrixClient(user);
                        })
                },

                logout() {
                    if (this.matrixClient) {
                        this.removeMatrixClientListeners(this.matrixClient);
                        this.matrixClient.stopClient();
                        this.matrixClient = null;
                        this.matrixClientReady = false;
                        localStorage.removeItem('user');
                    }
                    this.$store.commit("setCurrentRoomId", null);
                },

                initClient() {
                    this.reloadRooms();
                    this.matrixClientReady = true;
                    this.matrixClient.emit('Matrix.initialized', this.matrixClient);
                },

                async getMatrixClient(user) {
                    if (this.matrixClientReady) {
                        return new Promise((resolve,ignoredreject) => {
                            resolve(user);
                        })
                    } else if (this.matrixClient) {
                        return new Promise((resolve,ignoredreject) => {
                            this.matrixClient.once('Matrix.initialized', (ignoredclient) => {
                                resolve(user);
                            });
                        })
                    }

                    const matrixStore = new sdk.MemoryStore(window.localStorage);
                    const webStorageSessionStore = new sdk.WebStorageSessionStore(
                        window.localStorage
                    );

                    var homeServer = user.home_server;
                    if (!homeServer.startsWith("https://")) {
                        homeServer = "https://" + homeServer;
                    }

                    var opts = {
                        baseUrl: homeServer,
                        userId: user.user_id,
                        store: matrixStore,
                        sessionStore: webStorageSessionStore,
                        deviceId: user.device_id,
                        accessToken: user.access_token,
                        timelineSupport: true,
                        unstableClientRelationAggregation: true
                    }
                    this.matrixClient = sdk.createClient(opts);
                    if (user.is_guest) {
                        this.matrixClient.setGuest(true);
                    }
                    return this.matrixClient
                        .initCrypto()
                        .then(() => {
                            console.log("Crypto initialized");

                            this.addMatrixClientListeners(this.matrixClient);

                            this.matrixClient.startClient();
                            return this.matrixClient;
                        })
                        .then(matrixClient => {
                            if (matrixClient.isInitialSyncComplete()) {
                                console.log("Initial sync done already!");
                                return matrixClient;
                            } else {
                                return new Promise((resolve, reject) => {
                                    matrixClient.once(
                                        "sync",
                                        function (state, ignoredprevState, ignoredres) {
                                            console.log(state); // state will be 'PREPARED' when the client is ready to use
                                            if (state == "PREPARED") {
                                                resolve(matrixClient);
                                            } else if (state == "ERROR") {
                                                reject("Error syncing");
                                            }
                                        }
                                    )
                                });
                            }
                        })
                        .then(() => {
                            // Ready to use! Start by loading rooms.
                            this.initClient();
                            return user;
                        })
                },

                addMatrixClientListeners(client) {
                    if (client) {
                        client.on("event", this.onEvent);
                    }
                },

                removeMatrixClientListeners(client) {
                    if (client) {
                        client.off("event", this.onEvent);
                    }
                },

                onEvent(event) {
                    switch (event.getType()) {
                        case "m.room.topic": {
                            const room = this.matrixClient.getRoom(event.getRoomId());
                            if (room) {
                                Vue.set(room, "topic", event.getContent().topic);
                            }
                        }
                            break;

                        case "m.room.avatar": {
                            const room = this.matrixClient.getRoom(event.getRoomId());
                            if (room) {
                                Vue.set(room, "avatar", room.getAvatarUrl(this.matrixClient.getHomeserverUrl(), 80, 80, "scale", true));
                            }
                        }
                            break;
                    }
                },

                reloadRooms() {
                    this.rooms = this.matrixClient.getVisibleRooms();
                    this.rooms.forEach(room => {
                        Vue.set(room, "avatar", room.getAvatarUrl(this.matrixClient.getHomeserverUrl(), 80, 80, "scale", true));
                    });
                },

                setCurrentRoomId(roomId) {
                    this.$store.commit("setCurrentRoomId", roomId);
                },

                getRoom(roomId) {
                    // if (this.matrixClient) {
                    //     return this.matrixClient.getRoom(roomId);
                    // }
                    return this.rooms.find(room => room.roomId == roomId);
                },

                on(event, handler) {
                    if (this.matrixClient) {
                        this.matrixClient.on(event, handler);
                    }
                },

                off(event, handler) {
                    if (this.matrixClient) {
                        this.matrixClient.off(event, handler);
                    }
                },

                uploadFile(file, opts) {
                    return this.matrixClient.uploadContent(file, opts);
                },
            }
        })

        Vue.prototype.$matrix = matrixService;
    }
}
