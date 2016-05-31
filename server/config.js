'use strict'

const path = require('path')

const root = path.resolve(process.cwd(), __dirname)

const json = path.join(root, 'json/')
const texts = path.join(root, 'texts/')
const tpls = path.join(root, 'tpls/')

module.exports.paths = {
    root: root
  , json: json
  , texts: texts
  , tpls: tpls
}
