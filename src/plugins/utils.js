import axios from 'axios';

class Util {
    getThumbnail(matrixClient, event, ignoredw, ignoredh) {
        return new Promise((resolve, reject) => {
            const content = event.getContent();
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
            }
            axios.get(url, { responseType: 'arraybuffer' })
                .then(response => {
                    return new Promise((resolve, ignoredReject) => {
                        var aesjs = require('aes-js');
                        //var JSONWebKey = require( 'json-web-key' );
                        var base64Url = require('json-web-key/lib/base64url');
                        //var tou8 = require('buffer-to-uint8array');
                        var key = base64Url.decode(file.key.k);
                        var iv = base64Url.decode(file.iv);
                        var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(iv));

                        const data = new Uint8Array(response.data);
                        var decryptedBytes = aesCtr.decrypt(data);
                        resolve(decryptedBytes);
                    });
                })
                .then(bytes => {
                    resolve(URL.createObjectURL(new Blob([bytes.buffer], { type: 'image/png' })));
                })
                .catch(err => {
                    console.log("Download error: ", err);
                    reject(err);
                });
        });
    }
}
export default new Util();

