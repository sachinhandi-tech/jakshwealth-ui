import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ErrorService {
  handle(err: unknown): void {
    console.error(err);
  }
}
