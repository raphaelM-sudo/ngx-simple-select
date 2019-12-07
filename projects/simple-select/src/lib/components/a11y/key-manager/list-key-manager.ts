import { Subject } from 'rxjs';

import { IInteractiveList } from '../../../models/interactive-list.model';

export const INPUT_TIMEOUT = 500;

export class ListKeyManager {

  blur: Subject<void> = new Subject<void>();
  select: Subject<number> = new Subject<number>();

  private timeoutHandler = null;
  private searchString = '';

  constructor(private list: IInteractiveList) {}

  catchKey(event: KeyboardEvent) {
    const control = event.ctrlKey;
    const alt = event.altKey;
    const key = event.key;

    if (key) {
      switch (key) {
        case 'Backspace':
          // Ignore
          break;
        case 'Tab':
          this.pressedTab();
          break;
        case 'Enter':
          this.pressedEnter();
          break;
        case 'ArrowUp':
          this.pressedArrowUp(alt);
          break;
        case 'ArrowDown':
          this.pressedArrowDown(alt);
          break;
        case 'Escape':
          this.blur.next();
          break;
        case 'PageUp':
        case 'Home':
          this.list.selectFirst();
          break;
        case 'PageDown':
        case 'End':
          this.list.selectLast();
          break;
        default:
          this.pressedSomeButton(key, alt, control);
          return;
      }

      event.preventDefault();
    }
  }

  pressedSomeButton(key: string, alt: boolean, control: boolean) {
    if (key.length === 1 && !alt && !control) {
      this.search(key);
    }
  }

  pressedArrowUp(alt: boolean) {
    if (alt) {
      this.blur.next();
      return;
    }

    if (this.list.highlightedIndex < 0) {
      this.list.highlightedIndex = this.list.selectedIndex;
    }

    for ( let i = this.list.highlightedIndex - 1; i >= 0; i--) {
      if (!this.list.skipPredicateFn(this.list.elements[i])) {
        this.select.next(i);
        return;
      }
    }
  }

  pressedArrowDown(alt: boolean) {
    if (alt) {
      this.blur.next();
      return;
    }

    if (this.list.highlightedIndex < 0) {
      this.list.highlightedIndex = this.list.selectedIndex;
    }

    for ( let i = this.list.highlightedIndex + 1; i < this.list.elements.length; i++) {
      if (!this.list.skipPredicateFn(this.list.elements[i])) {
        this.select.next(i);
        return;
      }
    }
  }

  search(key: string) {

    key = key.toUpperCase();

    let searchIndex: number;
    if (this.list.highlightedIndex < 0) {
      searchIndex = 0;
    } else {
      searchIndex = this.list.highlightedIndex;
    }

    if (this.searchString.length > 0 && (this.searchString !== key)) {

      this.searchString += key;
    } else {
      this.searchString = key;
      searchIndex++;
    }

    clearTimeout(this.timeoutHandler);
    this.timeoutHandler = null;

    this.timeoutHandler = setTimeout(() => {
      this.searchString = '';
    }, INPUT_TIMEOUT);

    for (let i = searchIndex; i < this.list.elements.length; i++) {
      if (!this.list.skipPredicateFn(this.list.elements[i]) && this.list.elements[i].text.toUpperCase().startsWith(this.searchString)) {
        this.select.next(i);
        return;
      }
    }
    for (let i = 0; i < searchIndex; i++) {
      // TODO: Change toUpperCase because not usable in every language
      if (!this.list.skipPredicateFn(this.list.elements[i]) && this.list.elements[i].text.toUpperCase().startsWith(this.searchString)) {
        this.select.next(i);
        return;
      }
    }

    // If not found, reset search
    this.searchString = '';
  }

  // Tab selects the current highlightedIndex only if it is not in the initial state
  pressedTab() {
    if (this.list.selectedIndex >= 0 && this.list.highlightedIndex >= 0) {
      this.select.next(this.list.highlightedIndex);
    }
    this.blur.next();
  }

  // Enter always selects the current highlightedIndex
  pressedEnter() {
    if (this.list.highlightedIndex >= 0) {
      this.select.next(this.list.highlightedIndex);
    }
    this.blur.next();
  }
}
