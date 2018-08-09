const extract = require('./extract')
const parse = require('./parse')

describe('parse', () => {
  it('runs parsers on objects to parse their values', () => {
    const extracted = extract('This is a comment with @tag:stuff @vsts:1234')

    // vsts-task should handle @task:1234 and return a value with a number on it
    // @tag:stuff should be handled by noopParser and return an object with a string value

    const parsed = parse(extracted.objects)

    expect(parsed[0].key).toBe('tag')
    expect(parsed[0].value).toBe('stuff')
    expect(parsed[1].key).toBe('vsts')
    expect(parsed[1].value).toBe('1234')
  })

  it('returns an empty array if passed an empty array', () => {
    expect(parse([])).toEqual([])
  })
})
