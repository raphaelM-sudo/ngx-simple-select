import {
    AfterViewInit, Component, ContentChildren, ElementRef, forwardRef, Input, OnInit, QueryList,
    Renderer2, ViewChild
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { OptionComponent } from '../option/option.component';

export const INPUT_TIMEOUT = 500;

@Component({
  selector: 'simple-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  // tslint:disable-next-line: use-host-property-decorator
  host: {class: 'simple-select'}
})
export class SelectComponent implements OnInit, AfterViewInit, ControlValueAccessor {

  @Input() placeholder?: string;
  @Input() size?: number;
  @Input() disabled = false;
  @Input() hoverBorder = false;
  @Input() value: object | string | number;

  get showUI() {
    return !this.hoverBorder || this.focus || this.mouseOver;
  }

  get showList() {
    return this.focus && !this.scrolledOutside;
  }

  get optionsArray() {
    return this._optionsArray;
  }

  set optionsArray(options: OptionComponent[]) {
    this._optionsArray = options;
  }

  get selected(): OptionComponent {
    if (this.selectedIndex >= 0) {
      return this.optionsArray[this.selectedIndex];
    }
    return null;
  }

  get highlighted(): OptionComponent {
    if (this.highlightedIndex >= 0) {
      return this.optionsArray[this.highlightedIndex];
    }
    return null;
  }

  @ViewChild('dropdown') dropdown: ElementRef;
  @ViewChild('optionList') optionList: ElementRef;
  @ContentChildren(OptionComponent) options: QueryList<OptionComponent>;

  focus = false;
  mouseOver = false;
  scrolledOutside = false;
  selectedIndex = -1;
  highlightedIndex = -1;
  searchString = '';

  timeoutHandler = null;

  // tslint:disable-next-line: variable-name
  private _optionsArray: OptionComponent[];

  propagateChange = (_: any) => {};

  startFunctionality() {
    if (!this.disabled && this.optionsArray) {
      this.focus = true;
      this.scrolledOutside = false;
    }
  }

  stopFunctionality() {
    this.focus = false;

    if (this.selectedIndex >= 0) {
      this.highlightIndex(this.selectedIndex);
      this.scrollElementTop();
    }
  }

  mouseenter() {
    this.mouseOver = true;
  }

  mouseleave() {
    this.mouseOver = false;
  }

  selectIndex(index: number) {
    if (this.selected) {
      this.optionsArray[this.selectedIndex].selected = false;
    }
    this.selectedIndex = index;
    if (index >= 0) {
      this.optionsArray[index].selected = true;
      this.highlightIndex(index);
      this.correctScroll();
      this.emit();
    }
  }

  highlightIndex(index: number) {
    if (index >= 0) {
      if (this.highlighted) {
        this.optionsArray[this.highlightedIndex].highlight = false;
      }
      this.optionsArray[index].highlight = true;
      this.highlightedIndex = index;
    }
  }

  constructor(private renderer: Renderer2) { }

  initOptions() {

    if (this.options) {
      // Initialize the optionsArray
      this.optionsArray = this.options.toArray();

      for (let i = 0; i < this.optionsArray.length; i++) {
        if (!this.optionsArray[i].hasListener) {

          // Remember if we already attached a listener
          this.optionsArray[i].hasListener = true;

          this.optionsArray[i].option.nativeElement.addEventListener('click', () => {

            this.selectIndex(i);
            this.dropdown.nativeElement.blur();
          });
          this.optionsArray[i].option.nativeElement.addEventListener('mouseenter', () => {
            this.highlightIndex(i);
          });
        }
      }
    }
  }

  ngOnInit() {

    this.renderer.listen('document', 'scroll', () => {
      if (!this.mouseOver) {
        this.scrolledOutside = true;
      }
    });
  }

  ngAfterViewInit() {

    this.initOptions();

    this.options.changes.subscribe(() => {
      this.initOptions();
    });
  }

  catchKey(event: KeyboardEvent) {
    const control = event.ctrlKey;
    const alt = event.altKey;
    const key = event.key;

    if (key) {
      switch (key) {
        case 'Tab':
        case 'Enter':
        this.pressedConfirm();
        break;
        case 'ArrowUp':
        this.pressedArrowUp(alt);
        break;
        case 'ArrowDown':
        this.pressedArrowDown(alt);
        break;
        case 'Escape':
        this.dropdown.nativeElement.blur();
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
      this.dropdown.nativeElement.blur();
      return;
    }

    if (this.highlightedIndex < 0) {
      this.highlightIndex(this.selectedIndex);
    }
    if (this.highlightedIndex > 0) {
      this.selectIndex(this.highlightedIndex - 1);
      this.emit();
    }
  }

  pressedArrowDown(alt: boolean) {
    if (alt) {
      this.dropdown.nativeElement.blur();
      return;
    }

    if (this.highlightedIndex < 0) {
      this.highlightIndex(this.selectedIndex);
    }
    if (this.highlightedIndex < (this.optionsArray.length - 1)) {

      this.selectIndex(this.highlightedIndex + 1);
      this.emit();
    }
  }

  search(key: string) {

    key = key.toUpperCase();

    let searchIndex: number;
    if (this.highlightedIndex < 0) {
      searchIndex = 0;
    } else {
      searchIndex = this.highlightedIndex;
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

    for (let i = searchIndex; i < this.optionsArray.length; i++) {
      if (this.optionsArray[i].text.toUpperCase().startsWith(this.searchString)) {
        this.selectIndex(i);
        this.emit();
        return;
      }
    }
    for (let i = 0; i < searchIndex; i++) {
      // TODO: Change toUpperCase because not usable in every language
      if (this.optionsArray[i].text.toUpperCase().startsWith(this.searchString)) {
        this.selectIndex(i);
        this.emit();
        return;
      }
    }

    // If not found, reset search
    this.searchString = '';
  }

  pressedConfirm() {
    if (this.highlightedIndex >= 0) {
      this.selectIndex(this.highlightedIndex);
      this.emit();
    }
    this.dropdown.nativeElement.blur();
  }

  correctScroll() {

    const selected = this.selected;

    if (selected && this.optionsArray.length > 0) {

      const dropdownBottom = this.optionList.nativeElement.getBoundingClientRect().bottom;
      const elementBottom = selected.option.nativeElement.getBoundingClientRect().bottom;

      const dropdownTop = this.optionList.nativeElement.getBoundingClientRect().top;
      const elementTop = selected.option.nativeElement.getBoundingClientRect().top;

      if (elementBottom > dropdownBottom) {
        this.optionList.nativeElement.scrollTop += (elementBottom - dropdownBottom);
      } else if (elementTop < dropdownTop) {
        this.optionList.nativeElement.scrollTop -= (dropdownTop - elementTop);
      }
    }
  }

  scrollElementTop() {

    const selected = this.selected;

    if (selected && this.optionsArray.length > 0) {

      const dropdownTop = this.optionList.nativeElement.getBoundingClientRect().top;
      const elementTop = selected.option.nativeElement.getBoundingClientRect().top;

      this.optionList.nativeElement.scrollTop -= (dropdownTop - elementTop);
    }
  }

  emit() {
    if (this.selected) {
      this.value = this.selected.val;
    }
    this.propagateChange(this.value);
  }

  writeValue(value: any): void {
    if (value !== null) {
      this.value = value;

      for (let i = 0; i < this.optionsArray.length; i++) {
        if (this.optionsArray[i].val === value) {
          this.selectIndex(i);
          return;
        }
      }
    } else {
      this.selectIndex(-1);
    }
  }

  registerOnChange(fn: () => void): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void): void { }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
