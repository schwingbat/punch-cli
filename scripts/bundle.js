/*
  Bundles files with browserify and creates a standalone
  executable including Node.js runtime using Nexe.
*/

const path = require('path')
const dist = path.join(__dirname, '..', 'dist')
const { compile } = require('nexe')
const browserify = require('browserify')

console.log(dist)
