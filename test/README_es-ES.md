# Pruebas de Extremo a Extremo de LangChain

Este directorio contiene scripts completos de pruebas de extremo a extremo de la arquitectura LangChain para verificar todo el proceso desde la entrada del usuario en el frontend hasta la respuesta del LLM.

## 📁 Estructura de Archivos

```
test/
├── end-to-end-langchain-test.js    # Script principal de pruebas
├── run-e2e-test.js                 # Script de ejecución de pruebas
├── .env.example                    # Ejemplo de configuración de entorno
├── .env                           # Configuración real del entorno (necesita ser creado)
├── test-results/                  # Directorio de resultados de pruebas
│   ├── langchain-e2e-test-results.json
│   └── langchain-e2e-test-report.html
└── README.md                      # Este documento
```

## 🚀 Inicio Rápido

### 1. Configuración del Entorno

Antes de la primera ejecución, necesitas configurar las variables de entorno:

```bash
# Copiar el ejemplo de configuración del entorno
cp .env.example .env

# Editar el archivo .env para realizar las configuraciones necesarias
# Especialmente OPENAI_API_KEY (si vas a probar llamadas reales al LLM)
```

### 2. Ejecutar Pruebas

```bash
# Ejecutar pruebas completas de extremo a extremo
node run-e2e-test.js

# Solo verificar la configuración del entorno
node run-e2e-test.js --check

# Habilitar llamadas reales al LLM (requiere clave API válida)
node run-e2e-test.js --real-llm

# Especificar puerto del servidor web
node run-e2e-test.js --port 8080

# Modo de salida detallada
node run-e2e-test.js --verbose
```

### 3. Ver Informe de Pruebas

Después de completar las pruebas, se iniciará automáticamente un servidor web para mostrar el informe de pruebas:

- URL de acceso predeterminada: http://localhost:3001
- Endpoint de API: http://localhost:3001/api/test-results

## 📊 Contenido de las Pruebas

### Idiomas de Prueba

Las pruebas cubren los siguientes 7 idiomas:
- Chino (zh-CN)
- Inglés (en-US) 
- Japonés (ja)
- Coreano (ko)
- Español (es-ES)
- Portugués (pt-BR)
- Francés (fr)

### Casos de Prueba

Cada idioma incluye 5 casos de prueba:

1. **Activador de herramienta get-flow** - Prueba de palabra clave "flujo actual"
2. **Activador de herramienta get-node-info** - Prueba de palabra clave "nodo actual"
3. **Activador de herramienta get-settings** - Prueba de palabra clave "configuración actual"
4. **Activador de herramienta get-diagnostics** - Prueba de palabra clave "diagnóstico actual"
5. **Conversación en lenguaje natural** - Prueba "Introducir Node-RED" (sin activador de herramienta)

### Información Clave Registrada

Cada caso de prueba registra la siguiente información:

- **a. Texto de entrada del usuario** - Texto original simulado que el usuario ingresó en la página
- **b. Palabra clave detectada** - Palabra clave que LangChain recibió e identificó
- **c. Determinación de llamada a herramienta** - Decisión del sistema sobre si llamar a una herramienta
- **d. Tipo de herramienta y contenido de retorno** - Herramienta específica llamada y su resultado de retorno
- **e. Prompt newHuman concatenado enviado al LLM** - Prompt final del usuario enviado al LLM
- **f. Prompt del sistema enviado al LLM** - Prompt a nivel del sistema
- **g. Respuesta del LLM** - Resultado de respuesta del modelo de lenguaje grande

## 🔧 Explicación de Variables de Entorno

### Configuración Requerida

```bash
# Clave API de OpenAI (para llamadas reales al LLM)
OPENAI_API_KEY=your_openai_api_key_here

# Simulación del entorno Node-RED
TEST_FLOW_ID=test-flow-123
TEST_NODE_ID=test-node-456
TEST_CONFIG_NODE_ID=test-config-node
```

### Configuración Opcional

```bash
# Configuración del proveedor LLM
TEST_LLM_PROVIDER=openai
TEST_LLM_MODEL=gpt-3.5-turbo

# Puerto del servidor web
TEST_WEB_PORT=3001

# Si habilitar llamadas reales al LLM
ENABLE_REAL_LLM_CALLS=false

# Configuración de depuración
DEBUG_MODE=true
LOG_LEVEL=info
```

## 📈 Informe de Pruebas

### Informe Web

El informe HTML generado después de completar las pruebas incluye:

- **Resumen de pruebas** - Información estadística general
- **Tablas por idioma** - Resultados detallados de pruebas para cada idioma
- **Visualización de estado** - Estado de éxito/fallo
- **Diseño responsivo** - Adaptación a diferentes tamaños de pantalla

### Datos JSON

Los datos de prueba en bruto se guardan en formato JSON y pueden usarse para:

- Análisis automatizado
- Integración en pipelines CI/CD
- Generación de informes personalizados

## 🛠️ Arquitectura Técnica

### Proceso de Prueba

1. **Inicialización del entorno** - Verificación de configuración, dependencias y variables de entorno
2. **Simulación del frontend** - Simulación de entrada del usuario y detección de palabras clave
3. **Procesamiento del backend** - Llamada al LangChain Manager para procesar solicitudes
4. **Ejecución de herramientas** - Simulación o ejecución real de herramientas relacionadas
5. **Interacción con LLM** - Construcción de prompts y obtención de respuestas del LLM
6. **Registro de resultados** - Guardado de información completa de la cadena de procesamiento
7. **Generación de informes** - Generación de informes web y datos JSON

### Componentes de Simulación

- **Mock Node-RED** - Simulación del entorno de ejecución de Node-RED
- **Mock Tools** - Simulación de resultados de ejecución de herramientas
- **Mock LLM** - Simulación opcional de respuestas del LLM

## 🔍 Solución de Problemas

### Problemas Comunes

1. **Variables de entorno no configuradas**
   ```bash
   # Verificar si el archivo .env existe y está configurado correctamente
   node run-e2e-test.js --check
   ```

2. **Dependencias faltantes**
   ```bash
   # Instalar dependencias necesarias
   npm install express dotenv
   ```

3. **Clave API inválida**
   ```bash
   # Probar en modo simulación
   node run-e2e-test.js
   # O configurar ENABLE_REAL_LLM_CALLS=false
   ```

4. **Puerto en uso**
   ```bash
   # Especificar otro puerto
   node run-e2e-test.js --port 8080
   ```

### Modo de Depuración

```bash
# Habilitar salida detallada
node run-e2e-test.js --verbose

# O configurar en .env
DEBUG_MODE=true
LOG_LEVEL=debug
```

## 📝 Desarrollo de Extensiones

### Agregar Nuevo Idioma

1. Agregar código de idioma a `TEST_CONFIG.languages`
2. Agregar casos de prueba correspondientes a `TEST_CONFIG.testCases`
3. Verificar que existe el archivo de configuración del idioma correspondiente

### Agregar Nuevo Caso de Prueba

```javascript
// Agregar a los casos de prueba del idioma correspondiente
{ 
    keyword: 'nueva palabra clave', 
    expectedTool: 'new-tool', 
    description: 'descripción del nuevo caso de prueba' 
}
```

### Simulación de Herramientas Personalizadas

Agregar resultados de simulación de nuevas herramientas al objeto `mockToolResults` en la función `executeTestCase`.

## 📄 Licencia

Este script de prueba sigue la misma licencia que el proyecto principal.

## 🤝 Contribución

¡Damos la bienvenida a Issues y Pull Requests para mejorar el script de prueba!

---

**Nota**: Este script de prueba se basa en el diseño de arquitectura descrito en el documento `LANGCHAIN_ARCHITECTURE.md` y asegura la cobertura de pruebas del proceso completo de interacción del usuario.