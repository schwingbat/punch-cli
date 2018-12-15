# Storage Services

A storage service is a function that takes a `config` object and a `Punch` constructor as arguments and returns an object that implements the Storage Service API.

The storage service is chosen based on the `storageType` [`string`] property in the user's config. `punchfile` is the default.

## Storage Service API

### `save(punch: Punch): Promise<void>`

Takes a punch and stores it for later retrieval.

### `current(project?: string): Promise<Punch?>`

Returns the raw punch data for the currently active punch, in other words, the most recent punch with an `out` value of `null`.

### `latest(project?: string): Promise<Punch?>`

Returns the most recent punch regardless of `out` value.

### `select(test: (object) => bool): Promise<Punch[]>`

Takes a function and runs it on each punch record, returning an array of items for which the function returned true.