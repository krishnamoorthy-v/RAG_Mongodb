const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8']);
require('dotenv').config({ path: '.env' });

mongoose.connect(process.env.MONGODB_URI).then(async (m) => {
  const db = m.connection.db;
  const coll = db.collection('posts');
  const posts = await coll.find({contentEmbedding: {$exists: true}}).toArray();
  console.log('Posts with embeddings:', posts.length);
  if (posts.length > 0) {
    console.log('Embedding dimension:', posts[0].contentEmbedding.length);
  }
  const indexes = await coll.listSearchIndexes().toArray();
  console.log('Search Indexes:', JSON.stringify(indexes, null, 2));
  m.disconnect();
}).catch(console.error);
