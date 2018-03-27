import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Lists, Notes, Tags, Events, Travels } from '../api/notes.js';

import './calendar.js';
import './column.js';
import './body.html';


// constants
// const checkCommitInterval = 1000 * 60 * 15;   // 15 minutes
// const maxBackupLag = 1000 * 60 * 60 * 24;   // 24 hours
const checkCommitInterval = 1000 * 60 * 1;   // 15 minutes
const maxBackupLag = 1000 * 60 * 4;   // 24 hours

this.DataType = {NOTE:0, LIST:1, TAG:2, EVENT:3, TRAVEL:4};
this.ViewMode = {ALL:0, PRIORITY:1};

Template.sticky.events({
  'click #stickynote'(event) {
    //var markdown = Notes.findOne({list_id: null}).markdown;
  },
  'keypress #stickynote': function(event) { 
    var note = $("#stickynote").val();
    localStorage.setItem("Dashboard_sticky", note);
  }
});

Template.sticky.helpers({
  sticky(){
    var markdown = localStorage.getItem("Dashboard_sticky")
    return markdown == null ? 'hello world' : markdown;
  }
});


function resizeWindow() {
  $(".column").css("height", (window.innerHeight-50)+"px");
  $("#console").css("height", (window.innerHeight-64)+"px");
  $(".CodeMirror").css("height", (window.innerHeight-135)+"px");
}

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
      console.log("Warning: no backup commits found.")
    }
  });
};

function backupDb() {
  if (Session.get("isPreviousVersion") == true) {
    console.log('No backing up while in previous version');
    return false;
  }
  var sticky = localStorage.getItem("Dashboard_sticky"); 
  Meteor.call('exportDb', sticky, function (err, response) {
    console.log(response)
    //getMostRecentCommit();  
    Meteor.call('commitDb', function (err, response2) {
      console.log(response2)
      getMostRecentCommit();
      return true;
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
      });
    });
  });
};

function checkLastCommit() {
  console.log("check it!")
  var currentTime = new Date();
  if (Math.floor(currentTime / maxBackupLag) > Math.floor(Session.get('lastBackup') / maxBackupLag)) {
    console.log("YES LETS DO IT")
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
  Session.set("isPreviousVersion", localStorage.getItem("Dashboard_IsPreviousVersion")=='true');
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
    var result = backupDb();
    if (!result) {
      alert('Something went wrong exporting DB');
    }
  },
  'click #revert'(event) { 
    console.log("future loading versions")





    var query_date = new Date('3/15/2018');


    var query_date2 = prompt("Query which date", "3/15/2018");

    if (query_date2 != null) {
      query_date = new Date(query_date2);
    }

    console.log("query is ",query_date)









  

    Meteor.call('getCommitLog', function (err, response) {
      query_date.setSeconds(86399);
      var best_date = new Date('1/1/2000');
      var query_hash = null;
      var re = /commit (.+)\nAuthor: (.+)+\nDate:   (.+)+/g


      response = `

commit 0b2d13d3a89f0cd259a34681b8bdd4561c8b1167
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 26 17:40:09 2018 +0200

    Mon Mar 26 2018 17:40:09 GMT+0200 (CEST)

commit ae09ec281832e8141fabd995e6dfc3feffd6db80
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 25 17:36:03 2018 +0200

    Mon Mar 25 2018 17:36:03 GMT+0200 (CEST)

commit bbd62d805c2812933530b5359410fa74dcc9ff54
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 24 17:25:10 2018 +0200

    Mon Mar 24 2018 17:25:10 GMT+0200 (CEST)

commit 81980ee421978e756aef7e3d8dc4e5024c5a53ce
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 23 16:46:39 2018 +0200

    Mon Mar 23 2018 16:46:39 GMT+0200 (CEST)

commit 0b2d13d3a89f0cd259a34681b8bdd4561c8b1167
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 22 17:40:09 2018 +0200

    Mon Mar 22 2018 17:40:09 GMT+0200 (CEST)

commit ae09ec281832e8141fabd995e6dfc3feffd6db80
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 21 17:36:03 2018 +0200

    Mon Mar 21 2018 17:36:03 GMT+0200 (CEST)

commit bbd62d805c2812933530b5359410fa74dcc9ff54
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 20 17:25:10 2018 +0200

    Mon Mar 20 2018 17:25:10 GMT+0200 (CEST)

commit 81980ee421978e756aef7e3d8dc4e5024c5a53ce
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 19 16:46:39 2018 +0200

    Mon Mar 19 2018 16:46:39 GMT+0200 (CEST)

commit 72e80d29f14797b4a75fbdf6df99f3c4d8838960
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 18 16:31:45 2018 +0200

    Mon Mar 18 2018 16:31:45 GMT+0200 (CEST)

commit 18036341faaefacfb0351b24bc6002afffad9d94
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 17 16:10:38 2018 +0200

    Mon Mar 17 2018 16:10:38 GMT+0200 (CEST)

commit 0b2d13d3a89f0cd259a34681b8bdd4561c8b1167
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 16 17:40:09 2018 +0200

    Mon Mar 16 2018 17:40:09 GMT+0200 (CEST)

commit ae09ec281832e8141fabd995e6dfc3feffd6db80
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 15 17:36:03 2018 +0200

    Mon Mar 15 2018 17:36:03 GMT+0200 (CEST)

commit bbd62d805c2812933530b5359410fa74dcc9ff54
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 14 17:25:10 2018 +0200

    Mon Mar 14 2018 17:25:10 GMT+0200 (CEST)

commit 81980ee421978e756aef7e3d8dc4e5024c5a53ce
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 13 16:46:39 2018 +0200

    Mon Mar 13 2018 16:46:39 GMT+0200 (CEST)

commit 72e80d29f14797b4a75fbdf6df99f3c4d8838960
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 12 16:31:45 2018 +0200

    Mon Mar 12 2018 16:31:45 GMT+0200 (CEST)

commit 18036341faaefacfb0351b24bc6002afffad9d94
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 11 16:10:38 2018 +0200

    Mon Mar 11 2018 16:10:38 GMT+0200 (CEST)

commit 025c48209a32bb6b3fabee6c7ee1c21e5b04eca0
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 10 16:00:16 2018 +0200

    Mon Mar 10 2018 16:00:16 GMT+0200 (CEST)

commit ff1d4e5871d77ed269c0bcb2b68a3c189c4cbccc
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 9 15:24:50 2018 +0200

    Mon Mar 9 2018 15:24:50 GMT+0200 (CEST)

commit 87387c9033f36e3609073c8cfc96312138dae735
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 8 14:55:44 2018 +0200

    Mon Mar 8 2018 14:55:44 GMT+0200 (CEST)

commit 57a7997e19a399c59f4b357bcedf29eb1cb32907
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 7 14:32:53 2018 +0200

    Mon Mar 7 2018 14:32:53 GMT+0200 (CEST)

commit 137b96bd18c1dd5b8e17aac8f84961ec79302d46
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 6 14:31:03 2018 +0200

    Mon Mar 6 2018 14:31:03 GMT+0200 (CEST)

commit 14d4c6cf66d590a479f7d3eba73cc419ad63b20f
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 5 14:30:43 2018 +0200

    Mon Mar 5 2018 14:30:43 GMT+0200 (CEST)

commit cf7bb7251f5e926455a59e328d635a96529197ae
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 4 14:23:50 2018 +0200

    Mon Mar 4 2018 14:23:50 GMT+0200 (CEST)

commit 34687029db77f164515c0e0d58b480db4d949338
Author: Gene Kogan <kogan.gene@gmail.com>
Date:   Mon Mar 3 13:29:43 2018 +0200

    Mon Mar 3 2018 13:25:13 GMT+0200 (CEST)

`;


      do {
        var m = re.exec(response);
        if (m) {
          var hash = m[1];
          var date = new Date(m[3]);
          var isBefore = date < query_date;
          console.log(hash, date, isBefore);
          if (isBefore && date > best_date) {
            best_date = date;
            query_hash = hash;
          }
        }
      } while (m);



      //revert db(has), get sticky + import db, revertdblast


      console.log("found best date",best_date,query_hash)
      if (query_hash == null) {
        alert("no commit found before "+query_date);
        return;
      }


      



      // have to export before doing this

      Meteor.call('revertDb', query_hash, function (err, res) {
        if (err) { console.log("Error: ",err); return }
        Meteor.call('getSticky', function (err2, res2) {
          if (err2) { console.log("Error: ",err2); return; }
          localStorage.setItem("Dashboard_sticky", res2);
          $("#stickynote").val(localStorage.getItem("Dashboard_sticky"));
          Meteor.call('importDb', function (err3, res3) {
            if (err3) { console.log("Error: ",err3); return; }
            Meteor.call('revertDbLast', function (err4, res4) {
              if (err4) { console.log("Error: ",err4); return; }
              console.log("REVERTED TO",query_hash)

              // HOW TO MANAGE THIS
              //Session.set('IsPreviousVersion', true);
              localStorage.setItem("Dashboard_IsPreviousVersion", true);
              Session.set("isPreviousVersion", true);

            });
          });
        });
      });


        // Meteor.call('importDb', query_hash, function (err, response) {
        //   console.log(response);
        // });
      
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

