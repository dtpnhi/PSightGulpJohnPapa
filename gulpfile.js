
var gulp = require('gulp');
var gulpPlugins = require('gulp-load-plugins')();

var argvs = require('yargs').argv;
var del = require('del');
var browserSync = require('browser-sync');

var config = require('./gulp.config')();
var port = process.env.PORT || config.defaultPort;

////// -------- style -------- //////
gulp.task('styles', ['clean-styles'], function () {

    return gulp
        .src(config.less)
        .pipe(gulpPlugins.if(argvs.verbose, gulpPlugins.print()))
        .pipe(gulpPlugins.less())
        .pipe(gulpPlugins.autoprefixer({browser:['last 2 version', '> 5%']}))
        .pipe(gulp.dest(config.css_path));
});

gulp.task('clean-styles', function (afterCleanStylesDone) {
    return clean(config.css_files, afterCleanStylesDone);
});

gulp.task('watch-less', function () {
    gulp.watch([config.less], ['styles'])
})
////// -------- style end -------- //////

gulp.task('vet', function() {
    log('Analyzing source with JSHint and JSCS');
    return gulp
        .src(config.alljs)
        .pipe(gulpPlugins.if(argvs.verbose, gulpPlugins.print()))
        .pipe(gulpPlugins.jshint())
        .pipe(gulpPlugins.jscs())
        .pipe(gulpPlugins.jshint.reporter('jshint-stylish', {verbose: true}))
        .pipe(gulpPlugins.jshint.reporter('fail'));
});

gulp.task('wiredep', function () {

    log('Wire up the bower css js and our app js into the html');

    var options = config.getWiredepDefaultOptions();
    var wiredep = require('wiredep').stream;

    return gulp
        .src(config.index)
        .pipe(gulpPlugins.if(argvs.verbose, gulpPlugins.print()))
        .pipe(wiredep(options))
        .pipe(gulpPlugins.inject(gulp.src(config.js)))
        .pipe(gulp.dest(config.client));

});

gulp.task('inject', ['styles', 'wiredep', 'templatecache'], function () {

    log('Wire up the app css into the html and call wiredep');

    return gulp
        .src(config.index)
        .pipe(gulpPlugins.inject(gulp.src(config.css_files)))
        .pipe(gulp.dest(config.client));
});

gulp.task('serve-build', ['optimize'], function () {
    serve(false);
});

gulp.task('serve-dev', ['inject'], function () {
   //serve(true);


    if (argvs.nosync || browserSync.active) {
        return;
    }

    log('Starting browser-sync on port ' + port);

    gulp.watch([config.less], ['styles'])
        .on('change', function (event) {changeEvent(event);});

    var options = {
        proxy: 'localhost:' + port,
        port: 3000,
        files: [
            config.client + '**!/!*.*',
            '!' + config.css_path + '*.less',
            config.css_files
        ],
        ghostMode: {
            clicks: true,
            location: false,
            forms: true,
            scroll: true
        },
        injectChanges: true,
        logFileChanges: true,
        logLevel: 'debug',
        logPrefix: 'gulp-patterns',
        notify: true,
        reloadDelay: 1000
    };

    browserSync(options);
    
});

function serve(isDev) {

    var nodeOptions = {
        script: config.nodeServer,
        delayTime: 1,
        env: {
            "PORT": port,
            "NODE_ENV": isDev ? 'dev' : 'build'
        },
        watch: [config.server]
    };
    return gulpPlugins.nodemon(nodeOptions)
        .on('restart', function (ev) {
            log('*** nodemon restarted');
            log('files changed on restart:\n', ev);

            setTimeout(function () {
                browserSync.notify('Reloading browser...');
                browserSync.reload({stream: false});
            }, config.browserReloadDelay);
        })
        .on('start', function () {
            log('*** nodemon started');
            startBrowserSync(isDev);
        })
        .on('crash', function () {
            log('*** nodemon crashed: script crashed for some reason');
        })
        .on('exit', function () {
            log('*** nodemon exited cleanly');
        });
}

gulp.task('help', function () {
    return gulpPlugins.taskListing();
});

gulp.task('default', ['help']);

gulp.task('fonts', ['clean-fonts'], function () {
    log('Copying fonts');

    return gulp
        .src(config.fonts)
        .pipe(gulp.dest(config.build + 'fonts'));
});

gulp.task('images', ['clean-images'], function () {
    log('Copying and compressing the images');

    return gulp
        .src(config.images)
        .pipe(gulpPlugins.imagemin({optimizationLevel:4}))
        .pipe(gulp.dest(config.build + 'images'));
});

gulp.task('clean-fonts', function (done) {
    return clean(config.build + 'fonts', done);
});

gulp.task('clean-images', function (done) {
    return clean(config.build + 'images', done);
});

gulp.task('clean', function (done) {

    var files = [].concat(
        config.temp + '**!/!*.*',
        config.build + '**!/!*.*'
    );

    log('Cleaning ', files);
    
    return clean(files, done);
});

gulp.task('templatecache', ['clean'], function () {
    log('Creating AngularJS $templateCache');
    
    return gulp
        .src(config.htmltemplates)
        .pipe(gulpPlugins.minifyHtml({empty: true}))
        .pipe(gulpPlugins.angularTemplatecache(
            config.templateCache.file,
            config.templateCache.options
        ))
        .pipe(gulp.dest(config.temp));
});



gulp.task('optimize',  ['images', 'fonts', 'inject'], function() {
    log('Optimizing the javascript, css, html');

    var templateCache = config.temp + config.templateCache.file;

    return gulp
        .src(config.index)
        .pipe(gulpPlugins.if(argvs.verbose, gulpPlugins.print()))
        .pipe(gulpPlugins.plumber())
        .pipe(gulpPlugins.inject(gulp.src(templateCache, {read: false}), {
            starttag: '<!-- inject:templates:js -->'
        }))
        .pipe(gulpPlugins.useref({searchPath:'./'}))
        .pipe(gulpPlugins.if('*.css', gulpPlugins.csso()))
        .pipe(gulpPlugins.if('*.js', gulpPlugins.uglify()))
        .pipe(gulp.dest(config.build));
});

function changeEvent(event) {
    var srcPattern = new RegExp('/.*(?=/' + config.source + ')/');
    log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

function startBrowserSync(isDev) {
    
    if (argvs.nosync || browserSync.active) {
        return;
    }
    
    log('Starting browser-sync on port ' + port);

    if (isDev) {
        
        gulp.watch([config.less], ['styles'])
            .on('change', function (event) {changeEvent(event);});
        
    } else {
        
        gulp.watch([config.less, config.js, config.html], ['optimize', browserSync.reload])
            .on('change', function (event) {changeEvent(event);});
    }
    
    var options = {
        proxy: 'localhost:' + port,
        port: 3000,
        files: isDev ? [
            config.client + '**!/!*.*',
            '!' + config.css_path + '*.less',
            config.css_files
        ] : [],
        ghostMode: {
            clicks: true,
            location: false,
            forms: true,
            scroll: true
        },
        injectChanges: true,
        logFileChanges: true,
        logLevel: 'debug',
        logPrefix: 'gulp-patterns',
        notify: true,
        reloadDelay: 1000
    };

    browserSync(options);
}

function clean(path, afterCleanCB) {
    return del(path, afterCleanCB);
}

function log(msg) {
    if (typeof msg === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                gulpPlugins.util.log(gulpPlugins.util.colors.blue(msg[item]));
            }
        }
    } else {
        gulpPlugins.util.log(gulpPlugins.util.colors.blue(msg));
    }
}