var express = require('express');
var app = express();

var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redis = require('redis');
var client = redis.createClient();
//Se almacenan las variables de sesión
var session = require('express-session');
var RedisStore = require('connect-redis')(session);

var passport = require('passport');

var flash = require('connect-flash');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const path = require('path');
var _ = require('lodash');

var swig = require('swig');

var usuarios = [];
var clientes = [];

var Usuario = require('./models/usuario');
var Imagen = require('./models/imagenes');

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.set('view cache', false);
swig.setDefaults({cache: false});

app.use(logger('dev'));
app.use(bodyParser()); // Para subir archivo
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
  store: new RedisStore({}),
  secret:'nextapp'
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

passport.deserializeUser(function (obj, done) {
  console.log('Deserilize: ' + obj);
  done(null, obj);
});

passport.serializeUser(function (user, done) {
  console.log('Serilize: ' + user);
  done(null, user);
});

var routes = require('./routes/routes');
routes(app);

var local = require('./connections/local');
local(app);

var twitter = require('./connections/twitter');
twitter(app);

function storeMessages(usuario, imagen) {
  var objeto = new Imagen({usuario: usuario, imagen: imagen});
  objeto.save(function (err, imagen) {
    if (err) {console.log(err);}
    console.log(imagen);
  });
}

io.on('connection', function (socket) {
  socket.on('disconnect', function() {
    console.log('Usuario Desconectado');
    client.hdel("usuarios", socket.id);
  });

  socket.on('chat message', function (msj) {
    var match = /@([^@]+)@/.exec(msj.imagen);
    if (match != null) {
      client.hgetall("usuarios", function (err, usuarios) {
        _.forEach(usuarios, function (x, y) {
          console.log(x, y);
          if (x == match[1]) {
            socket.emit('chat message', msj);
            socket.broadcast.in(y).emit('chat message', msj);
          }
        });
      });
    } else {
      io.emit('chat message', msj);
      console.log(msj);
      storeMessages(msj.usuario, msj.imagen);
    }
  });
  socket.on('new user', function (nombre) {
    console.log(socket.id);
    client.hset("usuarios", socket.id.toString(), nombre);
    client.hgetall("usuarios", function (err, usuarios) {
      io.emit('new user', usuarios);
    });

    Imagen.find({}).exec(function (err, imagenes) {
      if (err) {console.log(err);};
      imagenes.forEach(function (imagen, i) {
        socket.emit('chat message', imagen);
      });
    });
  });
});

// Código para subir imágenes
var multipart = require('connect-multiparty');
app.use(multipart());

app.post('/subir', function (req, res) {
  if(req.files.miarchivo){
    var tipo = req.files.miarchivo.type;
    if (tipo == 'image/png' || tipo == 'image/jpg' || tipo == 'image/gif' || tipo == 'image/jpeg') {
        var fs = require('fs');
        var tmpPath = req.files.miarchivo.path;
        var targetPath = path.resolve('./public/uploads/');
        var aleatorio = Math.floor((Math.random()*999)+1);
        var nombreArchivo = aleatorio + '-' + req.files.miarchivo.name;

        fs.rename(tmpPath, path.join(targetPath, nombreArchivo), function (err) {
          if(err){
            return res.send('Error en el nombre del archivo o la ruta');
          }
          fs.unlink(tmpPath, function (err) {
            // res.send('El usuario: <strong>' + req.session.passport.user.usuario + '</strong>  subió imagen: <br><a href="/index"><img src="./uploads/'+nombreArchivo+'" />');
              res.render('subir', {
                src:'./uploads/'+nombreArchivo,
                usuario: req.session.passport.user.usuario
              });
          });
        });
    } else {
      res.send('El tipo de archivo es inválido');
    }
  } else {
    res.send('No se adjunto archivo.');
  }
});

server.listen(3000, function() {
  console.log('Servidor corriendo en el puerto 3000');
});
