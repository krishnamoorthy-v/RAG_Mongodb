const Post = require('../models/postModel');
const { generateEmbedding, rerankDocuments } = require('../utils/embedding');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find();
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single post
// @route   GET /api/posts/:id
// @access  Public
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Public
const createPost = async (req, res) => {
  try {
    const { title, content, author } = req.body;
    console.log("body: ", req.body)
    if (!title || !content || !author) {
      return res.status(400).json({ message: 'Please add all required fields' });
    }

    const post = await Post.create({
      title,
      content,
      author,
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Public
const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Public
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await post.deleteOne();

    res.status(200).json({ id: req.params.id, message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search posts via Vector Search
// @route   GET /api/posts/search?q=query
// @access  Public
const searchPostsByVector = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Please provide a search query (?q=something)' });
    }

    // Generate an embedding for the user's search query
    const queryEmbedding = await generateEmbedding(q);
    // console.log("queryEmbedding: ", queryEmbedding)
    // Perform Atlas Vector Search using the aggregation pipeline to get candidates
    const candidatePosts = await Post.aggregate([
      {
        $vectorSearch: {
          index: "vector_index", // This MUST match the index name you create in Atlas
          path: "contentEmbedding",
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: 20, // Fetch more candidates so the Reranker has options
        }
      },
      {
        // Project to include ranking score. Implicitly hides everything else.
        $project: {
          title: 1,
          content: 1,
          author: 1,
          createdAt: 1,
          vectorScore: { $meta: "vectorSearchScore" }
        }
      }
    ]);

    if (candidatePosts.length === 0) {
      return res.status(200).json([]);
    }

    // Pass the query and candidate documents to Voyage AI for Reranking
    const rerankedPosts = await rerankDocuments(q, candidatePosts);

    // Filter out very low semantic matches if desired, then limit to top 10
    const topResults = rerankedPosts.slice(0, 10);

    res.status(200).json(topResults);
  } catch (error) {
    console.error("Vector search failed:", error);
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  searchPostsByVector,
};
