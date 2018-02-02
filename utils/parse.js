// Parse time in this format: 1h 5m 3s
// Returns duration in milliseconds

exports.time = function time(time) {
  const parts = time.split(' ').map(s => s.trim().toLowerCase());
  let ms = 0;

  parts.forEach(p => {
    const [, amount, unit] = p.match(/(\d+)(\w)$/);

    switch (unit) {
    case 's':
      ms += parseInt(amount) * 1000;
      break;
    case 'm':
      ms += parseInt(amount) * 1000 * 60;
      break;
    case 'h':
      ms += parseInt(amount) * 1000 * 60 * 60;
      break;
    }
  });

  return ms;
}