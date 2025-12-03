const API_BASE_URL = 'https://bibliotech-backend-s219.onrender.com';

const MY_RENTAS_API_URL = `${API_BASE_URL}/api/prestamos/mis_rentas`;

const tabla = document.getElementById('tablaPrestamos');
const token = localStorage.getItem("authToken");

if (!token) {
    window.location.href = "/login";
}

//Funcion CRUD (Read)
async function fetchRenta() {
    try {
        const response = await fetch(MY_RENTAS_API_URL, {
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

        const data = await response.json();
        if (!response.ok) {
            throw new Error(error.message || 'Error al obtener la lista de prestamos')
        }
        return data
    } catch (error) {
        console.error('Fetch error:', error);
        alert('No se pudieron cargar los préstamos: Error interno del servidor al obtener las rentas.');
        return [];
    }
}

function formatDateForDisplayp(dateString) {
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

//Funcion para mostrar tabla rentas en el html
function renderTabla(rents) {
    tabla.innerHTML = '';

    if (rents.length === 0) {
        tabla.innerHTML = '<tr><td colspan="7" style="text-align: center; color:#999;">Sin préstamos registrados.</td></tr>';
        return;
    }

    rents.forEach(rent => {
        const row = tabla.insertRow();
        const fechaPrestamoA = formatDateForDisplayp(rent.fecha_prestamo);
        const fechaVencimA = formatDateForDisplayp(rent.fecha_vencimiento)
        row.innerHTML = `
        <td>${rent.nombre_usuario} ${rent.apellidos_usuario}</td>
        <td>${rent.nombre_libro}</td>
        <td>${fechaPrestamoA}</td>
        <td>${fechaVencimA}</td>
        <td>${rent.estado}</td>`;
    });
}

async function inicializar() {
    const rentas = await fetchRenta();
    renderTabla(rentas);
}

document.addEventListener('DOMContentLoaded', inicializar);