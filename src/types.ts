export interface GasEvento {
  id: string | number;
  created_at: string;
  valor_gas: number;
  alerta: boolean;
}

export interface Configuracion {
  id: number;
  umbral_gas: number;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  wifi_ssid: string;
  wifi_password?: string;
  notif_email: boolean;
  notif_sms: boolean;
}
