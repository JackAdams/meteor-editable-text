EditableText = {};

EditableText.userCanEdit = function() {
  return (typeof this.userCanEdit !== 'undefined') ? this.userCanEdit : true;	
}

EditableText.useTransactions = false;

EditableText.insert = function(Collection,doc) {
  if (typeof tx !== 'undefined' && ((EditableText.useTransactions && this.useTransaction !== false) || this.useTransaction)) {
	if (this.objectTypeText) {
	  tx.start('add ' + this.objectTypeText);  
	}
	var new_id = tx.insert(Collection,doc,{instant:true});
	if (this.onAutoInsert && _.isString(this.onAutoInsert)) {
	  EditableText._executeCallback(this.onAutoInsert,this,[Collection.findOne({_id:new_id})]);
	}
	if (this.objectTypeText) {
	  tx.commit();  
	}
  }
  else {
	var new_id = Collection.insert(doc);
	if (this.onAutoInsert && _.isString(this.onAutoInsert)) {
	  EditableText._executeCallback(this.onAutoInsert,this,[Collection.findOne({_id:new_id})]);
	}
  }
  return new_id;
}

EditableText.update = function(Collection,doc,modifier) {
  if (typeof tx !== 'undefined' && ((EditableText.useTransactions && this.useTransaction !== false) || this.useTransaction)) {
	if (this.objectTypeText) {
	  tx.start('update ' + this.objectTypeText);  
	}
	if (this.executeBefore && _.isString(this.executeBefore)) {
	  EditableText._executeCallback(this.executeBefore,this);
	}
	// Important to send the id only, not the whole document ("self"),
	// as this update is fired from all sorts of contexts, some of which are incomplete -- 
	// this will force the transaction script to find the relevant document with its full context from the database
	tx.update(Collection,doc._id,modifier,{instant:true});
	if (this.executeAfter && _.isString(this.executeAfter)) {
	  EditableText._executeCallback(this.executeAfter,this);
	}
	if (this.objectTypeText) {
	  tx.commit();  
	}
  }
  else {
	if (this.executeBefore && _.isString(this.executeBefore)) {
	  EditableText._executeCallback(this.executeBefore,this);
	}
    Collection.update({_id:doc._id},modifier);
	if (this.executeAfter && _.isString(this.executeAfter)) {
	  EditableText._executeCallback(this.executeAfter,this);
	}
  }
}

EditableText.remove = function(Collection,doc) {
  if (typeof tx !== 'undefined' && ((EditableText.useTransactions && this.useTransaction !== false) || this.useTransaction)) {
	if (this.objectTypeText) {
	  tx.start('remove ' + this.objectTypeText);  
	}
	if (this.executeBefore && _.isString(this.executeBefore)) {
	  EditableText._executeCallback(this.executeBefore,this);
	}
	tx.remove(Collection,doc._id,{instant:true});
	if (this.executeAfter && _.isString(this.executeAfter)) {
	  EditableText._executeCallback(this.executeAfter,this);
	}
	if (this.objectTypeText) {
	  tx.commit();  
	}
  }
  else {
	if (this.executeBefore && _.isString(this.executeBefore)) {
	  EditableText._executeCallback(this.executeBefore,this);
	}
    Collection.remove({_id:doc._id});
	if (this.executeAfter && _.isString(this.executeAfter)) {
	  EditableText._executeCallback(this.executeAfter,this);
	}
  }
}

EditableText._executeCallback = function(callback,thisVal,args) {
  if (callback && _.isString(callback)) {
	var callback = EditableText._drillDown(window,callback);
	if (callback && _.isFunction(callback)) {
	  callback.apply(thisVal,args);
	}
  }	
}

EditableText._drillDown = function(obj,key) {
  var pieces = key.split('.');
  if (pieces.length > 1) {
	var newObj = obj ? obj[pieces[0]] : {};
	pieces.shift();
	return EditableText._drillDown(newObj,pieces.join('.'));
  }
  else {
	if (obj) {
	  return obj[key];
	}
	else {
	  return; // undefined	
	}	
  }
}

EditableText._blockFocusoutForWYSIWYG = false;

EditableText.blockOkayEvent = false;

Template.editableText.helpers({
  context : function() {
	return this.context || this.document || this.doc || this.object || this.obj || this.data || this.dataContext || Blaze._parentData(1);
  }
});

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".

EditableText.okCancelEvents = function (selector, callbacks) {
  var ok = callbacks.ok || function () {};
  var cancel = callbacks.cancel || function () {};
  var events = {};
  events['keydown '+selector+', focusout '+selector] =
	function (evt,tmpl) {
	  evt.stopImmediatePropagation();
	  var charCode = evt.which || evt.keyCode;
	  if (evt.type === "keydown") {
		switch (charCode) {
		  case 27 : // escape = cancel
			cancel.call(this, evt, tmpl);
			break;
		}
	  }
	  if (evt.type === "keydown" && (charCode === 13 && !evt.shiftKey) || evt.type === "focusout") {
		evt.preventDefault();
		// blur/return/enter = ok/submit if non-empty
		var value = $.trim(String($(evt.target).val() || "")); // evt.target.value
		if (value || this.removeEmpty || this.acceptEmpty) {
		  if (!EditableText.blockOkayEvent) { 
			EditableText.blockOkayEvent = true;  
			ok.call(this, value, evt, tmpl);
			Meteor.defer(function() {
			  EditableText.blockOkayEvent = false;
			});
		  }
		  else { // In case this value is set to true for some strange reason
			EditableText.blockOkayEvent = false;	
		  }
		}
		else {
		  cancel.call(this, evt, tmpl);
		}
	  }
	};
  return events;
};

EditableText.activateInput = function (input,dontSelect) {
  if (input !== null) {
	input.focus();
	if (typeof dontSelect !== 'undefined' && dontSelect) {
	  return;
	}
	input.select();
  }
  else {
	console.log('Input was null');  
  }
};

EditableText.sanitizeHTML = function(html) {
  // Find all instances of href=" and if the first four letters aren't "http", put in "http://"
  var currentIndex = 0,newIndex;
  do {
	newIndex = html.substr(currentIndex).indexOf('href="');
	if (newIndex !== -1) {
	  // Check whether the next four characters are http
	  currentIndex += newIndex;
	  if (html.substr(currentIndex+6,4) !== 'http') {
		currentIndex += 6;
	    html = [html.slice(0,currentIndex), 'http://', html.slice(currentIndex)].join('');
	  }
	  else {
		currentIndex += 4;  
	  }
	}
  }
  while (newIndex !== -1);
  return html;
}

EditableText.extractNumber = function(raw) {
  if (typeof raw !== 'undefined') {
	var numbers = raw.match(/[0-9]+/);
	if (numbers) {
      return $.trim(parseInt(numbers[0], 10));
	}
  }
  return "";
}

/*EditableText.firstToLower = function (text) {
  return (text) ? text.charAt(0).toLowerCase() + text.slice(1) : "";	
};*/

Blaze.body.events({
  'click .editable-text-trigger, mousedown .editable-text-trigger, dblclick .editable-text-trigger' : function(evt) {
	$(evt.target).find('.editable-text').trigger(evt.type);
  }
});

Template.editable_text_widget.helpers({
  value : function() {
	return this.value || this.context[this.field];  
  },
  editing : function() {
	return Blaze._templateInstance().selected.get(); 
  },
  isWysiwyg : function() {
	return this.wysiwyg;
  },
  wysiwygContent : function() {
	var value = this.value || this.context[this.field];
	return value && new Spacebars.SafeString(value.replace(/\n/g,'<br />')) || "";  
  },
  inputValue : function() {
	var value = this.value || this.context[this.field];
	return value && value.toString().replace(/"/g,"&quot;") || "";
  },
  substitute : function() {
	return !(this.value || this.context[this.field]) && Spacebars.SafeString(this.substitute);
  },
  title : function() {
	return this.title || ((this.eventType === 'dblclick') ? 'double click' : 'click') + ' to edit'; 
  },
  canEditText : function() {
	return EditableText.userCanEdit.call(this);  
  },
  content : function() {
	var value = this.value || this.context[this.field];
	var val = (_.isString(value)) ? new Spacebars.SafeString(value) : ((value || value === 0) ? value.toString() : "");
	return val; 
  }
});

var okCancelEvents = {};

okCancelEvents.ok = function (value,evt,tmpl) {
  evt.stopImmediatePropagation();
  var currentValue = this.value || this.context[this.field], newValue;
  var type = this.type || 'string';
  switch (type) {
	case 'number' :
	  var rawNewValue = EditableText.extractNumber(value);
	  newValue = rawNewValue && parseInt(rawNewValue) || 0;
	  currentValue = currentValue && parseInt(currentValue) || 0;
	  break;
	default :
	  newValue = $.trim(value).replace(/mml:/g,"");
	  currentValue = currentValue || '';
	  break;
  }
  var updatedValue = {};
  updatedValue[this.field] = newValue;
  // Sometimes we don't want the actual field's value, we want whatever was passed in to the template as the 'value' keyword to be used to compare against
  if (newValue !== currentValue) {
	if (!newValue && this.removeEmpty) {
	  EditableText.remove.call(this,Mongo.Collection.get(this.collection),this.context);
	}
	else {
	  // Make the update
	  EditableText.update.call(this,Mongo.Collection.get(this.collection),this.context,{$set: updatedValue});
	}
  }
  tmpl.selected.set(false);
}

okCancelEvents.cancel = function (evt,tmpl) {
  evt.stopImmediatePropagation();
  tmpl.selected.set(false);
}

Template.editable_text_widget.events(EditableText.okCancelEvents('.wide-text-edit', okCancelEvents));
Template.editable_text_widget.events(EditableText.okCancelEvents('.text-area-edit', okCancelEvents));
Template.editable_text_widget.events({
  'mousedown .wysiwyg-content .editable-text a' : function(evt) {
	if (confirm("Click 'OK' to follow this link.\n\nClick 'Cancel' to edit.")) {
	  evt.stopPropagation();
	  window.open($(evt.target).attr('href'),'_blank');	
	}
  },
  'mousedown .editable-text, click .editable-text, dblclick .editable-text' : function(evt,tmpl) {
	// This is the click event that opens the field for editing
	var collection = this.collection;
	var execute = this.execute;
	var eventType = this.eventType || ((this.wysiwyg) ? 'mousedown' : 'click');
	if (eventType !== evt.type) {
	  return;	
	}
	var acceptEmpty = this.acceptEmpty;
	var textarea = this.textarea;
	var wysiwyg = this.wysiwyg;
	var removeEmpty = this.removeEmpty;
	var type = this.type || 'string';
	var objectTypeText = this.objectTypeText || '';
	var collectionKey = collection;
	var obj = this.context;
	if (this.autoInsert && obj && !obj._id && _.isObject(obj) && EditableText.userCanEdit.call(this)) { // This is quite involved -- you need an object with all context info, but no _id field for auto-creation to occur
	  if (typeof this.value !== 'undefined' && this.value !== obj[this.field]) {
		obj[this.field] = this.value;  
	  }
	  // Create an object
	  var object_id = EditableText.insert.call(this,Mongo.Collection.get(collectionKey),obj);
	  Tracker.flush();
	  // TODO -- this new object needs to get selected (and the focus), wherever it lands in the DOM
	  // However, we have no easy way of getting its template instance, other than iterating over
	  // all template instances, looking for the one where the context._id matches the object_id value
	  // Unfortunately, I have no idea where the template instances are stored
	  // So using a filthy hack instead ...
	  // Getting the element(s) in the DOM with the right class and firing click event
	  $('.et-' + object_id).trigger((tmpl.data.wysiwyg) ? 'mousedown' : 'click');
	  return;
	}
	if (obj && !tmpl.selected.get()) {
	  if (EditableText.userCanEdit.call(this)) {
		document.activeElement.blur(); // Make sure the focusout event fires first when switching editable text objects, so that the first one gets saved properly
		tmpl.selected.set(true);
		Tracker.flush();
		if (!wysiwyg) {
		  EditableText.activateInput(tmpl.$((textarea) ? 'textarea' :  'input'),textarea);
		}
	  }
	}
  },
  'mousedown .wysiwyg-container' : function(evt) {
	EditableText._blockFocusoutForWYSIWYG = true;
	Meteor.defer(function() {
	  EditableText._blockFocusoutForWYSIWYG = false;
	});
  },
  'keydown .wysiwyg-container' : function(evt,tmpl) {
	if (evt.which === 27) {
	  evt.stopImmediatePropagation();
	  tmpl.selected.set(false);
	}
  },
  'paste .wysiwyg' : function(evt) {
	// To remove all html on paste, use this:
	// document.execCommand('insertText', false, evt.clipboardData.getData('text/plain'));
	// evt.preventDefault();
	// To remove all but selected elements and attributes, use this:
	Meteor.defer(function() {
	  $(evt.target).children().each(function() {
		EditableText.cleanHTML(this,EditableText.allowedHTMLElements);
	  });
	});
	// To accept all, do nothing
  },
  'click .wysiwyg-container .wysiwyg-save-button, focusout .wysiwyg-container .wysiwyg' : function(evt,tmpl) {
	evt.stopPropagation();
	evt.stopImmediatePropagation();
	if (evt.type === 'focusout' && EditableText._blockFocusoutForWYSIWYG) { // Need to stop clicks on the toolbar from firing the autosave due to loss of focus
	  return;	
	}
	var self = (evt.type === 'focusout') ? this : tmpl.data;
	var value = EditableText.sanitizeHTML($.trim(tmpl.$('.wysiwyg').cleanHtml()).replace(/\n/g,""));
	okCancelEvents.ok.call(self,value,evt,tmpl);
	if (evt.type === 'click') {
	  tmpl.selected.set(false);
	}
  }
});

Template.editable_text_widget.created = function() {
  this.selected = new ReactiveVar();
}

Template.editable_text_widget.rendered = function() {
  // When we start editing, get the wysiwyg and attach its toolbar
  var self = this;
  this.autorun(function() {
	if (self.selected.get() && self.data.wysiwyg) {
	  Meteor.defer(function() {
        var wysiwyg = self.$('.wysiwyg');
	    wysiwyg.wysiwyg({toolbarSelector:".wysiwyg-toolbar"});
		Meteor.setTimeout(function() {
		  wysiwyg.focusEnd();
		},100);
	  });
	}
  });
}