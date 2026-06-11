import type { WebRtcIceCandidate, WebRtcSdp } from "@hien-nha/shared";

export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL?.trim();
  if (turnUrl) {
    const urls = turnUrl
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);
    servers.push({
      urls: urls.length === 1 ? urls[0]! : urls,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    });
  }

  return servers;
}

export class VoiceCallEngine {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private preparePromise: Promise<void> | null = null;
  private remoteDescriptionSet = false;
  private pendingIceCandidates: WebRtcIceCandidate[] = [];
  private onIceCandidate: ((candidate: WebRtcIceCandidate) => void) | null = null;
  private onRemoteStream: ((stream: MediaStream) => void) | null = null;
  private onConnectionState: ((state: RTCPeerConnectionState) => void) | null = null;

  setHandlers(handlers: {
    onIceCandidate?: (candidate: WebRtcIceCandidate) => void;
    onRemoteStream?: (stream: MediaStream) => void;
    onConnectionState?: (state: RTCPeerConnectionState) => void;
  }): void {
    this.onIceCandidate = handlers.onIceCandidate ?? null;
    this.onRemoteStream = handlers.onRemoteStream ?? null;
    this.onConnectionState = handlers.onConnectionState ?? null;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  async prepare(): Promise<void> {
    if (this.pc) return;
    if (this.preparePromise) return this.preparePromise;

    this.preparePromise = this.doPrepare();
    try {
      await this.preparePromise;
    } finally {
      this.preparePromise = null;
    }
  }

  private async doPrepare(): Promise<void> {
    if (this.pc) return;

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    this.pc = new RTCPeerConnection({ iceServers: getIceServers() });

    for (const track of this.localStream.getTracks()) {
      this.pc.addTrack(track, this.localStream);
    }

    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        this.onIceCandidate({
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          usernameFragment: event.candidate.usernameFragment,
        });
      }
    };

    this.pc.ontrack = (event) => {
      let stream = event.streams[0];
      if (!stream) {
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        stream = this.remoteStream;
        if (!stream.getTracks().includes(event.track)) {
          stream.addTrack(event.track);
        }
      }
      this.remoteStream = stream;
      this.onRemoteStream?.(stream);
    };

    this.pc.onconnectionstatechange = () => {
      if (this.pc) this.onConnectionState?.(this.pc.connectionState);
    };
  }

  private async drainPendingIceCandidates(): Promise<void> {
    if (!this.pc) return;
    const pending = this.pendingIceCandidates;
    this.pendingIceCandidates = [];
    for (const candidate of pending) {
      await this.addIceCandidate(candidate);
    }
  }

  async createOffer(): Promise<WebRtcSdp> {
    if (!this.pc) await this.prepare();
    const offer = await this.pc!.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false,
    });
    await this.pc!.setLocalDescription(offer);
    return {
      type: offer.type as WebRtcSdp["type"],
      sdp: offer.sdp ?? "",
    };
  }

  async handleOffer(sdp: WebRtcSdp): Promise<WebRtcSdp> {
    if (!this.pc) await this.prepare();
    await this.pc!.setRemoteDescription(
      new RTCSessionDescription(sdp as RTCSessionDescriptionInit),
    );
    this.remoteDescriptionSet = true;
    await this.drainPendingIceCandidates();
    const answer = await this.pc!.createAnswer();
    await this.pc!.setLocalDescription(answer);
    return {
      type: answer.type as WebRtcSdp["type"],
      sdp: answer.sdp ?? "",
    };
  }

  async handleAnswer(sdp: WebRtcSdp): Promise<void> {
    if (!this.pc) return;
    await this.pc.setRemoteDescription(
      new RTCSessionDescription(sdp as RTCSessionDescriptionInit),
    );
    this.remoteDescriptionSet = true;
    await this.drainPendingIceCandidates();
  }

  async addIceCandidate(candidate: WebRtcIceCandidate): Promise<void> {
    if (!this.pc || !candidate.candidate) return;
    if (!this.remoteDescriptionSet) {
      this.pendingIceCandidates.push(candidate);
      return;
    }
    try {
      await this.pc.addIceCandidate(
        new RTCIceCandidate(candidate as RTCIceCandidateInit),
      );
    } catch {
      // ignore late or duplicate candidates
    }
  }

  setMuted(muted: boolean): void {
    for (const track of this.localStream?.getAudioTracks() ?? []) {
      track.enabled = !muted;
    }
  }

  destroy(): void {
    this.pc?.close();
    this.pc = null;
    this.preparePromise = null;
    this.remoteDescriptionSet = false;
    this.pendingIceCandidates = [];
    for (const track of this.localStream?.getTracks() ?? []) {
      track.stop();
    }
    this.localStream = null;
    this.remoteStream = null;
  }
}
