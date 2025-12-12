const express = require('express');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
// ATENÇÃO: ytdl-core costuma quebrar. Se não funcionar, use 'yt-dlp-exec'
const ytdl = require('ytdl-core'); 

// Configurar caminho do FFmpeg no Docker
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Servir arquivos gerados (downloads)
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// Banco de dados em memória simples
const jobs = {};

// Função auxiliar para processar vídeo (Fake AI clipping para demo, mas com corte real)
const processJob = async (jobId, videoUrl) => {
  try {
    jobs[jobId].status = 'processing';
    jobs[jobId].message = 'Downloading video...';

    const downloadPath = path.join(__dirname, 'downloads', `${jobId}_source.mp4`);
    if (!fs.existsSync('downloads')) fs.mkdirSync('downloads');

    // 1. Download
    console.log(`Job ${jobId}: Downloading ${videoUrl}`);
    await new Promise((resolve, reject) => {
      ytdl(videoUrl, { quality: '18' }) // Qualidade baixa para ser rápido na demo
        .pipe(fs.createWriteStream(downloadPath))
        .on('finish', resolve)
        .on('error', reject);
    });

    jobs[jobId].message = 'Cutting clips with FFmpeg...';

    // 2. Cortar um clipe de exemplo (0s a 15s)
    const outputPath = path.join(__dirname, 'downloads', `${jobId}_clip1.mp4`);
    
    await new Promise((resolve, reject) => {
      ffmpeg(downloadPath)
        .setStartTime('00:00:00')
        .setDuration(15)
        .output(outputPath)
        .on('end', resolve)
        .on('error', (err) => {
            console.error('FFmpeg error:', err);
            reject(err);
        })
        .run();
    });

    // 3. Finalizar
    const hostname = process.env.RAILWAY_STATIC_URL || process.env.PUBLIC_URL || `http://localhost:${PORT}`;
    
    jobs[jobId].status = 'completed';
    jobs[jobId].result = {
      title: 'Processed Video',
      clips: [
        {
          id: `c-${Date.now()}`,
          title: 'Viral Clip #1',
          thumbnail: 'https://picsum.photos/400/600',
          duration: '0:15',
          videoUrl: `${hostname}/downloads/${jobId}_clip1.mp4`, // URL real do video cortado
          aspectRatio: '9:16',
          captions: [],
          viralScore: 99
        }
      ]
    };

    // Limpar arquivo original para economizar espaço
    fs.unlinkSync(downloadPath);

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    jobs[jobId].status = 'failed';
    jobs[jobId].message = error.message;
  }
};

app.get('/', (req, res) => {
  res.json({ status: 'online', ffmpeg: 'ready' });
});

app.post('/api/process-video', (req, res) => {
  const { videoUrl } = req.body;
  const jobId = 'job_' + Date.now();
  
  jobs[jobId] = { 
    id: jobId, 
    status: 'queued', 
    submittedAt: new Date() 
  };

  // Iniciar processamento em background (não esperar terminar para responder)
  processJob(jobId, videoUrl);

  res.json({ jobId, message: 'Job started' });
});

app.get('/api/status/:id', (req, res) => {
  const job = jobs[req.params.id];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
