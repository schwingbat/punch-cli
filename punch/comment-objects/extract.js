module.exports = function (comment) {
  const objects = []
  const tags = []

  let i = 0
  let inKey = false
  let inValue = false
  let inTag = false
  let buffer = ''
  let tagIndex = 0
  let key

  while (i < comment.length) {
    switch (comment[i]) {
      case '@':
        if (!inKey) {
          inKey = true
        }
        break
      case ':':
        if (inKey) {
          inKey = false
          inValue = true
          key = buffer
          buffer = ''
        }
        break
      case ' ':
        if (inValue) {
          inValue = false
          objects.push({ key, value: buffer })
          key = undefined
          buffer = ''
        } else if (inTag) {
          inTag = false
          tags.push({ index: tagIndex, value: buffer })
          buffer = ''
        }
        break
      case '#':
        if (inTag) {
          if (buffer.length > 0) {
            // End tag and start another
            tags.push({ index: tagIndex, value: buffer })
            buffer = ''
          } else {
            // Two hashtags in a row?!
            // I'm not sure what to do here...
          }
        } else if ((inKey || inValue) && buffer.length > 0) {
          objects.push({ key, value: buffer })
          inKey = false
          inValue = false
        }
        inTag = true
        tagIndex = i
        break
      default:
        if (inKey || inValue || inTag) {
          buffer += comment[i]
        }
        break
    }

    i++
  }

  if (inValue) {
    objects.push({ key, value: buffer })
  } else if (inTag) {
    tags.push({ index: tagIndex, value: buffer })
  }

  return {
    comment: comment.replace(/@.+:.+/g, '').replace(/#[\w\d\-_\.]+/g, '').trim(),
    objects,
    tags
  }
}
