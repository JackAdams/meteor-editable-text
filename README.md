Editable Text for Meteor
------------------------

This package provides a widget for rendering the fields of documents as editable text.

Example app: [http://editable-text-demo.taonova.com](http://editable-text-demo.taonova.com) (also using collection2, accounts and transactions)

Example app repo: [https://github.com/JackAdams/editable-text-demo](https://github.com/JackAdams/editable-text-demo)

#### Quick Start

    meteor add babrahams:editable-text

You can then drop an editable text widget into any Blaze template as follows:

    {{> editableText collection="posts" field="author"}}
    
where "posts" is the name of the actual mongo collection (not the name of a Meteor `Mongo.Collection` instance) and "author" is the name of a document field for the `posts` collection (`author.firstName` would also work as the field name).

`collection` and `field` are the only mandatory parameters.

Note: The widget assumes that the data context is that of a single document from the `posts` collection (with the _id value included).

You can also set the data context explicitly as follows:

    {{> editableText context=singlePostDocument collection="posts" field="author"}}

where `singlePostDocument` can be a single post document already set in the current context, or provided by a template helper from the template that the widget was dropped into.

(You can use `document`, `doc`, `object`, `obj`, `data` or `dataContext` instead of `context` - go with whichever you prefer.)

#### API

This package exposes the symbols `EditableText` and `sanitizeHtml`. `sanitizeHtml` would only be used if you have very specific requirements when using a wysiwyg package and can be ignored for most apps. `EditableText` is used for setting app-wide config for the `{{> editableText ...}}` widget as shown below.  

#### Configuration

You can change the global behaviour of the widget by setting certain properties of `EditableText`.

`EditableText.saveOnFocusout=false` will mean that the `focusout` event will not save text that is being edited (default is `EditableText.saveOnFocusout=true`)

`EditableText.trustHtml=true` will mean that HTML entered in `input` and `textarea` fields is rendered as HTML (default is `EditableText.trustHTML=false`) - useful if you want newlines from textareas automatically represented as `<br />` tags

Set several config properties at once using `EditableText.config({saveOnFocusout: false, trustHtml: true});`. Config properties that only have an effect on the client are: `saveOnFocusout`, `trustHtml`, and `useMethods`. Config properties that need to be set on both client and server are: `userCanEdit`, `useTransactions`, `maximumImageSize`, `allowedHtml`.  Server only: `clientControlsTransactions`.

#### Options

There are a number of parameters you can pass to the widget that affect its behaviour:

`acceptEmpty=true` will accept a value of `""` for the field (by default, the widget won't make an update if an empty input value is entered)

`unsetEmpty=true` will accept a value of `""` and `$unset` the field (this overrides `acceptEmpty`)

`removeEmpty=true` will remove the whole document from the database if the field value is set to `""` (this trumps `acceptEmpty=true`!!)

`textarea=true` will make the widget input field a textarea element (by default, it's an `<input type="text" />`)

`wysiwyg=true` will make the widget a wysiwyg editor (which is, at present, completely uncustomizable -- what you see is what you get! :-)). You'll need to `meteor add babrahams:editable-text-wysiwyg-bootstrap-3` or this `wysiwyg=true` will have no apparent effect and the editing widget will fall back to a textarea (with the difference being that HTML strings will be displayed as actual HTML not as a string showing the markup, so be careful with this). **Note:** When using content created using the wysiwyg editor in non-editable fields and other templates you will need to use triple curly braces like `{{{postText}}}`.

`autoInsert=true` will let you supply a data context without an `_id` field and the widget will create a document using all the fields of the data context

`beforeInsert="addTimestampToDocBeforeInsert"` will call `addTimestampToDocBeforeInsert(documentToBeInserted, Collection)`, with `this` as the data that the `editableText` widget was initialized with, immediately before an auto insert

`afterInsert="callbackFunction"` will call `callbackFunction(newlyInsertedDocument, Collection)`, with `this` as the data that the `editableText` widget was initialized with, immediately after an auto insert

`beforeUpdate="coerceTypeToDateBeforeUpdate"`, will call `coerceTypeToDateBeforeUpdate(doc, Collection, newValue, modifier)`, with `this` as the data that the `editableText` widget was initialized with. `beforeUpdate` callbacks are special cased to be called with the `newValue` and `modifier` arguments. Also, for `beforeUpdate` callbacks only, if the callback function returns a value, that will replace the `newValue` that the user entered, **unless** the callback returns an object with `$set`, `$addToSet` or `$push` as one of its keys -- in this case, it will be assumed that it is overwriting the whole modifier, not just the `newValue`. See the examples below.

Other available callback function hooks are `afterUpdate`, `beforeRemove`, `afterRemove` -- they each receive the document and Collection as their parameters and have the full widget data as `this`.

`onStartEditing` and `onStopEditing` callbacks are called with `this` as the data that the `editableText` widget was initialized with and the document being edited as the only parameter. (The same is true of `onShowToolbar` and `onHideToolbar` if the `babrahams:editable-text-wysiwyg-bootstrap-3` package is added.)

For all callbacks, the values of the parameters must be the (string) names of functions, not the functions themselves. These functions have to be registered as follows, using `EditableText.registerCallbacks`:

    EditableText.registerCallbacks({
      addTimestampToDocBeforeInsert : function (doc) {
        return _.extend(doc, {timestamp: Date.now()});
      },
	  coerceTypeToDateBeforeUpdate : function (doc, Collection, newValue, modifier) {
	    return new Date(newValue);
	  },
	  checkForExpletivesBeforeUpdate : function (doc, Collection, newValue, modifier) {
	    var expletives = ['assorted', 'bad', 'words'];
		var containsExpletives = !!_.find(expletives, function (expletive) {
		  return newValue.indexOf(expletive) > -1;
		});
		// modifier is already of the form { $set: {text: newValue}}
		modifier["$set"].containsExpletives = containsExpletives;
		}
		return modifier;
	  }
    });
    
These would then be applied by passing the parameter `beforeInsert='addTimestampToDocBeforeInsert'` (when initializing a widget that has also been passed `autoInsert=true`), `beforeUpdate='coerceTypeToDateBeforeUpdate'`, etc.

Notice that returning a modified _document_ in a `beforeInsert` function will mean that this is the version of the document that will be inserted into the db, while returning a modified _value_ (usually a string) from a `beforeUpdate` function will mean that the modified value is used for the db update (good for custom validations).

`eventType="dblclick"` will make the text become editable only when double clicked (only event types supported are `"click"`, `"dblclick"`, `"mousedown"`) -- the default is `"click"`

`type="number"` will mean the value entered is stored as a `NumberInt` value in mongo (the default is `type="string"`)

`class="text-class"` will change the class attribute of the `span` element wrapping the text that can be edited

`inputClass="input-class"` will change the class attribute of the `input` element once the text is being edited

`style=dynamicStyle` can be used if you need to have more dynamic control over the style of the editable text (use a template helper to give the `dynamicStyle`) e.g.
    
    dynamicStyle : function() {
      return 'color:' + Session.get('currentColor') + ';';
    } 

`inputStyle=dynamicInputStyle` same as above, but for the `input` element when editing text

`substitute='<i class="fa fa-pencil"></i>'` will let you put something in as a substitute for the editable text if the field value is `''`

`title="This is editable text"` changes the title attribute on editable text (default is 'Click to edit')

`userCanEdit=userCanEdit` is a way to tell the widget whether the current user can edit the text or only view it (using a template helper) e.g.
    
    userCanEdit : function() {
      return this.user_id === Meteor.userId();
    }

(Of course, to make the above work, you would have to save your documents with a `user_id` field that has a value equal to Meteor.userId() of the creator.)

`userCanEdit` is really only useful for preventing text from being editable on the client in certain circumstances (by setting it to `false`). In the end, the only logic that matters is that of the `EditableText.userCanEdit` function (see the 'Security' section below).

`placeholder="New post"` will be the placeholder on `input` or `textarea` elements

`saveOnFocusout=false` will prevent a particular widget instance from saving the text being edited on a `focusout` event (the default is to save the text, which can be changed via `EditableText.saveOnFocusout`)

`trustHtml=true` will make a particular widget instance rendered its text as HTML (default is `false`, which can be changed via `EditableText.trustHTML`)

`stopPropagation=true` will stop the event that triggers the widget from propagating up the the elements ancestors on the DOM (default is `stopPropagation=false`, so the event will propagate)

All of these options can be set by using the `options=optionsHelper` parameter, where `optionsHelper` is a template helper that returns an object such as this:

```
Template.myTemplate.helpers({
  optionsHelper : function() {
    return {
      collection: "posts",
      field: "title",
      removeEmpty: true,
      acceptEmpty: true,
      placeholder: "Post title",
      substitute: '<i class="fa fa-pencil"></i>'
    }
  }
});
```

#### Triggering widget

If you wrap the `{{> editableText ... }}` widget in an element which has `class="editable-text-trigger"`, a click on that element will trigger the edititing.

**Note:** Only use `class="editable-text-trigger"` to trigger the widget with `eventType` values that are `click` (default), `dblclick` or `mousedown`. If you use other `eventType` values, you will run into problems with recursion.

#### Transactions

There is built-in support for the `babrahams:transactions` package, if you want everything to be undo/redo-able. To enable this:

    meteor add babrahams:transactions

and in your app (in some config file on both client and server), add:

    EditableText.useTransactions = true;

Or if you only want transactions on particular instances of the widget, pass `useTransaction=true` or `useTransaction=false` to override the default that was set via `EditableText.useTransactions`, but this will only work if you also set `EditableText.clientControlsTransactions=true` (by default it is `false`). If you set the `EditableText.useTransactions` value on the server, without changing `EditableText.clientControlsTransactions`, it doesn't matter what you set on the client (or pass from the client), you will always get the behaviour as set on the server.

#### Security

To control whether certain users can edit text on certain documents/fields, you can overwrite the function `EditableText.userCanEdit` (which gets the data and config passed to the widget as `this` and parameters which are the document and collection).  e.g. (to only allow users to edit their own documents):

    EditableText.userCanEdit = function(doc, Collection) {
      return this.context.user_id === Meteor.userId(); // same as: doc.user_id === Meteor.userId();
    }

**It is important that you overwrite this function in a production app** as the default is:

    EditableText.userCanEdit = function(doc, Collection) {
      return true;
    }

... which means anyone can edit any field in any document.

In this case, it is a good idea to make the `EditableText.userCanEdit` function and your allow and deny functions share the same logic to the greatest degree possible.

Note: the default setting is `EditableText.useMethods=true`, meaning updates are processed server side and bypass your allow and deny rules. If you're happy with this (and you should be), then all you need to do for consistency between client and server permission checks is overwrite the `EditableText.userCanEdit` function in a file that is shared by both client and server.  Note that this function receives the widget data context as `this` and the collection object as the only parameter.

    // e.g. If `type` is the editable field, but you want to limit the number of objects in the collection with any given value of `type` to 10
    EditableText.userCanEdit = function(doc, Collection) {
      var count = Collection.find({type: this.context.type}).count(); // `this.context` is a document from `Collection`
      return count < 10;
    }

**Warning:** if you set `EditableText.useMethods=false`, your data updates are being done on the client and you don't get html sanitization by default -- you'll have to sort this out or yourself via collection hooks or something. By default (i.e. when `EditableText.useMethods=true`) all data going into the database is passed through [htmlSantizer](https://github.com/punkave/sanitize-html).

**Bigger warning:** it doesn't really matter what you set `EditableText.useMethods` to -- you still need to lock down your collections using appropriate `allow` and `deny` rules. A malicious user can just type `EditableText.useMethods=false` into the browser console and this package will start making client side changes whose persistence to the database are subject only to your `allow` and `deny` rules.

#### Roadmap

- ~~Factor out the wysiwyg editor and let it be added optionally via another package~~

- ~~Make updates via methods rather than on the client using allow/deny rules~~

- ~~Sanitize all html that comes through method calls (assume every string field is html)~~

- ~~Add support for fields like `author.firstName`~~

- Clean up and document code base

- Put in error messages to help developers use the widget successfully

- Write some tests
