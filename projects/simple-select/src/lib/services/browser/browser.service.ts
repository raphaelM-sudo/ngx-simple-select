import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BrowserService {

  isEdge: boolean;

  constructor() {
    this.isEdge = /Edge\/\d./i.test(window.navigator.userAgent);
  }
}
