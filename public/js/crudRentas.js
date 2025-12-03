const RENTAS_API_URL = '/api/prestamos';
const ADMIN_RENTAS_API_URL = '/api/prestamos';

const rentasTableBody = document.querySelector('#prestamosTable tbody');
const addRentModal = document.getElementById('editRentaModal');
const addRentForm = document.getElementById('editRentaForm');
const rentIdInput = document.getElementById('editRentaId');
const rentModalTitle = document.querySelector('#editRentaModal h2');
const campoUsuarioId = document.getElementById('campoUserId');
const inputUserId = document.getElementById('editUsuarioRen');
const campoLibroId = document.getElementById('campoLibroId');
const inputLibroId = document.getElementById('editLibroRen');
const campoPrestamo = document.getElementById('campoPrestamo');
const inputPrestamo = document.getElementById('editFechaRen');



//Funcion CRUD (Read)
async function fetchRent(token) {
    try {
        const response = await fetch(RENTAS_API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al obtener la lista de prestamos')
        }
        return response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        alert(error.message);
        return [];
    }
}

//Funcion para mostrar tabla rentas en el html
function renderRentTable(rents) {
    rentasTableBody.innerHTML = '';

    rents.forEach(rent => {
        const row = rentasTableBody.insertRow();
        const fechaPrestamoAdap = formatDateForDisplay(rent.fecha_prestamo);
        const fechaVencimAdap = formatDateForDisplay(rent.fecha_vencimiento)
        row.innerHTML = `
        <td>${rent.id_renta}</td>
        <td>${rent.nombre_usuario} ${rent.apellidos_usuario}</td>
        <td>${rent.nombre_libro}</td>
        <td>${fechaPrestamoAdap}</td>
        <td>${fechaVencimAdap}</td>
        <td>${rent.estado}</td>
        <td>
                <button class="btn-edit-rent" data-id="${rent.id_renta}">Editar</button>
                <button class="btn-delete-rent" data-id="${rent.id_renta}">Eliminar</button>
        </td>`;
    });
}

//Funcion CRUD (Delete)
async function handleDeleteRent(rentaId, token) {
    if (!window.confirm(`¿Estás seguro de eliminar la renta con ID ${rentaId}?`)) return;
    try {
        const response = await fetch(`${RENTAS_API_URL}/${rentaId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `Error al eliminar la renta: ${rentaId}`);
        }
        alert('Renta eliminada correctamente.');
        loadAdminDashboard();
    } catch (error) {
        console.error('Delete error (Rentas):', error);
        alert(error.message);
    }
}

//Funcion CRUD (Create)
function handleAddRent() {
    addRentForm.reset();
    rentModalTitle.textContent = 'Agregar Nuevo Prestamo';

    campoUsuarioId.style.display = 'grid';
    inputUserId.setAttribute('required', 'required');

    campoLibroId.style.display = 'grid';
    inputLibroId.setAttribute('required', 'required');

    campoPrestamo.style.display = 'grid';
    inputPrestamo.setAttribute('required', 'required');

    rentIdInput.value = '';
    addRentModal.showModal();
}

//Funcion CRUD (Update)
async function handleEditRent(retaId, token) {
    try {
        const response = await fetch(`${RENTAS_API_URL}/${retaId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al cargar datos del prestamo');
        }

        const rentData = await response.json();
        const fieldMapping = {
            id_renta: 'editRentaId',
            fecha_vencimiento: 'editFechaVenc',
            estado: 'editEstadoRent',
        };

        for (const dbKey in rentData) {
            const inputId = fieldMapping[dbKey];
            if (inputId) {
                let valueToSet = rentData[dbKey];
                if (dbKey === 'fecha_publicacion' && valueToSet) {
                    const dateObject = new Date(valueToSet);
                    valueToSet = dateObject.toISOString().split('T')[0];
                }
                document.getElementById(inputId).value = valueToSet;
            }
        }

        campoUsuarioId.style.display = 'none';
        inputUserId.removeAttribute('required');
        campoLibroId.style.display = 'none';
        inputLibroId.removeAttribute('required');
        campoPrestamo.style.display = 'none';
        inputPrestamo.removeAttribute('required');

        addRentForm.setAttribute('data-mode', 'PUT');
        addRentModal.showModal();

    } catch (error) {
        console.error('Error al querer editar el prestamo', error);
        alert(`Error al iniciar la edicion: ${error.message}`);
    }
}

addRentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    const rentId = rentIdInput.value;
    const method = rentId ? 'PUT' : 'POST';
    const url = rentId ? `${RENTAS_API_URL}/${rentId}` : ADMIN_RENTAS_API_URL;

    const data = {
        fechaVencimiento: e.target.editFechaVenc.value,
        estado: e.target.editEstadoRent.value
    }

    if (method === 'POST') {
        data.usuarioId = parseInt(e.target.editUsuarioRen.value, 10);
        data.libroId = parseInt(e.target.editLibroRen.value, 10);
        data.fechaPrestamo = e.target.editFechaRen.value;

        if (isNaN(data.usuarioId) || isNaN(data.libroId)) {
            alert('Error: El ID de Usuario o ID de Libro debe ser un número válido.');
            return;
        }
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

        const result = await res.json();
        if (!res.ok) {
            throw new Error(result.message || `Error al ${method === 'POST' ? 'crear' : 'actualizar'} el Prestamo`);
        }

        alert(`Prestamo ${method === 'POST' ? 'creado' : 'actualizado'} correctamente.`);
        addRentModal.close();
        loadAdminDashboard();

    } catch (error) {
        console.error('Error en la operacion: ', error);
        alert(`Error en la operacion: ${error.message}`)
    }
});

document.addEventListener('click', (e) => {
    const token = localStorage.getItem('authToken');

    if (e.target.classList.contains('btn-delete-rent')) {
        const userId = e.target.getAttribute('data-id');
        handleDeleteRent(userId, token);
    } else if (e.target.classList.contains('btn-edit-rent')) {
        const userId = e.target.getAttribute('data-id');
        handleEditRent(userId, token);
    } else if (e.target.id === 'btnAddRent') {
        handleAddRent();
    }
});