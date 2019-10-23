import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { SimpleSelectModule } from 'projects/simple-select/src/lib/simple-select.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SimpleSelectModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
