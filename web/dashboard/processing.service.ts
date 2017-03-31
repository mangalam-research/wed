import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

interface State {
  total: number;
  count: number;
}

@Injectable()
export class ProcessingService {
  private _state: BehaviorSubject<State> = new BehaviorSubject({
    total: 0,
    count: 0,
  });

  public state: Observable<State> = this._state.asObservable();

  start(total: number): void {
    const value = this._state.value;

    if (value.total !== 0) {
      throw new Error("there is already something in progress");
    }

    if (total === 0) {
      throw new Error("cannot start processing with a total of 0");
    }
    this._state.next({
      total,
      count: 0,
    });
  }

  stop(): void {
    this._state.next({
      total: 0,
      count: 0,
    });
  }

  increment(): void {
    const value = this._state.value;

    if (value.total === 0) {
      throw new Error("increment called when there is nothing in progress");
    }

    const newCount = ++value.count;

    if (newCount > value.total) {
      throw new Error("incrementing beyond the total");
    }

    this._state.next({
      total: value.total,
      count: newCount,
    });
  }
}
