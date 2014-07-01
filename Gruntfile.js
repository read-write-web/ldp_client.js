/**
 * Created by antonio on 30/06/2014.
 */
module.exports = function(grunt) {
    grunt.initConfig({
        clean: ['dist'],

        bower: {
            target: {
                rjsConfig: 'dist/main.js'
            }
        },

        copy: {
            main: {
                files: [
                    {expand: true, cwd: 'src/', src: ['**/*.js'], dest: 'dist/'},
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-bower-requirejs');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');


    grunt.registerTask('build', ['clean', 'copy', 'bower']);

    grunt.registerTask('default','build');
};