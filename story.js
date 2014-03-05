var connection_string = '127.0.0.1:27017/story';
// if OPENSHIFT env variables are present, use the available connection info:
if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
	connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
	process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
	process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
	process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
	process.env.OPENSHIFT_APP_NAME;
}

var db = require('mongoskin').db(connection_string);

exports.findAll = function(req, res) {
	db.collection('comments').find().toArray(function(err, comments) {
		console.log(comments);
		res.render('story', { comments: comments });
	});
}

/*exports.addComment = function(req, res) {
	var comment = req.body;
	console.log('Adding comment: ' + JSON.stringify(comment));
	db.collection('comments').insert(comment, function(err, result){
		console.log(result);
		res.redirect('/');
	});
}*/