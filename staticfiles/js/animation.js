function showMessage() {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = 'Hello from Django!';
    setTimeout(() => {
        messageDiv.textContent = '';
    }, 2000);
}