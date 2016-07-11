module.exports = function () {

    var client = './src/client/';
    var server = './src/server/'
    var client_app = client + 'app/';
    var temp = './.tmp/';
    var root = './';
    var wiredep = require('wiredep');
    var bowerFiles = wiredep({devDependencies: true})['js'];

    var config = {
        temp: temp,
        
        index: client + 'index.html',
        
        less: client + 'styles/styles.less',
        css_path: client + 'styles',
        css_files: client + 'styles/*.css',
        
        client: client,
        server: server,
        root: root,
        
        packages: [
            root + 'package.json',
            root + 'bower.json'
        ],
        
        app: 'app.js',
        
        js: [
            client_app + '**/*.module.js',
            client_app + '**/*.js',
            '!' + client_app + '**/*.spec.js'
        ],
        
        alljs: [
            './src/**/*.js',
            './*.js'
        ],
        
        bower: {
            json: require('./bower.json'),
            directory: './bower_components',
            ignorePath: '../..'
        },
        defaultPort: 7203,
        nodeServer: server + 'app.js',
        browserReloadDelay: 1000,
        html: client_app + '**/*.html',
        htmltemplates: client_app + '**/*.html',
        templateCache: {
            file: 'templates.js',
            options: {
                module: 'app.core',
                standAlone: false,
                root: 'app/'
            }
        },

        /**
         * Karma and testing settings
         */
        serverIntegrationSpecs: [client + 'tests/server-integration/**/*.spec.js'],

        fonts: './bower_components/font-awesome/fonts/**/*.*',
        images: client + 'images/**/*.*',
        build: './build/'
    };

    config.getWiredepDefaultOptions = function () {
        return {
            bowerJson: config.bower.json,
            directory: config.bower.directory,
            ignorePath: config.bower.ignorePath
        }
    };

    config.karma = function() {

        var options = {
            files: [].concat(
                bowerFiles,
                config.specHelpers, // TODO
                client + '**/*.module.js',
                client + '**/*.js',
                temp + config.templateCache.file,
                config.serverIntegrationSpecs
            ),
            exclude: [],
            coverage: {
                dir: report + 'coverage', // TODO
                reporters: [
                    {type: 'html', subdir: 'report-html'},
                    {type: 'lcov', subdir: 'report-lcov'},
                    {type: 'text-summary'}
                ]
            },
            preprocesors: {}
        };
        options.preprocesors[client_app + '**/!(*.spec)+(.js)'] = ['coverage'];
        return options;
    };

    return config;
};



























