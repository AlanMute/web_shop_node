$(document).ready(function () {
    $('form[name="remove-form"]').on('submit', function (event) {
        event.preventDefault();
        const form = $(this);
        const formData = form.serialize();

        $.ajax({
            url: '/cart/remove',
            type: 'POST',
            data: formData,
            dataType: 'json',
            success: function (response) {
                if (response.success) {
                    if (response.cartCount === 0) {
                        $('table').remove();
                        $('.checkout-button').remove();
                        const cartItemsContainer = $('.cart-items');
                        cartItemsContainer.html('<p>Корзина пуста.</p>');
                    } else {
                        form.closest('tr').remove();
                        $('.cart').find('a').text(`Корзина: ${response.cartCount} товаров`);
                        $('.total-price').text(`Итого: ${response.totalPrice} руб.`);
                    }
                } else {
                    alert('Ошибка: ' + response.message);
                }
            },
            error: function () {
                alert('Ошибка соединения с сервером.');
            }
        });
    });
});