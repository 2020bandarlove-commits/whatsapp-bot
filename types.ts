
export enum BotStatus {
  CONNECTED = 'Connected',
  DISCONNECTED = 'Disconnected',
  CONNECTING = 'Connecting'
}

export interface Command {
  id: string;
  trigger: string;
  response: string;
}

export interface WhatsAppMessage {
  at: string;
  from: string;
  text: string;
}

export interface SystemEvent {
  id: string;
  type: 'status' | 'qr' | 'pairing' | 'message' | 'log';
  message: string;
  timestamp: string;
}

export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
}

export interface PairingData {
  pairingCode: string | null;
  qrPngBase64: string | null;
}
