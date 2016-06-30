var gulp = require('gulp');
var gulpPlugins = require('gulp-load-plugins')();

var argvs = require('yargs').argv;
var del = require('del');
var browserSync = require('browser-sync');

var config = require('./gulp.config')();
var port = process.env.PORT || config.defaultPort;

////// -------- style -------- //////
gulp.task('less-to-css', ['clean-styles'], function () {

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
    gulp.watch([config.less], ['less-to-css'])
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

gulp.task('inject', ['less-to-css', 'wiredep'], function () {

    log('Wire up the app css into the html and call wiredep');

    return gulp
        .src(config.index)
        .pipe(gulpPlugins.inject(gulp.src(config.css_files)))
        .pipe(gulp.dest(config.client));
});

gulp.task('serve-dev', ['inject'], function () {

    var isDev = true;
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
            startBrowserSync();
        });
});

function changeEvent(event) {
    var srcPattern = new RegExp('/.*(?=/' + config.source + ')/');
    log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

function startBrowserSync() {
    
    if (argvs.nosync || browserSync.active) {
        return;
    }
    
    log('Starting browser-sync on port ' + port);

    gulp.watch([config.less], ['less-to-css'])
        .on('change', function (event) {
            changeEvent(event);
        })
    ;

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
