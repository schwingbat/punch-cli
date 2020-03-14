# Events

## Lifecycle

| event      | description                                                                                 |
| ---------- | :------------------------------------------------------------------------------------------ |
| `willexit` | Called just before the program quits, giving a final warning to clean up any ongoing tasks. |

## Server

| event                 | description                                                     |
| --------------------- | :-------------------------------------------------------------- |
| `server:started`      | Called immediately after the server is ready to serve requests. |
| `server:punchupdated` | Called any time a punch or batch of punches have been modified. |
