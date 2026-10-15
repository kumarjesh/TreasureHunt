import mqtt, { MqttClient } from 'mqtt';

export interface SyncMessage {
  clientId: string;
  type: 'MUTATION' | 'REQUEST_SYNC' | 'FULL_SYNC';
  key?: string;
  data?: any;
  fullState?: Record<string, any>;
  ts: number;
}

type StatusCallback = (connected: boolean) => void;
const statusListeners = new Set<StatusCallback>();

let client: MqttClient | null = null;
let isConnected = false;
const CLIENT_ID = 'hs_' + Math.random().toString(36).substring(2, 9);
const SYNC_TOPIC = 'hacksprint/cyber-matrix-2026/sync';

let remoteMutationHandler: ((key: string, data: any) => void) | null = null;
let fullStateProvider: (() => Record<string, any>) | null = null;
let fullStateApplier: ((state: Record<string, any>) => void) | null = null;

export const CloudSync = {
  getClientId(): string {
    return CLIENT_ID;
  },

  isConnected(): boolean {
    return isConnected;
  },

  onStatusChange(callback: StatusCallback): () => void {
    statusListeners.add(callback);
    callback(isConnected);
    return () => statusListeners.delete(callback);
  },

  init(
    onRemoteMutation: (key: string, data: any) => void,
    getFullState: () => Record<string, any>,
    onApplyFullState: (state: Record<string, any>) => void
  ) {
    if (client) return;

    remoteMutationHandler = onRemoteMutation;
    fullStateProvider = getFullState;
    fullStateApplier = onApplyFullState;

    try {
      // Connect to HiveMQ Public Secure WebSocket Broker
      client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
        clientId: CLIENT_ID,
        clean: true,
        connectTimeout: 8000,
        reconnectPeriod: 3000,
        keepalive: 30,
      });

      client.on('connect', () => {
        console.log('[HACKSPRINT CLOUD SYNC] Connected to global realtime broker as:', CLIENT_ID);
        isConnected = true;
        statusListeners.forEach(fn => fn(true));

        client?.subscribe(SYNC_TOPIC, { qos: 1 }, (err) => {
          if (!err) {
            // Request latest state from other peers (e.g. laptop or mobile)
            this.send({
              clientId: CLIENT_ID,
              type: 'REQUEST_SYNC',
              ts: Date.now()
            });
          }
        });
      });

      client.on('message', (_topic, payload) => {
        try {
          const raw = payload.toString();
          const msg: SyncMessage = JSON.parse(raw);

          // Discard messages originating from this client
          if (msg.clientId === CLIENT_ID) return;

          if (msg.type === 'MUTATION' && msg.key && msg.data !== undefined) {
            remoteMutationHandler?.(msg.key, msg.data);
          } else if (msg.type === 'REQUEST_SYNC') {
            // Send our current state so the newly connected peer has everything
            if (fullStateProvider) {
              const currentState = fullStateProvider();
              this.send({
                clientId: CLIENT_ID,
                type: 'FULL_SYNC',
                fullState: currentState,
                ts: Date.now()
              });
            }
          } else if (msg.type === 'FULL_SYNC' && msg.fullState) {
            fullStateApplier?.(msg.fullState);
          }
        } catch (e) {
          console.warn('[HACKSPRINT CLOUD SYNC] Error parsing incoming sync message:', e);
        }
      });

      client.on('close', () => {
        if (isConnected) {
          isConnected = false;
          statusListeners.forEach(fn => fn(false));
        }
      });

      client.on('error', (err) => {
        console.warn('[HACKSPRINT CLOUD SYNC] Realtime sync error:', err);
      });
    } catch (e) {
      console.warn('[HACKSPRINT CLOUD SYNC] Could not start cloud sync:', e);
    }
  },

  send(msg: SyncMessage) {
    if (!client || !client.connected) return;
    try {
      client.publish(SYNC_TOPIC, JSON.stringify(msg), { qos: 1 });
    } catch (e) {
      console.warn('[HACKSPRINT CLOUD SYNC] Publish error:', e);
    }
  },

  broadcastMutation(key: string, data: any) {
    this.send({
      clientId: CLIENT_ID,
      type: 'MUTATION',
      key,
      data,
      ts: Date.now()
    });
  }
};
