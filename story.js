var db = require('mongoskin').MongoClient.connect(process.env.OPENSHIFT_MONGODB_DB_URL + "nodejs"); console.log(process.env.OPENSHIFT_MONGODB_DB_URL + "nodejs");

//var db = require('mongoskin').MongoClient.connect("mongodb://localhost:27017/story");
var fs = require('fs');
var im = require('imagemagick');
var crypto = require('crypto');

module.exports = function(io){
	return {
		showAll : function(req, res){
			db.collection('articles').find().sort({'_id':-1}).toArray(function(err, articles){
				console.log("articles: " + JSON.stringify(articles[0]));
				res.render('main', { articles: articles });
			});
		},
		
		addArticle : function(req, res){
			var sha1 = crypto.createHash('sha1');
			sha1.update(req.body.password);
			var article = {
				article : req.body.article,
				nickname : req.body.nickname,
				password : sha1.digest('hex')
			}
			db.collection('articles').insert(article, function(err, result){
				console.log(result);
				var art = result[0];
				art.time = art._id.getTimestamp();
				io.sockets.emit('getArticle', art);
				res.redirect('/');
			});
		},
		
		showArticle : function(req, res) {
			var id = req.params.id;
			var auth = req.session.valid ? req.session.valid[id] : null;
			var plus = req.session.plus ? req.session.plus : {};
			db.collection('comments').find({'article_id': id}).sort({'_id':1}).toArray(function(err, comments) {
				db.collection('images').find({'article_id': id}).toArray(function(err, images){
					db.collection('inputs').find({'article_id': id}).sort({'num':1}).toArray(function(err, inputs){
						var hashInputs = {};
						inputs.forEach( function(input){
							if(!hashInputs[input.num])
								hashInputs[input.num] = [];
							hashInputs[input.num].push(input);
						});
						console.log(JSON.stringify(hashInputs));
						res.render('story', { reqid: id, auth: auth, plus: plus, comments: comments, images: images, inputs: hashInputs });
					});
				});
			});
		},
		
		showArticleImage : function(req, res) {
			var id = req.params.id;
			var imageN = req.params.imgid;
			db.collection('comments').find({'article_id': id}).sort({'_id':1}).toArray(function(err, comments) {
				db.collection('images').find({'article_id': id}).toArray(function(err, images){
					db.collection('inputs').find({'article_id': id}).sort({'num':1}).toArray(function(err, inputs){
						res.render('story', { reqid: id, imageN: imageN, comments: comments, images: images, inputs: inputs });
					});
				});
			});
		},
		
		login: function(req, res){
			var id = req.params.id;
			console.log(id);
			db.collection('articles').findById(id, function(err, article){
				console.log(article);
				var sha1 = crypto.createHash('sha1');
				sha1.update(req.body.password);
				if(!req.session.valid)
					req.session.valid = {};
				if(article.password == sha1.digest('hex'))
					req.session.valid[id] = true;
				else 
					req.session.valid[id] = false;
				console.log("auth: " + req.session.valid[id]);
				req.session.save();
				res.redirect('/articles/' + id);
			});
		},

		upload : function(req, res) {
			if(req.session.valid && req.session.valid[req.params.id]){
				fs.readFile(req.files.image.path, function (err, data) {
					var imageName = req.files.image.name;
					console.log(req.body.text);
					/// If there's an error
					if(!imageName){
						console.log("There was an error")
						res.redirect("/articles/" + req.params.id);
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
							imageText.article_id = req.params.id;
							db.collection('images').insert(imageText, function(err, result){
								console.log(result);
								if(err) throw err;
								io.sockets.emit('getImage' + req.params.id, imageText);
								res.redirect("/articles/" + req.params.id);
							});
					  });
					}
				});
			}
			else{
				res.redirect("/articles/" + req.params.id);
			}
		},

		addComment : function (comment) {
			comment.plus = 1;
			console.log('Adding comment: ' + JSON.stringify(comment));
			db.collection('comments').insert(comment, function(err, result){
				console.log(result);
				var newComment = {};
				newComment.id = result[0]._id;
				newComment.name = result[0].nickname;
				newComment.content = result[0].content;
				newComment.time = result[0]._id.getTimestamp();
				newComment.plus = result[0].plus;
				
				console.log("Comment name: " + JSON.stringify(newComment));
				io.sockets.emit('newComment' + result[0].article_id, newComment);
			});
		},
		
		plus : function(req, res){
			console.log(JSON.stringify(req.body));
			var plus = req.body.plus == "true" ? 1 : -1;
			db.collection('comments').updateById(req.body.id, {$inc:{plus: plus}}, function(err, result){
				console.log(result);
				db.collection('comments').findById(req.body.id, function(err, result){
					console.log(JSON.stringify(result));
					var p = req.body;
					p.n = result.plus;
					io.sockets.emit('getPlus' + req.params.id, p);
					if(!req.session.plus)
						req.session.plus = {};
					req.session.plus[req.body.id] = req.body.plus == "true" ? true : false;
					req.session.save();
				});
			});
		},
		
		point : function (req, res) {
			if(req.session.valid && req.session.valid[req.params.id]){
				console.log(JSON.stringify(req.body));
				db.collection('comments').updateById(req.body.id, {$set:{point: req.body.point}}, function(err, result){
					console.log(result);
					console.log("Point id: " + req.params.id);
					io.sockets.emit('setComment' + req.params.id, req.body);
				});
			}
			else{
				res.redirect("/articles/" + req.params.id);
			}
		},
		
		outcry : function (req, res) {
			if(req.session.valid && req.session.valid[req.params.id]){
				db.collection('inputs').insert(req.body, function(err, result){
					if(!err){
						console.log(result);
						io.sockets.emit('getInput' + req.params.id, result[0]);
					}
				});
			}
			else{
				res.redirect("/articles/" + req.params.id);
			}
		}
	};
}