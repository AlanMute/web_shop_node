$(document).ready(function () {
    $(document).on('click', '.delete-pr', function (e) {
        e.preventDefault();

        var productId = $(this).closest('.product').find('input[name="product_id"]').val();
        var productContainer = $(this).closest('.product');

        $.ajax({
            url: '/admin/delete_product',
            type: 'POST',
            dataType: 'json',
            data: {
                product_id: productId
            },
            success: function (response) {
                if (response.success) {
                    window.location.href = '/'; 
                } else {
                    alert(response.message);
                }
            },
            error: function (xhr, status, error) {
                console.error(xhr.responseText);
                alert('Произошла ошибка при удалении товара');
            }
        });
    });

    $('#add-product-form').submit(function (event) {
        event.preventDefault();
        const formData = $(this).serialize();

        $.ajax({
            type: 'POST',
            url: '/add-product',
            data: formData,
            success: function (response) {
                alert(response.message)
                window.location.href = '/';
            },
            error: function (error) {
                if (error.responseJSON && error.responseJSON.error) {
                    alert('Произошла ошибка: ' + error.responseJSON.error);
                } else {
                    alert('Произошла ошибка при отправке запроса на сервер.');
                }
            }
        });
    });

    $('#ed-product-form').submit(function (event) {
        event.preventDefault();
        const formData = $(this).serialize();

        $.ajax({
            type: 'POST',
            url: '/ed-product',
            data: formData,
            success: function (response) {
                alert(response.message)
                window.location.href = '/';
            },
            error: function (error) {
                if (error.responseJSON && error.responseJSON.error) {
                    alert('Произошла ошибка: ' + error.responseJSON.error);
                } else {
                    alert('Произошла ошибка при отправке запроса на сервер.');
                }
            }
        });
    });


    // Для фидбеков
    $('.created-at').each(function () {
        var createdAt = $(this).text();
        var formattedDate = formatDate(createdAt);
        $(this).text(formattedDate);
    });

    function formatDate(dateString) {
        var date = new Date(dateString);
        var options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('en-US', options);
    }

    $('form[name="remove-form"]').on('submit', function (event) {
        event.preventDefault();
        const form = $(this);
        const formData = form.serialize();

        $.ajax({
            url: '/del-feedback',
            type: 'POST',
            data: formData,
            dataType: 'json',
            success: function (response) {
                $('.cart').find('a').text(`Корзина: ${response.cartCount} товаров`);
                if (response.success) {
                    form.closest('tr').remove();
                    $('.total-price').text(`Итого: ${response.totalPrice} руб.`);
                }
                else {
                    alert('Ошибка: ' + response.message);
                }
            },
            error: function (error) {
                if (error.responseJSON && error.responseJSON.error) {
                    alert('Произошла ошибка: ' + error.responseJSON.error);
                } else {
                    alert('Произошла ошибка при отправке запроса на сервер.');
                }
            }
        });
    });

});