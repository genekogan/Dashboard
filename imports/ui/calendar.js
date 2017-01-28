import './calendar.html';

Template.calendar.onCreated(function bodyOnCreated() {
  this.state = new ReactiveDict();
});

Template.calendar.helpers({
  weeks() {
    const instance = Template.instance();
    instance.state.set('editing', false);
    var data = [];
    var idx = 0;
    for (var w=1; w<15; w++) {
      var week = [];
      for (var wd=0; wd<7; wd++) {
        idx+=1;
        var m = Math.floor(idx/28);
        var d = 1 + idx % 28;
        var y = 2017;
        week.push({y:y, m:m, d:d});
      }  
      data.push(week);
    }
    return data;
  }
}); 

Template.calendar.events({
  'click .day'(event) {
    console.log("yo")
  },
  'submit .new-event'(event) {
    event.preventDefault();
    console.log("hi ")
  }
});
