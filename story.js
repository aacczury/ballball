var db = require('mongoskin').db(process.env.OPENSHIFT_MONGODB_DB_URL + "story");

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