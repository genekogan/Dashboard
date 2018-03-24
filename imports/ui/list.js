import { Template } from 'meteor/templating';
import { Lists, Notes } from '../api/notes.js';
import './list.html';


Template.note.events({
  'click .toggle-checked'() {
    Notes.update(this._id, {$set: { checked: ! this.checked }});
  },
  'click .archive'() {
  	Notes.update(this._id, {$set: { checked: ! this.checked }});
  },
  'click .down'() {

    // Notes.find({list_id: this.list_id}).forEach(function(n) {
    //   console.log(n)
    // });
    // Notes.find({list_id: this.list_id, order: {$gte: this.order}, archivedAt: undefined}).forEach(function(n) {
    //   console.log(n)
    // });

    //var note_below = Notes.findOne({list_id: this.list_id, order: {$gt: this.order}, archivedAt: undefined }, {sort: { order: 1 }});
    var note_below = Notes.findOne({list_id: this.list_id, order: {$gt: this.order} }, {sort: { order: 1 }});
    if (note_below === undefined) {return;}
    var below_order = note_below.order;
    Notes.update(note_below._id, {$set: { order: this.order },});
    Notes.update(this._id, {$set: { order: below_order },});
  },
  'click .up'() {
    //var note_above = Notes.findOne({list_id: this.list_id, order: {$lt: this.order}, archivedAt: undefined }, {sort: { order: -1 }});
    var note_above = Notes.findOne({list_id: this.list_id, order: {$lt: this.order} }, {sort: { order: -1 }});
    if (note_above === undefined) {return;}
    var above_order = note_above.order;
    Notes.update(note_above._id, {$set: { order: this.order }});
    Notes.update(this._id, {$set: { order: above_order }});
  },
  'mouseenter .text'() {
  	highlighed = this._id;
  },
  'dblclick .text'() {
  },
  'click .text'() {
  	active = {id: this._id, dataType: DataType.NOTE};
    setMarkdown(this, DataType.NOTE);
  }
});


Template.list.events({
  'click .archive_list'() {
    Lists.update(this.list._id, {$set: { checked : !this.list.checked }});
  },
  'click .down_list'() {
  	//var list_below = Lists.findOne({order: {$gt: this.list.order}, archivedAt: undefined }, {sort: { order: 1 }});
    var list_below = Lists.findOne({order: {$gt: this.list.order}}, {sort: { order: 1 }});
    if (list_below === undefined) {return;}
    var below_order = list_below.order;
    Lists.update(list_below._id, {$set: { order: this.list.order },});
    Lists.update(this.list._id, {$set: { order: below_order },});
  },
  'click .up_list'() {
  	//var list_above = Lists.findOne({order: {$lt: this.list.order}, archivedAt: undefined }, {sort: { order: -1 }});
    var list_above = Lists.findOne({order: {$lt: this.list.order}}, {sort: { order: -1 }});
    if (list_above === undefined) {return;}
    var above_order = list_above.order;
    Lists.update(list_above._id, {$set: { order: this.list.order }});
    Lists.update(this.list._id, {$set: { order: above_order }});
  },
  'click .new'() {
    Lists.update(this.list._id, {$set: { new_hidden: !this.list.new_hidden }});
  },
  'click .list_name'() {
  	active = {id: this.list._id, dataType: DataType.LIST};
    setMarkdown(this.list, DataType.LIST);
  },
  'dblclick .todo_header'() {
  	Lists.update(this.list._id, {$set: { collapsed:!this.list.collapsed }});
  }
});
