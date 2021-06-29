export default class User {
    constructor(home_server, user_id, password, is_guest) {
        this.home_server = home_server;
        this.user_id = user_id;
        this.password = password;
        this.is_guest = is_guest || false
    }

    normalize = function () {
        if (this.user_id.startsWith('@') && this.user_id.includes(':')) {
            const parts = this.user_id.split(":");
            this.user_id = parts[0].substring(1);
            this.home_server = "https://" + parts[1];
        }
    };

    static homeServerUrl = function (home_server) {
        if (home_server && !home_server.startsWith("https://")) {
            return "https://" + home_server;
        }
        return home_server;
    };

    static localPart(user_id) {
        if (user_id && user_id.startsWith('@') && user_id.includes(':')) {
            const parts = user_id.split(":");
            return parts[0].substring(1);
        }
        return user_id;
    }

    static serverName(user_id) {
        if (user_id && user_id.startsWith('@') && user_id.includes(':')) {
            const parts = user_id.split(":");
            return parts[1];
        }
        return user_id;
    }
}