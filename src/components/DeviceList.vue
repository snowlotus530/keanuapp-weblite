<template>
  <v-list dense @click.native.stop="nullEvent">
    <v-subheader>DEVICES</v-subheader>
    <v-list-item-group color="primary">
      <v-list-item
        v-for="device in devices"
        :key="device.deviceId"
        :value="device.deviceId"
      >
        <template v-slot:default="{ active }">
          <v-list-item-content>
            <v-list-item-title>{{ displayName(device) }}</v-list-item-title>
            <v-list-item-subtitle>{{
              verificationStatus(device)
            }}</v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action v-if="active">
            <v-btn icon>
              <v-icon
                :color="
                  device.isBlocked()
                    ? 'red'
                    : device.isVerified()
                    ? 'green'
                    : 'grey lighten-1'
                "
                >verified_user</v-icon
              >
            </v-btn>
          </v-list-item-action>
        </template>
      </v-list-item>
    </v-list-item-group>
  </v-list>
</template>

<script>
export default {
  name: "DeviceList",
  props: {
    member: {
      type: Object,
      default: function () {
        return {};
      },
    },
  },
  data() {
    return {
      devices: [],
    };
  },
  watch: {
    member: {
      immediate: true,
      handler(member, ignoredOldVal) {
        this.updateDevices();
        if (member) {
          this.$matrix.matrixClient.downloadKeys([member.userId]).then(() => {
            this.updateDevices();
          });
        }
      },
    },
  },
  methods: {
    updateDevices() {
      if (!this.member) {
        this.devices = [];
        return;
      }
      this.devices = this.$matrix.matrixClient.getStoredDevicesForUser(
        this.member.userId
      );
    },

    displayName(device) {
      var name = device.deviceId;
      if (device.getDisplayName()) {
        name += " - " + device.getDisplayName();
      }
      return name;
    },

    verificationStatus(device) {
      if (device.isBlocked()) {
        return "Blocked";
      } else if (device.isVerified()) {
        return "Verified";
      } else {
        return "Not verified";
      }
    },

    nullEvent() {},
  },
};
</script>
