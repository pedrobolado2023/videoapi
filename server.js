const express = require('express');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações básicas
app.use(cors());
app.use(express.json());

// Rota de Teste (Health Check) - O Easypanel usa isso para saber se está online
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'Video API is running with FFmpeg support',
    ffmpeg_version: 'Checked on startup'
  });
});

// Rota Placeholder para processar vídeo (Futuramente vamos expandir isso)
app.post('/api/process-video', async (req, res) => {
  const { videoUrl, settings } = req.body;
  
  console.log('Recebendo pedido de processamento:', videoUrl);

  // Simulação de resposta rápida para o Front-end não travar
  res.json({
    jobId: 'job_' + Date.now(),
    status: 'processing',
    message: 'Video added to processing queue'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Verifica se o FFmpeg está instalado corretamente
  ffmpeg.getAvailableFormats(function(err, formats) {
    if (err) {
      console.error('Erro: FFmpeg não encontrado!');
    } else {
      console.log('FFmpeg está instalado e pronto para uso.');
    }
  });

});
