global.Olm = require("olm");
import sdk from "matrix-js-sdk";
import { TimelineWindow, EventTimeline } from "matrix-js-sdk";
import util from "../plugins/utils";
import User from "../models/user";
import config from "../assets/config";

const LocalStorageCryptoStore = require("matrix-js-sdk/lib/crypto/store/localStorage-crypto-store")
    .LocalStorageCryptoStore;

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

                currentUserDisplayName() {
                    if (this.ready) {
                        const user = this.matrixClient.getUser(this.currentUserId) || {}
                        return this.userDisplayName || user.displayName;
                    }
                    return null;
                },

                currentRoomId() {
                    return this.$store.state.currentRoomId;
                },

                joinedRooms() {
                    return this.rooms.filter(room => {
                        return room._selfMembership === 'join'
                    });
                },

                invites() {
                    return this.rooms.filter(room => {
                        return room._selfMembership === 'invite'
                    });
                }
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
                createCryptoStore() {
                    console.log("create crypto store");
                    return new LocalStorageCryptoStore(this.$store.getters.storage);
                },
                login(user) {
                    const tempMatrixClient = sdk.createClient(User.homeServerUrl(user.home_server));
                    var promiseLogin;

                    const self = this;
                    if (user.access_token) {
                        // Logged in on "real" account
                        promiseLogin = Promise.resolve(user);
                    } else if (user.is_guest && !user.user_id) {
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
                                this.$store.commit("setUser", response);
                                return response;
                            })
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
                                this.$store.commit("setUser", u);
                                return response;
                            })
                    }

                    return promiseLogin
                        .then((user) => {
                            return self.getMatrixClient(user);
                        });
                },

                clearCryptoStore() {
                    // Clear crypto related data 
                    // TODO - for some reason "clearStores" called in "logout" only clears the "account" crypto
                    // data item, not all sessions etc. Why? We need to do that manually here!
                    const toRemove = [];
                    const storage = this.$store.getters.storage;
                    for (let i = 0; i < storage.length; ++i) {
                        const key = storage.key(i);
                        if (key.startsWith("crypto.")) toRemove.push(key);
                    }
                    for (const key of toRemove) {
                        storage.removeItem(key);
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


                    this.$store.commit("setUser", null);
                    this.$store.commit("setCurrentRoomId", null);
                    this.rooms = [];
                    this.userDisplayName = null;
                    this.userAvatar = null;
                    this.currentRoom = null;
                    this.notificationCount = 0;
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

                getMatrixClient(user) {
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

                    const matrixStore = new sdk.MemoryStore(this.$store.getters.storage);
                    const webStorageSessionStore = new sdk.WebStorageSessionStore(
                        this.$store.getters.storage
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

                /**
                * Returns a promise that will log us into the Matrix.
                * 
                * Will use a real account, if we have one, otherwise will create
                * a random account.
                */
                getLoginPromise() {
                    if (this.ready) {
                        return Promise.resolve(this.currentUser);
                    }
                    return this.$store.dispatch("login", this.currentUser || new User(config.defaultServer, "", "", true));
                },

                addMatrixClientListeners(client) {
                    if (client) {
                        client.on("event", this.onEvent);
                        client.on("Room", this.onRoom);
                        client.on("Session.logged_out", this.onSessionLoggedOut);
                        client.on("Room.myMembership", this.onRoomMyMembership);
                    }
                },

                removeMatrixClientListeners(client) {
                    if (client) {
                        client.off("event", this.onEvent);
                        client.off("Room", this.onRoom);
                        client.off("Session.logged_out", this.onSessionLoggedOut);
                        client.off("Room.myMembership", this.onRoomMyMembership);
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

                onRoomMyMembership(room) {
                    if (room._selfMembership === "invite") {
                        // Invitation. Need to call "recalculate" to pick
                        // up room name, not sure why exactly.
                        room.recalculate();
                        this.reloadRooms();
                    }
                },

                onSessionLoggedOut() {
                    console.log("Logged out!");
                    if (this.matrixClient) {
                        this.removeMatrixClientListeners(this.matrixClient);
                        this.matrixClient.stopClient();
                        this.matrixClient = null;
                        this.matrixClientReady = false;
                    }

                    // For "real" accounts we totally wipe the user object, but for "guest"
                    // accounts (i.e. created from random data and with password never changed)
                    // we need to hang on to the generated password and use that to login to a new
                    // session, so only wipe the token in s that case.
                    // Clear the access token
                    var user = JSON.parse(this.$store.state.auth.user);
                    if (user.is_guest) {
                        delete user.access_token;
                        this.$store.commit("setUser", user);
                        // Login again
                        this.login(user);
                    } else {
                        this.$store.commit("setUser", null);
                        this.$store.commit("setCurrentRoomId", null);
                        this.$navigation.push({ path: "/login" }, -1);
                    }
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

                /**
                 * Return all users we are in a "invite" only room with!
                 */
                getAllFriends() {
                    var ids = {};
                    const ret = [];
                    for (const room of this.rooms) {
                        if (room._selfMembership == 'join' && this.getRoomJoinRule(room) == 'invite') {
                            for (const member of room.getJoinedMembers()) {
                                if (member.userId != this.currentUserId && !ids[member.userId]) {
                                    ids[member.userId] = member;
                                    ret.push(member);
                                }
                            }
                        }
                    }
                    ret.sort((a, b) => {
                        const aName = a.user ? a.user.displayName : a.name;
                        const bName = b.user ? b.user.displayName : b.name;
                        return aName.localeCompare(bName);
                    });
                    return ret;
                },

                getRoomJoinRule(room) {
                    if (room) {
                        const joinRules = room.currentState.getStateEvents(
                            "m.room.join_rules",
                            ""
                        );
                        return joinRules && joinRules.getContent().join_rule;
                    }
                    return null;
                },

                getRoomHistoryVisibility(room) {
                    if (room) {
                        const historyVisibility = room.currentState.getStateEvents(
                            "m.room.history_visibility",
                            ""
                        );
                        return historyVisibility && historyVisibility.getContent().history_visibility;
                    }
                    return null;
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

                /**
                 * Purge the room with the given id! This means:
                 * - Make room invite only
                 * - Disallow guest access
                 * - Set history visibility to 'joined'
                 * - Redact all events
                 * - Kick all members
                 * @param roomId 
                 */
                purgeRoom(roomId) {
                    return new Promise((resolve, reject) => {
                        const room = this.getRoom(roomId);
                        if (!room) {
                            reject("Room not found!");
                            return;
                        }

                        const timelineWindow = new TimelineWindow(
                            this.matrixClient,
                            room.getUnfilteredTimelineSet(),
                            {}
                        );
                        const self = this;

                        console.log("Purge: set invite only");
                        this.matrixClient.sendStateEvent(
                            roomId,
                            "m.room.join_rules",
                            { join_rule: "invite" },
                            ""
                        )
                            .then(() => {
                                console.log("Purge: forbid guest access");
                                return this.matrixClient.sendStateEvent(
                                    roomId,
                                    "m.room.guest_access",
                                    { guest_access: "forbidden" },
                                    ""
                                );
                            })
                            .then(() => {
                                console.log("Purge: set history visibility to 'joined'");
                                return this.matrixClient.sendStateEvent(roomId, "m.room.history_visibility", {
                                    history_visibility: "joined",
                                });
                            })
                            .then(() => {
                                console.log("Purge: create timeline");
                                return timelineWindow.load(null, 100)
                            })
                            .then(() => {
                                const getMoreIfAvailable = function _getMoreIfAvailable() {
                                    if (timelineWindow.canPaginate(EventTimeline.BACKWARDS)
                                    ) {
                                        console.log("Purge: page back");
                                        return timelineWindow
                                            .paginate(EventTimeline.BACKWARDS, 100, true, 5)
                                            .then((ignoredsuccess) => {
                                                return _getMoreIfAvailable.call(self);
                                            });
                                    } else {
                                        return Promise.resolve("Done");
                                    }
                                }.bind(self);
                                return getMoreIfAvailable();
                            })
                            .then(() => {
                                console.log("Purge: redact events");
                                var redactionPromises = [];
                                timelineWindow.getEvents().forEach(event => {
                                    if (!event.isRedacted() && !event.isRedaction() && !event.isState()) {
                                        // Redact!
                                        redactionPromises.push(this.matrixClient.redactEvent(event.getRoomId(), event.getId()));
                                    }
                                });
                                return Promise.all(redactionPromises);
                            })
                            .then(() => {
                                console.log("Purge: kick members");
                                var joined = room.getMembersWithMembership("join");
                                var invited = room.getMembersWithMembership("invite");
                                var members = joined.concat(invited);

                                var kickPromises = [];
                                members.forEach(member => {
                                    if (member.userId != self.currentUserId) {
                                        kickPromises.push(this.matrixClient.kick(roomId, member.userId));
                                    }
                                });
                                return Promise.all(kickPromises);
                            })
                            .then(() => {
                                resolve(true); // Done!
                            })
                            .catch((err) => {
                                console.error("Error purging room", err);
                                reject(err);
                            });
                    })
                },

                /**
                 * Get a private chat room with the given user. Searches through our rooms to see
                 * if a suitable room already exists. If not, one is created.
                 * @param {*} userId The user to chat with.
                 */
                getOrCreatePrivateChat(userId) {
                    return new Promise((resolve, reject) => {
                        for (const room of this.rooms) {
                            // Is the other member the one we are looking for?
                            if (this.isDirectRoomWith(room, userId)) {
                                var member = room.getMember(userId);
                                if (member && member.membership == "invite") {
                                    // TODO Resend invite
                                }
                                resolve(room);
                                return;
                            }
                        }

                        // No room found, create one
                        //
                        const createRoomOptions = {
                            visibility: "private", // Not listed!
                            preset: "private_chat",
                            initial_state: [
                                {
                                    type: "m.room.encryption",
                                    state_key: "",
                                    content: {
                                        algorithm: "m.megolm.v1.aes-sha2",
                                    },
                                },
                                {
                                    type: "m.room.guest_access",
                                    state_key: "",
                                    content: {
                                        guest_access: "forbidden",
                                    },
                                },
                            ],
                            invite: [userId]
                        };
                        return this.matrixClient
                            .createRoom(createRoomOptions)
                            .then(({ room_id, room_alias }) => {
                                resolve(this.getRoom(room_alias || room_id));
                            })
                            .catch((error) => {
                                reject(error);
                            });
                    })
                },

                /**
                 * Return true if this room is a direct room with the given user.
                 * @param { } room 
                 * @param {*} userId 
                 */
                isDirectRoomWith(room, userId) {
                    if (room._selfMembership == "join" && room.getInvitedAndJoinedMemberCount() == 2) {
                        // Is the other member the one we are looking for?
                        if (room.getMembersWithMembership("join").some(item => item.userId == userId)) {
                            return true;
                        } else if (room.getMembersWithMembership("invite").some(item => item.userId == userId)) {
                            return true;
                        }
                    }
                    return false;
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

                setPassword(oldPassword, newPassword) {
                    if (this.matrixClient && this.currentUser) {
                        const authDict = {
                            type: 'm.login.password',
                            identifier: {
                                type: 'm.id.user',
                                user: this.currentUser.user_id,
                            },
                            // TODO: Remove `user` once servers support proper UIA
                            // See https://github.com/matrix-org/synapse/issues/5665
                            user: this.currentUser.user_id,
                            password: oldPassword,
                        };
                        const self = this;
                        return this.matrixClient.setPassword(authDict, newPassword)
                            .then(() => {
                                // Forget password and remove the 'is_guest' flag, we are now a "real" user!
                                self.currentUser.password = undefined;
                                self.currentUser.is_guest = false;
                                self.$store.commit("setUser", self.currentUser);
                            })
                            .then(() => {
                                return true;
                            })
                    }
                    return Promise.resolve(false);
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

                    var clientPromise;
                    if (this.matrixClient) {
                        clientPromise = this.getMatrixClient().then(() => {
                            return this.matrixClient;
                        })
                    } else {
                        const tempMatrixClient = sdk.createClient(config.defaultServer);
                        var tempUserString = this.$store.state.tempuser;
                        var tempUser = null;
                        if (tempUserString) {
                            tempUser = JSON.parse(tempUserString);
                        }

                        // Need to create an account?
                        //
                        if (tempUser) {
                            clientPromise = Promise.resolve(tempUser);
                        } else {
                            const user = util.randomUser();
                            const pass = util.randomPass();
                            clientPromise = tempMatrixClient
                                .register(user, pass, null, {
                                    type: "m.login.dummy",
                                })
                                .then((response) => {
                                    console.log("Response", response);
                                    response.password = pass;
                                    response.is_guest = true;
                                    this.$store.commit("setTempUser", response);
                                    return response;
                                });
                        }

                        // Get an access token
                        clientPromise = clientPromise.then(user => {
                            var data = { user: User.localPart(user.user_id), password: user.password, type: "m.login.password" };
                            if (user.device_id) {
                                data.device_id = user.device_id;
                            }
                            return tempMatrixClient.login("m.login.password", data)
                        })

                        // Then login
                        //
                        // Create a slimmed down client, without crypto. This one is
                        // Only used to get public room info from.
                        clientPromise = clientPromise.then(user => {
                            var opts = {
                                baseUrl: config.defaultServer,
                                userId: user.user_id,
                                accessToken: user.access_token,
                                timelineSupport: false,
                            }
                            var matrixClient = sdk.createClient(opts);
                            matrixClient.startClient();
                            return matrixClient;
                        });
                    }

                    const findOrGetMore = function _findOrGetMore(client, response) {
                        for (var room of response.chunk) {
                            if ((roomId.startsWith("#") && room.canonical_alias == roomId) || (roomId.startsWith("!") && room.room_id == roomId)) {
                                if (room.avatar_url) {
                                    room.avatar = client.mxcUrlToHttp(room.avatar_url, 80, 80, 'scale', true);
                                }
                                return Promise.resolve(room);
                            }
                        }
                        if (response.next_batch) {
                            return client.publicRooms({ server: server, limit: 1000, since: response.next_batch })
                                .then(response => {
                                    return _findOrGetMore(client, response);
                                })
                                .catch(err => {
                                    return Promise.reject("Failed to find room: " + err);
                                });
                        } else {
                            return Promise.reject("No more data");
                        }
                    };

                    var matrixClient;
                    return clientPromise
                        .then(client => {
                            matrixClient = client;
                            return matrixClient.publicRooms({ server: server, limit: 1000 })
                        })
                        .then(response => {
                            return findOrGetMore(matrixClient, response);
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

        sdk.setCryptoStoreFactory(matrixService.createCryptoStore.bind(matrixService));

        Vue.prototype.$matrix = matrixService;
    }
}
