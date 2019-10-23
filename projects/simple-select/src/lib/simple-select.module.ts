import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NoSanitizePipe } from './no-sanitize.pipe';
import { OptionComponent } from './option/option.component';
import { SelectComponent } from './select/select.component';

@NgModule({
  declarations: [SelectComponent, OptionComponent, NoSanitizePipe],
  imports: [
    CommonModule,
    BrowserAnimationsModule
  ],
  exports: [SelectComponent, OptionComponent, FormsModule]
})
export class SimpleSelectModule { }
