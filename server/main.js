import { Meteor } from 'meteor/meteor';
import '../imports/api/notes.js';


/*
Meteor.startup(() => {
  // code to run on server at startup
});
*/


Meteor.startup(function () {
  var Future = Npm.require("fibers/future");
  var exec = Npm.require("child_process").exec;
 
  // Server methods
  Meteor.methods({
    runCode: function (x, y) {
      // This method call won't return immediately, it will wait for the
      // asynchronous code to finish, so we call unblock to allow this client
      // to queue other method calls (see Meteor docs)
      this.unblock();
      var future=new Future();
      
      console.log("got args",x,y)
      //var command = 'cd ../../../../admin ; pwd'
      var command = 'python ../../../../../admin/admin.py';




      //var command="pwd";


      exec(command,function(error,stdout,stderr){
        if(error){
          console.log(error);
          throw new Meteor.Error(500,command+" failed");
        }
        future.return(stdout.toString());
      });
      return future.wait();
    }
  });
});