let currentQuestionIndex = 0;
let timeLeft = 3600;
let penalty = 10;
let points = 100;
let warningCount = 0; 
let maxPoints = 100;
const correctPin = '9922';

const timeElement = document.getElementById('time');
const warningElement = document.getElementById('warning');
const pointsElement = document.getElementById('points');
const pinError = document.getElementById('pinError');
pinError.style.display = "none";
let answers = [];

const questions = [
    {
        text: 'Cambiar Texto al Hacer Click: Crea un componente que muestre un párrafo con un texto inicial. Al hacer clic en el párrafo, el texto debe cambiar a uno nuevo. Usar useState para manejar el estado del texto.',
        iframeSrc: 'https://stackblitz.com/edit/react-simple-code-editor?embed=1&file=src%2FApp.js',
    },
    {
        text: 'Crear un componente que muestre un contador y dos botones: "Incrementar" y "Decrementar". El contador debe poder incrementarse solo hasta 10 y decrementar solo hasta 0. Usar useState para gestionar el estado del contador.',
        iframeSrc: 'https://stackblitz.com/edit/react-simple-code-editor?embed=1&file=src%2FApp.js',
    },
    {
        text: 'Crear un componente llamado "Nombre" que muestre el nombre y apellido de una persona utilizando etiquetas h2. El nombre y el apellido deben pasarse como props desde el componente "Nombre" al componente App. Usar props para gestionar la visualización de los datos.',
        iframeSrc: 'https://stackblitz.com/edit/react-simple-code-editor?embed=1&file=src%2FApp.js',
    }
];

// Función para validar el Nombre y PIN
function checkCredentials() {
    const nameInput = document.getElementById('nameInput').value.trim();
    const pinInput = document.getElementById('pinInput').value.trim();

    if (!nameInput || pinInput !== correctPin) {
        pinError.style.display = "block"; // Mostrar el mensaje de error
    } else {
        // Si el nombre y el PIN son correctos, ocultar la pantalla de login y mostrar el contenido del examen
        document.getElementById('loginWrapper').style.display = "none";  // Oculta el loginWrapper
        document.getElementById('examContent').style.display = "block";

        // Mostrar el puntaje inicial
        pointsElement.textContent = points;

        startTimer(); // Inicia el temporizador al ingresar
    }
}

// Función para iniciar el temporizador y mostrarlo en el formato horas:minutos:segundos
function startTimer() {
    const timer = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;

            // Formatear el tiempo en horas, minutos y segundos
            const hours = Math.floor(timeLeft / 3600);
            const minutes = Math.floor((timeLeft % 3600) / 60);
            const seconds = timeLeft % 60;

            // Mostrar el tiempo formateado
            timeElement.textContent = `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        } else {
            clearInterval(timer);
            alert("El tiempo ha terminado");
            submitExam(); // Envía automáticamente las respuestas cuando el tiempo se acaba
        }
    }, 1000);
}

// Función para restar puntos y mostrar advertencia
function handleVisibilityChange() {
    if (document.hidden || document.visibilityState === 'hidden') {
        warningCount++; // Incrementar advertencia
        points -= penalty; // Restar puntos

        // Actualizar el puntaje y las advertencias en la interfaz
        warningElement.textContent = `Advertencias: ${warningCount}`;
        pointsElement.textContent = points;

        // Mensaje de advertencia
        alert(`Advertencia ${warningCount}: No cambies de pestaña. Has perdido ${penalty} puntos.`);
    }
}

// Agregar el listener para detectar cambios de pestaña
document.addEventListener('visibilitychange', handleVisibilityChange);

// También puedes usar 'blur' para detectar cuando la ventana pierde el foco
window.addEventListener('blur', handleVisibilityChange);

// Función para avanzar a la siguiente pregunta
function nextQuestion() {
    currentQuestionIndex++;

    if (currentQuestionIndex < questions.length) {
        // Actualizar el contenido con la siguiente pregunta
        document.getElementById('questionText').textContent = questions[currentQuestionIndex].text;
        document.getElementById('questionIframe').src = questions[currentQuestionIndex].iframeSrc;

        // Ocultar el botón de "Siguiente" hasta que se resuelva la siguiente pregunta
        document.getElementById('nextQuestionButton').style.display = 'none';
        document.getElementById('code').value = ''; // Limpiar el textarea
    } else {
        alert('¡Examen finalizado!');
        // Aquí podrías hacer que el usuario envíe el examen final o redirigirlo a otro lugar
        submitExam();
    }
}

// Función para enviar la respuesta de la pregunta actual
function submitAnswer() {
    // Lógica para validar o guardar la respuesta actual
    const code = document.getElementById('code').value.trim();
    if (code) {
        // Almacenar la respuesta en el array, vinculándola a la pregunta actual
        answers[currentQuestionIndex] = code;

        alert('Respuesta enviada. Presiona "Siguiente" para continuar.');

        // Mostrar el botón de "Siguiente"
        document.getElementById('nextQuestionButton').style.display = 'inline';
    } else {
        alert('Por favor ingresa una respuesta antes de continuar.');
    }
}

// Función para enviar el examen, guardar en PDF y redirigir
function submitExam() {
    clearInterval(timeLeft); // Detiene el temporizador

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Obtener el nombre del estudiante
    const name = document.getElementById('nameInput').value.trim();

    // Título del PDF
    doc.text('Resultados del Examen', 10, 10);

    // Agregar el nombre del estudiante
    doc.text(`Nombre del Estudiante: ${name}`, 10, 20);

    // Calcular y mostrar la nota final
    const finalScore = points < 0 ? 0 : points; // Asegurarse de que la nota no sea negativa
    doc.text(`Nota máxima a obtener: ${finalScore}`, 10, 30);

    // Añadir advertencias
    doc.text(`Número de veces que se abandonó el sitio: ${warningCount}`, 10, 40);

    // Variables para manejar la posición vertical de cada pregunta y respuesta
    let yPosition = 60; // Posición inicial en el eje Y
    const lineHeight = 10; // Altura entre líneas
    const pageHeight = doc.internal.pageSize.height; // Altura de la página

    // Función auxiliar para verificar si es necesario agregar una nueva página
    const checkPageOverflow = (additionalSpace) => {
        if (yPosition + additionalSpace > pageHeight - 20) { // 20 es un margen inferior
            doc.addPage();
            yPosition = 20; // Reiniciar la posición Y al inicio de la nueva página
        }
    };

    // Agregar cada pregunta y la respuesta del array 'answers'
    questions.forEach((question, index) => {
        const questionNumber = index + 1;
        const answer = answers[index] ? answers[index] : 'No respondido';

        // Verificar si hay espacio suficiente antes de agregar la pregunta
        const splitQuestion = doc.splitTextToSize(question.text, 180); // Dividir la pregunta en líneas si es necesario
        checkPageOverflow(lineHeight * (splitQuestion.length + 3)); // Considera la cantidad de líneas que ocupará la pregunta + 3 líneas de margen

        // Añadir la pregunta
        doc.text(`Pregunta ${questionNumber}:`, 10, yPosition);
        yPosition += lineHeight; // Aumentar la posición Y para la pregunta
        doc.text(splitQuestion, 10, yPosition);

        // Añadir espacio antes de la respuesta
        yPosition += lineHeight * splitQuestion.length;

        // Formatear la respuesta como un bloque de código
        const splitAnswer = doc.splitTextToSize(answer, 180); // Dividir la respuesta en varias líneas si es necesario

        // Verificar si hay espacio suficiente antes de agregar la respuesta
        checkPageOverflow(lineHeight * splitAnswer.length); // Considera cuántas líneas ocupará la respuesta

        doc.text('Respuesta:', 10, yPosition);
        yPosition += lineHeight; // Aumentar para el título "Respuesta"
        doc.text(splitAnswer, 10, yPosition);

        // Ajustar la posición Y en función de la cantidad de líneas en la respuesta
        yPosition += lineHeight * splitAnswer.length;

        // Añadir espacio adicional entre preguntas
        yPosition += lineHeight * 2; // Espacio extra para la siguiente pregunta
    });

    // Guardar el PDF
    const nameInput = document.getElementById('nameInput').value.trim();
    doc.save(`Resultados_${nameInput}.pdf`);

    // Esperar 5 segundos y redirigir
    setTimeout(() => {
        window.location.href = "https://teams.microsoft.com/l/team/19%3AXOqjSoxj6p0KzyjOzcWgc97Mr6UEkVwMsONU-LEqKvk1%40thread.tacv2/conversations?groupId=00fe52b4-e4d1-4dac-a5ab-284f2afc7163&tenantId=d8e3bd44-0bba-426b-952d-ada7bb17393c";  // Agrega tu enlace de Teams aquí
    }, 5000);
}
