import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Notes, Lists, Tags } from '../api/notes.js';

import './list.js';
import './column.html';


Template.column.onCreated(function bodyOnCreated() {
  this.state = new ReactiveDict();
  this.active = {id:-1, dataType:null};
  const instance = Template.instance();
  instance.state.set("viewMode", ViewMode.ALL);
  if (this.data.idx==0) {
    instance.state.set("2APyZ2nSHkYoYXBKD", true);
  } else if (this.data.idx==1) {
    instance.state.set("J8BRZCr3MG87YXTKi", true);
  } else if (this.data.idx==2) {
    instance.state.set("qQoDYzj3srMQgW7cb", true);
  }
});


Template.column.helpers({
  lists() {
    const instance = Template.instance();
    var list_condition = {};
    var note_condition = {};
    if (instance.state.get('viewMode') == ViewMode.ARCHIVED) {
      note_condition = {archivedAt: {$ne:undefined}};
    } else if (instance.state.get('viewMode') == ViewMode.PRIORITY) {
      note_condition = {archivedAt: undefined, priority: true, checked: {$in:[undefined, false]}};
    } else {
      note_condition = {archivedAt: undefined};
    }
    var tags = [];
    Tags.find({}, {sort:{order:1}}).forEach(function(t){if (instance.state.get(t._id)){tags.push(t._id)}});
    if (tags.length > 0) {
      list_condition.tags = {$in: tags};
    }
    var data = [];
    var lists = Lists.find(list_condition, {sort:{order:1}});
    lists.forEach(function(list) {
      note_condition.list_id = list._id;
      var notes = Notes.find(note_condition, {sort:{order:1}});
      if (notes.count() > 0 || (!list.checked && !instance.state.get('viewMode') == ViewMode.ARCHIVED)) {
        data.push({list: list, note_list: notes})
      }
    });
    return data;
  },
  tags() {
    const instance = Template.instance();
    var data = [];
    Tags.find({}).forEach(function(t){
      data.push({_id: t._id, tag:t.name, active: instance.state.get(t._id)});
    });
    return data;
  },
  priority(){
    const instance = Template.instance();
    return instance.state.get('viewMode') == ViewMode.PRIORITY;
  },
  archived(){
    const instance = Template.instance();
    return instance.state.get('viewMode') == ViewMode.ARCHIVED;
  }
});


Template.column.events({
  'submit .new-note'(event) {
    event.preventDefault();
    const text = event.target.text.value;
    const list_id = $(event.target.text).data('id');
    Notes.insert({text, list_id: list_id, order: Notes.find({list_id: list_id}).count(), createdAt: new Date()});
    event.target.text.value = '';
  },
  'click .viewMode'(event, instance) {
    if (instance.state.get('viewMode') == ViewMode.ALL) {
      instance.state.set('viewMode', ViewMode.PRIORITY);
    } else if (instance.state.get('viewMode') == ViewMode.PRIORITY) {
      instance.state.set('viewMode', ViewMode.ARCHIVED);
    } else {
      instance.state.set('viewMode', ViewMode.ALL);
    }
  },
  'click .tag'(event, instance) {
    event.preventDefault();
    const tag = $(event.target).data('tag');
    instance.state.set(tag, !instance.state.get(tag));
  }
});

