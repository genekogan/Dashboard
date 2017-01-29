import { Template } from 'meteor/templating';
import { Lists, Tasks, Tags, Events, Travels } from '../api/tasks.js';

import './calendar.js';
import './column.js';
import './body.html';

this.DataType = {NOTE:0, LIST:1, TAG:2, EVENT:3, TRAVEL:4};

function onLoad() {
  this.mde = new SimpleMDE({
    element: document.getElementById("markdown_area"),
    parsingConfig: {
      allowAtxHeaderWithoutSpace: false,
      strikethrough: false,
      underscoresBreakWords: false,
    },
    forceSync: true,
    status: false,
    spellChecker: false
  });
  this.mde.codemirror.on("change", function(){
    if (active.dataType == DataType.LIST) {
      Lists.update(active.id, {$set: { markdown: this.mde.value() }});
    } else if (active.dataType == DataType.NOTE) {
      Tasks.update(active.id, {$set: { markdown: this.mde.value() }});
    } else if (active.dataType == DataType.EVENT) {
      Events.update(active.id, {$set: { markdown: this.mde.value() }});
    }
  });
  viewCalendar();
};

this.markdownPreviewMode = function() {
  if (!mde.isPreviewActive()) {
    mde.togglePreview();
  } else {
    mde.togglePreview();
    mde.togglePreview();
  }
  $(".editor-toolbar").hide();
};

this.viewEditor = function() {
  $("#calendar").hide();
  $("#editor").show();
};

this.viewCalendar = function() {
  $("#editor").hide();
  $("#calendar").show();
};

this.viewAdmin = function() {
  $("#mAdmin").css("display", "block");
};

this.viewNewTag = function() {
  $("#mNewTag").css("display", "block");
};

this.viewNewList = function() {
  $("#mNewList").css("display", "block");
};

Template.registerHelper('formatId', function(data) {
  return (data && data._str) || data;
});

Template.registerHelper('equals', function (a, b) {
  return a === b;
});

Template.registerHelper('hyperlink', function (link) {
  return link.includes("http") ? link : "http://"+link;
});

Template.registerHelper('month', function (date) {
  return date.getMonth()+1;
});

Template.registerHelper('day', function (date) {
  return date.getDate();
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
  'click #viewAdmin'(event) {
    viewAdmin();
  },
  'click #viewNewTag'(event) {
    viewNewTag();
  },
  'click #viewNewList'(event) {
    viewNewList();
  },
  'click #viewCalendar'(event) {
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
    Events.find({}).forEach(function (e){
      Events.remove(e._id);
    });
    Travels.find({}).forEach(function (t){
      Travels.remove(t._id);
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
      Tasks.update(task._id, { $set: { archivedAt: date }});
    });
  },
  'click .modal'(event) {
    if ($(event.target).hasClass("modal")) {
      $('.modal').css("display", "none");
    }
  },
  'click .modal-header .close'(event) {
    $('.modal').css("display", "none");
  }
});

Template.editor.events({
  'submit .editorname-form'(event) {
    event.preventDefault();
    if (active.dataType == DataType.LIST) {
      Lists.update(active.id, {$set: { name: event.target.text.value }});
    } else if (active.dataType == DataType.NOTE) {
      Tasks.update(active.id, {$set: { text: event.target.text.value }});
    } else if (active.dataType == DataType.EVENT) {
      Events.update(active.id, {$set: { name: event.target.text.value }});
    }
  },
  'submit .editorlink-form'(event) {
    event.preventDefault();
    if (active.dataType == DataType.LIST) {
      Lists.update(active.id, {$set: { external_link: event.target.text.value }});
    } else if (active.dataType == DataType.NOTE) {
      Tasks.update(active.id, {$set: { external_link: event.target.text.value }});
    } else if (active.dataType == DataType.EVENT) {
      Events.update(active.id, {$set: { external_link: event.target.text.value }});
    }
  },
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
  },
  'click .editorlink-link'(event) {
    if (active.dataType == DataType.LIST) {
      window.open(Lists.findOne(active.id).external_link);
    } else if (active.dataType == DataType.NOTE) {
      window.open(Tasks.findOne(active.id).external_link);
    }
  }
});

