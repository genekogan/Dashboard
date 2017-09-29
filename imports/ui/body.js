import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Lists, Notes, Tags, Events, Travels } from '../api/notes.js';

import './calendar.js';
import './column.js';
import './body.html';

this.DataType = {NOTE:0, LIST:1, TAG:2, EVENT:3, TRAVEL:4};
this.ViewMode = {ALL:0, PRIORITY:1, ARCHIVED:2};



Template.sticky.events({
  'click #stickynote'(event) {
    var markdown = Notes.findOne({list_id: null}).markdown;
  },
  'keypress #stickynote': function(event) { 
    var note = $("#stickynote").val();
    var sticky = Notes.findOne({list_id: null});
    if (note !== sticky.markdown) {
      Session.set('unsaved', true);
    }
    if (event.which == 92) {
      if (note !== sticky.markdown) {
        Notes.update(sticky._id, {$set: {markdown: note}});
        Session.set('unsaved', false);
      }
    }
  }
});

Template.sticky.helpers({
  sticky(){
    var sticky = Notes.findOne({list_id: null});
    return sticky !== undefined ? sticky.markdown : "";
  },
  unsaved(){
    return Session.get("unsaved");
  }
});


function onLoad() {
  this.mde = new SimpleMDE({
    element: document.getElementById("markdown_area"),
    status: false,
    spellChecker: false
  });
  this.mde.codemirror.on("change", function(){
    if (active.dataType == DataType.LIST) {
      Lists.update(active.id, {$set: { markdown: this.mde.value() }});
    } else if (active.dataType == DataType.NOTE) {
      Notes.update(active.id, {$set: { markdown: this.mde.value() }});
    } else if (active.dataType == DataType.EVENT) {
      Events.update(active.id, {$set: { markdown: this.mde.value() }});
    }
  });
  viewCalendar();
};

this.setPreviewMode = function(preview) {
  if (preview){ 
    $(".editor-toolbar").hide();
    if (!mde.isPreviewActive()) {
      mde.togglePreview();
    } else {
      mde.togglePreview();
      mde.togglePreview();
    }
    Session.set('editing', false);
  } else {
    $(".editor-toolbar").show();
    if (mde.isPreviewActive()) {
      mde.togglePreview();
    } else {
      mde.togglePreview();
      mde.togglePreview();
    }
    Session.set('editing', true);
  }
};

this.setMarkdown = function(entry, dataType) {
  var markdown;
  if (dataType == DataType.NOTE) {
    markdown = Notes.findOne(entry._id).markdown;
  } else if (dataType == DataType.LIST) {
    markdown = Lists.findOne(entry._id).markdown;
  } else if (dataType == DataType.EVENT) {
    markdown = Events.findOne(entry._id).markdown;
  }
  mde.value(markdown === undefined ? "" : markdown);
  setPreviewMode(true);
  $("#editor-name").val( dataType == DataType.NOTE ? entry.text : entry.name );
  $("#editor-link").val( entry.external_link === undefined ? "" : entry.external_link );    
  $("#editor-list").val( dataType == DataType.NOTE ? Lists.findOne({_id:entry.list_id}).name : "" );
  if (dataType == DataType.EVENT) {
    $("#editor-date").val( entry.date === undefined ? "" : (1+entry.date.getMonth())+"/"+entry.date.getDate()+"/"+entry.date.getFullYear() );      
    $(".editordate-date").show();    
    $("#editor-date").show();
    $(".editordate-date2").hide(); 
    $("#editor-date2").hide();
    $(".editorlink-form").show();
    $(".editorlink-form").show();
    $(".editorlist-form").hide();
    $("#editor-list").hide();
  } else if (dataType == DataType.TRAVEL) {
    $("#editor-date").val( entry.date1 === undefined ? "" : (1+entry.date1.getMonth())+"/"+entry.date1.getDate()+"/"+entry.date1.getFullYear() );      
    $("#editor-date2").val( entry.date2 === undefined ? "" : (1+entry.date2.getMonth())+"/"+entry.date2.getDate()+"/"+entry.date2.getFullYear() );      
    $(".editordate-date").show();    
    $("#editor-date").show();
    $(".editordate-date2").show(); 
    $("#editor-date2").show();
    $(".editorlink-form").hide();   
    $(".editorlist-form").hide();
    $("#editor-list").hide();
  } else {
    $(".editordate-date").hide();
    $("#editor-date").hide();
    $(".editordate-date2").hide();  
    $("#editor-date2").hide();
    $(".editorlink-form").show();  
    $(".editorlist-form").show();
    $("#editor-list").show();
  }
  if (dataType == DataType.NOTE) {
  	setPriority();
  }
  viewEditor();
};

this.setPriority = function() {
  var priority = Notes.findOne(active.id).priority;
  $("#editor-prio-button").attr('class', priority ? 'editor-prio priority' : 'editor-prio')
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

this.viewNewTag = function() {
  $("#mNewTag").css("display", "block");
};

this.viewNewEvent = function() {
  $("#mNewEvent").css("display", "block");
};

this.hideModal = function() {
  $('.modal').css("display", "none");
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
  Session.set('editing', false);
  Session.set('unsaved', false);
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
  'click #viewNewEvent'(event) {
    viewNewEvent();
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

Template.body.helpers({
  columns(){
    return Columns.find({});
  }
});

Template.editor.helpers({
  editing(){
    return Session.get('editing');;
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
    hideModal();
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
    hideModal();
  },
  'click #delete_all'(event) {
    if (!confirm("Are you sure you want to delete?")) return;
    if (!confirm("Really???")) return;
    Notes.find({}).forEach(function (t){Notes.remove(t._id);})
    Lists.find({}).forEach(function (l){Lists.remove(l._id)});
    Tags.find({}).forEach(function (t){Tags.remove(t._id)});
    Events.find({}).forEach(function (e){Events.remove(e._id)});
    Travels.find({}).forEach(function (t){Travels.remove(t._id)});
  },
  'click #dump_json'(event) {
    var json = {tags:[], lists:[], notes:[], events:[], travels:[]};
    Tags.find({}).forEach(function (t){json.tags.push(t);});
    Lists.find({}).forEach(function (l){json.lists.push(l);});
    Notes.find({}).forEach(function (t){json.notes.push(t);});
    Events.find({}).forEach(function (e){json.events.push(e);});
    Travels.find({}).forEach(function (t){json.travels.push(t);});
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
      Notes.find({list_id:list._id, archivedAt: undefined}).forEach(function (note){
        Notes.update(note._id, { $set: { checked: true }});
      });
      Lists.update(list._id, { $set: { archivedAt: date }});
    });
    Notes.find({checked: true, archivedAt: undefined}).forEach(function (note){
      Notes.update(note._id, { $set: { archivedAt: date }});
    });
  },
  'click #add_column'(event) {
    Columns.insert({visible:[]});
  },
  'submit .newevent-form'(event) {
    event.preventDefault();
    var name = $("#newevent-name").val();
    var link = $("#newevent-link").val();
    var date = new Date($("#newevent-date").val()+" 12:00:00 GMT+0000");
    date.setUTCHours(12,0,0);
    if (link !== "") {
      Events.insert({name: name, date: date, external_link: link});
    } else {
      Events.insert({name: name, date: date});
    }
    hideModal();
  },
  'submit .newrange-form'(event) {
    event.preventDefault();
    var name = $("#newrange-name").val();
    var date1 = new Date($("#newrange-date1").val().split()+" 12:00:00 GMT+0000");
    var date2 = new Date($("#newrange-date2").val().split()+" 12:00:00 GMT+0000");
    date1.setUTCHours(12,0,0);
    date2.setUTCHours(12,0,0);
    Travels.insert({name: name, date1: date1, date2: date2, color_idx: Travels.find().count() % 6});
    hideModal();
  },
  'click .event'(event) {
    active = {id: this._id, dataType: DataType.EVENT};
    var md = Events.findOne(this._id).markdown;
    mde.value(md === undefined ? "" : md);
    document.getElementById("editor-name").value = this.name;
    document.getElementById("editor-link").value = this.external_link === undefined ? "" : this.external_link;
    viewEditor();
  },
  'click .modal'(event) {
    if ($(event.target).hasClass("modal")) {
      hideModal();
    }
  },
  'click .modal-header .close'(event) {
    hideModal();
  }
});

Template.editor.events({
  'submit .editorname-form'(event) {
    event.preventDefault();
    if (active.dataType == DataType.LIST) {
      Lists.update(active.id, {$set: { name: event.target.text.value }});
    } else if (active.dataType == DataType.NOTE) {
      Notes.update(active.id, {$set: { text: event.target.text.value }});
    } else if (active.dataType == DataType.EVENT) {
      Events.update(active.id, {$set: { name: event.target.text.value }});
      viewCalendar();
    }
  },
  'submit .editorlink-form'(event) {
    event.preventDefault();
    if (active.dataType == DataType.LIST) {
      Lists.update(active.id, {$set: { external_link: event.target.text.value }});
    } else if (active.dataType == DataType.NOTE) {
      Notes.update(active.id, {$set: { external_link: event.target.text.value }});
    } else if (active.dataType == DataType.EVENT) {
      Events.update(active.id, {$set: { external_link: event.target.text.value }});
      viewCalendar();
    }
  },
  'submit .editordate-form'(event) {
    event.preventDefault();
    if (active.dataType == DataType.EVENT) {
      var date = new Date($("#editor-date").val()+" 12:00:00 GMT+0000");
      date.setUTCHours(12,0,0);
      Events.update(active.id, {$set: { date: date }});
      viewCalendar();
    } else if (active.dataType == DataType.TRAVEL) {
      var date = new Date($("#editor-date").val()+" 12:00:00 GMT+0000");
      date.setUTCHours(12,0,0);
      Travels.update(active.id, {$set: { date1: date }});
      viewCalendar();
    }
  },
  'submit .editordate-form2'(event) {
    event.preventDefault();
    if (active.dataType == DataType.TRAVEL) {
      var date = new Date($("#editor-date2").val()+" 12:00:00 GMT+0000");
      date.setUTCHours(12,0,0);
      Travels.update(active.id, {$set: { date2: date }});
      viewCalendar();
    }
  },
  'submit .editorlist-form'(event) {
    event.preventDefault();
    if (active.dataType == DataType.NOTE) {
      var list_to = Lists.findOne({name:event.target.text.value});
      if (list_to !== undefined) {
        var last_note = Notes.findOne({list_id: list_to._id, archivedAt: undefined }, {sort: { order: -1 }});
        if (last_note !== undefined) {
          Notes.update(active.id, { $set: { list_id: list_to._id, order: last_note.order+1 }});
        } else {
          Notes.update(active.id, { $set: { list_id: list_to._id }});
        }
      }
    } 
  },
  'click .editor-view'(event, instance) {
    if (Session.get('editing')) {
      setPreviewMode(true);
    } else {
      setPreviewMode(false);
    }    
  },
  'click .editor-prio'(event, instance) {
    if (active.dataType == DataType.LIST) {
      //Lists.update(active.id);
    } else if (active.dataType == DataType.NOTE) {
      Notes.update(active.id, {$set: { priority: !Notes.findOne(active.id).priority }});
      setPriority();
    } else if (active.dataType == DataType.EVENT) {
      //Events.update(active.id);
    }
  },
  'click .editor-delete'(event, instance) {
    if (!confirm("Are you sure you want to delete this event?")) return;
    if (active.dataType == DataType.LIST) {
      Lists.remove(active.id);
    } else if (active.dataType == DataType.NOTE) {
      Notes.remove(active.id);
    } else if (active.dataType == DataType.EVENT) {
      Events.remove(active.id);
    } else if (active.dataType == DataType.TRAVEL) {
      Travels.remove(active.id);
    }
    viewCalendar();
  },
  'click .editorlink-link'(event) {
    if (active.dataType == DataType.LIST) {
      window.open(Lists.findOne(active.id).external_link);
    } else if (active.dataType == DataType.NOTE) {
      window.open(Notes.findOne(active.id).external_link);
    }
  }
});

