const express = require('express');
const router = express.Router();
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  searchPostsByVector,
} = require('../controllers/postController');

// MUST register search route before /:id so Express doesn't treat "search" as an ID
router.route('/search').get(searchPostsByVector);

router.route('/').get(getPosts).post(createPost);
router.route('/:id').get(getPost).put(updatePost).delete(deletePost);

module.exports = router;
