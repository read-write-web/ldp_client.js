/**
 * Created by antonio on 30/06/2014.
 */
module.exports = function(grunt) {
    grunt.initConfig({
        clean: ['dist','tests/dist'],

        bower: {
            targetDist: {
                rjsConfig: 'dist/main.js'
            },
            targetTest: {
                rjsConfig: 'tests/SpecRunner.js'
            }
        },

        copy: {
            main: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['**/*.js'],
                        dest: 'dist/'
                    },
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['**/*.js'],
                        dest: 'tests/dist/'
                    }
                ]
            }
        },

        requirejs: {
            compile: {
                options: {
                    mainConfigFile: 'dist/main.js',
                    baseUrl: "dist",
                    name: "ldp_client",
                    include: ['main'],
                    out: 'dist/ldp_client.js'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-bower-requirejs');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-requirejs');


    grunt.registerTask('build', ['clean', 'copy', 'bower']);

    grunt.registerTask('default','build');
};