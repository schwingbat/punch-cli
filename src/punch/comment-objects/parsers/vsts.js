// VSTS task IDs

module.exports = function ({ key, value }) {
  return {
    key,
    value,
    toString () {
      return `@${this.key}:${this.value}`
    },
    toLogString () {
      return `[VSTS ${this.value}]`
    }
  }
}
