import fs from 'fs';
import https from 'https';
import path from 'path';

const models = [
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model-shard1',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2',
    'face_expression_model-weights_manifest.json',
    'face_expression_model-shard1',
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2'
];

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const outputDir = './public/models';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const download = (file) => {
    const url = `${baseUrl}/${file}`;
    const dest = path.join(outputDir, file);
    const fileStream = fs.createWriteStream(dest);

    https.get(url, (response) => {
        response.pipe(fileStream);
        fileStream.on('finish', () => {
            fileStream.close();
            console.log(`Downloaded: ${file}`);
        });
    }).on('error', (err) => {
        fs.unlink(dest);
        console.error(`Error downloading ${file}: ${err.message}`);
    });
};

models.forEach(download);
