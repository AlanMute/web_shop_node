$(document).ready(function() {
    $('#email, #subject, #message').on('input', function() {
        const emailValid = $('#email')[0].checkValidity();
        const subjectValid = $('#subject')[0].checkValidity();
        const messageValid = $('#message')[0].checkValidity();
        
        if (emailValid && subjectValid && messageValid) {
            $('#submit-btn').prop('disabled', false);
        } else {
            $('#submit-btn').prop('disabled', true);
        }
    });

    $('#feedback-form').submit(function(event) {
        event.preventDefault();
        const formData = $(this).serialize();
        
        $.ajax({
            type: 'POST',
            url: '/feedback/send',
            data: formData,
            success: function(response) {
                alert('Сообщение успешно отправлено!');
                $('#email, #subject, #message').val('');
            },
            error: function(error) {
                alert('Произошла ошибка при отправке сообщения: ' + error);
            }
        });
    });
});

