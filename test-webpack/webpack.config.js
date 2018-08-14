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
// var CopyWebpackPlugin = require('copy-webpack-plugin');
module.exports = {
  entry:  {
    main:__dirname+"/src/js/main.js",//入口文件
  },
  output: {
      path: __dirname+"/dist/",
      filename: "js/[name].js",//产出文件，name根据entry的入口文件键名定
  },
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
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"]
      },
      {
        test: /\.sass$/,
        loader: "style-loader!css-loader!postcss-loader!less-loader"     
      },
    ]
  },

  resolve: {
    extensions: [".js", ".html", ".css", ".txt","less","ejs","json"],
  },
  devServer: {
    // contentBase: path.join(__dirname, 'dist'),
    compress: false,
    hot: true,
    port: 8080
  },
  plugins: [
    new HtmlWebPackPlugin({
      filename: "index.html",
      template: "ejs-loader!./src/index.ejs",
      inject: "body"
    }),
    new MiniCssExtractPlugin({
      filename: "./css/main.css",
      chunkFilename: "style.css"
    }),
    // new CopyWebpackPlugin([{
    //   from: 'runtime/images/*'
    // }])
 
    
  ]
};