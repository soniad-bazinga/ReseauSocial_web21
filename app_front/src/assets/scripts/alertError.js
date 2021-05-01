export default alertMessage;

global.jQuery = require("jquery");
var $ = global.jQuery;
window.$ = $;

function alertMessage(mess, code) {
    var alertBox = $("<div class = 'alert-msg' ></div>");
    if (code === "SUCCESS") {
        alertBox.addClass('alert alert-success')
    } else {
        alertBox.addClass('alert alert-danger')
    }
    alertBox.append('<p>' + mess + '</p>');

    $('#alert-box').append(alertBox);
    alertBox.delay(5000).fadeOut(1000, function () {
        alertBox.remove();
    })
}
