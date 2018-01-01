# Punch

Punch is a cross-platform time tracker for your terminal. You just `punch in` when you start working and `punch out` when you stop. You can also `punch sync` to synchronize your data, so your work can follow you between computers and operating systems throughout the day. There is some assembly required, however:

## Configuration

The basic configuration is thus: you have a folder in your home directory called `.punch`, which contains this structure:

```
~/.punch/
|-> punchconfig.json
|-> punches/
    |-> punches_10_25_2017.json
    |-> punches_10_26_2017.json
    |-> punches_10_27_2017.json
    |-> ...
```

I plan to create an automatic setup eventually, but if you're on Mac or Linux you can run this command: `mkdir -p ~/.punch/punches; touch ~/.punch/punchconfig.json`

Your `punchconfig.json` should contain at least this minimal configuration:

```json
{
  "user": {
    "name": "Your Name",
  },
  "sync": {
    "backends": [],
  },
  "projects": [
    {
      "name": "My First Project",
      "alias": "my-project", // What you punch in with e.g. `punch in my-project`
      "hourlyRate": 55.55,
    },
  ],
}
```

Each punch file contains something like this:

```json
[
  {
    "project": "itzadoozie",
    "in": 902898102, // punch in time
    "out": 908210292, // punch out time
    "rewind": 600120, // amount of time to subtract (break, etc.)
    "comment": "Fixed sticky tiles"
  },
  {
    "project": "morganizer",
    "in": 902898102,
    "out": null, // null means not punched out yet.
    "rewind": 0
  },
]
```

Thanks to the stateless and file-based nature of Punch, nothing actually runs in the background while punched in. You *can* `punch in` on one computer, `punch sync`, then `punch out` on another computer.

## API

### Key
- `<something>` is a required parameter.
- `<something?>` is an optional parameter.
- `<something?=value>` is a parameter that is set to a default value if not passed.

### Commands

#### `in <project>`

Start tracking time on a project.

#### `out <comment?>`

Stop tracking time and record an optional description of tasks completed.

#### `rewind <amount>`

Subtract payable time from a project to account for breaks and interruptions.

#### `create <project> <timeIn> <timeOut> <comment?>`

Create a punch.

#### `purge <project>`

Destroy all punches for a given project.

#### `now`

Show the status of the current session.

#### `projects`

Show a list of all projects in your config file.

#### `today`

Show a summary of today's punches (shorthand for "punch report today").

#### `yesterday`

Show a summary of yesterday's punches (short for "punch report yesterday").

#### `report [when=today]`

Show a summary of punches for a given period.

#### `invoice <project> <startDate> <endDate> <outputFile>`

Automatically generate an invoice using punch data. Currently supports .html and .pdf extensions.

#### `sync [providers...]`

Synchronize with any providers you have configured.