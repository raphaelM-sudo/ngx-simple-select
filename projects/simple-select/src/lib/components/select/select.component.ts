import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { animate, state, style, transition, trigger } from '@angular/animations';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
    AfterViewInit, Attribute, ChangeDetectionStrategy, ChangeDetectorRef, Component,
    ContentChildren, ElementRef, Input, Optional, QueryList, Self, ViewChild, ViewEncapsulation, DoCheck, OnDestroy
} from '@angular/core';
import { ControlValueAccessor, FormGroupDirective, NgControl, NgForm } from '@angular/forms';
import {
    CanDisable, CanDisableCtor, CanUpdateErrorState, CanUpdateErrorStateCtor, ErrorStateMatcher,
    HasTabIndex, HasTabIndexCtor, mixinDisabled, mixinErrorState, mixinTabIndex
} from '@angular/material/core';

import { Direction } from '../../models/direction.enum';
import { IInteractiveList } from '../../models/interactive-list.model';
import { IScrollableList } from '../../models/scrollable-list.model';
import { BrowserService } from '../../services/browser/browser.service';
import { DeviceService } from '../../services/device/device.service';
import { ListKeyManager } from '../a11y/key-manager/list-key-manager';
import { ListScrollManager } from '../a11y/scroll-manager/list-scroll-manager';
import { OptionComponent, SELECT_ELEMENT } from '../option/option.component';

let nextUniqueId = 0;

class SimpleSelectBase {
  constructor(public _elementRef: ElementRef,
              public _defaultErrorStateMatcher: ErrorStateMatcher,
              public _parentForm: NgForm,
              public _parentFormGroup: FormGroupDirective,
              public ngControl: NgControl) {}
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const _SimpleSelectMixinBase:
    CanDisableCtor &
    HasTabIndexCtor &
    CanUpdateErrorStateCtor &
    typeof SimpleSelectBase = mixinTabIndex(mixinDisabled(mixinErrorState(SimpleSelectBase)));

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
      useExisting: SelectComponent
    }
  ],
  // eslint-disable-next-line
  host: {
    '[attr.id]': 'id',
    '[attr.tabindex]': 'tabIndex',
    class: 'simple-select',
    role: 'listbox',
    '[attr.aria-label]': 'ariaLabel',
    '[attr.aria-required]': 'required.toString()',
    '[attr.aria-disabled]': 'disabled.toString()',
    '[attr.aria-invalid]': 'errorState',
    '[attr.aria-activedescendant]': 'activeDescendant',
    '[class.simple-disabled]': 'disabled',
    '[class.simple-required]': 'required',
    '[class.simple-select-mobile-tablet]': 'device.mobileOrTablet',
    '(blur)': 'stopFunctionality()',
    '(document:scroll)': 'scrolledOutsideSelect()',
    '(focus)': 'startFunctionality()',
    '(keydown)': 'keyManager.catchKey($event)'
  }
})
export class SelectComponent extends _SimpleSelectMixinBase
implements ControlValueAccessor, DoCheck, CanDisable, HasTabIndex, CanUpdateErrorState,
IScrollableList, IInteractiveList, AfterViewInit, OnDestroy {

  @Input() placeholder?: string;
  @Input() dir?: 'ltr' | 'rtl' | 'auto';
  @Input() errorStateMatcher: ErrorStateMatcher;
  @Input('aria-label') private _ariaLabel?: string;

  @Input()
  get id(): string { return this._id; }
  set id(id: string) {
    this._id = id || this.uid;
  }

  @Input()
  get value(): object | string | number { return this._value; }
  set value(value: object | string | number) {
    this.writeValue(value);
  }

  @Input()
  get hoverBorder(): boolean { return this._hoverBorder; }
  set hoverBorder(hoverBorder: boolean) {
    this._hoverBorder = coerceBooleanProperty(hoverBorder);
  }

  @Input()
  get animate(): boolean { return this._animate; }
  set animate(animateVal: boolean) {
    this._animate = coerceBooleanProperty(animateVal);
  }

  @Input()
  get required(): boolean { return this._required; }
  set required(required: boolean) {
    this._required = coerceBooleanProperty(required);
  }

  get showUI() {
    return !this.hoverBorder || this.focus || this.mouseOver || this.disabled;
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
              return Direction.rightToLeft;
            }
          }

          return Direction.leftToRight;
        }
      }
    }

    if (this.dir === 'rtl') {
      return Direction.rightToLeft;
    } else if (this.dir === 'ltr') {
      return Direction.leftToRight;
    }

    return Direction.default;
  }

  get ariaLabel(): string | null {
    return this._ariaLabel || this.placeholder;
  }

  get activeDescendant(): string | null {
    if (this.selectedIndex >= 0 && this.elements[this.selectedIndex]) {
      return this.elements[this.selectedIndex].id;
    }
    return null;
  }

  get elements() {
    return this._elements;
  }

  set elements(options: OptionComponent[]) {
    this._elements = options;
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  @ViewChild('optionList', { static: true }) list: ElementRef;
  // eslint-disable-next-line @typescript-eslint/member-ordering
  @ContentChildren(OptionComponent, {descendants: true}) options: QueryList<OptionComponent>;

  // Enum for usage in template
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Direction = Direction;

  focus = false;
  mouseOver = false;
  selectedIndex = -1;
  highlightedIndex = -1;

  scrollManager: ListScrollManager;
  keyManager: ListKeyManager;

  private _id: string;
  private _value: object | string | number;
  private _hoverBorder = false;
  private _animate = true;
  private _required = false;
  private _elements: OptionComponent[] = [];
  private optionSubscriptions: Subscription[] = [];

  private uid = `simple-select-${++nextUniqueId}`;
  // Emits whenever the component is destroyed
  private readonly destroy = new Subject<void>();

  constructor(
    private cdRef: ChangeDetectorRef,
    private browser: BrowserService,
    public device: DeviceService,
    elementRef: ElementRef,
    _defaultErrorStateMatcher: ErrorStateMatcher,
    @Optional() _parentForm: NgForm,
    @Optional() _parentFormGroup: FormGroupDirective,
    @Self() @Optional() public ngControl: NgControl,
    @Attribute('tabindex') tabIndex: string) {

    super(elementRef, _defaultErrorStateMatcher, _parentForm,
          _parentFormGroup, ngControl);

    if (this.ngControl) {
      // Note: we provide the value accessor through here, instead of
      // the `providers` to avoid running into a circular import.
      this.ngControl.valueAccessor = this;
    }

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
    if (!this.browser.isEdge) {
      this._elementRef.nativeElement.blur();
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
    if (index < this.elements.length) {
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
        this.highlightIndex(0);
        this.emit();
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
    if (this.selectedIndex >= 0 && this.selectedIndex < this.elements.length) {
      this._value = this.elements[this.selectedIndex].value;
    } else {
      this._value = null;
    }

    this.propagateChange(this._value);
  }

  writeValue(value: any): void {
    if (value !== null) {
      this._value = value;

      if (this._elementRef) {
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
      this.updateOptions();
    });

    this.cdRef.detectChanges();
  }

  updateOptions() {
    // Reset the selection when the options changed
    this.initOptions();
    let selectedIndex = -1;

    // Select option based on previously selected value
    for (let i = 0; i < this.elements.length; i++) {
      if (this.elements[i].value === this._value) {
        selectedIndex = i;
        break;
      }
    }

    this.selectIndex(selectedIndex);
    this.keyManager.update();
    this.cdRef.markForCheck();
    this.ngDoCheck();
  }

  ngDoCheck() {
    if (this.ngControl) {
      this.updateErrorState();
    }
  }

  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
    this.stateChanges.complete();
  }
}
