import { Template } from 'meteor/templating';
import { Lists, Tasks, Tags } from '../api/tasks.js';

import './calendar.js';
import './column.js';
import './body.html';


function onLoad() {
  this.mde = new SimpleMDE({
    element: document.getElementById("markdown_area"),
    parsingConfig: {
      allowAtxHeaderWithoutSpace: false,
      strikethrough: false,
      underscoresBreakWords: false,
    },
    status: false,
    spellChecker: false
  });
  this.mde.codemirror.on("change", function(){
    if (active.islist) {
      Lists.update(active.id, {$set: { markdown: this.mde.value() }});
    } else {
      Tasks.update(active.id, {$set: { markdown: this.mde.value() }});
    }
  });
  viewManager();
  // viewCalendar();
};

this.viewEditor = function() {
  $("#calendar").hide();
  $("#manager").hide();
  $("#editor").show();
};

this.viewManager = function() {
  $("#calendar").hide();
  $("#editor").hide();
  $("#manager").show();
};

this.viewCalendar = function() {
  $("#editor").hide();
  $("#manager").hide();
  $("#calendar").show();
};


Template.registerHelper('formatId', function(data) {
  return (data && data._str) || data;
});

Template.registerHelper('equals', function (a, b) {
  return a === b;
});

Template.body.onCreated(function bodyOnCreated() {
  this.state = new ReactiveDict();
  window.onload = onLoad;
});

Template.manager.onCreated(function bodyOnCreated() {
  this.state = new ReactiveDict();
});

Template.editor.onCreated(function bodyOnCreated() {
  this.state = new ReactiveDict();
});

Template.navbar.events({
  'click #showManager'(event) {
    viewManager();
  },
  'click #showCalendar'(event) {
    viewCalendar();
  }
});

Template.manager.helpers({
  tags() {
    const instance = Template.instance();
    var data = [];
    Tags.find({}).forEach(function(t){
      data.push({_id: t._id, tag: t.name, active: instance.state.get(t._id)});
    });
    return data;
  }
});

Template.editor.helpers({
  editing(){
    const instance = Template.instance();
    return instance.state.get('editing');
  }
});

Template.manager.events({
  'click .newlist-tag'(event, instance) {
    const tagid = $(event.target).data('tagid');
    instance.state.set(tagid, !instance.state.get(tagid));
  },
  'submit #newlist-form'(event, instance) {
    event.preventDefault();
    var name = event.target.text.value;
    var tags = [];
    Tags.find().forEach(function(t){
      if (instance.state.get(t._id)) {
        tags.push(t._id);
      }
    });
    if (name == '' || tags.length == 0) {
      alert("error: either no name supplied or no tags. try again.");
      return;
    }
    Lists.insert({name: name, tags: tags, order: Lists.find({}).count(), createdAt: new Date()});
    event.target.text.value = '';
  },
  'submit #newtag-form'(event) {
    event.preventDefault();
    var name = event.target.text.value;
    if (name == '') {
      alert("error: no tag name. try again.");
      return;
    }
    Tags.insert({name: name, order: Tags.find({}).count(), createdAt: new Date()});
    event.target.text.value = '';    
  },
  'submit #editname'(event) {
    event.preventDefault();
    if (active.islist) {
      Lists.update(active.id, {$set: { name: event.target.text.value }});
    } else {
      Tasks.update(active.id, {$set: { text: event.target.text.value }});
    }
  },
  'submit #editlink'(event) {
    event.preventDefault();
    if (active.islist) {
      Lists.update(active.id, {$set: { external_link: event.target.text.value }});
    } else {
      Tasks.update(active.id, {$set: { external_link: event.target.text.value }});
    }
  },
  'click #delete_all'(event) {
    Tasks.find({}).forEach(function (t){
      Tasks.remove(t._id);
    })
    Lists.find({}).forEach(function (l){
      Lists.remove(l._id);
    });
    Tags.find({}).forEach(function (t){
      Tags.remove(t._id);
    });
  },
  'click #dump_json'(event) {
    var json = {tags:[], lists:[], tasks:[]};
    Tags.find({}).forEach(function (t){json.tags.push(t);});
    Lists.find({}).forEach(function (l){json.lists.push(l);});
    Tasks.find({}).forEach(function (t){json.tasks.push(t);});
    var data = JSON.stringify(json);
    var url = 'data:text/json;charset=utf8,'+encodeURIComponent(data);
    window.open(url, '_blank');
    window.focus();
  },
  'click #load_json'(event) {


  },
  'click #remove_checked'(event) {     
    var date = new Date();
    Lists.find({checked: true, archivedAt: undefined}).forEach(function (list){
      Tasks.find({list_id:list._id, archivedAt: undefined}).forEach(function (task){
        Tasks.update(task._id, { $set: { checked: true }});
      });
      Lists.update(list._id, { $set: { archivedAt: date }});
    });
    Tasks.find({checked: true, archivedAt: undefined}).forEach(function (task){
      console.log("archive "+task._id)
      Tasks.update(task._id, { $set: { archivedAt: date }});
    });
  }
});

Template.editor.events({
  'click .editor-view'(event, instance) {
    if (instance.state.get('editing')) {
      $(".editor-toolbar").hide();
      if (!mde.isPreviewActive()) {mde.togglePreview();}
      instance.state.set('editing', false);
    } else{
      $(".editor-toolbar").show();
      if (mde.isPreviewActive()) {mde.togglePreview();}
      instance.state.set('editing', true);
    }
  }
});

