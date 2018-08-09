/*----------------------------------------------------*/
/*  lightbox for index popout
/*----------------------------------------------------*/


$(document).ready(function() {

    var index_promote_ilightbox = $('#promote_popput');
        promote_bar = $('.promote-text-bar');
        close_promote = $(promote_bar).find('.close');


    $(promote_bar).prependTo('body').fadeOut(200);

    $('#promote_popput').magnificPopup({
        delegate: 'a',
        type: 'inline',
        removalDelay: 500, //delay removal by X to allow out-animation
        callbacks: {
            beforeOpen: function() {
              // just a hack that adds mfp-anim class to markup 
               this.st.mainClass = this.st.el.attr('data-effect');
            },
            close: function() {
                $(promote_bar).fadeIn(200);
            }
            // e.t.c.
        },
        closeOnContentClick: true,
        midClick: true // allow opening popup on middle mouse click. Always set it to true if you don't provide alternative source.
    });

    $(close_promote).click(function(event) {
        $(promote_bar).remove();
    });


    setTimeout(function() {
        $('#promote_popput a.trigger').trigger('click')
    }, 2500);

});



/*----------------------------------------------------*/
/*  Revolution Slider
/*----------------------------------------------------*/
var tpj = jQuery,
    revapi88;

tpj(document).ready(function() {
    if (tpj("#rev_slider").revolution == undefined) {
        revslider_showDoubleJqueryError("#rev_slider");
    } else {
        revapi88 = tpj("#rev_slider").show().revolution({
            sliderType: "standard",
            sliderLayout: "auto",
            delay: 9000,
            jsFileLocation: "../../revolution/js/",
            responsiveLevels: [4096, 1024, 778, 480],
            gridwidth: 1480,
            gridwidth: [1480, 800, 750, 200],
            gridheight: [1100, 720, 720, 400],
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
                arrows: {
                    style: "uranus",
                    enable: true,
                    hide_onmobile: true,
                    hide_onleave: true,
                    hide_under: 600,
                    tmp: '',
                    left: {
                        h_align: "left",
                        v_align: "center",
                        h_offset: 10,
                        v_offset: 0
                    },
                    right: {
                        h_align: "right",
                        v_align: "center",
                        h_offset: 10,
                        v_offset: 0
                    }
                },
                bullets: {
                    enable: true,
                    hide_onmobile: false,
                    style: "hermes",
                    hide_onleave: false,
                    direction: "vertical",
                    h_align: "right",
                    v_align: "bottom",
                    h_offset: 30,
                    v_offset: 30,
                    space: 20,
                    tmp: ''
                }
            },
            parallax: {
                type: "mouse",
                origo: "slidercenter",
                speed: 2000,
                levels: [2, 3, 4, 5, 6, 7, 12, 16, 10, 50],
            }
        });
    }
}); /*ready*/

/*----------------------------------------------------*/
/*  mobilenav
/*----------------------------------------------------*/
$(document).ready(function() {
    $('.mobilenav').mobilenav({});
});


/*----------------------------------------------------*/
/*  Sticky  aside in product detail
/*----------------------------------------------------*/
var stickySidebar = $('.prod-content');

if (stickySidebar.length > 0) {
    var stickyHeight = stickySidebar.height(),
        sidebarTop = stickySidebar.offset().top;
}

// on scroll move the sidebar
$(window).scroll(function() {
    if (stickySidebar.length > 0) {
        var scrollTop = $(window).scrollTop();

        if (sidebarTop < scrollTop) {
            stickySidebar.css('top', scrollTop - sidebarTop);

            // stop the sticky sidebar at the footer to avoid overlapping
            var sidebarBottom = stickySidebar.offset().top + stickyHeight,
                stickyStop = $('.prod-image').offset().top + $('.prod-image').height();
            if (stickyStop < sidebarBottom) {
                var stopPosition = $('.prod-image').height() - stickyHeight;
                stickySidebar.css('top', stopPosition);
            }
        } else {
            stickySidebar.css('top', '0');
        }
    }
});

$(window).resize(function() {
    if (stickySidebar.length > 0) {
        stickyHeight = stickySidebar.height();
    }
});

/*----------------------------------------------------*/
/*  Sticky header
/*----------------------------------------------------*/


var previousScroll = 0, // previous scroll position
    menuOffset = 54, // height of menu (once scroll passed it, menu is hidden)
    detachPoint = 650, // point of detach (after scroll passed it, menu is fixed)
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
                    $('header').removeClass('scroll-hide');
                }
            }
        } else {
            // only remove “detached” class if user is at the top of document (menu jump fix)
            if (currentScroll <= 0) {
                $('header').removeClass();
            }
        }

        // if user is at the bottom of document show menu
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            $('header').removeClass('scroll-hide');
        }

        // replace previous scroll position with new one
        previousScroll = currentScroll;
    }
})




/*----------------------------------------------------*/
/*  Slider Pro
/*----------------------------------------------------*/
$(document).ready(function() {
    $('#prod').sliderPro({
        width: 733,
        autoHeight: true,
        fade: true,
        fadeArrows: false,
        buttons: false,
        responsive: true,
        autoplay: false,
        thumbnailsPosition: 'left',
        thumbnailHeight: 130,
        thumbnailWidth: 90,
        keyboardOnlyOnFocus: true,
        imageScaleMode: 'cover',
        breakpoints: {
            1000: {
                height: '100%',
                touchSwipe: true,
                fade: false,
                thumbnailHeight: 'auto',
                thumbnailWidth: 70,
                thumbnailsPosition: 'bottom',
            }
        }
    });
});


/**=========================================================
 * Module: jquery.magnific-popup.js
 * This script handle Lightbox effect
 =========================================================*/
$('#lightboxtrigger').magnificPopup({
    // disableOn: 768,
    removalDelay: 300,
    mainClass: 'mfp-fade',
    overflowY: 'scroll',
    closeOnContentClick: true
});


// $('.image-link').magnificPopup({
//     type: 'image',
//     removalDelay: 300,
//     mainClass: 'mfp-fade',
//     closeOnContentClick: true,
//     callbacks: {
//         beforeOpen: function() {
//             viewport = document.querySelector("meta[name=viewport]");
//             viewport.setAttribute('content', 'width=device-width, initial-scale=1, device-width');
//         },
//         beforeClose: function() {
//             viewport = document.querySelector("meta[name=viewport]");
//             viewport.setAttribute('content', 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1');
//         },
//     },
//     zoom: {
//         enabled: true, // By default it's false, so don't forget to enable it
//         duration: 300, // duration of the effect, in milliseconds
//         easing: 'ease-in-out', // CSS transition easing function
//         // The "opener" function should return the element from which popup will be zoomed in
//         // and to which popup will be scaled down
//         // By defailt it looks for an image tag:
//         opener: function(openerElement) {
//             // openerElement is the element on which popup was initialized, in this case its <a> tag
//             // you don't need to add "opener" option if this code matches your needs, it's defailt one.
//             return openerElement.is('img') ? openerElement : openerElement.find('img');
//         }
//     }
// });


$(document).ready(function() {
    /*----------------------------------------------------*/
    /*  megamenu
    /*----------------------------------------------------*/
    // hack so that the megamenu doesn't show flash of css animation after the page loads.
    setTimeout(function() {
        $('body').removeClass('init');
    }, 500);
    /*----------------------------------------------------*/
    /*  Off Canvas Menu (for mobile)
    /*----------------------------------------------------*/

    // Initiate Slidebars
    $.slidebars({
        scrollLock: true
    });

    /*----------------------------------------------------*/
    /*  Responsive Pagination
    /*----------------------------------------------------*/
    $(".pagination").rPage();
    /*----------------------------------------------------*/
    /*  SUPERFISH
    /*----------------------------------------------------*/
    $('ul.sf-menu').superfish({
        animation: {
            opacity: 'show',
            height: 'show'
        }, // fade-in and slide-down animation 
        cssArrows: false,
        delay: 300
    });
});


/*----------------------------------------------------*/
/* Back To top
/*----------------------------------------------------*/

$(document).ready(function() {
    // Show or hide the sticky footer button
    $(window).scroll(function() {
        if ($(this).scrollTop() > 200) {
            $('.go-top').fadeIn(200);
        } else {
            $('.go-top').fadeOut(200);
        }
    });

    // Animate the scroll to top
    $('.go-top').click(function(event) {
        event.preventDefault();

        $('html, body').animate({
            scrollTop: 0
        }, 300);
    })
});


/*----------------------------------------------------*/
/* Animstion
/*----------------------------------------------------*/
$(document).ready(function() {
    $('.animsition').animsition({
        loading: false,
        inClass: 'fade-in-down-sm',
        outClass: 'fade-out',
        inDuration: 1000,
        outDuration: 800,
        loading: true,
        loadingParentElement: 'body', //animsition wrapper element
        loadingClass: 'animsition-loading',
        loadingInner: '', // e.g '<img src="loading.svg" />'
        overlayParentElement : 'body',
        transition: function(url){ window.location.href = url; }
        }, function() {

        })
});

$(document).ready(function() {



        // var sequenceInterval = 100;

        // window.sr = ScrollReveal({reset: true});

        // // Custom reveal sequencing by container
        // $('#infinite-content').each(function() {
        //   var sequenceDelay = 0;
        //   $(this).find('article').each(function() {
        //     sr.reveal(this, {
        //       delay: sequenceDelay,
        //       duration: 1000,
        //         scale: 0.98,
        //         opacity: 0,
        //         delay: 0,
        //         reset: false,
        //         easing: 'cubic-bezier(0.6, 0.2, 0.1, 1)',
        //     });
        //     sequenceDelay += sequenceInterval;
        //   });
        // });

        window.sr = ScrollReveal({ 
            duration: 500,
            scale: 0.85,
            opacity: 0,
            delay: 0,
            reset: false,
            easing: 'cubic-bezier(0.6, 0.2, 0.1, 1)', }
        );

        sr.reveal('.prod-block', 200);

        sr.reveal('.issue-item', {            
            duration: 3000,
            scale: 0.85,
            opacity: 0,
            delay: 0,
            reset: false,
            easing: 'cubic-bezier(0.6, 0.2, 0.1, 1)',  }, 400);
});
/*----------------------------------------------------*/
/* Owl Carousel
/*----------------------------------------------------*/

$(document).ready(function() {
    $(".recommend-list").owlCarousel({
        items: 4,
        itemsDesktop: [1199, 3],
        itemsDesktopSmall: [979, 2],
        itemsTablet: [768, 1],
        pagination: false,
        navigation: true,
        navigationText: [
            "<i></i><i></i>",
            "<i></i><i></i>"
        ]

    });
});

/*----------------------------------------------------*/
/* Customize Select Element
/*----------------------------------------------------*/

$(document).ready(function() {
    $('select').niceSelect();
});

/*----------------------------------------------------*/
/* Search
/*----------------------------------------------------*/
$(function() {
    $('a[href="#search"]').on('click', function(event) {
        event.preventDefault();
        $('#search').addClass('open');
        $('#search > form > input[type="search"]').focus();
    });

    $('#search, #search button.close').on('click keyup', function(event) {
        if (event.target == this || event.target.className == 'close' || event.keyCode == 27) {
            $(this).removeClass('open');
        }
    });
});


/*----------------------------------------------------*/
/*  icheck.js
 * This script handle customized checlbox and radio
/*----------------------------------------------------*/
$(document).ready(function() {
    $('input').iCheck({
        checkboxClass: 'icheckbox_flat-grey',
        radioClass: 'iradio_flat-grey',
        increaseArea: '20%' // optional
    });
});


/*----------------------------------------------------*/
/*  Datetime Picker
/*----------------------------------------------------*/

$(function() {
    $('#birthdaypicker').datetimepicker({
        language: 'zh-TW',
        pickTime: false
    });
});



/*----------------------------------------------------*/
/*  Bootstrap Tab Hash
/*----------------------------------------------------*/

$(function() {
    var hash = window.location.hash;
    hash && $('ul.nav a[href="' + hash + '"]').tab('show');

    $('.nav-tabs a').click(function(e) {
        $(this).tab('show');
        var scrollmem = $('body').scrollTop();
        window.location.hash = this.hash;
        $('html,body').scrollTop(scrollmem);
    });
});







/*----------------------------------------------------*/
/*  light box - for prod popout lightbox
/*----------------------------------------------------*/
$(document).ready(function() {
    $('.ilightboxgallery-trigger').iLightBox({
        innerToolbar: true,
        fullViewPort: 'stretch',
        controls: {
            fullscreen: false
        },
        keepAspectRatio: false,
        maxScale: 1.3,
        callback: {
            onAfterLoad: function(api) {
                $('head').append
                ('<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=2">');
            }
        }
    });

});

/*----------------------------------------------------*/
/*  Isuue image fix
/*----------------------------------------------------*/
// var imageGrad = $('.issue-detail-images article'),
//     image = $('.issue-detail-images img');

// $('.issue-detail-images article').each(function(i) {
//     if ((i + 1) % 3 == 0) {

//         function resizeDiv() {
//             imageGrad.height(image.height());
//         }

//         resizeDiv();

//         $(window).resize(function() { resizeDiv(); });
//     }
// });

// var img = $(".issue-detail-images article > img");
// $(".issue-detail-images article").css({width:img.width(), height:img.height()});



// $(window).on('resize', function() {

//         var height = 0;
//         $('#entries > article').each(function() {
//             height += $(this).height();
//         });

//         // apply calculated height to another element
//         $('#entries').height(height + 'px');

        
//     if (window.innerHeight >= 991) {
//         $('.issue-detail-images article').each(function() {
//             // Set up the variables
//             var $this = $(this),
//                 h = $this.find('img').height(); // Height of the image inside .box
//             $this.height(h); // Set width and height of .box to match image
//         });
//         $('.img-wrap').each(function() {
//             // Set up the variables
//             var $this = $(this),
//                 h = $this.find('img').height(); // Height of the image inside .box
//             $this.height(h); // Set width and height of .box to match image
//         });
//     }
//     $('.ilightbox-holder').each(function() {
//         // Set up the variables
//         var $this = $(this),
//             w = $this.find('img').width(), // Width of the image inside .box
//             h = $this.find('img').height(); // Height of the image inside .box
//         $this.width(w).height(h); // Set width and height of .box to match image
//     });
// });
// $(window).load(function() {
//     $(window).trigger('resize');
// });


/*----------------------------------------------------*/
/*  Infinite Scroll
/*----------------------------------------------------*/
var page = 0;
$(function() {
    $('#infinite-content').scrollPagination({
        'contentPage': 'ajax.php', // the url you are fetching the results
        'contentData': { 'page': page },
        'scrollTarget': $(window),
        'heightOffset': 10,
        'beforeLoad': function() {
            // before load function, you can display a preloader div
            $('#loading').fadeIn();
        },
        'afterLoad': function(elementsLoaded) {
            $('#loading').fadeOut();
            var i = 0;
            $(elementsLoaded).fadeInWithDelay();
            page++;

            if ($('#content').children().size() > 140) {
                // if more than 140 results already loaded, then stop pagination
                $('#nomoreresults').fadeIn();
                $('#content').stopScrollPagination();
            }

        }
    });


    // code for fade in element by element
    $.fn.fadeInWithDelay = function() {
    var sequenceInterval = 0;
    var sequenceDelay = 0;
        return this.each(function() {
            sr.reveal(this, {
                duration: 2000,
                scale: 0.85,
                opacity: 0,
                delay: 0,
                reset: false,
                easing: 'cubic-bezier(0.6, 0.2, 0.1, 1)', 
            }, 100);
            sequenceDelay += sequenceInterval;

        });


    };
});



/*----------------------------------------------------*/
/*  Responsive Image Jquery
/*----------------------------------------------------*/

// $(".tp-bgimg").responsiveImg({
//     srcAttribute:"src",
//     breakpoints : {
//     "_mobiel":360,
//     "_tablet":780,
//     "_desktop":900
// },
// });


