// errorHandling.test.ts
import { app } from '../src/server';
const request = require('supertest');
import { PostError } from '../src/utils/customErrors';

// Set up any necessary data or configurations
const nonExistingPostId = 'InvalidPostId'
const examplePost = {
    "postId": "testPostId", // A fixed ID to test duplicate creation
    "userId": "testUserId",
    "parentPostId": "testParentPostId",
    "type": "comment",
    "content": "Test content.",
    "likes": 0,
    "createdAt": new Date().toISOString(),
    "userPub": "testPublicKey",
    "signature": "testSignature",
    "isDeleted": false
};

describe('Error Handling for Post Routes', () => {
    it('should fail to create a duplicate post', async () => {
        // First, create a post
        await request(app).post('/api/post').send(examplePost);
        // Try to create it again to test duplication error
        const response = await request(app).post('/api/post').send(examplePost);
        expect(response.statusCode).toBe(400); // Adjust based on your error handling
        expect(response.body.error).toBe(PostError.POST_ALREADY_EXISTS(examplePost.postId).message);
    });

    it('should fail to delete a non-existing post', async () => {
        const response = await request(app).delete(`/api/post/${nonExistingPostId}`);
        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe(PostError.POST_NOT_FOUND.message);
    });

    it('should fail to update a non-existing post', async () => {
        const updatedPost = { ...examplePost, postId: nonExistingPostId, content: "Updated content" };
        const response = await request(app).put('/api/post').send(updatedPost);
        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe(PostError.POST_NOT_FOUND.message);
    });

    it('should fail to fetch a non-existing post by ID', async () => {
        const response = await request(app).get(`/api/getPostById/${nonExistingPostId}`);
        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe(PostError.POST_NOT_FOUND.message);
    });

    // it('should fail to fetch comments for a non-existing post', async () => {
    //     const response = await request(app).get(`/api/getCommentsByPostId/${nonExistingPostId}`);
    //     expect(response.statusCode).toBe(404);
    //     expect(response.body.error).toBe(PostError.POST_NOT_FOUND.message);
    // });

    it('should fail to fetch a post with children for a non-existing post', async () => {
        const response = await request(app).get(`/api/getPostWithChildren/${nonExistingPostId}`);
        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe(PostError.PARENT_POST_NOT_FOUND.message);
    });

    // Add more tests as needed for each method and error condition
});
