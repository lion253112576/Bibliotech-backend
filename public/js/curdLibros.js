const LIBROS_API_URL = '/api/libros';

const librosTableBody = document.querySelector('#librosTable tbody');
const addBookModal = document.getElementById('editBookModal');
const addBookForm = document.getElementById('editBookForm');
const bookIdInput = document.getElementById('editBookId');
const bookModalTitle = document.querySelector('#editBookModal h2');

//Funciones CRUD (Read)
async function fetchLibros(token) {
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

//Funcion para mostrar la tabla de libros en el html
function renderLibrosTable(books) {
    librosTableBody.innerHTML = '';

    books.forEach(book => {
        const row = librosTableBody.insertRow();
        const fechaAdaptada = formatDateForDisplay(book.fecha_publicacion);
        row.innerHTML = `
        <td>${book.id_libro}</td>
        <td>${book.nombre_libro}</td>
        <td>${book.autor}</td>
        <td>${book.editorial}</td>
        <td>${fechaAdaptada}</td>
        <td>${book.estado}</td>
        <td>
                <button class="btn-edit-book" data-id="${book.id_libro}">Editar</button>
                <button class="btn-delete-book" data-id="${book.id_libro}">Eliminar</button>
        </td>`;
    });
}

//Funciones Delete
async function handleDeleteBook(bookId, token) {
    if (!window.confirm(`Estas seguro de eliminar el libro con ID ${bookId}?`)) return;
    try {
        const response = await fetch(`${LIBROS_API_URL}/${bookId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `Error al eliminar el libro: ${bookId}`);
        }
        alert(result.message);
        loadAdminDashboard();
    } catch (error) {
        console.error('Delete error:', error);
        alert(error.message)
    }
}

//Funcion CRUD (Create)
function handleAddBook() {
    addBookForm.reset();
    bookModalTitle.textContent = 'Agregar Nuevo Libro';

    bookIdInput.value = '';
    addBookModal.showModal();
}

//Funcion CRUD (Update)
async function handleEditBook(bookId, token) {
    try {
        const response = await fetch(`${LIBROS_API_URL}/${bookId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al cargar datos del libro');
        }

        const bookData = await response.json();
        const fieldMapping = {
            id_libro: 'editBookId',
            nombre_libro: 'editNombreLib',
            fecha_publicacion: 'editFecha',
            estado: 'editEstado',
            editorial: 'editEditorial',
            autor: 'editAutor',
        };

        for (const dbKey in bookData) {
            const inputId = fieldMapping[dbKey];
            if (inputId) {
                let valueToSet = bookData[dbKey];
                if (dbKey === 'fecha_publicacion' && valueToSet) {
                    const dateObject = new Date(valueToSet);
                    valueToSet = dateObject.toISOString().split('T')[0];
                }
                document.getElementById(inputId).value = valueToSet;
            }
        }
        addBookForm.setAttribute('data-mode', 'PUT');
        addBookModal.showModal();
    } catch (error) {
        console.error('Error al querer editar el libro', error);
        alert(`Error al iniciar la edicion: ${error.message}`);
    }
}

addBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    const bookId = bookIdInput.value
    const method = bookId ? 'PUT' : 'POST';
    const url = bookId ? `${LIBROS_API_URL}/${bookId}` : LIBROS_API_URL;

    const data = {
        nombreLibro: e.target.editNombreLib.value,
        fechaPubliccion: e.target.editFecha.value,
        estado: e.target.editEstado.value,
        editorial: e.target.editEditorial.value,
        autor: e.target.editAutor.value
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
            throw new Error(result.message || `Error al ${method === 'POST' ? 'crear' : 'actualizar'} el libro`);
        }

        alert(`Libro ${method === 'POST' ? 'creado' : 'actualizado'} correctamente.`);
        addBookModal.close();
        loadAdminDashboard();
    } catch (error) {
        console.error('Error en la operacion: ', error);
        alert(`Error en la operacion: ${error.message}`)
    }
});

//Logica Botones
document.addEventListener('click', (e) => {
    const token = localStorage.getItem('authToken');

    if (e.target.classList.contains('btn-delete-book')) {
        const bookId = e.target.getAttribute('data-id');
        handleDeleteBook(bookId, token);
    } else if (e.target.classList.contains('btn-edit-book')) {
        const bookId = e.target.getAttribute('data-id');
        handleEditBook(bookId, token);
    } else if (e.target.id === 'btnAddBook') {
        handleAddBook();
    }
});

//Cargar el dashboard al iniciar la página
document.addEventListener('DOMContentLoaded', loadAdminDashboard);