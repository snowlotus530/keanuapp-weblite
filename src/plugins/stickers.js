const stickerPacks = {};
stickerPacks.ordering = [];
const stickerCodeMap = {};

try {
    const stickerPackInfo = require("!!raw-loader!@/assets/stickers/order.txt").default;
    const packInfo = stickerPackInfo.split("\n");
    for (let i = 0; i < packInfo.length; i++) {
        const pack = packInfo[i];
        if (pack && pack.length > 0 && !pack.startsWith('#')) {
            stickerPacks[pack] = [];
            stickerPacks.ordering.push(pack);
        }
    }
} catch (ignorederr) {
    //
}

function importAll(r) {
    return r.keys().map(res => {
        // Remove"./"
        const parts = res.split("/");
        const pack = parts[1];
        const sticker = parts[2].split(".")[0];
        const image = r(res);
        if (stickerPacks[pack] !== undefined) {
            stickerPacks[pack].push({ image: image, name: sticker });
            stickerCodeMap[":" + pack + "-" + sticker + ":"] = image;
        }
    });
}
importAll(require.context('@/assets/stickers/', true, /\.png$/));

class Stickers {
    constructor() {
    }

    isStickerShortcode(messageBody) {
        if (messageBody && messageBody.startsWith(":") && messageBody.startsWith(":") && messageBody.length >= 5) {
            const image = this.getStickerImage(messageBody);
            return image != undefined && image != null;
        }
        return false;
    }

    getStickerShortcode(pack, sticker) {
        return ":" + pack + "-" + sticker.name + ":";
    }

    getPacks() {
        return stickerPacks.ordering;
    }

    getStickerImage(messageBody) {
        if (!messageBody) return null;
        if (messageBody.length < 5 || !messageBody.startsWith(":") || !messageBody.endsWith(":")) return null;
        return stickerCodeMap[messageBody];
    }

    stickersInPack(pack) {
        return stickerPacks[pack];
    }
}

var gStickers = new Stickers();
export default gStickers;
