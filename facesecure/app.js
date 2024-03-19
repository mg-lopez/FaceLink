// Opencv Package for Node.js
var express = require('express');
const cv = require('@u4/opencv4nodejs');
const fs = require('fs');
const path = require('path');
var bodyParser = require('body-parser');

// Run the Express Server
var app = express();
// absolute path for files being sent
var absolutePath = path.resolve('../public', 'index.html');
console.log(absolutePath);

// for middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(bodyParser.json({limit: "50mb"}));
// serve the main page at first
app.get('/index.html', function (req, res) {
    console.log("user requested index page");
    res.sendFile(__dirname + "/" + "index.html");
    res.sendFile(absolutePath);
})

// Prepare output in JSON format once the user requests a login
app.get('/login', function (req, res) {
  response = {
      username:req.query.username,
      password:req.query.password
  };
  console.log("user sent login information");
  console.log(response);
  // test if input is valid, if so, next phase
  if (response.username == "$username" && response.password == "$password") {
      res.sendFile(__dirname + "/public/capture.html");
  }
  // else send the original webpage back to the user
  else {
      res.sendFile(__dirname + "/public/index.html");
  }
});

// set confidence values and image label determine by face recognition algorithm
var confValue = 0;
var imgLabel = "";

// if user uploads image for facial regonition
app.post('/upload', async (req, res, next) => {
    try {
        var response = {
            fileData:req.body.fileData,
        };
        console.log("user sent photo information");
        // get the base64 encoding of the sent image
        var data = response.fileData;
        // remove misc information sent with it
        var imgData = data.replace(/^data:image\/png;base64,/, "");
        // output for testing
        console.log(imgData);

        // save the encoded png to a file called output
        require("fs").writeFile("data/faces/output.png", imgData, "base64", function(err) {
            console.log(err);
        });
        // wait for image to be processed, then apply facial recognition
        setTimeout(checkFace, 500);
        // if within threshold value and name matches username, then send the final page, else reset
        setTimeout(function() {
            if (confValue < 85.0 && imgLabel == "miguel") {
                res.sendFile(__dirname + "/public/final.html");
            }
            else {
                res.sendFile(__dirname + "/public/index.html");
            }
        }, 500);

    } catch (e) {
        next(e)
    }
});

// Start server at localhost:8081
var server = app.listen(8081, '127.0.0.1', function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Server is listening at http://%s:%s", host, port)
});

// facial recognition algorithm
async function checkFace() {
    // set the cascade classifier for the file
    const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);
    // detect the face within the grey image.
    const getFaceImage = (grayImage) => {
        const faceRegion = classifier.detectMultiScale(grayImage).objects;
        if (!faceRegion.length) {
            throw new Error('failed to detect faces');
        }
        return grayImage.getRegion(faceRegion[0]);
    };
    // get the path of the photo directory
    const basePath = '../web-face-auth-app/data';
    const nameMappings = ['daryl', 'rick', 'negan'];
    const subjectsPath = path.resolve(basePath, 'faces');
    
    // get the absolute path
    const allFiles = fs.readdirSync(subjectsPath);    

    // map absolute file path for all images, then convert to grayscale, then get face image, then resize
    const images = allFiles
        .map(file => path.resolve(subjectsPath, file))
        .map(filePath => cv.imread(filePath))
        .map(image => image.bgrToGray())
        .map(getFaceImage)
        .map(faceImg => faceImg.resize(100, 100));

    const isTargetImage = (_, i) => allFiles[i].includes('output');
    const isTrainingImage = (_, i) => !isTargetImage(_, i);
    // use images without the label for training the recognizer
    const trainImages = images.filter(isTrainingImage);
    // use images with the label for testing with the recognizer
    const testImages = images.filter(isTargetImage);
    // map all names of people to images of them, based on filename
    const labels = allFiles.filter(isTrainingImage)
        .map(file => nameMappings.findIndex(name => file.includes(name)));
    // use local binary patterns histograms (LBP) algorightm
    const lbph = new cv.LBPHFaceRecognizer();
    // train the images
    lbph.train(trainImages, labels);
    // run the recognizer
    const runPrediction = (recognizer) => {
        testImages.forEach((image) => {
            const result = recognizer.predict(image);
            confValue = result.confidence;
            imgLabel = nameMappings[result.label]
            console.log('Predicted Individual: %s, Confidence Distance: %s', imgLabel, confValue);
        });
    };
    // output results
    console.log('lbph:');
    runPrediction(lbph);
}