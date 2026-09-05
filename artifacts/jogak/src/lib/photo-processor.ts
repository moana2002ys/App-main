/**
 * 스텝바이스탭 (StepByStep) — 사진 프라이버시 처리 유틸 (EXIF 제거 & 캔버스 재인코딩)
 */

export interface ProcessedPhotoResult {
  dataUrl: string;
  isBlur: boolean;
}

export function cleanAndCompressPhoto(
  file: File,
  blur: boolean = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas Context 생성 실패'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        // 프라이버시 보호 (흐리게 보관 모드)
        if (blur) {
          ctx.filter = 'blur(12px) sepia(20%)';
          ctx.drawImage(canvas, 0, 0);
        }

        // EXIF 제거: Canvas toDataURL 재인코딩으로 메타데이터 자동 제거
        const cleanDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(cleanDataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
