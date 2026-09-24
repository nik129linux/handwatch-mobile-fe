# desktop
En cualquier empresa mediana, pedir algo por dentro es lento y nadie sabe por qué. Una solicitud de compra, un permiso, un anticipo o la aprobación de un contrato pasa por cuatro o cinco personas, se demora tres semanas y **nadie sabe en qué escritorio está parada**. Se persigue por correo, por WhatsApp y preguntando en el pasillo.

Lo raro es que la empresa sí tiene el dato. Está regado entre correos, sistemas y firmas, pero nunca lo pusieron en una sola pantalla.

**Dónde se quedó** sería esa pantalla. No un sistema para aprobar cosas, que de esos hay muchos, sino uno para **ver la verdad de cómo se mueve el trabajo interno**: qué solicitudes hay abiertas, en manos de quién está cada una, y cuánto lleva ahí.

La parte de inteligencia artificial no aprueba nada ni decide nada. Con el histórico de esa misma empresa estima dos cosas: dónde se va a trabar una solicitud nueva y cuánto va a demorar de verdad, que casi nunca es lo que dice el procedimiento.

El desafío de interfaz es más difícil de lo que parece, y es lo que me interesa. Una pantalla que muestre demoras por persona **se convierte en un látigo**. Si la gente siente que es una lista pública de quién es el lento, la sabotea: aprueba sin leer, o mueve el trámite por fuera del sistema para que no quede registro. Y si por evitar eso se esconde dónde está el problema, la pantalla no sirve para nada.

Entonces la pregunta de diseño es concreta: cómo mostrar que algo está trabado sin que se lea como una acusación a una persona. Sospecho que la respuesta pasa por hablar de la solicitud y no del funcionario, y por mostrar la carga que cada uno tiene encima cuando aparece como demorado. Eso hay que probarlo con ellos.

Quiero entrevistar a dos lados de la misma empresa: al que pide y persigue, y al que aprueba y tiene veinte cosas encima. Los dos se quejan del mismo proceso por motivos opuestos.

Si me dicen que su flujo ya está en un sistema que les funciona, el proyecto se cae. Y si descubro que la demora no es de información sino de decisión, o sea que el jefe simplemente no quiere firmar, también, porque eso no lo arregla una interfaz.

# Mobile
El enfermero pasa el turno entre la cama del paciente y un computador que está en otro lado. Todo lo que hace lo tiene que registrar, y lo registra después, de memoria, cuando alcanza. Mientras tanto el paciente y la familia no saben nada: preguntan a cada rato qué sigue, cuánto falta, por qué todavía no viene el médico.

Son dos personas sufriendo el mismo vacío de información, cada una desde su lado.

**La app sería una sola, con dos caras.** Del lado del enfermero, registrar lo que acaba de hacer sin salir de la habitación. Del lado del paciente, ver qué le van a hacer y qué está esperando, en palabras que entienda.

Las condiciones de uso mandan sobre todo el diseño. El enfermero está de pie, con guantes, con una mano ocupada, apurado y con un paciente que lo está mirando. Cualquier cosa que tarde más de unos segundos no se va a usar, y va a terminar registrando después, que es exactamente el problema de hoy.

La inteligencia artificial acá tiene una tarea y es acotada: convertir lo que el enfermero marca o dicta en el registro que el sistema necesita, y traducir ese mismo evento a una frase que el paciente entienda. No diagnostica nada y no decide nada.

El desafío de interfaz de verdad no es el formulario, es **qué ve el paciente y qué no**. Es la misma información contada a dos personas con necesidades opuestas, y una de las dos está asustada. Un dato clínico crudo en la pantalla de un familiar hace daño, y una pantalla que no dice nada mantiene la angustia igual que hoy. Ahí está el diseño.

Hay algo más: la pantalla del enfermero **la ve también el paciente desde la cama**. Eso cambia qué se puede mostrar y qué no, y no lo resuelve ningún tamaño de letra.

Quiero entrevistar enfermeros de turno y, aparte, a pacientes o familiares que hayan estado hospitalizados hace poco. Los dos me van a describir el mismo turno de manera distinta.

Si me dicen que el registro ya lo hacen en un equipo que cargan y les funciona, o que el hospital no permite que el paciente vea nada, el proyecto se cae. Eso último hay que preguntarlo antes que cualquier otra cosa.

# Smartwatch
La higiene de manos en un hospital tiene un protocolo claro, con momentos definidos en los que hay que lavarse. Todos lo saben. El problema no es el conocimiento, es que en un turno largo, con prisa y con las manos ocupadas, **se olvida**.

Hoy eso se mide mandando a alguien a observar y anotar, que es caro, es poco frecuente y además cambia el comportamiento del que se sabe observado.

**El reloj sería el recordatorio y el registro al mismo tiempo.** Detecta por movimiento que el lavado ocurrió y cuánto duró, y avisa por vibración cuando toca y no pasó.

El canal de salida no puede ser la pantalla. El profesional no la puede mirar, y sobre todo **no puede sonar delante del paciente**. Que a alguien le pite el reloj en la habitación mientras atiende es humillante y no lo va a tolerar. Todo el aviso tiene que ser al cuerpo y en silencio.

La inteligencia artificial hace el reconocimiento del gesto desde el movimiento del reloj. Y ahí aparece el problema que me interesa, que es de diseño y no de modelo: **el reloj se va a equivocar**. Va a marcar que alguien no se lavó cuando sí lo hizo. Eso es una acusación automática sobre el trabajo de una persona.

Entonces las preguntas a diseñar son concretas. Cómo se corrige esa marca sin llenar un formulario. Cómo se ve el dato para que sirva a mejorar el proceso y no para sancionar a alguien. Y cuál es la diferencia entre una vibración que dice "acordate" y una que dice "esto quedó mal registrado", porque no se pueden sentir igual.

El entregable no es solo la app. Es el vocabulario de vibraciones documentado, y la decisión explícita de qué se guarda, quién lo ve y por cuánto tiempo.

Quiero entrevistar personal de enfermería y también a quien lleva el control de infecciones en el hospital, porque uno lo va a vivir como control y el otro como indicador. Esa diferencia es el caso.

Si el personal me dice que lo viviría como vigilancia y que se lo quitarían apenas puedan, el proyecto se cae tal como está planteado, y el hallazgo sería que el reloj no puede ser del hospital sino de la persona.
