import { apiClient } from "@/services/api";

const EXPORTS_API_BASE = "/api/exports";

function parseFileName(contentDispositionHeader: string | undefined, fallbackFileName: string): string {
  if (!contentDispositionHeader) {
    return fallbackFileName;
  }

  const utf8FileNameMatch = contentDispositionHeader.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8FileNameMatch?.[1]) {
    return decodeURIComponent(utf8FileNameMatch[1].trim().replace(/["']/g, ""));
  }

  const basicFileNameMatch = contentDispositionHeader.match(/filename=([^;]+)/i);
  if (basicFileNameMatch?.[1]) {
    return basicFileNameMatch[1].trim().replace(/["']/g, "");
  }

  return fallbackFileName;
}

function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const fileUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = fileUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(fileUrl);
}

async function downloadCsvFile(endpoint: string, fallbackFileName: string): Promise<void> {
  const response = await apiClient.get<Blob>(endpoint, {
    responseType: "blob",
    headers: {
      Accept: "text/csv",
    },
  });

  const fileName = parseFileName(response.headers["content-disposition"], fallbackFileName);
  const csvBlob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: "text/csv" });

  triggerBrowserDownload(csvBlob, fileName);
}

export function downloadEquipmentsCsv(): Promise<void> {
  return downloadCsvFile(`${EXPORTS_API_BASE}/equipments/csv`, "equipments_export.csv");
}

export function downloadBreakdownsCsv(): Promise<void> {
  return downloadCsvFile(`${EXPORTS_API_BASE}/breakdowns/csv`, "breakdowns_export.csv");
}

export function downloadWorkOrdersCsv(): Promise<void> {
  return downloadCsvFile(`${EXPORTS_API_BASE}/work-orders/csv`, "work_orders_export.csv");
}
