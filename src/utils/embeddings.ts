import { OpenAIEmbeddings } from "@langchain/openai";

const embedder = new OpenAIEmbeddings();

export const embedText = async(text:string)=>
{
  const result = await embedder.embedQuery(text);
  return result;
}
