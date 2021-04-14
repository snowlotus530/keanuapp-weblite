<template>
  <div class="pa-4">
    <RoomList showInvites />
    <v-btn block depressed class="outlined-button" @click.stop="logout">Logout</v-btn>

    <!-- Loading indicator -->
    <v-container
      fluid
      fill-height
      style="position: absolute;background-color:rgba(0,0,0,0.2)"
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
import RoomList from '../components/RoomList';

export default {
  components: {
    RoomList
  },
  computed: {
    loading() {
      return !this.$matrix.ready;
    }
  },
  methods: {
    logout() {
      //TODO - For guest accounts, show warning about not being able to rejoin.
      this.$store.dispatch("auth/logout");
      this.$nextTick(() => {
        this.$navigation.push({path: "/login"}, -1);
      })
    },
  }
};
</script>

<style lang="scss">
</style>