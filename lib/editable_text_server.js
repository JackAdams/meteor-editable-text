if (typeof EditableText === 'undefined') {
  EditableText = {};
}

EditableText.sanitizeString = function(string) {
  var sanitizedString = sanitizeHtml(string,EditableText._allowedHtml());
  /*if (string !== sanitizedString) {
	console.log("Sanitized: ", string);
	console.log("To: ", sanitizedString);  
  }*/
  return sanitizedString;
}

EditableText.sanitizeObject = function(obj,allow) {
  _.each(obj,function(val,key) {
	if (_.isString(obj[key])) {
	  var original = obj[key];
	  obj[key] = EditableText.sanitizeString(obj[key]);
	  if (original !== obj[key]) {
		console.log("Sanitized: ", original);
		console.log("To: ",obj[key]);  
	  }
	}
	// If it's another object, need to recurse into that object and clean up strings
	if (_.isObject(obj[key])) {
	  obj[key] = EditableText.sanitizeObject(obj[key]);
	}
  });
  return obj;
}

EditableText.config({collection2Options:{filter: true, validate: true});
