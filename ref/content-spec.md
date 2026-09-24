# Especificación de contenido — insumo para maquetar (NO es el entregable final, es el brief para agy)

App de enfermería, dos caras según `ideas.md`, tratadas aquí como tres lectores:
enfermero, paciente, familia.

## Artefacto 1 — Contenido

### Por qué tres lectores, no dos
La app registra un turno de hospital. El enfermero necesita rapidez y precisión
clínica. El paciente necesita saber qué sigue, en lenguaje llano. La familia
necesita logística (cuándo puede entrar, a quién preguntar), no el dato clínico:
recibe menos detalle médico que el paciente pero más detalle de "cuándo/quién" que
nadie más pide.

### Inventario de entidades

| Entidad | Campos | Enfermero ve | Paciente ve | Familia ve |
|---|---|---|---|---|
| Paciente | nombre, habitación, cama, diagnóstico, alergias | todo | su nombre, su habitación | nombre y habitación |
| Turno | enfermero asignado, horario, próxima ronda | todo | "tu enfermera es X, vuelve a las 3pm" | igual que paciente |
| Evento de cuidado | tipo, valor clínico, hora, vía, dosis, nota interna | todo, crudo | traducción a frase llana | resumen de si se cumplió, sin valores |
| Pendiente | qué falta, para cuándo, prioridad | lista completa ordenada por urgencia | "esto viene después" sin jerga | no se muestra (ruido para ellos) |
| Mensaje al paciente | texto generado a partir del evento | ve el evento origen | ve el mensaje | no aplica |
| Alerta clínica | valor fuera de rango, protocolo a seguir | completa, con protocolo | NO se muestra cruda | NO se muestra |

### Traducción de un mismo evento — la tabla que es el argumento del caso

| Evento real | Registro del enfermero (crudo) | Lo que ve el paciente | Lo que ve la familia |
|---|---|---|---|
| Medicación aplicada | Enoxaparina 40mg SC, 11:05, vía abdominal | Ya le pusieron el medicamento de la mañana | Tratamiento de la mañana cumplido |
| Signos vitales fuera de rango | PA 90/55, taquicardia 112, alerta protocolo hipotensión | (no se muestra hasta que el enfermero decide comunicarlo) | (no se muestra) |
| Cambio de posición | Cambio postural decúbito lateral izq., 11:20 | Le ayudaron a cambiar de posición | — |
| Próxima ronda | Ronda programada 13:00, control de signos | El enfermero vuelve a la 1pm | — |

### Qué NO se muestra nunca, por lector
- **Paciente**: valores clínicos crudos fuera de rango, sospechas diagnósticas,
  notas de un profesional a otro, nombres de medicamentos que requieren
  explicación médica sin traducir.
- **Familia**: todo lo anterior, más el detalle clínico que sí ve el paciente
  (dosis, vías, horarios exactos de procedimientos íntimos).

### Honestidad de datos
Las entrevistas con enfermeros y pacientes/familiares (declaradas en `ideas.md:33`)
no se hicieron todavía. Todo dato de este documento que dependa de esa entrevista
lleva la marca **POR CONFIRMAR EN CAMPO**. Aplica a: la lista exacta de eventos de
cuidado, los tiempos de traducción, y si el hospital permite que el paciente vea
esta pantalla en absoluto (condición de caída declarada en `ideas.md:35`).

## Artefacto 2 — Jerarquía

### Árbol enfermero (orden: urgencia y tiempo)
```
Turno
├── Mi lista de pacientes
│   └── Paciente
│       ├── Pendientes ahora (ordenados por hora límite)
│       ├── Alertas activas
│       └── Historial del turno (colapsado por defecto)
└── Registrar evento
    ├── Evento previsto (del plan de cuidado) — 1 toque
    └── Evento fuera de lo esperado — requiere abrir detalle
```

### Árbol paciente (orden: ansiedad, "¿cuánto falta?")
```
Mi estado
├── Qué sigue (próximo evento previsto, hora aproximada)
├── Qué pasó hoy (línea de tiempo en lenguaje llano)
└── Preguntas frecuentes / cómo llamar al enfermero
```

### Árbol familia (orden: logística)
```
Qué está pasando (resumen de una línea, sin clínica)
├── Cuándo puedo verlo (horario de visita, si aplica)
└── A quién pregunto (contacto del enfermero de turno)
```

### Restricción transversal: pantalla semi-pública
La pantalla del enfermero la ve también el paciente desde la cama (`ideas.md:31`).
Por eso "Historial del turno" y cualquier valor clínico crudo van SIEMPRE detrás de
un toque deliberado (abrir el detalle), nunca en la lista visible de entrada. Esto
cuesta un toque extra al enfermero y es una decisión a propósito, no un descuido.

## Artefacto 3 — Navegación

### Global (persiste selección, barra inferior)
- **Enfermero** (3 destinos): Turno · Registrar · Pendientes
- **Paciente** (2 destinos): Mi estado · Preguntas
- **Familia** (2 destinos): Qué pasa · Contacto

El destino activo se pinta con `--color-primary` y queda marcado mientras la
persona lo tenga seleccionado — es la definición del profesor: "persiste en lo
calo que usted está seleccionando".

### Contextual (hipervínculos que sí llevan a más detalle)
- Paciente en la lista del enfermero → detalle del paciente (más información, no
  menos: historial completo, alertas, notas).
- Pendiente → acción concreta que lo cierra (no un texto repetido).
- "Ver más" en el timeline del paciente → detalle del evento en lenguaje llano,
  nunca el dato clínico crudo.

### Cambio de cara (enfermero / paciente / familia)
No es navegación normal: es cambio de contexto y de modelo mental completo. Se
resuelve con un selector de rol visible en el encabezado del documento (para que
el profesor pueda alternar las tres vistas), no con un link perdido en un menú.

### La tensión de diseño, declarada
`ideas.md:25` exige que registrar tome segundos. `ideas.md:31` exige esconder lo
sensible tras un toque deliberado. Ambas reglas compiten. Resolución propuesta:
- **Eventos previstos** (ya están en el plan de cuidado): un toque, sin mostrar
  dato crudo en pantalla — solo confirmar que ocurrió.
- **Eventos fuera de lo esperado** (la minoría): exigen abrir el detalle y escribir,
  porque ahí sí hay dato sensible que no puede quedar a la vista de un vistazo.
Esto es una hipótesis de diseño, marcada **POR CONFIRMAR EN CAMPO**.

## Artefacto 4 (extensión) — Las 8 pantallas mobile

Al pedido de un kit de mobile de referencia (Splash, Image Based, Dashboard,
Analytics, List, Card Grid, Product Page, Minimal), cada una se llenó con
datos reales del caso en vez de bloques genéricos, para no romper la
convención de honestidad del resto del documento:

| Pantalla | Contenido real | Fuente |
|---|---|---|
| Splash | Login de turno, logo + spinner | nuevo |
| Image Based | Hero de bienvenida + accesos rápidos (Turno/Registrar/Pendientes/Mensajes) | nuevo |
| Dashboard | Lista de pacientes del turno | recrea `renderHomeEnfermero()` de `mockup/js/mockup.js` |
| Analytics | Signos vitales de Carlos Rodríguez (PA 90/55), dato oculto tras blur | nuevo, mismo patrón de ocultamiento que el prototipo |
| List | Checklist de pendientes del turno | nuevo, mismos pacientes de la tabla de contenido |
| Card Grid | Accesos a las tres caras + ajustes | nuevo |
| Product Page | Detalle de un paciente, dato clínico oculto | recrea `renderDetailEnfermero()` de `mockup/js/mockup.js` |
| Minimal | Confirmación de evento en 1 toque | nuevo, mismo patrón `tap-confirm` del prototipo |

Son vista previa estática dentro del documento; la interacción real sigue
viviendo en `mockup/`, al que la sección continúa linkeando.
