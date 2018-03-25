import { Meteor } from 'meteor/meteor';
import '../imports/api/notes.js';


Meteor.startup(function () {
  var Future = Npm.require("fibers/future");
  var exec = Npm.require("child_process").exec;
 
  // Server methods
  Meteor.methods({





  	getCommitLog: function () {
    	this.unblock();
      var future = new Future();

			var mongoPort = 3005;
			var root = '/Users/gene/NewDash/Dashboard'
			var backup_dir = 'admin/backup';

			var command = 'cd '+root+' ; ';
			command += 'cd '+backup_dir+' ; '
			command += 'git log';

			exec(command,function(error,stdout,stderr){
	    	if (error){
					console.log(error);
					throw new Meteor.Error(500,command+" failed");	
				}
	      future.return(stdout.toString());
	    });
	    return future.wait();
	  },





  	importDb: function (hash_string) {

  		console.log("SO IMPORT")
    	this.unblock();
      var future = new Future();
      

			var mongoPort = 3005;
			var root = '/Users/gene/NewDash/Dashboard'
			var backup_dir = 'admin/backup';



			var command = 'cd '+root+' ; ';
			command += 'cd '+backup_dir+' ; '
			command += 'git checkout '+hash_string+' ; ';
			command += 'cd '+root+' ; ';

			command += 'mongoimport -h localhost:'+mongoPort+' --db meteor --collection events --drop --type json --file '+backup_dir+'/events.json ; ';
			command += 'mongoimport -h localhost:'+mongoPort+' --db meteor --collection notes --drop --type json --file '+backup_dir+'/notes.json ; ';
			command += 'mongoimport -h localhost:'+mongoPort+' --db meteor --collection lists --drop --type json --file '+backup_dir+'/lists.json ; ';
			command += 'mongoimport -h localhost:'+mongoPort+' --db meteor --collection tags --drop --type json --file '+backup_dir+'/tags.json ; ';
			command += 'mongoimport -h localhost:'+mongoPort+' --db meteor --collection travels --drop --type json --file '+backup_dir+'/travels.json ; '
			command += 'cd '+backup_dir+' ; '
			command += 'git reset --hard HEAD'

			console.log(command)


      exec(command,function(error,stdout,stderr){
        if(error){
          console.log(error);
          throw new Meteor.Error(500,command+" failed");
        }
        future.return(stdout.toString());
      });
      return future.wait();
  	},











    exportDb: function (sticky) {
      this.unblock();
      var future = new Future();

			var mongoPort = 3005;
			var root = '/Users/gene/NewDash/Dashboard'
			var backup_dir = 'admin/backup'


			var command = 'cd '+root+' ; ';
		
			command += 'mongoexport --host localhost --port '+mongoPort+' --db meteor --collection events --out '+backup_dir+'/events.json ; ';
			command += 'mongoexport --host localhost --port '+mongoPort+' --db meteor --collection notes --out '+backup_dir+'/notes.json ; ';
			command += 'mongoexport --host localhost --port '+mongoPort+' --db meteor --collection lists --out '+backup_dir+'/lists.json ; ';
			command += 'mongoexport --host localhost --port '+mongoPort+' --db meteor --collection tags --out '+backup_dir+'/tags.json ; ';
			command += 'mongoexport --host localhost --port '+mongoPort+' --db meteor --collection travels --out '+backup_dir+'/travels.json ; ';


			
			command += 'cd '+backup_dir+' ; ';
			command += 'git add *.json ; ';
			command += 'git commit -m "'+new Date()+'" ; ';
			
			console.log(command)


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