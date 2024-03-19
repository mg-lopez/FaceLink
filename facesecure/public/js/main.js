const player = document.getElementById('player');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const captureButton = document.getElementById('capturebutton');

function convertToImageData(canvas) {
  return canvas.toDataURL('image/png');
}

const constraints = {
  video: true
};

captureButton.addEventListener('click', () => {
  context.drawImage(player, 0, 0, canvas.width, canvas.height);
  var data = convertToImageData(canvas);
  console.log(data);
  document.getElementById('fileInput').value = data;
});

player.addEventListener('loadedmetadata', () => {
  player.play();
});

try {
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    player.srcObject = stream;
  });
} catch (err) {
  console.error('Failed to get user media:', err);
}