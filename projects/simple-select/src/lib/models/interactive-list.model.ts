import { IInteractiveElement } from './interactive-element.model';

export interface IInteractiveList {
  skipPredicateFn: (_: object) => boolean;
  elements: IInteractiveElement[];
  selectedIndex: number;
  highlightedIndex: number;
}
