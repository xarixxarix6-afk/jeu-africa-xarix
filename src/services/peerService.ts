import { Peer, type DataConnection } from 'peerjs';
import { PeerMessage } from '../types/game';

type MessageHandler = (msg: PeerMessage) => void;
type StatusHandler = (status: 'disconnected' | 'connecting' | 'connected' | 'error', peerCount: number) => void;

const PEER_CONFIG = {
  debug: 0,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 10,
  },
};

class PeerService {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private myId: string = '';
  private onMessageCallback: MessageHandler | null = null;
  private onStatusCallback: StatusHandler | null = null;
  private isHost: boolean = false;
  private retryCount: number = 0;
  private targetPeerId: string | null = null;
  private retryTimer: NodeJS.Timeout | null = null;

  public init(isHost: boolean, targetPeerId?: string, forcedHostId?: string): Promise<string> {
    this.isHost = isHost;
    this.targetPeerId = targetPeerId || null;
    this.retryCount = 0;
    this.cleanup();

    return new Promise((resolve, reject) => {
      // Determine peer ID
      let peerIdToClaim: string | undefined = undefined;

      if (isHost) {
        if (forcedHostId && forcedHostId.trim()) {
          peerIdToClaim = forcedHostId.trim();
        } else {
          const prefix = 'afro-defi-';
          const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
          peerIdToClaim = `${prefix}${randomSuffix}`;
        }
      }

      try {
        this.peer = new Peer(peerIdToClaim || '', PEER_CONFIG);

        this.peer.on('open', (id) => {
          this.myId = id;
          if (this.onStatusCallback) {
            this.onStatusCallback('connecting', 1);
          }

          if (!isHost && targetPeerId) {
            this.connectToPeer(targetPeerId);
          }
          resolve(id);
        });

        this.peer.on('connection', (conn) => {
          this.setupConnection(conn);
        });

        this.peer.on('error', (err: any) => {
          const errType = err?.type;
          const errMsg = String(err?.message || '');

          // If host ID is unavailable because it was claimed recently in same session, claim with new or retry
          if (errType === 'unavailable-id') {
            console.warn(`Peer ID ${peerIdToClaim} unavailable, retrying with fallback...`);
            if (isHost && forcedHostId) {
              // Try connecting as guest or reconnect
              this.peer?.destroy();
              this.peer = new Peer('', PEER_CONFIG);
              this.peer.on('open', (id) => {
                this.myId = id;
                resolve(id);
              });
              return;
            }
          }

          // Gracefully reconnect on transient signaling disconnect
          if (
            errType === 'lost-connection' ||
            errType === 'socket-closed' ||
            errType === 'socket-error' ||
            errMsg.includes('Lost connection')
          ) {
            if (this.peer && !this.peer.destroyed) {
              try {
                this.peer.reconnect();
              } catch {}
            }
            return;
          }

          // If peer-unavailable when connecting to target, retry after small delay
          if (errType === 'peer-unavailable' && !isHost && this.targetPeerId && this.retryCount < 4) {
            this.retryCount++;
            if (this.retryTimer) clearTimeout(this.retryTimer);
            this.retryTimer = setTimeout(() => {
              if (this.targetPeerId) {
                this.connectToPeer(this.targetPeerId);
              }
            }, 1800);
            return;
          }

          if (this.onStatusCallback) {
            this.onStatusCallback('error', 0);
          }
        });

        this.peer.on('disconnected', () => {
          if (this.peer && !this.peer.destroyed) {
            try {
              this.peer.reconnect();
            } catch {}
          } else if (this.onStatusCallback) {
            this.onStatusCallback('disconnected', 0);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  public connectToPeer(targetId: string) {
    if (!this.peer || this.peer.destroyed) return;
    this.targetPeerId = targetId;

    try {
      const conn = this.peer.connect(targetId, {
        reliable: true,
      });
      this.setupConnection(conn);
    } catch (e) {
      console.warn('Peer connection error', e);
    }
  }

  private setupConnection(conn: DataConnection) {
    this.connection = conn;

    conn.on('open', () => {
      this.retryCount = 0;
      if (this.onStatusCallback) {
        this.onStatusCallback('connected', 2);
      }
    });

    conn.on('data', (data) => {
      try {
        const msg = data as PeerMessage;
        if (this.onMessageCallback) {
          this.onMessageCallback(msg);
        }
      } catch (e) {
        console.error('Failed to parse peer message', e);
      }
    });

    conn.on('close', () => {
      if (this.onStatusCallback) {
        this.onStatusCallback('disconnected', 1);
      }
      this.connection = null;
    });

    conn.on('error', () => {
      if (this.onStatusCallback) {
        this.onStatusCallback('error', 1);
      }
    });
  }

  public sendMessage(msg: PeerMessage) {
    if (this.connection && this.connection.open) {
      try {
        this.connection.send(msg);
      } catch (e) {
        console.warn('Failed to send peer message', e);
      }
    }
  }

  public onMessage(callback: MessageHandler) {
    this.onMessageCallback = callback;
  }

  public onStatus(callback: StatusHandler) {
    this.onStatusCallback = callback;
  }

  public getMyId(): string {
    return this.myId;
  }

  public isRoomHost(): boolean {
    return this.isHost;
  }

  public isConnected(): boolean {
    return Boolean(this.connection && this.connection.open);
  }

  public cleanup() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.connection) {
      try {
        this.connection.close();
      } catch {}
      this.connection = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }
    this.myId = '';
  }
}

export const peerService = new PeerService();
