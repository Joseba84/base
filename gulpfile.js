var gulp = require('gulp');
postcss = require('gulp-postcss');
autoprefixer = require('gulp-autoprefixer');
sourcemaps = require('gulp-sourcemaps');
atImport = require('postcss-import');
selector = require('postcss-custom-selectors');
customProperties = require("postcss-custom-properties");
sorting = require('postcss-sorting');
nested = require('postcss-nested');
pxtorem = require('postcss-pxtorem');
reporter = require('postcss-reporter');
imagemin = require('gulp-imagemin');
uglify = require('gulp-uglify');
newer = require('gulp-newer');
nano = require('gulp-cssnano');
notify = require('gulp-notify');
stylelint = require('stylelint');
browserSync = require('browser-sync');
inlinesource = require('gulp-inline-source');
uncss = require('gulp-uncss');
responsive = require('gulp-responsive');

gulp.task("browserSync", function() {
    browserSync({
        server: {
            baseDir: "./"
        }
    })
});

/* Variables */
var imgSrc = './src/img/*';
var imgDist = './img';
var jsSrc = './src/js/*.js';
var jsDist = './js';

/* Notificando errores de JavaScript */
function errorAlertJS(error) {
    notify.onError({
        title: "Gulp JavaScript",
        subtitle: "Algo esta mal en tu JavaScript!",
        sound: "Basso"
    })(error);
    console.log(error.toString());
    this.emit("end");
};

/* Notificando errores de CSS */
function errorAlertPost(error) {
    notify.onError({
        title: "Gulp postCSS",
        subtitle: "Algo esta mal en tu CSS!",
        sound: "Basso"
    })(error);
    console.log(error.toString());
    this.emit("end");
};

/* Comprimiendo JavaScript */
gulp.task('compress', function() {
    return gulp.src(jsSrc)
        .pipe(uglify())
        .on("error", errorAlertJS)
        .pipe(gulp.dest(jsDist))
        .pipe(notify({
            message: 'JavaScript complete'
        }));
});

/* ==========================================================================
   Lanzando postCSS
   ========================================================================== */

/*
 * El orden de los plugins debe ser respetado.
 *
 * Antes de que nuestro CSS empiece a ser transformado por los diferentes
 * plugins vamos a 'lintear' nuestro CSS para seguir un orden y concierto.
 *
 *
 */

gulp.task('css', function() {
    var processors = [
        atImport({
            plugins: [stylelint]
        }),
        stylelint,
        reporter({
            clearMessages: true
        }),
        nested,
        customProperties,
        selector,
        pxtorem({
            root_value: 16,
            unit_precision: 2,
            prop_white_list: ['font', 'font-size', 'line-height', 'letter-spacing', 'margin', 'padding'],
            replace: true,
            media_query: false
        }),
        sorting({
            "sort-order": "csscomb"
        }),
        autoprefixer
    ];
    return gulp.src('./src/css/styles.css')

    .pipe(sourcemaps.init())
        .pipe(postcss(processors))
        .on("error", errorAlertPost)
        .pipe(sourcemaps.write('./', {
            sourceRoot: '/src'
        }))
        .pipe(gulp.dest('./css'))
        .pipe(notify({
            message: 'postCSS complete'
        }));
});

/* Lanzando CSSnano para comprimir CSS */
gulp.task('minify', function() {
    return gulp.src('./css/styles.css')
        .pipe(nano())
        .pipe(gulp.dest('./css'))
        .pipe(notify({
            message: 'CSSnano task complete'
        }));
});

/* Comprimiendo imagenes */
gulp.task('imagemin', function() {
    return gulp.src(imgSrc)
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }],
            use: [pngquant()]
        }))
        .pipe(gulp.dest(imgDist));
});

gulp.task('images', function() {
    return gulp.src(imgSrc)
        .pipe(newer(imgDist))
        .pipe(imagemin())
        .pipe(gulp.dest(imgDist));
});


gulp.task('inline', function() {
    return gulp.src('./*.html')
        .pipe(inlinesource())
        .pipe(gulp.dest('./inline/'))
        .pipe(notify({
            message: 'CSSnano + remove CSS + inline CSS'
        }));
});

gulp.task('removecss', function() {
    return gulp.src('./css/styles.css')
        .pipe(uncss({
            html: ['./*.html']
        }))
        .pipe(nano())
        .pipe(gulp.dest('./css'))
        .pipe(notify({
            message: 'CSSnano & remove CSS task complete'
        }));
});

gulp.task('imgrwd', function () {
  return gulp.src('src/img/*.{png,jpg}')
    .pipe(responsive({
      '*.png': [{
        width: 300,
        rename: {
          suffix: '-300px',
          extname: '.jpg',
        },
        format: 'jpeg',
      }, {
        width: 600,
        rename: {
          suffix: '-600px',
          extname: '.jpg',
        },
      }, {
        width: 1200,
        rename: {
          suffix: '-1200px',
          extname: '.jpg',
        }
      }],
    }, {
      quality: 75,
      progressive: true,
      withMetadata: false,
      errorOnEnlargement: false,
    }))
    .pipe(gulp.dest('img'));
});

/* Tarea por defecto para compilar CSS y comprimir imagenes */
gulp.task('default', ["browserSync"], function() {
    gulp.watch('./src/css/**', ['css']);
    gulp.watch('./src/img/**', ['images']);
    gulp.watch('./src/js/**', ['compress']);
    gulp.watch(["./*.html", "css/*.css", "js/*.js"]).on("change", browserSync.reload);
});

/* Tarea final para comprimir CSS y JavaScript. Eliminar el CSS sin usar e incluirlo en línea en el HTML
    Por último creamos las imágenes con diferentes tamaños.
*/

// Build para un proyecto sin imágenes
gulp.task('build', ['minify', 'compress', 'removecss', 'inline']);

//Build para un proyecto con imágenes
gulp.task('buildimg', ['minify', 'compress', 'removecss', 'inline' , 'imgrwd']);
