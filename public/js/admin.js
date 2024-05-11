$(document).ready(function () {
    $(document).on('click', '.delete-pr', function(e) {
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
            success: function(response) {
                if (response.success) {
                    productContainer.remove();
                } else {
                    alert(response.message);
                }
            },
            error: function(xhr, status, error) {
                console.error(xhr.responseText);
                alert('Произошла ошибка при удалении товара');
            }
        });
    });

    $('#add-product-form').submit(function(event) {
        event.preventDefault();
        const formData = $(this).serialize();
        
        $.ajax({
            type: 'POST',
            url: '/add-product',
            data: formData,
            success: function(response) {
                alert(response.message)
                window.location.href = '/';
            },
            error: function(error) {
                if (error.responseJSON && error.responseJSON.error) {
                    alert('Произошла ошибка: ' + error.responseJSON.error);
                } else {
                    alert('Произошла ошибка при отправке запроса на сервер.');
                }
            }
        });
    });
});