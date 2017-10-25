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