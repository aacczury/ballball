#!/bin/env node
/**
 * Module dependencies.
 */

var express = require('express');
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

var server = http.createServer(app);
var io = require('socket.io').listen(server);

var story = require('./story.js')(io);

app.get('/', story.findAll);
app.get('/:id', story.findOne);
app.post('/comment', story.addComment);
app.post('/upload', story.upload);

server.listen(app.get('port'), app.get('ipaddress'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

io.sockets.on('connection', function (socket) {
	so = socket;
	var comment;
	socket.on('addComment', story.socketComment);
	socket.on('pointComment', story.pointComment);
	socket.on('postInput', story.postInput);
});

