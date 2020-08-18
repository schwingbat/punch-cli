/**
 * Used like parseFlash(req.flash())
 *
 * to parse the flash object into a flat array with 'text' and 'type'.
 */

module.exports = function (flash) {
  const parsed = [];

  for (const type in flash) {
    for (const text of flash[type]) {
      parsed.push({ type, text });
    }
  }

  return parsed;
};
