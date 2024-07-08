const fs = require("node:fs");
const url = require('url');
const express = require('express');
const bodyParser = require('body-parser');


const app = express();
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use((req, res, next) => {
  if (!isConfig() && req.url !== '/config') {
    res.render("pages/config")
  } else {
    next()
  }
})

app.post('/config',  function (req, res) {
  const path = req.body.path
  fs.writeFileSync('./config.json', JSON.stringify(req.body))
  app.use(express.static(path))
  res.render("pages/index")
});

app.get('/', async function (req, res) {
  if (isConfig()) {
    res.render('pages/index');
  } else {
    res.render('pages/config');
  }
});

app.get('/films', function (req, res) {
  let films = getFilms();
  res.render('pages/films', {films: films});
});

app.get('/tv', function (req, res) {
  let result = url.parse(req.url, true);
  let type = result.query['type']
  let id = result.query['id'];
  let uri = ''
  if (type == 'film') {
    uri = getFilms()[id].uri
  }

  const videoPath = uri; // Path to your video file
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

app.get('/video', function (req, res) {
  let result = url.parse(req.url, true);
  let id = result.query['id'];
  res.render('pages/tv', {films: getFilms(), id: id});
})


app.listen(3000, function () {
  console.log('Rodando o servidor na porta 3000 ...');
});

function getFilms() {
  const config = fs.readFileSync('config.json')
  const globalPath = JSON.parse(config).path
  const filmsfolderPath = globalPath + '/films'

  const folders = fs.readdirSync(filmsfolderPath).filter(f => !f.startsWith(".DS_Store"))
  let films = []
  let id = 0;
  folders.forEach(f => {
    const path = filmsfolderPath + "/" + f
    const video = fs.readdirSync(path).filter(file => file.endsWith(".mp4") || file.endsWith(".mkv")).pop()
    if (video) {
      const dados = {
        id: id++,
        title: f,
        uri: path + "/" + video
      }
      films.push(dados)
    }
  })
  return films;
}

function isConfig() {
  try {
    fs.readFileSync('config.json')
    return true
  } catch (e) {
    return false
  }
}
