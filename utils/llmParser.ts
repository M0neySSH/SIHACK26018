export async function parseDocumentImages(
  base64Images: string[],
  type: "invoice" | "challan"
) {
  const response = await fetch('/api/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ base64Images, type })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || "Failed to extract document data");
  }

  return await response.json();
}

