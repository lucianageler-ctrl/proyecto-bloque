function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
}

async function extractFile(file) {
  const cacheKey = `${file.name}::${file.size}::${file.lastModified}`;
  if (extractionCache.has(cacheKey)) {
    return extractionCache.get(cacheKey);
  }

  setStatus(`Subiendo ${file.name} a tu servidor en Vercel...`, 20);

  try {
    const base64Data = await fileToBase64(file);
    const mimeType = file.type || "application/pdf";

    setStatus(`El servidor está analizando con Gemini 1.5 Flash...`, 60);

    const response = await fetch(`/api/extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mimeType: mimeType,
        data: base64Data
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Backend Error:", errorData);
      throw new Error(errorData.error || `Error del servidor: ${response.statusText}`);
    }

    const data = await response.json();

    let extractedText = "";
    if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
      extractedText = data.candidates[0].content.parts.map(p => p.text).join("\n");
    }

    if (!extractedText) {
      throw new Error("Gemini no pudo extraer texto del archivo.");
    }

    const payload = {
      text: extractedText,
      mode: "Gemini 1.5 Flash (Backend Seguro)",
      status: "ok",
      note: "Extraído vía Inteligencia Artificial procesada en Servidor"
    };

    extractionCache.set(cacheKey, payload);
    return payload;

  } catch (error) {
    throw error;
  }
}
