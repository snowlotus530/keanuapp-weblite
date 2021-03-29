<template>
  <div>
    <RoomList />
    <v-btn block depressed class="outlined-button" @click.stop="logout">Logout</v-btn>
  </div>
</template>

<script>
import RoomList from '../components/RoomList';

export default {
  components: {
    RoomList
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