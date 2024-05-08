import {IPostService} from '../contracts/IPostService';
import {Post, POST_TYPES} from '../models/model';
import {gun} from '../server';
import {PostError} from '../utils/customErrors';

export class PostService implements IPostService {

    KEY_POSTS = 'posts';

    async createPost(post: Post): Promise<Post> {
        return new Promise((resolve, reject) => {
            const postReference = gun.get(this.KEY_POSTS).get(post.PostId);
            // Check if the post already exists
            postReference.once((existingPost) => {
                if (existingPost && existingPost._ && existingPost._['#']) {
                    reject(PostError.POST_ALREADY_EXISTS(post.PostId));
                } else {
                    // Create a new post
                    postReference.put(post, (ack: any) => {
                        if (ack.err) {
                            reject(PostError.FAILED_TO_CREATE_POST(ack.err));
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
            const post = gun.get(this.KEY_POSTS).get(postId);
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
            const postRef = gun.get(this.KEY_POSTS).get(PostId);
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
            const gunPosts = gun.get(this.KEY_POSTS);

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
            const gunPosts = gun.get(this.KEY_POSTS);

            gunPosts.map().on((data, key) => {
                if (!data) {
                    reject(PostError.POST_NOT_FOUND);
                    return;
                }

                if (data && (showDeleted || !data.isDeleted) && data.Type != POST_TYPES.Comment) {
                    posts.push({...data, postId: key});
                }
            });

            setTimeout(() => resolve(posts), 500); // We still need a resolution strategy; without Gun's direct support, this is a compromise.
        });
    }

    async getPostById(postId: string): Promise<Post> {
        return new Promise((resolve, reject) => {
            const post = gun.get(this.KEY_POSTS).get(postId);
                post.once((data) => {
                    if (data && !data.isDeleted && data.Type != POST_TYPES.Comment) {
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
            const post = gun.get(this.KEY_POSTS).get(postId);
                post.once((data) => {
                    if (data && !data.isDeleted && data.Type === POST_TYPES.Comment) {
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
            const gunPosts = gun.get(this.KEY_POSTS);

            gunPosts.map().on((data, key) => {
                // Check if the data is a comment and has the correct parent post ID
                if (data && data.Type === POST_TYPES.Comment && data.ParentPostId === postId && !data.IsDeleted) {
                    comments.push({...data, postId: key});
                }
            });

            setTimeout(() => {
                if (comments.length === 0) {
                    reject(PostError.NO_COMMENTS_FOUND);
                } else {
                    resolve(comments);
                }
            }, 5000);
        });
    }


    async getPostsByUserId(userId: string): Promise<Post[]> {
        return new Promise((resolve, reject) => {
            const posts: Post[] = [];
            let dataChecked = false; // Flag to track if any data has been processed

            const gunPosts = gun.get(this.KEY_POSTS);
            gunPosts.map().on((data, key) => {
                if (!data) {
                    if (!dataChecked) { // Only reject if no valid data has been processed
                        reject(PostError.POST_NOT_FOUND);
                    }
                    return;
                }
                dataChecked = true; // Set flag as true once we start receiving data

                // Filter data based on the conditions
                if (!data.isDeleted && data.UserId === userId && data.Type !== POST_TYPES.Comment) {
                    posts.push({ ...data, postId: key });
                }
            });

            setTimeout(() => {
                if (posts.length > 0 || dataChecked) {
                    resolve(posts);
                } else {
                    reject(PostError.POST_NOT_FOUND);
                }
            }, 5000);
        });
    }


    async getCommentsByUserId(userId: string): Promise<Post[]> {
        return new Promise((resolve, reject) => {
            const posts: Post[] = [];
            let dataChecked = false; // Flag to track if any data has been processed

            const gunPosts = gun.get(this.KEY_POSTS);
            gunPosts.map().on((data, key) => {
                if (!data) {
                    if (!dataChecked) { // Only reject if no valid data has been processed
                        reject(PostError.POST_NOT_FOUND);
                    }
                    return;
                }
                dataChecked = true; // Set flag as true once we start receiving data

                // Filter data based on the conditions
                if (!data.isDeleted && data.UserId === userId && data.Type === POST_TYPES.Comment) {
                    posts.push({ ...data, postId: key });
                }
            });

            setTimeout(() => {
                if (posts.length > 0 || dataChecked) {
                    resolve(posts);
                } else {
                    reject(PostError.POST_NOT_FOUND);
                }
            }, 1000);
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

    async getPostsCommentedByUser(userId: string): Promise<Post[]> {
        return new Promise(async (resolve, reject) => {
            const postIds = new Set<string>(); // To store unique post IDs
            const posts: Post[] = [];

            const gunPosts = gun.get(this.KEY_POSTS);
            // First, we gather all comments made by the user
            gunPosts.map().on((data, key) => {
                if (data && data.UserId === userId && data.Type === POST_TYPES.Comment && !data.isDeleted) {
                    postIds.add(data.ParentPostId);
                }
            });

            // Now we fetch posts that match the stored parent IDs from comments
            setTimeout(() => { // We use setTimeout to simulate asynchronous data collection completion
                gunPosts.map().on((post, key) => {
                    if (post && postIds.has(key) && post.Type !== POST_TYPES.Comment && !post.isDeleted) {
                        posts.push({...post, postId: key});
                    }
                });

                setTimeout(() => resolve(Array.from(posts)), 1000);
            }, 2000);
        });
    }



}
