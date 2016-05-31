'use strict'

const fs = require('fs')
const path = require('path')

const koa = require('koa')
const glob = require('glob')

const config = require('../config')

const dust = require('./dust')
const marked = require('./marked')

const argv = require('minimist')(process.argv.slice(2))

const pALL = makeTextPromise().then(makeJSONPromise)

function treatJSON(json) {
  json['choice'] = json.wow[Math.floor(Math.random()*json.wow.length)]
}

module.exports.devSRV = function devSRV(type) {
  return makeTextPromise()
    .then(makeJSONPromise)
    .then((json) => {
      treatJSON(json)

      return new Promise(function(resolve, reject) {
        render.call(this, type, json, resolve, reject)
      }).then((out) => {
        this.body = out
      }, (err) => {
        this.body = err.message
      })
    }, (err) => {
      this.body = err.message
    })
}

module.exports.prodSRV = function prodSRV(type) {
  return pALL.then((json) => {
    treatJSON(json)

    return new Promise(function(resolve, reject) {
      render.call(this, type, json, resolve, reject)
    }).then((out) => {
      this.body = out
    }, (err) => {
      this.body = err.message
    })
  }, (err) => {
    this.body = err.message
  })
}

function render (type, json, resolve, reject) {
  if (!!argv.dev) {
    dust.dust.render(type, json, function(err, out) {
      console.log('rendering happened')
      if (err)
        reject(err)
      else
        resolve(out)
    }.bind(this))
  } else {
    dust.tpls[type](json, (err, out) => {
      console.log('cache fetched')
      if (err)
        reject(err)
      else
        resolve(out)
    })
  }
}

function makeJSONPromise(arr) {
  return new Promise(function(resolve, reject) {
    fs.readFile(path.join(config.paths.json, 'home.json'), function(err, buffer, tmpl, json, markedP) {
      if (err) return reject('Couldn\'t get json file')

      markedP = []
      json = JSON.parse(buffer.toString())

      ;['albums', 'singles', 'miscs'].forEach(function(type){
        json.content[type].forEach(function(obj, i) {
          markedP.push(new Promise(function(resolve, reject) {
            marked(obj.description, {}, function(err, out) {
              if (err) reject(err)
              json.content[type][i].description = out
              resolve()
            })
          }))
        })
      })

      arr.forEach(function(o){
        for (var k in o)
          json[k] = o[k]
      })

      Promise.all(markedP).then(function() {
        resolve(json)
      })
    })
  })
}

function makeTextPromise() {
  return new Promise(function(resolve, reject) {
    glob(path.join(config.paths.texts, '/**/*.md'), {}, function(err, files) {
      if (err) reject (err)
      resolve(files)
    })
  }).then(function(files, proms) {
    proms = []

    files.forEach(function(file, name) {
      proms.push(new Promise(function(resolve, reject) {
        name = file.substr(file.lastIndexOf('/')+1).replace('.md', '')

        fs.readFile(file, function(err, buffer, obj) {
          if (err) reject(err)

          obj = {}

          marked(buffer.toString(), {}, function(err, out) {
            if (err) reject(err)
            obj[name] = out
            resolve(obj)
          })
        })
      }))
    })

    return Promise.all(proms)
  })
}
