const questionnaire = require('../utils/questionnaire.js')

module.exports = function (configPath) {
  // Ask the user for important info.
  console.log("Let's set you up. I'll collect some information about you and your projects.\n")

  console.log("First some personal info. This is stored in a text file on your computer and transmitted (not saved) when generating an invoice.\n")

  const config = {}
  config.user = {}

  let happy = false
  let answers

  /*=============================*\
  ||          User Info          ||
  \*=============================*/

  config.user.name = questionnaire([{
    question: 'What is your full name?',
    type: questionnaire.STRING
  }])

  console.log("Now your address for invoices:")

  while (!happy) {
    answers = questionnaire([{
      question: 'What is your street address? (street)',
      type: questionnaire.STRING,
      value: 'street'
    }, {
      question: 'Which city do you live in?',
      type: questionnaire.STRING,
      value: 'city'
    }, {
      question: 'Which state do you live in? (e.g. CA, WA, MT, NY)',
      type: questionnaire.STRING,
      value: 'state'
    }, {
      question: 'What is your zip code?',
      type: questionnaire.STRING,
      value: 'zip'
    }])

    let str = `  ${parts[0].answer}\n  ${parts[1].answer}, ${parts[2].answer} ${parts[3].answer}`
    happy = questionnaire.askBoolean("Does this look right?\n" + str + '\n')
  }

  config.user.address = answers.reduce((obj, answer) => {
    obj[answer.value] = answer.answer
    return obj
  }, {})

  /*=============================*\
  ||        Project Info         ||
  \*=============================*/

  happy = false
  answers = null

  while (!happy) {
    answers = questionnaire([{
      question: ''
    }])
  }

  console.log(parts)

  return config
}