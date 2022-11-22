Package.describe({
  name: "babrahams:editable-text",
  summary: "Editable text drop-in template helper",
  version: "0.9.18",
  git: "https://github.com/jackadams/meteor-editable-text.git"
});

Package.onUse(function (api, where) {

  api.versionsFrom(['1.8.2', '2.3']);
  
  Npm.depends({'sanitize-html': '2.7.3'}); // 1.27.3

  api.use(['templating@1.3.2', 'blaze@2.3.4', 'spacebars@1.0.15', 'jquery@1.11.11'], 'client');
  api.use('tracker', 'client');
  api.use('minimongo', 'client');
  api.use('random', 'client');
  api.use('gwendall:body-events@0.1.7');
  api.use('dburles:mongo-collection-instances@0.3.5');
  api.use(['underscore', 'check'], ['client','server']);
  api.use('mongo', ['client','server']);
  api.use('reactive-var', 'client');

  api.addFiles('lib/sanitize_html.js', 'server');
  api.addFiles('lib/editable_text.css', 'client');
  api.addFiles('lib/editable_text.html', 'client');
  api.addFiles('lib/editable_text.js','client');
  api.addFiles('lib/editable_text_common.js',['client','server']);
  api.addFiles('lib/editable_text_server.js','server');
  
  if (api.export) {
    api.export('EditableText');
	  api.export('sanitizeHtml');
  }
  
});