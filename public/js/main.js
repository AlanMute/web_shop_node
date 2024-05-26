document.querySelector('.close-info').addEventListener('click', function () {
    document.getElementById('infoBlock').style.display = 'none';
});

document.querySelector('.products').addEventListener('click', function (e) {
    if (e.target.tagName === 'IMG' && e.target.closest('.product')) {
        var productBlock = e.target.closest('.product');
        var productId = productBlock.querySelector('input[name="product_id"]').value;
        var product = productsData.find(p => p.ProductID == productId);
        document.getElementById('modalImage').src = product.Image;
        document.getElementById('modalName').textContent = product.Name;
        document.getElementById('modalPrice').textContent = `Цена: ${product.Price} руб.`;
        document.getElementById('modalDescription').textContent = product.Description;

        document.getElementById('productModal').style.display = 'flex';
    }
});

document.querySelector('.close').addEventListener('click', function () {
    document.getElementById('productModal').style.display = 'none';
});


$(document).on('submit', '.search-bar form', function (e) {
    e.preventDefault();

    const form = $(this);
    const searchQuery = $('input[name="search"]').val().toLowerCase();
    const filteredProducts = productsData.filter(product => product.Name.toLowerCase().includes(searchQuery) || product.Description.toLowerCase().includes(searchQuery));
    const isAdmin = form.data('is-admin');

    updateProductList(filteredProducts, isAdmin);
});

function updateProductList(products, isAdmin) {
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

$(document).on('submit', 'form[name="add_to_cart_form"]', function (e) {
    e.preventDefault();

    const form = $(this);
    const formData = form.serialize();

    $.ajax({
        url: '/cart/add',
        method: 'POST',
        data: formData,
        success: function (response) {
            if (response.success) {
                $('.cart a').text(`Корзина: ${response.cartCount} товаров`);

                const quantityInput = form.find('input[name="quantity"]');
                const remainingCount = response.remainingCount;

                if (remainingCount <= 0) {
                    form.closest('.product').find('p:contains("Осталось:")').replaceWith('<p><strong>НЕТ В НАЛИЧИИ</strong></p>');
                    form.remove();
                } else {
                    form.closest('.product').find('p:contains("Осталось:")').text(`Осталось: ${remainingCount} шт.`);

                    const currentQuantity = parseInt(quantityInput.val(), 10);
                    if (currentQuantity > remainingCount) {
                        quantityInput.val(remainingCount);
                    }
                    quantityInput.attr('max', remainingCount);
                }

                const productID = form.find('input[name="product_id"]').val();
                const productToUpdate = productsData.find(p => p.ProductID == productID);
                if (productToUpdate) {
                    productToUpdate.Count = remainingCount;
                }
            } else {
                window.location.href = response.redirect;
            }
        },
        error: function (error) {
            alert(error);
        }
    });
});

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

$('input[name="quantity"]').on('input', function () {
    var inputValue = $(this).val();
    var addButton = $(this).closest('form').find('button[name="add_to_cart"]');

    if (!inputValue || inputValue == 0) {
        addButton.prop('disabled', true);
    } else {
        addButton.prop('disabled', false);
    }
});
