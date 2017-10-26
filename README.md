# Punch

## API
```bash
# Start and stop
punch in bidpro
punch out

# With description
punch in bidpro "Designing login screen"

# Get current time worked
punch time
#=> You've worked on Morganizer for 1h 32m this session.

# Rewind a missed punch or a break
punch rewind 15m
#=> Rewound Morganizer session by 15m (1h 32m -> 1h 17m)
```

## File Format

Entries are added line by line on an append-only basis.

Structure goes something like this:
```
in  timestamp project
out timestamp project [description]
rewind  amount  project
```

This could potentially get compacted occasionally to save space:
```
session start end project [description]
```

Tabs separate each value and newlines separate each punch.





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

Theoretically you should be able to run `punch sync` with a project left punched in and then `punch out` on another computer and resync.

# Fixing

`punch fix last 10:12pm` would correct the last punch to the given time.