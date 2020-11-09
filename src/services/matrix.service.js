global.Olm = require("olm");
import sdk from "matrix-js-sdk";
import Vue from 'vue';

const LocalStorageCryptoStore = require("matrix-js-sdk/lib/crypto/store/localStorage-crypto-store")
    .LocalStorageCryptoStore;
sdk.setCryptoStoreFactory(
    () => new LocalStorageCryptoStore(window.localStorage)
);

class MatrixService {
    constructor() {
        this.matrixClient = null;
    }

    login(user) {
        const tempMatrixClient = sdk.createClient(user.server);
        return tempMatrixClient
            .login("m.login.password", { user: user.username, password: user.password, type: "m.login.password" })
            .then((response) => {
                localStorage.setItem('user', JSON.stringify(response));
                return response;
            })
    }

    logout() {
        localStorage.removeItem('user');
    }

    async getMatrixClient(user) {
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
            accessToken: user.access_token
        }
        user.matrixClient = sdk.createClient(opts);
        return user.matrixClient
            .initCrypto()
            .then(() => {
                console.log("Crypto initialized");
                user.matrixClient.startClient();
                return user.matrixClient;
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
            });
    }
}

const matrixService = new MatrixService();
const matrixServicePlugin = {}
matrixServicePlugin.install = function (Vue, ignoredOptions) {
  Vue.prototype.$matrix = matrixService;

  Vue.mixin({
    mounted: function () {
      // Store the VUE instance root in our own $root variable.
      matrixService.$root = this.$root;
    }
  })
}

Vue.use(matrixServicePlugin);

export default MatrixService;