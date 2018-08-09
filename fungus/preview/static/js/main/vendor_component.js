
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
				  $( '.site-cavas main' ).removeClass( 'js-close-any' );
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



