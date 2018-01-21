# Punch

Punch is a cross-platform time tracker for your terminal. You just `punch in` when you start working and `punch out` when you stop. You can also `punch sync` to synchronize your data, so your work can follow you between computers and operating systems throughout the day. There is some assembly required, however:

## v1.5 To Do

- [ ] Add quick setup for fresh installs (generate directories, create skeleton config)
- [ ] Make `rewind` command actually apply values instead of just printing
- [ ] Make sure all command printing looks good and is relatively uniform across the board

## Configuration

The basic configuration is thus: you have a folder in your home directory called `.punch`, which contains this structure:

```
~/.punch/
|-> punch.yaml
|-> punches/
    |-> punches_10_25_2017.json
    |-> punches_10_26_2017.json
    |-> punches_10_27_2017.json
    |-> ...
```

Each punch file contains something like this:

```json
[
  {
    "project": "itzadoozie",
    "in": 902898102,
    "out": 908210292,
    "rewind": 600120,
    "comments": [
      "Fixed sticky tiles"
    ]
  },
  {
    "project": "morganizer",
    "in": 902898102,
    "out": null,
    "rewind": 0,
    "comments": []
  },
]
```

Thanks to the stateless and file-based nature of Punch, nothing actually runs in the background while punched in. You can `punch in` on one computer and `punch out` on another as long as both computers are configured to sync with the same S3 bucket.

## API

### Key
- `<something>` is a required parameter.
- `[something]` is an optional parameter.
- `[*something] and [something...]` are parameters that can include multiple words (`punch out this is all a comment` is equivalent to `punch out "this is all a comment"`).

### Commands

#### `in <project>`

Start tracking time on a project.

#### `out [*comment]`

Stop tracking time and record an optional description of tasks completed.

#### `comment [*comment]`

Add a comment to your current session.

#### `rewind <amount>`

Subtract payable time from a project to account for breaks and interruptions.

#### `create <project> <time_in> <time_out> [*comment]`

Create a punch.

#### `purge <project>`

Destroy all punches for a given project.

#### `now`

Show the status of the current session.

#### `watch`

Continue running to show automatically updated stats of your current session.

#### `project <name>`

Get statistics for a specific project.

#### `projects [names...]`

Show statistics for all projects in your config file.

#### `log [*when]`

Show a summary of punches for a given period.

#### `today`

Show a summary of today's punches (alias of "punch log today").

#### `yesterday`

Show a summary of yesterday's punches (alias of "punch log yesterday").

#### `week`

Show a summary of punches for the current week (alias of `punch log this week`).

#### `month`

Show a summary of punches for the current month (alias of `punch log this month`).

#### `invoice <project> <start_date> <end_date> <output_file>`

Automatically generate an invoice using punch data.

#### `sync [providers...]`

Synchronize with any providers you have configured. Just running `punch sync` with no providers will sync with all of them.

#### `config [editor]`

Open config file in `editor` - uses `EDITOR` env var unless an editor command is specified.
