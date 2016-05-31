'use strict'

// MODERNIZ MAKE
const modernizr = require("modernizr");
const UglifyJS = require('uglify-js')

const postcss = require('postcss')
const argv = require('minimist')(process.argv.slice(2))

/* JS MADNESS  */
const b = require('browserify')
const markdownify = require('markdownify')
const partialify = require('partialify')

/* CSS MADNESS */
const autoprefixr = require('autoprefixer')
const browserslist = require('browserslist')
const atimport = require("postcss-import")
const media = require("postcss-custom-media")
const selector = require('postcss-custom-selectors')
const properties = require("postcss-custom-properties")
const cssnano = require("cssnano")

const normalize = require('postcss-normalize')
const pextend = require('postcss-extend')
const nested = require('postcss-nested')

const colorHexAlpha = require("postcss-color-hex-alpha")
const colorFunction = require("postcss-color-function")


const fs = require('fs-extra')
const path = require('path')

const config = require('../config')
const confmod = require('./config-modernizr.js')

let watcher = 0

const postCssArr = [
    atimport()
  , media()
  , selector()
  , properties()
  , colorFunction()
  , colorHexAlpha()
  , pextend()
  , nested()
  , autoprefixr({ browsers: browserslist('last 2 versions, > 1%') })
]

var makeCSS = module.exports.makeCSS = function(opts, css) {
  if (!!opts.prod)
    postCssArr.push(cssnano())

  fs.readFile(path.join(config.paths.src, 'client/css/client.css'), function(err, css) {
    if (err)
      fs.open(path.join(config.paths.src, 'client/css/client.css'), 'w', function(err, css) {
        if (err) console.log('CSS/Open Error', err)
        go(css)
      })
    else go(css)
  })

  function go(css) {
    if (!!opts.prod)
      postCssArr.push(cssnano())

    postcss(postCssArr)
      .process(css, { from: path.join(config.paths.src, 'client/css/client.css'), to: path.join(config.paths.client, 'css/client.css'), map: { inline: false }})
      .then(function (result) {
        fs.writeFile(path.join(config.paths.client, 'css/client.css'), result.css, function(err){
          if (err) return console.log('CSS/Error', err)
          console.log('CSS/Built')
        })
        if ( result.map )
          fs.writeFile(path.join(config.paths.client, 'css/client.css.map'), result.map, function(err){
            if (err) return console.log('CSS/Map Error', err)
            console.log('CSS/Map Built')
          })
      })
      .catch(function(error) {
        console.log('CSS/Caught Error', error.stack)
      })
  }

  if (opts.watch)
    fs.watch(path.join(config.paths.root, 'src/client/css'), {recursive: true}, function(e) {
      console.log("CSS/"+e)
      makeCSS({})
    })
}

var makeJS = module.exports.makeJS = function(opts, bopts, dirp) {
  if (!!opts.prod) bopts = {}
  else bopts = {debug:true}

  bopts.extensions = [ '.json', '.md', '.markdown', '.html']

  dirp = path.join(config.paths.client, 'js')

  // test dir
  fs.readdir(dirp, function(err){
    if (err)
      fs.mkdirs(dirp, function (err) {
        if (err) console.log(err)
        goJS(dirp)
      })
    else
      goJS(dirp)
  })

  function goJS(dirp,ws) {
    // GO MODERNIZR
    console.log('HEADJS/Start')
    modernizr.build(confmod, function (result) {
      console.log('HEADJS/Modernizr built')
      result = UglifyJS.minify(result, {fromString: true})
      fs.writeFile(path.join(dirp, '/head.js'), result.code, (err)=>{
        console.log('HEADJS/Head done')
        if (err) throw err;
      })
    });

    ws = fs.createWriteStream(path.join(dirp, '/bundle.js'))
    ws.on('open', function(bf) {
      bf = b(path.join(config.paths.root, 'src/client/js'), bopts)
        .transform(markdownify)
        .transform(partialify)
        .bundle()

      bf.on('error', function(err){
        console.log(err.message)
        this.emit('end')
      })

      bf.pipe(ws)
    })

    ws.on('close', function() {
      if (!!opts.prod)
        fs.readFile(path.join(dirp, '/bundle.js'), function(err, out) {
            if (err) console.log(err)
            out = UglifyJS.minify(out.toString(), {fromString: true})
            fs.writeFile(path.join(dirp, '/bundle.js'), out.code, function(err) {
              if (err) console.log('JS/ERROR MINIFICATION')
              console.log('JS/MINIFIED')
            })
          })
    })

    ws.on('finish', function() {
      console.log('JS/built')

      if (!!opts.watch)
        fs.watch(path.join(config.paths.root, 'src/client/js'), {recursive: true}, function(e) {
          console.log("JS/"+e)
          makeJS({})
        })
    })
  }
}

module.exports.make = function make(opts) {
  makeCSS(opts)
  makeJS(opts)
}

makeCSS(argv)
makeJS(argv)
