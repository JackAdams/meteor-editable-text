if (typeof EditableText === 'undefined') {
  EditableText = {};
}


// ******
// CONFIG
// ******

EditableText.userCanEdit = function(doc,Collection) {
  // e.g. return this.user_id = Meteor.userId();
  return true;	
}

EditableText.useTransactions = (typeof tx !== 'undefined' && _.isObject(tx.Transactions)) ? true : false;
EditableText.clientControlsTransactions = false;

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

EditableText._callback = function(callback,doc) {
  var self = this;
  if (self[callback] && _.isString(self[callback])) {
    var mutatedDoc = EditableText._executeCallback(self[callback],self,doc);
    doc = _.isObject(mutatedDoc) && mutatedDoc || doc;
  }
  return doc;
}

EditableText._executeCallback = function(callbackFunctionName,self,doc) {
  var mutatedDoc = doc;
  // var callbackFunction = EditableText._drillDown((Meteor.isServer) ? global : window,callbackFunctionName); // Removed because of security concerns
  var callbackFunction = EditableText._callbacks[callbackFunctionName]; // Changed to this so that client can't execute arbitrary functions from the global namespace on server
  if (callbackFunction && _.isFunction(callbackFunction)) {
	mutatedDoc = callbackFunction.call(self,doc,Mongo.Collection.get(self.collection)) || mutatedDoc;
  }
  else {
	throw new Meteor.Error('Could not execute callback. Reason: ' + ((callbackFunction) ? '"' + callbackFunctionName + '" is not a function, it\'s a ' + typeof(callbackFunction) + '.' : 'no callback function called "' + callbackFunctionName + '" has been registered via EditableText.registerCallbacks.'));	
  }
  return mutatedDoc;
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


// **************
// UPDATE METHODS
// **************

Meteor.methods({
  editableTextWrite : function(action,data,modifier,transaction,details) {
	check(action,String);
	check(data.collection,String);
	check(data.context,Object);
	check(modifier,(action === 'update') ? Object : null);
	check(transaction,Boolean);
	check(data.objectTypeText,Match.OneOf(String,undefined));
	check(details,Match.OneOf(Object,undefined));
	var Collection = Mongo.Collection.get(data.collection);
	if (Collection && EditableText.userCanEdit.call(data,data.context,Collection)) {
	  if (Meteor.isServer) {
  	    var allowed = EditableText.allowedHtml;
		if (_.isBoolean(EditableText.useTransactions) && !EditableText.clientControlsTransactions) {
		  transaction = EditableText.useTransactions;
		}
		if (typeof tx !== 'undefined') {
		  transaction = false;	
		}
	  }
	  switch (action) {
		case 'insert' :
		  if (Meteor.isServer) {
		    // run all string fields through sanitizeHtml
			data.context = EditableText.sanitizeObject(data.context);
		  }
		  if (transaction) {
			if (data.objectTypeText) {
			  tx.start('add ' + data.objectTypeText);
			}
			data.context = EditableText._callback.call(data,'beforeInsert',data.context) || data.context;
			var new_id = tx.insert(Collection,data.context,{instant:true});
			EditableText._callback.call(data,'afterInsert',Collection.findOne({_id:new_id}));
			if (data.objectTypeText) {
			  tx.commit();
			}
		  }
		  else {
			data.context = EditableText._callback.call(data,'beforeInsert',data.context) || data.context;
			var new_id = Collection.insert(data.context);
			EditableText._callback.call(data,'afterInsert',Collection.findOne({_id:new_id}));
		  }
		  return new_id;
		  break;
		case 'update' :
		  if (Meteor.isServer) {
			var sanitized = false;
			if (modifier["$set"] && _.isString(modifier["$set"][data.field])) {
		    // run through sanitizeHtml
		      modifier["$set"][data.field] = sanitizeHtml(modifier["$set"][data.field],allowed);
			  sanitized = true;
			}
			if (modifier["$set"] && _.isArray(modifier["$set"][data.field])) {
			  modifier["$set"][data.field] = _.map(modifier["$set"][data.field],function(str) {return sanitizeHtml(str);});
			  sanitized = true;
			}
			if (modifier["$set"] && _.isNumber(modifier["$set"][data.field])) {
			  sanitized = true;	
			}
			if (modifier["$addToSet"] && _.isString(modifier["$addToSet"][data.field])) {
			  modifier["$addToSet"][data.field] = sanitizeHtml(modifier["$addToSet"][data.field]);
			  sanitized = true;	
			}
			if (modifier["$push"] && _.isString(modifier["$push"][data.field])) {
			  modifier["$push"][data.field] = sanitizeHtml(modifier["$push"][data.field]);
			  sanitized = true;	
			}
			if (!sanitized) {
			  throw new Meteor.Error('Wrong data type sent for update');	
			}
		  }
		  if (transaction) {
			if (data.objectTypeText) {
			  tx.start(details && details.transactionText || 'update ' + data.objectTypeText);
			}
			data.context = EditableText._callback.call(data,details && details.callbacks && details.callbacks[0] || 'beforeUpdate',data.context) || data.context;
			tx.update(Collection,data.context._id,modifier,{instant:true});
			EditableText._callback.call(data,details && details.callbacks && details.callbacks[1] || 'afterUpdate',data.context);
			if (data.objectTypeText) {
			  tx.commit();
			}
		  }
		  else {
			data.context = EditableText._callback.call(data,details && details.callbacks && details.callbacks[0] || 'beforeUpdate',data.context) || data.context;
			Collection.update({_id:data.context._id},modifier);
			EditableText._callback.call(data,details && details.callbacks && details.callbacks[1] || 'afterUpdate',data.context);
		  }
		  break;
		case 'remove' :
		  if (transaction) {
			if (data.objectTypeText) {
			  tx.start('remove ' + data.objectTypeText);
			}
			data.context = EditableText._callback.call(data,'beforeRemove',data.context) || data.context;
			tx.remove(Collection,data.context._id,{instant:true});
			EditableText._callback.call(data,'afterRemove',data.context);
			if (data.objectTypeText) {
			  tx.commit();
			} 
		  }
		  else {
			data.context = EditableText._callback.call(data,'beforeRemove',data.context) || data.context;
			Collection.remove({_id:data.context._id});
			EditableText._callback.call(data,'afterRemove',data.context);
		  }
		  break;  
	  }
	}
  }
});