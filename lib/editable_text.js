EditableText = {};

// ******
// CONFIG
// ******

EditableText.config = function(config) {
  if (_.isObject(config)) {
	 _.each(config,function(val,key) {
	   if (_.contains(['userCanEdit','insert','update','remove'],key)) {
		 if (_.isFunction(val)) {
		   EditableText[key] = val;
		 }
		 else {
		   throw new Meteor.Error(key + ' must be a function');
		 }
	   }
	   if (_.contains(['useTransactions','saveOnFocusout','trustHTML','useMethods'],key)) {
		 if (_.isBoolean(val)) {
		   EditableText[key] = val;
		 }
		 else {
		   throw new Meteor.Error(key + ' must be a boolean');
		 }
	   }
	 });
  }
  else {
	throw new Meteor.Error('Editable text config object must be a hash of key value pairs. Config not changed.');  
  }
}

EditableText.saveOnFocusout = true;
EditableText.trustHTML = false;
EditableText.useMethods = true; // only set this to false if you really know what you're doing and have taken appropriate measures to thwart XSS attacks

EditableText.insert = function(Collection,doc) {
  var self = _.clone(this); // Don't want to update the original
  if (EditableText.useMethods && this.useMethod !== false || this.useMethod) {
	var objId = Random.id();
	self.context = _.clone(self.context); // need to clone this field again because this.context is an object and _.clone isn't recursive
	self.context._id = objId;
	Meteor.call('editableTextWrite','insert',self,null,EditableText._useTransaction(this),function(err,res) {
	  if (err) {
		console.log(err);
		return;  
	  }
	  // Just in case it didn't get into the DOM in time
	  /*Tracker.flush();
	  var elem = $('.et-' + objId);
	  if (elem.length) {
		elem.eq(0).trigger((EditableText.wysiwyg && self.wysiwyg) ? 'mousedown' : 'click');
	  }*/
	});
	// TODO -- this new object needs to get `selected` set in its template instance (and the corresponding element needs to gain focus) wherever it lands in the DOM
	// However, we have no easy way of getting its template instance, other than iterating over
	// all template instances, looking for the one where the context._id matches the object_id value
	// Unfortunately, I have no idea where the template instances are stored
	// So using a filthy hack instead ...
	// Getting the element(s) in the DOM with the right class and firing click event on the first one
	// Too bad if this wasn't the element we really wanted to be editing
	// Note: we can't fire events on them all, as this could cause unwanted side effects (e.g. instant deletion after creation) if there are (even temporarily) duplicates in the DOM and removeEmpty=true
	// This means that in cases when the newly inserted document field is available in multiple places on the screen, the wrong one might be selected for editing (i.e. one that wasn't where the user clicked)
	// This is probably rare enough that we'll ignore it until it becomes a serious problem, at which time we'll come up with another hack
	Tracker.flush(); // Put this here rather than in the callback for latency compensation
	var elem = $('.et-' + objId);
	if (elem.length) {
	  elem.eq(0).trigger((EditableText.wysiwyg && self.wysiwyg) ? 'mousedown' : 'click');
	}
	return;
  }
  if (EditableText._useTransaction(this)) {
	if (this.objectTypeText) {
	  tx.start('add ' + this.objectTypeText);  
	}
	EditableText._callback.call(self,'beforeInsert',self.context);
	var new_id = tx.insert(Collection,doc,{instant:true});
	EditableText._callback.call(self,'afterInsert',Collection.findOne({_id:new_id}));
	if (this.objectTypeText) {
	  tx.commit();  
	}
  }
  else {
	doc = EditableText._callback.call(self,'beforeInsert',self.context);
	var new_id = Collection.insert(doc);
	EditableText._callback.call(self,'afterInsert',Collection.findOne({_id:new_id}));
  }
  // see above
  Tracker.flush();
  $('.et-' + new_id).eq(0).trigger((EditableText.wysiwyg && this.wysiwyg) ? 'mousedown' : 'click');
  return new_id;
}

EditableText.update = function(Collection,doc,modifier,callbacks,transactionText) {
  var self = this;
  if (EditableText.useMethods && this.useMethod !== false || this.useMethod) {
	Meteor.call('editableTextWrite','update',this,modifier,EditableText._useTransaction(this),{callbacks:callbacks,transactionText:transactionText},function(err,res) {
	  if (err) {
		console.log(err);
	  }
	});
	return;
  }
  if (EditableText._useTransaction(this)) {
	if (this.objectTypeText) {
	  tx.start(transactionText || 'update ' + this.objectTypeText);  
	}
	EditableText._callback.call(self,callbacks[0] || 'beforeUpdate',doc);
	// Important to send the id only, not the whole document ("self"),
	// as this update is fired from all sorts of contexts, some of which are incomplete -- 
	// this will force the transaction script to find the relevant document with its full context from the database
	tx.update(Collection,doc._id,modifier,{instant:true});
	EditableText._callback.call(self,callbacks[1] || 'afterUpdate',Collection.findOne({_id:doc._id}));
	if (this.objectTypeText) {
	  tx.commit();  
	}
  }
  else {
	EditableText._callback.call(self,callbacks[0] || 'beforeUpdate',doc);
	Collection.update({_id:doc._id},modifier);
	EditableText._callback.call(self,callbacks[1] || 'afterUpdate',Collection.findOne({_id:doc._id}));
  }
}

EditableText.remove = function(Collection,doc) {
  var self = this;
  if (EditableText.useMethods && this.useMethod !== false || this.useMethod) {
	Meteor.call('editableTextWrite','remove',this,null,EditableText._useTransaction(this),function(err,res) {
	  if (err) {
		console.log(err);
	  }
	});
	return;
  }
  if (EditableText._useTransaction(this)) {
	if (this.objectTypeText) {
	  tx.start('remove ' + this.objectTypeText);  
	}
	EditableText._callback.call(self,'beforeRemove',doc);
	tx.remove(Collection,doc._id,{instant:true});
	EditableText._callback.call(self,'afterRemove',Collection.findOne({_id:doc._id}));
	if (this.objectTypeText) {
	  tx.commit();  
	}
  }
  else {
	EditableText._callback.call(self,'beforeRemove',doc);
	Collection.remove({_id:doc._id});
	EditableText._callback.call(self,'afterRemove',Collection.findOne({_id:doc._id}));
  }
}


// *********************************
// INTERNAL PROPERTIES AND FUNCTIONS
// *********************************

EditableText._useTransaction = function(data) {
  return !!(typeof tx !== 'undefined' && ((EditableText.useTransactions && data.useTransaction !== false) || data.useTransaction));	
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

EditableText._okCancelEvents = function (selector, callbacks, acceptEmpty) {
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
		evt.preventDefault();
		// blur/return/enter = ok/submit if non-empty
		if (value || this.removeEmpty || (this.acceptEmpty || acceptEmpty)) {
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

EditableText._makeUpdate = function(value,isEscape,evtType) {
  // value has already been trimmed with $.trim()
  var currentValue = this.value || EditableText._drillDown(this.context,this.field);
  var type = this.type || 'string';
  switch (type) {
	case 'number' :
	  var rawNewValue = EditableText._extractNumber(value);
	  var newValue = rawNewValue && parseInt(rawNewValue) || 0;
	  currentValue = currentValue && parseInt(currentValue) || 0;
	  break;
	default :
	  var newValue = value.replace(/mml:/g,"");
	  currentValue = _.isString(currentValue) && currentValue.replace(/<br \/>/g,"<br>") || '';
	  break;
  }
  var updatedValue = {};
  updatedValue[this.field] = newValue;
  // Sometimes we don't want the actual field's value, we want whatever was passed in to the template as the 'value' keyword to be used to compare against
  if (newValue !== currentValue || (!newValue && this.removeEmpty && evtType !== 'focusout')) {
	if (!newValue && this.removeEmpty && evtType !== 'focusout') {
	  EditableText.remove.call(this,Mongo.Collection.get(this.collection),this.context);
	}
	else if (!isEscape && (newValue !== currentValue) && (newValue || this.acceptEmpty)) {
	  // Make the update
	  EditableText.update.call(this,Mongo.Collection.get(this.collection),this.context,{$set: updatedValue});
	}
  }
}


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
	return this.value || EditableText._drillDown(this.context,this.field); 
  },
  
  editing : function() {
	return Blaze._templateInstance().selected.get(); 
  },
  
  textarea : function() {
	return (this.textarea && !this.wysiwyg) || (this.wysiwyg && !EditableText.wysiwyg);  
  },
  
  isWysiwyg : function() {
	return EditableText.wysiwyg && this.wysiwyg;
  },
  
  wysiwygContent : function() {
	var value = this.value || EditableText._drillDown(this.context,this.field);
	return value && new Spacebars.SafeString(value.replace(/\n/g,'<br>')) || "";  
  },
  
  inputValue : function() {
	var value = this.value || EditableText._drillDown(this.context,this.field);
	return value && value.toString().replace(/"/g,"&quot;") || "";
  },
  
  substitute : function() {
	return !(this.value || EditableText._drillDown(this.context,this.field)) && (this.substitute && Spacebars.SafeString(this.substitute.toString()));
  },
  
  title : function() {
	return this.title || ((this.eventType === 'dblclick') ? 'double click' : 'click') + ' to edit'; 
  },
  
  canEditText : function() {
	var userCanEdit = EditableText.userCanEdit.call(this,this.context,Mongo.Collection.get(this.collection));
	return ((typeof this.userCanEdit !== 'undefined') && this.userCanEdit && userCanEdit) || userCanEdit;
  },
  
  content : function() {
	var value = this.value || EditableText._drillDown(this.context,this.field);
	var val = (_.isString(value)) ? (((typeof this.trustHTML !== 'undefined' && this.trustHTML || EditableText.trustHTML) || (this.wysiwyg && !EditableText.wysiwyg)) && new Spacebars.SafeString(value.replace(/\n/g,'<br>')) || value) : ((value || value === 0) ? value.toString() : "");
	return val; 
  },
  
  trustHTML : function() {
	return typeof this.trustHTML !== 'undefined' && this.trustHTML || EditableText.trustHTML;
  },
  
  toolsPosition : function(pos) {
	return this.toolbarPosition === pos;
  }
  
});

EditableText.okCancelEvents = {};

EditableText.okCancelEvents.ok = function (value,evt,tmpl) {
  evt.stopImmediatePropagation();
  evt.stopPropagation();
  var isEscape = false;
  EditableText._makeUpdate.call(this,value,isEscape,evt.type);
  tmpl.selected.set(false);
}

EditableText.okCancelEvents.cancel = function (value, evt,tmpl) {
  evt.stopImmediatePropagation();
  // Check for removeEmpty update, in case a document has been auto inserted and user clicks escape
  // But set the flag isEscape so regular updates are not made
  var isEscape = true;
  EditableText._makeUpdate.call(this,value,isEscape);
  tmpl.selected.set(false);
}

Template.editable_text_widget.events(EditableText._okCancelEvents('.wide-text-edit', EditableText.okCancelEvents));
Template.editable_text_widget.events(EditableText._okCancelEvents('.text-area-edit', EditableText.okCancelEvents));
Template.editable_text_widget.events({
  'mousedown .editable-text, click .editable-text, dblclick .editable-text' : function(evt,tmpl) {
	evt.stopPropagation();
	evt.stopImmediatePropagation();
	// This is the click event that opens the field for editing
	var execute = this.execute;
	var eventType = this.eventType || ((EditableText.wysiwyg && this.wysiwyg) ? 'mousedown' : 'click');
	if (eventType !== evt.type) {
	  return;	
	}
	var textarea = (this.textarea && !this.wysiwyg) || (this.wysiwyg && !EditableText.wysiwyg);
	var wysiwyg = EditableText.wysiwyg && this.wysiwyg;
	var obj = this.context;
	var Collection = Mongo.Collection.get(this.collection);
	if (this.autoInsert && obj && !obj._id && _.isObject(obj) && EditableText.userCanEdit.call(this,obj,Collection)) { // This is quite involved -- you need an object with all context info, but no _id field for auto-creation to occur
	  if (typeof this.value !== 'undefined' && this.value !== obj[this.field]) {
		obj[this.field] = this.value;  
	  }
	  // Create an object
	  EditableText.insert.call(this,Collection,obj);
	  return;
	}
	if (obj && !tmpl.selected.get()) {
	  if (EditableText.userCanEdit.call(this,obj,Collection)) {
		// document.activeElement.blur(); // Make sure the focusout event fires first when switching editable text objects, so that the first one gets saved properly
		tmpl.selected.set(true);
		Tracker.flush();
		if (!wysiwyg) {
		  EditableText._activateInput(tmpl.$((textarea) ? 'textarea' :  'input'),false); // textarea
		}
	  }
	}
  }
});

Template.editable_text_widget.created = function() {
  this.selected = new ReactiveVar();
}