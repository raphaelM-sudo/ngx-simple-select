import { ElementRef } from '@angular/core';

import { IScrollableElement } from './scrollable-element.model';

export interface IScrollableList {
  list: ElementRef;
  elements: IScrollableElement[];
}
