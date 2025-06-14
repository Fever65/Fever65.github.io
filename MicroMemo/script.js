// script.js

// Custom Firebase error messages
const FIREBASE_ERROR_MESSAGES = {
  'auth/invalid-login-credentials': 'Identifiant incorrect.',
  'auth/invalid-email': 'Adresse e-mail invalide.',
  'auth/user-disabled': 'Ce compte a été désactivé.',
  'auth/user-not-found': 'Aucun compte trouvé avec cet email.',
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/email-already-in-use': 'Cet email est déjà utilisé.',
  'auth/weak-password': 'Le mot de passe est trop faible (min. 6 caractères).',
  'auth/requires-recent-login': 'Veuillez vous reconnecter pour changer le mot de passe.',
};

function showError(containerId, error) {
  const el = document.getElementById(containerId);
  const msg = FIREBASE_ERROR_MESSAGES[error.code] || error.message;
  el.textContent = msg;
}

function showSuccess(containerId, message) {
  const el = document.getElementById(containerId);
  el.textContent = message;
}

document.addEventListener('DOMContentLoaded', function() {
  // Login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      showError('error', { code: '', message: '' });
      showSuccess('success', '');
      const email = loginForm.email.value;
      const pwd = loginForm.password.value;
      firebase.auth().signInWithEmailAndPassword(email, pwd)
        .then(() => window.location.href = 'dashboard.html')
        .catch(err => showError('error', err));
    });
  }

  // Register
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', e => {
      e.preventDefault();
      showError('error', { code: '', message: '' });
      showSuccess('success', '');
      const email = registerForm.email.value;
      const pwd = registerForm.password.value;
      firebase.auth().createUserWithEmailAndPassword(email, pwd)
        .then(() => showSuccess('success', 'Compte créé avec succès.'))
        .catch(err => showError('error', err));
    });
  }

  // Forgot Password
  const resetForm = document.getElementById('resetForm');
  if (resetForm) {
    resetForm.addEventListener('submit', e => {
      e.preventDefault();
      showError('error', { code: '', message: '' });
      showSuccess('success', '');
      const email = document.getElementById('resetEmail').value;
      firebase.auth().sendPasswordResetEmail(email)
        .then(() => showSuccess('success', 'Email de réinitialisation envoyé avec succès.'))
        .catch(err => showError('error', err));
    });
  }

  // Change Password
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', e => {
      e.preventDefault();
      showError('error', { code: '', message: '' });
      showSuccess('success', '');
      const newPassword = document.getElementById('newPassword').value;
      firebase.auth().currentUser.updatePassword(newPassword)
        .then(() => {
          showSuccess('success', '✅ Mot de passe changé avec succès. Redirection...');
          setTimeout(() => window.location.href = 'dashboard.html', 1500);
        })
        .catch(err => showError('error', err));
    });
  }

  // Delete Account
  const deleteBtn = document.getElementById('deleteBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      showError('error', { code: '', message: '' });
      showSuccess('success', '');
      if (confirm('Es-tu sûr de vouloir supprimer ton compte ?')) {
        firebase.auth().currentUser.delete()
          .then(() => {
            showSuccess('success', '✅ Compte supprimé.');
            setTimeout(() => window.location.href = 'index.html', 1500);
          })
          .catch(err => showError('error', err));
      }
    });
  }

  // Secret Form (Dashboard) - corrected logic
  const secretForm = document.getElementById('secretForm');
  if (secretForm) {
    firebase.auth().onAuthStateChanged(user => {
      if (!user) {
        // redirect to login if not authenticated
        return window.location.href = 'login.html';
      }
      const uid = user.uid;
      const secretField = document.getElementById('secret');
      const errField = document.getElementById('error');
      const okField = document.getElementById('success');

      // Load existing secret
      firebase.firestore()
        .collection('secrets')
        .doc(uid)
        .get()
        .then(doc => {
          if (doc.exists) secretField.value = doc.data().secret;
        })
        .catch(err => showError('error', err));

      // Save on submit, with guaranteed uid
      secretForm.addEventListener('submit', e => {
        e.preventDefault();
        errField.textContent = '';
        okField.textContent = '';
        const secret = secretField.value.trim();
        firebase.firestore()
          .collection('secrets')
          .doc(uid)
          .set({ secret })
          .then(() => showSuccess('success', 'Message enregistré avec succès.'))
          .catch(err => showError('error', err));
      });
    });
  }

  // Logout
  window.logout = () => {
    firebase.auth().signOut().then(() => window.location.href = 'index.html');
  };
});
