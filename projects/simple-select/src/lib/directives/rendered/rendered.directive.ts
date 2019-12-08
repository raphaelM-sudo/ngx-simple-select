import { AfterViewInit, Directive, EventEmitter, Output } from '@angular/core';

@Directive({
  selector: '[simpleRendered]'
})
export class RenderedDirective implements AfterViewInit {

  @Output() renderComplete = new EventEmitter<void>();

  ngAfterViewInit() {
    this.renderComplete.emit();
  }
}
