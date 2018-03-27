import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Notes, Lists, Tags } from '../api/notes.js';

import './list.js';
import './column.html';


Template.column.onCreated(function bodyOnCreated() {
  this.state = new ReactiveDict();
  this.active = {id:-1, dataType:null};
  const instance = Template.instance();
  var viewMode = localStorage.getItem('Dashboard_c'+this.data.idx+'_viewMode') == 'priority' ? ViewMode.PRIORITY : ViewMode.ALL;
  instance.state.set("viewMode", viewMode);
  instance.state.set("columnIdx", this.data.idx);
});


Template.column.helpers({
  lists() {
    const instance = Template.instance();
    var list_condition = {};
    var note_condition = {};
    if (instance.state.get('viewMode') == ViewMode.PRIORITY) {
      //note_condition = {priority: true};
      note_condition = {priority: true, checked: {$in:[undefined, false]}};
    } 
    Tags.find({}, {sort:{order:1}}).forEach(function(t){if (instance.state.get(t._id)){}}); // hack to force refresh
    var tags = [];
    Tags.find({}, {sort:{order:1}}).forEach(function(t){if (localStorage.getItem('Dashboard_c'+instance.state.get('columnIdx')+'_t'+t._id) == 1){tags.push(t._id)}});
    if (tags.length > 0) {
      list_condition.tags = {$in: tags};
    }
    var data = [];
    var lists = Lists.find(list_condition, {sort:{order:1}});
    lists.forEach(function(list) {
      note_condition.list_id = list._id;
      var notes = Notes.find(note_condition, {sort:{order:1}});
      if (notes.count() > 0 || (!list.checked)) {
        data.push({list: list, note_list: notes})
      }
    });
    return data;
  },
  tags() {
    const instance = Template.instance();
    var data = [];
    Tags.find({}).forEach(function(t){
      var hack = instance.state.get(t._id); // hack to force refresh
      var local = 'Dashboard_c'+instance.state.get('columnIdx')+'_t'+t._id;
      var tagActive = localStorage.getItem(local) == 1;
      data.push({_id: t._id, tag:t.name, active: tagActive});
      //data.push({_id: t._id, tag:t.name, active: instance.state.get(t._id)});
    });
    return data;
  },
  priority(){
    const instance = Template.instance();
    return instance.state.get('viewMode') == ViewMode.PRIORITY;
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
      localStorage.setItem('Dashboard_c'+instance.state.get('columnIdx')+'_viewMode', 'priority');
    } else {
      instance.state.set('viewMode', ViewMode.ALL);
      localStorage.setItem('Dashboard_c'+instance.state.get('columnIdx')+'_viewMode', 'all');
    }
  },
  'click .tag'(event, instance) {
    event.preventDefault();
    const tag = $(event.target).data('tag');
    var local = 'Dashboard_c'+instance.state.get('columnIdx')+'_t'+tag;
    var tagActive = localStorage.getItem(local) == 1;
    localStorage.setItem(local, tagActive ? 0 : 1);
    instance.state.set(tag, tagActive);
  }
});

