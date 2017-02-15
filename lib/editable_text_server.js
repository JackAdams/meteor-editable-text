if (typeof EditableText === 'undefined') {
  EditableText = {};
}

// Only used in the _editableTextWrite method detects the presence of aldeed:collection2
EditableText.collection2Options = {filter: true, validate: true};

EditableText.sanitizeString = function (string, html) {
  if (!string) {
    string = ''; // Deal with null or undefined  
  }
  var sanitizedString = (html) ? sanitizeHtml(EditableText._autoLink(string), EditableText._allowedHtml()) : EditableText.stripTags(string);
  /*if (string !== sanitizedString) {
    console.log("Sanitized: ", string);
    console.log("To: ", sanitizedString);  
  }*/
  return sanitizedString;
}

EditableText.sanitizeObject = function (obj) {
  _.each(obj, function (val, key) {
    if (_.isString(obj[key])) {
      var original = obj[key];
      // FIrst check if stripTags has an effect
      // If so, assume it's html and put the string through the html sanitizer
      // TODO - check with people who know more about XSS whether this leaves a security hole
      if (obj[key] !== EditableText.stripTags(obj[key])) {
        var html = true;
        obj[key] = EditableText.sanitizeString(obj[key], html);
        if (original !== obj[key]) {
          console.log("Sanitized: ", original);
          console.log("To: ", obj[key]);  
        }
      }
    }
    // If it's another object, need to recurse into that object and clean up strings
    if (_.isObject(obj[key])) {
      obj[key] = EditableText.sanitizeObject(obj[key]);
    }
  });
  return obj;
}

EditableText.stripTags = function (input) { // stolen from phpjs.org
  // var allowed = '';
  /*allowed = (((allowed || '') + '')
    .toLowerCase()
    .match(/<[a-z][a-z0-9]*>/g) || [])
    .join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)*/
  var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
    comments = /<!--[\s\S]*?-->/gi;
  return input.replace(comments, '')
    .replace(tags, '' /*function($0, $1) {
      return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
    }*/);
}