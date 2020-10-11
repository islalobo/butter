// Begin
const express = require('express');
const fs = require('fs');
const { promisify } = require('util');
const { v4 } = require('uuid');
const ffmpeg = require('ffmpeg');

// Define app
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));
app.use(express.json());
app.use(cors());

const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);

// make sure messages folder exists
const messageFolder = './public/messages/';
if (!fs.existsSync(messageFolder)) {
  fs.mkdirSync(messageFolder);
}

// make sure folder for each voice type audio exists
const voicesFolder = './public/audio';
if (!fs.existsSync(voicesFolder)) {
  fs.mkdirSync(voicesFolder);
}

const defaultVoicesFolder = './public/audio/default';
if (!fs.existsSync(defaultVoicesFolder)) {
  fs.mkdirSync(defaultVoicesFolder);
}

const aliveVoicesFolder = './public/audio/alive';
if (!fs.existsSync(aliveVoicesFolder)) {
  fs.mkdirSync(aliveVoicesFolder);
}

const animalVoicesFolder = './public/audio/animal';
if (!fs.existsSync(animalVoicesFolder)) {
  fs.mkdirSync(animalVoicesFolder);
}

const blackVoicesFolder = './public/audio/black';
if (!fs.existsSync(blackVoicesFolder)) {
  fs.mkdirSync(blackVoicesFolder);
}

const immigrantVoicesFolder = './public/audio/immigrant';
if (!fs.existsSync(immigrantVoicesFolder)) {
  fs.mkdirSync(immigrantVoicesFolder);
}

const queerVoicesFolder = './public/audio/queer';
if (!fs.existsSync(queerVoicesFolder)) {
  fs.mkdirSync(queerVoicesFolder);
}

const sisterVoicesFolder = './public/audio/sister';
if (!fs.existsSync(sisterVoicesFolder)) {
  fs.mkdirSync(sisterVoicesFolder);
}

// Setup Pages
var path = require('path');
var htmlPath = path.join(__dirname, 'public/voices');

app.use(express.static(htmlPath));

app.get('/', (req, res) => {})

// Methods
app.get('/messages', (req, res) => {
  readdir(messageFolder)
    .then(messageFilenames => {
      res.status(200).json({ messageFilenames });
    })
    .catch(err => {
      console.log('Error reading message directory', err);
      res.sendStatus(500);
    });
});

app.post('/messages', (req, res) => {
  if (!req.body.message) {
    return res.status(400).json({ error: 'No req.body.message' });
  }
  const messageId = v4();
  writeFile(messageFolder + messageId, req.body.message, 'base64')
    .then(() => {
      res.status(201).json({
        message: 'Saved message',
        id: messageId,
      });
    })
    .catch(err => {
      console.log('Error writing message to file', err);
      res.sendStatus(500);
    });
});

app.post('/convert', (req, res) => {
  console.log('trying to convert ', req.body.message);
  try {
    let process = new ffmpeg(`./public/messages/${req.body.message}`);
    process.then((audio) => {

      let type = req.body.type;
      if (!type) type = 'default';

      audio.fnExtractSoundToMP3(`./public/audio/${type}/${req.body.message}.mp3`, (error, file) => {
        if (!error) console.log('Audio File: ', file);
        if (error) console.log(error);
      });
    }, (error) => {
      console.log('Error: ', error);
    });
  }
  catch(error) {
    console.log(error.code, error.msg);
  }
});

app.delete('/messages', (req, res) => {
  // todo, delete message by id
  res.status(201).json({
    message: 'Nothing happened',
    id: req.body.id,
  });
});

const PORT = process.env.PORT || 3545;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
