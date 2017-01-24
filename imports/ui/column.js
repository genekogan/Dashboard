import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tasks, Lists } from '../api/tasks.js';

import './task.js';
import './column.html';


Template.column.onCreated(function bodyOnCreated() {
  this.state = new ReactiveDict();
  this.active = {id:-1, islist:false};
});


Template.column.helpers({
  lists() {
    var data = [];
    const instance = Template.instance();
    if (instance.state.get('showArchived')) {
      var lists = Lists.find({}, {sort:{order:1}});
      lists.forEach(function(list) {
        var tasks = Tasks.find({list_id: list._id, archivedAt:{$ne:undefined}}, {sort:{order:1}});
        if (tasks.count() > 0) {
          data.push({list: list, task_list: tasks});
        }
      });
    } else {
      var lists = Lists.find({archivedAt:undefined}, {sort:{order:1}});
      lists.forEach(function(list) {
        var tasks = Tasks.find({list_id: list._id, archivedAt: undefined}, {sort:{order:1}});
        data.push({list: list, task_list: tasks})
      });
    }
    return data;
  },
  incompleteCount() {
    return Tasks.find({ checked: { $ne: true } }).count();
  }
});


Template.column.events({
  'submit .new-task'(event) {
    event.preventDefault();
    const target = event.target;
    const text = target.text.value;
    const list_id = $(target.text).data('id');
    Tasks.insert({
      text,
      list_id: list_id,
      order: Tasks.find({list_id: list_id}).count(),
      createdAt: new Date(), 
    });
    target.text.value = '';
  },
  'submit .new-list'(event) {
    event.preventDefault();
    const target = event.target;
    const text = target.text.value;
    Lists.insert({
      name: text,
      order: Lists.find({}).count(),
      createdAt: new Date(),
    });
    target.text.value = '';
    window.location.reload();
  },
  'change .show-archived input'(event, instance) {
    instance.state.set('showArchived', event.target.checked);
  },
  'click .archive-checked'(event, instance) {
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
  }
});
