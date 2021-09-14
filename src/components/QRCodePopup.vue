<template>
  <v-dialog v-model="showDialog" class="ma-0 pa-0" width="80%">
    <div class="dialog-content text-center" ref="qrContainer">
      <div class="d-flex flex-column text-center" style="align-items: center">
        <canvas ref="qr" class="qr" id="qr" :style="qrStyle"></canvas>
      </div>
      <div>{{ $t("room_info.scan_code") }}</div>
    </div>
  </v-dialog>
</template>
<script>
import roomInfoMixin from "./roomInfoMixin";
import QRCode from "qrcode";

export default {
  name: "QRCodePopup",
  mixins: [roomInfoMixin],
  props: {
    show: {
      type: Boolean,
      default: function () {
        return false;
      },
    },
    message: {
      type: String,
      default: function () {
        return null;
      },
    },
  },
  data() {
    return {
      showDialog: false,
    };
  },
  mounted() {
    this.updateQR(this.message);
  },
  computed: {
    qrStyle() {
      const w = document.documentElement.clientWidth;
      const h = document.documentElement.clientHeight;
      const s = 0.6 * Math.min(w, h);
      return "width: " + s + "px;height:" + s + "px;";
    },
  },
  watch: {
    show: {
      handler(newVal, ignoredOldVal) {
        this.showDialog = newVal;
      },
    },
    showDialog() {
      if (!this.showDialog) {
        this.$emit("close");
      } else {
        this.$nextTick(() => {
          this.updateQR(this.message);
        });
      }
    },
    message: {
      handler(message) {
        this.updateQR(message);
      },
    },
  },

  methods: {
    updateQR(message) {
      var canvas = this.$refs.qr;
      var canvasContainer = this.$refs.qrContainer;
      if (message && canvas && canvasContainer) {
        this.$nextTick(() => {
          QRCode.toCanvas(
            canvas,
            message,
            {
              type: "image/png",
              margin: 1,
              width: Math.min(
                0.7 * canvasContainer.clientWidth,
                0.7 * canvasContainer.clientHeight
              ),
            },
            function (error) {
              if (error) console.error(error);
            }
          );
        });
      }
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>
