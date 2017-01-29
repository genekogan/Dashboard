import { Template } from 'meteor/templating';
import { Lists, Tasks } from '../api/tasks.js';
import './list.html';


function markdownPreviewMode() {
  if (!mde.isPreviewActive()) {
    mde.togglePreview();
  } else {
    mde.togglePreview();
    mde.togglePreview();
  }
  $(".editor-toolbar").hide();
};


Template.task.events({
  'click .toggle-checked'() {
    Tasks.update(this._id, {$set: { checked: ! this.checked }});
  },
  'click .archive'() {
  	Tasks.update(this._id, {$set: { checked: ! this.checked }});
  },
  'click .down'() {
    var task_below = Tasks.findOne({list_id: this.list_id, order: {$gt: this.order}, archivedAt: undefined }, {sort: { order: 1 }});
    if (task_below === undefined) {return;}
    var below_order = task_below.order;
    Tasks.update(task_below._id, {$set: { order: this.order },});
    Tasks.update(this._id, {$set: { order: below_order },});
  },
  'click .up'() {
    var task_above = Tasks.findOne({list_id: this.list_id, order: {$lt: this.order}, archivedAt: undefined }, {sort: { order: -1 }});
    if (task_above === undefined) {return;}
    var above_order = task_above.order;
    Tasks.update(task_above._id, {$set: { order: this.order }});
    Tasks.update(this._id, {$set: { order: above_order }});
  },
  'mouseenter .text'() {
  	highlighed = this._id;
  },
  'dblclick .text'() {
  	console.log("double click")
  },
  'click .text'() {
  	active = {id: this._id, islist: false};
  	var md = Tasks.findOne(this._id).markdown;
  	mde.value(md === undefined ? "" : md);
    markdownPreviewMode();
    document.getElementById("editor-name").value = this.text;
  	document.getElementById("editor-link").value = this.external_link === undefined ? "" : this.external_link;    
    viewEditor();
  }
});


Template.list.events({
  'click .archive_list'() {
    Lists.update(this.list._id, {$set: { checked : !this.list.checked }});
  },
  'click .down_list'() {
  	var list_below = Lists.findOne({order: {$gt: this.list.order}, archivedAt: undefined }, {sort: { order: 1 }});
    if (list_below === undefined) {return;}
    var below_order = list_below.order;
    Lists.update(list_below._id, {$set: { order: this.list.order },});
    Lists.update(this.list._id, {$set: { order: below_order },});
  },
  'click .up_list'() {
  	var list_above = Lists.findOne({order: {$lt: this.list.order}, archivedAt: undefined }, {sort: { order: -1 }});
    if (list_above === undefined) {return;}
    var above_order = list_above.order;
    Lists.update(list_above._id, {$set: { order: this.list.order }});
    Lists.update(this.list._id, {$set: { order: above_order }});
  },
  'click .new'() {
    Lists.update(this.list._id, {$set: { new_hidden: !this.list.new_hidden }});
  },
  'click .list_name'() {
  	active = {id: this.list._id, islist: true};
  	var md = Lists.findOne(this.list._id).markdown;
  	mde.value(md === undefined ? "" : md);
    markdownPreviewMode();
  	document.getElementById("editor-name").value = this.list.name;
  	document.getElementById("editor-link").value = this.list.external_link === undefined ? "" : this.list.external_link;
    viewEditor();
  },
  'dblclick .todo_header'() {
  	Lists.update(this.list._id, {$set: { collapsed:!this.list.collapsed }});
  }
});
