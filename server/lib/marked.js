'use strict'

var marked = module.exports = require('marked')

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: true,
  smartLists: true,
  smartypants: true
});
