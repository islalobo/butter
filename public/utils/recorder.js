'use strict';

// Declare some variables
const title = document.querySelector('#title').innerHTML;
const recordingIndicator = document.querySelector('#recording-indicator');
const recordButton = document.querySelector('#record');
const stopButton = document.querySelector('#stop');
const playButton = document.querySelector('#play');
const deleteButton = document.querySelector('#delete');
const sendButton = document.querySelector('#send');
const sendAudioMessagesContainer = document.querySelector('#audio-messages');

let recorder;
let audio;
let currentMessage;

// When the app is recording, show the gif
// Set default recording hidden attribute
const setDefaultRecordingState = () => {
  recordingIndicator.hidden = true;
  // document.querySelector('#header-gif').setAttribute('disabled', recordingIndicator.getAttribute('hidden'));
}
setDefaultRecordingState();

// Record audio
const recordAudio = () =>
  new Promise(async resolve => {          
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    let audioChunks = [];

    mediaRecorder.addEventListener('dataavailable', event => {
      audioChunks.push(event.data);
    });

    const start = () => {
      recordingIndicator.hidden = false;

      audioChunks = [];
      mediaRecorder.start();
    };

    const stop = () =>
      new Promise(resolve => {
        recordingIndicator.hidden = true;

        mediaRecorder.addEventListener('stop', () => {
          const audioBlob = new Blob(audioChunks);
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          const play = () => audio.play();
          resolve({ audioChunks, audioBlob, audioUrl, play });
        });

        mediaRecorder.stop();
      });

    resolve({ start, stop });
  });

// Save Audio
const saveMessage = async function(base64AudioMessage) {
await fetch('/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: base64AudioMessage })
  }).then(res => {
    if (res.status === 201) {
      const response = res.json()
      .then(response => {
        populateAudioMessages(response.id);
      });
    }
    console.log('Invalid status saving audio message: ' + res.status);
  });
  return true;
}

const populateAudioMessages = (id) => {
  return fetch('/messages').then(res => {
    if (res.status === 200) {
      return res.json().then(json => {
        json.messageFilenames.forEach(filename => {
          if (filename === id) {
            let audioElement = document.querySelector(`[data-audio-filename="${filename}"]`);
            if (!audioElement) {
              // audio stuff and then some
              audioElement = document.createElement('audio');
              audioElement.src = `/messages/${filename}`;
              audioElement.setAttribute('data-audio-filename', filename);
              audioElement.setAttribute('controls', true);
              
              // save the current message
              currentMessage = audioElement.src;
              
              // populate the most recent message in the container
              sendAudioMessagesContainer.prepend(audioElement);
            }
          }
        });
      });
    }
    console.log('Invalid status getting messages: ' + res.status);
  });
};

// Event Listeners
recordButton.addEventListener('click', async () => {
  recordButton.setAttribute('disabled', true);
  stopButton.removeAttribute('disabled');
  playButton.setAttribute('disabled', true);
  deleteButton.setAttribute('disabled', true);
  sendButton.setAttribute('disabled', true);
  // todo, if there is existing audio then delete it
  if (!recorder) {
    recorder = await recordAudio();
  }
  recorder.start();
});

stopButton.addEventListener('click', async () => {
  sendAudioMessagesContainer.innerHTML = ''; // wipe any audio that was there before

  // set button states accordingly 
  recordButton.removeAttribute('disabled');
  stopButton.setAttribute('disabled', true);
  playButton.removeAttribute('disabled');
  deleteButton.removeAttribute('disabled');
  sendButton.removeAttribute('disabled');

  // stop recording
  audio = await recorder.stop();

  // start saving mesage process...
  const reader = new FileReader();
  reader.readAsDataURL(audio.audioBlob);
  reader.onload = async () => {
    const base64AudioMessage = reader.result.split(',')[1];
    // save message
    await saveMessage(base64AudioMessage);

  };
});

playButton.addEventListener('click', () => {
  audio.play();
});

sendButton.addEventListener('click', (event) => {
  sendAudioMessagesContainer.innerHTML = ''; // clear out audio, bye!

  // set button states accordingly 
  recordButton.removeAttribute('disabled');
  stopButton.setAttribute('disabled', true);
  playButton.setAttribute('disabled', true);
  deleteButton.setAttribute('disabled', true);
  sendButton.setAttribute('disabled', true);

  window.open(
    `mailto:thesoundofourvoices@gmail.com?`
    + `subject=${title}&`
    + `body=${currentMessage}`,
    '_parent'
    );
});

deleteButton.addEventListener('click', (event) => {
  sendAudioMessagesContainer.innerHTML = ''; // clear out audio, bye!

  // set button states accordingly 
  recordButton.removeAttribute('disabled');
  stopButton.setAttribute('disabled', true);
  playButton.setAttribute('disabled', true);
  deleteButton.setAttribute('disabled', true);
  sendButton.setAttribute('disabled', true);

  // todo, get the filename from the audio and delete
  fetch('/messages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'fake_id' })
    }).then(res => {
      if (res.status === 201) {
        const response = res.json()
        .then(response => {
          console.log(response);
        });
      }
      console.log('Invalid status saving audio message: ' + res.status);
    });
    return true;
});