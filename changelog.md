# Punch Changelog

## 2.3.1

- Update punch timestamps during `adjust` command.

## 2.3.0

This update adds some additional logging & configuration features.

### Logging

- Added guards against accepting punches that end before they start
- Added hourly timeline graphic to show time worked for each day
- Added `display.use24HourTime` option to config file
- Added logging for arbitrary date ranges by using --start and --end flags

### Configuration

- Added YAML as the supposed new config file format.

### Sync

- Added Punch server as a sync provider.

## 2.2.0

This update focuses on streamlining the way punches are stored.

- Removed NEDB and Punchfile storage formats
- Added ledger (flat file) storage to replace all other formats
  - SQLite remains for this version to allow migration to ledger
