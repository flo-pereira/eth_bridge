const Builder = require('./Builder');
const { _: [dirPath], name, output } = require('optimist').argv;

const buider = new Builder(dirPath, name, output);

buider.deploy();
