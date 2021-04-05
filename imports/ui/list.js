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
    Notes.update(this._id, {$set: { order: this.order+1.5 }});
    idx_order = 0
    Notes.find({list_id: this.list_id }, {sort: { order: 1 }}).forEach(function(n) {
      Notes.update(n._id, {$set: { order: idx_order }});
      idx_order += 1
    })
  },
  'click .up'() {
    Notes.update(this._id, {$set: { order: this.order-1.5 }});
    idx_order = 0
    Notes.find({list_id: this.list_id }, {sort: { order: 1 }}).forEach(function(n) {
      Notes.update(n._id, {$set: { order: idx_order }});
      idx_order += 1
    })
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
