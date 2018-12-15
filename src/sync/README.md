# Syncing

The Punch syncer consists of one core module that reads the user's config file and loads the appropriate sync services, and a collection of services that implement a uniform API that talks to that service's backend to upload and download Punch data.

The service can be anything from an S3 bucket to a remote SQL database as long as its service implements the service API.

## Sync Service API

### `getManifest(): Promise<{ id: timestamp, ... }>`

Returns an object in `{ id: timestamp }` format containing the IDs and updated timestamps of all punches the service currently stores. This is used to diff and decide what needs to be sent and received.

### `upload(punches: Punch[]): Promise<Punch[]>`

Takes an array of `Punch` objects and saves them using the service. Returns an array of uploaded `Punch`es.

### `download(ids: string[]): Promise<Punch[]>`

Takes an array of punch IDs to be downloaded. Returns an array of downloaded `Punch`es.