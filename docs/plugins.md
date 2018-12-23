# Plugins

> This doesn't work yet. This is a plan for a future feature.

Define custom plugins and put them in `~/.punch/plugins`. Register plugins by putting their folder name in your config.

```mon
plugins [
  "my-cool-plugin"
]
```

A plugin is the following:

```
~/.punch/plugins
  | my-cool-plugin
    | plugin.js
    | package.json (with "main": "plugin.js")
```

Inside `plugin.js`:
```js

// Should export a function that takes the plugin object and the user's config object.
// The plugin object provides plugin-related things, the most important of which are hooks
// you can define callbacks for.

module.exports = function (plugin, config) {

  // Do something as soon as the program starts up.
  plugin.hooks.on('initialize', () => {

  })

  // Do something after punch in.
  plugin.hooks.on('afterPunchIn', (punch) => {

  })

  // Do something before the program ends.
  plugin.hooks.on('beforeExit', () => {

  })

}
```

A plugin would mostly just define callbacks for hooks, but a plugin can be whatever you want as long as it includes a `package.json` with `main` pointing to a file Node can run.

## Hooks

### `on('initialize', (config, data) => {})`

> TODO: Document data object

Runs as soon as the program starts running, after plugins have been initialized, but before anything else happens.

### `on('beforePunchIn', (config, data) => {})`

> TODO: Document data object

Runs on `punch in` before any command logic has run.

### `on('afterPunchIn', (config, data) => {})`

> TODO: Document data object

Runs on `punch in` after the new punch has been added and all other logic has run.

### `on('beforePunchOut', (config, data) => {})`

> TODO: Document data object

Runs on `punch out` before any command logic has run.

### `on('afterPunchOut', (config, data) => {})`

> TODO: Document data object

Runs on `punch out` after all other logic has run.

### `on('beforeSync', (config, data) => {})`

> TODO: Document data object

Runs on `punch sync` before any diffing or syncing has taken place.

### `on('afterSync', (config, data) => {})`

> TODO: Document data object

Runs on `punch sync` after diffing and syncing has taken place.

### `on('serverReceivedSyncRequest', (config, data) => {})`

> TODO: Document data object

When running `punch server`, runs as soon as a sync request has been received but before anything is done with it.

Passes one object:
```js

```

### `on('serverCompletedSyncRequest', (config, data) => {})`

> TODO: Document data object

When running `punch server`, runs after sync request has been handled.

### `on('beforeExit', (config, data) => {})`

> TODO: Document data object

Runs before the program ends.

## Future Plans

I eventually want to include some kind of plugin management so plugins can be installed straight from GitHub or another public git repo. That might look like:

```mon
plugins [
  "github:schwingbat/my-cool-plugin"
  "git@code.ratwizard.io:tony/my-other-plugin.git"
]
```

Ones ending in something other than "git@", "http://", "https://" or "github:" would be assumed to be local plugins. The package manager would just look for a `plugin.config.json` or `plugin.config.mon` in `~/.punch/plugins/my-cool-plugin/`.

If a remote plugin wasn't installed yet it would be fetched and loaded the next time Punch runs. The user would have to run a cleanup command to remove plugins that aren't listed in the config, just in case the user temporarily comments one out or something. I wouldn't want to obliterate someone's stuff unless they knew what was happening.