import app from './src/app.js'
import config from './src/config/config.js';
const PORT = process.env.PORT || 8080
const server = app.listen(PORT, () => {
    console.log(`
            🚀 Server is running!
            📍 Port: ${PORT}
            🌍 Environment: ${config.nodeEnv}
            🔗 Local: http://localhost:${PORT}
        `)
})