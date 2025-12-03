//Funcion para manejar el cierre de sesion
function handleLogout() {
  const logoutBtn = document.getElementById("logoutButton");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("authToken");
      alert("Has Cerrado tu sesión.");
      window.location.href = "/login";
    });
  }
}

//Funcion para el permiso del token al usuario
function checkAuthentication() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "/login";
    return false;
  }
  return true;
}

//Funcion para ocultar o mostar botones de login o logout
function toggleAuthButtons() {
  const token = localStorage.getItem("authToken");
  const loginRegisterBtn = document.getElementById("loginButton");
  const logoutBtn = document.getElementById("logoutButton");

  if (loginRegisterBtn && logoutBtn) {
    if (token) {
      loginRegisterBtn.classList.add("hidden");
      logoutBtn.classList.remove("hidden");
    } else {
      loginRegisterBtn.classList.remove("hidden");
      logoutBtn.classList.add("hidden");
    }
  }
}

//Funcion para decodificar el token para mostrar el email de quien esta conectado
function decodeJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error el decodificar JWT:", error);
    return null;
  }
}

//Funcion para mostrar el email de quien esta conectado
function displayUserEmail() {
  const token = localStorage.getItem("authToken");
  const emailDisplayElement = document.getElementById("userEmail");

  if (token) {
    const payload = decodeJwt(token);
    if (payload && payload.email) {
      emailDisplayElement.textContent = `Conectado como: ${payload.email}`;
    } else {
      emailDisplayElement.textContent = "";
    }
  }
}

//Funciones para cargar el documento
document.addEventListener("DOMContentLoaded", () => {
  toggleAuthButtons();
  displayUserEmail();
  const isAuthenticated = checkAuthentication();
  if (isAuthenticated) {
    handleLogout();
  }
});

//CRUD Prestamos(Create) Libros(Read)
const RENTAS_POST_API_URL = "/api/prestamos";
const LIBROS_API_URL = '/api/libros';
const ListaTable = document.querySelector('#listaLibros tbody')
let allLibros = [];

function filterAndRenderLibros(searchTerm) {
  if (!searchTerm) {
    renderLibrosTableClient(allLibros);
    return;
  }

  const lowerCaseSearch = searchTerm.toLowerCase();

  const filteredLibros = allLibros.filter(libro => {
    const nombreMatch = libro.nombre_libro.toLowerCase().includes(lowerCaseSearch);
    const autorMatch = libro.autor.toLowerCase().includes(lowerCaseSearch);
    const editorialMatch = libro.editorial.toLowerCase().includes(lowerCaseSearch);

    return nombreMatch || autorMatch || editorialMatch;
  });

  renderLibrosTableClient(filteredLibros);
}

//Funcion para obter la tabal de libros
async function fetchLibrosClient(token) {
  try {
    const response = await fetch(LIBROS_API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener la lista de libros')
    }
    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    alert(error.message);
    return [];
  }
}

function formatDateForDisplayl(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getDate() + 1).padStart(2, '0');
    const day = String(date.getDay()).padStart(2, '0');

    return `${day}/${month}/${year}`;

  } catch (error) {
    console.error("Error al formatear la fecha:", e);
    return dateString;
  }
}

//Funcion para mostrar la tabla de libros en el html
function renderLibrosTableClient(books) {
  ListaTable.innerHTML = '';

  books.forEach(book => {
    const row = ListaTable.insertRow();
    const fechaAdaptada = formatDateForDisplayl(book.fecha_publicacion);
    row.innerHTML = `
        <td>${book.id_libro}</td>
        <td>${book.nombre_libro}</td>
        <td>${book.autor}</td>
        <td>${book.editorial}</td>
        <td>${fechaAdaptada}</td>
        <td>${book.estado}</td>`;
  });
}

async function verificarLibroExiste(libroId, token) {
  if (!libroId) return false;
  try {
    const response = await fetch(`${LIBROS_API_URL}/${libroId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 404) {
      return false;
    }
    if (!response.ok) {
      console.warn(`Error al verificar libro ID ${libroId}: ${response.status}`);
      return false;
    }

    return true;

  } catch (error) {
    console.error("Error de conexión al verificar el libro:", error);
    alert("Error de conexión: No se pudo verificar la existencia del libro.");
    return false;
  }
}

document.getElementById('prestamoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('authToken');

  const libroId = e.target.Idlibro.value;

  const data = {
    libroId: libroId,
    fechaPrestamo: e.target.fechaPrestamo.value,
  }

  const libroExiste = await verificarLibroExiste(libroId, token);

  if (!libroExiste) {
    alert(`El ID de libro (${libroId}) ingresado no existe en el sistema. Por favor, ingrese un ID correcto.`);
    e.target.Idlibro.focus();
    return;
  }

  try {
    const res = await fetch(`${RENTAS_POST_API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();

    if (!res.ok) {
      if (res.status === 403) {
        alert('Su sesión ha expirado. Por favor, inicie sesión de nuevo.');
        localStorage.removeItem("authToken");
        window.location.href = "/login";
        return;
      }
      throw new Error(result.message || 'Error al crear el prestamo');
    }

    alert('¡Libro reservado! Puede pasar tu libro el dia del prestamo')
    e.target.reset();

  } catch (error) {
    console.error('Error de conexion', error);

  }
});

async function inicializarClient() {
  const token = localStorage.getItem('authToken');
  allLibros = await fetchLibrosClient(token);
  renderLibrosTableClient(allLibros);
  const searchInput = document.getElementById('searchInputLibros');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      // Llamamos a la función de filtrado cada vez que el usuario escribe
      filterAndRenderLibros(e.target.value);
    });
  }
}

document.addEventListener('DOMContentLoaded', inicializarClient);

