EditableText = {};


// ***********************
// CONFIGURABLE PROPERTIES
// ***********************

EditableText.userCanEdit = function() {
  return (typeof this.userCanEdit !== 'undefined') ? this.userCanEdit : true;	
}

EditableText.useTransactions = false;
EditableText.saveOnFocusout = true;
EditableText.trustHTML = false;

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


// *********************************
// INTERNAL PROPERTIES AND FUNCTIONS
// *********************************

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

EditableText.__blockOkayEvent = false;

Template.editableText.helpers({
  context : function() {
	return this.context || this.document || this.doc || this.object || this.obj || this.data || this.dataContext || Blaze._parentData(1);
  }
});

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".

EditableText._okCancelEvents = function (selector, callbacks) {
  var ok = callbacks.ok || function () {};
  var cancel = callbacks.cancel || function () {};
  var events = {};
  events['keydown '+selector+', focusout '+selector] =
	function (evt,tmpl) {
	  evt.stopImmediatePropagation();
	  var charCode = evt.which || evt.keyCode;
	  var value = $.trim(String($(evt.target).val() || ""));
	  if (evt.type === "keydown") {
		switch (charCode) {
		  case 27 : // escape = cancel
			cancel.call(this, value, evt, tmpl);
			break;
		}
	  }
	  if (evt.type === "keydown" && (charCode === 13 && !evt.shiftKey) || (evt.type === "focusout" && (typeof this.saveOnFocusout !== 'undefined' && this.saveOnFocusout || EditableText.saveOnFocusout))) {
		evt.preventDefault(); console.log(this);
		// blur/return/enter = ok/submit if non-empty
		if (value || this.removeEmpty || this.acceptEmpty) {
		  if (!EditableText._blockOkayEvent) { 
			EditableText._blockOkayEvent = true;  
			ok.call(this, value, evt, tmpl);
			Meteor.defer(function() {
			  EditableText._blockOkayEvent = false;
			});
		  }
		  else { // In case this value is set to true for some strange reason
			EditableText._blockOkayEvent = false;	
		  }
		}
		else {
		  cancel.call(this, value, evt, tmpl);
		}
	  }
	};
  return events;
};

EditableText._activateInput = function (input,dontSelect) {
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

EditableText._extractNumber = function(raw) {
  if (typeof raw !== 'undefined') {
	var numbers = raw.match(/[0-9]+/);
	if (numbers) {
      return $.trim(parseInt(numbers[0], 10));
	}
  }
  return "";
}

EditableText._makeUpdate = function(value,isEscape) {
  // value has already been trimmed with $.trim()
  var currentValue = this.value || this.context[this.field], newValue;
  var type = this.type || 'string';
  switch (type) {
	case 'number' :
	  var rawNewValue = EditableText._extractNumber(value);
	  newValue = rawNewValue && parseInt(rawNewValue) || 0;
	  currentValue = currentValue && parseInt(currentValue) || 0;
	  break;
	default :
	  newValue = value.replace(/mml:/g,"");
	  currentValue = currentValue || '';
	  break;
  }
  var updatedValue = {};
  updatedValue[this.field] = newValue;
  // Sometimes we don't want the actual field's value, we want whatever was passed in to the template as the 'value' keyword to be used to compare against
  if (newValue !== currentValue || (!newValue && this.removeEmpty)) {
	if (!newValue && this.removeEmpty) {
	  EditableText.remove.call(this,Mongo.Collection.get(this.collection),this.context);
	}
	else if (!isEscape) {
	  // Make the update
	  EditableText.update.call(this,Mongo.Collection.get(this.collection),this.context,{$set: updatedValue});
	}
  }
}

/*EditableText.firstToLower = function (text) {
  return (text) ? text.charAt(0).toLowerCase() + text.slice(1) : "";	
};*/


// ******
// EVENTS
// ******

Blaze.body.events({
  'click .editable-text-trigger, mousedown .editable-text-trigger, dblclick .editable-text-trigger' : function(evt) {
	$(evt.currentTarget).find('.editable-text').trigger(evt.type);
  }
});

Template.editable_text_widget.helpers({
	
  value : function() {
	return this.value || this.context[this.field];  
  },
  
  editing : function() {
	return Blaze._templateInstance().selected.get(); 
  },
  
  textarea : function() {
	return this.textarea || (this.wysiwyg && !EditableText.wysiwyg);  
  },
  
  isWysiwyg : function() {
	return EditableText.wysiwyg && this.wysiwyg;
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
	return !(this.value || this.context[this.field]) && (this.substitute && Spacebars.SafeString(this.substitute.toString()));
  },
  
  title : function() {
	return this.title || ((this.eventType === 'dblclick') ? 'double click' : 'click') + ' to edit'; 
  },
  
  canEditText : function() {
	return EditableText.userCanEdit.call(this);  
  },
  
  content : function() {
	var value = this.value || this.context[this.field];
	var val = (_.isString(value)) ? (((typeof this.trustHTML !== 'undefined' && this.trustHTML || EditableText.trustHTML) || (this.wysiwyg && !EditableText.wysiwyg)) && new Spacebars.SafeString(value) || value) : ((value || value === 0) ? value.toString() : "");
	return val; 
  }
  
});

EditableText.okCancelEvents = {};

EditableText.okCancelEvents.ok = function (value,evt,tmpl) {
  evt.stopImmediatePropagation();
  evt.stopPropagation();
  EditableText._makeUpdate.call(this,value);
  tmpl.selected.set(false);
}

EditableText.okCancelEvents.cancel = function (value, evt,tmpl) {
  // Check for removeEmpty update, in case a document has been auto inserted and user clicks escape
  // But set the flag isEscape so regular updates are not made
  var isEscape = true;
  EditableText._makeUpdate.call(this,value,isEscape);
  evt.stopImmediatePropagation();
  tmpl.selected.set(false);
}

Template.editable_text_widget.events(EditableText._okCancelEvents('.wide-text-edit', EditableText.okCancelEvents));
Template.editable_text_widget.events(EditableText._okCancelEvents('.text-area-edit', EditableText.okCancelEvents));
Template.editable_text_widget.events({
  'mousedown .editable-text, click .editable-text, dblclick .editable-text' : function(evt,tmpl) {
	evt.stopPropagation();
	evt.stopImmediatePropagation();
	// This is the click event that opens the field for editing
	var collection = this.collection;
	var execute = this.execute;
	var eventType = this.eventType || ((EditableText.wysiwyg && this.wysiwyg) ? 'mousedown' : 'click');
	if (eventType !== evt.type) {
	  return;	
	}
	var acceptEmpty = this.acceptEmpty;
	var textarea = this.textarea || (this.wysiwyg && !EditableText.wysiwyg);
	var wysiwyg = EditableText.wysiwyg && this.wysiwyg;
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
	  // Getting the element(s) in the DOM with the right class and firing click event on the first one
	  // Too bad if this wasn't the element we really wanted to be editing
	  // Note: we can't fire events on them all, as this could cause unwanted side effects (e.g. instance deletion after creation) if there are (even temporarily) duplicates in the DOM and removeEmpty=true
	  $('.et-' + object_id).eq(0).trigger((EditableText.wysiwyg && tmpl.data.wysiwyg) ? 'mousedown' : 'click');
	  return;
	}
	if (obj && !tmpl.selected.get()) {
	  if (EditableText.userCanEdit.call(this)) {
		// document.activeElement.blur(); // Make sure the focusout event fires first when switching editable text objects, so that the first one gets saved properly
		tmpl.selected.set(true);
		Tracker.flush();
		if (!wysiwyg) {
		  EditableText._activateInput(tmpl.$((textarea) ? 'textarea' :  'input'),textarea);
		}
	  }
	}
  }
});

Template.editable_text_widget.created = function() {
  this.selected = new ReactiveVar();
}