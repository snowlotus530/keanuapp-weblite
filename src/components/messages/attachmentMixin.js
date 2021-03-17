import util from "../../plugins/utils";

export default {
  data() {
    return {
      src: null,
      downloadProgress: null
    }
  },
  mounted() {
    console.log("Mounted with event:", JSON.stringify(this.event.getContent()))
    util
      .getAttachment(this.$matrix.matrixClient, this.event, (progress) => {
        this.downloadProgress = progress;
        console.log("Progress: " + progress);
      })
      .then((url) => {
        this.src = url;
      })
      .catch((err) => {
        console.log("Failed to fetch attachment: ", err);
      });
  },
  beforeDestroy() {
    if (this.src) {
      const objectUrl = this.src;
      this.src = null;
      URL.revokeObjectURL(objectUrl);
    }
  },
}