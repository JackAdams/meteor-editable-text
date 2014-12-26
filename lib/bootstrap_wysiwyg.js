///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/bootstrap-wysiwyg/lib/jquery.hotkeys.js                                                                  //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
/*                                                                                                                   // 1
 * jQuery Hotkeys Plugin                                                                                             // 2
 * Copyright 2010, John Resig                                                                                        // 3
 * Dual licensed under the MIT or GPL Version 2 licenses.                                                            // 4
 *                                                                                                                   // 5
 * Based upon the plugin by Tzury Bar Yochay:                                                                        // 6
 * http://github.com/tzuryby/hotkeys                                                                                 // 7
 *                                                                                                                   // 8
 * Original idea by:                                                                                                 // 9
 * Binny V A, http://www.openjs.com/scripts/events/keyboard_shortcuts/                                               // 10
*/                                                                                                                   // 11
                                                                                                                     // 12
(function(jQuery){                                                                                                   // 13
	                                                                                                                    // 14
	jQuery.hotkeys = {                                                                                                  // 15
		version: "0.8",                                                                                                    // 16
                                                                                                                     // 17
		specialKeys: {                                                                                                     // 18
			8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",                          // 19
			20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",                      // 20
			37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del",                                           // 21
			96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",                                       // 22
			104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/",                                            // 23
			112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8",                           // 24
			120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 191: "/", 224: "meta"               // 25
		},                                                                                                                 // 26
	                                                                                                                    // 27
		shiftNums: {                                                                                                       // 28
			"`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",                                   // 29
			"8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<",                                 // 30
			".": ">",  "/": "?",  "\\": "|"                                                                                   // 31
		}                                                                                                                  // 32
	};                                                                                                                  // 33
                                                                                                                     // 34
	function keyHandler( handleObj ) {                                                                                  // 35
		// Only care when a possible input has been specified                                                              // 36
		if ( typeof handleObj.data !== "string" ) {                                                                        // 37
			return;                                                                                                           // 38
		}                                                                                                                  // 39
		                                                                                                                   // 40
		var origHandler = handleObj.handler,                                                                               // 41
			keys = handleObj.data.toLowerCase().split(" "),                                                                   // 42
			textAcceptingInputTypes = ["text", "password", "number", "email", "url", "range", "date", "month", "week", "time", "datetime", "datetime-local", "search", "color"];
	                                                                                                                    // 44
		handleObj.handler = function( event ) {                                                                            // 45
			// Don't fire in text-accepting inputs that we didn't directly bind to                                            // 46
			if ( this !== event.target && (/textarea|select/i.test( event.target.nodeName ) ||                                // 47
				jQuery.inArray(event.target.type, textAcceptingInputTypes) > -1 ) ) {                                            // 48
				return;                                                                                                          // 49
			}                                                                                                                 // 50
			                                                                                                                  // 51
			// Keypress represents characters, not special keys                                                               // 52
			var special = event.type !== "keypress" && jQuery.hotkeys.specialKeys[ event.which ],                             // 53
				character = String.fromCharCode( event.which ).toLowerCase(),                                                    // 54
				key, modif = "", possible = {};                                                                                  // 55
                                                                                                                     // 56
			// check combinations (alt|ctrl|shift+anything)                                                                   // 57
			if ( event.altKey && special !== "alt" ) {                                                                        // 58
				modif += "alt+";                                                                                                 // 59
			}                                                                                                                 // 60
                                                                                                                     // 61
			if ( event.ctrlKey && special !== "ctrl" ) {                                                                      // 62
				modif += "ctrl+";                                                                                                // 63
			}                                                                                                                 // 64
			                                                                                                                  // 65
			// TODO: Need to make sure this works consistently across platforms                                               // 66
			if ( event.metaKey && !event.ctrlKey && special !== "meta" ) {                                                    // 67
				modif += "meta+";                                                                                                // 68
			}                                                                                                                 // 69
                                                                                                                     // 70
			if ( event.shiftKey && special !== "shift" ) {                                                                    // 71
				modif += "shift+";                                                                                               // 72
			}                                                                                                                 // 73
                                                                                                                     // 74
			if ( special ) {                                                                                                  // 75
				possible[ modif + special ] = true;                                                                              // 76
                                                                                                                     // 77
			} else {                                                                                                          // 78
				possible[ modif + character ] = true;                                                                            // 79
				possible[ modif + jQuery.hotkeys.shiftNums[ character ] ] = true;                                                // 80
                                                                                                                     // 81
				// "$" can be triggered as "Shift+4" or "Shift+$" or just "$"                                                    // 82
				if ( modif === "shift+" ) {                                                                                      // 83
					possible[ jQuery.hotkeys.shiftNums[ character ] ] = true;                                                       // 84
				}                                                                                                                // 85
			}                                                                                                                 // 86
                                                                                                                     // 87
			for ( var i = 0, l = keys.length; i < l; i++ ) {                                                                  // 88
				if ( possible[ keys[i] ] ) {                                                                                     // 89
					return origHandler.apply( this, arguments );                                                                    // 90
				}                                                                                                                // 91
			}                                                                                                                 // 92
		};                                                                                                                 // 93
	}                                                                                                                   // 94
                                                                                                                     // 95
	jQuery.each([ "keydown", "keyup", "keypress" ], function() {                                                        // 96
		jQuery.event.special[ this ] = { add: keyHandler };                                                                // 97
	});                                                                                                                 // 98
                                                                                                                     // 99
})( jQuery );                                                                                                        // 100
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////







///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/bootstrap-wysiwyg/lib/bootstrap-wysiwyg.js                                                               //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
/* http://github.com/mindmup/bootstrap-wysiwyg */                                                                    // 1
/*global jQuery, $, FileReader*/                                                                                     // 2
/*jslint browser:true*/                                                                                              // 3
(function ($) {                                                                                                      // 4
	'use strict';                                                                                                       // 5
	var readFileIntoDataUrl = function (fileInfo) {                                                                     // 6
		var loader = $.Deferred(),                                                                                         // 7
			fReader = new FileReader();                                                                                       // 8
		fReader.onload = function (e) {                                                                                    // 9
			loader.resolve(e.target.result);                                                                                  // 10
		};                                                                                                                 // 11
		fReader.onerror = loader.reject;                                                                                   // 12
		fReader.onprogress = loader.notify;                                                                                // 13
		fReader.readAsDataURL(fileInfo);                                                                                   // 14
		return loader.promise();                                                                                           // 15
	};                                                                                                                  // 16
	$.fn.cleanHtml = function () {                                                                                      // 17
		var html = $(this).html();                                                                                         // 18
		return html && html.replace(/(<br>|\s|<div><br><\/div>|&nbsp;)*$/, '');                                            // 19
	};                                                                                                                  // 20
	$.fn.wysiwyg = function (userOptions) {                                                                             // 21
		var editor = this,                                                                                                 // 22
			selectedRange,                                                                                                    // 23
			options,                                                                                                          // 24
			updateToolbar = function () {                                                                                     // 25
				if (options.activeToolbarClass) {                                                                                // 26
					$(options.toolbarSelector).find('.btn[data-' + options.commandRole + ']').each(function () {                    // 27
						var command = $(this).data(options.commandRole);                                                               // 28
						if (document.queryCommandEnabled(command) && document.queryCommandState(command)) {                                                                     // 29
							$(this).addClass(options.activeToolbarClass);                                                                 // 30
						} else {                                                                                                       // 31
							$(this).removeClass(options.activeToolbarClass);                                                              // 32
						}                                                                                                              // 33
					});                                                                                                             // 34
				}                                                                                                                // 35
			},                                                                                                                // 36
			execCommand = function (commandWithArgs, valueArg) {                                                              // 37
				var commandArr = commandWithArgs.split(' '),                                                                     // 38
					command = commandArr.shift(),                                                                                   // 39
					args = commandArr.join(' ') + (valueArg || '');                                                                 // 40
				document.execCommand(command, 0, args);                                                                          // 41
				updateToolbar();                                                                                                 // 42
			},                                                                                                                // 43
			bindHotkeys = function (hotKeys) {                                                                                // 44
				$.each(hotKeys, function (hotkey, command) {                                                                     // 45
					editor.keydown(hotkey, function (e) {                                                                           // 46
						if (editor.attr('contenteditable') && editor.is(':visible')) {                                                 // 47
							e.preventDefault();                                                                                           // 48
							e.stopPropagation();                                                                                          // 49
							execCommand(command);                                                                                         // 50
						}                                                                                                              // 51
					}).keyup(hotkey, function (e) {                                                                                 // 52
						if (editor.attr('contenteditable') && editor.is(':visible')) {                                                 // 53
							e.preventDefault();                                                                                           // 54
							e.stopPropagation();                                                                                          // 55
						}                                                                                                              // 56
					});                                                                                                             // 57
				});                                                                                                              // 58
			},                                                                                                                // 59
			getCurrentRange = function () {                                                                                   // 60
				var sel = window.getSelection();                                                                                 // 61
				if (sel.getRangeAt && sel.rangeCount) {                                                                          // 62
					return sel.getRangeAt(0);                                                                                       // 63
				}                                                                                                                // 64
			},                                                                                                                // 65
			saveSelection = function () {                                                                                     // 66
				selectedRange = getCurrentRange();                                                                               // 67
			},                                                                                                                // 68
			restoreSelection = function () {                                                                                  // 69
				var selection = window.getSelection();                                                                           // 70
				if (selectedRange) {                                                                                             // 71
					try {                                                                                                           // 72
						selection.removeAllRanges();                                                                                   // 73
					} catch (ex) {                                                                                                  // 74
						document.body.createTextRange().select();                                                                      // 75
						document.selection.empty();                                                                                    // 76
					}                                                                                                               // 77
                                                                                                                     // 78
					selection.addRange(selectedRange);                                                                              // 79
				}                                                                                                                // 80
			},                                                                                                                // 81
			insertFiles = function (files) {                                                                                  // 82
				editor.focus();                                                                                                  // 83
				$.each(files, function (idx, fileInfo) {                                                                         // 84
					if (/^image\//.test(fileInfo.type)) {                                                                           // 85
						$.when(readFileIntoDataUrl(fileInfo)).done(function (dataUrl) {                                                // 86
							execCommand('insertimage', dataUrl);                                                                          // 87
						}).fail(function (e) {                                                                                         // 88
							options.fileUploadError("file-reader", e);                                                                    // 89
						});                                                                                                            // 90
					} else {                                                                                                        // 91
						options.fileUploadError("unsupported-file-type", fileInfo.type);                                               // 92
					}                                                                                                               // 93
				});                                                                                                              // 94
			},                                                                                                                // 95
			markSelection = function (input, color) {                                                                         // 96
				restoreSelection();                                                                                              // 97
				document.execCommand('hiliteColor', 0, color || 'transparent');                                                  // 98
				saveSelection();                                                                                                 // 99
				input.data(options.selectionMarker, color);                                                                      // 100
			},                                                                                                                // 101
			bindToolbar = function (toolbar, options) {                                                                       // 102
				toolbar.find('a[data-' + options.commandRole + ']').click(function () {                                          // 103
					restoreSelection();                                                                                             // 104
					editor.focus();                                                                                                 // 105
					execCommand($(this).data(options.commandRole));                                                                 // 106
					saveSelection();                                                                                                // 107
				});                                                                                                              // 108
				toolbar.find('[data-toggle=dropdown]').click(restoreSelection);                                                  // 109
                                                                                                                     // 110
				toolbar.find('input[type=text][data-' + options.commandRole + ']').on('webkitspeechchange change', function () { // 111
					var newValue = this.value; /* ugly but prevents fake double-calls due to selection restoration */               // 112
					this.value = '';                                                                                                // 113
					restoreSelection();                                                                                             // 114
					if (newValue) {                                                                                                 // 115
						editor.focus();                                                                                                // 116
						execCommand($(this).data(options.commandRole), newValue);                                                      // 117
					}                                                                                                               // 118
					saveSelection();                                                                                                // 119
				}).on('focus', function () {                                                                                     // 120
					var input = $(this);                                                                                            // 121
					if (!input.data(options.selectionMarker)) {                                                                     // 122
						markSelection(input, options.selectionColor);                                                                  // 123
						input.focus();                                                                                                 // 124
					}                                                                                                               // 125
				}).on('blur', function () {                                                                                      // 126
					var input = $(this);                                                                                            // 127
					if (input.data(options.selectionMarker)) {                                                                      // 128
						markSelection(input, false);                                                                                   // 129
					}                                                                                                               // 130
				});                                                                                                              // 131
				toolbar.find('input[type=file][data-' + options.commandRole + ']').change(function () {                          // 132
					restoreSelection();                                                                                             // 133
					if (this.type === 'file' && this.files && this.files.length > 0) {                                              // 134
						insertFiles(this.files);                                                                                       // 135
					}                                                                                                               // 136
					saveSelection();                                                                                                // 137
					this.value = '';                                                                                                // 138
				});                                                                                                              // 139
			},                                                                                                                // 140
			initFileDrops = function () {                                                                                     // 141
				editor.on('dragenter dragover', false)                                                                           // 142
					.on('drop', function (e) {                                                                                      // 143
						var dataTransfer = e.originalEvent.dataTransfer;                                                               // 144
						e.stopPropagation();                                                                                           // 145
						e.preventDefault();                                                                                            // 146
						if (dataTransfer && dataTransfer.files && dataTransfer.files.length > 0) {                                     // 147
							insertFiles(dataTransfer.files);                                                                              // 148
						}                                                                                                              // 149
					});                                                                                                             // 150
			};                                                                                                                // 151
		options = $.extend({}, $.fn.wysiwyg.defaults, userOptions);                                                        // 152
		bindHotkeys(options.hotKeys);                                                                                      // 153
		initFileDrops();                                                                                                   // 154
		bindToolbar($(options.toolbarSelector), options);                                                                  // 155
		editor.attr('contenteditable', true)                                                                               // 156
			.on('mouseup keyup mouseout', function () {                                                                       // 157
				saveSelection();                                                                                                 // 158
				updateToolbar();                                                                                                 // 159
			});                                                                                                               // 160
		$(window).bind('touchend', function (e) {                                                                          // 161
			var isInside = (editor.is(e.target) || editor.has(e.target).length > 0),                                          // 162
				currentRange = getCurrentRange(),                                                                                // 163
				clear = currentRange && (currentRange.startContainer === currentRange.endContainer && currentRange.startOffset === currentRange.endOffset);
			if (!clear || isInside) {                                                                                         // 165
				saveSelection();                                                                                                 // 166
				updateToolbar();                                                                                                 // 167
			}                                                                                                                 // 168
		});                                                                                                                // 169
		return this;                                                                                                       // 170
	};                                                                                                                  // 171
	$.fn.wysiwyg.defaults = {                                                                                           // 172
		hotKeys: {                                                                                                         // 173
			'ctrl+b meta+b': 'bold',                                                                                          // 174
			'ctrl+i meta+i': 'italic',                                                                                        // 175
			'ctrl+u meta+u': 'underline',                                                                                     // 176
			'ctrl+z meta+z': 'undo',                                                                                          // 177
			'ctrl+y meta+y meta+shift+z': 'redo',                                                                             // 178
			'ctrl+l meta+l': 'justifyleft',                                                                                   // 179
			'ctrl+r meta+r': 'justifyright',                                                                                  // 180
			'ctrl+e meta+e': 'justifycenter',                                                                                 // 181
			'ctrl+j meta+j': 'justifyfull',                                                                                   // 182
			'shift+tab': 'outdent',                                                                                           // 183
			'tab': 'indent'                                                                                                   // 184
		},                                                                                                                 // 185
		toolbarSelector: '[data-role=editor-toolbar]',                                                                     // 186
		commandRole: 'edit',                                                                                               // 187
		activeToolbarClass: 'btn-info',                                                                                    // 188
		selectionMarker: 'edit-focus-marker',                                                                              // 189
		selectionColor: 'darkgrey',                                                                                        // 190
		fileUploadError: function (reason, detail) { console.log("File upload error", reason, detail); }                   // 191
	};                                                                                                                  // 192
}(window.jQuery));                                                                                                   // 193
                                                                                                                     // 194