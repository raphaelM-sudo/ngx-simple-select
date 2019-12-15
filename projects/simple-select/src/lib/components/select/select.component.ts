import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { animate, state, style, transition, trigger } from '@angular/animations';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
    AfterViewInit, Attribute, ChangeDetectionStrategy, ChangeDetectorRef, Component,
    ContentChildren, ElementRef, forwardRef, Input, QueryList, ViewChild, ViewEncapsulation
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { Direction } from '../../models/direction.enum';
import { CanDisable, CanDisableCtor, mixinDisabled } from '../../models/disable.model';
import { IInteractiveList } from '../../models/interactive-list.model';
import { IScrollableList } from '../../models/scrollable-list.model';
import { HasTabIndexCtor, mixinTabIndex } from '../../models/tab-index.model';
import { DeviceService } from '../../services/device/device.service';
import { ListKeyManager } from '../a11y/key-manager/list-key-manager';
import { ListScrollManager } from '../a11y/scroll-manager/list-scroll-manager';
import { OptionComponent, SELECT_ELEMENT } from '../option/option.component';

let nextUniqueId = 0;

class SimpleSelectBase {
  constructor(public elementRef: ElementRef) {}
}
// tslint:disable-next-line: variable-name
const _SimpleSelectMixinBase:
    CanDisableCtor &
    HasTabIndexCtor &
    typeof SimpleSelectBase = mixinTabIndex(mixinDisabled(SimpleSelectBase));

@Component({
  selector: 'simple-select',
  exportAs: 'simpleSelect',
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
  inputs: ['disabled', 'tabIndex'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: SELECT_ELEMENT,
      useExisting: forwardRef(() => SelectComponent)
    },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  // tslint:disable-next-line: use-host-property-decorator
  host: {
    '[attr.id]': 'id',
    '[attr.tabindex]': 'tabIndex',
    class: 'simple-select',
    role: 'listbox',
    '[attr.aria-label]': 'ariaLabel',
    '[attr.aria-required]': 'required.toString()',
    '[attr.aria-disabled]': 'disabled.toString()',
    '[attr.aria-activedescendant]': 'activeDescendant',
    '[class.simple-disabled]': 'disabled',
    '[class.simple-select-mobile-tablet]': 'device.mobileOrTablet',
    '(blur)': 'stopFunctionality()',
    '(document:scroll)': 'scrolledOutsideSelect()',
    '(focus)': 'startFunctionality()',
    '(keydown)': 'keyManager.catchKey($event)'
  }
})
export class SelectComponent extends _SimpleSelectMixinBase
implements CanDisable, IScrollableList, IInteractiveList, AfterViewInit, ControlValueAccessor {

  // tslint:disable-next-line: variable-name no-input-rename
  @Input('aria-label') private _ariaLabel?: string;
  @Input() placeholder?: string;
  @Input() hoverBorder = false;
  @Input() animate = true;
  @Input() value: object | string | number;
  @Input() dir?: 'ltr' | 'rtl' | 'auto';

  @Input()
  get id(): string { return this._id; }
  set id(id: string) {
    this._id = id || this.uid;
  }

  @Input()
  get required(): boolean { return this._required; }
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
  }

  get showUI() {
    return !this.hoverBorder || this.focus || this.mouseOver;
  }

  get showArrowAnimation() {
    return this.focus;
  }

  get showList() {
    return this.elements.length > 0 && this.focus;
  }

  get selected(): OptionComponent {
    if (this.selectedIndex >= 0 && this.elements.length > this.selectedIndex) {
      return this.elements[this.selectedIndex];
    }
    return null;
  }

  get direction(): Direction {
    if (this.dir) {
      if (this.dir === 'auto') {
        if (this.elements) {

          for (const option of this.elements) {
            if (option.isRTL) {
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

  get ariaLabel(): string | null {
    return this._ariaLabel || this.placeholder;
  }

  get activeDescendant(): string | null {
    return this.selectedIndex >= 0 ? this.elements[this.selectedIndex].id : null;
  }

  get elements() {
    return this._elements;
  }

  set elements(options: OptionComponent[]) {
    this._elements = options;
  }

  @ViewChild('optionList', { static: true }) list: ElementRef;
  @ContentChildren(forwardRef(() => OptionComponent)) options: QueryList<OptionComponent>;

  // tslint:disable: variable-name
  private _id: string;
  private _required = false;
  private _elements: OptionComponent[] = [];
  private optionSubscriptions: Subscription[] = [];

  private uid = `simple-select-${++nextUniqueId}`;
  // Emits whenever the component is destroyed
  private readonly destroy = new Subject<void>();

  // Enum for usage in template
  Direction = Direction;

  isEdgeBrowser = false;

  focus = false;
  mouseOver = false;
  selectedIndex = -1;
  highlightedIndex = -1;

  scrollManager: ListScrollManager;
  keyManager: ListKeyManager;

  skipPredicateFn = (item: OptionComponent) => item.disabled;
  propagateChange = (_: any) => {};
  propagateTouched = () => {};

  startFunctionality() {
    // If not disabled and not already focused
    if (!this.disabled && !this.focus) {
      this.highlightIndex(this.selectedIndex);
      this.focus = true;
    }
  }

  stopFunctionality() {

    // Call stopFunctionality of the highlighted option to stop sideway scroll
    if (this.highlightedIndex >= 0 && this.highlightedIndex < this.elements.length) {
      this.elements[this.highlightedIndex].stopFunctionality();
    }

    this.focus = false;
    this.propagateTouched();
  }

  mouseenter() {
    this.mouseOver = true;
  }

  mouseleave() {
    this.mouseOver = false;
  }

  scrolledOutsideSelect() {
    if (!this.mouseOver && !this.disabled && this.focus) {
      this.blur();
    }
  }

  blur() {
    if (!this.isEdgeBrowser) {
      this.elementRef.nativeElement.blur();
    } else {
      // Edge workaround to maintain tabindex
      // After bluring an element in Edge, the tabindex resets
      // It works, but the focus stays and startFunctionality triggers after reselecting the browser window
      // Won't fix this - Edge should fix its bugs...
      this.stopFunctionality();
    }
  }

  renderedList() {
    this.scrollManager.scrollElementTop(this.highlightedIndex);
  }

  selectIndex(index: number) {
    if (this.elements.length > 0) {

      if (index >= 0) {
        if (!this.skipPredicateFn(this.elements[index])) {
          // Do not reselect, but highlight
          if (this.selectedIndex !== index) {
            if (this.selectedIndex >= 0) {
              this.elements[this.selectedIndex].selected = false;
            }

            this.elements[index].selected = true;
            this.selectedIndex = index;
            this.emit();
          }

          this.highlightIndex(index);
        }
      } else {
        this.selectedIndex = index;
      }
    }
  }

  highlightIndex(index: number) {
    if (this.elements.length > 0 &&
      index >= 0 &&
      this.highlightedIndex !== index &&
      !this.skipPredicateFn(this.elements[index])) {

      if (this.highlightedIndex >= 0 && this.highlightedIndex < this.elements.length) {
        this.elements[this.highlightedIndex].highlighted = false;
      }

      this.elements[index].highlighted = true;
      this.highlightedIndex = index;
    }
  }

  initOptions() {

    if (this.options) {

      // Removing previous subscriptions
      for (const subscription of this.optionSubscriptions) {
        subscription.unsubscribe();
      }

      this.optionSubscriptions = [];

      // Initialize the elements
      this.elements = this.options.toArray();

      for (let i = 0; i < this.elements.length; i++) {

        const element = this.elements[i];

        this.optionSubscriptions.push(element.select.pipe(takeUntil(this.destroy)).subscribe(() => {
          this.selectIndex(i);
        }));

        this.optionSubscriptions.push(element.highlight.pipe(takeUntil(this.destroy)).subscribe(() => {
          this.highlightIndex(i);
          this.scrollManager.scrollClippedElement(i);
        }));
      }
    }
  }

  emit() {
    if (this.selectedIndex >= 0) {
      this.value = this.elements[this.selectedIndex].value;
    }
    this.propagateChange(this.value);
  }

  writeValue(value: any): void {
    if (value !== null) {
      this.value = value;

      if (this.elementRef) {
        for (let i = 0; i < this.elements.length; i++) {
          if (this.elements[i].value === value) {
            this.selectIndex(i);
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

  registerOnTouched(fn: () => void): void {
    this.propagateTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  ngAfterViewInit() {

    this.initOptions();
    // Reset highlightedIndex to 0 or to the selectedIndex
    this.highlightIndex((this.selectedIndex >= 0) ? this.selectedIndex : 0);

    this.options.changes.pipe(takeUntil(this.destroy)).subscribe(() => {

      // Reset the selection when the options changed
      this.selectIndex(-1);
      this.initOptions();
      this.highlightIndex(0);

      this.cdRef.markForCheck();
    });

    this.cdRef.detectChanges();
  }

  constructor(
    private cdRef: ChangeDetectorRef,
    public device: DeviceService,
    elementRef: ElementRef,
    @Attribute('tabindex') tabIndex: string) {

    super(elementRef);

    this.isEdgeBrowser = /Edge\/\d./i.test(window.navigator.userAgent);

    this.scrollManager = new ListScrollManager(this);
    this.keyManager = new ListKeyManager(this);

    this.keyManager.blur.pipe(takeUntil(this.destroy)).subscribe(() => {
      this.blur();
    });

    this.keyManager.select.pipe(takeUntil(this.destroy)).subscribe((index: number) => {
      this.selectIndex(index);
      this.emit();
      this.scrollManager.correctScroll(this.highlightedIndex);
    });

    this.tabIndex = parseInt(tabIndex, 10) || 0;

    // Force setter to be called in case id was not specified.
    this.id = this.id;
  }
}
