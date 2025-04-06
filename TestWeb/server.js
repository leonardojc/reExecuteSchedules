const express = require('express');
const { reExecuteSchedules } = require('../dist/reExecuteSchedules');
const path = require('path');

const app = express();
const port = 3000;

// Middleware para parsear JSON
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.post('/api/execute', async (req, res) => {
  try {
    const controllerData = req.body;
    
    const result = await debugReExecuteSchedules([controllerData]);

    // Procesamos el resultado para dejarlo más limpio
    const executionResult = result.map(r => ({
      controllerId: r.id,
      status: r.success,
      message: r.message
    }));

    // res.json({ 
    //   success: true, 
    //   message: 'Executed',
    //   executionResult // Esto ahora es el array procesado
    // });

    res.json({ 
      success: true, 
      message: 'Executed',
      executionResult: result // <--- sin map()
    });

    
  } catch (error) {
   // console.error('Error in /api/execute:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});



async function debugReExecuteSchedules(data) {
  try {
    //console.log('[DEBUG] Calling reExecuteSchedules with:', data);
    const startTime = Date.now();
    const result = await reExecuteSchedules(data);
    
    //console.log(`[DEBUG] reExecuteSchedules completed in ${Date.now() - startTime}ms`);
    //console.log('[DEBUG] Result:', result);
    
    return result;
  } catch (error) {
    //console.error('[DEBUG] Error in reExecuteSchedules:', error);
    throw error;
  }
}



// Servir el archivo HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
