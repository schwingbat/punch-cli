const { descendingBy, ascendingBy } = require('./sort-factories')

const unsorted = [
  { number: 4 },
  { number: 5 },
  { number: 3 },
  { number: 1 },
  { number: 2 }
]

const unsorted2 = [
  { number: 2 },
  { number: 4 },
  { number: 5 },
  { number: 1 },
  { number: 3 }
]

const ascending = [
  { number: 1 },
  { number: 2 },
  { number: 3 },
  { number: 4 },
  { number: 5 }
]

const descending = [
  { number: 5 },
  { number: 4 },
  { number: 3 },
  { number: 2 },
  { number: 1 }
]

describe('descendingBy', () => {
  it('sorts an array of objects in descending order by a given property', () => {
    expect(unsorted.sort(descendingBy('number'))).toEqual(descending)
    expect(unsorted2.sort(descendingBy('number'))).toEqual(descending)
  })

  it('sorts an array of objects in descending order by the result of a given function', () => {
    expect(unsorted.sort(descendingBy(x => x.number))).toEqual(descending)
    expect(unsorted2.sort(descendingBy(x => x.number))).toEqual(descending)
  })

  it('throws an error if given anything but a string or function', () => {
    expect(() => unsorted.sort(descendingBy(5))).toThrow()
  })
})

describe('ascendingBy', () => {
  it('sorts an array of objects in ascending order by a given property', () => {
    expect(unsorted.sort(ascendingBy('number'))).toEqual(ascending)
    expect(unsorted2.sort(ascendingBy('number'))).toEqual(ascending)
  })

  it('sorts an array of objects in ascending order by the result of a given function', () => {
    expect(unsorted.sort(ascendingBy(x => x.number))).toEqual(ascending)
    expect(unsorted2.sort(ascendingBy(x => x.number))).toEqual(ascending)
  })

  it('throws an error if given anything but a string or function', () => {
    expect(() => unsorted.sort(ascendingBy(5))).toThrow()
  })
})
