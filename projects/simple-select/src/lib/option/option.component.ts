import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, Input, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';

import { DeviceService } from '../device.service';
import { Direction } from '../direction.enum';
import { ParentService } from '../parent.service';
import { SelectComponent } from '../select/select.component';

@Component({
  selector: 'simple-option',
  animations: [
    trigger('scroll', [
      state('initial', style({
        transform: 'translateX(0)'
      })),
      state('scrolled', style({
        transform: 'translateX({{offset}}px)'
      }), {params: {offset: 0}}),
      transition('initial => scrolled', [
        animate('1500ms 250ms ease-in-out')
      ])
    ]),
  ],
  templateUrl: './option.component.html',
  styleUrls: ['./option.component.scss'],
  // tslint:disable-next-line: use-host-property-decorator
  host: {class: 'simple-option'}
})
export class OptionComponent implements OnDestroy, ControlValueAccessor {

  @Input() label?: string;
  @Input() value: string | number = null;
  @Input() ngValue: object = null;
  @Input() disabled = false;
  @Input() dir?: 'ltr' | 'rtl' | 'auto';

  @ViewChild('optionField') optionField: ElementRef;
  @ViewChild('content') content: ElementRef;

  Direction = Direction;

  get val(): object | string | number {
    if (this.ngValue) {
      return this.ngValue;
    }

    return this.value;
  }

  get text(): string {

    const contentChildNodes = this.content.nativeElement.childNodes;

    if (contentChildNodes.length > 0) {

      const optionNodes = contentChildNodes.childNodes;

      if (optionNodes) {

        let str = '';

        for (const optionNode of optionNodes) {
          if (optionNode.nodeType === 3) {
            str += optionNode.textContent;
          }
        }

        return str;
      }
    }

    return this.content.nativeElement.textContent as string;
  }

  get html(): string {

    if (this.content) {
      return this.content.nativeElement.innerHTML as string;
    }

    return '';
  }

  get direction(): Direction {

    if (!this.dir && this.parent.component.dir) {
      this.dir = this.parent.component.dir;
    }

    if (this.dir) {

      switch (this.dir) {
        case 'rtl':
        return Direction.RightToLeft;
        case 'auto':
        return this.isRTL() ? Direction.RightToLeft : Direction.LeftToRight;
        default:
        return Direction.LeftToRight;
      }
    }

    return Direction.Default;
  }

  index: number;
  selected = false;
  hovered = false;
  highlighted = false;
  overflowOffset = 0;
  scrollSideways = false;

  unlisteners: (() => void)[] = [];

  isRTL() {
    const ltrChars = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF'+'\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF';
    const rtlChars = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC';

    const rtlDirCheck = new RegExp('^[^' + ltrChars + ']*[' + rtlChars + ']');

    return rtlDirCheck.test(this.text);
  }

  shouldScrollSideways() {
    return this.highlighted && this.hovered && this.scrollSideways;
  }

  startFunctionality() {
    if (!this.parent.component.scrolling) {
      this.hovered = true;

      if (!this.highlighted) {
        this.parent.component.highlightIndex(this.index);
        this.parent.component.scrollClippedElement();
        this.calculateScroll();
      }
    } else {
      this.parent.component.scrolling = false;
    }
  }

  stopFunctionality() {
    this.hovered = false;
  }

  calculateScroll() {
    if (this.hovered) {

      const element = this.optionField.nativeElement;

      if (element.scrollWidth > element.clientWidth) {
        this.scrollSideways = true;
        this.overflowOffset = element.clientWidth - element.scrollWidth;

        if (!this.device.mobileOrTablet) {
          this.overflowOffset -= 5;
        }

        if (this.direction === Direction.RightToLeft) {
          this.overflowOffset = -this.overflowOffset;
        }
      } else {
        this.scrollSideways = false;
        this.overflowOffset = 0;
      }
    }
  }

  select() {
    this.parent.component.selectIndex(this.index);
    this.parent.component.dropdown.nativeElement.blur();
  }

  constructor(
    private parent: ParentService<SelectComponent>,
    private elementRef: ElementRef,
    private device: DeviceService,
    private renderer: Renderer2
  ) {

    // Only add hover listeners for PCs
    if (!this.device.mobileOrTablet) {

      this.unlisteners.push(
        // Using mousemove here, so that the hover functionality triggers after moving the mouse on an element after scroll
        this.renderer.listen(this.elementRef.nativeElement, 'mousemove', () => {
        this.startFunctionality();
        })
      );

      this.unlisteners.push(
        this.renderer.listen(this.elementRef.nativeElement, 'mouseleave', () => {
          this.stopFunctionality();
        })
      );
    }
  }

  ngOnDestroy() {
    for (const unlisten of this.unlisteners) {
      unlisten();
    }
  }

  writeValue(value: any): void {

  }

  registerOnChange(fn: () => void): void {

  }

  registerOnTouched(fn: () => void): void { }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
