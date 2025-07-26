import { getMemoryCollection} from "../data/chroma";
import { embedText } from "../utils/embeddings";

export const storeMemory = async (text: string) => {
  const embedding = await embedText(text);
  const collection = await getMemoryCollection();
  await collection.add({
    ids: [Date.now().toString()],
    embeddings: [embedding],
    documents: [text],
  });
};

export const retrieveMemory = async (query: string) => {
  const embedding = await embedText(query);
  const collection = await getMemoryCollection();
  return await collection.query({ queryEmbeddings: [embedding], nResults: 3 });
};
