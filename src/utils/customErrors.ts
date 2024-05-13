// CustomErrors.ts
/**
 * Represents a custom error.
 * @extends Error
 */
export class CustomError extends Error {
    static SERVER_ERROR = new CustomError('Server error'); // Changed from method to property

    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

/**
 * Represents an error related to posts.
 *
 * @extends CustomError
 */
export class PostError extends CustomError {
    // Inherits SERVER_ERROR from CustomError
    static POST_NOT_FOUND = new PostError('Post not found');
    static POST_ALREADY_EXISTS = (postId: string) => new PostError(`Post already exists with postId: ${postId}`);
    static FAILED_TO_CREATE_POST = (err: string) => new PostError(`Failed to create post: ${err}`);
    static NO_POST_ID = new PostError("Post must have a postId");
    static POST_DELETED = (postId: string) => new PostError(`Post with ID ${postId} has been deleted and cannot be updated`);
    static FAILED_TO_UPDATE_POST = (err: string) => new PostError(`Failed to update post: ${err}`);
    static PARENT_POST_NOT_FOUND = new PostError('Parent post not found');
    static ERROR_FETCHING_CHILDREN = (error: string) => new PostError(`Error fetching post with children: ${error}`);
    static NO_COMMENTS_FOUND = new PostError("No comments found or data fetching not complete");
}
