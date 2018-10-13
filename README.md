# Punch

Punch is a cross-platform time tracker for your terminal. You just `punch in` when you start working and `punch out` when you stop. You can also `punch sync` to synchronize your data with Amazon S3 and other backends, so your work can follow you between computers and operating systems throughout the day. 

![](/docs/screenshot-1.png)

Track time on multiple projects, view your aggregate time and earnings in marvelous Technicolor and generate invoices using Handlebars templates. You can also write custom exporters in JavaScript so you can get your data out in any format you need it, whether you want to pop it in a spreadsheet or import into another time tracker application. Punch is a timesheet program for keyboard loving power users.

While not perfectly polished, Punch is currently functional; I've been using it every day to track and invoice projects for the last year. It has the odd issue here and there, but over all it's pretty solid.

Thanks to the stateless nature of Punch, nothing actually runs in the background while punched in. You can `punch in` on one computer and `punch out` on another as long as both computers are configured to sync with the same source.

## Requirements

- A macOS, Linux or Windows computer
- A terminal emulator (ideally with Unicode support)
- [Node.js 8+](https://nodejs.org/en/)

## To Do

- [ ] Add quick setup for fresh installs (generate directories, create skeleton config)
- [ ] Implement weekly log
- [X] Implement yearly log
- [X] Generate logs for specific month/year (currently just relative - `this month`, `last month`)

## Configuration

> TODO: Add configuration guide.

## Commands

Output from `punch help`:

```
  punch v2.1.0

  a <param> is required
  a [param] is optional
  a param... groups any arguments after this point into one argument

  Run punch <command> --help with any of the following commands for more information.

  Commands:
    in <project>
      start tracking time on a project
    out [project]
      stop tracking time
    comment <comment...>
      add a comment to remember what you worked on
    add-comment <punchID> <comment...>
      add a comment to a specific punch
    replace-comment <punchID> <commentIndex> <newComment>
      replace the text of an existing comment
    delete-comment <punchID> <commentIndex>
      delete a comment from a punch
    create <project>
      create a punch
    delete <punchID>
      delete a punch
    watch
      continue running to show automatically updated stats of your current session
    projects [names...]
      show statistics for all projects in your config file
    log [when...]
      show a summary of punches for a given period ("last month", "this week", "two days ago", etc)
    invoice <project> <startDate> <endDate> <outputFile>
      automatically generate an invoice using punch data
    sync [services...]
      synchronize with any services in your config file
    config
      open config file in editor - uses EDITOR env var unless an editor flag is specified.
    rename-alias <from> <to>
      move all punches with project alias <from> to <to>
    rename-comment-object <from> <to>
      rename comment objects with name <from> to name <to>
    adjust-rate <project> <newRate>
      adjust pay rate for punches
```