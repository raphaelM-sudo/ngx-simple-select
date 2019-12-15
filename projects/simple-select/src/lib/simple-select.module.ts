import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { OptionComponent } from './components/option/option.component';
import { SelectComponent } from './components/select/select.component';
import { NoSanitizePipe } from './pipes/no-sanitize.pipe';
import { DeviceService } from './services/device/device.service';
import { RenderedDirective } from './directives/rendered/rendered.directive';

@NgModule({
  declarations: [SelectComponent, OptionComponent, NoSanitizePipe, RenderedDirective],
  imports: [
    CommonModule,
    BrowserAnimationsModule
  ],
  providers: [
    DeviceService
  ],
  exports: [SelectComponent, OptionComponent, FormsModule]
})
export class SimpleSelectModule { }
