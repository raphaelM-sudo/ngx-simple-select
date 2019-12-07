/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { coerceBooleanProperty } from '@angular/cdk/coercion';

import { Constructor } from './constructor.model';

/** @docs-private */
export interface CanDisable {
  /** Whether the component is disabled. */
  disabled: boolean;
}

/** @docs-private */
export type CanDisableCtor = Constructor<CanDisable>;

/** Mixin to augment a directive with a `disabled` property. */
export function mixinDisabled<T extends Constructor<{}>>(base: T): CanDisableCtor & T {
  return class extends base {
    // tslint:disable-next-line: variable-name
    private _disabled = false;

    get disabled() { return this._disabled; }
    set disabled(value: any) { this._disabled = coerceBooleanProperty(value); }

    constructor(...args: any[]) { super(...args); }
  };
}
