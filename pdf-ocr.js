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
  console.log("Iniciando extracción para el archivo:", file.name);
  
  const cacheKey = `${file.name}::${file.size}::${file.lastModified}`;
  if (extractionCache.has(cacheKey)) {
    console.log("Archivo encontrado en caché.");
    return extractionCache.get(cacheKey);
  }

 
    setStatus(`Subiendo ${file.name} al backend...`, 20);

  try {
    const base64Data = await fileToBase64(file);
    const mimeType = file.type || "application/pdf";

    setStatus(`Procesando con Gemini 1.5 Flash...`, 60);

     const response = await fetch("/api/extract", {
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
      let errorMsg = `Error de red o API de Gemini (${response.status} ${response.statusText})`;
      try {
        const errorData = await response.json();
        if (errorData.error && errorData.error.message) {
          errorMsg = `Error de Gemini: ${errorData.error.message}`;
        }
      } catch (e) {}
      
      console.error(errorMsg);
      toast(errorMsg);
      throw new Error(errorMsg);
    }

    const data = await response.json();
    let extractedText = "";
    if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
      extractedText = data.candidates[0].content.parts.map(p => p.text).join("\n");
    }

    if (!extractedText) {
      const errorMsg = "Gemini no pudo extraer texto del archivo.";
      console.error(errorMsg);
      toast(errorMsg);
      throw new Error(errorMsg);
    }

    const payload = {
      text: extractedText,
      mode: "Gemini 1.5 Flash",
      status: "ok",
      note: "Extraído vía Inteligencia Artificial (Gemini)"
    };

    extractionCache.set(cacheKey, payload);
    return payload;

  } catch (error) {
    console.error("Fallo durante la extracción:", error);
    // El catch ya delega a app.js, pero mostramos un toast por seguridad
    toast(error.message || "Error desconocido al procesar el archivo");
    throw error;
  }
}
