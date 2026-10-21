// Diálogos modales compartidos (confirmaciones y selección de prioridad).

let dialogo;

function obtenerDialogo() {
    if (dialogo) return dialogo;

    dialogo = document.createElement('dialog');
    dialogo.className = 'inc-dialog';
    dialogo.setAttribute('aria-labelledby', 'tituloDialogoAccion');
    dialogo.innerHTML = `
        <div class="inc-dialog-card">
            <button type="button" class="inc-dialog-close" aria-label="Cerrar"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
            <span class="incidence-kicker">Confirmación</span>
            <h2 id="tituloDialogoAccion"></h2>
            <p class="inc-dialog-message"></p>
            <div class="inc-dialog-actions">
                <button type="button" class="btn-secundario">Cancelar</button>
                <button type="button" class="btn-danger-inc">Confirmar</button>
            </div>
        </div>`;
    document.body.append(dialogo);
    return dialogo;
}

export function confirmarAccionCentrada({ titulo = 'Confirmar acción', mensaje, confirmar = 'Confirmar', peligro = false }) {
    const modal = obtenerDialogo();
    modal.querySelector('h2').textContent = titulo;
    modal.querySelector('.inc-dialog-message').textContent = mensaje;

    const selectorExistente = modal.querySelector('.dialogo-prioridad-select');
    if (selectorExistente) selectorExistente.hidden = true;

    const botonConfirmar = modal.querySelector('.inc-dialog-actions button:last-child');
    botonConfirmar.textContent = confirmar;
    botonConfirmar.classList.toggle('btn-danger-inc', peligro);
    botonConfirmar.classList.toggle('btn-primary-inc', !peligro);

    return new Promise(resolve => {
        const cerrar = valor => { modal.close(); limpiar(); resolve(valor); };
        const botonCancelar = modal.querySelector('.inc-dialog-actions button:first-child');
        const limpiar = () => {
            botonConfirmar.removeEventListener('click', aceptar);
            botonCancelar.removeEventListener('click', cancelar);
            modal.querySelector('.inc-dialog-close').removeEventListener('click', cancelar);
            modal.removeEventListener('cancel', alCancelar);
        };
        const aceptar = () => cerrar(true);
        const cancelar = () => cerrar(false);
        const alCancelar = event => { event.preventDefault(); cancelar(); };

        botonConfirmar.addEventListener('click', aceptar);
        botonCancelar.addEventListener('click', cancelar);
        modal.querySelector('.inc-dialog-close').addEventListener('click', cancelar);
        modal.addEventListener('cancel', alCancelar);
        modal.showModal();
        botonCancelar.focus();
    });
}

export function elegirPrioridadCentrada({ titulo, prioridad }) {
    const modal = obtenerDialogo();
    modal.querySelector('h2').textContent = titulo;

    const mensaje = modal.querySelector('.inc-dialog-message');
    mensaje.textContent = 'Seleccioná la nueva prioridad.';

    let select = modal.querySelector('.dialogo-prioridad-select');
    if (!select) {
        select = document.createElement('select');
        select.className = 'dialogo-prioridad-select';
        select.setAttribute('aria-label', 'Seleccioná la nueva prioridad');
        select.innerHTML = '<option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option>';
        mensaje.after(select);
    }
    select.value = prioridad;
    select.hidden = false;

    const botonConfirmar = modal.querySelector('.inc-dialog-actions button:last-child');
    botonConfirmar.textContent = 'Guardar prioridad';
    botonConfirmar.classList.remove('btn-danger-inc');
    botonConfirmar.classList.add('btn-primary-inc');

    const botonCancelar = modal.querySelector('.inc-dialog-actions button:first-child');
    botonCancelar.textContent = 'Cancelar';

    return new Promise(resolve => {
        const cerrar = valor => { modal.close(); limpiar(); resolve(valor); };
        const cancelar = () => cerrar(null);
        const aceptar = () => cerrar(select.value);
        const botonCerrar = modal.querySelector('.inc-dialog-close');
        const limpiar = () => {
            botonConfirmar.removeEventListener('click', aceptar);
            botonCancelar.removeEventListener('click', cancelar);
            botonCerrar.removeEventListener('click', cancelar);
            modal.removeEventListener('cancel', alCancelar);
        };
        const alCancelar = event => { event.preventDefault(); cancelar(); };

        botonConfirmar.addEventListener('click', aceptar);
        botonCancelar.addEventListener('click', cancelar);
        botonCerrar.addEventListener('click', cancelar);
        modal.addEventListener('cancel', alCancelar);
        modal.showModal();
        select.focus();
    });
}
