/*----------------------------------------------------*/
/* index.js
/*----------------------------------------------------*/

/* 
  Background Shape Morphing
*/
var morphing = anime({
  targets: '#morphing .a',
  d: [
    { value: 'm 328.96517,114.24516 c -2.65873,-3.87568 -8.45604,-12.69762 -16.9335,-19.581077 C 303.55421,87.780623 292.39805,82.836546 280.10223,79.822498 267.8064,76.80845 254.69037,75.750596 240.53487,66.725896 226.37936,57.701196 211.34421,40.722411 196.24999,34.303987 181.15577,27.885562 166.00162,32.026769 147.44677,37.074743 128.89192,42.122718 106.9405,48.076336 91.405794,51.053337 75.871088,54.030338 66.754362,54.030338 57.540271,56.842611 48.32618,59.654885 39.016315,65.278873 27.516415,74.758531 16.016515,84.238188 2.3303232,97.570562 2.5070931,116.47899 c 0.17677,18.90843 14.2180849,43.39086 24.5428679,60.48733 10.324784,17.09648 16.832071,26.65873 31.064765,44.43149 14.232695,17.77277 36.142809,43.68493 74.244774,50.39181 38.10196,6.70689 92.39853,-5.78997 132.7693,-20.5679 40.37077,-14.77792 66.81602,-31.83673 75.41759,-54.75752 8.60156,-22.92078 -0.64023,-51.70244 -5.02143,-65.55859 -4.3812,-13.85615 -3.90107,-12.78477 -6.55979,-16.66045 z' },
    { value: 'm 328.96517,114.24516 c -2.65873,-3.87568 -8.45604,-12.69762 -16.9335,-19.581077 C 303.55421,87.780623 292.39805,82.836546 280.10223,79.822498 267.8064,76.80845 254.69037,75.750596 240.53487,66.725896 226.37936,57.701196 211.34506,40.723373 199.58896,28.257057 187.83286,15.790741 179.35599,7.8370926 160.80132,12.884995 142.24665,17.932897 113.61804,35.981062 94.744624,45.0057 75.87121,54.030338 66.754362,54.030338 57.477256,54.259777 48.20015,54.489216 38.763862,54.948069 27.327179,64.049609 15.890496,73.151149 2.4557199,90.893573 2.695781,112.38455 c 0.2400612,21.49097 14.155386,46.72936 24.417175,64.2038 10.261789,17.47445 16.769076,27.0367 33.962457,50.66785 17.193381,23.63115 45.025457,61.26123 78.213797,71.43282 33.18833,10.1716 71.73574,-7.11304 107.00361,-25.54458 35.26787,-18.43154 67.25713,-38.01042 80.78368,-64.32071 13.52654,-26.31029 8.54586,-59.65221 6.30671,-75.71291 -2.23915,-16.06069 -1.75932,-14.98998 -4.41804,-18.86566 z' }
  ],
  easing: 'easeOutQuad',
  elasticity: 600,
  duration: 4000,
  loop: true
});

/*----------------------------------------------------*/
/* transition
/*----------------------------------------------------*/
// $(window).load(function() {
//   setTimeout(function() {
//     $('.loading-overlay').fadeOut(800);
//     enableScroll();
//   }, 2200);
//   setTimeout(function() { outOf(); }, 3000);
// });

// function outOf() {
//   $('.out-of-view').inViewport(function() { $(this).addClass("am-in-view in-view-detect"); }, function() { $(this).removeClass("in-view-detect"); });
//   $('.out-of-opacity').inViewport(function() { $(this).addClass("in-opacity"); }, function() {});
//   $('.out-of-shift').inViewport(function() { $(this).addClass("in-shift"); }, function() {});
// }