import { ElementRef } from '@angular/core';

import { IScrollableList } from '../../../models/scrollable-list.model';

export class ListScrollManager {

  constructor(private scrollableList: IScrollableList) {}

  scrollDown(element: ElementRef<any>, offset: number) {
    element.nativeElement.scrollTop += offset;
  }

  scrollUp(element: ElementRef<any>, offset: number) {
    element.nativeElement.scrollTop -= offset;
  }

  offsetTop(element: ElementRef<any>) {
    return element.nativeElement.getBoundingClientRect().top;
  }

  offsetBottom(element: ElementRef<any>) {
    return element.nativeElement.getBoundingClientRect().bottom;
  }

  correctScroll(index: number) {

    if (index >= 0 &&
      this.scrollableList.elements.length > 0 &&
      this.scrollableList.list &&
      this.scrollableList.elements.length > index) {

      const selection = this.scrollableList.elements[index];

      const dropdownTop = this.offsetTop(this.scrollableList.list);
      const elementTop = this.offsetTop(selection.element);

      const dropdownBottom = this.offsetBottom(this.scrollableList.list);
      const elementBottom = this.offsetBottom(selection.element);

      if (elementBottom > dropdownBottom) {
        this.scrollDown(this.scrollableList.list, elementBottom - dropdownBottom);
      } else if (elementTop < dropdownTop) {
        this.scrollUp(this.scrollableList.list, dropdownTop - elementTop);
      }
    }
  }

  scrollClippedElement(index: number) {

    if (index >= 0 &&
      this.scrollableList.elements.length > 0 &&
      this.scrollableList.list &&
      this.scrollableList.elements.length > index) {

      const selection = this.scrollableList.elements[index];

      const dropdownTop = this.offsetTop(this.scrollableList.list);
      const elementTop = this.offsetTop(selection.element);

      const dropdownBottom = this.offsetBottom(this.scrollableList.list);
      const elementBottom = this.offsetBottom(selection.element);

      if (elementBottom > dropdownBottom && elementTop < dropdownBottom) {
        this.scrollDown(this.scrollableList.list, elementBottom - dropdownBottom);
      } else if (elementTop < dropdownTop && elementBottom > dropdownTop) {
        this.scrollUp(this.scrollableList.list, dropdownTop - elementTop);
      }
    }
  }

  scrollElementTop(index: number) {

    if (index >= 0 &&
      this.scrollableList.elements.length > 0 &&
      this.scrollableList.list &&
      this.scrollableList.elements.length > index) {

      const selection = this.scrollableList.elements[index];

      const dropdownTop = this.offsetTop(this.scrollableList.list);
      const elementTop = this.offsetTop(selection.element);

      this.scrollUp(this.scrollableList.list, dropdownTop - elementTop);
    }
  }
}
