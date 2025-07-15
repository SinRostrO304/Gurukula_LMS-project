module.exports = {
  style: {
    postcss: {
      plugins: [
        require('autoprefixer')()           // Autoprefixer for vendor prefixes
      ],
    },
  },
};