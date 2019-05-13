let webpack = require('vortex-api/bin/webpack').default;

const config = webpack('theme-switcher', __dirname, 4);
config.externals['./build/Release/fontmanager'] = './fontmanager';

module.exports = config;
