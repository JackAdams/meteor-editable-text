if (typeof EditableText === 'undefined') {
  EditableText = {};
}

EditableText.userCanEdit = function() {
  return (typeof this.userCanEdit !== 'undefined') ? this.userCanEdit : true;	
}

if (Meteor.isServer) {
  EditableText.allowedHtml = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['sub','sup','font']),
    allowedAttributes: _.extend(sanitizeHtml.defaults.allowedAttributes,{font:['size','face'],div:['align'],td:['style']})
  };
}

// **************
// UPDATE METHODS
// **************

Meteor.methods({
  editableTextWrite : function(action,data,modifier,transaction) {
	check(action,String);
	check(data.collection,String);
	check(data.context,Object);
	check(modifier,(action === 'update') ? Object : null);
	check(transaction,Boolean);
	check(data.objectTypeText,Match.OneOf(String,undefined));
	var Collection = Mongo.Collection.get(data.collection);
	if (EditableText.userCanEdit.call(data,Collection)) {
	  if (Meteor.isServer) {
  	    var allowed = EditableText.allowedHtml;
	  }
	  switch (action) {
		case 'insert' :
		  if (Meteor.isServer) {
		    // run all string fields through sanitizeHtml
			_.each(data.context,function(val,key) {
			  if (_.isString(data.context[key])) {
		        data.context[key] = sanitizeHtml(data.context[key] || '',allowed);
			  }
			});
		  }
		  if (transaction) {
			if (data.objectTypeText) {
			  tx.start('add ' + data.objectTypeText);  
			}
			var new_id = tx.insert(Collection,data.context,{instant:true}); 
			if (data.objectTypeText) {
			  tx.commit();  
			} 
		  }
		  else {
			var new_id = Collection.insert(data.context);
		  }
		  return new_id;
		  break;
		case 'update' :
		  if (Meteor.isServer && _.isString(modifier["$set"][data.field])) {
		    // run through sanitizeHtml
		    modifier["$set"][data.field] = sanitizeHtml(modifier["$set"][data.field],allowed);
		  }
		  if (transaction) {
			if (data.objectTypeText) {
			  tx.start('update ' + data.objectTypeText);  
			}
			tx.update(Collection,data.context._id,modifier,{instant:true});
			if (data.objectTypeText) {
			  tx.commit();  
			}
		  }
		  else {
			Collection.update({_id:data.context._id},modifier);
		  }
		  break;
		case 'remove' :
		  if (transaction) {
			if (data.objectTypeText) {
			  tx.start('remove ' + data.objectTypeText);  
			}
			tx.remove(Collection,data.context._id,{instant:true});
			if (data.objectTypeText) {
			  tx.commit();  
			} 
		  }
		  else {
			Collection.remove({_id:data.context._id});
		  }
		  break;  
	  }
	}
  }
});