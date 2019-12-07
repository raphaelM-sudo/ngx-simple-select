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

  correctScroll() {

    if (this.scrollableList.list && this.scrollableList.elements.length > this.scrollableList.highlightedIndex) {

      const selected = this.scrollableList.elements[this.scrollableList.highlightedIndex];

      const dropdownTop = this.offsetTop(this.scrollableList.list);
      const elementTop = this.offsetTop(selected.element);

      const dropdownBottom = this.offsetBottom(this.scrollableList.list);
      const elementBottom = this.offsetBottom(selected.element);

      if (elementBottom > dropdownBottom) {
        this.scrollDown(this.scrollableList.list, elementBottom - dropdownBottom);
      } else if (elementTop < dropdownTop) {
        this.scrollUp(this.scrollableList.list, dropdownTop - elementTop);
      }
    }
  }

  scrollClippedElement() {

    if (this.scrollableList.list && this.scrollableList.elements.length > this.scrollableList.highlightedIndex) {

      const selected = this.scrollableList.elements[this.scrollableList.highlightedIndex];

      const dropdownTop = this.offsetTop(this.scrollableList.list);
      const elementTop = this.offsetTop(selected.element);

      const dropdownBottom = this.offsetBottom(this.scrollableList.list);
      const elementBottom = this.offsetBottom(selected.element);

      if (elementBottom > dropdownBottom && elementTop < dropdownBottom) {
        this.scrollDown(this.scrollableList.list, elementBottom - dropdownBottom);
      } else if (elementTop < dropdownTop && elementBottom > dropdownTop) {
        this.scrollUp(this.scrollableList.list, dropdownTop - elementTop);
      }
    }
  }

  scrollElementTop() {

    if (this.scrollableList.list && this.scrollableList.elements.length > this.scrollableList.highlightedIndex) {

      const highlighted = this.scrollableList.elements[this.scrollableList.highlightedIndex];

      const dropdownTop = this.offsetTop(this.scrollableList.list);
      const elementTop = this.offsetTop(highlighted.element);

      this.scrollUp(this.scrollableList.list, dropdownTop - elementTop);
    }
  }
}