const groupByDay = require('./group-by-day')

describe('groupByDay', () => {
  it('groups an array of punches by start date', () => {
    const punches = [{
      in: new Date(2018, 4, 2, 1),
      out: new Date(2018, 4, 2, 2)
    }, {
      in: new Date(2018, 4, 3, 1),
      out: new Date(2018, 4, 3, 2)
    }, {
      in: new Date(2018, 4, 2, 6),
      out: new Date(2018, 4, 2, 22)
    }]

    const grouped = groupByDay(punches)

    expect(grouped.length).toBe(2)
    expect(grouped[0].punches.length).toBe(2)
    expect(grouped[1].punches.length).toBe(1)
  })

  it('includes ongoing punches in current day even if they started earlier', () => {
    const today = new Date()
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    yesterday.setDate(yesterday.getDate() - 1)

    const punches = [{
      in: yesterday,
      out: today,
    }, {
      in: yesterday
    }]

    const grouped = groupByDay(punches)

    expect(grouped.length).toBe(2)
  })
})
