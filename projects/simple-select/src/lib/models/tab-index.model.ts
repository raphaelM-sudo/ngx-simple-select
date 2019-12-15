/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */


import { Constructor } from './constructor.model';
import { CanDisable } from './disable.model';

/** @docs-private */
export interface HasTabIndex {
  /** Tabindex of the component. */
  tabIndex: number;
}

/** @docs-private */
export type HasTabIndexCtor = Constructor<HasTabIndex>;

/** Mixin to augment a directive with a `tabIndex` property. */
export function mixinTabIndex<T extends Constructor<CanDisable>>(base: T, defaultTabIndex = 0)
    : HasTabIndexCtor & T {
  return class extends base {
    // tslint:disable-next-line: variable-name
    private _tabIndex: number = defaultTabIndex;

    get tabIndex(): number { return this.disabled ? -1 : this._tabIndex; }
    set tabIndex(value: number) {
      // If the specified tabIndex value is null or undefined, fall back to the default value.
      this._tabIndex = value != null ? value : defaultTabIndex;
    }

    constructor(...args: any[]) {
      super(...args);
    }
  };
}
