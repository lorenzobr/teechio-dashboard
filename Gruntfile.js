'use strict';

module.exports = function (grunt) {
	require('time-grunt')(grunt);
	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		paths: {
			js: 'app/assets/js',
			images: 'app/assets/images',
			styles: 'app/assets/styles'
		},

		nodeunit: {
			files: ['test/**/*_test.js']
		},
		jshint: {
			options: {
				jshintrc: '.jshintrc',
				reporter: require('jshint-stylish')
			},
			gruntfile: {
				src: 'Gruntfile.js'
			},
			test: {
				src: ['test/**/*.js']
			}
		},
		clean: {
			build: {
				src: ['public']
			}
		},
		copy: {
			cssutils : {
				expand: true,
				cwd: '<%= paths.styles %>/utils',
				src: '**',
				dest: 'public/css/utils/'
			},
			images: {
				expand: true,
				cwd: 'app/assets/images',
				src: '**',
				dest: 'public/images/'
			},
			plupload: {
				expand: true,
				cwd: '<%= paths.js %>/libs/plupload',
				src: '**',
				dest: 'public/js/libs/pl/'
			}
		},
		less: {
			compile: {
				options: {},
				files: {
					'public/css/style.css' : '<%= paths.styles %>/style.less',
					'public/css/showcase.css' : '<%= paths.styles %>/showcase.less',
				}
			}
		},
		jade: {
			partials: {
				files: [{
					expand: true,
					cwd: 'app/views/partials',
					src: ['*.jade'],
					dest: 'public/partials',
					ext: '.html'
				}]
			},
		},
		ngmin: {
			controllers: {
				expand: true,
				cwd: '<%= paths.js %>/src/controllers',
				src: ['**/*.js'],
				dest: 'public/js/ctrls'
			},
			directives: {
				files: [{
					expand: true,
					cwd: '<%= paths.js %>/src/directives',
					src: ['**/*.js'],
					dest: 'public/js/dircts'

				}]
			},
			showcase: {
				src: ['<%= paths.js %>/src/showcase.js'],
				dest: 'public/js/showcase.js'
			}
		},
		concat: {
			jslibs: {
				files: {
					'public/js/libs.js' : ['<%= paths.js %>/libs/*.js']
				}
			},
			jsmain: {
				src: ['<%= paths.js %>/*.js', 'app/assets/js/src/app.main.js', 'public/js/ctrls/*.js', 'public/js/dircts/*.js'],
				dest: 'public/js/main.js'
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %>.<%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			build: {
				src: 'public/js/main.js',
				dest: 'public/js/main.min.js'
			},
			showcase: {
				src: 'public/js/showcase.js',
				dest: 'public/js/showcase.min.js'
			}
		},
		watch: {
			gruntfile: {
				files: '<%= jshint.gruntfile.src %>',
				tasks: ['jshint:gruntfile']
			},
			less: {
				files: ['app/assets/styles/*.less'],
				tasks: ['less:compile']
			},
			partials: {
				files: ['app/views/partials/**/*.jade'],
				tasks: ['jade:partials']
			},
			js: {
				files: ['<%= paths.js %>/**/*.js'],
				tasks: ['nodeunit', 'ngmin', 'concat']
			},
			images: {
				files: ['<%= paths.images %>/**/*'],
				tasks: ['copy:images']
			},
			test: {
				files: '<%= jshint.test.src %>',
				tasks: ['jshint:test', 'nodeunit']
			}
		},
		nodemon: {
			server: {
				options: {
					file: 'server.js'
				}
			}
		},
		concurrent: {
			starter: {
				tasks: ['watch', 'nodemon:server'],
				options: {
					logConcurrentOutput: true
				}
			}
		}
	});

	grunt.registerTask('build', ['nodeunit', 'jshint', 'clean', 'copy', 'less', 'jade', 'ngmin', 'concat', 'uglify']);
	grunt.registerTask('default', ['build', 'concurrent:starter']);
};