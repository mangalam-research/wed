/**
 * @desc The service that provides access to chunks.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import { Chunk } from "./chunk";
import { ChunkTable } from "./store";
import { db } from "./store";
import { filesEqual } from "./util";

export class ChunksService {
  protected readonly table: ChunkTable = db.chunks;

  createRecord(data: string): Promise<Chunk> {
    return Chunk.makeChunk(data).then((chunk) => this.updateRecord(chunk));
  }

  getRecords(): Promise<Chunk[]> {
    return this.table.toArray();
  };

  deleteRecord(record: Chunk): Promise<any> {
    return this.table.delete(record.id);
  };

  getRecordById(id: string): Promise<Chunk> {
    return this.table.get({ id });
  }

  updateRecord(record: Chunk): Promise<Chunk> {
    return this.getRecordById(record.id)
      .then((found: Chunk) => {
         // We disallow any update that changes a chunk.
        if (found) {
          return filesEqual(record.file, found.file)
            .then((equal) => {
              if (!equal) {
                throw new Error(`trying to update chunk with id ${record.id}`);
              }
            });
        }

        return this.table.put(record);
      })
      .then(() => record);
  };

  loadFromFile(file: File): Promise<Chunk> {
    return Chunk.makeChunk(file)
      .then((chunk) => this.getRecordById(chunk.id)
            .then((found) => {
              if (found) {
                return found;
              }

              return this.updateRecord(chunk);
            }));
  }

  clear(): Promise<void> {
    return Promise.resolve(this.table.clear());
  }

  get recordCount(): Promise<number> {
    return this.table.count();
  }
}
