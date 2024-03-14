import { PostService } from '../services/postService';
import { app } from '../server';
import fs from 'fs';
import { IPostService } from '../contracts/IPostService';
import { PostError } from '../utils/customErrors';

/**
 * Set up the routes for the app.
 */
export function setupRoutes(postService: IPostService) {

    // Serve the list of GunDB servers
    app.get('/servers', (req, res) => {
        fs.readFile('servers.json', (err:any, data:any) => {
            if (err) {
                res.status(500).send(PostError.SERVER_ERROR);
                return;
            }
            res.json(JSON.parse(data));
        });
    });

    app.post('/api/post', async (req, res) => {
        try {
            const post = req.body;
            const newPost = await postService.createPost(post);
            res.status(201).json(newPost); // Created
        } catch (error: any) {
            res.status(400).json({ error: error.message }); // Bad Request
        }
    });

    app.delete('/api/post/:postId', async (req, res) => {
        try {
            const postId = req.params.postId;
            await postService.deletePost(postId);
            res.status(204).send(); // No Content
        } catch (error) {
            res.status(404).json({ error: PostError.POST_NOT_FOUND.message }); // Not Found
        }
    });

    app.put('/api/post', async (req, res) => {
        try {
            const post = req.body;
            const updatedPost = await postService.updatePost(post);
            res.status(200).json(updatedPost); // OK
        } catch (error) {
            res.status(404).json({ error: PostError.POST_NOT_FOUND.message }); // Not Found
        }
    });

    app.get('/api/getPosts', async (req, res) => {
        const showDeleted = req.query.showDeleted === 'true';
        const posts = await postService.getAllPosts(showDeleted);
        res.status(200).json(posts); // OK
    });

    app.get('/api/getPostById/:postId', async (req, res) => {
        try {
            const postId = req.params.postId;
            const post = await postService.getPostById(postId);
            res.status(200).json(post); // OK
        } catch (error) {
            res.status(404).json({ error: PostError.POST_NOT_FOUND.message }); // Not Found
        }
    });

    app.get('/api/getCommentsByPostId/:postId', async (req, res) => {
        const postId = req.params.postId;
        const comments = await postService.getCommentsByPostId(postId);
        res.status(200).json(comments); // OK
    });

    app.get('/api/getPostsByUserId/:userId', async (req, res) => {
        const userId = req.params.userId;
        const posts = await postService.getPostsByUserId(userId);
        res.status(200).json(posts); // OK
    });

    app.get('/api/getPostWithChildren/:postId', async (req, res) => {
        try {
            const postId = req.params.postId;
            const postWithChildren = await postService.getPostWithChildren(postId);
            res.status(200).json(postWithChildren); // OK
        } catch (error) {
            res.status(404).json({ error: PostError.PARENT_POST_NOT_FOUND.message }); // Not Found
        }
    });
}
