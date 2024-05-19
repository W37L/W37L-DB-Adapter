# W37l Server README

## Overview

The W37l Server is a decentralized social media server using GunDB for data persistence and synchronization across
nodes. It allows users to create, update, delete, and fetch posts and comments. It supports both local file-based and
AWS S3 bucket persistence. This server is designed to be part of a larger network of W37l servers, contributing to the
robustness and decentralization of the infrastructure.

## Prerequisites

To run the server, you will need Node.js and npm installed. Additionally, you must set up an environment file (.env)
with your AWS credentials, bucket details, and the port number on which the server should run.

### .env File Configuration

Create a `.env` file in the root directory of the project with the following contents:

    AWS_ACCESS_KEY_ID=your_access_key_id
    AWS_SECRET_ACCESS_KEY=your_secret_access_key
    AWS_BUCKET_NAME=your_bucket_name
    AWS_REGION=your_bucket_region
    PORT=your_port_number

## Installation

To install the necessary dependencies, run the following command in your project directory:

    npm install

## Running the Server

To start the server, run the following command:

    npm start

This will launch the server on the port specified in your `.env` file (default 3000) and connect it to the configured
GunDB network and AWS S3 bucket for data persistence.

## API Endpoints

Below are the available REST API endpoints that the server provides:

### Posts

- **POST /api/post** - Create a new post.
- **PUT /api/post** - Update an existing post.
- **DELETE /api/post/:postId** - Delete a post by ID.
- **GET /api/getAll** - Retrieve all posts and comments.
- **GET /api/getPosts** - Retrieve all posts, with an option to include deleted posts.
- **GET /api/getPostById/:postId** - Retrieve a specific post by ID.

### Comments

- **GET /api/getCommentById/:postId** - Retrieve a specific comment by ID.
- **GET /api/getCommentsByPostId/:postId** - Retrieve all comments for a specific post.

### Users

- **GET /api/getPostsByUserId/:userId** - Retrieve all posts made by a specific user.
- **GET /api/getCommentsByUserId/:userId** - Retrieve all comments made by a specific user.
- **GET /api/getPostsCommentedByUser/:userId** - Retrieve posts that have comments by a specific user.

### Miscellaneous

- **GET /servers** - Retrieve a list of GunDB servers from the network configuration file.

## Community Participation

We encourage you to contribute to the decentralization and robustness of our network by setting up your own server
instance. To help the community, update the `servers.json` file to include your server URL:

```json
{
  "servers": [
    "https://yourserver.com/gun"
  ]
}
```

This will allow other instances to connect and synchronize with your server, enhancing the network's resilience and
distributed nature.