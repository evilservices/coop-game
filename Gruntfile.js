module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-nodemon');

  grunt.initConfig({
    nodemon: {
      api: {
        script: 'index.js',
        options: {
          env: {
            NODE_ENV: 'development'
          },
          ignore: [
            'node_modules/**',
            'test/**',
            'Gruntfile.js'
          ],
          ext: 'js'
        }
      }
    }
  });

  grunt.registerTask('default', ['nodemon:api']);
};