const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const toggleLink = document.getElementById("toggleLink");
const toggleMessage = document.getElementById("toggleMessage");
const formTitle = document.getElementById("formTitle");
const API_BASE_URL = 'https://bibliotech-backend-s219.onrender.com';



// CAMBIO ENTRE LOGIN / REGISTRO
toggleLink.addEventListener("click", (e) => {
  e.preventDefault();

  const isRegisterHidden = registerForm.classList.contains("hidden");

  if (isRegisterHidden) {
    // Mostrar REGISTRO
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");

    formTitle.textContent = "Crear Cuenta";
    toggleMessage.textContent = "¿Ya tienes una cuenta?";
    toggleLink.textContent = "Inicia sesión";

  } else {
    // Mostrar LOGIN
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");

    formTitle.textContent = "Iniciar Sesión";
    toggleMessage.textContent = "¿No tienes cuenta?";
    toggleLink.textContent = "Regístrate aquí";
  }
});

//FUNCIONALIDAD REGISTRO
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    nombre: e.target.name.value,
    apellidos: e.target.lastname.value,
    correo: e.target.email.value,
    password: e.target.password.value,
    direccion: e.target.address.value,
    referencia: e.target.referencia.value,
    numero: e.target.number.value,
  }
  try {
    const res = await fetch(`${API_BASE_URL}/api/usuarios/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok) {
      alert('Registro exitoso: ' + result.message);
    } else {
      alert('Error en el registro: ' + result.error);
    }
    e.target.reset();
  } catch (error) {
    console.error('Error de conexion', error);

  }
});

//FUNCIONALIDAD INICIO SESION
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const login = {
    correo: e.target.correo.value,
    password: e.target.contra.value
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/usuarios/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(login)
    });
    const resultado = await response.json();
    if (response.ok) {
      localStorage.setItem('authToken', resultado.token);

      const payload = decodeJwt(resultado.token);
      if(payload && payload.rol === 'admin'){
        alert('Bienvenido Administrador!')
        window.location.href = '/admin';
      } else {
        alert('Inicio de sesion existoso!')
        window.location.href = '/bibliotech'
      }
    } else {
      alert('Error de inicio: ' + resultado.message);
    }
  } catch (error) {
    console.error('Error de conexión:', error);
  }
})

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}
