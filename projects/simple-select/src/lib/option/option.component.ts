import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'simple-option',
  animations: [
    trigger('scrollLeft', [
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
  styleUrls: ['./option.component.scss']
})
export class OptionComponent implements OnInit, ControlValueAccessor {

  @Input() label?: string;
  @Input() selected = false;
  @Input() value: string | number = null;
  @Input() ngValue: object = null;
  @Input() disabled = false;

  @ViewChild('option') option: ElementRef;

  get val(): object | string | number {
    if (this.ngValue) {
      return this.ngValue;
    }

    return this.value;
  }

  get text(): string {

    const childNodes = this.option.nativeElement.childNodes;

    if (childNodes.length > 0) {

      const optionNodes = childNodes[0].childNodes;

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

    return this.option.nativeElement.textContent as string;
  }

  get html(): string {

    const childNodes = this.option.nativeElement.childNodes;

    if (childNodes.length > 0) {
      return childNodes[0].innerHTML as string;
    }

    return '';
  }

  hovered = false;
  highlight = false;
  overflowOffset = 0;
  scrollSideways = false;
  hasListener = false;

  shouldScrollSideways() {
    return this.hovered && this.scrollSideways;
  }

  startFunctionality() {
    this.hovered = true;
    this.calculateScroll();
  }

  stopFunctionality() {
    this.hovered = false;
  }

  calculateScroll() {
    if (this.hovered) {

      const element = this.option.nativeElement;

      if (element.scrollWidth > element.clientWidth) {
        this.scrollSideways = true;
        this.overflowOffset = element.clientWidth - element.scrollWidth - 5;
      } else {
        this.scrollSideways = false;
        this.overflowOffset = 0;
      }
    }
  }

  shouldHighlight() {
    return this.highlight;
  }

  constructor() { }

  ngOnInit() {
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
