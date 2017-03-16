/**
 * @desc The files service for the files module.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import Dexie from "dexie";
import { Subject } from "rxjs";

import { readFile } from "./store-util";

export interface IValue<Key> {
  id?: Key;
  name: string;
};

export interface Loader {
  loadFromFile(file: File, record?: any | null): Promise<any>;
  safeLoadFromFile(file: File,
                   confirmerOrIntoRecord?: any): Promise<any | undefined>;
}

export interface Clearable {
  clear(): Promise<void>;
}

type Confirmer = (message: string) => Promise<boolean>;
export type WriteCheckResult<Value> = {write: boolean, record: Value | null};

export type NameIdArray<Key> = Array<{name: string, id: Key}>;

export abstract class DBService<Value extends IValue<Key>, Key> implements
Loader, Clearable {
  private readonly boundModified: <R>(arg: R) => R;
  public readonly change: Subject<void> = new Subject<void>();

  constructor(protected readonly table: Dexie.Table<Value, Key>) {
    this.boundModified = this.modified.bind(this);
  }

  private modified<R>(arg?: R): R | undefined{
    this.change.next();
    return arg;
  }

  getRecords(): Promise<Value[]> {
    return this.table.toArray();
  };

  deleteRecord(record: Value): Promise<any> {
    return Promise.resolve().then(() => {
      if (record.id === undefined) {
        throw new Error("missing id!");
      }

      // Dexie's table.delete will resolve exactly the same whether or not a
      // record was actually deleted. This means that in *theory* we could get a
      // change event even though nothing was removed. We're not doing anything
      // to optimize for this. We'd have to query the table first.
      return this.table.delete(record.id).then(this.boundModified);
    });
  };

  updateRecord(record: Value): Promise<Value> {
    return this.table.put(record).then((key) => {
      if (!record.id) {
        record.id = key;
      }

      this.boundModified(null);
      return record;
    });
  };

  getRecordById(id: number): Promise<Value | undefined> {
    return this.table.get({ id });
  }

  getRecordByName(name: string): Promise<Value | undefined> {
    return this.table.get({ name });
  }

  loadFromFile(file: File, record?: Value | null): Promise<Value> {
    return readFile(file)
      .then((data) => this.makeRecord(file.name, data))
      .then((newRecord) => {
        if (record) {
          newRecord.id = record.id;
          newRecord.name = record.name;
        }

        return newRecord;
      })
      .then((recorded) => this.updateRecord(recorded));
  }

  writeCheck(name: string, confirmer: Confirmer):
  Promise<WriteCheckResult<Value>> {
    return this.getRecordByName(name)
      .then((record):
            Promise<WriteCheckResult<Value>> | WriteCheckResult<Value> => {
        if (!record) {
          return {write: true, record: null};
        }

        return confirmer(`Are you sure you want to overwrite ${name}?`)
          .then((write) => ({ write, record }));
      });
  }

  safeLoadFromFile(file: File, confirmerOrIntoRecord: Confirmer | Value):
  Promise<Value | undefined> {
    let intoRecord: Value | undefined;
    let confirmer: Confirmer | undefined;
    if (confirmerOrIntoRecord instanceof Function) {
      confirmer = confirmerOrIntoRecord;
    }
    else {
      intoRecord = confirmerOrIntoRecord;
    }

    if (intoRecord) {
      return this.loadFromFile(file, intoRecord);
    }
    else {
      // confirmer cannot be undefined if we get here...
      return this.writeCheck(file.name, confirmer!)
        .then(({ write, record}): Promise<Value | undefined> | undefined => {
          if (write) {
            return this.loadFromFile(file, record);
          }

          return undefined;
        });
    }
  }

  clear(): Promise<void> {
    // Dexie's table.clear will resolve exactly the same whether or not a
    // records were deleted. This means that in *theory* we could get a change
    // event even though nothing was removed. We're not doing anything to
    // optimize for this. We'd have to query the table first.
    return Promise.resolve(this.table.clear().then(this.boundModified));
  }

  abstract makeRecord(name: string, data: string): Promise<Value>;

  abstract getDownloadData(record: Value): Promise<string>;

  getNameIdArray(): Promise<NameIdArray<Key>> {
    return this.getRecords()
      .then((records) =>
            records.map((record: Value) => ({ name: record.name,
                                              id: record.id })));
  }

  getRecordCount(): Promise<number> {
    return this.table.count();
  }
}
