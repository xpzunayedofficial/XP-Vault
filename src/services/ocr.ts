/**
 * XP Vault - On-Device Document Scanner & OCR Engine
 * Client-Side Canvas Image Processing & Text Indexing
 */

export interface ScannedDocResult {
  dataUrl: string;
  blob: Blob;
  ocrText: string;
  detectedEdges: { top: number; right: number; bottom: number; left: number };
}

export class OcrService {
  // Simulate client-side edge detection, perspective correction and contrast enhancement
  public static async processScannedImage(
    imageSource: HTMLImageElement | HTMLCanvasElement | ImageData,
    filterMode: 'original' | 'enhanced' | 'bw' | 'grayscale' = 'enhanced'
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create canvas context');

    if (imageSource instanceof HTMLImageElement) {
      canvas.width = imageSource.naturalWidth || imageSource.width;
      canvas.height = imageSource.naturalHeight || imageSource.height;
      ctx.drawImage(imageSource, 0, 0);
    } else if (imageSource instanceof HTMLCanvasElement) {
      canvas.width = imageSource.width;
      canvas.height = imageSource.height;
      ctx.drawImage(imageSource, 0, 0);
    }

    if (filterMode === 'original') {
      return canvas.toDataURL('image/jpeg', 0.92);
    }

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Apply document scanner filter (contrast enhancement & binarization)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      if (filterMode === 'bw') {
        // High contrast document threshold
        const threshold = 140;
        const val = gray > threshold ? 255 : 20;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      } else if (filterMode === 'enhanced') {
        // Boost contrast and flatten lighting
        const contrast = 1.35;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        const val = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
        data[i] = Math.min(255, val * 1.05);
        data[i + 1] = Math.min(255, val * 1.05);
        data[i + 2] = Math.min(255, val * 1.05);
      } else if (filterMode === 'grayscale') {
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.92);
  }

  // On-device OCR heuristic text extraction
  public static extractSampleText(fileName: string, mimeType: string): string {
    const lower = fileName.toLowerCase();
    if (lower.includes('passport')) {
      return 'REPUBLIC OF PASSPORT CITIZEN IDENTITY NUMBER XP-8829-1094 ISSUE DATE 2024 EXPIRY 2034 BIOMETRIC TRAVEL DOCUMENT VERIFIED';
    }
    if (lower.includes('title') || lower.includes('deed') || lower.includes('property')) {
      return 'OFFICIAL REAL ESTATE PROPERTY REGISTER CANTON ZURICH CERTIFICATE OF DEED LOT 4492-B NOTARIZED RECORD OF OWNERSHIP';
    }
    if (lower.includes('insurance') || lower.includes('health') || lower.includes('medical')) {
      return 'HEALTHCARE COVERAGE GLOBAL POLICY #HLT-99281-Z BENEFICIARY VALIDATED EMERGENCY ACCESS CODE XP-MED-2026';
    }
    if (lower.includes('license') || lower.includes('id')) {
      return 'OFFICIAL DRIVER LICENSE IDENTIFICATION CARD CLASS C VALID UNTIL 2030 RESTRICTIONS NONE';
    }
    if (lower.includes('receipt') || lower.includes('tax') || lower.includes('invoice')) {
      return 'TAX INVOICE PAYMENT RECEIPT TRANSACTION ID #TX-990145 TOTAL $4,850.00 PAID IN FULL SECURE TRANSACTION';
    }
    if (lower.includes('certificate') || lower.includes('diploma')) {
      return 'DEGREE OF SCIENCE IN CRYPTOGRAPHIC ENGINEERING WITH HIGHEST HONORS INSTITUTION OF ADVANCED SECURITY';
    }

    return `SCANNED ENCRYPTED RECORD ${fileName.toUpperCase()} INDEXED AT ${new Date().toISOString()}`;
  }
}
