import express from 'express';
import GUN from 'gun';
import 'gun/sea';
import dotenv from 'dotenv';
import {setupRoutes} from './routes/routes';
import {PostService} from './services/postService';

dotenv.config();

/**
 * Creates an Express application.
 *
 * @returns {Object} The Express application object.
 */
const app = express();
/**
 * The port for the server to listen on.
 *
 * The value of the port is determined in the following way:
 * 1. If the environment variable `process.env.PORT` is defined,
 *    the value of `port` will be set to `process.env.PORT`.
 * 2. If `process.env.PORT` is not defined, the value of `port`
 *    will default to `3000`.
 *
 * @type {number}
 */
const port = process.env.PORT || 3000;

/**
 * Configures the Express application with static files, JSON parsing middleware,
 * and sets up API routes. Also initializes GunDB for use within the service layer.
 */
app.use(express.static('public')); // Serve static files from the 'public' directory
app.use(express.json()); // Parse JSON bodies

/**
 * Starts the server on the specified port and logs a message when it is listening.
 *
 * @param {number} port - The port number to listen on.
 * @returns {Server} - The server instance.
 */
const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

// Set up API routes
setupRoutes(new PostService());

app.get('/status', (req, res) => {
    res.status(200).send('Server is running');
});

// Initialize Gun with server instance and optional S3 for persistence
/**
 * Represents a Gun object for data persistence and synchronization.
 *
 * @class
 * @constructor
 * @param {Object} configs - Configuration options for Gun.
 * @param {Object} configs.web - Options for web-based persistence.
 * @param {Object} configs.file - Options for local file persistence.
 * @param {Object} configs.s3 - Options for AWS S3 persistence.
 * @param {string} configs.s3.key - AWS access key ID.
 * @param {string} configs.s3.secret - AWS secret access key.
 * @param {string} configs.s3.bucket - AWS S3 bucket name.
 * @param {string} configs.s3.region - AWS region.
 */
const gun = GUN({
    web: server,
    file: 'data', // Local data persistence
    s3: { // AWS S3 persistence settings
        key: process.env.AWS_ACCESS_KEY_ID || '',
        secret: process.env.AWS_SECRET_ACCESS_KEY || '',
        bucket: process.env.AWS_S3_BUCKET || 'w37l',
        region: process.env.AWS_REGION || ''
    }
});

// Export gun for use in services
export { gun, app, server };
