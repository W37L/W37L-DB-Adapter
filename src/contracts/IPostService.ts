import { Post } from '../models/model';

/**
 * Interface defining the operations that can be performed on Posts.
 */
export interface IPostService {
    /**
     * Creates a new post.
     * @param {Post} post - The post to create.
     * @returns {Promise<Post>} The created post.
     */
    createPost(post: Post): Promise<Post>;

    /**
     * Deletes a post by its ID.
     * @param {string} postId - The ID of the post to delete.
     * @returns {Promise<void>}
     */
    deletePost(postId: string): Promise<void>;

    /**
     * Updates an existing post.
     * @param {Post} post - The new post data.
     * @returns {Promise<Post>} The updated post.
     */
    updatePost(post: Post): Promise<Post>;

    /**
     * Retrieves a post by its ID.
     * @param {string} postId - The ID of the post to retrieve.
     * @returns {Promise<Post>} The requested post.
     */
    getPostById(postId: string): Promise<Post>;

    /**
     * Retrieves all comments for a given post.
     * @param {string} postId - The ID of the post for which to retrieve comments.
     * @returns {Promise<Post[]>} An array of comments.
     */
    getCommentsByPostId(postId: string): Promise<Post[]>;

    /**
     * Retrieves all posts, optionally including deleted posts.
     * @param {boolean} [showDeleted=false] - Whether to include deleted posts.
     * @returns {Promise<Post[]>} An array of posts.
     */
    getAllPosts(showDeleted?: boolean): Promise<Post[]>;

    /**
     * Retrieves all posts made by a specific user.
     * @param {string} userId - The ID of the user whose posts to retrieve.
     * @returns {Promise<Post[]>} An array of posts.
     */
    getPostsByUserId(userId: string): Promise<Post[]>;

    /**
     * Retrieves a post and its comments by the post's ID.
     * @param {string} postId - The ID of the post to retrieve.
     * @returns {Promise<{ parent: Post; children: Post[] }>} The requested post and its comments.
     */
    getPostWithChildren(postId: string): Promise<{ post: Post; children: Post[] }>;
}
