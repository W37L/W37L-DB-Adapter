import express from 'express';
import GUN from 'gun';
import 'gun/sea';
import dotenv from 'dotenv';
import { setupRoutes } from './routes/routes';
import { PostService } from './services/postService';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

/**
 * Configures the Express application with static files, JSON parsing middleware,
 * and sets up API routes. Also initializes GunDB for use within the service layer.
 */
app.use(express.static('public')); // Serve static files from the 'public' directory
app.use(express.json()); // Parse JSON bodies

const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

// Set up API routes
setupRoutes(new PostService());
git
app.get('/status', (req, res) => {
    res.status(200).send('Server is running');
});

// Initialize Gun with server instance and optional S3 for persistence
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
