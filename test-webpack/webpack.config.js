const path                = require('path');
// // Paths involved in the creating the config
// const PATHS = {
//   src: path.resolve(__dirname, 'src/js/index.js'),
//   dest: path.resolve(__dirname, 'dist')
// }

// // Webpack config object
// const config = {};
	
// // Entry point of the application to be compiled
// config.entry = PATHS.src;
// config.output = {
//   path: PATHS.dest,
//   filename: 'main.bundle.js'
// }

// module.exports = config;

const HtmlWebPackPlugin     = require("html-webpack-plugin");
const MiniCssExtractPlugin  = require("mini-css-extract-plugin");
// const CopyWebpackPlugin     = require("copy-webpack-plugin");


module.exports = {
  // entry:  {
  //   main:__dirname+"/src/js/main.js",//入口文件
  //   // vendor: "./src/js/vendor.js" 
  // },
  // output: {
  //     path: __dirname+"/dist/",
  //     filename: "js/[name].js",//产出文件，name根据entry的入口文件键名定
  // },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
       test: /\.css$/,
       use: [MiniCssExtractPlugin.loader, "css-loader"]
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          // "style-loader",
          "css-loader","postcss-loader","sass-loader"
        ]
      },  
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'static/imges/',
              publicPath: 'static/imaes/',

            }
          }
        ]
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader",
            options: { minimize: false }
          }
        ]
      },
      {
        test: /\.ejs$/,
        loader: 'ejs-html-loader',			     
      },
    ]
  },
  resolve: {
    // extensions: [".js", ".html", ".css", ".txt","less","ejs","json"],
  },
  devServer: {
    // contentBase: path.join(__dirname, 'dist'),
    compress: false,
    hot: true,          //热加载开启 inline: true,//文件改变时会自动刷新页面
    inline: true,       //文件改变时会自动刷新页面
    port: 8080
  },

  plugins: [
    new HtmlWebPackPlugin({
      filename: "index.html",
      template: "src/index.html",
      // template: "ejs-loader!./src/layout.ejs",
      // inject: "body",
    }),
    new MiniCssExtractPlugin({
     filename: "./scss/[name].css",
     chunkFilename: "[id].css"
    }),
    // new CopyWebpackPlugin([{
    //   from: './static/*', to: './static'
    // }])
    
  ]
};