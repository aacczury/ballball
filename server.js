#!/bin/env node
/**
 * Module dependencies.
 */

var express = require('express');
var story = require('./story.js');
var http = require('http');
var path = require('path');

var app = express();

app.configure(function () {
  app.use(express.bodyParser());
});

// all environments
app.set('ipaddress', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");
app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', story.findAll);
app.get('/:id', story.findOne);
app.post('/comment', story.addComment);
app.post('/upload', story.upload);

http.createServer(app).listen(app.get('port'), app.get('ipaddress'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
