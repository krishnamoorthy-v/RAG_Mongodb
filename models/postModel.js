const mongoose = require('mongoose');

const postSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
    },
    content: {
      type: String,
      required: [true, 'Please add some content'],
    },
    author: {
      type: String,
      required: [true, 'Please add an author'],
    },
    contentEmbedding: {
      type: [Number],
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const { generateEmbedding } = require('../utils/embedding');

// Mongoose Pre-save Hook (Triggers on Post.create() and Post.save())
postSchema.pre('save', async function () {
  // Only generate a new embedding if the content field was modified (or is new)
  if (this.isModified('content')) {
    this.contentEmbedding = await generateEmbedding(this.content);
  }
});

// Mongoose Pre-findOneAndUpdate Hook (Triggers on Post.findByIdAndUpdate())
postSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate();
  
  // Check if content is being updated
  if (update.content) {
    update.contentEmbedding = await generateEmbedding(update.content);
    this.setUpdate(update); // Apply the new embedding to the update query
  }
});

module.exports = mongoose.model('Post', postSchema);
