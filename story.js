var db = require('mongoskin').MongoClient.connect(process.env.OPENSHIFT_MONGODB_DB_URL + "nodejs");
console.log(process.env.OPENSHIFT_MONGODB_DB_URL + "story");

//var db = require('mongoskin').MongoClient.connect("mongodb://localhost:27017/story");
var fs = require('fs');
var im = require('imagemagick');
var crypto = require('crypto');

module.exports = function(io){
	return {
		findAll : function(req, res) {
			db.collection('comments').find().toArray(function(err, comments) {
				console.log(comments);
				db.collection('images').find().toArray(function(err, images){
					db.collection('inputs').find().sort({'num':1}).toArray(function(err, inputs){
						console.log(inputs);
						res.render('story', { comments: comments, images: images, inputs: inputs });
					});
				});
			});
		},

		findOne : function(req, res) {
			db.collection('comments').find().toArray(function(err, comments) {
				console.log(comments);
				db.collection('images').find().toArray(function(err, images){
					res.render('story', { comments: comments, images: images, imageN: req.params.id });
				});
			});
		},

		addComment : function(req, res) {
			var comment = req.body;
			console.log('Adding comment: ' + JSON.stringify(comment));
			db.collection('comments').insert(comment, function(err, result){
				console.log(result);
				res.redirect('/');
			});
		},

		upload : function(req, res) {
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
					var newPath = __dirname + "/public/uploads/fullsize/" + imageName;
					var thumbPath = __dirname + "/public/uploads/thumbs/" + imageName;
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
		},


		socketComment : function (comment) {
			console.log('Adding comment: ' + JSON.stringify(comment));
			db.collection('comments').insert(comment, function(err, result){
				console.log(result);
				var newComment = {};
				newComment.id = result[0]._id;
				newComment.name = result[0].nickname;
				newComment.content = result[0].content;
				newComment.time = result[0]._id.getTimestamp();
				
				console.log("Comment name: " + newComment.name);
				io.sockets.emit('newComment', newComment);
			});
		},
		
		pointComment : function (pc) {
			db.collection('comments').updateById(pc.id, {$set:{point: pc.point}}, function(err, result){
				console.log(result);
				console.log("Comment id: " + pc.id);
				io.sockets.emit('setComment', pc);
			});
		},
		
		postInput : function (iv) {
			db.collection('inputs').insert(iv, function(err, result){
				if(!err){
					console.log(result);
					console.log("Input num: " + result[0].num);
					io.sockets.emit('getInput', result[0]);
				}
			});
		}
	};
}