/**
 * Represents the type of the post.
 * @typedef {'post' | 'comment' | 'retweet'} PostType
 */

export type PostType = 'post' | 'comment' | 'retweet';

/**
 * Describes the structure and expected content of a social media post.
 *
 * @interface Post
 * @property {string} postId - Unique identifier of the post.
 * @property {string} userId - Identifier of the user who created the post.
 * @property {string} [parentPostId] - Identifier of the original post in case of a comment or retweet.
 * @property {PostType} type - Type of the post (e.g., 'post', 'comment', 'retweet').
 * @property {string} content - The text content of the post.
 * @property {number} likes - Count of likes the post has received.
 * @property {string} createdAt - Timestamp of when the post was created.
 * @property {string} [mediaUrl] - URL of the media attached to the post, if any.
 * @property {string} [mediaType] - Type of the attached media (e.g., 'image', 'video').
 * @property {string} [thumbnail] - URL of the thumbnail image, if applicable.
 * @property {number} retweets - Count of retweets or shares the post has received.
 * @property {number} comments - Count of comments the post has received.
 * @property {string} userPub - Public key of the user for verification purposes.
 * @property {string} signature - Digital signature of the post for authenticity.
 * @property {boolean} isDeleted - Flag indicating whether the post has been deleted.
 */
export interface Post {
    postId: string;
    userId: string;
    parentPostId?: string;
    type: PostType;
    content: string;
    likes: number;
    createdAt: string;
    mediaUrl?: string;
    mediaType?: string;
    thumbnail?: string | null;
    retweets: number;
    comments: number;
    userPub: string;
    signature: string;
    isDeleted: boolean;
}
