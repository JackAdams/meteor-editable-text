Package.describe({
  name: "babrahams:editable-text",
  summary: "Editable text drop-in template helper",
  version: "0.7.24",
  git: "https://github.com/jackadams/meteor-editable-text.git"
});

Package.onUse(function (api, where) {

  api.versionsFrom("1.0");

  api.use('jquery', 'client');
  api.use('tracker', 'client');
  api.use('minimongo', 'client');
  api.use('templating', 'client');
  api.use('blaze', 'client');
  api.use('spacebars', 'client');
  api.use('dburles:mongo-collection-instances@0.3.3');
  api.use('underscore', ['client','server']);
  api.use('mongo', ['client','server']);
  api.use('reactive-var', 'client');
  api.use('djedi:sanitize-html@1.6.1', 'server');
  api.imply('djedi:sanitize-html');
  api.use('gwendall:body-events@0.1.6', 'client');

  api.add_files('lib/editable_text.css', 'client');
  api.add_files('lib/editable_text.html', 'client');
  api.add_files('lib/editable_text.js','client');
  api.add_files('lib/editable_text_common.js',['client','server']);
  api.add_files('lib/editable_text_server.js','server');
  
  if (api.export) {
    api.export('EditableText');
	api.export('sanitizeHtml');
  }
  
});