const path = require('path');

module.exports = {
    entry: {
        app: [
            './src/app.js',
        ],
    },
    output: {
        filename: 'piletilevi-venuemap.js',
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                ],
                sideEffects: true
            },
            {
                test: /\.m?js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            [
                                '@babel/preset-env'
                            ]
                        ],
                    }
                }
            },
            {
                test: /\.(jpe?g|png|ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
                use: 'base64-inline-loader'
            }
        ]
    },
};
