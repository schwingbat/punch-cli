const moment = require('moment')
const config = require('../config')

module.exports = {
  command: 'in',
  description: 'start tracking time on a project',
  arguments: [{
    name: 'project',
    required: true,
    validate: function(value, warn, error) {

    }
  }],
  options: [{
    name: 'time',
    short: 't',
    description: 'specific time to punch in',
    default: Date.now(),
    validate: function(value, warn, error) {

    },
    parse: function() {

    }
  }],
  action: function(args) {
    punchInTime
  }
}