// import packages 
const cv = require('@u4/opencv4nodejs'); // contains pre-trained facial recognisers, trainers and cascades
const fs = require('fs'); // file system
const path = require('path'); //  path of files
  
const classifer = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2); // create a new classifier to detect faces => "HAAR_FRONTALFACE_ALT2"
const getFaceImage = (grayImg) => { // function to detect face within grey image.
    const faceRects = classifer.detectMultiScale(grayImg).objects; // detect faces in image
    if (!faceRects.length) { // if no face is detected
        throw new Error('No faces detected!'); // throw error message
    }
    return grayImg.getRegion(faceRects[0]); // return face image
};

const basePath = '../web-face-auth-app/data'; // path to training data
const subjectsPath = path.resolve(basePath, 'faces'); // path to images
const nameMappings = ['daryl', 'rick', 'negan']; // names of people in training data

const imgFiles = fs.readdirSync(subjectsPath); // read all files in the path

// To see if .DS_store is causing an error
// cconsole.log(allFiles.map(file => path.resolve(subjectsPath, file)))

const images = imgFiles
    .map(file => path.resolve(subjectsPath, file)) // map absolute paths to image files
    .map(filePath => cv.imread(filePath)) // read image
    .map(image => image.bgrToGray()) // convert to grey scale
    .map(getFaceImage) // detect face
    .map(FaceImg => FaceImg.resize(100, 100)); // resize image

const isTargetImage = (_, i) => imgFiles[i].includes('4');
const isTrainingImage = (_, i) => !isTargetImage(_, i); // images for training the recogniser
const trainImages = images.filter(isTrainingImage); //images testing the recogniser
const testImages = images.filter(isTargetImage); // make sure the images are in the same order as the labels
const labels = imgFiles.filter(isTrainingImage)
    .map(file => nameMappings.findIndex(name => file.includes(name))); // map the names to the images

const lbph = new cv.LBPHFaceRecognizer(); // Local Binary Patterns Histograms

lbph.train(trainImages, labels); 

// var confValues = 0;
const runPrediction = (recognizer) => {
    testImages.forEach((img) => {
        // console.log("Predicting image: " + img);
        const result = recognizer.predict(img); // predict the image
        confValue = result.confidence;
        console.log('Predicted: %s, Confidence: %s', nameMappings[result.label], result.confidence);
        cv.destroyAllWindows();
    });
};

console.log('lpbh:');
runPrediction(lbph);