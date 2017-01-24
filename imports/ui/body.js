import { Template } from 'meteor/templating';
import { Lists, Tasks } from '../api/tasks.js';

import './column.js';
import './body.html';

function onLoad() {
  this.mde = new SimpleMDE({ element: document.getElementById("markdown_area") });
  this.mde.codemirror.on("change", function(){
    if (active.islist) {
      Lists.update(active.id, {$set: { markdown: this.mde.value() }});
    } else {
      Tasks.update(active.id, {$set: { markdown: this.mde.value() }});
    }
  });
};

Template.registerHelper('formatId', function(data) {
  return (data && data._str) || data;
});

Template.body.onCreated(function bodyOnCreated() {
  this.state = new ReactiveDict();
  window.onload = onLoad;
});

Template.body.events({
  'submit .name-editor'(event) {
    event.preventDefault();
    if (active.islist) {
      Lists.update(active.id, {$set: { name: event.target.text.value }});
    } else {
      Tasks.update(active.id, {$set: { text: event.target.text.value }});
    }
    event.target.text.value = '';
  },
  'submit .link-editor'(event) {
    event.preventDefault();
    if (active.islist) {
      Lists.update(active.id, {$set: { external_link: event.target.text.value }});
    } else {
      Tasks.update(active.id, {$set: { external_link: event.target.text.value }});
    }
    event.target.text.value = '';
  }
});

