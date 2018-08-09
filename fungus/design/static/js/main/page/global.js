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