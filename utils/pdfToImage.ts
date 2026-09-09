import { pdfToImg } from 'pdftoimg-js/browser';

/**
 * Converts an uploaded PDF file into an array of base64 encoded images.
 */
export async function convertPdfToImages(file: File): Promise<string[]> {
  const fileUrl = URL.createObjectURL(file);
  try {
    const images = await pdfToImg(fileUrl, {
      imgType: 'jpg',
      scale: 2,
      background: 'white'
    });
    
    // Ensure we always return an array
    if (Array.isArray(images)) {
      return images as string[];
    } else {
      return [images as string];
    }
  } finally {
    URL.revokeObjectURL(fileUrl);
  }
}

export async function convertFileToImages(file: File): Promise<string[]> {
  if (file.type === 'application/pdf') {
    return await convertPdfToImages(file);
  } else if (file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve([e.target?.result as string]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  throw new Error("Unsupported file type. Please upload a PDF or an Image.");
}
