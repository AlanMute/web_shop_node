$(document).ready(function () {
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

    $('.add-product-form, .ed-product-form, .delete-product-form').hide();

    $('#btn-add-product').click(function () {
        $('.add-product-form').show();
        $('.ed-product-form, .delete-product-form').hide();
    });

    $('#btn-edit-product').click(function () {
        $('.ed-product-form').show();
        $('.add-product-form, .delete-product-form').hide();

        $('#upd-product-id').empty();

        $.ajax({
            url: '/get-all-products',
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                data.forEach(function (product) {
                    var option = $('<option>', {
                        value: product.ProductID,
                        text: product.Name
                    });
                    option.data('price', product.Price);
                    option.data('image', product.Image);
                    option.data('description', product.Description);
                    option.data('categoryid', product.CategoryID);
                    option.data('count', product.Count);
                    $('#upd-product-id').append(option);
                });
                if (data.length > 0) {
                    $('#upd-product-id').trigger('change');
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error('Ошибка при загрузке товаров: ', textStatus, errorThrown);
                $('#upd-product-id').append($('<option>', {
                    value: '',
                    text: 'Ошибка загрузки'
                }));
            }
        });
    });

    $('#btn-delete-product').click(function () {
        $('.delete-product-form').show();
        $('.add-product-form, .ed-product-form').hide();

        $('#delete-product-id').empty();

        $.ajax({
            url: '/get-all-products',
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                data.forEach(function (product) {
                    var option = $('<option>', {
                        value: product.ProductID,
                        text: product.Name
                    });
                    $('#delete-product-id').append(option);
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error('Ошибка при загрузке товаров: ', textStatus, errorThrown);
                $('#delete-product-id').append($('<option>', {
                    value: '',
                    text: 'Ошибка загрузки'
                }));
            }
        });
    });

    $('#upd-product-id').change(function () {
        var selectedOption = $(this).find('option:selected');
        $('#ed-product-form #name').val(selectedOption.text());
        $('#ed-product-form #price').val(selectedOption.data('price'));
        $('#ed-product-form #image').val(selectedOption.data('image'));
        $('#ed-product-form #description').val(selectedOption.data('description'));
        $('#ed-product-form #count').val(selectedOption.data('count'));
    });

    $('#add-product-form').on('submit', function (e) {
        e.preventDefault();

        var formData = {
            name: $('#add-product-form #name').val(),
            price: $('#add-product-form #price').val(),
            image: $('#add-product-form #image').val(),
            description: $('#add-product-form #description').val(),
            count: $('#add-product-form #count').val()
        };

        $.ajax({
            url: '/add-product',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            dataType: 'json',
            success: function (response) {
                if (response.success) {
                    showNotification('Товар добален<br>Имя: ' + formData.name +
                        '<br>Цена: ' + formData.price +
                        '<br>Картинка: ' + formData.image + 
                        '<br>Описание: ' + formData.description +
                        '<br>Количество: ' + formData.count);
                    $('#add-product-form')[0].reset();
                } else {
                    alert('Ошибка: ' + response.error);
                }
            },
            error: function (xhr, status, error) {
                alert('Произошла ошибка: ' + error);
            }
        });
    });


    $('#ed-product-form').on('submit', function (e) {
        e.preventDefault();

        var selectedOption = $('#upd-product-id').find('option:selected');

        var formData = {
            product_id: selectedOption.val(),
            name: $('#ed-product-form #name').val(),
            price: $('#ed-product-form #price').val(),
            image: $('#ed-product-form #image').val(),
            description: $('#ed-product-form #description').val(),
            count: $('#ed-product-form #count').val()
        };

        $.ajax({
            url: '/ed-product',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            dataType: 'json',
            success: function (response) {
                if (response.success) {
                    showNotification('Товар изменен<br>' + 
                        '<br>Имя: ' + selectedOption.text() + ' -> ' + formData.name +
                        '<br>Цена: ' + selectedOption.data('price') + ' -> ' + formData.price +
                        '<br>Картинка: ' + selectedOption.data('image') + ' -> ' + formData.image +
                        '<br>Описание: ' + selectedOption.data('description') + ' -> ' + formData.description +
                        '<br>Количество: ' + selectedOption.data('count') + ' -> '+ formData.count);
                    $('#add-product-form')[0].reset();

                    selectedOption.text(formData.name);
                    selectedOption.data('price', formData.price);
                    selectedOption.data('image', formData.image);
                    selectedOption.data('description', formData.description);
                    selectedOption.data('count', formData.count);

                } else {
                    alert('Ошибка: ' + response.error);
                }
            },
            error: function (xhr, status, error) {
                alert('Произошла ошибка при изменении товара: ' + error);
            }
        });
    });

    $('#delete-product-form').on('submit', function (e) {
        e.preventDefault();

        var selectedOption = $('#delete-product-id').find('option:selected');
        var product_id = selectedOption.val();
        var product_name = selectedOption.text();

        if (!product_id) {
            alert('Выберите товар для удаления!');
            return;
        }

        $.ajax({
            url: '/delete_product',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ product_id: product_id }),
            dataType: 'json',
            success: function (response) {
                if (response.success) {
                    showNotification('Товар <b>' + product_name + '</b> успешно удален!');
                    selectedOption.remove();
                } else {
                    alert('Ошибка: ' + response.error);
                }
            },
            error: function (xhr, status, error) {
                alert('Произошла ошибка при удалении товара: ' + error.message);
            }
        });
    });

    function showNotification(message) {
        $('#notification').html(message).fadeIn(500).delay(3000).fadeOut(500);
    }
});