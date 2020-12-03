import util from "../../plugins/utils";

export default {
  data() {
    return {
      src: null
    }
  },
  mounted() {
    console.log("Mounted with event:", JSON.stringify(this.event.getContent()))
    util
      .getAttachment(this.$matrix.matrixClient, this.event)
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