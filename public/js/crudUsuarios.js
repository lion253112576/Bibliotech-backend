const API_URL = '/api/usuarios';
const JWT_SECRET = '_B1Bl0t3ch_$94';

//Funcion decodificacion de token 
function decodeJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

//Funcion de Check para administrador
function checkAdminAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login';
        return false;
    }

    const payload = decodeJwt(token);
    if (!payload || payload.rol !== 'admin') {
        alert('Acceso denegado. No eres administrador.');
        window.location.href = '/bibliotech';
        return false;
    }

    return token;
}

//Funciones de CRUD (Read)
async function fetchUsers(token) {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 403) {
            alert('Su sesión ha expirado o no tiene acceso. Por favor, inicie sesión de nuevo.');
            localStorage.removeItem("authToken");
            window.location.href = "/login";
            return [];
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al obtener la lista de clientes')
        }
        return response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        alert(error.message);
        return [];
    }
}

function renderUserTable(users) {
    const tbody = document.querySelector('#clientesTable tbody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const row = tbody.insertRow();
        row.innerHTML = `
        <td>${user.id_usuario}</td>
        <td>${user.nombre}</td>
        <td>${user.apellidos}</td>
        <td>${user.correo}</td>
        <td>${user.direccion}</td>
        <td>${user.referencia}</td>
        <td>${user.num_telefono}</td>
        <td>${user.rol}</td>
        <td>
                <button class="btn-edit" data-id="${user.id_usuario}">Editar</button>
                <button class="btn-delete" data-id="${user.id_usuario}">Eliminar</button>
        </td>`;
    });
}

//Funcion CRUD (Delete)
async function handleDelete(userId, token) {
    if (!window.confirm(`Estas seguro de eliminar al usuario con ID ${userId}?`)) return;
    try {
        const response = await fetch(`${API_URL}/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `Error al eliminar al usuario: ${userId}`);
        }
        alert(result.message);
        loadAdminDashboard();
    } catch (error) {
        console.error('Delete error:', error);
        alert(error.message)
    }
}

//Funciones para CRUD (UPDATE / CREATE)
const editUserModal = document.getElementById('editUserModal');
const editUserForm = document.getElementById('editUserForm');
const userModalTitle = document.querySelector('#editUserModal h2');
const userIdInput = document.getElementById('editUserId');
const campoEmail = document.getElementById('campoEmail');
const inputEmail = document.getElementById('editCorreo');
const campoPassword = document.getElementById('campoPassword');
const inputPassword = document.getElementById('editPassword');

//Create
function handleAdd() {
    editUserForm.reset();
    userModalTitle.textContent = 'Agregar Nuevo Usuario';

    campoEmail.style.display = 'grid';
    inputEmail.setAttribute('required', 'required');

    campoPassword.style.display = 'grid';
    inputPassword.setAttribute('required', 'required');

    userIdInput.value = '';
    editUserModal.showModal();
}

//Update
async function handleEdit(userId, token) {
    try {
        const response = await fetch(`${API_URL}/${userId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al cargar datos del usuario');
        }

        const userData = await response.json();
        const fieldMapping = {
            id_usuario: 'editUserId',
            nombre: 'editNombre',
            apellidos: 'editApellidos',
            direccion: 'editDireccion',
            referencia: 'editReferencia',
            num_telefono: 'editTelefono',
            rol: 'editRol'
        };

        for (const key in fieldMapping) {
            if (Object.hasOwnProperty.call(userData, key)) {
                const inputId = fieldMapping[key];
                document.getElementById(inputId).value = userData[key];
            }
        }

        campoEmail.style.display = 'none';
        inputEmail.removeAttribute('required');

        campoPassword.style.display = 'none';
        inputPassword.removeAttribute('required');

        userModalTitle.textContent = 'Editar Usuario';
        editUserModal.showModal();

    } catch (error) {
        console.error('Error al querer editar el usuario', error);
        alert(`Error al iniciar la edicion: ${error.message}`);
    }
}

editUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    const userId = userIdInput.value
    const method = userId ? 'PUT' : 'POST';
    const url = userId ? `${API_URL}/${userId}` : API_URL;

    const data = {
        nombre: e.target.editNombre.value,
        apellidos: e.target.editApellidos.value,
        direccion: e.target.editDireccion.value,
        referencia: e.target.editReferencia.value,
        numero: e.target.editTelefono.value,
        rol: e.target.editRol.value
    }

    if (method === 'POST') {
        data.correo = e.target.editCorreo.value;
        data.password = e.target.editPassword.value;
    }

    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = res.json();

        if (!res.ok) {
            throw new Error(result.message || `Error al ${method === 'POST' ? 'crear' : 'actualizar'} el usuario`);
        }

        alert(`Usuario ${method === 'POST' ? 'creado' : 'actualizado'} correctamente.`);
        editUserModal.close();
        loadAdminDashboard();
    } catch (error) {
        console.error('Error en la operacion: ', error);
        alert(`Error en la operacion: ${error.message}`)
    }

});

//logica botones de acciones
document.addEventListener('click', (e) => {
    const token = localStorage.getItem('authToken');

    if (e.target.classList.contains('btn-delete')) {
        const userId = e.target.getAttribute('data-id');
        handleDelete(userId, token);
    } else if (e.target.classList.contains('btn-edit')) {
        const userId = e.target.getAttribute('data-id');
        handleEdit(userId, token);
    } else if (e.target.id === 'btnAddUser') {
        handleAdd();
    }
});

//Cargar el dashboard al iniciar la página
document.addEventListener('DOMContentLoaded', loadAdminDashboard);