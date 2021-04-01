<template>
  <div class="create-room">
    <div>
      <v-container fluid>
        <div class="room-name">Add Friends</div>
        <!-- <v-btn
          text
          class="header-button-left"
          v-show="$navigation && $navigation.canPop()"
          @click.stop="goBack"
        >
          <v-icon>arrow_back</v-icon>
          <span>BACK</span>
        </v-btn> -->
        <v-btn text class="header-button-right" @click.stop="done">
          <span>Done</span>
        </v-btn>
      </v-container>
    </div>

    <div>Not yet implemented</div>
  </div>
</template>

<script>
import util from "../plugins/utils";

export default {
  name: "Invite",

  methods: {
    done() {
      this.$navigation.push(
        {
          name: "Chat",
          params: { roomId: util.sanitizeRoomId(this.$matrix.currentRoomId) },
        },
        -1
      );
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>