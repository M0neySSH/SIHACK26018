import * as XLSX from "xlsx";

function flattenObject(obj: any, prefix = ""): any {
  let flattened: any = {};
  
  if (obj === null || obj === undefined) return flattened;
  
  for (const key in obj) {
    if (key === "items") continue; // We handle items separately
    
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      const nested = flattenObject(obj[key], `${prefix}${key}_`);
      flattened = { ...flattened, ...nested };
    } else {
      flattened[`${prefix}${key}`] = obj[key];
    }
  }
  
  return flattened;
}

export function exportToExcel(data: any, type: "invoice" | "challan", filename: string) {
  // Flatten all the root-level metadata
  const metadata = flattenObject(data);
  
  const rows: any[] = [];
  const items = Array.isArray(data.items) ? data.items : [];
  
  if (items.length === 0) {
    // If no items, just output one row with metadata
    rows.push(metadata);
  } else {
    // If there are items, create a row for each item combining metadata and item data
    for (const item of items) {
      const flattenedItem = flattenObject(item, "item_");
      rows.push({
        ...metadata,
        ...flattenedItem
      });
    }
  }
  
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  
  XLSX.writeFile(workbook, filename);
}
