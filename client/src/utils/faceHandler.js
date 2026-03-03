import * as faceapi from '@vladmandic/face-api';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import axios from 'axios';

class FaceHandler {
    constructor() {
        this.isModelsLoaded = false;
        this.isCocoLoaded = false;
        this.cocoModel = null;
        this.users = null;
        this.faceMatcher = null;
        this.loadingPromise = null;
        this.cocoLoadingPromise = null;
    }

    async loadModels() {
        if (this.isModelsLoaded) return;
        if (this.loadingPromise) return this.loadingPromise;

        this.loadingPromise = (async () => {
            try {
                console.log("[FaceHandler] Initializing AI Engines...");

                // Set production mode for TFJS
                if (faceapi.tf && faceapi.tf.env) {
                    faceapi.tf.env().set('DEBUG', false);
                }

                // Try WebGL first, fallback to CPU if it fails
                try {
                    if (!faceapi.tf.getBackend()) {
                        await faceapi.tf.setBackend('webgl');
                    }
                    await faceapi.tf.ready();
                } catch {
                    console.warn("[FaceHandler] WebGL not available, falling back to CPU");
                    await faceapi.tf.setBackend('cpu');
                    await faceapi.tf.ready();
                }

                // Use relative path for models, compatible with Vite/Render
                const MODEL_URL = '/models';
                console.log("[FaceHandler] Loading Face AI Models from:", MODEL_URL);

                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
                ]).catch(err => {
                    console.error("[FaceHandler] Specific model file missing:", err);
                    throw new Error("Missing AI model files in /public/models");
                });

                this.isModelsLoaded = true;
                console.log("[FaceHandler] Face AI Models Ready.");
            } catch (err) {
                console.error("[FaceHandler] Face Model Loading Failed:", err);
                throw err;
            } finally {
                this.loadingPromise = null;
            }
        })();

        return this.loadingPromise;
    }

    async loadCoco() {
        if (this.isCocoLoaded) return this.cocoModel;
        if (this.cocoLoadingPromise) return this.cocoLoadingPromise;

        this.cocoLoadingPromise = (async () => {
            try {
                console.log("[FaceHandler] Loading Object Detection (COCO-SSD)...");
                this.cocoModel = await cocoSsd.load();
                this.isCocoLoaded = true;
                console.log("[FaceHandler] Object Detection Ready.");
                return this.cocoModel;
            } catch (err) {
                console.error("[FaceHandler] COCO loading failed:", err);
                // Don't throw, just allow system to work without object detection
                return null;
            } finally {
                this.cocoLoadingPromise = null;
            }
        })();
        return this.cocoLoadingPromise;
    }

    async loadAll() {
        try {
            await this.loadModels();
            await this.loadCoco();
            await this.loadUsers(); // Pre-load user biometrics
        } catch (err) {
            console.error("[FaceHandler] LoadAll Failed:", err);
        }
    }

    async loadUsers() {
        if (this.users) return this.users;
        try {
            console.log("[FaceHandler] Syncing User Biometrics Database...");
            const { data } = await axios.get('/api/auth/users');
            this.users = data;

            const labeledDescriptors = data
                .filter(u => u.faceDescriptor && (Array.isArray(u.faceDescriptor) ? u.faceDescriptor.length > 0 : Object.keys(u.faceDescriptor).length > 0))
                .map(u => {
                    const descData = Array.isArray(u.faceDescriptor)
                        ? u.faceDescriptor
                        : Object.values(u.faceDescriptor);

                    // Ensure the descriptor is exactly 128 values
                    if (descData.length === 128) {
                        const desc = new Float32Array(descData);
                        return new faceapi.LabeledFaceDescriptors(u._id, [desc]);
                    }
                    return null;
                })
                .filter(ld => ld !== null);

            if (labeledDescriptors.length > 0) {
                this.faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.55);
                console.log(`[FaceHandler] Biometric Matcher Ready with ${labeledDescriptors.length} users.`);
            } else {
                console.warn("[FaceHandler] No users with biometric data found.");
            }

            return this.users;
        } catch (err) {
            console.error("[FaceHandler] User Sync Failed:", err);
            throw err;
        }
    }

    getMatcher() {
        return this.faceMatcher;
    }

    getUserById(id) {
        return this.users?.find(u => u._id === id);
    }
}

const faceHandler = new FaceHandler();
export default faceHandler;

