import { ChromaClient } from "chromadb";

// Simple HTTP client configuration for ChromaDB server
export const chroma = new ChromaClient({
  host: process.env.CHROMA_HOST || "localhost",
  port: parseInt(process.env.CHROMA_PORT || "8001", 10),
  ssl: String(process.env.CHROMA_SSL).toLowerCase() === "true",
});

// Initialize collections
export const initializeCollections = async () => {
  try {
    const name = "syntra-memory";
    console.log("Attempting to list collections...");
    const existing = await chroma.listCollections();
    console.log(`Found ${existing.length} existing collections`);
    
    if (!existing.find(c => c.name === name)) {
  console.log(`Creating collection: ${name}`);
  // Note: We create the collection without embedding function; we provide embeddings explicitly in memoryAgent
  await chroma.createCollection({ name });
    }
    
    console.log(`Getting collection: ${name}`);
    return await chroma.getCollection({ name });
  } catch (error) {
    console.error("ChromaDB initialization error details:", error);
    throw error;
  }
};


export const getMemoryCollection = async () => {
  return await chroma.getCollection({ name: "syntra-memory" });
};
