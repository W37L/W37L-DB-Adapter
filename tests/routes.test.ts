import request from 'supertest';
import {app, server} from '../src/server';

const {v4: uuidv4} = require('uuid');

afterAll(done => {
    setTimeout(() => {
        server.close(() => {
            console.log('Server closed');
            done();
        });
    }, 500); // Delay to prevent Jest's open handle error
});

describe('Server API Tests', () => {
    let newPostId: string;
    let newCommentId: string;
    let userId: string;

    // POST - Create a new post
    it('should create a new post', async () => {
        const postData = {
            PostId: "PID-" + uuidv4(),
            Content: "I am running a jest test here",
            CreatedAt: new Date().toISOString(),
            IsDeleted: false,
            Type: "Original",
            UserId: new Date().getDate().toString()
        };

        const response = await request(app).post('/api/post').send(postData);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('PostId');
        newPostId = response.body.PostId;
        userId = response.body.UserId;
    });

    // GET - Retrieve all posts
    it('should retrieve all posts', async () => {
        const response = await request(app).get('/api/getAll');
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    });

    // GET - Retrieve a post by ID
    it('should retrieve a post by ID', async () => {
        const response = await request(app).get(`/api/getPostById/${newPostId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('PostId', newPostId);
    });

    // PUT - Update an existing post
    it('should update an existing post', async () => {
        const updatedData = {
            PostId: newPostId,
            Content: "Updated content."
        };
        const response = await request(app).put('/api/post').send(updatedData);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('Content', 'Updated content.');
    });

    // GET - Retrieve posts by a user ID
    it('should retrieve posts by user ID', async () => {
        const response = await request(app).get(`/api/getPostsByUserId/${userId}`);
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    }, 30000);

    // GET - Retrieve comments by user ID
    it('should retrieve comments by user ID', async () => {
        const response = await request(app).get(`/api/getCommentsByUserId/${userId}`);
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    });

    // GET - Retrieve posts commented by a user
    it('should retrieve posts commented by user', async () => {
        const response = await request(app).get(`/api/getPostsCommentedByUser/${userId}`);
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    });

    // POST - Create a Comment
    it('should create a new post', async () => {
        const postData = {
            PostId: "CID-" + new Date().getTime().toString(),
            Content: "I am a comment",
            CreatedAt: new Date().toISOString(),
            IsDeleted: false,
            Type: "Comment",
            ParentPostId: newPostId,
            UserId: userId
        };

        const response = await request(app).post('/api/post').send(postData);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('PostId');
        newCommentId = response.body.PostId;
    });

    // GET - Retrieve posts and their comments
    it('should retrieve a post and its comments', async () => {
        const response = await request(app).get(`/api/getPostWithChildren/${newPostId}`);
        expect(response.status).toBe(200);
        expect(response.body.children).toBeInstanceOf(Array);
    }, 30000);

    // GET - Retrieve comments by post ID
    it('should retrieve comments for a post', async () => {
        const response = await request(app).get(`/api/getCommentsByPostId/${newPostId}`);
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    }, 30000);

    // DELETE - Delete a post
    it('should delete a post', async () => {
        const response = await request(app).delete(`/api/post/${newPostId}`);
        expect(response.status).toBe(204);
    });

    // DELETE - Delete a comment
    it('should delete a comment', async () => {
        const response = await request(app).delete(`/api/post/${newCommentId}`);
        expect(response.status).toBe(204);
    });
});
