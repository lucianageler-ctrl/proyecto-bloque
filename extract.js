module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "La variable de entorno GEMINI_API_KEY no está configurada en Vercel." });
  }

  try {
    const { mimeType, data } = req.body;

    if (!mimeType || !data) {
      return res.status(400).json({ error: "Faltan datos requeridos (mimeType o data)." });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Extraer todo el texto de este documento de la forma más precisa posible sin inventar nada."
              },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: data
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      return res.status(response.status).json({ error: `Error de la API de Gemini: ${response.statusText}` });
    }

    const responseData = await response.json();
    return res.status(200).json(responseData);

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
};

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb'
    }
  }
};
