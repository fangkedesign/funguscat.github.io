var gulp           = require('gulp'),
	compass        = require('gulp-compass'),
	concat         = require('gulp-concat'),
	autoprefixer   = require('gulp-autoprefixer'),
	uglify         = require('gulp-uglify'), 
	cleanCSS       = require('gulp-clean-css'),
	plumber        = require('gulp-plumber'),    //plumber 處理例外
	livereload     = require('gulp-livereload'), 
	watch          = require('gulp-watch'),
	rename         = require("gulp-rename");
	htmlPrettify   = require('gulp-html-prettify');
	twig  	       = require('gulp-twig');


//組合編譯scss
gulp.task('compass', function () {
	gulp.src('design/static/scss/**/*.scss')    // sass 來源路徑
		.pipe(plumber())                        
		.pipe(compass({
			css: 'design/static/css',           // compass 輸出位置
			sass: 'design/static/scss',         // sass 來源路徑
			style: 'compressed',                // CSS 處理方式，預設 nested（expanded, nested, compact, compressed）
			comments: false                     // 是否要註解，預設(true)
		}))
		// .pipe(gulp.dest('app/assets/temp')); // 輸出位置(非必要)
		.pipe(autoprefixer({
			browsers: ['last 2 versions', 'Android >= 4.0', 'Firefox > 10'],
			cascade: true,                      //是否美化属性值 默认：true 像这样：
			remove:true                         //是否去掉不必要的前缀 默认：true 
		}))
		.pipe(gulp.dest('design/static/css'))
		.pipe(livereload());  // 當檔案異動後自動重新載入頁面
});

//組合CSS
gulp.task('concat-css', function() {
	return gulp.src(['design/static/vendor/**/*.css'
	])
		.pipe(concat('vendor.css'))
		.pipe(gulp.dest('design/static/css'));
});

//組合JS
gulp.task('concat-js', function() {
	return gulp.src([
	//  Optmization  -->
		'design/static/vendor/lazyload/jquery.lazyload.js', 
		'design/static/vendor/smoothscroll/smoothscroll.js', 
		'design/static/vendor/scrollreveal/scrollreveal.min.js', 
		'design/static/vendor/fitvids/jquery.fitvids.js', 
		'design/static/vendor/animsition/js/animsition.min.js', 
		'design/static/vendor/sweetalert/sweetalert.min.js', 
	//  Plugins -->
		'design/static/vendor/sliderpro/js/jquery.sliderPro.js', 
		'design/static/vendor/slidebars/slidebars.js', 
		'design/static/vendor/mobilemenu/mobile-menu.js', 
		'design/static/vendor/stickykit/jquery.sticky-kit.min.js', 
		'design/static/vendor/ilightbox/js/jquery.mousewheel.js', 
		'design/static/vendor/ilightbox/js/ilightbox.js', 
		'design/static/vendor/superfish/js/superfish.js', 
		'design/static/vendor/owlcarousel/owl.carousel.js', 
		'design/static/vendor/responsivemenu/modernizr.custom.js', 
		'design/static/vendor/responsivemenu/jquery.dlmenu.js', 
		'design/static/vendor/scrollport/scrollport.min.js', 
		'design/static/vendor/megamenu/MegaMenu.js', 
		'design/static/vendor/lightcase/js/lightcase.js', 
		'design/static/vendor/infinite-scroll/infinite-scroll.min.js', 
		'design/static/vendor/infinitescroll/jquery.infinitescroll.min.js', 
		'design/static/vendor/hammer/hammer.min.js', 
	//  REVOLUTION JS FILES -->
		'design/static/vendor/revolution/js/jquery.themepunch.tools.min.js', 
		'design/static/vendor/revolution/js/jquery.themepunch.revolution.min.js', 
	//  SLIDER REVOLUTION 5.0 EXTENSIONS   -->
		'design/static/vendor/revolution/js/extensions/revolution.extension.actions.min.js', 
		'design/static/vendor/revolution/js/extensions/revolution.extension.carousel.min.js', 
		'design/static/vendor/revolution/js/extensions/revolution.extension.kenburn.min.js', 
		'design/static/vendor/revolution/js/extensions/revolution.extension.layeranimation.min.js', 
		'design/static/vendor/revolution/js/extensions/revolution.extension.migration.min.js', 
		'design/static/vendor/revolution/js/extensions/revolution.extension.navigation.min.js', 
		'design/static/vendor/revolution/js/extensions/revolution.extension.parallax.min.js', 
		'design/static/vendor/revolution/js/extensions/revolution.extension.slideanims.min.js', 
		'design/static/vendor/revolution/js/extensions/revolution.extension.video.min.js', 
   //  From -->
		'design/static/vendor/icheck/icheck.min.js', 
		'design/static/vendor/rpage/responsive-paginate.js', 
		'design/static/vendor/bootstrap-datetimepicker/js/bootstrap-datetimepicker.min.js', 
		'design/static/vendor/bootstrap-datetimepicker/js/bootstrap-datetimepicker.zh-TW.js', 
		'design/static/vendor/niceselect/jquery.nice-select.min.js', 
		'design/static/vendor/magnific-popup/jquery.magnific-popup.min.js',  
		])
		.pipe(concat('vendor.js'))
		.pipe(gulp.dest('design/static/js'))
});

//壓縮JS
// gulp.task('uglify',['concat-js'], function () {
//     return gulp.src('design/static/build/js/*.js')       
//         .pipe(plumber())                    
//         .pipe(uglify())                     
//         .pipe(rename({
//           suffix: '.min'
//         }))
//         .pipe(gulp.dest('design/static/build/js/min'))  
//     return gulp.src('design/static/js/*.js')       
//         .pipe(plumber())                    
//         .pipe(uglify())                    
//         .pipe(rename({
//           suffix: '.min'
//         }))
//         .pipe(gulp.dest('design/static/build/js/min'))  
// });
// gulp.task('uglifymain', function () {
//     return gulp.src('design/static/js/*.js')       
//         .pipe(plumber())                    
//         .pipe(uglify())                    
//         .pipe(rename({
//           suffix: '.min'
//         }))
//         .pipe(gulp.dest('design/static/build/js/min'))  
// });

	

// html整理對齊
gulp.task('html_prettify', function(file) {
  gulp.src('preview/*.html')
 .pipe(htmlPrettify({
 	indent_char: '	', 
 	indent_size: 1,
 	indent_with_tabs: true,

 }))
 .pipe(gulp.dest(function (file) {
	 return file.base;
 }));
});


//更新監視
gulp.task('watch',function(){
	livereload.listen();
	gulp.watch('design/static/vendor/**/*.js', ['concat-js']);  //檔案有異動重新執行concat-js
	gulp.watch('design/static/scss/**/*.scss',['compass']);    //檔案有異動重新執行compass
});

 
gulp.task('default',['compass', 'concat-js','concat-css','html_prettify','watch']);