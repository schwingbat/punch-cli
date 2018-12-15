// Get answers to a list of questions from the command line.

const rl = require('readline-sync')

const types = {
  BOOLEAN: 'boolean',
  STRING: 'string',
  INTEGER: 'integer',
  BOOL: 'boolean',
  INT: 'integer'
}

const askBoolean = function (question) {
  while (true) {
    let answer = rl.question(question + ' [yes/no] ').trim().toLowerCase()

    if (['yes', 'y'].includes(answer)) {
      return true
    } else if (['no', 'n'].includes(answer)) {
      return false
    } else {
      console.log('Please enter either yes or no.')
    }
  }
}

const askString = function (question) {
  return rl.question(question + ' ')
}

const askInt = function (question) {
  while (true) {
    let answer = rl.question(question + ' (number) ').trim()

    if (/^\d$/.test(answer)) {
      return parseInt(answer)
    } else {
      console.log('Please enter a whole number.')
    }
  }
}

const askNumber = function (question) {
  while (true) {
    let answer = rl.question(question + ' (number) ').trim()

    if (/^\d+(\.\d+)?$/.test(answer)) {
      return Number(answer)
    } else {
      console.log('Please enter a number.')
    }
  }
}

function questionnaire (questions) {
  const answered = []

  questions.forEach(q => {
    switch (q.type) {
      case types.BOOLEAN:
        answered.push(Object.assign({}, q, {
          answer: askBoolean(q.question)
        }))
        break
      case types.STRING:
        answered.push(Object.assign({}, q, {
          answer: askString(q.question)
        }))
        break
      case types.NUMBER:
        answered.push(Object.assign({}, q, {
          answer: askNumber(q.question)
        }))
        break
      case types.INTEGER:
        answered.push(Object.assign({}, q, {
          answer: askInt(q.question)
        }))
        break
      default:
        throw new Error('Question object must have a type of boolean, string or number')
    }
  })

  return answered
}

for (const type in types) {
  questionnaire[type] = types[type]
}

questionnaire.askBoolean = askBoolean
questionnaire.askString = askString
questionnaire.askInt = askInt
questionnaire.askNumber = askNumber

module.exports = questionnaire