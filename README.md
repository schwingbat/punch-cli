# Punch

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

## Dir structure

Have a .punch folder in the user's home directory.
The punchconfig.json file resides in that folder.

Structure:
```
~
|-> punchconfig.json
|-> punches/
    |-> punches_10_25_2017.json
    |-> punches_10_26_2017.json
    |-> punches_10_27_2017.json
    |-> ...
```

Using `punch in [project]` will create a new punch file for that day if none exists, or add a new punch in that file if it does exist.

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