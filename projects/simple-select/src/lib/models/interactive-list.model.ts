import { IInteractiveElement } from './interactive-element.model';

export interface IInteractiveList {
  // eslint-disable-next-line @typescript-eslint/ban-types
  skipPredicateFn: (_: object) => boolean;
  elements: IInteractiveElement[];
  selectedIndex: number;
  highlightedIndex: number;
}
