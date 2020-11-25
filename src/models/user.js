export default class User {
    constructor(server, username, password, is_guest) {
        this.server = server;
        this.username = username;
        this.password = password;
        this.is_guest = is_guest || false
    }
}