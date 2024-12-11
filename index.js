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

let urlDatabase = {}; // Simularemos una base de datos en memoria

// Middleware para verificar que la URL sea válida
const isValidUrl = (url) => {
  const regex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+)\.([a-zA-Z]{2,})(\/[^\s]*)?$/;
  return regex.test(url);
};

// Generar un código corto único
const generateShortCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let shortCode = '';
  for (let i = 0; i < 7; i++) {
    shortCode += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return shortCode;
};

// Endpoint raíz
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Endpoint para manejar la solicitud de acortamiento de URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // Validar la URL
  if (!isValidUrl(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  const host = new URL(originalUrl).hostname; // Extraemos el dominio

  // Verificar si el dominio existe
  dns.lookup(host, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Generar un código corto único
    const shortUrlCode = generateShortCode();
    urlDatabase[shortUrlCode] = originalUrl; // Guardamos la URL en la base de datos

    // Enviar la respuesta con la URL original y la corta
    res.json({
      original_url: originalUrl,
      short_url: shortUrlCode
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

  // Redirigir a la URL original
  res.redirect(originalUrl);
});

// Configurar el puerto para el servidor
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
