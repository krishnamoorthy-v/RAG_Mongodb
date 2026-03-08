require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const port = process.env.PORT || 6000;

// Connect to database
connectDB();

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/posts', require('./routes/postRoutes'));

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
