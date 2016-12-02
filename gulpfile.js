var gulp = require("gulp"),
	cleanCss = require('gulp-clean-css'),
	clean = require('gulp-clean'),
	rename = require('gulp-rename'),
	tmp;
	/*
	concat = require('gulp-concat');
var htmlmin = require('gulp-htmlmin'),
	*/

gulp.task('default',['css'],function(){
	return gulp.src('./tmp/**/*',{nodir:true})
		.pipe(rename({
			suffix:'-slv'
		})).pipe(gulp.dest('./'));
});

gulp.task('clean',function(){
	return gulp.src('./tmp').pipe(clean());
});

gulp.task('css',['clean'],function(){
	return gulp.src(['./dev/**/*.css'])
			.pipe(cleanCss())
			.pipe(gulp.dest('./tmp/'));
});

// gulp.task('js',['clean'], function(){//压缩js
// 	return gulp.src(['./dev/**/*.js'])
// 			.pipe(uglify())
// 			.pipe(gulp.dest('./tmp/'));
// });

// gulp.task('img',['clean'], function(){//复制图片
// 	return gulp.src(['./dev/**/*.{JPG,jpg,png,gif}'])
// 			.pipe(gulp.dest('./tmp/'));
// });
// gulp.task('font',['clean'], function(){//复制fonts文件
// 	return gulp.src(['./dev/images/fonts/**/**'])
// 			.pipe(gulp.dest('./tmp/images/fonts/'));
// });

// gulp.task('minify',['clean'], function() {
//   return gulp.src(['./dev/**/*.html'])
//     .pipe(htmlmin())
//     .pipe(gulp.dest('./tmp/'));
// });

// gulp.task('all',['css','js','minify','img','font'],function(){
// 	return gulp.src('./tmp/**/*').pipe(gulp.dest('./'));
// });