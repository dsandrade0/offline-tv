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
  let id = result.query['id'];
  let type = result.query['type']

  let uri = ''
  if (type == 'film') {

    uri = getFilms()[id].uri
  }

  const videoPath = uri
  const videoStat = fs.statSync(videoPath);
  const fileSize = videoStat.size;
  const head = {
    'Content-Length': fileSize,
    'Content-Type': 'video/mp4',
  };
  res.writeHead(200, head);
  fs.createReadStream(videoPath).pipe(res);
});

app.get('/video', function (req, res) {
  let result = url.parse(req.url, true);
  let id = result.query['id'];
  res.render('pages/tv', {films: getFilms(), id: id});
})

app.get('/sportv', function (req, res) {
  var result = url.parse(req.url, true);
  var id = result.query['id'];
  res.render('pages/sportv', {tvs: tvs, id: id});
});

app.get('/premier', function (req, res) {
  var result = url.parse(req.url, true);
  var id = result.query['id'];
  res.render('pages/premier', {tvs: tvs, id: id});
});

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
