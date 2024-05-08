import {app} from '../server';
import fs from 'fs';
import {IPostService} from '../contracts/IPostService';
import {PostError} from '../utils/customErrors';
import * as path from "node:path";

/**
 * Set up the routes for the app.
 */
export function setupRoutes(postService: IPostService) {

    // Serve the list of GunDB servers
    app.get('/servers', (req, res) => {
            try {
                const serversPath = path.join(__dirname, '../../servers.json');
                fs.readFile(serversPath, (err: any, data: any) => {
                    if (err) {
                        res.status(500).send(PostError.SERVER_ERROR);
                        return;
                    }
                    res.json(JSON.parse(data));
                });
            } catch (error) {
                res.status(500).send(PostError.SERVER_ERROR);
            }
    });

    app.post('/api/post', async (req, res) => {
        try {
            const post = req.body;
            const newPost = await postService.createPost(post);
            res.status(201).json(newPost); // Created
        } catch (error: any) {
            res.status(400).json({error: error.message}); // Bad Request
        }
    });

    app.delete('/api/post/:postId', async (req, res) => {
        try {
            const postId = req.params.postId;
            await postService.deletePost(postId);
            res.status(204).send(); // No Content
        } catch (error) {
            res.status(404).json({error: PostError.POST_NOT_FOUND.message}); // Not Found
        }
    });

    app.put('/api/post', async (req, res) => {
        try {
            const post = req.body;
            const updatedPost = await postService.updatePost(post);
            res.status(200).json(updatedPost); // OK
        } catch (error) {
            res.status(404).json({error: PostError.POST_NOT_FOUND.message}); // Not Found
        }
    });

    app.get('/api/getAll', async (req, res) => {
            try {
                const posts = await postService.getAllContent();
                res.status(200).json(posts); // OK
            } catch (error) {
                res.status(500).json({error: PostError.SERVER_ERROR.message}); // Internal Server Error
            }
    });

    app.get('/api/getPosts', async (req, res) => {
            try {
                const showDeleted = req.query.showDeleted === 'true';
                const posts = await postService.getAllPosts(showDeleted);
                res.status(200).json(posts); // OK
            } catch (error) {
                res.status(500).json({error: PostError.SERVER_ERROR.message}); // Internal Server Error
            }
    });

    app.get('/api/getPostById/:postId', async (req, res) => {
        try {
            const postId = req.params.postId;
            const post = await postService.getPostById(postId);
            res.status(200).json(post); // OK
        } catch (error) {
            res.status(404).json({error: PostError.POST_NOT_FOUND.message}); // Not Found
        }
    });

    app.get('/api/getCommentById/:postId', async (req, res) => {
        try {
            const postId = req.params.postId;
            const comment = await postService.getCommentById(postId);
            res.status(200).json(comment); // OK
        } catch (error) {
            res.status(404).json({error: PostError.POST_NOT_FOUND.message}); // Not Found
        }
    });

    app.get('/api/getCommentsByPostId/:postId', async (req, res) => {
            try {
                const postId = req.params.postId;
                const comments = await postService.getCommentsByPostId(postId);
                res.status(200).json(comments); // OK
            } catch (error) {
                res.status(404).json({error: PostError.POST_NOT_FOUND.message}); // Not Found
            }
    });

    app.get('/api/getPostsByUserId/:userId', async (req, res) => {
        try {
            const userId = req.params.userId;
            const posts = await postService.getPostsByUserId(userId);
            res.status(200).json(posts); // OK
        } catch (error) {
            res.status(404).json({error: PostError.POST_NOT_FOUND.message}); // Not Found
        }
    });

    app.get('/api/getCommentsByUserId/:userId', async (req, res) => {
        try {
            const userId = req.params.userId;
            const comments = await postService.getCommentsByUserId(userId);
            res.status(200).json(comments); // OK
        } catch (error) {
            res.status(404).json({error: PostError.POST_NOT_FOUND.message}); // Not Found
        }
    });

    app.get('/api/getPostsCommentedByUser/:userId', async (req, res) => {
        try {
            const userId = req.params.userId;
            const posts = await postService.getPostsCommentedByUser(userId);
            res.status(200).json(posts); // OK
        } catch (error) {
            res.status(500).json({error: PostError.SERVER_ERROR.message}); // Internal Server Error
        }
    });

}
