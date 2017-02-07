import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Events, Travels } from '../api/notes.js';

import './calendar.html';

Template.calendar.onCreated(function bodyOnCreated() {
  this.state = new ReactiveDict();
});

Template.calendar.helpers({
  weeks() {
    var data = [];
    var today = new Date();
    today.setHours(0,0,0,0);
    var date = new Date("1/2/2017");
    for (var w=0; w<56; w++) {
      var week = [];
      for (var wd=0; wd<7; wd++) {
        var day = {date:new Date(date), y:date.getYear(), m:1+date.getMonth(), d:date.getDate(), events_:[]};
        if (date.getTime() == today.getTime()) {
        	day.today = true;
        }
        var tomorrow = new Date(date);
        tomorrow.setDate(date.getDate()+1);
        Events.find({date:{$gte:new Date(date), $lt:new Date(tomorrow)}}).forEach(function (event){
        	day.events_.push(event);
        });
        Travels.find({date1 : {$lte:new Date(date)}, date2: {$gte:new Date(date)}}).forEach(function (travel) {
        	day.location = travel.name;
        	day.color_idx = "active"+travel.color_idx;
        });
        week.push(day);
        date.setDate(date.getDate()+1);
      }  
      data.push(week);
    }
    return data;
  }
}); 

Template.calendar.events({  
  'dblclick .day'(event) {
  	var date = new Date($(event.target).data('date'));
  	$("#newevent-date").val((1+date.getMonth())+"/"+date.getDate()+"/"+date.getFullYear());
  	$("#newrange-date1").val((1+date.getMonth())+"/"+date.getDate()+"/"+date.getFullYear());
  	$("#newrange-date2").val((1+date.getMonth())+"/"+date.getDate()+"/"+date.getFullYear());
    viewNewEvent();
  },
  'click .event'(event) {
  	active = {id: this._id, dataType: DataType.EVENT};
    setMarkdown(this, DataType.EVENT);
  }
});
