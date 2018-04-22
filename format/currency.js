function encomma (amount, separator = ',') {
  // Add commas at appropriate places for currency.

  let [whole, frac] = amount.split('.')

  if (whole.length > 3) {
    const chars = []
    const rev = whole.split('').reverse()
    for (let i = 0; i < rev.length; i++) {
      chars.push(rev[i])
      if (i !== 0 && i !== rev.length - 1 && (i + 1) % 3=== 0) {
        chars.push(separator)
      }
    }
    return chars.reverse().join('') + '.' + frac
  } else {
    return amount
  }
}

module.exports = function (amount, symbol = '$', separator = ',') {
  return symbol + encomma(amount.toFixed(2), separator)
}
