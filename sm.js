var fs = require('fs');

var path = './settings.json';
var parsed = JSON.parse(fs.readFileSync(path, 'UTF-8'));
exports.settings = parsed;
