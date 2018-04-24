class Table {
  constructor (options = {}) {
    this.rows = []
    this.options = options
  }

  push (...rows) {
    this.rows.push(...rows)
  }

  _leftAlignString (str, length) {
    while (str.length < length) {
      str += ' '
    }
    return str
  }

  _rightAlignString (str, length) {
    while (str.length < length) {
      str = ' ' + str
    }
    return str
  }

  _centerAlignString (str, length) {
    let difference = Math.abs(length - str.length)
    let left = Math.round(difference / 2)
    let right = difference - left

    return this._addStringPadding(str, left, right)
  }

  _addStringPadding (str, left = 0, right = 0) {
    while (left > 0) {
      str = ' ' + str
      left -= 1
    }
    while (right > 0) {
      str = str + ' '
      right -= 1
    }
    return str
  }

  toString () {
    let rows = []
    let columnWidths = []
    let columnStyles = []
    let column = 0
    let looping = true

    this.rows.forEach(cells => {
      cells.forEach((cell, index) => {
        columnWidths[index] = Math.max(cell.length || 0, columnWidths[index] || 0)
      })
    })

    columnWidths.forEach((_, i) => {
      if (this.options.columnStyle) {
        if (this.options.columnStyle[i]) {
          columnStyles.push(this.options.columnStyle[i])
        } else {
          columnStyles.push(this.options.columnStyle)
        }
      } else {
        columnStyles.push({
          align: 'left'
        })
      }
    })

    this.rows.forEach(cells => {
      cells = cells.map((cell, index) => {
        const styles = Object.assign({}, {
          align: 'left',
          leftPadding: 0,
          rightPadding: 0,
        }, columnStyles[index])

        switch (styles.align) {
          case 'left':
            cell = this._leftAlignString(cell, columnWidths[index])
            break
          case 'right':
            cell = this._rightAlignString(cell, columnWidths[index])
            break
          case 'center':
            cell = this._centerAlignString(cell, columnWidths[index])
            break
        }

        cell = this._addStringPadding(cell, styles.leftPadding, styles.rightPadding)
        return cell
      })

      rows.push(cells.join(' '))
    })

    return rows.join('\n') + '\n'
  }
}

module.exports = Table