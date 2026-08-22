github http://localhost:5173/

# Convención de Nomenclatura para Métodos
En este proyecto, seguimos una convención clara para nombrar los métodos según su propósito:

- __readX__: Métodos que obtienen datos de la API y devuelven una promesa.
- __saveX__: Métodos que guardan datos en la base de datos.
- __deleteX__: Métodos que eliminan datos.
- __getX__: Métodos que retornan datos que ya están cargados en memoria.
- __setX__: Métodos que almacenan datos en memoria.
- __loadX__: Métodos que obtienen datos de la API y los almacenan en memoria.

Esta convención facilita la lectura y el mantenimiento del código al proporcionar una estructura consistente para los métodos según su funcionalidad.
