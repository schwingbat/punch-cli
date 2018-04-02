/**
 * Dir.js
 * ------
 * A nicer abstraction for dealing with directories
 * and the files they contain. Basically just offers
 * some convenience functions on top of Node's fs module.
 */

const fs = require('fs')
const path = require('path')

const proto = {}

proto.children = function (pattern, withFullPath) {
  const contents = fs.readdirSync(this.path)

  if (pattern) {
    contents = contents.filter(c => pattern.test(c))
  }

  if (withFullPath) {
    contents = contents.map(c => path.join(this.path, c))
  }

  return contents
}

function Dir (dirPath) {
  const dir = Object.create(proto)
  dir.path = dirPath

  return dir
}

module.exports = Dir