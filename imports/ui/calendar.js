import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Events, Travels } from '../api/tasks.js';

import './calendar.html';

Template.calendar.onCreated(function bodyOnCreated() {
  this.state = new ReactiveDict();
});

Template.calendar.helpers({
  weeks() {
    var data = [];
    // const instance = Template.instance();
    // instance.state.set('editing', false);
    var today = new Date();
    today.setHours(0,0,0,0);
    var date = new Date("1/2/2017");
    for (var w=0; w<32; w++) {
      var week = [];
      for (var wd=0; wd<7; wd++) {
        var day = {date:new Date(date), y:date.getYear(), m:1+date.getMonth(), d:date.getDate(), events_:[]};
        if (date.getTime() == today.getTime()) {
        	day.today = true;
        }
        Events.find({date:new Date(date)}).forEach(function (event){
        	if (event.external_link) {
        		day.events_.push({name: event.name, external_link: event.external_link});
        	} else {
	        	day.events_.push({name: event.name});
        	}
        });
        Travels.find({date1 : {$lte:new Date(date)}, date2: {$gte:new Date(date)}}).forEach(function (travel) {
        	day.location = travel.name;
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
  'click .day'(event) {
    // console.log("yo")
  },
  'dblclick .day'(event) {
  	var date = new Date($(event.target).data('date'));
  	$("#event-date").val((1+date.getMonth())+"/"+date.getDate()+"/"+date.getFullYear());
  	$("#range-date1").val((1+date.getMonth())+"/"+date.getDate()+"/"+date.getFullYear());
  	$("#range-date2").val((1+date.getMonth())+"/"+date.getDate()+"/"+date.getFullYear());
  },
  'submit .new-event'(event) {
    event.preventDefault();
    var name = $("#event-name").val();
    var date = new Date($("#event-date").val());
    var link = $("#event-link").val();
    if (link !== "") {
    	Events.insert({name: name, date: date, external_link: link});
    } else {
    	Events.insert({name: name, date: date});
    }
  },
  'submit .new-range'(event) {
    event.preventDefault();
    var name = $("#range-name").val();
    var date1 = new Date($("#range-date1").val().split());
    var date2 = new Date($("#range-date2").val().split());
    Travels.insert({name: name, date1: date1, date2: date2});

  }
});
