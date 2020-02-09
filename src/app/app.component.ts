import { Component, OnInit, VERSION } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  title = 'ngx-simple-select';
  version = VERSION.full;

  countryID = 'AT';

  nameControl = new FormControl('', [Validators.required]);

  names = [
    'Alice',
    'Bob',
    'Clara',
    'David',
    'Eve'
  ];

  ngOnInit() {
    // tslint:disable-next-line: no-console
    console.info(
      'I am developing those modules on my own, in my free time. ' +
      'It is very time consuming to deliver quality code.\n' +
      '\nIf you appreciate my work, please buy me a coffee 😊\n' +
      '\nThanks'
    );
  }
}
