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


