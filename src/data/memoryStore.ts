interface MemoryEntry {
  id: string;
  text: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  timestamp: Date;
}

class SimpleMemoryStore {
  private entries: MemoryEntry[] = [];
  private nextId = 1;

  async add(text: string, metadata?: Record<string, any>): Promise<string> {
    const id = `mem_${this.nextId++}`;
    const entry: MemoryEntry = {
      id,
      text,
      metadata,
      timestamp: new Date()
    };
    
    this.entries.push(entry);
    console.log(`Stored memory entry: ${id}`);
    return id;
  }

  async search(query: string, limit: number = 10): Promise<MemoryEntry[]> {
    // Simple text-based search (in a real implementation, you'd use embeddings)
    const results = this.entries.filter(entry => 
      entry.text.toLowerCase().includes(query.toLowerCase())
    );
    
    // Sort by timestamp (most recent first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return results.slice(0, limit);
  }

  async list(): Promise<MemoryEntry[]> {
    return [...this.entries];
  }

  async clear(): Promise<void> {
    this.entries = [];
    this.nextId = 1;
    console.log('Memory store cleared');
  }

  async count(): Promise<number> {
    return this.entries.length;
  }
}

// Create a singleton instance
export const memoryStore = new SimpleMemoryStore();

// Initialize collections function that matches ChromaDB interface
export const initializeCollections = async () => {
  console.log('Initializing simple memory store...');
  const count = await memoryStore.count();
  console.log(`Memory store initialized with ${count} existing entries`);
  return memoryStore;
};

// Memory collection interface
export const getMemoryCollection = async () => {
  return memoryStore;
};
