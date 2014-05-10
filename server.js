#!/bin/env node
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');

var app = express();
var MongoStore = require('connect-mongo')(express);

app.configure(function () {
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({
		secret: "=911#e4)ad@849e+c21{35/4c*ee4[21$d8!b2}d_69790&350(8]",
		store: sessiondb = new MongoStore({
			/*host: 'localhost',
			port: 27017,
			db: 'story',
			collection: 'sessions'*/
			url : process.env.OPENSHIFT_MONGODB_DB_URL + 'nodejs/sessions'
		})
	}));
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

app.get('/', story.showAll);
app.post('/article', story.addArticle);
app.get('/articles/:id', story.showArticle);
app.get('/articles/:id/:imgid', story.showArticleImage);
app.post('/articles/:id/login', story.login);
app.post('/articles/:id/upload', story.upload);
app.post('/articles/:id/point', story.point);
app.post('/articles/:id/outcry', story.outcry);

server.listen(app.get('port'), app.get('ipaddress'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

io.sockets.on('connection', function (socket) {
	socket.on('addComment', story.socketComment);
});

