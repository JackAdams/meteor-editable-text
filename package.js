Package.describe({
  name: "babrahams:editable-text",
  summary: "Editable text drop-in template helper",
  version: "0.4.3",
  git: "https://github.com/jackadams/meteor-editable-text.git"
});

Package.on_use(function (api, where) {

  api.versionsFrom("1.0");

  api.use('jquery', 'client');
  api.use('tracker', 'client');
  api.use('minimongo', 'client');
  api.use('templating', 'client');
  api.use('blaze', 'client');
  api.use('spacebars', 'client');
  api.use('dburles:mongo-collection-instances@0.2.5', ['client','server']);
  api.use('underscore', ['client','server']);
  api.use('mongo', ['client','server']);
  api.use('reactive-var', 'client');
  api.use('djedi:sanitize-html@1.3.0', 'server');

  api.add_files('lib/editable_text.css', 'client');
  api.add_files('lib/editable_text.html', 'client');
  api.add_files('lib/editable_text.js','client');
  api.add_files('lib/editable_text_methods.js',['client','server']);
  
  if (api.export) {
    api.export('EditableText','client');
  }
  
});