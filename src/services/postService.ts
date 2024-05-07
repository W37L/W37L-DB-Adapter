import {IPostService} from '../contracts/IPostService';
import {Post} from '../models/model';
import {gun} from '../server';
import {PostError} from '../utils/customErrors';

export class PostService implements IPostService {

    async createPost(post: Post): Promise<Post> {
        return new Promise((resolve, reject) => {
            const postReference = gun.get('posts').get(post.PostId);
            // Check if the post already exists
            postReference.once((existingPost) => {
                if (existingPost && existingPost._ && existingPost._['#']) {
                    reject(PostError.POST_ALREADY_EXISTS(post.PostId));
                } else {
                    // Create a new post
                    postReference.put(post, (ack: any) => {
                        if (ack.err) {
                            reject(new Error(`Failed to create post: ${ack.err}`));
                        } else {
                            resolve({...post, PostId: post.PostId}); // Ensure postId is returned with the response
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
                    post.put({isDeleted: true})
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
            const {PostId} = updatedPost;

            if (!PostId) {
                reject(PostError.NO_POST_ID);
                return;
            }

            // Reference to the post in Gun
            const postRef = gun.get('posts').get(PostId);
            // Retrieve the current post data
            postRef.once((currentPost) => {
                if (!currentPost) {
                    reject(PostError.POST_NOT_FOUND);
                    return;
                }

                if (currentPost.isDeleted) {
                    reject(PostError.POST_DELETED(PostId));
                    return;
                }

                const mergedPost = { ...currentPost, ...updatedPost };
                delete mergedPost._; // Remove Gun internal metadata, otherwise it will cause an error

                // Update the post in Gun
                postRef.put(mergedPost, (ack: any) => {
                    if (ack.err) {
                        reject(PostError.FAILED_TO_UPDATE_POST(ack.err));
                    } else {
                        resolve({...mergedPost, PostId}); // Ensure the postId is included in the returned post
                    }
                });
            });
        });
    }

    async getAllContent(showDeleted: boolean = false): Promise<Post[]> {
        return new Promise((resolve, reject) => {
            const posts: Post[] = [];
            const gunPosts = gun.get('posts');

            gunPosts.map().on((data, key) => {
                if (!data) {
                    reject(PostError.POST_NOT_FOUND);
                    return;
                }

                if (data && (showDeleted || !data.isDeleted)) {
                    posts.push({...data, postId: key});
                }
            });

            setTimeout(() => resolve(posts), 500); // We still need a resolution strategy; without Gun's direct support, this is a compromise.
        });
    }

    async getAllPosts(showDeleted: boolean = false): Promise<Post[]> {
        return new Promise((resolve, reject) => {
            const posts: Post[] = [];
            const gunPosts = gun.get('posts');

            gunPosts.map().on((data, key) => {
                if (!data) {
                    reject(PostError.POST_NOT_FOUND);
                    return;
                }

                if (data && (showDeleted || !data.isDeleted) && data.Type != 'Comment') {
                    posts.push({...data, postId: key});
                }
            });

            setTimeout(() => resolve(posts), 500); // We still need a resolution strategy; without Gun's direct support, this is a compromise.
        });
    }

    async getPostById(postId: string): Promise<Post> {
        return new Promise((resolve, reject) => {
                const post = gun.get('posts').get(postId);
                post.once((data) => {
                    if (data && !data.isDeleted && data.Type != 'Comment') {
                        resolve({...data, postId: postId});
                    } else {
                        reject(PostError.POST_NOT_FOUND);
                    }
                });
            }
        );
    }

    getCommentById(postId: string): Promise<Post> {
        return new Promise((resolve, reject) => {
                const post = gun.get('posts').get(postId);
                post.once((data) => {
                    if (data && !data.isDeleted && data.Type === 'Comment') {
                        resolve({...data, postId: postId});
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

            // Stream data with `.on()` for real-time updates or use `.once()` if only a snapshot is needed
            gunPosts.map().on((data, key) => {
                // Check if the data is a comment and has the correct parent post ID
                if (data && data.Type === 'Comment' && data.ParentPostId === postId && !data.IsDeleted) {
                    comments.push({...data, postId: key});
                }
            });

            // Assuming some way to determine when the fetching is sufficiently complete or a timeout
            setTimeout(() => {
                if (comments.length === 0) {
                    reject(new Error("No comments found or data fetching not complete"));
                } else {
                    resolve(comments);
                }
            }, 5000); // Timeout is still arbitrary, consider a more reliable event-based approach
        });
    }


    async getPostsByUserId(userId: string): Promise<Post[]> {
        return new Promise((resolve, reject) => {
            const posts: Post[] = [];
            let dataChecked = false; // Flag to track if any data has been processed

            const gunPosts = gun.get('posts');
            gunPosts.map().on((data, key) => {
                if (!data) {
                    if (!dataChecked) { // Only reject if no valid data has been processed
                        reject(PostError.POST_NOT_FOUND);
                    }
                    return;
                }
                dataChecked = true; // Set flag as true once we start receiving data

                // Filter data based on the conditions
                if (!data.isDeleted && data.UserId === userId && data.Type !== 'Comment') {
                    posts.push({ ...data, postId: key });
                }
            });

            // Implement a more reliable check for completion or data sufficiency
            setTimeout(() => {
                if (posts.length > 0 || dataChecked) {
                    resolve(posts);
                } else {
                    reject(PostError.POST_NOT_FOUND);
                }
            }, 1000); // Consider increasing timeout or implementing a more dynamic check based on data flow
        });
    }


    async getCommentsByUserId(userId: string): Promise<Post[]> {
        return new Promise((resolve, reject) => {
            const posts: Post[] = [];
            let dataChecked = false; // Flag to track if any data has been processed

            const gunPosts = gun.get('posts');
            gunPosts.map().on((data, key) => {
                if (!data) {
                    if (!dataChecked) { // Only reject if no valid data has been processed
                        reject(PostError.POST_NOT_FOUND);
                    }
                    return;
                }
                dataChecked = true; // Set flag as true once we start receiving data

                // Filter data based on the conditions
                if (!data.isDeleted && data.UserId === userId && data.Type === 'Comment') {
                    posts.push({ ...data, postId: key });
                }
            });

            // Implement a more reliable check for completion or data sufficiency
            setTimeout(() => {
                if (posts.length > 0 || dataChecked) {
                    resolve(posts);
                } else {
                    reject(PostError.POST_NOT_FOUND);
                }
            }, 1000); // Consider increasing timeout or implementing a more dynamic check based on data flow
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
            } catch (error: any) {
                reject(PostError.ERROR_FETCHING_CHILDREN(error.message));
            }
        });
    }


}
