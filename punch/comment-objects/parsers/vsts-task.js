// VSTS task IDs

module.exports = function ({ key, value }) {
  return {
    key,
    value: Number(value),
    toString () {
      return `@${this.key}:${this.value}`
    },
    toHTML () {
      return `<span class="comment-object task">#${this.value}</span>`
    },
    toLogString () {
      return `[Task ${this.value}]`
    }
  }
}
