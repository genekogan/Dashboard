import { Mongo } from 'meteor/mongo';

export const Lists = new Mongo.Collection('lists'); 
export const Notes = new Mongo.Collection('notes');
export const Tags = new Mongo.Collection('tags');
export const Events = new Mongo.Collection('events');
export const Travels = new Mongo.Collection('travels');



if (Meteor.isServer) {
	Meteor.publish('notes_loaded', function(){return Notes.find({})}, {is_auto: true});
}

if (Meteor.isClient) {
  	Meteor.subscribe('notes_loaded', function(){
     	if (Notes.find({list_id: null}).count() == 0) {
     		Notes.insert({text:'', markdown:'hello world', list_id: null, order: 0, createdAt: new Date()});
     	}


     	console.log(Notes.find().count())
     	console.log(Notes.find().forEach(function (n) {
     		console.log(n);
     	}))

	});
}