Meteor Editable Text
====================

### vNext

- Tests

### v0.8.24

- Fix for bug introduced in 0.8.23

### v0.8.23

- Added an `unsetEmpty` option

### v0.8.22

- Allowed `color` attribute for `font` elements to support color picker for wysiwyg editors
- Added support for `transactionUpdateText`, `transactionInsertText` and `transactionRemoveText` to allow transactions to incorporate callback actions

### v0.8.21

- POSSIBLE BREAKING CHANGE: Changed default behaviour for `removeEmpty`, where it didn't remove documents if a field was empty during a focusout event; now they are removed (to retain the previous default behaviour, you need to set `removeOnFocusout=false` -- a falsy value won't do, it must === false)

### v0.8.20

- Added a `data` param so arbitrary data can be sent to the server (e.g. for use in callback functions)

### v0.8.19

- Fixed a bug in which an error was thrown on the client when deleting all text

### v0.8.17

- Added some undocumented API calls

### v0.8.12

- Added support for external editors (babrahams:editable-text-froala)

### v0.8.9

- Added a CHANGELOG.md
- Fix for initializing widget via options hash