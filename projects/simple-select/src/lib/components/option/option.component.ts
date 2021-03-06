import { Subject } from 'rxjs';

import { animate, state, style, transition, trigger } from '@angular/animations';
import {
    ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, InjectionToken,
    Input, Optional, ViewChild, ViewEncapsulation
} from '@angular/core';
import { CanDisableCtor, mixinDisabled } from '@angular/material/core';

import { Direction } from '../../models/direction.enum';
import { IScrollableElement } from '../../models/scrollable-element.model';
import { ISelectElement } from '../../models/select-element.model';
import { BrowserService } from '../../services/browser/browser.service';
import { DirectionService } from '../../services/direction/direction.service';

export const SELECT_ELEMENT = new InjectionToken<ISelectElement>('OPTION_PARENT_COMPONENT');

let nextUniqueId = 0;

class SimpleOptionBase {}

// eslint-disable-next-line @typescript-eslint/naming-convention
const _SimpleSelectMixinBase:
    CanDisableCtor &
    typeof SimpleOptionBase = mixinDisabled(SimpleOptionBase);

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
      transition('* => scrolled', [
        animate('1500ms 250ms ease-in-out')
      ])
    ]),
  ],
  templateUrl: './option.component.html',
  inputs: ['disabled'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line
  host: {
    '[attr.id]': 'id',
    class: 'simple-option',
    role: 'option',
    '[attr.aria-selected]': 'selected.toString()',
    '[attr.aria-disabled]': 'disabled.toString()',
    '[class.simple-disabled]': 'disabled',
    '[class.simple-option-rtl]': 'direction === Direction.rightToLeft',
    '[class.simple-option-ltr]': 'direction === Direction.leftToRight',
    '(click)': 'select.next()',
    '(mouseleave)': 'stopFunctionality()',
    '(mousemove)': 'startFunctionality()'
  }
})
export class OptionComponent extends _SimpleSelectMixinBase implements IScrollableElement {

  @Input() label?: string;
  @Input() value: any;
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

  // eslint-disable-next-line @typescript-eslint/naming-convention
  Direction = Direction;

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

  // Used in select.component.html
  get html(): string {

    if (this.content) {
      return this.content.nativeElement.innerHTML as string;
    }

    return '';
  }

  get isRTL(): boolean {
    return this.dirService.isRTL(this.text);
  }

  get direction(): Direction {

    if (!this.dir && this.parent && this.parent.dir) {
      this.dir = this.parent.dir;
    }

    if (this.dir) {

      switch (this.dir) {
        case 'rtl':
        return Direction.rightToLeft;
        case 'auto':
        return this.isRTL ? Direction.rightToLeft : Direction.leftToRight;
        default:
        return Direction.leftToRight;
      }
    }

    return Direction.default;
  }

  get highlighted(): boolean {
    return this._highlighted;
  }

  set highlighted(highlighted: boolean) {
    this._highlighted = highlighted;
    this.cdRef.detectChanges();
  }

  selected = false;
  hovered = false;
  overflowOffset = 0;
  scrollSideways = false;

  private _id: string;
  private _highlighted = false;

  private uid = `simple-option-${++nextUniqueId}`;
  private clientWidth = -1;

  constructor(
    private cdRef: ChangeDetectorRef,
    private browser: BrowserService,
    private dirService: DirectionService,
    @Optional() @Inject(SELECT_ELEMENT) private parent: ISelectElement) {

    super();

    // Force setter to be called in case id was not specified.
    this.id = this.id;
  }

  shouldScrollSideways(): boolean {
    return this.highlighted && this.hovered && this.scrollSideways;
  }

  startFunctionality() {
    this.hovered = true;

    // Should be always calculated in case the window size changed
    this.calculateScroll();

    if (!this.highlighted) {
      this.highlight.next();
    }
  }

  stopFunctionality() {
    this.hovered = false;
    this.cdRef.markForCheck(); // Necessary to display sideway scroll properly
    this.cdRef.detectChanges(); // Necessary to display scroll sideways properly after blur
  }

  calculateScroll() {

    const element = this.element.nativeElement;

    // Only recalculate when the client width changed
    if (element.clientWidth !== this.clientWidth) {

      // Set clientWidth to the current width
      this.clientWidth = element.clientWidth;

      // Edge gonna be Edge...
      // Simple greater than comparison does not work in Edge
      // It seems to be a floating point issue
      // Microsoft Edge 44.18362.449.0

      if (!this.browser.isEdge && (element.scrollWidth > element.clientWidth) ||
        (element.scrollWidth - element.clientWidth) > 1
      ) {

        this.scrollSideways = true;
        this.overflowOffset = element.clientWidth - element.scrollWidth;

        this.overflowOffset -= 4; // Just moving it 4px away from the scrollbar, for readability
        // Update scroll sideways transition
        this.cdRef.markForCheck();
        this.cdRef.detectChanges();

        if (this.direction === Direction.rightToLeft) {
          this.overflowOffset = -this.overflowOffset;
        }
      } else {
        this.scrollSideways = false;
        this.overflowOffset = 0;
      }
    }
  }
}
