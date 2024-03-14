import {IPostService} from '../contracts/IPostService';
import {Post } from '../models/model';
import { gun } from '../server';
import { PostError } from '../utils/customErrors';

export class PostService implements IPostService {

    async createPost(post: Post): Promise<Post> {
        return new Promise((resolve, reject) => {
            const postReference = gun.get('posts').get(post.postId);
            // Check if the post already exists
            postReference.once((existingPost) => {
                if (existingPost && existingPost._ && existingPost._['#']) {
                    reject(PostError.POST_ALREADY_EXISTS(post.postId));
                } else {
                    // Create a new post
                    postReference.put(post, (ack:any) => {
                        if (ack.err) {
                            reject(new Error(`Failed to create post: ${ack.err}`));
                        } else {
                            resolve({ ...post, postId: post.postId }); // Ensure postId is returned with the response
                        }
                    });
                }
            });
        });
    }

    async deletePost(postId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const post = gun.get('posts').get(postId);
            post.once((data) => {
                if (data) {
                    post.put({ isDeleted: true })
                    resolve();
                } else {
                    reject(PostError.POST_NOT_FOUND);
                }
            });
        });
    }

    async updatePost(updatedPost: Post): Promise<Post> {
        return new Promise((resolve, reject) => {
            // Extract postId from the updated post
            const { postId } = updatedPost;

            if (!postId) {
                reject(PostError.NO_POST_ID);
                return;
            }

            // Reference to the post in Gun
            const postRef = gun.get('posts').get(postId);
            // Retrieve the current post data
            postRef.once((currentPost) => {
                if (!currentPost) {
                    reject(PostError.POST_NOT_FOUND);
                    return;
                }

                if (currentPost.isDeleted) {
                    reject(PostError.POST_DELETED(postId));
                    return;
                }

                const mergedPost = { ...currentPost, ...updatedPost };
                delete mergedPost._; // Remove Gun internal metadata, otherwise it will cause an error

                // Update the post in Gun
                postRef.put(mergedPost, (ack: any) => {
                    if (ack.err) {
                        reject(PostError.FAILED_TO_UPDATE_POST(ack.err));
                    } else {
                        resolve({ ...mergedPost, postId }); // Ensure the postId is included in the returned post
                    }
                });
            });
        });
    }

    async getPostById(postId: string): Promise<Post> {
        return new Promise((resolve, reject) => {
            const post = gun.get('posts').get(postId);
            post.once((data) => {
                if (data && !data.isDeleted) {
                    resolve({ ...data, postId: postId });
                } else {
                    reject(PostError.POST_NOT_FOUND);
                }
            });
        }
        );
    }

    async getCommentsByPostId(postId: string): Promise<Post[]> {
        return new Promise((resolve, reject) => {
            const comments: Post[] = [];
            const gunPosts = gun.get('posts');
            let dataChecked = false;  // Flag to indicate if any data was checked

            // Attempt to retrieve the parent post first
            gunPosts.get(postId).once(parentData => {
                if (!parentData) {
                    reject(PostError.POST_NOT_FOUND);
                    return;
                }
                dataChecked = true; // Mark that we have checked data

                // If the post exists, retrieve its comments
                gunPosts.map().once((data, key) => {
                    // Note: This is simplified; depending on your data structure, you might need a different approach
                    if (data && !data.isDeleted && data.type === 'comment' && data.parentPostId === postId) {
                        comments.push({ ...data, postId: key });
                    }
                });

                // Resolve after a short delay to allow for data collection
                // This delay is arbitrary and not a guaranteed way to ensure all data has been collected
                setTimeout(() => {
                    if (!dataChecked) {
                        reject(PostError.POST_NOT_FOUND);
                    } else {
                        resolve(comments);
                    }
                }, 500); // Adjust this delay based on expected latency and data size
            });
        });
    }


    async getAllPosts(showDeleted: boolean = false): Promise<Post[]> {
        return new Promise((resolve, reject) => {
            const posts: Post[] = [];
            const gunPosts = gun.get('posts');


            gunPosts.map().once((data, key) => {
                if (!data) {
                    reject(PostError.POST_NOT_FOUND);
                    return;
                }

                if (data && (showDeleted || !data.isDeleted)) {
                    posts.push({ ...data, postId: key });
                }
            });

            setTimeout(() => resolve(posts), 500); // We still need a resolution strategy; without Gun's direct support, this is a compromise.
        });
    }

    async getPostsByUserId(userId: string): Promise<Post[]> {
        return new Promise((resolve, reject) => {
            const posts: Post[] = [];
            const gunPosts = gun.get('posts');

            gunPosts.map().once((data, key) => {
                if (!data) {
                    reject(PostError.POST_NOT_FOUND);
                    return;
                }
                if (data && !data.isDeleted && data.userId === userId) {
                    posts.push({ ...data, postId: key });
                }
            });

            setTimeout(() => resolve(posts), 500); // Again, a compromise until a better resolution strategy is available.
        });
    }


    async getPostWithChildren(postId: string): Promise<{ post: Post; children: Post[] }> {
        return new Promise(async (resolve, reject) => {
            try {
                const post = await this.getPostById(postId); // Get the parent post by ID
                if (!post) {
                    reject(PostError.PARENT_POST_NOT_FOUND);
                    return;
                }

                const children = await this.getCommentsByPostId(postId); // Get the comments (child posts) for the parent post
                // If you have other types of child posts like retweets, you can fetch them similarly and merge them into the `children` array

                // Construct the result with parent and children
                const result = {
                    post: post,
                    children: children
                };

                resolve(result);
            } catch (error:any) {
                reject(PostError.ERROR_FETCHING_CHILDREN(error.message));
            }
        });
    }
}
