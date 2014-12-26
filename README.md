Editable Text for Meteor
------------------------

This package provides a widget for rendering the string fields of documents as editable text.

#### Quick Start

	meteor add babrahams:editable-text

You can then drop an editable text widget into any Blaze template as follows:

	{{> editableText collection="posts" field="author"}}
	
where "posts" is the name of the mongo collection and "author" is a the name of a document field for the "posts" collection.

`collection` and `field` are the only compulsory fields.

Note: The widget assumes that the data context is that of a single document from the "posts" collection (with _id value included).

You can also set the data context explicitly as follows:

    {{> editableText context=singlePostDocument collection="posts" field="author"}}

where `singlePostDocument` can be a single post document already set in the current context, or provided by a template helper from the template that the widget was dropped into.

(You can use `document`, `doc`, `object`, `obj`, `data` or `dataContext` instead of `context` - go with whichever you prefer.)

#### Options

There are a number of parameters you can pass to the widget that affect its behaviour:

`acceptEmpty=true` will accept a value of `''` for the field (by default, the widget won't make an update if an empty input value is entered)

`removeEmpty=true` will remove the whole document from the database if the field value is set to `''`

`textarea=true` will make the widget input field a textarea element (by default, it's an `<input type="text" />`)

`wysiwyg=true` will make the widget a wysiwyg editor (which is completely _un_customizable -- what you see is what you get! :-))

`autoInsert=true` will let you supply a data context without an `_id` field and the widget will create a document using all the fields of the data context

`onAutoInsert="callbackFunction"` will call `callbackFunction(newDocument)` with `this` as the data context of the `editableText` widget 

`eventType="mousein"` will make the text to become editable when the cursor goes over the editable text (other events can be used too) -- the default is `"click"`

`type="number"` will mean the value entered is stored as a `NumberInt` value in mongo (the default is `type="string"`)

`class="text-class"` will change the class attribute of the `span` element wrapping the text that can be edited

`inputClass="input-class"` will change the class attribute of the `input` element once the text is being edited

`style=dynamicStyle` can be used if you need to have more dynamic control over the style of the editable text (use a template helper to give the `dynamicStyle`) e.g.
	
	dynamicStyle : function() {
	  return 'color:' + Session.get('currentColor') + ';';
	} 

`inputStyle=dynamicInputStyle` same as above, but for the `input` element when editing text

`substitute=substitute` will let you put something in as a substitute for the editable text if the field value is `''`. e.g.
	
	substitute : function() {
	  return Spacebars.SafeString('<i class="fa fa-pencil"></i>');
	}

`title="This is editable text"` changes the title attribute on editable text (default is 'Click to edit')

`userCanEdit=userCanEdit` is a way to tell the widget whether the current user can edit the text or only view it (using a template helper) e.g.
	
	userCanEdit : function() {
	  return this.user_id === Meteor.userId();
	}

(Of course, to make this work, you'll have to save your documents with a `user_id` field that has a value equal to Meteor.userId() of the creator.)

`executeBefore="executeBeforeCallback"`, `executeAfter="executeAfterCallback"` these are the (string) names of functions that are fired just before and just after a database update they receive the widget's data as `this`

`placeholder="New post"` will be the placeholder on `input` or `textarea` elements
  
There is built-in support for the `babrahams:transactions` package, if you want everything to be undo/redo-able. To enable this:

	meteor add babrahams:transactions

and in your app (in some config file on the client), add:

	EditableText.useTransactions = true;

Or if you only want transactions on particular instances of the widget, pass `useTransaction=true` or `useTransaction=false` to override the default that was set using `EditableText.useTransactions`.

#### Notes

All changes to documents are made on the client, so they are subject to the allow and deny rules you've defined for your collections. To control whether certain users can edit text on the client, you can overwrite the function `EditableText.userCanEdit` (which has `this` containing all the data given to the widget, including `context` which is the document itself).  e.g. (to only allow users to edit their own documents):

	EditableText.userCanEdit = function() {
	  return this.context.user_id === Meteor.userId();
	}

It is a good idea to make the `EditableText.userCanEdit` function and your allow and deny functions share the same logic to the greatest degress possible.

#### Roadmap

- Factor out the wysiwyg editor and let it be added optionally via another package

- Clean up code base and make it more readable

- Put in error messages to help developers use the widget successfully

- Write some tests