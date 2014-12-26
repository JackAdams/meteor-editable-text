Template.wysiwyg.events({
  /*'click #tableBtn' : function() {
	document.execCommand('insertHTML', false, '<table><tr><td></td><td></td></tr><tr><td></td><td></td></tr></table>')  
  }*/
  'mousedown .wysiwyg-tools-button' : function(evt) {
	evt.preventDefault();
	var elem = $(evt.currentTarget).closest('.wysiwyg-toolbar').find('.wysiwyg-tools');
	elem.toggle('blind');
	if ($(evt.currentTarget).attr('title') === 'Show tools') {
	  $(evt.currentTarget).attr('title','Hide tools').find('i').removeClass('fa-caret-right').addClass('fa-caret-down');
	}
	else {
	  $(evt.currentTarget).attr('title','Show tools').find('i').removeClass('fa-caret-down').addClass('fa-caret-right');
	}
  },
  'click .wysiwyg-toolbar .span2' : function(evt) {
	evt.stopPropagation();
  }
});

$.fn.focusEnd = function() {
    $(this).focus();
    var tmp = $('<span />').appendTo($(this)),
        node = tmp.get(0),
        range = null,
        sel = null;

    if (document.selection) {
        range = document.body.createTextRange();
        range.moveToElementText(node);
        range.select();
    } else if (window.getSelection) {
        range = document.createRange();
        range.selectNode(node);
        sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
    tmp.remove();
    return this;
}

EditableText.allowedHTMLElements = {p: [], br: [], a: ['href'], table: [], thead: [], tbody: [], tr: [], td: ['rowspan','colspan','style'], li: [], ol: []};

EditableText.cleanHTML = function(element, allow) {
  
  // fromList is a utility function used by EditableText.cleanHTML. This is really just `Array.prototype.slice()`
  // except that the ECMAScript standard doesn't guarantee we're allowed to call that on
  // a host object like a DOM NodeList, boo.
  var fromList = function(list) {
	  var array= new Array(list.length);
	  for (var i= 0, n= list.length; i<n; i++)
		  array[i]= list[i];
	  return array;
  };
  
  // Recurse into child elements
  fromList(element.childNodes).forEach(function(child) {
	  if (child.nodeType===1) {
		EditableText.cleanHTML(child, allow);
		var tag= child.tagName.toLowerCase();
		if (tag in allow) {
		  // Remove unwanted attributes
		  //
		  fromList(child.attributes).forEach(function(attr) {
			  if (allow[tag].indexOf(attr.name.toLowerCase())===-1) {
				 child.removeAttributeNode(attr);
			  }
		  });
		}
		else {
		  // Replace unwanted elements with their contents
		  //
		  while (child.firstChild)
			  element.insertBefore(child.firstChild, child);
		  element.removeChild(child);
		}
	  }
	  else if (child.nodeType===3) {
		child.textContent = child.textContent.replace(/<!--[\s\S]*?-->/g," ");
	  }
  });
}