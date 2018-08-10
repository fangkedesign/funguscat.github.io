var shipment_with_payment = false;
var store_to_store = false;

$(function() {

  $('input[name|=ship_area]').on('ifChecked', function(event) {
    ship_area_change(this);
  });

  $('input[name|=payment]').on('ifChecked', function(event) {
    payment_change(this);
  });

  $('input[name|=shipment]').on('ifChecked', function(event) {
    shipment_change(this);
  });

  $('input[name|=coupon_idx]').on('ifChecked', function(event) {
    coupon_change();
  });

  $('input[name|=shipping_area_idx]').on('ifChecked', function(event) {
    change_shipping_area();
  });

  //coupon_change();
  //credit_used_change();
  //change_shipping_area();
  check_coupon();

  $('#payment_area').hide();
  $('#store_to_store_area').hide();

});

function ship_area_change(ship_area_obj)
{
  var ship_area       = $(ship_area_obj).val();

  if(ship_area=='oversea')
  {
    $('#block_shipment_store_to_store').hide();
    $('#block_shipment_store_to_store_with_payment').hide();
  }
  else
  {
    $('#block_shipment_store_to_store').show();
    $('#block_shipment_store_to_store_with_payment').show();
  }

  $.post('cart/set_ship_area', {
    ship_area: ship_area
  }, function(res) {

    $('#shipment_fee').html('$' + res.shipment_fee);
    $('#final_price').html('$' + res.final_price);

  }, 'json');
}

function shipment_change(shipment_obj)
{
  var shipment = $(shipment_obj).val();
  $.post('cart/set_shipment', {
    shipment: shipment
  }, function(res) {
    $('#shipment_fee').html('$' + res.shipment_fee);
    $('#payment_fee').html('$' + res.payment_fee);
    $('#final_price').html('$' + res.final_price);

    shipment_with_payment = res.with_payment;
    if (shipment_with_payment)
      $('#payment_area').hide();
    else
      $('#payment_area').show();

    store_to_store = res.store_to_store;
    if (store_to_store) {
      $('#store_to_store_area').show();
      $('.shipment_deliver_to_home').hide();
    } else {
      $('#store_to_store_area').hide();
      $('.shipment_deliver_to_home').show();
    }


  }, 'json');
}

function payment_change(payment_obj) {
  var payment         = $(payment_obj).val();

  if(payment=='cc')
    $('#block_credit_installment').show();
  else
    $('#block_credit_installment').hide();

  $.post('cart/set_payment', {
    payment: payment
  }, function(res) {
    $('#shipment_fee').html('$' + res.shipment_fee);
    $('#payment_fee').html('$' + res.payment_fee);
    $('#final_price').html('$' + res.final_price);
  }, 'json');
}


function order_submit()
{
  var ship_area       = $('input[name=ship_area]:checked').val();
  var payment         = $('input[name=payment]:checked').val();
  var shipment        = $('input[name=shipment]:checked').val();
  var store_name        = $('input[name=store_name]').val();
  var store_id        = $('input[name=store_id]').val();
  var CreditInstallment   = $('input[name=CreditInstallment]:checked').val();

  var rcpt_name       = $('input[name=rcpt_name]').val();
  var rcpt_phone        = $('input[name=rcpt_phone]').val();
  var shipping_area_idx   = $('select[name=shipping_area_idx]').val();
  var rcpt_zipcode      = $('input[name=rcpt_zipcode]').val();
  var rcpt_address      = $('input[name=rcpt_address]').val();

  //var invoice_type = $('input[name=invoice_type]:checked').val();
  //var company_sn = $('input[name=company_sn]').val();
  //var company_title = $('input[name=company_title]').val();

  if (ship_area === undefined || ship_area.length == 0) {
    alert('請選擇運送地區');
    return;
  }

  if (shipment === undefined || shipment.length == 0) {
    alert('請選擇運送方式');
    return;
  }

  /* 店到店 或 店到店取或付款 */
  if (shipment == 'store_to_store' || shipment == 'store_to_store_with_payment') {
    if (store_name.length == 0) {
      sweetAlert('請輸入店名');
      return;
    }
    if (store_id.length == 0) {
      sweetAlert('請輸入店號');
      return;
    }
  } else /* 一般貨運 */ {
    if (rcpt_name.length == 0) {
      sweetAlert('請輸入收貨人姓名');
      return;
    }
    if (rcpt_phone.length == 0) {
      sweetAlert('請輸入收貨人電話');
      return;
    }
    if (rcpt_zipcode.length == 0) {
      sweetAlert('請輸入收貨人郵遞區號');
      return;
    }
    if (rcpt_address.length == 0) {
      sweetAlert('請輸入收貨人地址');
      return;
    }
  }

  /* 非貨到付款/要先付款 */
  if (!shipment_with_payment) {
    if (payment === undefined || payment.length == 0) {
      sweetAlert('請選擇付款方式');
      return;
    }
  }

  if(payment=='cc' && CreditInstallment==undefined)
  {
    sweetAlert('請選擇一個分期方式');
    return;
  }

  /*
  if(ship_area=='oversea' && payment=='paypal')
  {
    sweetAlert('由於您選擇的是海外運送, 我們會在確定運費後, 通知您總金額後再請您付費');
  }
  */
  $('#checkout_button').html('結帳中請稍後');
  $('#enter_coupon_code').prop("disabled", true);
  $('#edit_address').prop("disabled", true);
  $('#return_to_cart').prop("disabled", true);
  $('#checkout_button').prop("disabled", true);



  $.post('cart/order_submit', {
      ship_area: ship_area,
      payment: payment,
      shipment: shipment,
      store_name: store_name,
      store_id: store_id,

      rcpt_name: rcpt_name,
      rcpt_phone: rcpt_phone,
      rcpt_zipcode: rcpt_zipcode,
      rcpt_address: rcpt_address,

      //invoice_type: invoice_type,
      //company_sn: company_sn,
      //company_title: company_title
      CreditInstallment: CreditInstallment

    },
    function(res) {

      if(res.status!='ok')
      {
        $('#checkout_button').html('重新結帳');
        $('#enter_coupon_code').prop("disabled", false);
        $('#edit_address').prop("disabled", false);
        $('#return_to_cart').prop("disabled", false);
        $('#checkout_button').prop("disabled", false);
      }

      if (res.status == 'ok') {
        window.location = res.cashflow_url;
      } else if (res.status == 'out_of_stock') {
        sweetAlert('商品預訂中，完成付款程序，將立即為您排入訂單，並有專人聯繫您到貨時間。');
      } else if (res.status == 'empty_zipcode') {
        sweetAlert('缺少收件郵遞區號')
      } else if (res.status == 'empty_address') {
        sweetAlert('缺少收件地址')
      } else if (res.status == 'no_login') {
        sweetAlert('請先登入');

      }
      else if(res.status == 'cart_is_empty')
      {
        swal({
          title: "購物車是空的",
          text: "購物車是空的 請重新選購商品",
        },
        function(){
          window.location = 'product';
        });
      }
      /* else if (res.status == 'with_alcohol') {
        alert('因法令規定，網站上無法販賣酒精類商品，請來電確認身份後，我們將另行處理您的訂單');
      } else if (res.status == 'low_quantity') {
        alert('您的購物車內未滿最低出貨量6瓶，請繼續選購，訂購滿12瓶即可享有免費宅配到府服務。');
      } else if (res.status == 'some_product_buy_limit') {
        alert('抱歉您所選擇的 ' + res.product_title + ' 品項僅提供給 ' + res.user_type + ' 選購 謝謝！')
      } else if (res.status == 'b2b_only_deliver_to_home_with_payment') {
        alert('經銷商僅允許貨到付款');

      }*/ else {
        sweetAlert('伺服器異常');
      }
    }, 'json');
}


function add_to_cart(product_idx, quantity_obj)
{
  var url           = 'cart/add';
  var quantity        = $('#' + quantity_obj).val();
  var color_old       = $('#color_old').val();
  var size_old        = $('#size_old').val();

  if (quantity == undefined)
    quantity = 1;
  if (color_old == undefined)
    color_old = '';
  if (size_old == undefined)
    size_old = '';

  $.post(url,
  {
    product_idx:    product_idx,
    quantity:     quantity,
    color_old:      color_old,
    size_old:     size_old,
  }, function(res) {
    if (res == 'ok')
    {
      //alert('加入購物車!!!');
      location.reload();
    }
    else
    {
      sweetAlert('伺服器異常 請稍後再試');
    }
  });
}

function update_quantity(quantity, product_idx) {
  var url = "cart/update";

  $.post(url, {
    product_idx: product_idx,
    quantity: quantity
  }, function(res) {
    if (res == 'ok') {
      //alert('更新成功');
      //location.reload();
      refresh_cart();
    } else {
      sweetAlert('更新失敗');
    }
  });
}

function remove_from_cart(product_idx) {
  var url = "cart/delete/" + product_idx;

  $.post(url, function(res) {
    if (res == 'ok') {
      //alert('更新成功');
      location.reload();
    } else {
      sweetAlert('更新失敗');
    }
  });
}




function check_coupon()
{
  var coupon_code       = $('input[name=coupon_code]').val();
  if(coupon_code==undefined)
    return;
  /*
  if(coupon_code.length==0)
  {
    sweetAlert('Coupon Code 不存在');
    return;
  }
  */

  $.post('cart/set_coupon_code',
  {
    coupon_code:      coupon_code
  },
  function(res)
  {
    if(res.status=='coupon_code_error')
    {
      sweetAlert('Coupon Code 不存在');
      $('input[name=coupon_code]').val('');
    }
    if(res.status=='coupon_date_error')
    {
      sweetAlert('Coupon Code 不在使用日期內');
      $('input[name=coupon_code]').val('');
    }
    //if(res.status=='ok')
    {
      $('#cart_total').html(res.html);
    }
  }, 'json');

}
