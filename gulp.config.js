module.exports = function () {

    var client = './src/client/';
    var server = './src/server/'
    var client_app = client + 'app/';
    var temp = './.tmp/';

    var config = {
        temp: temp,
        
        index: client + 'index.html',
        
        less: client + 'styles/styles.less',
        css_path: client + 'styles',
        css_files: client + 'styles/*.css',
        
        client: client,
        server: server,
        
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

    return config;
};
