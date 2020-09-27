const express = require('express');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { promisify } = require('util');
const { v4 } = require('uuid');

const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);

// make sure messages folder exists
const messageFolder = './public/messages/';
if (!fs.existsSync(messageFolder)) {
  fs.mkdirSync(messageFolder);
}

const audioFolder = './public/messages/mp3/';
if (!fs.existsSync(messageFolder)) {
  fs.mkdirSync(messageFolder);
}

const app = express();
app.use(express.json({limit: '50mb', extended: true}));
app.use(express.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(express.static('public'));
app.use(express.json());

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
      console.log('messages was saved!');
      try {
        console.log('attempting to make an mp3 ', `${messageFolder}${messageId}`, `${audioFolder}${messageId}.mp3`);
        const process = new ffmpeg(`${messageFolder}${messageId}`);
        process.then((audio) => {
          console.log('audio is ready to be processed ', audio);
          audio.fnExtractSoundToMP3(`${audioFolder}${messageId}.mp3`, (error, file) => {
            console.log('There is an error ', error);
            console.log('There is a file ', file);
            if (!error) {
              console.log('Audio File ', file);
              const file = file;
              console.log('what a success, ', messageId && messageId, file && file);
              res.status(201).json({
                message: 'Saved message',
              });
            }
          })
        }, (err) => {
          console.log('An error occurred, ', err);
        });
      } catch(e) {
        console.log('error code ', e.code);
        console.log('error message ', e.msg);
      }

    // res.status(201).json({
    //   message: 'Saved message',
    //   id: messageId,
    // });
  })
  .catch(err => {
    console.log('Error writing message to file', err);
    res.sendStatus(500);
  });
});

const PORT = process.env.PORT || 3545;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
