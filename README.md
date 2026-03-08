# MongoDB Atlas Vector Search API with Voyage AI

A Node.js REST API demonstrating **Retrieval-Augmented Generation (RAG)** architecture using **MongoDB Atlas Vector Search** as the primary vector database and **Voyage AI** for embedding and reranking.

This project implements a complete pipeline for semantic search on blog posts, moving beyond traditional keyword search by understanding the contextual meaning of queries and documents.

## 🚀 Features

- **MVC Architecture**: Clean separation of Models, Views (JSON), and Controllers.
- **Full CRUD API**: Standard operations for creating, reading, updating, and deleting blog posts.
- **Automated Embedding Generation**: Mongoose pre-save and pre-update hooks automatically convert your blog content into 1024-dimensional semantic vectors using the `voyage-4` model before saving to MongoDB.
- **Semantic Vector Search**: Uses MongoDB Atlas's powerful `$vectorSearch` pipeline stage to perform high-speed Approximate Nearest Neighbor (ANN) searches natively in the database.
- **AI Reranking**: Integrates Voyage AI's `rerank-2` model to refine the initial MongoDB vector results, ensuring perfect precision and sorting based on deep semantic relevance.

## 🧠 The RAG Pipeline Explained

This API implements the crucial "Retrieval" step of a RAG application:

1. **Ingestion (Knowledge Base Creation)**:
   - When you `POST /api/posts`, the API extracts the `content`.
   - It sends the `content` to Voyage AI to get a 1024-dimension float array (`contentEmbedding`).
   - The document (including the vector) is saved natively in MongoDB Atlas.

2. **Retrieval (`GET /api/posts/search?q=query`)**:
   - The user's query is converted to a vector using the exact same Voyage AI model.
   - We query MongoDB Atlas `$vectorSearch` to rapidly pull the top 20 most similar candidate posts by comparing the vectors in multi-dimensional space.
   - Optional but highly recommended **Reranking**: We pass those 20 candidates + the user query back to the Voyage AI Reranker model, which deep-reads the text and assigns an exact relevance score.
   - The top 10 reranked documents are returned to the client in order of precision.

## 🛠️ Prerequisites

- Node.js (v18+)
- MongoDB Atlas account (M0 Free Cluster is sufficient)
- Voyage AI API Key

## ⚙️ Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd blog-api
   yarn install  # or npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=6000
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/blog
   VOYAGE_API_KEY=your_voyage_api_key_here
   ```

3. **MongoDB Atlas Vector Index Configuration**
   You **MUST** create a Vector Search Index in your MongoDB Atlas UI for the `$vectorSearch` pipeline to function.
   
   - Go to **Atlas** -> **Database** -> **Search** -> **Create Search Index**.
   - Choose **JSON Editor**.
   - Select your database (`blog`) and collection (`posts`).
   - Give it the name **`vector_index`**.
   - Paste the following definition exactly:
     ```json
     {
       "fields": [
         {
           "numDimensions": 1024,
           "path": "contentEmbedding",
           "similarity": "cosine",
           "type": "vector"
         }
       ]
     }
     ```
   - Click "Next" and "Create Search Index". It will take a few minutes to build.

## 🚦 Running the Application

**Development Mode (Auto-restart on save)**
```bash
npm run dev
```

**Production Mode**
```bash
npm start
```

## 🔌 API Endpoints

### Blog CRUD Operations
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/posts` | Get all posts |
| `GET` | `/api/posts/:id` | Get single post |
| `POST` | `/api/posts` | Create a post (Auto-embeds) |
| `PUT` | `/api/posts/:id` | Update a post (Auto-embeds) |
| `DELETE`| `/api/posts/:id` | Delete a post |

### The RAG Search Endpoint
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/posts/search?q=your query` | Perform Vector Search + Reranking |

*Example Response for Search:*
```json
[
  {
    "_id": "65e...",
    "title": "Pirates",
    "content": "Luffys is a pirate king",
    "author": "Eiichiro Oda",
    "createdAt": "2024-03...",
    "vectorScore": 0.89932,
    "rerankScore": 0.99981
  }
]
```

---
*Note: This architecture bypasses standard exact-match indices and enables querying the database by meaning using state-of-the-art embedding models.*
