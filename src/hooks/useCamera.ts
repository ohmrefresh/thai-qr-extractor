import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  type CameraDevice,
  type Html5QrcodeResult,
} from 'html5-qrcode';

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
  loadCameras: () => Promise<void>;
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

  const loadCameras = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      setCameraError('Camera access is not supported on this browser.');
      return;
    }

    setIsLoadingCameras(true);
    setCameraError(null);

    try {
      const devices = await Html5Qrcode.getCameras();

      if (!isMountedRef.current) {
        return;
      }

      setAvailableCameras(devices);

      if (devices.length === 0) {
        updateSelectedCamera('');
        setCameraError('No camera devices found. Connect a camera or allow access and try again.');
        return;
      }

      const currentSelection = selectedCameraRef.current;
      const fallbackCameraId = devices.some((device) => device.id === currentSelection)
        ? currentSelection
        : devices[0].id;

      updateSelectedCamera(fallbackCameraId);
    } catch (error) {
      console.error('Failed to load cameras', error);
      if (isMountedRef.current) {
        setCameraError('Unable to access camera devices. Check browser permissions and reload.');
        setAvailableCameras([]);
        updateSelectedCamera('');
      }
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

      const cameraId = cameraIdOverride || selectedCameraRef.current || availableCameras[0]?.id;

      if (!cameraId) {
        setCameraError('Select a camera before starting the scanner.');
        return;
      }

      setCameraError(null);
      setIsStarting(true);
      updateSelectedCamera(cameraId);

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

        if (isMountedRef.current) {
          setIsScanning(true);
        }
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
    [availableCameras, containerId, isScanning, isStarting, isStopping, onScanError, onScanSuccess, stopScanning, updateSelectedCamera]
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
    loadCameras();

    return () => {
      isMountedRef.current = false;
      stopScanning(false);
    };
  }, [loadCameras, stopScanning]);

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
