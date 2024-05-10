$(document).on('submit', '.search-bar form', function(e) {
    e.preventDefault(); // Предотвращаем стандартное поведение отправки формы

    // Получаем значения из формы
    const form = $(this);
    const searchQuery = form.find('input[name="search"]').val();

    // Отправляем AJAX-запрос на сервер
    $.ajax({
        url: `/search?&query=${searchQuery}`,
        method: 'GET',
        success: function(response) {
            // Обработка ответа от сервера
            updateProductList(response);
        },
        error: function(error) {
            console.error('Ошибка при выполнении запроса:', error);
        }
    });
});

function updateProductList(products) {
    const productsContainer = document.querySelector('.products');

    productsContainer.innerHTML = '';

    if (products.length > 0) {
        products.forEach(product => {
            const productElement = createProductElement(product);
            productsContainer.appendChild(productElement);
        });
    } else {
        productsContainer.innerHTML = '<h1>Ничего нет :(</h1>';
    }
}

function createProductElement(product) {
    const productDiv = document.createElement('div');
    productDiv.classList.add('product');

    productDiv.innerHTML = `
        <img src="${product.Image}" alt="${product.Name}" title="${product.Description}">
        <h3>${product.Name}</h3>
        <p>Цена: ${product.Price} руб.</p>
        ${product.Count > 0 ? `
            <p>Осталось: ${product.Count} шт.</p>
            <form name="add_to_cart_form">
                <input type="hidden" name="product_id" value="${product.ProductID}">
                <input type="number" name="quantity" value="1" min="1" max="${product.Count}" inputmode="numeric" pattern="[0-9]*"><br>
                <button type="submit" class="add_to_cart_pr" name="add_to_cart">Добавить в корзину</button>
            </form>
        ` : `
            <p><strong>НЕТ В НАЛИЧИИ</strong></p>
        `}
    `;

    return productDiv;
}
