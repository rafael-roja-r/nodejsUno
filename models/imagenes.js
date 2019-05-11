// Modelo para el manejo de las imágenes
var models = require('./models'),
Schema = models.Schema;

var imagenSchema = new Schema({
  usuario: String,
  imagen: String
});

var Imagenes = models.model('Imagen', imagenSchema, 'imagenes');
module.exports = Imagenes;
