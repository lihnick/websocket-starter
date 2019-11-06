
let socket;

document.forms.user.onsubmit = function () {
    console.log(this.name.value);
    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: this.name.value }),
        credentials: 'same-origin'
    })
    .then(res => {
        this.style.display = "none";
        document.forms.message.style.display = "inherit";
        console.log(res);
        initSocket();
    })
    .catch(err => console.log(err))
    return false;
}
document.forms.message.onsubmit = function () {
    socket.send(this.chatbox.value);
    this.chatbox.value = "";
    return false;
}

function initSocket() {
    socket = new WebSocket(`ws://${location.host}/ws`);
    socket.onopen = event => console.log(`Websocket connection established`);
    socket.onmessage = function (event) {
        showMessage(event.data);
    }
    socket.onclose = event => console.log(`Connection Closed: ${event.code}`);
    socket.onerror = event => console.log(`error: ${error}`);
}

function showMessage(data) {
    let { user, msg } = JSON.parse(data);
    let msgElm = document.createElement('div');
    msgElm.textContent = `${user}: ${msg}`;
    document.getElementById('messages').prepend(msgElm);
}