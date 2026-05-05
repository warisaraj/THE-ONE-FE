const gulp = require('gulp');
const war = require('gulp-war');
const zip = require('gulp-zip');

const cfgNg = require('./angular.json');
const cfgNpm = require('./package.json');

const config = { ng: cfgNg, npm: cfgNpm };

function createWarFile(cfg) {
  const projectName = cfg.npm.name;
  const displayName = cfg.npm.name;

  const readPath =
    './' +
    (cfg.ng.projects[projectName].architect.build.options.outputPath ||
      'dist') +
    '/**';
  const warFileName = projectName + '.war';
  const writePath = './warfile';

  gulp
    .src(readPath)
    .pipe(
      war({
        welcome: 'index.html',
        displayName: displayName
      })
    )
    .pipe(zip(warFileName))
    .pipe(gulp.dest(writePath));
}

gulp.task('war', function() {
  createWarFile(config);
});

gulp.task('default', ['war']);
