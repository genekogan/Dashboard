import { Mongo } from 'meteor/mongo';

export const Lists = new Mongo.Collection('lists'); 
export const Notes = new Mongo.Collection('notes');
export const Tags = new Mongo.Collection('tags');
export const Events = new Mongo.Collection('events');
export const Travels = new Mongo.Collection('travels');
