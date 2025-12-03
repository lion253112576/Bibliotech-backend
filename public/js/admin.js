document.getElementById('showSidebar').addEventListener('click', () =>{
    document.getElementById('sidebar').style.display = 'block';
});

document.getElementById('closeSidebar').addEventListener('click', () =>{
    document.getElementById('sidebar').style.display = 'none';
});

function actualizarContadores(users, books, rents) {
    document.getElementById("countLibros").textContent = books.length;

    document.getElementById("countUsuarios").textContent = users.length;

    document.getElementById("countActivos").textContent = rents.length;

}

document.getElementById("modoBtn").addEventListener("click", () => {
    document.body.classList.toggle("dark");

    document.getElementById("modoBtn").textContent =
        document.body.classList.contains("dark")
            ? "☀️ Modo claro"
            : "🌙 Modo oscuro";
});

//Funcion para convertir el date de postgreSQL
function formatDateForDisplay(dateString) {
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

async function loadAdminDashboard() {
    const token = checkAdminAuth();
    if (!token) return;
    const users = await fetchUsers(token);
    const books = await fetchLibros(token);
    const rents = await fetchRent(token);
    renderUserTable(users);
    renderLibrosTable(books);
    renderRentTable(rents);
    actualizarContadores(users, books, rents);
}

document.addEventListener('DOMContentLoaded', loadAdminDashboard);

//logica logout 
document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
});
