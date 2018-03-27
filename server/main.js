import { Meteor } from 'meteor/meteor';
import '../imports/api/notes.js';


const root = '../../../../..';   //'/Users/gene/NewDash/Dashboard'
const backup_dir = 'private/backup';


Meteor.startup(function () {
  var Future = Npm.require("fibers/future");
  var exec = Npm.require("child_process").exec;
 
 	// which port is Mongo on
	const mongoPort = process.env.MONGO_URL.replace('mongodb://127.0.0.1:','').replace('/meteor', '');
  
  function serverCommand(command) {
  	var future = new Future();
		exec(command,function(error,stdout,stderr){
			if (error){
				console.log(error);
				throw new Meteor.Error(500,command+" failed");	
			}
			future.return(stdout.toString());
		});
		return future.wait();
  };


  Meteor.methods({

  	getCommitLog: function () {
    	this.unblock();
			var command = 'cd '+root+'/'+backup_dir+' ; '
			command += 'git log ; git status ;';
			return serverCommand(command);
	  },

	  exportDb: function (sticky) {
	  	this.unblock();
	  	var command = 'cd '+root+' ; ';
			command += 'echo "'+sticky.replace('"', '\"')+'" > '+backup_dir+'/sticky.txt; ';
			command += 'mongoexport --host localhost --port '+mongoPort+' --db meteor --collection events --out '+backup_dir+'/events.json ; ';
			command += 'mongoexport --host localhost --port '+mongoPort+' --db meteor --collection notes --out '+backup_dir+'/notes.json ; ';
			command += 'mongoexport --host localhost --port '+mongoPort+' --db meteor --collection lists --out '+backup_dir+'/lists.json ; ';
			command += 'mongoexport --host localhost --port '+mongoPort+' --db meteor --collection tags --out '+backup_dir+'/tags.json ; ';
			command += 'mongoexport --host localhost --port '+mongoPort+' --db meteor --collection travels --out '+backup_dir+'/travels.json ; ';
			return serverCommand(command);
	  },

	  commitDb: function() {
	  	this.unblock();
	  	var command = 'cd '+root+'/'+backup_dir+' ; ';
			command += 'git add *.json sticky.txt ; ';
			command += 'git commit -m "'+new Date()+'" ; ';
			command += 'git status ; ';
			return serverCommand(command);
	  },

	  revertDb: function (hash_string) {
			this.unblock();
			var command = 'cd '+root+'/'+backup_dir+' ; ';
			command += 'git checkout '+hash_string+' ; ';
			return serverCommand(command);
	  },

	  revertDbLast: function () {
			this.unblock();
			var command = 'cd '+root+'/'+backup_dir+' ; ';
			command += 'git checkout master ; ';
			return serverCommand(command);
	  }, 

	  getSticky: function () {
	  	this.unblock();
	  	var future = new Future();
			Assets.getText('backup/sticky.txt', function(error, result) {
				if (error){
					console.log(error);
					throw new Meteor.Error(500, "sticky retrieval failed");	
				}
				future.return(result);
			});
			return future.wait();
	  },

	  importDb: function () {
	  	this.unblock();
			var command = 'cd '+root+' ; ';
			command += 'mongoimport -h localhost:'+mongoPort+' --db meteor --collection events --drop --type json --file '+backup_dir+'/events.json ; ';
			command += 'mongoimport -h localhost:'+mongoPort+' --db meteor --collection notes --drop --type json --file '+backup_dir+'/notes.json ; ';
			command += 'mongoimport -h localhost:'+mongoPort+' --db meteor --collection lists --drop --type json --file '+backup_dir+'/lists.json ; ';
			command += 'mongoimport -h localhost:'+mongoPort+' --db meteor --collection tags --drop --type json --file '+backup_dir+'/tags.json ; ';
			command += 'mongoimport -h localhost:'+mongoPort+' --db meteor --collection travels --drop --type json --file '+backup_dir+'/travels.json ; '
			return serverCommand(command);
	  }

  });
});