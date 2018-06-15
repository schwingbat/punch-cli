module.exports = function ({ key, value }) {
  return {
    key,
    value,
    toString () {
      return `@${this.key}:${this.value}`
    },
    toHTML () {
      return `<span class="comment-object">${this.value}</span>`
    },
    toLogString () {
      return `[${this.key} ${this.value}]`
    }
  }
}
