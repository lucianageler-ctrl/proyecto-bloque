const MAX_FILE_SIZE_MB = 3.3; // Límite por Vercel Serverless (4.5MB máximo, y el base64 infla ~33%)
const MAX_PDF_PAGES = 500;
const NATIVE_TEXT_THRESHOLD = 120;
const STORAGE_KEY = "doc-extractor-compare-v1";

const extractionCache = new Map();

const state = {
  docs: [],
  selectedPreviewId: null
};
