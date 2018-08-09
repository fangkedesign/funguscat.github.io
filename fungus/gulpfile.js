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


//組合所有jquery plugin JS
gulp.task('concat-js', function() {
    return gulp.src([
        'design/static/vendor/**/*.js'  
        ])
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest('design/static/js'))
});

//壓縮JS
gulp.task('uglify-js', function () {
    return gulp.src('design/static/js/*.js')       
        .pipe(plumber())                    
        .pipe(uglify())                     
        .pipe(rename({
          suffix: '.min'
        }))
        .pipe(gulp.dest('design/static/js/min'))  
});

//更新監視
gulp.task('watch',function(){
    livereload.listen();
    gulp.watch('design/static/vendor/**/*.js', ['concat-js, uglify-js']);  //檔案有異動重新執行concat-js
    gulp.watch('design/static/scss/**/*.scss',['compass']);    //檔案有異動重新執行compass
});


gulp.task('default',['compass', 'concat-js' ,'uglify-js','watch']);