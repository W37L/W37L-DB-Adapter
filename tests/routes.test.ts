import { app, server } from '../src/server';
const request = require('supertest');


const examplePost = {
    "postId": new Date().getTime().toString(), // Use a unique ID for each test
    "userId": "commenting_user_id", // Replace with the ID of the user making the comment
    "parentPostId": "ltpzwxchLjIOh9RKuHmF",
    "type": "comment",
    "content": "NO WAY!.",
    "likes": 0,
    "createdAt": "2023-03-20T12:00:00.000Z", // Use the current timestamp when testing
    "mediaUrl": null,
    "mediaType": null,
    "thumbnail": null,
    "retweets": 0,
    "comments": 0,
    "userPub": "public_key_of_commenting_user", // Replace with the public key of the user
    "signature": "signature_based_on_content", // Replace with an actual signature
    "isDeleted": false
}

afterAll((done) => {
    server.close(() => {
        console.log('Server closed');
        done();
    });
});

describe('Post Routes', () => {
    let newPostId: string;

    it('POST /api/post - should create a new post', async () => {
        const response = await request(app).post('/api/post').send(examplePost);
        expect(response.statusCode).toBe(201); // Assuming 201 for created
        expect(response.body).toHaveProperty('content', 'NO WAY!.');
         newPostId = response.body.postId; // Save this id for later tests
    });

    it('GET /api/getPosts - should return all posts', async () => {
        const response = await request(app).get('/api/getPosts');
        expect(response.statusCode).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    });

    it('GET /api/getPostById/:postId - should return a post by ID', async () => {
        console.log("New post ID:", newPostId);
        const response = await request(app).get(`/api/getPostById/${newPostId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('postId', newPostId);
    });

    it('GET /api/getPostById/:postId - should return 404 for non-existing post', async () => {
        const response = await request(app).get('/api/getPostById/non-existing-id');
        expect(response.statusCode).toBe(404);
    });

    it('PUT /api/post - should update an existing post', async () => {
        const updatedPost = { ...examplePost, title: "Updated Test Post" };
        const response = await request(app).put('/api/post').send(updatedPost);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('title', 'Updated Test Post');
    });

    it('GET /api/getCommentsByPostId/:postId - should return comments for a post', async () => {
        // Assuming you have a way to associate comments with posts
        const response = await request(app).get(`/api/getCommentsByPostId/${newPostId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    });

    it('GET /api/getPostsByUserId/:userId - should return posts for a user', async () => {
        const response = await request(app).get(`/api/getPostsByUserId/${examplePost.userId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    });

    it('GET /api/getPostWithChildren/:postId - should return a post and its comments', async () => {
        const response = await request(app).get(`/api/getPostWithChildren/${newPostId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('post');
        expect(response.body).toHaveProperty('children');
        expect(response.body.children).toBeInstanceOf(Array);
    });

    it('DELETE /api/posts/:postId - should delete a post', async () => {
        const response = await request(app).delete(`/api/post/${newPostId}`);
        expect(response.statusCode).toBe(204);
        expect(response.body).toEqual({});
    });
});
