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