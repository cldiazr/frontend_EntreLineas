const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin({ email, password }) {
  const errors = {};

  if (!email || email.trim() === "") {
    errors.email = "El email es requerido";
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = "Email inválido";
  }

  if (!password) {
    errors.password = "La contraseña es requerida";
  } else if (password.length < 6) {
    errors.password = "La contraseña debe tener al menos 6 caracteres";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
