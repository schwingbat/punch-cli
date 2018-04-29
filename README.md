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

## Commands

Output from `punch help`:

```
punch v1.13.0

a <param> is required
a [param] is optional
a param... groups any arguments after this point into one argument

Commands:
  in <project>
    start tracking time on a project
  out [comment...]
    stop tracking time and record an optional description of tasks completed
  comment <comment...>
    add a comment to remember what you worked on
  create <project> <timeIn> <timeOut> [comment...]
    create a punch
  watch
    continue running to show automatically updated stats of your current session
  project <name>
    get statistics for a specific project
  projects [names...]
    show statistics for all projects in your config file
  log [when...]
    show a summary of punches for a given period ("last month", "this week", "two days ago", etc)
  invoice <project> <startDate> <endDate> <outputFile>
    automatically generate an invoice using punch data
  sync
    synchronize with any providers in your config file
  config [editor]
    open config file in editor - uses EDITOR env var unless an editor command is specified.
```