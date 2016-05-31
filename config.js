'use strict'
// "!!!"
const path = require('path')
const root = path.resolve(process.cwd(), __dirname)
const src = path.join(root, 'src/')
const client = path.join(root, 'statics/')

module.exports.paths = {
    root: root
  , src: src
  , client: client
}
