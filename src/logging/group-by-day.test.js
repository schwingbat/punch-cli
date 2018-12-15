const groupByDay = require('./group-by-day')

describe('groupByDay', () => {
  it('groups an array of punches by start date', () => {
    const punches = [{
      in: new Date(2018, 4, 2)
    }, {
      in: new Date(2018, 4, 3)
    }, {
      in: new Date(2018, 4, 2)
    }]

    const grouped = groupByDay(punches)

    expect(grouped.length).toBe(2)
    expect(grouped[0].punches.length).toBe(2)
    expect(grouped[1].punches.length).toBe(1)
  })
})
