module.exports = {
  "transpileDependencies": [
    "vuetify"
  ],

  publicPath: process.env.NODE_ENV === 'production'
    ? './'
    : './',

  chainWebpack: config => {
    config.plugin('html').tap(args => {
      var c = require("./src/assets/config.json");
      args[0].title = c.appName;
      return args;
    })
  },

  devServer: {
    //https: true
  },
}