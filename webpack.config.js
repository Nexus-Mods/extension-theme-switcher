let webpack = require('vortex-api/bin/webpack').default;

const config = webpack('theme-switcher', __dirname, 4);

config.devtool = 'inline-source-map' // TODOMX: Best source map, I can actually debug the tsx code now
module.exports = config;
