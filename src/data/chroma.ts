import { ChromaClient } from "chromadb";


export const chroma = new ChromaClient();

// Initialize collections
export const initializeCollections = async () => {
  await chroma.createCollection({
    name: "syntra-memory",
  });
  return await chroma.getCollection({ name: "syntra-memory" });
};


export const getMemoryCollection = async () => {
  return await chroma.getCollection({ name: "syntra-memory" });
};
