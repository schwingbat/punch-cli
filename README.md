# Punch

Punch is a cross-platform time tracker for your terminal. You just `punch in` when you start working and `punch out` when you stop. You can also `punch sync` to sync your data with Amazon S3 and other backends, so your work can follow you between computers and operating systems throughout the day. 

![](/docs/screenshot-1.png)

Track time on multiple projects (simultaneously even), view summaries of your time and earnings in marvelous Technicolor and generate invoices using your own custom Handlebars templates. Write custom export functions in JavaScript to get your data in any format you need it, whether you want to pop it in a spreadsheet or import into another time tracker application. Punch is a timesheet program for geeks.

Thanks to the stateless nature of Punch, nothing actually runs in the background while punched in. You can `punch in` on one computer and `punch out` on another as long as both computers sync with the same source.

Punch is personally battle tested. I've been relying on it to track and invoice projects every day for the past year.

## Requirements

- A macOS, Linux or Windows computer
- A terminal emulator (ideally with Unicode support)

## Installation

Punch is distributed as a single dependency-free binary (courtesy of [zeit/pkg](https://github.com/zeit/pkg)). Download the latest release over on [the releases page](https://github.com/schwingbat/punch-cli/releases), follow the install instructions and you're ready to roll!

## Development To Do

- [ ] Add comprehensive setup for fresh installs (generate directories, create skeleton config, ask for user info)
- [ ] Implement weekly log

## Configuration

> TODO: Add configuration guide.

## Commands

Output from `punch help`:

```

  punch v2.2.0

  a <param> is required
  a [param] is optional
  a param... groups any arguments after this point into one argument

  Run punch <command> --help with any of the following commands for more information.

  Commands:
    in <project>
      start tracking time on a project
    out [project]
      stop tracking time
    log [when...]
      show a summary of punches for a period ("last month", "this week", "two days ago", etc)
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
    adjust <punchID>
      adjust punch start/end times
    invoice <project> <startDate> <endDate> <outputFile>
      automatically generate an invoice using punch data
    sync [services...]
      synchronize with any services in your config file
    config
      open config file in editor - uses EDITOR env var unless an editor flag is specified.
    purge <project>
      destroy all punches for a given project
    watch
      continue running to show automatically updated stats of your current session
    projects [names...]
      show statistics for all projects in your config file
    rename-project <from> <to>
      move all punches with project alias <from> to <to>
    adjust-rate <project> <newRate>
      adjust pay rate for punches
    import <file>
      imports punch data from a file

```