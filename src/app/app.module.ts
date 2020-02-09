import { SimpleSelectModule } from 'projects/simple-select/src/lib/simple-select.module';

import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    SimpleSelectModule // SimpleSelectModule already exports FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
