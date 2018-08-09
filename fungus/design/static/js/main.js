/*----------------------------------------------------*/
/*  main.js 
/*----------------------------------------------------*/

// global variable
var mobileWidth = 767;


/*----------------------------------------------------*/
/* Checkout.js
/*----------------------------------------------------*/

/*
  Remove Br 
 */
function removeBr() {
	$(".mini-cart-list li, .cart-list li, .mini-checkout-cart li ").find("br").each(function(){
	    $(this).replaceWith( " " );
	});
}
/*----------------------------------------------------*/
/* Global Function 
/*----------------------------------------------------*/

/*  
	Loader
*/
$(window).load(function() {
	// Animate loader off screen
	$(".loader-wrap").fadeOut("slow");
});


/* 
	navigator
*/
function navHover() {
	var body = $('body');
	$(".navigator li").hover(
		function() {
			// if ($(this).hasClass('site-nav--has-dropdown')) {
			// 	var $this = $(this);
			// 	setTimeout(function() {
			// 		$this.children('ul').addClass('active');
			// 	}, 150);
			// }
			body.addClass('prod-hover-in');
			$(this).siblings().addClass('active-opacity');

		},
		function() {
			$(this).siblings().removeClass('active-opacity');
			body.removeClass('prod-hover-in');
		}
	);
};



// 全站使用
$(document).ready(function() {


	/*  
		Sticky header
	*/

	var previousScroll = 0, // previous scroll position
		menuOffset = 54, // height of menu (once scroll passed it, menu is hidden)
		detachPoint = 600, // point of detach (after scroll passed it, menu is fixed)
		hideShowOffset = 6; // scrolling value after which triggers hide/show menu

		
	// on scroll hide/show menu
	$(window).scroll(function() {
		if ($('header').hasClass('expanded')) {
			// do nothing; main navigation is being shown
		} else {
			var currentScroll = $(this).scrollTop(), // gets current scroll position
				scrollDifference = Math.abs(currentScroll - previousScroll); // calculates how fast user is scrolling
			// if scrolled past menu
			if (currentScroll > menuOffset) {
				// if scrolled past detach point add class to fix menu
				if (currentScroll > detachPoint) {}
				// if scrolling faster than hideShowOffset hide/show menu
				if (scrollDifference >= hideShowOffset) {
					if (currentScroll > previousScroll) {
						// scrolling down; hide menu
						$('header').addClass('scroll-hide');
					} else {
						// scrolling up; show menu
						// $('header').removeClass('scroll-hide');
					}
				}
			} else {
				// only remove “detached” class if user is at the top of document (menu jump fix)
				if (currentScroll <= 0) {
					$('header').removeClass();
				}
			}
			// if user is at the bottom of document show menu
			// if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
			//     $('header').removeClass('scroll-hide');
			// }
			// replace previous scroll position with new one
			previousScroll = currentScroll;
		}
	});



	/*  
		回到最上 Back To top
	*/
	// Show or hide the sticky footer button
	$(window).scroll(function() {
		if ($(this).scrollTop() > 200) {
			$('.back-to-top').fadeIn(500);
		} else {
			$('.back-to-top').fadeOut(200);
		}
	});
	// Animate the scroll to top
	$('.back-to-top').click(function(event) {
		event.preventDefault();
		$('html, body').animate({
			scrollTop: 0
		}, 300);
	});


	/*
		小購物車預覽視窗
	*/


	function miniCartShow() {

		var miniCart = $('.mini-cart');
		var miniCartToggle = $("[data-hover-el='mini-cart']");
		if ($(window).outerWidth() <= mobileWidth) {

			$(miniCart).removeClass('visible');
			$(miniCartToggle).click(
				function() {
					$(miniCart).toggleClass('fadeInUp fixed');
				}
			);
		} else {
			$(miniCart).removeClass('fixed');
			$(miniCartToggle).hover(
				function() {
					$(miniCart).addClass('fadeInUp visible');
				},
				function() {
					$(miniCart).removeClass('fadeInUp visible');
				}
			);
		}
	}
	$(document).ready(function() {
		miniCartShow();
		$(window).on('resize', function() {
			miniCartShow();
		});
	});

	/*
		小購物車預覽視窗
	*/


	function memberDropdownShow() {

		var miniCart = $('.member-dropdown');
		var miniCartToggle = $("[data-hover-el='member-dropdown']");
		if ($(window).outerWidth() <= mobileWidth) {

			$(miniCart).removeClass('visible');
			$(miniCartToggle).click(
				function() {
					$(miniCart).toggleClass('fadeInUp fixed');
				}
			);
		} else {
			$(miniCart).removeClass('fixed');
			$(miniCartToggle).hover(
				function() {
					$(miniCart).addClass('fadeInUp visible');
				},
				function() {
					$(miniCart).removeClass('fadeInUp visible');
				}
			);
		}
	}
	$(document).ready(function() {
		memberDropdownShow();
		$(window).on('resize', function() {
			memberDropdownShow();
		});
	});

});
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
/*----------------------------------------------------*/
/*  Product.js
/*----------------------------------------------------*/

/*  
  quantity Input button  
  數量欄位加減
*/
/* 
function quantityInput() {
  $('.quantity').on('click', 'a', function(e) {
    var self = $(this),
      input = self.siblings('input')[0],
      currentValue = +input.value;
    if (self.is('.minus')) {
      input.value = currentValue - 1;
    } else {
      input.value = currentValue + 1;
    }
    return false;
  });
}
/* 




/*
	Revolution Slider
*/

var tpj = jQuery,
	revapi88;
tpj(document).ready(function() {
	if (tpj("#rev_slider").revolution == undefined) {
		revslider_showDoubleJqueryError("#rev_slider");
	} else {
		revapi88 = tpj("#rev_slider").show().revolution({
			sliderType: "standard",
			sliderLayout: "auto",
			delay: 8000,
			jsFileLocation: "../../revolution/js/",
			responsiveLevels: [2200 ,1441, 1201, 991, 767],
			gridwidth: [2200 ,1441, 1201, 990, 767],
			gridheight: [1200, 900, 720, 620, 1200],
			navigation: {
				keyboardNavigation: "on",
				keyboard_direction: "horizontal",
				mouseScrollNavigation: "off",
				onHoverStop: "off",
				touch: {
					touchenabled: "on",
					swipe_threshold: 75,
					swipe_min_touches: 1,
					swipe_direction: "horizontal",
					drag_block_vertical: false
				},
			},
			parallax: {
				type:"mouse",
				origo:"slidercenter",
				speed:6000,
				levels:[2,3,4,5,6,7,12,16,10,50],
			}
		});
		// Current Slide Number Account
		// var api = revapi88;
		// var divider = ' / ',
		// 	totalSlides,
		// 	numberText;
		// api.one('revolution.slide.onloaded', function() {
		// 	totalSlides = api.revmaxslide();
		// 	numberText = api.find('.tp-index ').text('0' + '1');
		// 	api.on('revolution.slide.onbeforeswap', function(e, data) {
		// 		numberText.text('0' + (data.nextslide.index() + 1));
		// 	});
		// });
	};
});



/*
	Off Canvas Menu (for mobile)
*/

$(window).ready(function() {
	// Initiate Slidebars
	var controller = new slidebars();
	// Mobile only function
	var mobileOnly = function() {
		var windowWidth = $(window).width();
		if (windowWidth <= 3068) {
			// Window is less or equal to 600px wide
			// Only initialize Slidebars if it isn't active.
			if (!controller.isActive()) {
				controller.init();
				// Toggle Slidebars
				$('#mobileMenuTrigger').on('click', function(event) {
					// Stop default action and bubbling
					event.stopPropagation();
					event.preventDefault();
					// Toggle the Slidebar with id 'id-1'
					controller.toggle('mobileMenu');
					// Add close class to canvas container when Slidebar is opened
				});
				$('#mobileMenuClose').on('click', function(event) {
					// Stop default action and bubbling
					event.stopPropagation();
					event.preventDefault();
					// Toggle the Slidebar with id 'id-1'
					controller.close('mobileMenu');
				});

				$( document ).on( 'click', '.js-close-any', function ( event ) {
				  if ( controller.getActiveSlidebar() ) {
				    event.preventDefault();
				    event.stopPropagation();
						controller.close('mobileMenu');
				  }
				} );

				// Add close class to canvas container when Slidebar is opened
				$( controller.events ).on( 'opening', function ( event ) {
				  $( '.site-cavas main' ).addClass( 'js-close-any' );
				} );

				// Add close class to canvas container when Slidebar is opened
				$( controller.events ).on( 'closing', function ( event ) {
				  $( '.site-cavas main, .site-cavas .header' ).removeClass( 'js-close-any' );
				} );
			}
		} 
		else {
			// Window is more than 600px wide
			// Only exit Slidebars if it currently active.
			if (controller.isActive()) {
				controller.exit();
			}
		 }
	};
	// Call function now and on window resizes
	mobileOnly();
	$(window).on('resize', mobileOnly);
	/*----------------------------------------------------*/
	/*  mobilenav
	/*----------------------------------------------------*/
	$('.mobilemenu').mobilemenu({});
});



/*
	 Slider Pro
*/
$(document).ready(function() {
	function prodSlider() {
		if ($(window).outerWidth() <= 767) {
			$("[data-sliderpro='product-images']").removeClass('desktop');
			$("[data-sliderpro='product-images']").sliderPro({
				height: 500,
				autoWidth: true,
				autoHeight: true,
				fadeArrows: false,
				buttons: true,
				arrows: false,
				responsive: true,
				autoplay: false,
				autoScaleLayers: true,
				imageScaleMode: 'none',
				keyboardOnlyOnFocus: true
			});
		} else {
			$("[data-sliderpro='product-images']").addClass('desktop');
			$("[data-sticky='stick-element']").theiaStickySidebar({
				// Settings
				// additionalMarginTop: 100,
				disableOnResponsiveLayouts: true,
			});
		}
	}
	prodSlider();
	$(window).on('resize', function() {
		prodSlider();
	});
});



/*
	Animsition
*/
$(document).ready(function() {
	$(".animsition").animsition({
		inClass: 'fade-in',
		outClass: 'fade-out',
		inDuration: 800,
		outDuration: 800,
		linkElement: '.animsition-link',
	});
});




/*
	Owl Carousel
*/

function recommendProducts() {
	var recommendProductsOwl = $("[data-owl='owl-carousel']");

		recommendProductsOwl.owlCarousel({
			autoWidth: false,
			items: 3,
			loop: false,
			navText: ["<i></i><i></i>", "<i></i><i></i>"],
			responsive: {
				0: {
					items: 1,
					margin: 0
				},
				768: {
					items: 2,
					margin: 0,
					nav: true
				},
				1220: {
					items: 3,
					margin: 0,
					nav: true
				},
				1440: {
					items: 3,
					margin: 0,
					nav: true
				}
			}
		});
}
$(document).ready(function() {
	recommendProducts();
	$(window).on('resize', function() {
		recommendProducts();
	});
});


/*
	FitVids
*/
$(document).ready(function() {
	$(".product-detail-introduction").fitVids();
});
/*
	 ScrollReveal
*/
$(function() {
	window.sr = ScrollReveal({
		// Starting scale value, will transition from this value to 1
		scale: 1,
		duration: 500,
		scale: 0.98,
		delay: 0,
		easing: 'cubic-bezier(0.6, 0.2, 0.1, 1)',
	});
	sr.reveal('.prod-list li', 80);
});

/*
	 Taiwan Zipcode
*/
$('#twzipcode').twzipcode({
	css: ['form-control', 'form-control', 'form-control'],
});
/*
	 Taiwan Zipcode
*/
$('[data-plugin="twzipcode"]').twzipcode({
	css: ['form-control', 'form-control', 'form-control'],
});

/*
	animated Css
*/
$.fn.extend({
	animateCss: function(animationName, callback) {
		var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
		this.addClass('animated ' + animationName).one(animationEnd, function() {
			$(this).removeClass('animated ' + animationName);
			if (callback) {
				callback();
			}
		});
		return this;
	}
});
/*
	 mobilenav
*/
$('.drilldown').drilldown({});
$(document).ready(function() {
	$('[data-plugin="smoothScroll"]').click(function(event) {
		event.preventDefault();
		var link = this;
		$.smoothScroll({
			scrollTarget: link.hash
		});
	});
});


/*
	Formatter
*/
$('[data-plugin~="mask"][data-plugin~="credit-input"]').mask('0000-0000-0000-0000', {
	placeholder: "    -    -    -    "
});
$('[data-plugin~="mask"][data-plugin~="expire-date-input"]').mask('00/00', {
	placeholder: "  /  "
});
$('[data-plugin~="mask"][data-plugin~="cvs-input"]').mask('000', {});



/*
	 Lazyload
*/
$(function() {
	$("div.lazyload").lazyload();
});
/*
	
*/
// (function($) {
// 	$.fn.blurryLoad = function(options) {
// 		var parentContainer = $(this).parent('.img-wrap'),
// 			imageContainer = $(this)
// 		parentContainer.addClass('blurry-load-container');
// 		imageContainer.addClass('img-blur')
// 		// 1: load small image and show it
// 		var img = new Image();
// 		img.src = imageContainer.attr('src');
// 		img.onload = function() {
// 			imageContainer.addClass('loaded');
// 		};
// 		// 2: load large image
// 		var imgLarge = new Image();
// 		imgLarge.src = $(this).attr('data-large');
// 		imgLarge.onload = function() {
// 			imgLarge.classList.add('loaded');
// 		};
// 		parentContainer.append(imgLarge)
// 	};
// }(jQuery));
// $('.img-wrap img').blurryLoad()
/*
	Lazy Load
*/
window.onload = function() {
	$(".lazyload").each(function() {
		$(this).attr("data-original", $(this).attr("src"));
		$(this).removeAttr("src");
	});
	$(".lazyload").lazyload({
		effect: "fadeIn",
		threshold: 200,
		placeholder: "static/images/lazyblank.gif",
		skip_invisible: false
	});
}


/*
	Paroller
*/
$(function() {
	$(".paroller").paroller();
	$('main').paroller({
	    factor: 0.3, // multiplier for scrolling speed and offset
	    type: 'foreground', // background, foreground
	    direction: 'vertical' // vertical, horizontal, TODO: diagonal
	});
});



/*
	 Datetime Picker
*/
// $(function() {
// 	$('#birthdaypicker').datetimepicker({
// 		language: 'zh-TW',
// 		pickTime: false
// 	});
// });




