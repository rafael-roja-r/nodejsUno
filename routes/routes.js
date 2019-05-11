var usuario = require('../controllers/usuario');

var rutas = function(app){

	app.get('/registro', function (req, res){
		res.render('registro');
	});

	app.get('/', function (req, res){
		res.render('login');
	});

	app.get('/lista', function (req, res){
		res.render('lista');
	});

	app.get('/canvas', function (req, res){
		res.render('index', {
			imgUsuario: req.query.img||'',
			usuario: req.session.passport.user.nombre
		});
	});

	app.get('/error', function (req, res){
		res.send(req.session.flash.error[0]);
	});


	app.post('/registro', usuario.registro, function(req, res){
		res.redirect('/');
	});
};

module.exports = rutas;
