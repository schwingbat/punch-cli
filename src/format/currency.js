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

function currency (amount, options = {}) {
  const value = encomma(amount.toFixed(2), options.separator)
  if (options.appendSymbol) {
    return value + (options.symbol || '$')
  } else {
    return (options.symbol || '$') + value
  }
}

currency.cents = function (amount, options) {
  return currency(amount / 100, options)
}

module.exports = currency