Meteor Editable Text
====================

### vNext

- Tests

### v0.9.10

- Small modification to allow `babrahams:editable-list` package to work with arrays of objects

### v0.9.9

- Version bump because something went wrong in the publish process for 0.9.8

### v0.9.8

- Improved hack for focusing correct element after `autoInsert` operation
- Updated `sanitize-html` from 1.14.1 to 1.17.0
- Added `afterRender` hook on the client for wysiwyg content (undocumented)

### v0.9.7

- Fix for `onStopEditing` callback when cancelling editing

### v0.9.6

- Added support for custom buttons on wysiwyg plugins
- Added support for forcing the case of entered text to upper or lower

### v0.9.5

- Made autoResize inactive until there is some text typed (so users can see placeholders)

### v0.9.4

- Fixed after insert callbacks (they were async before so the newly-inserted document wasn't available for the callback function)

### v0.9.3

- Added missing style elements, so you can now use `style=" ... "` when initializing the widget

### v0.9.2

- Autolinking of any links in wysiwyg editors

### v0.9.1

- Defer the switch of templates after an update to prevent flicker

### v0.9.0

- Made the callback behaviour more consistent
- Allowed cancelling of actions by returning `false` from callback functions

### v0.8.31

- Fixed a bug where substitute html would display instead of zeros for `type="number"`
- Removed dependency on `djedi:sanitize-html` and rolled the NPM dependency on `sanitize-html` into the `babrahams:editable-text` package
- Fixed a bug where `unsetEmpty` wouldn't unset the field on the server
- Added support for editing HTML with wysiwyg editors 

### v0.8.25

- Added a `useExistingTransaction` option (for babrahams:transactions package integration), allowing writes made by the babrahams:editable-text package to be part of a larger transaction (if one is already started; otherwise it will just start a new one, as usual). This can replace the `useTransaction` option.

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