import { Subject } from 'rxjs';

import { animate, state, style, transition, trigger } from '@angular/animations';
import {
    ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, InjectionToken,
    Input, ViewChild, ViewEncapsulation
} from '@angular/core';

import { IDirectionElement } from '../../models/direction-element.model';
import { Direction } from '../../models/direction.enum';
import { IScrollableElement } from '../../models/scrollable-element.model';

export const DIRECTION_ELEMENT = new InjectionToken<IDirectionElement>('OPTION_PARENT_COMPONENT');

let nextUniqueId = 0;

@Component({
  selector: 'simple-option',
  exportAs: 'simpleOption',
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
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // tslint:disable-next-line: use-host-property-decorator
  host: {
    class: 'simple-option',
    role: 'option',
    '[attr.id]': 'id',
    '[attr.aria-selected]': 'selected.toString()',
    '[attr.aria-disabled]': 'disabled.toString()',
    '[class.simple-disabled]': 'disabled',
    '[class.simple-option-rtl]': 'direction === Direction.RightToLeft',
    '[class.simple-option-ltr]': 'direction === Direction.LeftToRight',
    '(click)': 'select.next()',
    '(mouseleave)': 'stopFunctionality()',
    '(mousemove)': 'startFunctionality()'
  }
})
export class OptionComponent implements IScrollableElement {

  @Input() label?: string;
  @Input() value: string | number = null;
  @Input() ngValue: object = null;
  @Input() disabled = false;
  @Input() dir?: 'ltr' | 'rtl' | 'auto';

  @Input()
  get id(): string { return this._id; }
  set id(value: string) {
    this._id = value || this.uid;
  }

  @ViewChild('optionField', { static: true }) element: ElementRef;
  @ViewChild('content', { static: true }) content: ElementRef;

  highlight: Subject<void> = new Subject<void>();
  select: Subject<void> = new Subject<void>();

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

    if (!this.dir && this.parentDirection.dir) {
      this.dir = this.parentDirection.dir;
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

  get highlighted(): boolean {
    return this._highlighted;
  }

  set highlighted(highlighted: boolean) {
    this._highlighted = highlighted;
    this.cdRef.detectChanges();
  }

  // tslint:disable: variable-name
  private _id: string;
  private _highlighted = false;

  private uid = `simple-option-${++nextUniqueId}`;

  selected = false;
  hovered = false;
  overflowOffset = 0;
  scrollSideways = false;

  isRTL() {
    const ltrChars = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF' + '\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF';
    const rtlChars = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC';

    const rtlDirCheck = new RegExp('^[^' + ltrChars + ']*[' + rtlChars + ']');

    return rtlDirCheck.test(this.text);
  }

  shouldScrollSideways() {
    return this.highlighted && this.hovered && this.scrollSideways;
  }

  startFunctionality() {
    this.hovered = true;

    if (!this.highlighted) {
      this.highlight.next();
      this.calculateScroll();
    }
  }

  stopFunctionality() {
    this.hovered = false;
  }

  calculateScroll() {
    if (this.hovered) {

      const element = this.element.nativeElement;

      if (element.scrollWidth > element.clientWidth) {
        this.scrollSideways = true;
        this.overflowOffset = element.clientWidth - element.scrollWidth;

        this.overflowOffset -= 5;

        if (this.direction === Direction.RightToLeft) {
          this.overflowOffset = -this.overflowOffset;
        }
      } else {
        this.scrollSideways = false;
        this.overflowOffset = 0;
      }
    }
  }

  constructor(private cdRef: ChangeDetectorRef, @Inject(DIRECTION_ELEMENT) private parentDirection: IDirectionElement) {
    // Force setter to be called in case id was not specified.
    this.id = this.id;
  }
}
