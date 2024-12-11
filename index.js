require('dotenv').config();
const express = require('express');
const dns = require('dns');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(`${process.cwd()}/public`));

// Base de datos en memoria
let urlDatabase = {};
let counter = 1;

// Middleware para loguear todas las solicitudes entrantes
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`, req.body);
  next();
});

// Función para validar URLs
const isValidUrl = (url) => {
  try {
    const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

// Generar un código corto único secuencial
const generateShortCode = () => {
  return counter++;
};

// Endpoint raíz
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Endpoint para manejar la solicitud de acortamiento de URL
app.post('/api/shorturl', (req, res) => {
  let originalUrl = req.body.url;

  // Usar URL por defecto si no se proporciona
  if (!originalUrl) {
    originalUrl = 'https://freeCodeCamp.org';
  }

  // Validar la URL
  if (!isValidUrl(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  const host = new URL(originalUrl.startsWith('http') ? originalUrl : `https://${originalUrl}`).hostname;

  // Verificar si el dominio existe
  dns.lookup(host, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Verificar si ya existe un código para la URL
    let shortUrlCode = Object.keys(urlDatabase).find(key => urlDatabase[key] === originalUrl);

    if (!shortUrlCode) {
      shortUrlCode = generateShortCode(); // Crear nuevo código
      urlDatabase[shortUrlCode] = originalUrl;
    }

    // Respuesta JSON esperada
    res.json({
      original_url: originalUrl,
      short_url: parseInt(shortUrlCode, 10)
    });
  });
});


// Endpoint para redirigir a la URL original
app.get('/api/shorturl/:shortUrlCode', (req, res) => {
  const shortUrlCode = req.params.shortUrlCode;
  const originalUrl = urlDatabase[shortUrlCode];

  if (!originalUrl) {
    return res.json({ error: 'No short URL found for the given code' });
  }

  // Redirigir
  res.redirect(originalUrl);
});

// Configurar el puerto para el servidor
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
