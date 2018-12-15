module.exports = function ({ key, value }) {
  return {
    key,
    value,
    toString () {
      return `@${this.key}:${this.value}`
    },
    toLogString () {
      return `[${this.key} ${this.value}]`
    }
  }
}
