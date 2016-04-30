if (typeof EditableText === 'undefined') {
  EditableText = {};
}


// ******************************************
// CONFIG that affects BOTH CLIENT AND SERVER
// ******************************************

EditableText.userCanEdit = function(doc,Collection) {
  // e.g. return doc.user_id = Meteor.userId();
  return true;    
}

EditableText.useTransactions = (typeof tx !== 'undefined' && _.isObject(tx.Transactions)) ? true : false;
EditableText.clientControlsTransactions = false;

EditableText.maximumImageSize = 0; // Can't put image data in the editor by default

// This is the set of defaults for sanitizeHtml on the server (as set by the library itself)
// Required on the client for consistency of filtering on the paste event
if (Meteor.isClient) {
  sanitizeHtml = {};
  sanitizeHtml.defaults = {
    allowedTags: [ 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol', 'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div', 'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre' ],
    allowedAttributes: { a: [ 'href', 'name', 'target' ] },
    selfClosing: [ 'img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta' ],
    allowedSchemes: [ 'http', 'https', 'ftp', 'mailto' ]  
  };    
}

Meteor.startup(function () {
  // The startup block is to allow apps to overwrite the sanitizeHtml defaults
  EditableText.allowedHtml = {
	allowedTags: sanitizeHtml.defaults.allowedTags.concat(['sub', 'sup', 'font', 'u', 'span']),
	allowedAttributes: _.extend(sanitizeHtml.defaults.allowedAttributes, {
	  font : ['size', 'face'],
	  div : ['align', 'style'],
	  span: ['style'],
	  table: ['style'],
	  td : ['rowspan', 'colspan', 'style'],
	  a: ['href', 'target', 'class'],
	  i: ['class']
	}),
	allowedSchemes:['http', 'https', 'ftp', 'mailto']
  }
});;


// ******************************************
// Functions that are intended for use in app
// ******************************************

// Function for setting multiple config variable via a hash

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
       if (_.contains(['useTransactions','clientControlsTransactions','saveOnFocusout','trustHtml','useMethods'],key)) {
         if (_.isBoolean(val)) {
           EditableText[key] = val;
         }
         else {
           throw new Meteor.Error(key + ' must be a boolean');
         }
       }
       if (_.contains(['collection2Options'], key)) {
         if (_.isObject(val)) {
            EditableText[key] = val;
         }
       }
     });
  }
  else {
    throw new Meteor.Error('Editable text config object must be a hash of key value pairs. Config not changed.');  
  }
}

// Function for registering callbacks

EditableText.registerCallbacks = function(obj) {
  if (_.isObject(obj)) {
    _.each(obj,function(val,key) {
      if (_.isFunction(val)) {
        EditableText._callbacks[key] = val;
      }
      else {
        throw new Meteor.Error('Callbacks need to be functions. You passed a ' + typeof(val) + '.');    
      }
    });
  }
  else {
    throw new Meteor.Error('You must pass an object to register callbacks');  
  }
}


// *********************************
// INTERNAL PROPERTIES AND FUNCTIONS
// *********************************

EditableText._callbacks = {};

EditableText._mutatedDocIsObject = function (mutatedDoc) {
  return _.isObject(mutatedDoc) && !_.isArray(mutatedDoc) && !_.isDate(mutatedDoc) && !_.isFunction(mutatedDoc); // Just want real key-value pair type objects
}

EditableText._callback = function(callback, doc, originalValue) {
  // Note: 'beforeUpdate' and 'beforeInsertMultiple' callbacks are special-cased to use return values of any type, not just objects
  // originalValue is only set on beforeUpdate and beforeInsertMultiple callbacks. It is of the form { value: <actual original value> }
  // otherwise originalValue should be undefined
  callback = String(callback);
  var self = this;
  var callbackRan = false;
  if (self[callback] && _.isString(self[callback])) {
    var mutatedDoc = EditableText._executeCallback(self[callback], self, doc, originalValue);
	callbackRan = true;
	var mutatedDocIsObject = EditableText._mutatedDocIsObject(mutatedDoc);
	if (!originalValue && !mutatedDocIsObject) {
	  throw new Meteor.Error('Wrong type returned', 'Your callback function "' + callback + '" returned a ' + typeof mutatedDoc + '. An object was expected.');	
	}
    doc = (originalValue) ? mutatedDoc : mutatedDocIsObject && mutatedDoc || doc;
  }
  if (originalValue) {
	// if the callback hasn't run, then the
	// doc is still the whole document,
	// not the new value for the field
	if (!callbackRan) {
	  doc = originalValue.value;	
	}
	if (callbackRan && mutatedDocIsObject && (_.has(doc, '$set') || _.has(doc, '$addToSet') || _.has(doc, '$push'))) {
	  return {modifier: doc};
	}
	else {
	  return {value: doc};  
	}
  }
  return doc;
}

EditableText._executeCallback = function(callbackFunctionName, self, doc, originalValue) { // originalValue.value is the default to return if no updates have been made
  var mutatedDoc = (originalValue && {value: originalValue.value}) || doc;
  var callbackFunction = EditableText._callbacks[callbackFunctionName];
  if (callbackFunction && _.isFunction(callbackFunction)) {
    callbackMutatedDoc = callbackFunction.call(self, doc, Mongo.Collection.get(self.collection), originalValue && originalValue.value || undefined, originalValue && originalValue.modifier || undefined);
	if (!_.isUndefined(callbackMutatedDoc)) {
	  mutatedDoc = callbackMutatedDoc;
	}
  }
  else {
    throw new Meteor.Error('Callback not a function', 'Could not execute callback. Reason: ' + ((callbackFunction) ? '"' + callbackFunctionName + '" is not a function, it\'s a ' + typeof(callbackFunction) + '.' : 'no callback function called "' + callbackFunctionName + '" has been registered via EditableText.registerCallbacks.'));    
  }
  return mutatedDoc;
}

EditableText._drillDown = function(obj,key) {
  return Meteor._get.apply(null,[obj].concat(key.split('.')));
}

EditableText._allowedHtml = function() {
  var allowed = EditableText.allowedHtml;
  if (EditableText.maximumImageSize && _.isNumber(EditableText.maximumImageSize) && allowed) {
    allowed.allowedTags.push('img');
    allowed.allowedAttributes.img = ['src'];
    allowed.allowedSchemes.push('data'); 
  }
  return allowed;
}


// *************
// UPDATE METHOD
// *************

Meteor.methods({
  _editableTextWrite : function(action, data, modifier, transaction) {
    check(action, String);
    check(data, Object);
    check(data.collection, String);
    check(data.context, (typeof FS !== "undefined" && FS.File) ? Match.OneOf(Object, FS.File) : Object);
    check(modifier, (action === 'update') ? Object : null);
    check(transaction, Boolean);
    check(data.objectTypeText, Match.OneOf(String, undefined));
    var hasPackageCollection2 = !!Package['aldeed:collection2'];
    var hasPackageSimpleSchema = !!Package['aldeed:simple-schema'];
    var Collection = Mongo.Collection.get(data.collection);
    var c2optionsHashRequired = hasPackageCollection2 && hasPackageSimpleSchema && _.isFunction(Collection.simpleSchema) && Collection._c2;
    if (Collection && EditableText.userCanEdit.call(data, data.context, Collection)) {
	  if (Meteor.isServer) {
        if (_.isBoolean(EditableText.useTransactions) && !EditableText.clientControlsTransactions) {
          transaction = EditableText.useTransactions;
        }
      }
      if (typeof tx === 'undefined') {
        transaction = false;    
      }
      var setStatus = function (err, res) {
        data.status = {error: err, result: res};    
      }
	  var options = (transaction) ? {instant: true} : {};
      if (c2optionsHashRequired) {
        options = _.extend(options, EditableText.collection2options || {});    
      }
      switch (action) {
        case 'insert' :
          if (Meteor.isServer) {
            // run all string fields through sanitizeHtml
            data.context = EditableText.sanitizeObject(data.context);
          }
          if (transaction) {
            if (data.objectTypeText || data.transactionInsertText) {
              tx.start(data.transactionInsertText || 'add ' + data.objectTypeText);
            }
            data.context = EditableText._callback.call(data, 'beforeInsert', data.context) || data.context;
            var new_id = tx.insert(Collection, data.context, options, setStatus);
            EditableText._callback.call(data, 'afterInsert', Collection.findOne({_id: new_id}));
            if (data.objectTypeText || data.transactionInsertText) {
              tx.commit();
            }
          }
          else {
            data.context = EditableText._callback.call(data,'beforeInsert',data.context) || data.context;
            var new_id = (c2optionsHashRequired) ? Collection.insert(data.context,options,setStatus) : Collection.insert(data.context, setStatus);
            EditableText._callback.call(data, 'afterInsert', Collection.findOne({_id: new_id}));
          }
          return new_id;
          break;
        case 'update' :
          if (Meteor.isServer) {
            var newValue, sanitized = false;
            if (modifier["$set"] && _.isString(modifier["$set"][data.field])) {
            // run through sanitizeHtml
              newValue = modifier["$set"][data.field] = EditableText.sanitizeString(modifier["$set"][data.field], data.wysiwyg || !!data.editor);
              sanitized = true;
            }
            if (modifier["$set"] && _.isArray(modifier["$set"][data.field])) {
              newValue = modifier["$set"][data.field] = _.map(modifier["$set"][data.field],function (str) {return EditableText.sanitizeString(str, data.wysiwyg || !!data.editor);});
              sanitized = true;
            }
            if (modifier["$set"] && _.isNumber(modifier["$set"][data.field])) {
              newValue = modifier["$set"][data.field];
              sanitized = true;    
            }
            if (modifier["$addToSet"] && _.isString(modifier["$addToSet"][data.field])) {
              newValue = modifier["$addToSet"][data.field] = EditableText.sanitizeString(modifier["$addToSet"][data.field], data.wysiwyg || !!data.editor);
              sanitized = true;    
            }
            if (modifier["$push"] && _.isString(modifier["$push"][data.field])) {
              newValue = modifier["$push"][data.field] = EditableText.sanitizeString(modifier["$push"][data.field], data.wysiwyg || !!data.editor);
              sanitized = true;    
            }
            if (!sanitized) {
              throw new Meteor.Error('Wrong data type sent for update');
			  return; 
            }
          }
          else {
            newValue = (modifier["$set"] && modifier["$set"][data.field]) || (modifier["$addToSet"] && modifier["$addToSet"][data.field]) || (modifier["$push"] && modifier["$push"][data.field]);
          }
          data.newValue = newValue;
          data.oldValue = EditableText._drillDown(data.context, data.field);
		  var callbackModifier = function (modifier, key, val) {
			/*if (val === undefined) {
			  return modifier;
			}*/
			var modifierTypes = ["$set", "$addToSet", "$push"];
			var modType = _.find(modifierTypes, function (mt) {
			  return _.has(modifier, mt);
			});
			if (modType) {
			  modifier[modType][key] = val;
			}
			return modifier;
		  }
          if (transaction) {
            if (data.transactionUpdateText || data.objectTypeText) {
              tx.start(data.transactionUpdateText || 'update ' + data.objectTypeText);
            }
            var newVal = EditableText._callback.call(data,'beforeUpdate',data.context, {value: data.newValue, modifier: modifier}); // By setting the fourth parameter, we are expecting a value, not the whole doc, to be returned from the callback
			modifier = callbackModifier(newVal.modifier || modifier, data.field, newVal.value);
            tx.update(Collection,data.context._id, modifier, options, setStatus);
            EditableText._callback.call(data, 'afterUpdate', Collection.findOne({_id: data.context._id}));
            if (data.transactionUpdateText || data.objectTypeText) {
              tx.commit();
            }
          }
          else {
            var newVal = EditableText._callback.call(data, 'beforeUpdate', data.context, {value: data.newValue, modifier: modifier});
			modifier = callbackModifier(newVal.modifier || modifier, data.field, newVal.value);
            if (c2optionsHashRequired) {
              Collection.update({_id: data.context._id}, modifier, options, setStatus);
            }
            else {
              Collection.update({_id: data.context._id}, modifier, setStatus);
            }
            EditableText._callback.call(data, 'afterUpdate', Collection.findOne({_id: data.context._id}));
          }
          break;
        case 'remove' :
          if (transaction) {
            if (data.transactionRemoveText || data.objectTypeText) {
              tx.start(data.transactionRemoveText || 'remove ' + data.objectTypeText);
            }
            data.context = EditableText._callback.call(data, 'beforeRemove', data.context) || data.context;
            tx.remove(Collection, data.context._id, {instant: true}, setStatus);
            EditableText._callback.call(data, 'afterRemove', data.context);
            if (data.transactionRemoveText || data.objectTypeText) {
              tx.commit();
            } 
          }
          else {
            data.context = EditableText._callback.call(data, 'beforeRemove', data.context) || data.context;
            Collection.remove({_id: data.context._id}, setStatus);
            EditableText._callback.call(data, 'afterRemove', data.context);
          }
          break;  
      }
    }
  }
});