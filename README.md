# Invitación de Baby Shower – Samuel

Sitio estático para la invitación digital con diseño emocional y moderna.

## Cómo conectar el formulario a Google Sheets

La forma segura recomendada es usando Google Apps Script como endpoint. No se debe poner ninguna credencial ni clave API en el frontend.

1. Abre Google Sheets y crea una nueva hoja llamada `Respuestas`.
2. En `Extensiones` > `Apps Script`, pega este script:

```javascript
function doGet() {
  return ContentService
    .createTextOutput('Baby Shower RSVP endpoint activo. Envía las confirmaciones mediante POST.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Respuestas');
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'No existe la hoja Respuestas' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const payload = (e && e.parameter) || {};
  if (!payload.guestName || !payload.attendance) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'Falta nombre o asistencia' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Fecha de respuesta', 'Invitado', 'Asistencia', 'Acompañante', 'Nombre del acompañante']);
  }

  const row = [
    payload.timestamp ? new Date(payload.timestamp) : new Date(),
    payload.guestName || '',
    payload.attendance || '',
    payload.withCompanion || '',
    payload.companionName || ''
  ];

  sheet.appendRow(row);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Publica como aplicación web:
   - `Implementación` > `Como aplicación web`
   - `Quien puede acceder: Cualquiera`
   - Copia la URL del Web App.

https://script.google.com/macros/s/AKfycbwgnTW6sPUz-IvP2sTGmu3inUvhiVNrVNYQucWz6wkTXysOAKRhiIpdo39ThufUE61Aiw/exec

4. **Importante:** visitar el endpoint desde el navegador hace una petición GET. El mensaje `No se encontró la función ... doGet` indica que el código actualmente publicado no contiene `doGet`; no es una prueba de que el formulario haya guardado una respuesta. Pega/guarda el código actualizado de arriba en Apps Script y luego ve a `Implementar` > `Gestionar implementaciones` > editar (ícono de lápiz) > selecciona `Nueva versión` > `Implementar`. Autoriza los permisos de Sheets si Google los solicita y deja el acceso como `Cualquier persona`.

  Tras implementarlo, abre la URL terminada en `/exec`: debe mostrar `Baby Shower RSVP endpoint activo...`. Si se creó una implementación nueva con otra URL, reemplaza el valor de `window.GOOGLE_SHEETS_WEBHOOK_URL` en `index.html` por esa URL.

El formulario envía los campos como datos de formulario (`URLSearchParams`) para evitar el preflight CORS que bloquea el envío desde el navegador. Con `mode: 'no-cors'` el navegador no permite leer la respuesta del servidor; por ello, después de probar el formulario confirma que aparezca una nueva fila en la hoja `Respuestas`. La pestaña debe existir en el mismo Google Sheet asociado al Apps Script.

5. Si la URL no está configurada, la página guarda la respuesta localmente en el dispositivo.

## Agregar la ecografía

Guarda la imagen en la carpeta principal del sitio con el nombre `ecografia-samuel.jpg`. La sección de ecografía la mostrará automáticamente; también puedes cambiar el nombre/ruta en el atributo `src` de la imagen en `index.html`. La imagen no está incluida todavía, así que se verá un espacio de reemplazo hasta que la agregues.

## Agregar las fotos de Oscar y Gaby

Crea la carpeta `fotos` junto a `index.html` y guarda allí las doce imágenes con estos nombres exactos:

- `fotos/oscar.jpg`
- `fotos/gaby.jpg`
- `fotos/oscar-gaby.jpg`
- `fotos/foto-especial.jpg`
- `fotos/viaje-moto-01.jpg`
- `fotos/viaje-moto-02.jpg`
- `fotos/viaje-moto-03.jpg`
- `fotos/viaje-moto-04.jpg`
- `fotos/viaje-moto-05.jpg`
- `fotos/viaje-moto-06.jpg`
- `fotos/viaje-moto-07.jpg`
- `fotos/viaje-moto-08.jpg`

La página muestra un espacio de reemplazo para cada imagen que todavía no esté disponible. Las fotos se pueden agregar en cualquier momento, sin modificar el formulario ni el código de almacenamiento.

## Ejecutar localmente

```bash
cd /home/oscar/Documents/Oscar/BabyShower
python3 -m http.server 8000
```

Luego abre: http://localhost:8000
