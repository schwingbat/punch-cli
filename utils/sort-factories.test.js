const { descendingBy, ascendingBy } = require('./sort-factories')

const unsorted = [
  { number: 4 },
  { number: 5 },
  { number: 3 },
  { number: 1 },
  { number: 2 }
]

describe('descendingBy', () => {
  it('sorts an array of objects in descending order by a given property', () => {
    const sorted = [
      { number: 5 },
      { number: 4 },
      { number: 3 },
      { number: 2 },
      { number: 1 }
    ]

    expect(unsorted.sort(descendingBy('number'))).toEqual(sorted)
  })

  it('sorts an array of objects in descending order by the result of a given function', () => {
    const sorted = [
      { number: 5 },
      { number: 4 },
      { number: 3 },
      { number: 2 },
      { number: 1 }
    ]

    expect(unsorted.sort(descendingBy(x => x.number))).toEqual(sorted)
  })

  it('throws an error if given anything but a string or function', () => {
    expect(() => unsorted.sort(descendingBy(5))).toThrow()
  })
})

describe('ascendingBy', () => {
  it('sorts an array of objects in ascending order by a given property', () => {
    const sorted = [
      { number: 1 },
      { number: 2 },
      { number: 3 },
      { number: 4 },
      { number: 5 }
    ]

    expect(unsorted.sort(ascendingBy('number'))).toEqual(sorted)
  })

  it('sorts an array of objects in ascending order by the result of a given function', () => {
    const sorted = [
      { number: 1 },
      { number: 2 },
      { number: 3 },
      { number: 4 },
      { number: 5 }
    ]

    expect(unsorted.sort(ascendingBy(x => x.number))).toEqual(sorted)
  })

  it('throws an error if given anything but a string or function', () => {
    expect(() => unsorted.sort(ascendingBy(5))).toThrow()
  })
})