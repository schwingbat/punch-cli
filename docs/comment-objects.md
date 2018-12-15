# Feature: Comment Objects

Values can be inserted inside of comment strings with the format `@key:value` where `key` is a basic string and value is basically anything without spaces.

I will create a system where functions can be registered to parse certain values based on their keys, which will then be stored on a Punch object as a dictionary. For example, I could register a function like so:

```javascript
commentParser.parseObject('task', val => Number(val))
```

Which would parse a `@task:1669` into `{ task: 1669 }`

Currently the only purpose is to store IDs for VSTS tasks like `@task:1669` in a comment. I am planning to format these values in a special way in invoices.