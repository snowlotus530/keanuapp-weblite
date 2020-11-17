class Util {
    readFileAsArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                resolve(e.target.result as ArrayBuffer);
            };
            reader.onerror = function(e) {
                reject(e);
            };
            reader.readAsArrayBuffer(file);
        })
    };
};
export default new Util();

