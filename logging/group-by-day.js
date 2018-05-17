// Group punches by day, ordered by date.
module.exports = function (punches) {
  const { ascendingBy } = require('../utils/sort-factories')
  const byDay = {}

  punches.forEach(punch => {
    let year = punch.in.getFullYear()
    let month = punch.in.getMonth() + 1
    let day = punch.in.getDate()
    const key = `${year}-${month}-${day}`

    if (!byDay[key]) {
      byDay[key] = []
    }

    byDay[key].push(punch)
  })

  const days = []

  for (const key in byDay) {
    const punches = byDay[key].sort(ascendingBy('in'))
    const date = new Date(punches[0].in)
    date.setHours(0, 0, 0, 0)

    days.push({ date, punches })
  }

  return days.sort(ascendingBy('date'))
}
