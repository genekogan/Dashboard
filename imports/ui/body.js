import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Lists, Notes, Tags, Events, Travels } from '../api/notes.js';

import './calendar.js';
import './column.js';
import './body.html';

// constants
const checkCommitInterval = 1000 * 60 * 15;   // 15 minutes
const maxBackupLag = 1000 * 60 * 60 * 24;   // 24 hours


this.DataType = {NOTE:0, LIST:1, TAG:2, EVENT:3, TRAVEL:4};
this.ViewMode = {ALL:0, PRIORITY:1};

function resizeWindow() {
  $(".column").css("height", (window.innerHeight-50)+"px");
  $("#console").css("height", (window.innerHeight-64)+"px");
  $(".CodeMirror").css("height", (window.innerHeight-135)+"px");
};

function updateSticky() {
  var note = $("#stickynote").val();
  localStorage.setItem("Dashboard_sticky", note);
};

function setSticky(sticky) {
  $("#stickynote").val(sticky);
  localStorage.setItem("Dashboard_sticky", sticky);
};

function updateLastBackupStr() {
  var current = new Date();
  var t = Session.get('lastBackup');
  var diff = (current - t) / 3600000;
  if (diff < 1.0) {
    Session.set('lastBackupStr', Math.round(60 * diff)+' minutes ago');
  } else if (diff < 2.0) {
    Session.set('lastBackupStr', '1 hour ago');
  } else if (diff < 24.0) {
    Session.set('lastBackupStr', (Math.round(diff * 100) / 100)+' hours ago');
  } else if (diff < 48.0) {
    Session.set('lastBackupStr', '1 day ago');
  } else {
    Session.set('lastBackupStr', (Math.round(diff / 24.0))+' days ago');
  }
};

function getMostRecentCommit() {
  Meteor.call('getCommitLog', function (err, response) {
    var re = /commit (.+)\nAuthor: (.+)+\nDate:   (.+)+/g
    var m = re.exec(response);
    if (m) {
      Session.set('lastBackup', new Date(m[3]));
      updateLastBackupStr();
    } else {
      console.log("Warning: no backup commits found (ignore if this is your first session).")
    }
  });
};

function backupDb(callback) {
  if (Session.get("isPreviousVersion") == true) {
    console.log('No backing up while in previous version');
    if (callback != null) return callback(false);
  }
  updateSticky(); // just to make sure last keystroke captured
  var sticky = localStorage.getItem("Dashboard_sticky"); 
  Meteor.call('exportDb', sticky, function (err, response) {
    Meteor.call('commitDb', function (err, response2) {
      getMostRecentCommit();
      if (callback != null) return callback(true);
    });
  });
};

function revertToMostRecent() {
  Meteor.call('revertDbLast'  , function (err, res) {
    if (err) { console.log("Error: ",err); return }
    Meteor.call('getSticky', function (err2, res2) {
      if (err2) { console.log("Error: ",err2); return; }
      localStorage.setItem("Dashboard_sticky", res2);
      $("#stickynote").val(localStorage.getItem("Dashboard_sticky"));
      Meteor.call('importDb', function (err3, res3) {
        if (err3) { console.log("Error: ",err3); return; }
        localStorage.setItem("Dashboard_IsPreviousVersion", false);
        Session.set("isPreviousVersion", false);
        localStorage.setItem("Dashboard_PreviousVersion", 'current');
        Session.set("PreviousVersion", 'current');
      });
    });
  });
};

function checkLastCommit() {
  var currentTime = new Date();
  if (Math.floor(currentTime / maxBackupLag) > Math.floor(Session.get('lastBackup') / maxBackupLag)) {
    backupDb();
  } else {
    updateLastBackupStr();
  }
};

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
  Session.set('lastBackup', new Date("1/1/2000"));
  Session.set('lastBackupStr', 'never');
  Session.set("isPreviousVersion", localStorage.getItem("Dashboard_IsPreviousVersion")=='true');  
  Session.set("PreviousVersion", localStorage.getItem('Dashboard_PreviousVersion'));
  getMostRecentCommit();
  setInterval(checkLastCommit, checkCommitInterval); 
  viewCalendar();
  resizeWindow();
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

Template.sticky.events({
  'click #stickynote'(event) {
    //var markdown = Notes.findOne({list_id: null}).markdown;
  },
  'keypress #stickynote': function(event) { 
    setTimeout(updateSticky, 10); // wait a few ms for the DOM to update
  }
});


Template.sticky.helpers({
  sticky(){
    var markdown = localStorage.getItem("Dashboard_sticky");
    if (markdown != null) {return markdown;}
    Meteor.call('getSticky', function (err, res) {
      if (err) { console.log("Error: ", err); return 'hello world'; }
      localStorage.setItem("Dashboard_sticky", res);
      return markdown;
    });
  }
});

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
  },
  'click #versionStatus'(event) {
    revertToMostRecent();
  }
});

Template.navbar.helpers({
  lastBackup() {
    return Session.get('lastBackupStr');
  },
  isPrevVersion() {
    return Session.get("isPreviousVersion");
  },
  isPrevVersion2() {
    return Session.get("isPreviousVersion") ? 'yes' : 'no';
  },
  whichVersion() {
    return Session.get("PreviousVersion");
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
  },
  isPrevVersion() {
    return Session.get("isPreviousVersion");
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
    backupDb(function (result){
      if (!result) {alert('Something went wrong exporting DB');}      
    });
  },
  'click #revert'(event) { 
//    alert('this is experimental. backup db and test it against corruption + edge cases.');
//    return;

    var query_date = prompt("Query which date?", "3/15/2018");
    if (query_date == null) {
      console.log("query date not recognized. skipping...");
      return;
    }

    Meteor.call('getCommitLog', function (err, response) {
      query_date = new Date(query_date);
      query_date.setSeconds(86399);
      var best_date = new Date('1/1/2000');
      var query_hash = null;
      var re = /commit (.+)\nAuthor: (.+)+\nDate:   (.+)+/g


      response = `


commit 3136e5130d59701440194ef98dd40aa5d437cdc6
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Tue Mar 27 17:47:32 2018 +0200

    Tue Mar 27 2018 17:47:32 GMT+0200 (CEST)

commit 36c5056a8ccdcd1309a826e67d75d338b368bdf9
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Tue Mar 26 17:45:28 2018 +0200

    Tue Mar 26 2018 17:45:28 GMT+0200 (CEST)

commit 967824b012e79dc42490c5639dd0dd45fd411151
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Tue Mar 25 17:44:00 2018 +0200

    Tue Mar 25 2018 17:44:00 GMT+0200 (CEST)

commit 2ae9dce1df69a0da5bef634ececf2845a1846ba4
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Tue Mar 24 17:42:27 2018 +0200

    Tue Mar 24 2018 17:42:27 GMT+0200 (CEST)

commit 70bfd0c4453a7fe382dcdbb09ccaf40a23329474
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Tue Mar 23 17:41:09 2018 +0200

    Tue Mar 23 2018 17:41:09 GMT+0200 (CEST)

commit 9c4c36f3f215571be9e4c97a2213193d89558fa4
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Tue Mar 22 17:40:32 2018 +0200

    Tue Mar 22 2018 17:40:32 GMT+0200 (CEST)

commit df791f3c67ad83c1d9e05b54127c051d19e106b0
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Tue Mar 21 17:39:00 2018 +0200

    Tue Mar 21 2018 17:39:00 GMT+0200 (CEST)


`;

      // find matching commit hash
      do {
        var m = re.exec(response);
        if (m) {
          var hash = m[1];
          var date = new Date(m[3]);
          var isBefore = date < query_date;
          if (isBefore && date > best_date) {
            best_date = date;
            query_hash = hash;
          }
        }
      } while (m);

      if (query_hash == null) {
        alert("no commit found before "+query_date);
        return;
      }

      backupDb(function (backupResult){
        Meteor.call('revertDb', query_hash, function (err, res) {
          if (err) { console.log("Error: ",err); return }
          Meteor.call('importDb', function (err2, res2) {
            if (err2) { console.log("Error: ",err2); return; }
            Meteor.call('getSticky', function (err3, res3) {
              if (err3) { console.log("Error: ",err3); return; }
              setSticky(res3);  
              Meteor.call('revertDbLast', function (err4, res4) {
                if (err4) { console.log("Error: ",err4); return; }
                localStorage.setItem("Dashboard_IsPreviousVersion", true);
                Session.set("isPreviousVersion", true);
                localStorage.setItem("Dashboard_PreviousVersion", (query_date.getMonth() + 1) + '/' + query_date.getDate() + '/' +  query_date.getFullYear());
                Session.set("PreviousVersion", (query_date.getMonth() + 1) + '/' + query_date.getDate() + '/' +  query_date.getFullYear());
              });
            });
          });
        });
      });
    });
  },
  'click #remove_checked'(event) {   
    Lists.find({checked: true}).forEach(function (list){
      Notes.find({list_id:list._id}).forEach(function (note){
        Notes.remove(note._id);
      });
      Lists.remove(list._id);
    });
    Notes.find({checked: true}).forEach(function (note){
      Notes.remove(note._id);
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
    Travels.insert({name: name, date1: date1, date2: date2});
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
    console.log("submit", event.target.text.value)
    event.preventDefault();
    if (active.dataType == DataType.LIST) {
      Lists.update(active.id, {$set: { name: event.target.text.value }});
    } else if (active.dataType == DataType.NOTE) {
      Notes.update(active.id, {$set: { text: event.target.text.value }});
    } else if (active.dataType == DataType.EVENT) {
      Events.update(active.id, {$set: { name: event.target.text.value }});
      viewCalendar();
    } else if (active.dataType == DataType.TRAVEL) {
      Travels.update(active.id, {$set: { name: event.target.text.value }});
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
        var last_note = Notes.findOne({list_id: list_to._id }, {sort: { order: -1 }});
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

