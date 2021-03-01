global.Olm = require("olm");
import sdk from "matrix-js-sdk";
import util from "../plugins/utils";
import User from "../models/user";

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
                    userDisplayName: null,
                    userAvatar: null,
                    currentRoom: null,
                    notificationCount: 0
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
            },

            watch: {
                currentRoomId: {
                    immediate: true,
                    handler(roomId) {
                        this.currentRoom = this.getRoom(roomId);
                    }
                },
            },

            methods: {
                login(user) {
                    const tempMatrixClient = sdk.createClient(User.homeServerUrl(user.home_server));
                    var promiseLogin;

                    if (user.is_guest && !user.access_token) {
                        // Generate random username and password. We don't user REAL matrix
                        // guest accounts because 1. They are not allowed to post media, 2. They
                        // can not use avatars and 3. They can not seamlessly be upgraded to real accounts.
                        //
                        // Instead, we use an ILAG approach, Improved Landing as Guest.
                        const user = util.randomUser();
                        const pass = util.randomPass();
                        promiseLogin = tempMatrixClient
                            .register(user, pass, null, {
                                type: "m.login.dummy",
                            })
                            .then((response) => {
                                console.log("Response", response);
                                response.password = pass;
                                response.is_guest = true;
                                localStorage.setItem('user', JSON.stringify(response));
                                return response;
                            })
                    } else if (!user.is_guest && user.access_token) {
                        // Logged in on "real" account
                        promiseLogin = Promise.resolve(user);
                    } else {
                        var data = { user: User.localPart(user.user_id), password: user.password, type: "m.login.password" };
                        if (user.device_id) {
                            data.device_id = user.device_id;
                        }
                        promiseLogin = tempMatrixClient
                            .login("m.login.password", data)
                            .then((response) => {
                                var u = response;
                                if (user.is_guest) {
                                    // Copy over needed properties
                                    u = Object.assign(user, response);
                                }
                                localStorage.setItem('user', JSON.stringify(u));
                                return response;
                            })
                    }

                    return promiseLogin
                        .then(user => {
                            return this.getMatrixClient(user);
                        })
                },

                clearCryptoStore() {
                    // Clear crypto related data 
                    // TODO - for some reason "clearStores" called in "logout" only clears the "account" crypto
                    // data item, not all sessions etc. Why? We need to do that manually here!
                    const toRemove = [];
                    for (let i = 0; i < localStorage.length; ++i) {
                        const key = localStorage.key(i);
                        if (key.startsWith("crypto.")) toRemove.push(key);
                    }
                    for (const key of toRemove) {
                        localStorage.removeItem(key);
                    }
                },

                logout() {
                    if (this.matrixClient) {
                        this.removeMatrixClientListeners(this.matrixClient);
                        this.matrixClient.stopClient();
                        this.matrixClient.clearStores().then(() => {
                            this.clearCryptoStore()
                        })
                        this.matrixClient = null;
                        this.matrixClientReady = false;
                    } else {
                        this.clearCryptoStore();
                    }


                    localStorage.removeItem('user');
                    this.$store.commit("setCurrentRoomId", null);
                },

                /**
                 * Upgrade a guest account into a "normal" account. For now, use random user and pass...
                 */
                upgradeGuestAccount() {
                    if (!this.matrixClient || !this.currentUser || !this.currentUser.is_guest) {
                        return Promise.reject("Invalid params");
                    }
                    const randomPassword = util.randomPass();
                    const self = this;
                    return this.matrixClient.register(this.matrixClient.getUserIdLocalpart(), randomPassword, null, {
                        type: "m.login.dummy",
                    }, undefined, this.currentUser.access_token)
                        .then((response) => {
                            console.log("Response", response);
                            response.is_guest = false;
                            response.password = randomPassword;
                            self.currentUser = response;
                            localStorage.setItem('user', JSON.stringify(response)); // Update local storage as well.
                            self.logout();
                            return self.currentUser;
                        });
                },

                initClient() {
                    this.reloadRooms();
                    this.matrixClientReady = true;
                    this.matrixClient.emit('Matrix.initialized', this.matrixClient);
                    this.matrixClient.getProfileInfo(this.currentUserId)
                    .then(info => {
                        console.log("Got user profile: " + JSON.stringify(info));
                        this.userDisplayName = info.displayname;
                        this.userAvatar = info.avatar_url;
                    })
                    .catch(err => {
                        console.log("Failed to get user profile: ", err);
                    })
                },

                async getMatrixClient(user) {
                    if (user === undefined) {
                        user = this.$store.state.auth.user;
                    }
                    if (this.matrixClientReady) {
                        return new Promise((resolve, ignoredreject) => {
                            resolve(user);
                        })
                    } else if (this.matrixClient) {
                        return new Promise((resolve, ignoredreject) => {
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
                        unstableClientRelationAggregation: true,
                        //useAuthorizationHeader: true
                    }
                    this.matrixClient = sdk.createClient(opts);
                    // if (user.is_guest) {
                    //     this.matrixClient.setGuest(true);
                    // }
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
                        client.on("Room", this.onRoom);
                        client.on("Session.logged_out", this.onSessionLoggedOut);
                    }
                },

                removeMatrixClientListeners(client) {
                    if (client) {
                        client.off("event", this.onEvent);
                        client.off("Room", this.onRoom);
                        client.off("Session.logged_out", this.onSessionLoggedOut);
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
                    this.updateNotificationCount();
                },

                onRoom(ignoredroom) {
                    console.log("Got room: " + ignoredroom);
                    this.reloadRooms();
                    this.updateNotificationCount();
                },

                onSessionLoggedOut() {
                    console.log("Logged out!");
                    if (this.matrixClient) {
                        this.removeMatrixClientListeners(this.matrixClient);
                        this.matrixClient.stopClient();
                        this.matrixClient = null;
                        this.matrixClientReady = false;
                    }
                    this.$store.commit("setCurrentRoomId", null);

                    // Clear the access token
                    var user = JSON.parse(localStorage.getItem('user'));
                    if (user) {
                        delete user.access_token;
                    }
                    localStorage.setItem('user', JSON.stringify(user));
                    this.$navigation.push({ name: "Login" }, -1);
                },

                reloadRooms() {
                    // TODO - do incremental update instead of replacing the whole array
                    // each time!
                    var updatedRooms = this.matrixClient.getVisibleRooms();
                    updatedRooms = updatedRooms.filter(room => {
                        return room._selfMembership && (room._selfMembership == "invite" || room._selfMembership == "join");
                    });
                    updatedRooms.forEach(room => {
                        if (!room.avatar) {
                            Vue.set(room, "avatar", room.getAvatarUrl(this.matrixClient.getHomeserverUrl(), 80, 80, "scale", true));
                        }
                    });
                    console.log("Reload rooms", updatedRooms);
                    Vue.set(this, "rooms", updatedRooms);
                    const currentRoom = this.getRoom(this.$store.state.currentRoomId);
                    if (this.currentRoom != currentRoom) {
                        this.currentRoom = currentRoom;
                    }
                },

                setCurrentRoomId(roomId) {
                    this.$store.commit("setCurrentRoomId", roomId);
                    this.currentRoom = this.getRoom(roomId);
                },

                getRoom(roomId) {
                    if (!roomId) {
                        return null;
                    }
                    var room = null;
                    if (this.matrixClient) {
                        const visibleRooms = this.matrixClient.getRooms();
                        room = visibleRooms.find(room => {
                            if (roomId.startsWith("#")) {
                                return room.getCanonicalAlias() == roomId;
                            }
                            return room.roomId == roomId;
                        });
                    }
                    return room || null;
                },

                leaveRoom(roomId) {
                    return this.matrixClient.leave(roomId, undefined)
                        .then(() => {
                            this.rooms = this.rooms.filter(room => {
                                room.roomId != roomId;
                            });
                            this.matrixClient.store.removeRoom(roomId);
                            //this.matrixClient.forget(roomId, true, undefined);
                        })
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

                getPublicRoomInfo(roomId) {
                    if (!roomId) {
                        return Promise.reject("Invalid parameters");
                    }

                    const parts = roomId.split(':');
                    if (parts.length != 2) {
                        return Promise.reject("Unknown room server");
                    }

                    const server = parts[1];
                    const tempMatrixClient = sdk.createClient("https://" + server);

                    const findOrGetMore = function _findOrGetMore(response) {
                        for (var room of response.chunk) {
                            if ((roomId.startsWith("#") && room.canonical_alias == roomId) || (roomId.startsWith("!") && room.room_id == roomId)) {
                                room.avatar = tempMatrixClient.mxcUrlToHttp(room.avatar_url, 80, 80, 'scale', true);
                                return Promise.resolve(room);
                            }
                        }
                        if (response.next_batch) {
                            return tempMatrixClient._http.request(undefined, "GET", "/publicRooms", { limit: 1000, since: response.next_batch })
                                //return tempMatrixClient.publicRooms({limit:1,next_batch:response.next_batch})
                                .then(response => {
                                    return _findOrGetMore(response);
                                })
                                .catch(err => {
                                    return Promise.reject("Failed to find room: " + err);
                                });
                        } else {
                            return Promise.reject("No more data");
                        }
                    };

                    return tempMatrixClient._http.request(undefined, "GET", "/publicRooms", { limit: 1000 })
                        //return tempMatrixClient.publicRooms({limit:1})
                        .then(response => {
                            return findOrGetMore(response);
                        })
                        .catch(err => {
                            return Promise.reject("Failed to find room: " + err);
                        });
                },

                updateNotificationCount() {
                    var count = 0;
                    this.rooms.forEach(room => {
                        count += room.getUnreadNotificationCount('total') || 0;
                    });
                    this.notificationCount = count;
                }

            }
        })

        Vue.prototype.$matrix = matrixService;
    }
}
