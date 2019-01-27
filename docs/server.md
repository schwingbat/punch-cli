# Punch Server

> This doesn't work yet. This is a plan for a future feature.

Running `punch server` starts a full-fledged web server with a sync API. Punch clients on other computers can sync against the server. Plugins can be used to add additional logic when sync requests are received.

All server requests require an API key. The API keys are stored in the server's config file. The server can have multiple valid keys (for example, one for each computer) to allow rotating and blacklisting keys for different machines.

```mon
server {
  keys [
    "asdf" # My laptop
    "fdsa" # Work desktop
  ]
}
```

One of these keys must be set in the `credentials` object in your `punch-server` sync config on a local machine. The server key is sent in a header with every request.

In your punchconfig.mon:
```mon
sync {
  services [
    {
      name "punch-server"
      label "My Punch Server"
      url "https://punch-sync.tonymccoy.me"
      credentials {
        key "asdf"
      }
    }
  ]
}
```

## The API

### `GET /api/v1/punches/manifest`

Gets the manifest of all the current files on the server.

Returns IDs and the timestamp of the last modification for each.
```json
{
  "6bc3c99e-9200-45a8-80d6-a924408845e7": 1545589935028,
  "2137a565-62f1-46ce-ab8d-1e1f56160e6e": 1545589935028
}
```

### `POST /api/v1/punches/upload`

Send punch data for all punches the client wishes to upload.

POST data:
```json
{
  "punches": [
    ...
  ]
}
```

Returns 204 on successful upload.

### `POST /api/v1/punches/download`

Sends a list of IDs to the server to request a download. Returns the requested Punches.

POST data:
```json
{
  "ids": [
    "2137a565-62f1-46ce-ab8d-1e1f56160e6e",
    "6bc3c99e-9200-45a8-80d6-a924408845e7"
  ]
}
```

Returns:
```json
{
  "punches": [
    ...
  ]
}
```

### `POST /api/v1/punches/delete`

Sends a list of IDs to the server to delete.

POST data:
```json
{
  "ids": [
    "2137a565-62f1-46ce-ab8d-1e1f56160e6e",
    "6bc3c99e-9200-45a8-80d6-a924408845e7"
  ]
}
```

Returns 204 on successful delete.

## Multi User Server

The standard Punch server only supports one user. Another future project would be a standalone server program that manages punches for many users.

## The Web UI

Along with the API the server could also serve a web app to interact with punches visually. This web UI would also be served from the multi user server with included account management features.