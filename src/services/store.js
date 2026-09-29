const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

class JsonStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.writeChain = Promise.resolve();
  }

  async ensureFile() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, JSON.stringify({ todos: [], notes: [] }, null, 2));
    }
  }

  async read() {
    await this.ensureFile();
    const raw = await fs.readFile(this.filePath, 'utf8');
    try {
      const parsed = JSON.parse(raw);
      return {
        todos: Array.isArray(parsed.todos) ? parsed.todos : [],
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      };
    } catch {
      throw new Error('Data file is corrupted and could not be parsed.');
    }
  }

  async write(data) {
    this.writeChain = this.writeChain.then(async () => {
      await this.ensureFile();
      const tempPath = `${this.filePath}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
      await fs.rename(tempPath, this.filePath);
    });
    return this.writeChain;
  }

  id() {
    return crypto.randomUUID();
  }
}

module.exports = { JsonStore };
