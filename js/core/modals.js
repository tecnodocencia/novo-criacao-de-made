// js/core/modals.js
export const modalMethods = {
    closePreviewModal: function() {
        document.getElementById('modal-preview').style.display = 'none';
    },

    showNotification: function(message, title = 'Aviso') {
        document.getElementById('notification-title').innerText = title;
        document.getElementById('notification-message').innerHTML = message;
        document.getElementById('modal-notification').style.display = 'flex';
    },

    closeNotification: function() {
        document.getElementById('modal-notification').style.display = 'none';
    },

    showConfirm: function(title, message, onConfirm) {
        document.getElementById('confirm-title').innerText = title;
        document.getElementById('confirm-message').innerText = message;
        const btn = document.getElementById('confirm-btn-action');
        btn.onclick = () => {
            onConfirm();
            this.closeConfirm();
        };
        document.getElementById('modal-confirm').style.display = 'flex';
    },

    closeConfirm: function() {
        document.getElementById('modal-confirm').style.display = 'none';
    }
};
