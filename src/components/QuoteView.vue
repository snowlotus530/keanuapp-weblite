<template>
  <transition name="slow-fade">
    <div
      v-if="mounted"
      style="
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        z-index: 100;
        background-color: black;
        align-items: center;
        justify-content: center;
        padding: 40px;
      "
      class="text-center d-flex flex-column"
    >
    
      <div class="quote white--text">{{ quote }}</div>
      <div class="author white--text mt-4">- {{ author }}</div>
    
      <v-btn color="white" text class="close" @click.stop="closeBrowserTab">Close your browser tab</v-btn>
    </div>
  </transition>
</template>
<script>
import quotes from "../assets/quotes";

export default {
  name: "QuoteView",
  data() {
    return {
      mounted: false,
      quote: "",
      author: "",
    }
  },
  mounted() {
    const n = quotes.quotes.length;
    const quote = quotes.quotes[Math.floor(Math.random() * n)];
    this.quote = quote.quote;
    this.author = quote.author;
    this.mounted = true;
  },

  methods: {
    closeBrowserTab() {
       window.location.href="about:blank";
    }
  }

};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";

.author {
  font-size: 80%;
}

.close {
  position: absolute;
  bottom: 40px;
}

.slow-fade-enter-active,
.slow-fade-leave-active {
  transition: opacity 2.5s;
}
.slow-fade-enter, .slow-fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

</style> 