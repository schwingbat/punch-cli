# Punch

Punch is a cross-platform time tracker for your terminal. You just `punch in` when you start working and `punch out` when you stop. You can also `punch sync` to synchronize your data, so your work can follow you between computers and operating systems throughout the day. Punch is currently functional; I've been using it every day to track and invoice projects for the last few months. It has the odd issue here and there, but over all it's currently pretty solid.

Thanks to the stateless nature of Punch, nothing actually runs in the background while punched in. You can `punch in` on one computer and `punch out` on another as long as both computers are configured to sync with the same source.

## Requirements

- A macOS, Linux or Windows computer
- A terminal emulator (ideally with Unicode support)
- [Node.js 8+](https://nodejs.org/en/)

## v2.0 To Do

- [ ] Add quick setup for fresh installs (generate directories, create skeleton config)
- [ ] Implement weekly log
- [ ] Implement yearly log
- [ ] Generate logs for specific month/year (currently just relative - `this month`, `last month`)

## Configuration

> TODO: Add configuration guide.

## API

### Key
- `<something>` is a required parameter.
- `[something]` is an optional parameter.
- `[*something]` and `[something...]` are parameters that can include multiple words (`punch out this is all a comment` is equivalent to `punch out "this is all a comment"`).

### Commands

#### `in <project>`

Start tracking time on a project.

#### `out [*comment]`

Stop tracking time and record an optional description of tasks completed.

#### `comment [*comment]`

Add a comment to your current session.

#### `create <project> <timeIn> <timeOut> [*comment]`

Create a punch.

#### `now`

Show the status of the current session.

#### `watch`

Continue running to show automatically updated stats of your current session.

#### `projects`

Show statistics for all projects in your config file.

#### `log [*when]`

Show a summary of punches for a given period. Understands relative times like `today`, `last week`, `last october` or `three months ago`.

#### `invoice <project> <startDate> <endDate> <outputFile>`

Automatically generate an invoice using punch data.

#### `sync`

Synchronize with any providers you have configured. Just running `punch sync` with no providers will sync with all of them.

#### `config [editor]`

Open config file in `editor` - uses `EDITOR` environment variable unless an editor command is specified.