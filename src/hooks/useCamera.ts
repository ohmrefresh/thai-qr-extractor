import { useState, useRef, useCallback, useEffect } from 'react';
import type { Html5Qrcode, CameraDevice, Html5QrcodeResult } from 'html5-qrcode';

// html5-qrcode is ~108 kB gzipped, more than the rest of the app. Load it when the
// user asks for the camera rather than whenever the Camera tab is shown.
const loadScannerLibrary = () => import('html5-qrcode');

interface UseCameraOptions {
  containerId: string;
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
}

interface UseCameraReturn {
  availableCameras: CameraDevice[];
  selectedCameraId: string;
  cameraError: string | null;
  isLoadingCameras: boolean;
  isStarting: boolean;
  isScanning: boolean;
  isStopping: boolean;
  startScanning: (cameraIdOverride?: string) => Promise<void>;
  stopScanning: (showLoading?: boolean) => Promise<void>;
  loadCameras: () => Promise<CameraDevice[]>;
  updateSelectedCamera: (cameraId: string) => void;
  handleCameraChange: (event: React.ChangeEvent<HTMLSelectElement>) => Promise<void>;
  handleRefreshCameras: () => Promise<void>;
}

export const useCamera = ({
  containerId,
  onScanSuccess,
  onScanError,
}: UseCameraOptions): UseCameraReturn => {
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCameras, setIsLoadingCameras] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const selectedCameraRef = useRef<string>('');

  const updateSelectedCamera = useCallback((cameraId: string) => {
    selectedCameraRef.current = cameraId;
    setSelectedCameraId(cameraId);
  }, []);

  const stopScanning = useCallback(async (showLoading = true) => {
    const scanner = scannerRef.current;
    if (!scanner) {
      return;
    }

    if (showLoading && isMountedRef.current) {
      setIsStopping(true);
    }

    try {
      await scanner.stop();
    } catch (error) {
      console.warn('Failed to stop QR scanner', error);
    }

    try {
      await scanner.clear();
    } catch (error) {
      console.warn('Failed to clear QR scanner', error);
    }

    if (scannerRef.current === scanner) {
      scannerRef.current = null;
    }

    if (isMountedRef.current) {
      setIsScanning(false);
      if (showLoading) {
        setIsStopping(false);
      }
    }
  }, []);

  // Listing cameras opens a permission prompt (html5-qrcode calls getUserMedia),
  // so it only runs when the user asks to scan, never on mount.
  const loadCameras = useCallback(async (): Promise<CameraDevice[]> => {
    if (typeof window === 'undefined') {
      return [];
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      setCameraError('Camera access is not supported on this browser.');
      return [];
    }

    setIsLoadingCameras(true);
    setCameraError(null);

    try {
      const { Html5Qrcode } = await loadScannerLibrary();
      const devices = await Html5Qrcode.getCameras();

      if (!isMountedRef.current) {
        return devices;
      }

      setAvailableCameras(devices);

      if (devices.length === 0) {
        updateSelectedCamera('');
        setCameraError('No camera devices found. Connect a camera or allow access and try again.');
        return devices;
      }

      const currentSelection = selectedCameraRef.current;
      const fallbackCameraId = devices.some((device) => device.id === currentSelection)
        ? currentSelection
        : devices[0].id;

      updateSelectedCamera(fallbackCameraId);
      return devices;
    } catch (error) {
      console.error('Failed to load cameras', error);
      if (isMountedRef.current) {
        setCameraError('Unable to access camera devices. Check browser permissions and reload.');
        setAvailableCameras([]);
        updateSelectedCamera('');
      }
      return [];
    } finally {
      if (isMountedRef.current) {
        setIsLoadingCameras(false);
      }
    }
  }, [updateSelectedCamera]);

  const startScanning = useCallback(
    async (cameraIdOverride?: string) => {
      if (isScanning || isStarting || isStopping) {
        return;
      }

      setCameraError(null);
      setIsStarting(true);

      let cameraId = cameraIdOverride || selectedCameraRef.current || availableCameras[0]?.id;

      if (!cameraId) {
        // First start: ask for camera access now that the user has requested it
        const devices = await loadCameras();
        cameraId = selectedCameraRef.current || devices[0]?.id;
        if (!cameraId) {
          // loadCameras has already reported why
          if (isMountedRef.current) {
            setIsStarting(false);
          }
          return;
        }
      }

      updateSelectedCamera(cameraId);

      let scannerLibrary: Awaited<ReturnType<typeof loadScannerLibrary>>;
      try {
        scannerLibrary = await loadScannerLibrary();
      } catch (error) {
        console.error('Failed to load the QR scanner', error);
        if (isMountedRef.current) {
          setCameraError("Couldn't load the camera scanner. Check your connection and try again.");
          setIsStarting(false);
        }
        return;
      }
      if (!isMountedRef.current) {
        return;
      }
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = scannerLibrary;
      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 12,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0,
        disableFlip: false,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      };

      try {
        await html5QrCode.start(
          cameraId,
          config,
          async (decodedText: string, _decodedResult: Html5QrcodeResult) => {
            onScanSuccess(decodedText);
            await stopScanning(false);
          },
          () => {
            // Ignore frame-level decode errors; the scanner keeps running.
          }
        );

        if (!isMountedRef.current) {
          // Unmounted while the camera was starting: stop() would have thrown during
          // cleanup because the scanner wasn't running yet, so release the stream now.
          try {
            await html5QrCode.stop();
            await html5QrCode.clear();
          } catch (error) {
            console.warn('Failed to release camera after unmount', error);
          }
          if (scannerRef.current === html5QrCode) {
            scannerRef.current = null;
          }
          return;
        }

        setIsScanning(true);
      } catch (error) {
        console.error('Unable to start QR scanner', error);
        if (isMountedRef.current) {
          setCameraError('Unable to start the camera. Confirm permissions and try again.');
          if (onScanError) {
            onScanError('Unable to start the camera. Confirm permissions and try again.');
          }
        }
        scannerRef.current = null;
      } finally {
        if (isMountedRef.current) {
          setIsStarting(false);
        }
      }
    },
    [availableCameras, containerId, isScanning, isStarting, isStopping, loadCameras, onScanError, onScanSuccess, stopScanning, updateSelectedCamera]
  );

  const handleCameraChange = useCallback(
    async (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newCameraId = event.target.value;
      updateSelectedCamera(newCameraId);

      if (isScanning) {
        await stopScanning(false);
        await startScanning(newCameraId);
      }
    },
    [isScanning, startScanning, stopScanning, updateSelectedCamera]
  );

  const handleRefreshCameras = useCallback(async () => {
    if (isScanning) {
      await stopScanning(false);
    }
    await loadCameras();
  }, [isScanning, loadCameras, stopScanning]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      stopScanning(false);
    };
  }, [stopScanning]);

  return {
    availableCameras,
    selectedCameraId,
    cameraError,
    isLoadingCameras,
    isStarting,
    isScanning,
    isStopping,
    startScanning,
    stopScanning,
    loadCameras,
    updateSelectedCamera,
    handleCameraChange,
    handleRefreshCameras,
  };
};
