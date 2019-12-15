# Ngx Simple Select

Simple and lightweight, yet customizable select module for Angular.

[Demo](https://ngx-simple-select.netlify.com/)

The main goal of this module is to be able to style select controls.

Standard HTML select controls sadly can't be styled among all browsers.

This module is fully replicating the behaviour of Chrome regarding select controls with some added features e.g. scrolling overflowing options sideways, left to right and right to left support on all major browsers (even Edge which does not support the dir attribute yet), mobile and tablet representaion of the list, etc.

The usage is almost the same as if you would use regular HTML select and option tags.

It fully supports template driven forms.

You are not restricted to use one Map or Array only, as your data source and can even insert HTML into options while maintaining search functionality.

## Installation

```sh
npm install @nutrify/ngx-simple-select --save
```

For styling import @nutrify/ngx-simple-select/scss/styles.scss or @nutrify/ngx-simple-select/css/styles.css

## Usage

**app.module.ts:**

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { SimpleSelectModule } from '@nutrify/ngx-simple-select';

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
```

**component.ts:**

```typescript
// ...

export class Component {
  countryID = 'AD';
}
```

**component.html:**

```html
<!-- ... -->

<simple-select [(ngModel)]="countryID" placeholder="Country">
    <simple-option value="AF">Afghanistan</simple-option>
    <simple-option value="AL">Albania</simple-option>
    <simple-option value="DZ">Algeria</simple-option>
    <simple-option value="AS">American Samoa</simple-option>
    <simple-option value="AD">Andorra</simple-option>
    <!-- ... -->
</simple-select>

<!-- ... -->
```

Check out the [source code](https://github.com/raphaelM-sudo/ngx-simple-select/tree/master/src/app) for an example.

#### Select

##### Inputs

| Property    | Default | Description                                                                                                |
| ----------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| placeholder |         | Optional placeholder string, which gets displayed when no option is selected                               |
| value       |         | Value of selected option                                                                                   |
| hoverBorder | `false` | Boolean describing whether or not the border should only render on hover                                   |
| animate     | `true`  | Boolean describing whether or not the arrow icon should show an animation                                  |
| dir         |         | Optional direction property describing the content's text orientation. Can be:  `'ltr' \| 'rtl' \| 'auto'` |

##### Directives

| Property | Description                                        |
| -------- | -------------------------------------------------- |
| disabled | Sets the disabled attribute for the select element |
| required | Sets the required attribute for the select element |

#### Option

##### Inputs

| Property | Default | Description                                                                                              |
| -------- | ------- | -------------------------------------------------------------------------------------------------------- |
| value    |         | Value of the option component                                                                            |
| dir      |         | Optional direction property describing the option's text orientation. Can be: `'ltr' \| 'rtl' \| 'auto'` |

##### Directives

| Property | Description                                        |
| -------- | -------------------------------------------------- |
| disabled | Sets the disabled attribute for the option element |

## Styling

You can use SCSS or CSS  for styling.

Just import the stylesheet and apply changes to it.

The SCSS stylesheet is recommended since it exports more variables.

If you are not using SCSS for your Angular projects already, you really should.

[The migration is very easy.](https://medium.com/@ngubanethabo.ambrose/migrate-from-css-to-scss-stylesheets-for-existing-angular-application-d61f8061f5b7)

### CSS / SASS

```scss
@import '~@nutrify/ngx-simple-select/scss/styles';
```

### Angular

**angular-cli.json:**

```json
"styles": [
  "styles.css",

  "../node_modules/@nutrify/ngx-simple-select/css/styles.css"
]
```
