const { descendingBy, ascendingBy } = require('./sort-factories')

describe('descendingBy', () => {
  it('sorts an array of objects in descending order by a given property', () => {
    const unsorted = [
      { number: 5 },
      { number: 3 },
      { number: 1 },
      { number: 4 },
      { number: 2 }
    ]
    const sorted = [
      { number: 5 },
      { number: 4 },
      { number: 3 },
      { number: 2 },
      { number: 1 }
    ]

    expect(unsorted.sort(descendingBy('number'))).toEqual(sorted)
  })
})

describe('ascendingBy', () => {
  it('sorts an array of objects in ascending order by a given property', () => {
    const unsorted = [
      { number: 5 },
      { number: 3 },
      { number: 1 },
      { number: 4 },
      { number: 2 }
    ]
    const sorted = [
      { number: 1 },
      { number: 2 },
      { number: 3 },
      { number: 4 },
      { number: 5 }
    ]

    expect(unsorted.sort(ascendingBy('number'))).toEqual(sorted)
  })
})