import axios from 'axios';
import * as ContentHelpers from "matrix-js-sdk/lib/content-helpers";
var sha256 = require('js-sha256').sha256;
var aesjs = require('aes-js');
var base64Url = require('json-web-key/lib/base64url');

class Util {
    getAttachment(matrixClient, event) {
        return new Promise((resolve, reject) => {
            const content = event.getContent();
            if (content.url != null) {
                // Unencrypted, just return!
                resolve(matrixClient.mxcUrlToHttp(content.url));
                return;
            }
            var url = null;
            var file = null;
            if (content.file && content.file.url) {
                file = content.file;
                url = matrixClient.mxcUrlToHttp(file.url);
            }

            if (url == null) {
                reject("No url found!");
            }

            axios.get(url, { responseType: 'arraybuffer' })
                .then(response => {
                    return this.decryptIfNeeded(file, response);
                })
                .then(bytes => {
                    resolve(URL.createObjectURL(new Blob([bytes.buffer], { type: file.mimetype })));
                })
                .catch(err => {
                    console.log("Download error: ", err);
                    reject(err);
                });
        });
    }

    getThumbnail(matrixClient, event, ignoredw, ignoredh) {
        return new Promise((resolve, reject) => {
            const content = event.getContent();
            if (content.url != null) {
                // Unencrypted, just return!
                resolve(matrixClient.mxcUrlToHttp(content.url));
                return;
            }
            var url = null;
            var file = null;
            if (
                content &&
                content.info &&
                content.info.thumbnail_file &&
                content.info.thumbnail_file.url
            ) {
                file = content.info.thumbnail_file;
                // var width = w;
                // var height = h;
                // if (content.info.w < w || content.info.h < h) {
                //     width = content.info.w;
                //     height = content.info.h;
                // }
                // url = matrixClient.mxcUrlToHttp(
                //     file.url,
                //     width, height,
                //     "scale",
                //     true
                // );
                url = matrixClient.mxcUrlToHttp(file.url);
            } else if (content.file && content.file.url) {
                // No thumb, use real url
                file = content.file;
                url = matrixClient.mxcUrlToHttp(file.url);
            }

            if (url == null) {
                reject("No url found!");
                return;
            }
            axios.get(url, { responseType: 'arraybuffer' })
                .then(response => {
                    return this.decryptIfNeeded(file, response);
                })
                .then(bytes => {
                    resolve(URL.createObjectURL(new Blob([bytes.buffer], { type: file.mimetype })));
                })
                .catch(err => {
                    console.log("Download error: ", err);
                    reject(err);
                });
        });
    }

    decryptIfNeeded(file, response) {
        return new Promise((resolve, reject) => {
            var key = base64Url.decode(file.key.k);
            var iv = base64Url.decode(file.iv);
            var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(iv));

            const data = new Uint8Array(response.data);

            // Calculate sha256 and compare hashes
            var hash = new Uint8Array(sha256.create().update(data).arrayBuffer());
            const originalHash = base64Url.decode(file.hashes.sha256);
            if (Buffer.compare(Buffer.from(hash), Buffer.from(originalHash.buffer)) != 0) {
                reject("Hashes don't match!");
                return;
            }

            var decryptedBytes = aesCtr.decrypt(data);
            resolve(decryptedBytes);
        });
    }

    sendTextMessage(matrixClient, roomId, text) {
        return this.sendMessage(matrixClient, roomId, "m.room.message", ContentHelpers.makeTextMessage(text));
    }

    sendQuickReaction(matrixClient, roomId, emoji, event) {
        const content = {
            'm.relates_to': {
                key: emoji,
                rel_type: 'm.annotation',
                event_id: event.getId()
            }
        };
        return this.sendMessage(matrixClient, roomId, "m.reaction", content);
    }

    sendMessage(matrixClient, roomId, eventType, content) {
        return new Promise((resolve, reject) => {
            matrixClient.sendEvent(roomId, eventType, content, undefined, undefined)
                .then((result) => {
                    console.log("Message sent: ", result);
                    resolve(true);
                })
                .catch(err => {
                    console.log("Image send error: ", err);
                    if (err && err.name == "UnknownDeviceError") {
                        console.log("Unknown devices. Mark as known before retrying.");
                        var setAsKnownPromises = [];
                        for (var user of Object.keys(err.devices)) {
                            const userDevices = err.devices[user];
                            for (var deviceId of Object.keys(userDevices)) {
                                const deviceInfo = userDevices[deviceId];
                                if (!deviceInfo.known) {
                                    setAsKnownPromises.push(
                                        matrixClient.setDeviceKnown(
                                            user,
                                            deviceId,
                                            true
                                        )
                                    );
                                }
                            }
                        }
                        Promise.all(setAsKnownPromises)
                            .then(() => {
                                // All devices now marked as "known", try to resend
                                matrixClient.resendEvent(err.event)
                                    .then((result) => {
                                        console.log("Message sent: ", result);
                                        resolve(true);
                                    })
                                    .catch((err) => {
                                        // Still error, abort
                                        reject(err.toLocaleString());
                                    });
                            });
                    }
                    else {
                        reject(err.toLocaleString());
                    }
                });
        });
    }

    sendImage(matrixClient, roomId, file, onUploadProgress) {
        return new Promise((resolve, reject) => {
            var reader = new FileReader();
            reader.onload = (e) => {
                const fileContents = e.target.result;
                var data = new Uint8Array(fileContents);

                const info = {
                    mimetype: file.type,
                    size: file.size
                };

                var description = file.name;
                var msgtype = 'm.image';
                if (file.type.startsWith("audio/")) {
                    msgtype = 'm.audio';
                } else if (file.type.startsWith("video/")) {
                    msgtype = 'm.video';
                } else if (file.type.startsWith("application/pdf")) {
                    msgtype = 'm.file';
                }

                const opts = {
                    type: file.type,
                    name: description,
                    progressHandler: onUploadProgress,
                    onlyContentUri: false
                };

                var messageContent = {
                    body: description,
                    info: info,
                    msgtype: msgtype
                }

                // Set filename for files
                if (msgtype == 'm.file') {
                    messageContent.filename = file.name;
                }

                if (!matrixClient.isRoomEncrypted(roomId)) {
                    // Not encrypted.
                    matrixClient.uploadContent(data, opts)
                        .then((response) => {
                            messageContent.url = response.content_uri;
                            return this.sendMessage(matrixClient, roomId, "m.room.message", messageContent)
                        })
                        .then(result => {
                            resolve(result);
                        })
                        .catch(err => {
                            reject(err);
                        });
                    return; // Don't fall through
                }

                const crypto = require('crypto');
                let key = crypto.randomBytes(256 / 8);
                let iv = Buffer.concat([crypto.randomBytes(8), Buffer.alloc(8)]); // Initialization vector.

                // Encrypt
                var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(iv));
                var encryptedBytes = aesCtr.encrypt(data);
                data = encryptedBytes;

                // Calculate sha256
                var hash = new Uint8Array(sha256.create().update(data).arrayBuffer());

                const jwk = {
                    kty: 'oct',
                    key_opts: ['encrypt', 'decrypt'],
                    alg: 'A256CTR',
                    k: base64Url.encode(key),
                    ext: true
                };

                const encryptedFile = {
                    mimetype: file.type,
                    key: jwk,
                    iv: Buffer.from(iv).toString('base64').replace(/=/g, ''),
                    hashes: { sha256: Buffer.from(hash).toString('base64').replace(/=/g, '') },
                    v: 'v2'
                };

                messageContent.file = encryptedFile;

                matrixClient.uploadContent(data, opts)
                    .then((response) => {
                        encryptedFile.url = response.content_uri;
                        return this.sendMessage(matrixClient, roomId, "m.room.message", messageContent)
                    })
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    });
            }
            reader.onerror = (err) => {
                reject(err);
            }
            reader.readAsArrayBuffer(file);
        });
    }

    /** Generate a random user name */
    randomUser() {
        return this.randomString(
            12,
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        );
    }

    /**
     * Generate random 12 char password
     */
    randomPass() {
        return this.randomString(
            12,
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#_-*+"
        );
    }

    // From here: https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
    randomString(length, characters) {
        var result = "";
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * charactersLength)
            );
        }
        return result;
    }
}
export default new Util();

