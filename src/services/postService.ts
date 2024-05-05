import {IPostService} from '../contracts/IPostService';
import {Post} from '../models/model';
import {gun} from '../server';
import {PostError} from '../utils/customErrors';

export class PostService implements IPostService {

    /**
     * Creates a new post ensuring it does not already exist.
     */
    async createPost(post: Post): Promise<Post> {
        return new Promise((resolve, reject) => {
            const postReference = gun.get('posts').get(post.PostId);
            postReference.once((existingPost) => {
                if (existingPost && existingPost._ && existingPost._['#']) {
                    reject(PostError.POST_ALREADY_EXISTS(post.PostId));
                } else {
                    postReference.put(post, (ack: any) => {
                        if (ack.err) {
                            reject(new Error(`Failed to create post: ${ack.err}`));
                        } else {
                            resolve({...post, PostId: post.PostId});
                        }
                    });
                }
            });
        });
    }

    /**
     * Deletes a post by marking it as deleted without removing it from the database.
     */
    async deletePost(postId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const post = gun.get('posts').get(postId);
            post.once((data) => {
                if (data) {
                    post.put({isDeleted: true});
                    resolve();
                } else {
                    reject(PostError.POST_NOT_FOUND);
                }
            });
        });
    }

    /**
     * Updates an existing post, ensuring it is not marked as deleted.
     */
    async updatePost(updatedPost: Post): Promise<Post> {
        return new Promise((resolve, reject) => {
            const {PostId} = updatedPost;
            if (!PostId) {
                reject(PostError.NO_POST_ID);
                return;
            }
            const postRef = gun.get('posts').get(PostId);
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
                delete mergedPost._; // Remove Gun internal metadata
                postRef.put(mergedPost, (ack: any) => {
                    if (ack.err) {
                        reject(PostError.FAILED_TO_UPDATE_POST(ack.err));
                    } else {
                        resolve({...mergedPost, PostId});
                    }
                });
            });
        });
    }

    /**
     * Retrieves all content from the database, filtered by deletion status.
     */
    async getAllContent(showDeleted: boolean = false): Promise<Post[]> {
        return this.filterPosts(showDeleted);
    }

    /**
     * Retrieves all posts except comments, optionally including deleted posts.
     */
    async getAllPosts(showDeleted: boolean = false): Promise<Post[]> {
        return this.filterPosts(showDeleted, (type) => type !== 'Comment');
    }

    /**
     * Retrieves a post by its ID, excluding comments.
     */
    async getPostById(postId: string): Promise<Post> {
        return this.fetchSinglePost(postId, (type) => type !== 'Comment');
    }

    /**
     * Retrieves a comment by its ID.
     */
    getCommentById(postId: string): Promise<Post> {
        return this.fetchSinglePost(postId, (type) => type === 'Comment');
    }

    /**
     * Retrieves all comments for a given post ID.
     */
    async getCommentsByPostId(postId: string): Promise<Post[]> {
        return this.filterPostsByParentId(postId, (type) => type === 'Comment');
    }

    /**
     * Retrieves all posts made by a specific user, excluding comments.
     */
    async getPostsByUserId(userId: string): Promise<Post[]> {
        return this.filterPostsByUserId(userId, (type) => type !== 'Comment');
    }

    /**
     * Retrieves all comments made by a specific user.
     */
    async getCommentsByUserId(userId: string): Promise<Post[]> {
        return this.filterPostsByUserId(userId, (type) => type === 'Comment');
    }

    /**
     * Retrieves a post and all its child comments.
     */
    async getPostWithChildren(postId: string): Promise<{ post: Post; children: Post[] }> {
        return new Promise(async (resolve, reject) => {
            try {
                const post = await this.getPostById(postId);
                const children = await this.getCommentsByPostId(postId);
                resolve({post, children});
            } catch (error: any) {
                reject(PostError.ERROR_FETCHING_CHILDREN(error.message));
            }
        });
    }


    private async filterPosts(showDeleted: boolean, filterFn?: (type: string) => boolean): Promise<Post[]> {
        return new Promise((resolve, reject) => {
            const posts: Post[] = [];
            const gunPosts = gun.get('posts');
            gunPosts.map().on((data, key) => {
                if (!data) {
                    reject(PostError.POST_NOT_FOUND);
                    return;
                }
                if (data && (showDeleted || !data.isDeleted) && (!filterFn || filterFn(data.Type))) {
                    posts.push({ ...data, postId: key });
                }
            });
            setTimeout(() => resolve(posts), 500); // Consider dynamic timing or event-based resolution
        });
    }

    private async filterPostsByUserId(userId: string, filterFn: (type: string) => boolean): Promise<Post[]> {
        return this.filterPosts(true, (type) => filterFn(type) && true);
    }

    private async filterPostsByParentId(parentId: string, filterFn: (type: string) => boolean): Promise<Post[]> {
        return new Promise((resolve, reject) => {
            const posts: Post[] = [];
            const gunPosts = gun.get('posts');
            gunPosts.map().on((data, key) => {
                if (data && !data.isDeleted && data.ParentPostId === parentId && filterFn(data.Type)) {
                    posts.push({ ...data, postId: key });
                }
            });
            setTimeout(() => resolve(posts), 500);
        });
    }

    private async fetchSinglePost(postId: string, filterFn: (type: string) => boolean): Promise<Post> {
        return new Promise((resolve, reject) => {
            const post = gun.get('posts').get(postId);
            post.once((data) => {
                if (data && !data.isDeleted && filterFn(data.Type)) {
                    resolve({...data, postId: postId});
                } else {
                    reject(PostError.POST_NOT_FOUND);
                }
            });
        });
    }
}
