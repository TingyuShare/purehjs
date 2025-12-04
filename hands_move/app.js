const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const clearBtn = document.getElementById('clearBtn');
const loading = document.getElementById('loading');
const container = document.querySelector('.container');
const ctx = canvas.getContext('2d');

let model;
let detector;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// --- Drawing Setup ---
ctx.strokeStyle = '#00FFFF'; // Cyan color for drawing
ctx.lineWidth = 5;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

// --- Main Function ---
async function main() {
    try {
        // Load the hand pose detection model
        const model = handPoseDetection.SupportedModels.MediaPipeHands;
        const detectorConfig = {
            runtime: 'mediapipe', // or 'tfjs'
            solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
            modelType: 'lite' // 'full' or 'lite'
        };
        detector = await handPoseDetection.createDetector(model, detectorConfig);
        console.log("Hand-pose model loaded.");

        // Setup the camera
        await setupCamera();

        // Hide loading message and show the app
        loading.style.display = 'none';
        container.style.display = 'block';
        clearBtn.style.display = 'block';

        // Start the prediction loop
        predict();
    } catch (error) {
        console.error("Initialization failed:", error);
        loading.innerText = "Error: Could not load model or access camera. Please check permissions and console.";
    }
}

// --- Camera Setup ---
async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        'video': {
            width: 640,
            height: 480
        },
        'audio': false
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            video.width = video.videoWidth;
            video.height = video.videoHeight;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            console.log("Camera setup complete.");
            resolve(video);
        };
    });
}

// --- Prediction Loop ---
async function predict() {
    const hands = await detector.estimateHands(video, {
        flipHorizontal: false // We are flipping the video display with CSS instead
    });

    if (hands.length > 0) {
        const landmarks = hands[0].keypoints;
        
        // Keypoints: 4=thumb-tip, 8=index-finger-tip, 12=middle-finger-tip
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];

        // Calculate distance between thumb and middle finger
        const distance = Math.sqrt(
            Math.pow(thumbTip.x - middleTip.x, 2) +
            Math.pow(thumbTip.y - middleTip.y, 2)
        );

        // Define a threshold for the "pinch" gesture
        const pinchThreshold = 30; 

        // Flip the x-coordinate to match the mirrored video
        const mirroredX = canvas.width - indexTip.x;

        if (distance < pinchThreshold) {
            // Start or continue drawing
            if (!isDrawing) {
                // Started drawing, move to the first point
                ctx.beginPath();
                ctx.moveTo(mirroredX, indexTip.y);
                isDrawing = true;
            } else {
                // Continue drawing
                ctx.lineTo(mirroredX, indexTip.y);
                ctx.stroke();
            }
        } else {
            // Stop drawing
            if (isDrawing) {
                isDrawing = false;
            }
        }
    } else {
        // No hands detected, stop drawing
        isDrawing = false;
    }

    // Loop forever
    requestAnimationFrame(predict);
}


// --- Event Listeners ---
clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log("Canvas cleared.");
});

// --- Start the application ---
main();
