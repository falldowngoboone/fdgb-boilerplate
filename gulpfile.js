'use strict';

// load dependencies
var gulp         = require( 'gulp'             ),
    sass         = require( 'gulp-sass'        ),
    postcss      = require( 'gulp-postcss'     ),
    autoprefixer = require( 'autoprefixer'     ),
    concat       = require( 'gulp-concat'      ),
    uglify       = require( 'gulp-uglify'      ),
    rename       = require( 'gulp-rename'      ),
    sourcemaps   = require( 'gulp-sourcemaps'  ),
    del          = require( 'del'              ),
    browsersync  = require( 'browser-sync'     ),
    connect      = require( 'gulp-connect-php' ),
    shell        = require( 'gulp-shell'       ),
    imagemin     = require( 'gulp-imagemin'    ),
    gulpIf       = require( 'gulp-if'          ),
    minimist     = require( 'minimist'         ),

    // config file specifies all the paths
    config = require( './build.config.json' );

// command line args
var knownOptions = {
  boolean : 'production'
};

var options = minimist( process.argv.slice(2), knownOptions );

// Task: html
// Description: moves all the .html and .php files into the public directory
gulp.task( 'html', [ 'clean:html' ], function () {
  return gulp.src( config.html.files )
    .pipe( gulp.dest( config.html.dest ) );
});

// Task: css
// Description: Compiles all .scss files to the public directory
gulp.task( 'css', [ 'clean:css' ], function () {

  var cssOptions = {};
  cssOptions.outputStyle = options.production ? 'compressed' : 'expanded';

  return gulp.src( config.css.files )
    .pipe( sourcemaps.init() )
    .pipe( sass(cssOptions) ).on('error', sass.logError)
    .pipe( postcss([ autoprefixer ]))
    .pipe( sourcemaps.write( './' ))
    .pipe( gulp.dest( config.css.dest ))
    .pipe( browsersync.stream() );
});

// Task: scripts
// Description: process all scripts used in the body of the document
gulp.task( 'scripts', function () {
  return gulp.src( config.scripts.bodyFiles )
    .pipe( sourcemaps.init() )
    // .pipe( concat( 'app.js' ) )
    .pipe( gulpIf( options.production, uglify() ))
    .pipe( sourcemaps.write( './' ) )
    .pipe( gulp.dest( config.scripts.dest ) );
});

// Task: images
// Description: process images
gulp.task( 'images', [ 'clean:images' ], function () {
  return gulp.src( config.images.files )
    .pipe( gulpIf( options.production, imagemin() ))
    .pipe( gulp.dest( config.images.dest ) );
});

// Task: watch
// Description: Launches all watch processes
gulp.task( 'watch', [ 'build' ], function () {
  // gulp.watch([ config.css.files, 'bower_components/foundation/scss/**/*.scss' ], [ 'css' ]);
  gulp.watch([ config.scripts.headFiles, config.scripts.bodyFiles ], [ 'watch:js' ]);
  gulp.watch( config.html.files, [ 'watch:html' ]);
  gulp.watch( config.images.files, [ 'watch:images' ]);
});

// watch processes
gulp.task( 'watch:html', [ 'html' ], browsersync.reload );

gulp.task( 'watch:js', [ 'scripts:body' ], browsersync.reload );

gulp.task( 'watch:images', [ 'images' ], browsersync.reload );

// clean processes
gulp.task( 'clean', function () {
  return del( config.root );
});

gulp.task( 'clean:css', function () {
  return del( config.css.dest );
});

gulp.task( 'clean:js', function () {
  return del( config.scripts.dest );
});

gulp.task( 'clean:html', function () {
  return del([
    config.html.dest + '/**/*.*html',
    config.html.dest + '/**/*.php'
  ]);
});

gulp.task( 'clean:images', function () {
  return del( config.images.dest );
});

gulp.task( 'clean:downloads', function () {
  return del( config.downloads.dest );
});

// Task: set-production
// Description: sets the production variable to true for production build from gulp
gulp.task( 'set-production', function() {
  options.production = true;
});

// Task: build
// Description: builds the dev version of the public site
gulp.task( 'build', [ 'html', 'css', 'scripts', 'images' ]);

gulp.task( 'build:production', [ 'set-production', 'build' ]);

// Task: serve
// Description: starts up the dev server
gulp.task( 'serve', [ 'watch' ], function () {
  connect.server({
    base: 'public',
    port: 8080
  }, function () {
    browsersync({
      proxy: '127.0.0.1:8080'
    });
  });
});

// Task: default
gulp.task( 'default', [ 'build' ] );

// Task: deploy
// Description: Deploy static content using git via the shell
// $TODO - reconfigure this for git
// gulp.task('deploy', [ 'build:production' ], function () {
//   return gulp.src(config.deployment.local.path, {read: false})
//     .pipe(shell([
//       'rsync '+ config.deployment.rsync.options +' '+ config.deployment.local.path +'/ '+ config.deployment.remote.host
//     ]))
// });