import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Notes, Lists, Tags } from '../api/notes.js';

import './list.js';
import './column.html';


Template.column.onCreated(function bodyOnCreated() {
  this.state = new ReactiveDict();
  this.active = {id:-1, dataType:null};
  const instance = Template.instance();
  if (this.data.idx==0) {
    //instance.state.set("APWbBC8BYFAgGAxGL", true);
  } else {
    //instance.state.set("Ni4ZwitSGeZBsD6iB", true);
  }
});


Template.column.helpers({
  lists() {
    const instance = Template.instance();
    var list_condition = {};
    var archiveAt_ = undefined;
    if (instance.state.get('showArchived')) {
      archiveAt_ = {$ne:undefined};
    }
    var tags = [];
    Tags.find({}, {sort:{order:1}}).forEach(function(t){if (instance.state.get(t._id)){tags.push(t._id)}});
    if (tags.length > 0) {
      list_condition.tags = {$in: tags};
    }
    var data = [];
    var lists = Lists.find(list_condition, {sort:{order:1}});
    lists.forEach(function(list) {
      var notes = Notes.find({list_id: list._id, archivedAt:archiveAt_}, {sort:{order:1}});
      if (notes.count() > 0 || (!list.checked && !instance.state.get('showArchived'))) {
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
  showArchived(){
    const instance = Template.instance();
    return instance.state.get('showArchived');
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
  'change .show-archived input'(event, instance) {
    instance.state.set('showArchived', event.target.checked);
  },
  'click .archived'(event, instance) {
    instance.state.set('showArchived', !instance.state.get('showArchived'));
  },
  'click .tag'(event, instance) {
    event.preventDefault();
    const tag = $(event.target).data('tag');
    console.log(tag);
    instance.state.set(tag, !instance.state.get(tag));
  }
});

