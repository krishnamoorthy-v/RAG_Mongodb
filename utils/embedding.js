const { VoyageAIClient } = require('voyageai');

// Ensure the API key is available in process.env.VOYAGE_API_KEY
const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY, baseUrl: "https://ai.mongodb.com/v1" });
console.log(process.env.VOYAGE_API_KEY)

const generateEmbedding = async (text) => {
  try {
    const response = await client.embed({
      input: [text],
      model: "voyage-4", // voyage-3 produces 1024 dimensional embeddings. voyage-3-lite produces 512.
    });
    
    // The response data contains the embedding for the input text
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error.message);
    throw new Error("Failed to generate embedding");
  }
};

const rerankDocuments = async (query, documents) => {
  if (!documents || documents.length === 0) return [];

  // Voyage AI rerank expects an array of strings
  const texts = documents.map(doc => doc.content);

  try {
    const response = await client.rerank({
      query: query,
      documents: texts,
      model: "rerank-2",
      topK: documents.length, // Return scores for all candidate documents
    });

    // Merge the rerank scores back into the original MongoDB document objects
    const rerankedDocs = response.data.map(result => {
      const originalDoc = documents[result.index];
      return {
        ...originalDoc,
        rerankScore: result.relevanceScore,
      };
    });

    return rerankedDocs; // These come sorted by relevanceScore automatically
  } catch (error) {
    console.error("Error reranking documents:", error.message);
    throw new Error("Failed to rerank documents");
  }
};

module.exports = {
  generateEmbedding,
  rerankDocuments,
};
