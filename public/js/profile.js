$('form[action="/logout"]').on('submit', function(event) {
    event.preventDefault();

    $.ajax({
        url: '/logout-obr',
        method: 'POST',
        success: function(response) {
            window.location.href = '/';
        },
        error: function(xhr, status, error) {
            console.error('Ошибка при выходе:', error);
            alert('Произошла ошибка при выходе.');
        }
    });
});
