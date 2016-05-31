'use strict'

const fs = require('fs')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))
const dust = module.exports.dust = require('dustjs-linkedin')

const config = require('../config')

module.exports.build = build

module.exports.tpls = {}

if (!!argv.dev)
  dust.config.cache = false
else
  build()

dust.onLoad = function(templateName, callback) {
  var pathtotemplate = path.join(config.paths.tpls, templateName + '.dust')
  console.log('will load :', pathtotemplate)
  fs.readFile(pathtotemplate, { encoding: 'utf8' }, function(err, data) {
    callback(null, data);
  });
}

function build() {
  console.log('rebuild')

  require('../tpls/partials/head')(dust)
  require('../tpls/partials/base')(dust)
  require('../tpls/partials/music-large')(dust)

  module.exports.tpls.home = require('../tpls/home')(dust)
  module.exports.tpls.fourofour = require('../tpls/fourofour')(dust)
}
