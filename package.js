Package.describe({
  summary: "Editable text drop-in template helper",
  version: "0.1.0",
  git: "https://github.com/jackadams/meteor-editable-text.git",
  name: "babrahams:editable-text"
});

Package.on_use(function (api, where) {

  api.versionsFrom("1.0");

  api.use('jquery', 'client');
  api.use('tracker', 'client');
  api.use('minimongo', 'client');
  api.use('templating', 'client');
  api.use('blaze', 'client');
  api.use('spacebars', 'client');
  api.use('bootstrap@1.0.1', 'client');
  api.use('natestrauser:font-awesome@4.2.0');
  api.use('dburles:mongo-collection-instances@0.2.5', 'client');
  api.use('underscore', ['client', 'server']);
  api.use('mongo', ['client', 'server']);
  api.use('reactive-var', 'client');

  api.add_files('lib/editable_text.html', 'client');
  api.add_files('lib/editable_text.js', 'client');
  api.add_files('lib/bootstrap_wysiwyg.js', 'client');
  api.add_files('lib/wysiwyg.html', 'client');
  api.add_files('lib/wysiwyg.js', 'client');
  api.add_files('lib/wysiwyg.css', 'client');
  
  if (api.export) {
    api.export('EditableText');
  }
  
});