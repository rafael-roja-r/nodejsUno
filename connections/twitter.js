var passport = require('passport'),
	passportTwitter = require('passport-twitter'),
	TwitterStrategy = passportTwitter.Strategy;

var Usuario = require('../models/usuario');

var twitterConnection = function (app) {
	passport.use(
		new TwitterStrategy(
		{
			consumerKey: 'B0cYFyr1fEKTv09IiIqA',
			consumerSecret: '5NfiNNTuzjLFzGeYYf6yVH6vDN4D5mLAHSS2pUb4m8',
			callbackURL: 'http://127.0.0.1:3000/auth/twitter/callback'
		},
		function (token, tokenSecret, profile, done) {
			Usuario.findOne({
				'twitter.id' : profile.id
			},
			function (err, user){
				if(err){
					return done(err);
				}
				if(!user){
					var datos = JSON.parse(profile._raw);
					delete profile._raw;
					delete profile._json;
					profile.data = datos;
					var dataForSave = {
						username : profile.username,
						twitter : JSON.stringify(profile),
						nombre : datos.name
					};
					var usuario = new Usuario(dataForSave);
					usuario.validate(function(err) {
						console.log('================================');
					    if(err){
								console.log(err);
								return done(new Error('Check it...'));
							}
								console.log('================================');
							usuario.save(function(err, user){
								if(err){
									done(err, null);
									return;
								}
								done(null, user);
							});
					});
				}else{

					return done(err, user);
				}
			});
		}
	));

	app.get('/auth/twitter',passport.authenticate('twitter'));

	app.get('/auth/twitter/callback', passport.authenticate('twitter', { successRedirect: '/lista', failureRedirect: '/error' }));
};

module.exports = twitterConnection;
