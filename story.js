var db = require('mongoskin').MongoClient.connect(process.env.OPENSHIFT_MONGODB_DB_URL + "nodejs");
console.log(process.env.OPENSHIFT_MONGODB_DB_URL + "story");

//var db = require('mongoskin').MongoClient.connect("mongodb://localhost:27017/story");
var fs = require('fs');
var im = require('imagemagick');
var crypto = require('crypto');

exports.findAll = function(req, res) {
	db.collection('comments').find().toArray(function(err, comments) {
		console.log(comments);
		db.collection('images').find().toArray(function(err, images){
			res.render('story', { comments: comments, images: images });
		});
	});
}

exports.findOne = function(req, res) {
	db.collection('comments').find().toArray(function(err, comments) {
		console.log(comments);
		db.collection('images').find().toArray(function(err, images){
			res.render('story', { comments: comments, images: images, imageN: req.params.id });
		});
	});
}

exports.addComment = function(req, res) {
	var comment = req.body;
	console.log('Adding comment: ' + JSON.stringify(comment));
	db.collection('comments').insert(comment, function(err, result){
		console.log(result);
		res.redirect('/');
	});
}

exports.upload = function(req, res) {
	fs.readFile(req.files.image.path, function (err, data) {
		var imageName = req.files.image.name;
		console.log(req.body.text);
		/// If there's an error
		if(!imageName){
			console.log("There was an error")
			res.redirect("/");
			res.end();
		} else {
			var sha1 = crypto.createHash('sha1');
			sha1.update(String((new Date()).getTime()));
			sha1.update(imageName);
			imageName = sha1.digest('hex') + "_" + imageName;
			var newPath = __dirname + "\\public\\uploads\\fullsize\\" + imageName;
			var thumbPath = __dirname + "\\public\\uploads\\thumbs\\" + imageName;
			/// write file to uploads/fullsize folder
			fs.writeFile(newPath, data, function (err) {
			/// write file to uploads/thumbs folder
				im.resize({
					srcPath: newPath,
					dstPath: thumbPath,
					width:   200
				}, function(err, stdout, stderr){
					if (err) throw err;
					console.log('resized image to fit within 200x200px');
				});
				var imageText = {};
				imageText.name = imageName;
				imageText.text = req.body.text;
				db.collection('images').insert(imageText, function(err, result){
					console.log(result);
					if(err) throw err;
				});
				res.redirect("/");
		  });
		}
	});
}