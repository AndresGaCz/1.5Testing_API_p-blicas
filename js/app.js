// API URL
const API_URL = 'https://68bb0de784055bce63f1053b.mockapi.io/api/v1/dispositivos_IoT';

// Obtener la IP pública del cliente
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error al obtener la IP:', error);
        return '127.0.0.1'; // IP por defecto en caso de error
    }
}

// Obtener la fecha y hora actual en la zona horaria de la Ciudad de México
function getMexicoCityDateTime() {
    const options = {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    
    const formatter = new Intl.DateTimeFormat('es-MX', options);
    const parts = formatter.formatToParts(new Date());
    
    const dateTime = {};
    parts.forEach(part => {
        dateTime[part.type] = part.value;
    });
    
    return `${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour}:${dateTime.minute}:${dateTime.second}`;
}

// Agregar un nuevo registro
async function addRecord(name, status) {
    try {
        const ip = await getClientIP();
        const date = getMexicoCityDateTime();
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                status: status,
                ip: ip,
                date: date
            })
        });
        
        if (response.ok) {
            const newRecord = await response.json();
            console.log('Registro agregado:', newRecord);
            return true;
        } else {
            console.error('Error al agregar registro:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}

// Obtener los últimos 5 registros
async function getLastFiveRecords() {
    try {
        const response = await fetch(API_URL);
        if (response.ok) {
            const records = await response.json();
            
            // Ordenar por ID de forma descendente y tomar los últimos 5
            const sortedRecords = records.sort((a, b) => b.id - a.id);
            const lastFive = sortedRecords.slice(0, 5);
            
            return lastFive;
        } else {
            console.error('Error al obtener registros:', response.status);
            return [];
        }
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

// Mostrar los últimos 5 registros en la tabla
async function displayLastFiveRecords() {
    const records = await getLastFiveRecords();
    const tableBody = document.getElementById('records-table');
    
    if (records.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay registros disponibles</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    
    records.forEach(record => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${record.id}</td>
            <td>${record.name}</td>
            <td><span class="badge bg-primary">${record.status}</span></td>
            <td>${record.ip}</td>
            <td>${record.date}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Actualizar el estado actual con el último comando
    if (records.length > 0) {
        document.getElementById('current-status').textContent = records[0].status;
    }
}

// Manejar el envío del formulario
document.getElementById('command-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('device-name').value;
    const status = document.getElementById('status').value;
    
    if (!name || !status) {
        alert('Por favor, complete todos los campos');
        return;
    }
    
    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
    
    const success = await addRecord(name, status);
    
    if (success) {
        alert('Comando enviado correctamente');
        document.getElementById('command-form').reset();
        await displayLastFiveRecords();
    } else {
        alert('Error al enviar el comando. Por favor, intente nuevamente.');
    }
    
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Comando';
});

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    displayLastFiveRecords();
    
    // Actualizar los registros cada 30 segundos
    setInterval(displayLastFiveRecords, 30000);
});