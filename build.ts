import * as del from 'del';
import * as fs from 'fs';
import { copySync } from 'fs-extra';
import { ngPackagr } from 'ng-packagr';
import * as sass from 'sass';
import { join } from 'path';

const main = async () => {
  // cleanup dist

  try {
    del.sync(join(process.cwd(), '/dist'));
    del.sync(join(process.cwd(), '/node_modules/@nutrify/ngx-simple-select'));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.info('Ignoring: Could not delete previous build.');
  }

  await ngPackagr()
    .forProject(join(process.cwd(), 'projects/simple-select/package.json'))
    .build();

  // put it in node modules so the path resolves
  // proper path support eventually
  copySync(
    join(process.cwd(), 'README.md'),
    join(process.cwd(), '/dist/simple-select/README.md')
  );
  copySync(
    join(process.cwd(), 'LICENSE'),
    join(process.cwd(), '/dist/simple-select/LICENSE')
  );
  copySync(
    join(process.cwd(), 'projects/simple-select/src/lib/styles.scss'),
    join(process.cwd(), '/dist/simple-select/scss/styles.scss')
  );

  // Copy SCSS and create CSS file
  const cssDir = join(process.cwd(), '/dist/simple-select/css');
  const scssFile = join(process.cwd(), 'projects/simple-select/src/lib/styles.scss');
  const cssOutFile = cssDir + '/styles.css';

  if (!fs.existsSync(cssDir)) {
    fs.mkdirSync(cssDir);
  }

  sass.render({
    file: scssFile,
    outFile: cssOutFile
  }, (error: any, result: any) => {
    if (!error) {
      fs.writeFile(cssOutFile, result.css, () => {});
    }
  });

  copySync(
    join(process.cwd(), '/dist/simple-select'),
    join(process.cwd(), '/node_modules/@nutrify/ngx-simple-select')
  );
};

main()
  .then(() => console.log('success'))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
