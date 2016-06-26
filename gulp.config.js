module.exports = function () {

    var client = './src/client/';
    var client_app = client + 'app/';

    var config = {
        
        index: client + 'index.html',
        
        less: client + 'styles/styles.less',
        css_path: client + 'styles',
        css_files: client + 'styles/*.css',
        
        client: client,
        
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
        }
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