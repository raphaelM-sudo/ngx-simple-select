import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ParentService<T> {

  component: T = null;

  constructor() { }
}
