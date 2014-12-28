if (typeof EditableText === 'undefined') {
  EditableText = {};
}

EditableText.allowedHtml = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['sup','font']),
  allowedAttributes: _.extend(sanitizeHtml.defaults.allowedAttributes,{font:['size','face'],div:['align'],td:['style']})
};

EditableText.sanitizeObject = function(obj) {
  _.each(obj,function(val,key) {
	if (_.isString(obj[key])) {
	  obj[key] = sanitizeHtml(obj[key],EditableText.allowedHtml);
	}
	// If it's another object, need to recurse into that object and clean up strings
	if (_.isObject(obj[key])) {
	  obj[key] = EditableText.sanitizeObject(obj[key]);
	}
  });
  return obj;
}