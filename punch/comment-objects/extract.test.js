const extract = require('./extract.js')

describe('extract', () => {
  it('returns an object with the stripped string and parsed objects', () => {
    const comment = 'This is a comment with objects @task:1234 @pickle:flarf'
    const result = extract(comment)

    expect(result).toEqual({
      comment: 'This is a comment with objects',
      objects: [
        { key: 'vsts', value: '1234' },
        { key: 'pickle', value: 'flarf' }
      ]
    })
  })

  it('returns an empty objects list if comment has no objects', () => {
    const comment = 'This is a comment without objects'

    expect(extract(comment)).toEqual({
      comment: 'This is a comment without objects',
      objects: []
    })
  })
})
