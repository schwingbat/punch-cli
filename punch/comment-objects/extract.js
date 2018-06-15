module.exports = function (comment) {
  const objects = []

  let i = 0
  let inKey = false
  let inValue = false
  let buffer = ''
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
        }
        break
      default:
        if (inKey || inValue) {
          buffer += comment[i]
        }
        break
    }

    i++
  }

  if (inValue) {
    objects.push({ key, value: buffer })
  }

  return {
    comment: comment.replace(/@.+:.+/g, '').trim(),
    objects
  }
}
