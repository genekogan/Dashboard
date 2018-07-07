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
    today.setUTCHours(12,0,0);
    var date = new Date(today);
    date.setDate(date.getDate()-14);
    while (date.getDay() != 1) {
      date.setDate(date.getDate()-1);
    }
    var color_idx = 0;
    var curr_travel_id = -1;
    for (var w=0; w<60; w++) {
      var week = [];
      for (var wd=0; wd<7; wd++) {
        var day = {date:new Date(date), y:date.getYear(), m:1+date.getMonth(), d:date.getDate(), events_:[]};
        var d1 = new Date(date), d2 = new Date(date);
        d1.setUTCHours(0,0,0);
        d2.setUTCHours(23,59,59);
        if (today.getTime() > d1.getTime() && today.getTime() < d2.getTime()) {
          day.today = true;
        }
        Events.find({date:{$gt:new Date(d1), $lt:new Date(d2)}}).forEach(function (event_){
        	day.events_.push(event_);
        });
        Travels.find({date1 : {$lte:new Date(d2)}, date2: {$gte:new Date(d1)}}).forEach(function (travel) {
          if (curr_travel_id != travel._id){
            color_idx = (color_idx + 1) % 6;
            curr_travel_id = travel._id;
          }
        	day.location = travel.name;
          day.color_idx = "active"+color_idx;
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
  'click .topbar'(event) {
    var travel = Travels.findOne({date1 : {$lte:new Date(this.date)}, date2: {$gte:new Date(this.date-60*60*24*1000)}});
    if (travel !== undefined) {
      active = {id: travel._id, dataType: DataType.TRAVEL};
      setMarkdown(travel, DataType.TRAVEL);
    }
  },
  'click .event'(event) {
  	active = {id: this._id, dataType: DataType.EVENT};
    setMarkdown(this, DataType.EVENT);
  }
});
