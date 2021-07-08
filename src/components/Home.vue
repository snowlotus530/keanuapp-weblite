<template>
  <div class="home">
    <YouAre class="mt-4" v-if="!loading" />
    <v-card class="members ma-3" flat>
      <v-card-title class="h2">{{ $t("room.room_list_rooms") }}</v-card-title>
      <v-card-text class="pa-0">
        <RoomList
          showInvites
          showCreate
          title=""
          :invitesTitle="$t('room.room_list_invites')"
          v-on:newroom="createRoom"
        />
      </v-card-text>
    </v-card>

    <!-- Loading indicator -->
    <v-container
      fluid
      fill-height
      style="position: absolute; background-color: rgba(0, 0, 0, 0.2)"
      v-if="loading"
    >
      <v-row align="center" justify="center">
        <v-col class="text-center">
          <v-progress-circular
            indeterminate
            color="primary"
          ></v-progress-circular>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import RoomList from "../components/RoomList";
import YouAre from "../components/YouAre.vue";

export default {
  components: {
    RoomList,
    YouAre,
  },
  computed: {
    loading() {
      return !this.$matrix.ready;
    },
  },
  methods: {
    logout() {
      //TODO - For guest accounts, show warning about not being able to rejoin.
      this.$store.dispatch("logout");
      this.$nextTick(() => {
        this.$navigation.push({ path: "/login" }, -1);
      });
    },

    createRoom() {
      this.$navigation.push({ name: "CreateRoom" });
    },
  },
};
</script>

<style lang="scss">
</style>