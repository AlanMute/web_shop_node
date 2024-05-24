$('form[action="/logout"]').on('submit', function (event) {
    event.preventDefault();

    $.ajax({
        url: '/logout-obr',
        method: 'POST',
        success: function (response) {
            window.location.href = '/';
        },
        error: function (xhr, status, error) {
            console.error('Ошибка при выходе:', error);
            alert('Произошла ошибка при выходе.');
        }
    });
});

$(document).ready(function () {
    $('#btn-add-feedbacks').click(function () {
        if ($(this).text().includes('жалобы')) {
            $('.feedbacks').toggle();
        } else {
            $('.feedback-container').toggle();
        }
    });

    $('#btn-view-feedbacks').click(function () {
        $('.feedbacks').show();

        $.ajax({
            url: '/get-all-feedback',
            type: 'GET',
            dataType: 'json',
            success: function (feedbacks) {
                var feedbacksBody = $('#feedbacks-body');
                feedbacksBody.empty();

                feedbacks.forEach(function (feedback) {
                    var formattedDate = formatDate(feedback.CreatedAt);
                    feedbacksBody.append(`
                        <tr>
                            <td>${feedback.Email}</td>
                            <td>${feedback.Subject}</td>
                            <td>${feedback.Message}</td>
                            <td>${formattedDate}</td>
                            <td><button class="delete-feedback" data-id="${feedback.FeedbackID}" data-sbj="${feedback.Subject}">Удалить</button></td>
                        </tr>
                    `);
                });
            },
            error: function (xhr, status, error) {
                console.error('Ошибка при загрузке фидбеков:', error);
            }
        });
    });

    function formatDate(dateString) {
        var date = new Date(dateString);
        var options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('ru-RU', options);
    }

    $(document).on('click', '.delete-feedback', function () {
        var feedbackId = $(this).data('id');
        var feedbackSbj = $(this).data('sbj');

        $.ajax({
            url: '/del-feedback',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ feedbackId: feedbackId }),
            dataType: 'json',
            success: function (response) {
                if (response.success) {
                    showNotification("Жалоба \"" + feedbackSbj + "\" была удалена успешно!");
                    $('button[data-id="' + feedbackId + '"]').closest('tr').remove();
                } else {
                    alert('Ошибка: ' + response.error);
                }
            },
            error: function (xhr, status, error) {
                alert('Произошла ошибка при удалении фидбека: ' + error);
            }
        });
    });

    $('#feedback-form').on('submit', function(e) {
        e.preventDefault();

        var formData = {
            email: $('#email').val(),
            subject: $('#subject').val(),
            message: $('#message').val()
        };

        $.ajax({
            url: '/feedback/send',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    showNotification("Жалоба была отправлена успешно!");
                    $('#feedback-form')[0].reset();
                } else {
                    alert('Ошибка: ' + response.error);
                }
            },
            error: function(xhr, status, error) {
                alert('Произошла ошибка при отправке обратной связи: ' + error);
            }
        });
    });

    function showNotification(message) {
        $('#notification').html(message).fadeIn(500).delay(3000).fadeOut(500);
    }

});
