// API URL
const API_URL = 'https://68bb0de784055bce63f1053b.mockapi.io/api/v1/dispositivos_IoT';

// Variables globales
let allRecords = [];
let updateInterval;
let commandChart;

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Función de inicialización
function initializeApp() {
    // Mostrar alerta de tiempo real
    setTimeout(() => {
        const alert = document.getElementById('realtime-alert');
        alert.classList.remove('d-none');
    }, 1000);
    
    // Cargar datos iniciales
    loadData();
    
    // Configurar el interruptor de tiempo real
    document.getElementById('realtime-toggle').addEventListener('change', function() {
        if (this.checked) {
            startRealtimeUpdates();
            showNotification('Monitoreo en tiempo real activado', 'success');
        } else {
            stopRealtimeUpdates();
            showNotification('Monitoreo en tiempo real desactivado', 'info');
        }
    });
    
    // Iniciar actualizaciones automáticas
    startRealtimeUpdates();
    
    // Actualizar la hora actual periódicamente
    setInterval(updateCurrentTime, 1000);
}

// Cargar datos desde la API
async function loadData() {
    try {
        showLoadingState();
        
        const response = await fetch(API_URL);
        if (response.ok) {
            allRecords = await response.json();
            
            // Ordenar por ID de forma descendente
            allRecords.sort((a, b) => b.id - a.id);
            
            // Actualizar la interfaz
            updateDisplay();
            updateStatistics();
        } else {
            throw new Error('Error al cargar datos: ' + response.status);
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorState();
    }
}

// Mostrar estado de carga
function showLoadingState() {
    const tableBody = document.getElementById('records-table');
    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Cargando registros...</p>
            </td>
        </tr>
    `;
}

// Mostrar estado de error
function showErrorState() {
    const tableBody = document.getElementById('records-table');
    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-4 text-danger">
                <i class="fa-solid fa-triangle-exclamation fa-2x mb-2"></i>
                <p>Error al cargar los datos. Intentando nuevamente...</p>
            </td>
        </tr>
    `;
    
    // Reintentar después de 5 segundos
    setTimeout(loadData, 5000);
}

// Actualizar la visualización de datos
function updateDisplay() {
    const lastTenRecords = allRecords.slice(0, 10);
    const tableBody = document.getElementById('records-table');
    
    if (lastTenRecords.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay registros disponibles</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    
    lastTenRecords.forEach(record => {
        const row = document.createElement('tr');
        
        // Determinar la clase CSS basada en el comando
        let commandClass = '';
        if (record.status.includes('ADELANTE')) commandClass = 'command-ADELANTE';
        else if (record.status.includes('ATRAS')) commandClass = 'command-ATRAS';
        else if (record.status === 'DETENER') commandClass = 'command-DETENER';
        else if (record.status.includes('GIRO')) commandClass = 'command-GIRO';
        
        row.className = commandClass;
        
        // Formatear la fecha para mejor legibilidad
        const formattedDate = formatDateTime(record.date);
        
        row.innerHTML = `
            <td>${record.id}</td>
            <td>${record.name}</td>
            <td><span class="badge bg-primary badge-status">${record.status}</span></td>
            <td>${record.ip}</td>
            <td>${formattedDate}</td>
            <td>
                <button class="btn btn-sm btn-outline-info view-details" data-id="${record.id}">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Añadir event listeners a los botones de detalles
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function() {
            const recordId = this.getAttribute('data-id');
            viewRecordDetails(recordId);
        });
    });
    
    // Actualizar indicadores
    updateIndicators();
    
    // Parpadeo para indicar actualización
    const indicator = document.getElementById('update-indicator');
    indicator.classList.add('realtime-pulse');
    setTimeout(() => indicator.classList.remove('realtime-pulse'), 1000);
}

// Formatear fecha y hora para mejor legibilidad
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(date);
}

// Actualizar indicadores de estado
function updateIndicators() {
    // Contar dispositivos únicos
    const uniqueDevices = new Set(allRecords.map(record => record.name));
    document.getElementById('active-devices').textContent = uniqueDevices.size;
    
    // Total de comandos
    document.getElementById('total-commands').textContent = allRecords.length;
    
    // Actualizar hora de última actualización
    updateCurrentTime();
}

// Actualizar la hora actual
function updateCurrentTime() {
    const now = new Date();
    document.getElementById('last-update').textContent = 
        now.toLocaleTimeString('es-MX');
}

// Actualizar estadísticas
function updateStatistics() {
    // Contar la frecuencia de cada comando
    const commandCounts = {};
    allRecords.forEach(record => {
        commandCounts[record.status] = (commandCounts[record.status] || 0) + 1;
    });
    
    // Actualizar la lista de estadísticas
    const statsContainer = document.getElementById('command-stats');
    statsContainer.innerHTML = '';
    
    // Ordenar comandos por frecuencia (mayor a menor)
    const sortedCommands = Object.entries(commandCounts)
        .sort((a, b) => b[1] - a[1]);
    
    sortedCommands.forEach(([command, count]) => {
        const percentage = ((count / allRecords.length) * 100).toFixed(1);
        const progressBar = `
            <div class="mb-2">
                <div class="d-flex justify-content-between">
                    <span>${command}</span>
                    <span>${count} (${percentage}%)</span>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar" role="progressbar" 
                         style="width: ${percentage}%;" 
                         aria-valuenow="${percentage}" 
                         aria-valuemin="0" 
                         aria-valuemax="100"></div>
                </div>
            </div>
        `;
        statsContainer.innerHTML += progressBar;
    });
    
    // Actualizar el gráfico de pastel
    updateChart(commandCounts);
}

// Actualizar gráfico de pastel
function updateChart(commandCounts) {
    const ctx = document.getElementById('commandChart').getContext('2d');
    
    // Destruir el gráfico anterior si existe
    if (commandChart) {
        commandChart.destroy();
    }
    
    // Preparar datos para el gráfico
    const labels = Object.keys(commandCounts);
    const data = Object.values(commandCounts);
    
    // Colores para el gráfico
    const backgroundColors = [
        '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
        '#858796', '#f8f9fc', '#5a5c69', '#2e59d9', '#17a673'
    ];
    
    // Crear el gráfico
    commandChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                hoverBackgroundColor: backgroundColors,
                hoverBorderColor: "rgba(234, 236, 244, 1)",
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                    }
                },
                tooltip: {
                    backgroundColor: "rgb(255,255,255)",
                    bodyColor: "#858796",
                    titleMarginBottom: 10,
                    titleColor: '#6e707e',
                    borderColor: '#dddfeb',
                    borderWidth: 1,
                    padding: 15,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = ((value / allRecords.length) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Iniciar actualizaciones en tiempo real
function startRealtimeUpdates() {
    // Limpiar intervalo existente
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    
    // Establecer nuevo intervalo (cada 5 segundos)
    updateInterval = setInterval(loadData, 2000);
    
    // Actualizar indicador
    document.getElementById('update-indicator').innerHTML = 
        '<i class="fa-solid fa-sync fa-spin"></i> Actualizando cada 2s';
}

// Detener actualizaciones en tiempo real
function stopRealtimeUpdates() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
    
    // Actualizar indicador
    document.getElementById('update-indicator').innerHTML = 
        '<i class="fa-solid fa-pause"></i> Actualizaciones pausadas';
}

// Ver detalles de un registro
function viewRecordDetails(recordId) {
    const record = allRecords.find(r => r.id == recordId);
    if (!record) return;
    
    // Crear contenido para el modal
    const modalContent = `
        <div class="modal fade" id="recordDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detalles del Registro #${record.id}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Nombre del dispositivo:</strong><br>${record.name}</p>
                                <p><strong>Comando:</strong><br><span class="badge bg-primary">${record.status}</span></p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Dirección IP:</strong><br>${record.ip}</p>
                                <p><strong>Fecha y hora:</strong><br>${formatDateTime(record.date)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Eliminar modal existente si hay uno
    const existingModal = document.getElementById('recordDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Añadir el modal al documento
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('recordDetailsModal'));
    modal.show();
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Añadir al documento
    document.body.appendChild(notification);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}