module.exports = function (config, data) {
  const formatDate = require('date-fns/format')
  const formatDuration = require('../format/duration')
  const formatCurrency = require('../format/currency')

  return {
    ...data,
    start: formatDate(data.start, config.invoice.dateFormat),
    end: formatDate(data.end, config.invoice.dateFormat),
    today: formatDate(data.today, config.invoice.dateFormat),
    days: data.days.map(day => ({
      ...day,
      date: formatDate(day.date, config.invoice.dateFormat),
      time: formatDuration(day.time, { resolution: 'minutes' }),
      pay: formatCurrency(day.pay)
    })),
    totalPay: formatCurrency(data.totalPay),
    totalTime: formatDuration(data.totalTime, { resolution: 'minutes' })
  }
}