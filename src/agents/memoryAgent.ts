import { getMemoryCollection } from "../data/memoryStore";

export const storeMemory = async (text: string) => {
  const collection = await getMemoryCollection();
  const id = await collection.add(text);
  console.log(`Stored memory with id: ${id}`);
  return id;
};

export const retrieveMemory = async (query: string) => {
  const collection = await getMemoryCollection();
  const results = await collection.search(query, 3);
  return {
    documents: results.map(r => r.text),
    ids: results.map(r => r.id),
    metadatas: results.map(r => r.metadata || {})
  };
};
