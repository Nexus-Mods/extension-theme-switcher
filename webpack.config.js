let webpack = require('vortex-api/bin/webpack').default;

const config = webpack('theme-switcher', __dirname, 5);
config.externals['./build/Release/fontmanager'] = './fontmanager';
config.externals['./build/Debug/fontmanager'] = './fontmanager';

config.devtool = 'inline-source-map' // TODOMX: Best source map, I can actually debug the tsx code now
module.exports = config;
