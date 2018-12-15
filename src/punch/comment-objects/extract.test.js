const extract = require('./extract.js')

describe('extract', () => {
  it('returns an object with the stripped string and parsed objects', () => {
    const comment = 'This is a comment with objects @task:1234 @pickle:flarf'
    const result = extract(comment)

    expect(result).toEqual({
      comment: 'This is a comment with objects',
      objects: [
        { key: 'task', value: '1234' },
        { key: 'pickle', value: 'flarf' }
      ],
      tags: []
    })
  })

  it('returns an empty objects list if comment has no objects', () => {
    const comment = 'This is a comment without objects'

    expect(extract(comment)).toEqual({
      comment: 'This is a comment without objects',
      objects: [],
      tags: []
    })
  })

  it('parses out tags in the middle of a comment', () => {
    const comment = 'Now with tag support! @vsts:1234 #tags'

    expect(extract(comment)).toEqual({
      comment: 'Now with tag support!',
      objects: [
        { key: 'vsts', value: '1234' }
      ],
      tags: [
        { index: 13, value: 'tag' }
      ]
    })
  })
})
