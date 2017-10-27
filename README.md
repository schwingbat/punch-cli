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
    "firstName": "Your",
    "lastName": "Name"
  },
  "sync": {
    "backends": [{}]
  },
  "projects": [
    {
      "name": "My First Project",
      "alias": "my-project", // What you punch in with e.g. `punch in my-project`
      "hourlyRate": 55.55
    }
  ]
}
```

## API

### Key
- `[something]` is a required parameter.
- `[?something]` is an optional parameter.
- `[?something=value]` is a parameter that is set to a default value if not passed.

### Commands

#### `in [project]`

Punch in on a project.

#### `out [?comment]`

Punch out of the current project. You can provide an optional comment to keep track of how you spent the time.

#### `rewind [time]`

> NOT YET IMPLEMENTED

Subtract a specified amount of time from the current (or previous) session if, for example, you took a 15 minute break but forgot to punch out.

#### `create [project] [timeIn] [timeOut] [?comment]`

Create an entire punch (in and out) if you forgot to punch, or if you're importing punches from another format.

#### `now`

Show the current project and time spent in the current session.

#### `report [?when=today]`

> ONLY 'TODAY' AND 'YESTERDAY' ARE CURRENTLY IMPLEMENTED

Show a summarized list of total time and pay for a given period of time.

#### `sync [?backend=all]`

> ONLY AMAZON S3 IS IMPLEMENTED

Synchronize punch files with the provided backend (or all of them if none are specified).

Punch file:
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

# Fixing

`punch fix last 10:12pm` would correct the last punch to the given time.