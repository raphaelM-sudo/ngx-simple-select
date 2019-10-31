import { animate, state, style, transition, trigger } from '@angular/animations';
import {
    AfterViewInit, ChangeDetectorRef, Component, ContentChildren, ElementRef, forwardRef, Input,
    OnDestroy, QueryList, Renderer2, ViewChild
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { DeviceService } from '../device.service';
import { Direction } from '../direction.enum';
import { OptionComponent } from '../option/option.component';
import { ParentService } from '../parent.service';

export const INPUT_TIMEOUT = 500;

@Component({
  selector: 'simple-select',
  animations: [
    trigger('spin', [
      state('initial', style({
        transform: 'rotate(0)'
      })),
      state('rotate', style({
        transform: 'rotate({{degrees}}deg)'
      }), {params: {degrees: -180}}),
      transition('initial <=> rotate', [
        animate('.2s linear')
      ])
    ]),
  ],
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  providers: [
    ParentService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  // tslint:disable-next-line: use-host-property-decorator
  host: {class: 'simple-select'}
})
export class SelectComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {

  @Input() placeholder?: string;
  @Input() disabled = false;
  @Input() hoverBorder = false;
  @Input() animate = true;
  @Input() value: object | string | number;
  @Input() dir?: 'ltr' | 'rtl' | 'auto';

  // Enum
  Direction = Direction;

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
    if (this.selectedIndex >= 0 && this.optionsArray.length > this.selectedIndex) {
      return this.optionsArray[this.selectedIndex];
    }
    return null;
  }

  get highlighted(): OptionComponent {
    if (this.highlightedIndex >= 0 && this.optionsArray.length > this.highlightedIndex) {
      return this.optionsArray[this.highlightedIndex];
    }
    return null;
  }

  get direction(): Direction {
    if (this.dir) {
      if (this.dir === 'auto') {
        if (this.optionsArray) {

          for (const option of this.optionsArray) {
            if (option.isRTL()) {
              return Direction.RightToLeft;
            }
          }

          return Direction.LeftToRight;
        }
      }
    }

    if (this.dir === 'rtl') {
      return Direction.RightToLeft;
    } else if (this.dir === 'ltr') {
      return Direction.LeftToRight;
    }

    return Direction.Default;
  }

  @ViewChild('dropdown') dropdown: ElementRef;
  @ViewChild('optionList') optionList: ElementRef;
  @ContentChildren(OptionComponent) options: QueryList<OptionComponent>;

  focus = false;
  mouseOver = false;
  scrolledOutside = false;
  selectedIndex = -1;
  highlightedIndex = 0;
  searchString = '';
  scrolling = false;

  timeoutHandler = null;

  // Array of renderer2 unlisten functions: There is no documentation if Angular unlistens on destroy by itself ...ヽ(ಠ_ಠ)ノ
  // We want to use renderer in favour of HostListener to conditionally add the popstate listener
  unlisteners: (() => void)[] = [];

  // tslint:disable-next-line: variable-name
  private _optionsArray: OptionComponent[];

  propagateChange = (_: any) => {};

  startFunctionality() {
    if (!this.disabled && this.optionsArray) {

      if (this.selectedIndex >= 0) {
        this.highlightIndex(this.selectedIndex);
      } else {
        this.highlightIndex(0);
      }

      this.scrollElementTop();

      this.focus = true;
      this.scrolledOutside = false;
    }
  }

  stopFunctionality() {
    this.focus = false;
  }

  mouseenter() {
    this.mouseOver = true;
  }

  mouseleave() {
    this.mouseOver = false;
  }

  selectIndex(index: number, initial?: boolean) {
    if (this.selectedIndex >= 0 && this.optionsArray.length > this.selectedIndex) {
      this.optionsArray[this.selectedIndex].selected = false;
    }
    this.selectedIndex = index;
    if (index >= 0) {
      this.optionsArray[index].selected = true;
      this.highlightIndex(index);

      if (!initial) {
        this.correctScroll();
      }

      this.emit();
    }
  }

  highlightIndex(index: number) {
    if (index >= 0 && this.optionsArray.length > this.highlightedIndex) {
      if (this.highlighted) {
        this.optionsArray[this.highlightedIndex].highlighted = false;
      }
      this.optionsArray[index].highlighted = true;
      this.highlightedIndex = index;
    }
  }

  constructor(
    public parent: ParentService<SelectComponent>,
    public device: DeviceService,
    private renderer: Renderer2,
    private cdRef: ChangeDetectorRef) {

    parent.component = this;

    if (this.device.mobileOrTablet) {
      this.unlisteners.push(
        this.renderer.listen('window', 'popstate', () => {
          if (this.showList) {
            history.forward();
            if (this.dropdown) {
              this.dropdown.nativeElement.blur();
            }
          }
        })
      );
    }

    this.unlisteners.push(
      this.renderer.listen('document', 'scroll', () => {
        if (!this.mouseOver) {
          this.scrolledOutside = true;
        }
      })
    );
  }

  initOptions() {

    if (this.options) {
      // Initialize the optionsArray
      this.optionsArray = this.options.toArray();

      for (let i = 0; i < this.optionsArray.length; i++) {
        this.optionsArray[i].index = i;
      }
    }
  }

  ngAfterViewInit() {

    this.initOptions();

    this.options.changes.subscribe(() => {

      // Reset the selection when the options changed
      this.selectIndex(-1);
      this.highlightIndex(0);

      this.initOptions();
    });

    this.cdRef.detectChanges();
  }

  ngOnDestroy() {
    for (const unlisten of this.unlisteners) {
      unlisten();
    }
  }

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
      this.highlightedIndex = this.selectedIndex;
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
      this.highlightedIndex = this.selectedIndex;
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

  scrollDown(element: ElementRef<any>, offset: number) {
    this.scrolling = true;
    element.nativeElement.scrollTop += offset;
  }

  scrollUp(element: ElementRef<any>, offset: number) {
    this.scrolling = true;
    element.nativeElement.scrollTop -= offset;
  }

  offsetTop(element: ElementRef<any>) {
    let el = element.nativeElement;
    let offsetTop  = 0;

    do {
      offsetTop  += el.offsetTop;

      el = el.offsetParent;
    } while (el);

    return offsetTop;
  }

  offsetBottom(element: ElementRef<any>) {
    return this.offsetTop(element) + element.nativeElement.offsetHeight;
  }

  correctScroll() {

    if (this.optionList && this.optionsArray.length > this.selectedIndex) {

      const selected = this.optionsArray[this.highlightedIndex];

      const dropdownTop = this.offsetTop(this.optionList);
      const elementTop = this.offsetTop(selected.optionField) - this.optionList.nativeElement.scrollTop;

      const dropdownBottom = this.offsetBottom(this.optionList);
      const elementBottom = this.offsetBottom(selected.optionField) - this.optionList.nativeElement.scrollTop;

      if (elementBottom > dropdownBottom) {
        this.scrollDown(this.optionList, elementBottom - dropdownBottom);
      } else if (elementTop < dropdownTop) {
        this.scrollUp(this.optionList, dropdownTop - elementTop);
      }
    }
  }

  scrollElementMiddle() {

    if (this.optionList && this.optionsArray.length > this.highlightedIndex) {

      const highlighted = this.optionsArray[this.highlightedIndex];

      const dropdownTop = this.offsetTop(this.optionList);
      const elementTop = this.offsetTop(highlighted.optionField) - this.optionList.nativeElement.scrollTop;

      const dropdownBottom = this.offsetBottom(this.optionList);
      const elementBottom = this.offsetBottom(highlighted.optionField) - this.optionList.nativeElement.scrollTop;

      const dropdownMiddle = (dropdownTop - dropdownBottom) / 2;
      const elementMiddle = (elementTop - elementBottom) / 2;

      this.scrollUp(this.optionList, dropdownMiddle - elementMiddle);
    }
  }

  scrollElementTop() {

    if (this.optionList && this.optionsArray.length > this.highlightedIndex) {

      const highlighted = this.optionsArray[this.highlightedIndex];

      const dropdownTop = this.offsetTop(this.optionList);
      const elementTop = this.offsetTop(highlighted.optionField) - this.optionList.nativeElement.scrollTop;

      this.scrollUp(this.optionList, dropdownTop - elementTop);
    }
  }

  scrollClippedElement() {
    if (this.optionList && this.optionsArray.length > this.selectedIndex) {

      const selected = this.optionsArray[this.highlightedIndex];

      const dropdownTop = this.offsetTop(this.optionList);
      const elementTop = this.offsetTop(selected.optionField) - this.optionList.nativeElement.scrollTop;

      const dropdownBottom = this.offsetBottom(this.optionList);
      const elementBottom = this.offsetBottom(selected.optionField) - this.optionList.nativeElement.scrollTop;

      if (elementBottom > dropdownBottom && elementTop < dropdownBottom) {
        this.scrollDown(this.optionList, elementBottom - dropdownBottom);
      } else if (elementTop < dropdownTop && elementBottom > dropdownTop) {
        this.scrollUp(this.optionList, dropdownTop - elementTop);
      }
    }
  }

  emit() {
    const selected = this.selected;

    if (selected) {
      this.value = selected.val;
    }
    this.propagateChange(this.value);
  }

  writeValue(value: any): void {
    if (value !== null) {
      this.value = value;

      if (this.dropdown && this.optionsArray) {
        for (let i = 0; i < this.optionsArray.length; i++) {
          if (this.optionsArray[i].val === value) {
            this.selectIndex(i, true);
            return;
          }
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
