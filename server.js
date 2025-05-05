import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = 5000;
import dotenv from 'dotenv';
dotenv.config();

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

app.use(express.json());

// ✅ Middleware global CORS avec réponse OPTIONS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // ✅ Réponse aux requêtes "preflight"
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.get('/', (req, res) => {
  res.send('Backend actif !');
});

app.post('/generate-image', async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "db21e45a370d8eec847e7b7cfe9a1c492d5f3fdf1ebc3e36c4a6f64c54c08c15",
        input: { prompt }
      }),
    });

    let prediction = await response.json();
    console.log("📤 Requête envoyée à Replicate :", prompt);
    console.log("🕐 ID de prédiction :", prediction.id);
    
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      console.log("🔄 État actuel :", prediction.status);
      await new Promise(r => setTimeout(r, 1000));
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` },
      });
      prediction = await poll.json();
    }
    
    if (prediction.status === 'succeeded') {
      console.log("✅ Image générée :", prediction.output[0]);
    }
    

    if (prediction.status === 'succeeded') {
      res.json({ imageUrl: prediction.output[0] });
    } else {
      res.status(500).json({ error: 'Échec de la génération' });
    }
  } catch (error) {
    console.error('Erreur serveur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
