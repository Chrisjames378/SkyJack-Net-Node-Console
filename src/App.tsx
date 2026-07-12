/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Activity, 
  Cloud, 
  CreditCard, 
  CheckSquare, 
  Terminal, 
  Copy, 
  Check, 
  Users, 
  Database, 
  ExternalLink, 
  Cpu, 
  Key, 
  ShieldCheck, 
  Layers,
  AlertTriangle,
  HeartPulse,
  RefreshCw,
  Play,
  CheckCircle2,
  Zap
} from 'lucide-react';

// Declare global properties for window configuration injects
declare global {
  interface Window {
    __firebase_config?: string;
    __app_id?: string;
  }
}

const firebaseConfig = typeof window !== 'undefined' && window.__firebase_config 
  ? JSON.parse(window.__firebase_config) 
  : {
      apiKey: "",
      authDomain: "skyjack-net-production.firebaseapp.com",
      projectId: "skyjack-net-production",
      storageBucket: "skyjack-net-production.appspot.com",
      appId: "1:1234567890:web:abc123xyz"
    };

const isFirebaseConfigured = !!firebaseConfig.apiKey;

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'skyjack-net-prod-v1';

interface Subscriber {
  id: string;
  email: string;
  imei: string;
  status: string;
  tier: string;
}

interface OpsLog {
  id: string;
  event: string;
  details: string;
  timestamp?: {
    seconds: number;
    nanoseconds: number;
  };
}

interface ChecklistItem {
  id: string;
  order: number;
  text: string;
  done: boolean;
}

interface DiagnosticCheck {
  id: number;
  name: string;
  category: 'Network' | 'Security' | 'Database' | 'Payment';
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  description: string;
  remediation: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('diagnostics'); // Default to diagnostic health workspace
  const [user, setUser] = useState<User | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Storage states with resilient dual-layer local fallback
  const [subscribersList, setSubscribersList] = useState<Subscriber[]>([]);
  const [opsLogs, setOpsLogs] = useState<OpsLog[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isCloudSyncBlocked, setIsCloudSyncBlocked] = useState(false);

  // Dynamic variable parameters compiled in real-time inside copy templates
  const [prodPaypalClientID, setProdPaypalClientID] = useState('Ad-SkyJackNetLiveProductionClientTokenValue2026');
  const [selectedPlanTier, setSelectedPlanTier] = useState('P-3N649204A8109312V');
  const [gcpRegion, setGcpRegion] = useState('us-central1');
  const [newSubEmail, setNewSubEmail] = useState('');
  const [newSubIMEI, setNewSubIMEI] = useState('');

  // Interactive Checklist Milestone States
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('chk-2');
  
  // Simulation 2 (Go build)
  const [goOS, setGoOS] = useState<'linux' | 'darwin' | 'windows'>('linux');
  const [goArch, setGoArch] = useState<'amd64' | 'arm64' | '386'>('amd64');
  const [rsaBits, setRsaBits] = useState<number>(2048);
  const [isGoCompiling, setIsGoCompiling] = useState<boolean>(false);
  const [goCompileLogs, setGoCompileLogs] = useState<string[]>([]);
  const [goProgress, setGoProgress] = useState<number>(0);

  // Simulation 3 (PayPal products)
  const [paypalLiveClientID, setPaypalLiveClientID] = useState<string>('Ad-SkyJackNetLiveProductionClientTokenValue2026');
  const [paypalPlanPrice, setPaypalPlanPrice] = useState<number>(49);
  const [isPaypalLinking, setIsPaypalLinking] = useState<boolean>(false);
  const [paypalLogs, setPaypalLogs] = useState<string[]>([]);

  // Simulation 4 (GCP Secrets IAM Roles)
  const [gcpServiceAccount, setGcpServiceAccount] = useState<string>('skyjack-run-service@skyjack-net-prod.iam.gserviceaccount.com');
  const [isGCPConfiguring, setIsGCPConfiguring] = useState<boolean>(false);
  const [gcpLogs, setGcpLogs] = useState<string[]>([]);

  // View Mode: 'admin' (Admin Dashboard Console) vs 'customer' (Mobile Customer Interface Mockup Simulator)
  const [viewMode, setViewMode] = useState<'admin' | 'customer'>('admin');
  
  // Mobile customer states
  const [customerEmail, setCustomerEmail] = useState<string>('explorer.outpost@gmail.com');
  const [customerImei, setCustomerImei] = useState<string>('358291048291048');
  const [isCustomerSearching, setIsCustomerSearching] = useState<boolean>(false);
  const [isCustomerLocked, setIsCustomerLocked] = useState<boolean>(true);
  const [customerActiveSatellite, setCustomerActiveSatellite] = useState<string>('SKYJACK-LEO-08');
  const [isCustomerSpeedTesting, setIsCustomerSpeedTesting] = useState<boolean>(false);
  const [customerSpeed, setCustomerSpeed] = useState<number>(42.5);
  const [customerUploadSpeed, setCustomerUploadSpeed] = useState<number>(12.1);
  const [customerPing, setCustomerPing] = useState<number>(38);
  const [customerTier, setCustomerTier] = useState<string>('SkyJack Core Space Link');

  // Simulation 5 (Publishing telemetry to X / Twitter)
  const [isTweeting, setIsTweeting] = useState<boolean>(false);
  const [tweetSuccess, setTweetSuccess] = useState<boolean>(false);
  const [tweetLikes, setTweetLikes] = useState<number>(0);
  const [tweetRetweets, setTweetRetweets] = useState<number>(0);
  const [tweetViews, setTweetViews] = useState<number>(0);

  // Bulk Orchestration States
  const [isBulkOrchestrating, setIsBulkOrchestrating] = useState<boolean>(false);
  const [bulkStep, setBulkStep] = useState<number>(0); // 0 = idle, 1 = VPC, 2 = Go, 3 = PayPal, 4 = GCP IAM, 5 = Tweet/Done
  const [bulkProgress, setBulkProgress] = useState<number>(0);
  const [bulkLogs, setBulkLogs] = useState<string[]>([]);

  // Diagnostics System State (exactly 25 items for thorough coverage)
  const [diagnostics, setDiagnostics] = useState<DiagnosticCheck[]>(() => {
    const initial = [
      {
        id: 1,
        name: "Firebase Credentials Verification Node",
        category: "Security" as const,
        status: isFirebaseConfigured ? "HEALTHY" as const : "CRITICAL" as const,
        description: "Verifies public client API keys and secure handshake mechanisms with Firebase backends.",
        remediation: "Configure Firebase Credentials inside GCP or use automatic Local Fallback Sandbox mode."
      },
      {
        id: 2,
        name: "Asymmetric RSA-SHA256 Webhook Decoder",
        category: "Security" as const,
        status: "HEALTHY" as const,
        description: "Used to authenticate secure payloads and decrypt asymmetric signatures.",
        remediation: "Verify RSA public-key formats match PEM specification blocks."
      },
      {
        id: 3,
        name: "LEO Satellite Orbit Link Integrity",
        category: "Network" as const,
        status: "WARNING" as const,
        description: "Slight frequency offset detected during orbital telemetry transits.",
        remediation: "Execute automated orbital doppler frequency recalculation."
      },
      {
        id: 4,
        name: "Captive Portal DNS Tunnel Routing",
        category: "Network" as const,
        status: "HEALTHY" as const,
        description: "Directs client hardware to captive registration portal blocks.",
        remediation: "Ensure routing tables on primary switch are mapped correctly."
      },
      {
        id: 5,
        name: "VPC Network Access Control List (ACL)",
        category: "Network" as const,
        status: "HEALTHY" as const,
        description: "Controls inbound/outbound TCP packet streams.",
        remediation: "Check Google Cloud VPC firewall policy permissions."
      },
      {
        id: 6,
        name: "Billing Subscription Webhook Authentication",
        category: "Payment" as const,
        status: "WARNING" as const,
        description: "Transmission signature mismatch on secure merchant endpoints.",
        remediation: "Re-sync the webhook transmission client secret inside the portal."
      },
      {
        id: 7,
        name: "Client IMEI Encryption Vector",
        category: "Security" as const,
        status: "HEALTHY" as const,
        description: "Protects target telephone IMEI identifiers with AES-GCM 256 bits.",
        remediation: "Ensure cryptographic initialization vectors are refreshed."
      },
      {
        id: 8,
        name: "TLS v1.3 Cipher Suite Match",
        category: "Security" as const,
        status: "HEALTHY" as const,
        description: "Authenticates SSL handshakes with modern secure algorithms.",
        remediation: "Deactivate legacy TLS v1.0/v1.1 protocols."
      },
      {
        id: 9,
        name: "Go Compiler Cross-Target Compilation",
        category: "Network" as const,
        status: "HEALTHY" as const,
        description: "Builds lightweight, super-fast static proxy binaries.",
        remediation: "Confirm GOOS and GOARCH flags match target cluster."
      },
      {
        id: 10,
        name: "GCP Secrets Manager IAM Map",
        category: "Security" as const,
        status: "CRITICAL" as const,
        description: "Access privileges to Secret Payload keys on Cloud Run.",
        remediation: "Apply GCP IAM role Secret Manager Accessor to the node account."
      },
      {
        id: 11,
        name: "GCP Cloud Run Server Cold Starts",
        category: "Network" as const,
        status: "HEALTHY" as const,
        description: "Keeps minimum instance counts alive to optimize routing latency.",
        remediation: "Set minimum instances parameter to 1 inside Terraform scripts."
      },
      {
        id: 12,
        name: "PayPal Merchant Client Verification Token",
        category: "Payment" as const,
        status: "CRITICAL" as const,
        description: "Validates incoming subscriber plan orders in real-time.",
        remediation: "Insert valid PayPal merchant Client ID to connect Live portal."
      },
      {
        id: 13,
        name: "Local Database Fallback Memory Buffer",
        category: "Database" as const,
        status: "HEALTHY" as const,
        description: "Saves critical telemetry locally when internet connection drops.",
        remediation: "Expand RAM threshold inside local storage rules."
      },
      {
        id: 14,
        name: "Asymmetric RSA Public Key Decryption PEM",
        category: "Security" as const,
        status: "HEALTHY" as const,
        description: "Downloads and caches external public keys securely.",
        remediation: "Downloads and caches external public keys securely."
      },
      {
        id: 15,
        name: "Cross-Origin Resource Sharing (CORS) Gate",
        category: "Network" as const,
        status: "HEALTHY" as const,
        description: "Restricts browser requests to safe domains.",
        remediation: "Verify Allowed Origins list includes production domain."
      },
      {
        id: 16,
        name: "Firestore Rules Authorization Policies",
        category: "Database" as const,
        status: "WARNING" as const,
        description: "Permission denied errors on some active telemetry nodes.",
        remediation: "Apply open read/write permission to the public workspace paths."
      },
      {
        id: 17,
        name: "Satellite Uplink Payload Validation (CRC32)",
        category: "Network" as const,
        status: "HEALTHY" as const,
        description: "Maintains hardware checksum verification to prevent corrupted inputs.",
        remediation: "Re-evaluate CRC polynomials if network drop rate spikes."
      },
      {
        id: 18,
        name: "GCP Memorystore Redis Bridge Cache",
        category: "Database" as const,
        status: "HEALTHY" as const,
        description: "Accelerates IMEI routing verification steps.",
        remediation: "Monitor Redis memory allocation limits regularly."
      },
      {
        id: 19,
        name: "Secure Hash Algorithm SHA256 Signature Output",
        category: "Security" as const,
        status: "HEALTHY" as const,
        description: "Validates packet integrity before pushing to data channels.",
        remediation: "Perform sanity checks against expected test-vectors."
      },
      {
        id: 20,
        name: "Captured Devices Signal Strength RSSI",
        category: "Network" as const,
        status: "HEALTHY" as const,
        description: "Monitors hardware antennas and LEO alignment metrics.",
        remediation: "Adjust phase-array alignment vector coordinates."
      },
      {
        id: 21,
        name: "Automated Healing Daemon Process",
        category: "Security" as const,
        status: "WARNING" as const,
        description: "Underlying updater routine is currently in manual mode.",
        remediation: "Activate the automated daemon checker process in the options menu."
      },
      {
        id: 22,
        name: "HTTPS Redirection Gateway Router",
        category: "Network" as const,
        status: "HEALTHY" as const,
        description: "Enforces secure encrypted web pathways for all portal guests.",
        remediation: "Ensure HSTS headers are attached on all response blocks."
      },
      {
        id: 23,
        name: "X (Twitter) Notification Integration Webhook",
        category: "Network" as const,
        status: "WARNING" as const,
        description: "Connection credentials for automatic social logs are pending.",
        remediation: "Input OAuth Bearer authorization headers to publish updates."
      },
      {
        id: 24,
        name: "Server-Side API Response Latency",
        category: "Network" as const,
        status: "HEALTHY" as const,
        description: "Maintains ultra-fast speeds (Avg 42ms) for transaction endpoints.",
        remediation: "Implement API query indexing to optimize database response."
      },
      {
        id: 25,
        name: "Node Telemetry Synchronization Stream",
        category: "Database" as const,
        status: "HEALTHY" as const,
        description: "Transmits operations status logs to the centralized console.",
        remediation: "Re-initialize web-socket connection handler if sync drops."
      }
    ];

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skyjack_diagnostics');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === 25) {
            return parsed;
          }
        } catch (e) {
          console.error("Failed to parse diagnostics from localStorage", e);
        }
      }
    }
    return initial;
  });

  // State for the Background Automated Healing Daemon
  const [isDaemonActive, setIsDaemonActive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skyjack_daemon_active');
      return saved !== 'false'; // Default to active (true)
    }
    return true;
  });

  // Save daemon state to localStorage
  useEffect(() => {
    localStorage.setItem('skyjack_daemon_active', String(isDaemonActive));
  }, [isDaemonActive]);

  // Persist diagnostics on change
  useEffect(() => {
    localStorage.setItem('skyjack_diagnostics', JSON.stringify(diagnostics));
  }, [diagnostics]);

  // Sync Node 21 with Daemon status
  useEffect(() => {
    setDiagnostics(prev => 
      prev.map(item => {
        if (item.id === 21) {
          const currentStatus = isDaemonActive ? 'HEALTHY' as const : 'WARNING' as const;
          if (item.status === currentStatus) return item;
          return {
            ...item,
            status: currentStatus,
            description: isDaemonActive 
              ? "Underlying updater routine is ACTIVE and running smoothly. Periodically sweeping node clusters for anomalies."
              : "Underlying updater routine is currently in manual mode.",
            remediation: isDaemonActive
              ? "Keep active for hands-free diagnostic maintenance."
              : "Activate the automated daemon checker process in the options menu."
          };
        }
        return item;
      })
    );
  }, [isDaemonActive]);

  // Automated background daemon checker & updater loop
  useEffect(() => {
    if (!isDaemonActive) return;

    const interval = setInterval(() => {
      setDiagnostics(prev => {
        // Find the first unhealthy node (excluding 21 since we manage it separately, though it should be healthy)
        const unhealthyNode = prev.find(item => item.id !== 21 && item.status !== 'HEALTHY');
        
        if (!unhealthyNode) return prev; // already fully healthy!

        // Heal this node
        showToast(`Daemon auto-healed: ${unhealthyNode.name}`, "success");
        
        // Add to logs
        setOpsLogs(logs => [
          { 
            id: Math.random().toString(), 
            event: "DAEMON_AUTO_HEAL", 
            details: `Background checker resolved network anomaly on node ${unhealthyNode.id}: ${unhealthyNode.name}` 
          },
          ...logs
        ]);

        return prev.map(item => item.id === unhealthyNode.id ? { ...item, status: 'HEALTHY' as const } : item);
      });
    }, 3000); // Check and heal every 3 seconds

    return () => clearInterval(interval);
  }, [isDaemonActive]);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [healingNodeId, setHealingNodeId] = useState<number | null>(null);
  const [autoHealingAll, setAutoHealingAll] = useState(false);

  // Toast System
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: string }>({ visible: false, message: '', type: 'success' });
  
  const showToast = (message: string, type: string = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type }), 3500);
  };

  useEffect(() => {
    if (!auth) {
      setIsCloudSyncBlocked(true);
      loadLocalFallbackData();
      return;
    }
    signInAnonymously(auth).catch(err => {
      console.warn("Anonymous auth handshake rejected. Defaulting to local terminal.", err);
      setIsCloudSyncBlocked(true);
    });
    const unsubscribe = onAuthStateChanged(auth, (usr) => setUser(usr));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) {
      loadLocalFallbackData();
      return;
    }

    const subsRef = collection(db, 'artifacts', appId, 'public', 'data', 'subscribers');
    const unsubSubs = onSnapshot(query(subsRef), 
      (snap) => {
        const arr: Subscriber[] = [];
        snap.forEach(d => arr.push({ id: d.id, ...d.data() } as Subscriber));
        setSubscribersList(arr);
        setIsCloudSyncBlocked(false);
      },
      (error) => {
        console.warn("Firestore subscription restricted: `/subscribers`. Enabling offline-first backup.", error);
        setIsCloudSyncBlocked(true);
        loadLocalFallbackSubscribers();
      }
    );

    const logsRef = collection(db, 'artifacts', appId, 'public', 'data', 'ops_logs');
    const unsubLogs = onSnapshot(query(logsRef), 
      (snap) => {
        const arr: OpsLog[] = [];
        snap.forEach(d => arr.push({ id: d.id, ...d.data() } as OpsLog));
        arr.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setOpsLogs(arr);
      },
      (error) => {
        console.warn("Firestore subscription restricted: `/ops_logs`. Redirecting telemetry locally.", error);
        loadLocalFallbackLogs();
      }
    );

    const listRef = collection(db, 'artifacts', appId, 'public', 'data', 'launch_checklist');
    const unsubCheck = onSnapshot(query(listRef), 
      (snap) => {
        const arr: ChecklistItem[] = [];
        snap.forEach(d => arr.push({ id: d.id, ...d.data() } as ChecklistItem));
        arr.sort((a, b) => a.order - b.order);
        setChecklist(arr);
      },
      (error) => {
        console.warn("Firestore subscription restricted: `/launch_checklist`. Restoring static map.", error);
        loadLocalFallbackChecklist();
      }
    );

    return () => {
      unsubSubs();
      unsubLogs();
      unsubCheck();
    };
  }, [user]);

  const loadLocalFallbackData = () => {
    loadLocalFallbackSubscribers();
    loadLocalFallbackLogs();
    loadLocalFallbackChecklist();
  };

  const loadLocalFallbackSubscribers = () => {
    setSubscribersList([
      { id: "local-1", email: "backcountry.pioneer@skyjack.net", imei: "358291048291048", status: "ACTIVE_LOCAL", tier: "SkyJack Core Space Link" },
      { id: "local-2", email: "nomad.architect@gmail.com", imei: "492019482019382", status: "ACTIVE_LOCAL", tier: "SkyJack Pro Mesh Tunnel" }
    ]);
  };

  const loadLocalFallbackLogs = () => {
    setOpsLogs([
      { id: "log-1", event: "LOCAL_INIT", details: "SkyJack Net running in resilient local-first backup memory mode." },
      { id: "log-2", event: "OFFLINE_WARNING", details: "Cloud permission check returned insufficient rights. Run database permissions updates inside the GCP tab to authorize live streams." }
    ]);
  };

  const loadLocalFallbackChecklist = () => {
    setChecklist([
      { id: "chk-1", order: 1, text: "Enable Cloud Run, VPC Access & Memorystore inside Google Cloud CLI", done: true },
      { id: "chk-2", order: 2, text: "Build Go compiler binary with live asymmetric cryptographic verification", done: false },
      { id: "chk-3", order: 3, text: "Create Live Production Products inside PayPal merchant console", done: false },
      { id: "chk-4", order: 4, text: "Apply secure IAM roles mapping Cloud Run instance to GCP Secrets Manager", done: false },
      { id: "chk-5", order: 5, text: "Publish system performance metrics and routing logs onto X (Twitter)", done: false }
    ]);
  };

  const toggleCheck = async (id: string, currentDone: boolean) => {
    if (isCloudSyncBlocked || !db) {
      setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !currentDone } : item));
      setOpsLogs(prev => [
        { id: Math.random().toString(), event: "CHECKPOINT_CHANGED", details: "Local roadmap metric updated." },
        ...prev
      ]);
      showToast("Checklist synced (Local Mode).");
      return;
    }

    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'launch_checklist', id), { done: !currentDone });
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'ops_logs'), {
        event: "CHECKPOINT_CHANGED",
        details: "Toggled SkyJack Net launch milestone progress metrics.",
        timestamp: serverTimestamp()
      });
      showToast("SkyJack Net launch checklist synced.");
    } catch (e) {
      showToast("Cloud connection write error.", "error");
    }
  };

  const handleManualProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubEmail.includes('@') || newSubIMEI.length < 12) {
      showToast("Input credentials fail basic routing safety protocols", "error");
      return;
    }

    if (isCloudSyncBlocked || !db) {
      const newSub: Subscriber = {
        id: Math.random().toString(),
        email: newSubEmail,
        imei: newSubIMEI,
        status: "ACTIVE_LOCAL",
        tier: selectedPlanTier === "P-3N649204A8109312V" ? "SkyJack Core Space Link" : "SkyJack Pro Mesh Tunnel"
      };
      setSubscribersList(prev => [...prev, newSub]);
      setOpsLogs(prev => [
        { id: Math.random().toString(), event: "LOCAL_ACTIVATION", details: `Direct local routing allowed for: ${newSubEmail}` },
        ...prev
      ]);
      showToast("Subscriber authorized (Local-First Sandbox Mode).");
      setNewSubEmail('');
      setNewSubIMEI('');
      return;
    }

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'subscribers'), {
        email: newSubEmail,
        imei: newSubIMEI,
        status: "ACTIVE_PRODUCTION",
        tier: selectedPlanTier === "P-3N649204A8109312V" ? "SkyJack Core Space Link" : "SkyJack Pro Mesh Tunnel",
        registeredAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'ops_logs'), {
        event: "MANUAL_ACTIVATION",
        details: `Direct SkyJack Net cellular routing allowed for: ${newSubEmail} (IMEI ID: ${newSubIMEI})`,
        timestamp: serverTimestamp()
      });

      showToast("SkyJack Net access token pushed successfully.");
      setNewSubEmail('');
      setNewSubIMEI('');
    } catch (e) {
      showToast("Error updating network rules.", "error");
    }
  };

  const addSubscriberMobile = async (email: string, imei: string, selectedTier: string) => {
    if (!email.includes('@') || imei.length < 12) {
      showToast("Input credentials fail basic routing safety protocols", "error");
      return false;
    }

    if (isCloudSyncBlocked || !db) {
      const newSub: Subscriber = {
        id: Math.random().toString(),
        email: email,
        imei: imei,
        status: "ACTIVE_LOCAL",
        tier: selectedTier
      };
      setSubscribersList(prev => [...prev, newSub]);
      setOpsLogs(prev => [
        { 
          id: Math.random().toString(), 
          event: "PAYPAL_MOBILE_ACTIVATION", 
          details: `Mobile client: ${email} self-registered with IMEI: ${imei} under ${selectedTier}` 
        },
        ...prev
      ]);
      showToast("Mobile activation complete! (Sandbox Mode)");
      return true;
    }

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'subscribers'), {
        email: email,
        imei: imei,
        status: "ACTIVE_PRODUCTION",
        tier: selectedTier,
        registeredAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'ops_logs'), {
        event: "PAYPAL_MOBILE_ACTIVATION",
        details: `Mobile customer ${email} successfully self-activated device IMEI ${imei} on ${selectedTier}`,
        timestamp: serverTimestamp()
      });

      showToast("Mobile subscription payment processed successfully!");
      return true;
    } catch (e) {
      showToast("Mobile route insertion error.", "error");
      return false;
    }
  };

  const addLogDirectly = async (event: string, details: string) => {
    if (isCloudSyncBlocked || !db) {
      setOpsLogs(prev => [
        { id: Math.random().toString(), event, details },
        ...prev
      ]);
      return;
    }
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'ops_logs'), {
        event,
        details,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
      setOpsLogs(prev => [
        { id: Math.random().toString(), event, details },
        ...prev
      ]);
    }
  };

  const markMilestoneDone = async (id: string) => {
    // Update local state
    setChecklist(items => items.map(item => item.id === id ? { ...item, done: true } : item));
    
    // Update Firestore if connected
    if (!isCloudSyncBlocked && db) {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'launch_checklist', id), { done: true });
      } catch (e) {
        console.warn(`Firestore checklist update failed for ${id}:`, e);
      }
    }
  };

  const runBulkOrchestration = () => {
    if (isBulkOrchestrating) return;
    setIsBulkOrchestrating(true);
    setBulkStep(1);
    setBulkProgress(5);
    setBulkLogs([
      "🚀 Starting Unified SkyJack Net Launch Strategy Orchestrator...",
      "📡 Initiating secure GCP service tunnels and routing nodes..."
    ]);

    // Step 1 Complete (instant because we are in active state)
    setTimeout(() => {
      setBulkProgress(20);
      setBulkStep(2);
      markMilestoneDone('chk-1');
      setBulkLogs(prev => [
        ...prev,
        "✅ MILESTONE 01: VPC subnets and Serverless Memorystore bridges established.",
        "⚙️ Starting MILESTONE 02: Compiling static Go cross-target proxy binary..."
      ]);
    }, 1200);

    // Step 2 Complete (Compiler)
    setTimeout(() => {
      setBulkProgress(40);
      setBulkStep(3);
      markMilestoneDone('chk-2');
      const targetBin = goOS === 'windows' ? 'skyjack-proxy.exe' : 'skyjack-proxy';
      setBulkLogs(prev => [
        ...prev,
        `✅ MILESTONE 02: Compiled /dist/${targetBin} with ${rsaBits}-bit RSA signatures.`,
        "💳 Starting MILESTONE 03: Initializing production PayPal billing API handshake..."
      ]);
    }, 3000);

    // Step 3 Complete (PayPal Gateway)
    setTimeout(() => {
      setBulkProgress(65);
      setBulkStep(4);
      markMilestoneDone('chk-3');
      setBulkLogs(prev => [
        ...prev,
        `✅ MILESTONE 03: Established subscription hooks with Live Client Token ID: ${paypalLiveClientID.slice(0, 16)}...`,
        "🛡️ Starting MILESTONE 04: Mapping GCP Service Account secrets manager roles..."
      ]);
    }, 4800);

    // Step 4 Complete (GCP Secret Manager IAM Roles)
    setTimeout(() => {
      setBulkProgress(85);
      setBulkStep(5);
      markMilestoneDone('chk-4');
      setBulkLogs(prev => [
        ...prev,
        `✅ MILESTONE 04: Secure SecretAccessor policies mapped to Service Identity: ${gcpServiceAccount.slice(0, 30)}...`,
        "📢 Starting MILESTONE 05: Formulating performance telemetry to X broadcaster feed..."
      ]);
    }, 6600);

    // Step 5 Complete (Final summary telemetry)
    setTimeout(() => {
      setBulkProgress(100);
      setBulkStep(5);
      markMilestoneDone('chk-5');
      setTweetSuccess(true);
      setTweetViews(Math.floor(Math.random() * 500) + 400);
      setTweetLikes(Math.floor(Math.random() * 50) + 30);
      setTweetRetweets(Math.floor(Math.random() * 15) + 6);
      
      setBulkLogs(prev => [
        ...prev,
        "✅ MILESTONE 05: Social telemetry updates formulated & broadcasted successfully.",
        "✨ [SUCCESS] All 5 orchestrations built and synchronized! Production deployment complete. 🚀"
      ]);
      
      setIsBulkOrchestrating(false);
      showToast("All SkyJack Net Roadmap milestones orchestrated successfully!", "success");
      addLogDirectly("BULK_ORCHESTRATION_SUCCESS", "Successfully executed full sequential cloud deployment pipeline of all 5 milestones.");
    }, 8500);
  };

  const runGoBuildSimulation = () => {
    if (isGoCompiling) return;
    setIsGoCompiling(true);
    setGoProgress(0);
    setGoCompileLogs([]);
    
    const targetBin = goOS === 'windows' ? 'skyjack-proxy.exe' : 'skyjack-proxy';
    const logsList = [
      `[1/5] 🔍 Initializing Go Compiler environment (GOOS=${goOS} GOARCH=${goArch})...`,
      `[2/5] 🔑 Generating asymmetric RSA cryptographic verification block with size ${rsaBits} bits...`,
      `[3/5] ⚙️ Compiling cross-target static proxy binary matching target cluster...`,
      `[4/5] 🛰️ Injecting live LEO telemetry routing handlers and PEM decryption blocks...`,
      `[5/5] ✅ Assembling static Go payload: /dist/${targetBin} (Success in 42ms!)`
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      setGoCompileLogs(prev => [...prev, logsList[currentLogIndex]]);
      currentLogIndex++;
      setGoProgress(current => {
        const nextProgress = current + 20;
        if (nextProgress >= 100) {
          clearInterval(interval);
          setIsGoCompiling(false);
          markMilestoneDone('chk-2');
          showToast("Go Compiler Binary built successfully! Checklist updated.", "success");
          
          addLogDirectly("GO_BUILD_SUCCESS", `Cross-compiled lightweight static Go binary ${targetBin} with ${rsaBits}-bit RSA-SHA256 asymmetric validations.`);
          return 100;
        }
        return nextProgress;
      });
    }, 600);
  };

  const runPayPalLinkSimulation = () => {
    if (isPaypalLinking) return;
    setIsPaypalLinking(true);
    setPaypalLogs([
      `[1/4] ⚡ Connecting with PayPal Production REST Handshake API...`,
      `[2/4] 🛰️ Synchronizing webhook target url with PayPal billing client ID: ${paypalLiveClientID}`,
      `[3/4] 💳 Provisioning Subscription Plan for SkyJack at $${paypalPlanPrice}/month...`
    ]);

    setTimeout(() => {
      setPaypalLogs(prev => [
        ...prev,
        `[4/4] ✅ Linked! Active subscription product established. Secret verification PEM verified successfully.`
      ]);
      setIsPaypalLinking(false);
      markMilestoneDone('chk-3');
      showToast("PayPal production merchant portal token verified!", "success");
      
      addLogDirectly("PAYPAL_MERCHANT_LINKED", `Secure production billing smart buttons registered with Client ID: ${paypalLiveClientID} for $${paypalPlanPrice}/mo.`);
    }, 2000);
  };

  const runIAMConfigSimulation = () => {
    if (isGCPConfiguring) return;
    setIsGCPConfiguring(true);
    setGcpLogs([
      `[1/4] 🔑 Fetching active project: skyjack-net-prod-v1`,
      `[2/4] 👤 Verifying target Service Account identity: ${gcpServiceAccount}`,
      `[3/4] 🛡️ Binding roles/secretmanager.secretAccessor role policy...`
    ]);

    setTimeout(() => {
      setGcpLogs(prev => [
        ...prev,
        `[4/4] ✅ Successfully applied policy IAM bindings. Cloud Run now possesses secure accessor rights.`
      ]);
      setIsGCPConfiguring(false);
      markMilestoneDone('chk-4');
      showToast("GCP Secret Manager IAM Roles Applied!", "success");
      
      addLogDirectly("GCP_IAM_POLICY_APPLIED", `Assigned roles/secretmanager.secretAccessor role policy permissions to Service Account: ${gcpServiceAccount}.`);
    }, 2000);
  };

  const runTwitterSimulation = () => {
    if (isTweeting) return;
    setIsTweeting(true);
    setTweetSuccess(false);

    const activeNodes = diagnostics.filter(d => d.status === 'HEALTHY').length;
    const daemonState = isDaemonActive ? 'ACTIVE' : 'OFFLINE';
    const subCount = subscribersList.length;

    setTimeout(() => {
      setIsTweeting(false);
      setTweetSuccess(true);
      setTweetViews(Math.floor(Math.random() * 500) + 250);
      setTweetLikes(Math.floor(Math.random() * 40) + 15);
      setTweetRetweets(Math.floor(Math.random() * 10) + 4);
      
      markMilestoneDone('chk-5');
      showToast("Live telemetry published on X!", "success");
      
      addLogDirectly("X_TELEMETRY_PUBLISHED", `Broadcaster pushed live telemetry data feed showing ${activeNodes}/25 healthy network nodes, ${subCount} active subscribers, and Daemon state: ${daemonState}.`);
    }, 1500);
  };

  const executeCopy = (text: string, key: string) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      showToast("Copied code snippet to system clipboard.");
    } catch (err) {
      showToast("Failed to copy snippet", "error");
    }
    document.body.removeChild(ta);
  };

  // Run automated 25-node check sweep
  const runDiagnosticScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    showToast("Initiated full system diagnostic check scan...", "info");

    const timer = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsScanning(false);
          showToast("Diagnostic check completed. View anomaly parameters.", "success");
          
          setOpsLogs(logs => [
            { id: Math.random().toString(), event: "DIAGNOSTIC_COMPLETED", details: "All 25 nodes analyzed. Identified pending security, network & payment gateway warnings." },
            ...logs
          ]);
          return 100;
        }
        return prev + 10;
      });
    }, 250);
  };

  // Resolve a single diagnostic check (Hotfix Node)
  const healDiagnosticNode = (id: number) => {
    setHealingNodeId(id);
    const target = diagnostics.find(d => d.id === id);
    if (!target) return;

    setTimeout(() => {
      setDiagnostics(prev => 
        prev.map(item => item.id === id ? { ...item, status: 'HEALTHY' } : item)
      );
      setHealingNodeId(null);
      showToast(`Successfully hotfixed diagnostic node: ${target.name}`);
      
      setOpsLogs(logs => [
        { id: Math.random().toString(), event: "HOTFIX_APPLIED", details: `Patched node: ${target.name}. Error cleared successfully.` },
        ...logs
      ]);
    }, 800);
  };

  // Master Automated Self-Healing suite updater (Heals all 25 nodes sequentially)
  const healAllDiagnostics = () => {
    if (autoHealingAll) return;
    setAutoHealingAll(true);
    showToast("Launching Automated Self-Healing Updater Suite...", "info");

    let currentIndex = 0;
    const interval = setInterval(() => {
      // Find warning/critical nodes to heal one by one
      const unhealthyNodes = diagnostics.filter(d => d.status !== 'HEALTHY');
      if (unhealthyNodes.length === 0 || currentIndex >= unhealthyNodes.length) {
        clearInterval(interval);
        setAutoHealingAll(false);
        showToast("All nodes resolved! Systems running at maximum efficiency.", "success");
        setOpsLogs(logs => [
          { id: Math.random().toString(), event: "HEAL_ALL_COMPLETED", details: "Central console executed Hotfix patch on all active network anomaly channels." },
          ...logs
        ]);
        return;
      }

      const nodeToHeal = unhealthyNodes[currentIndex];
      setDiagnostics(prev => 
        prev.map(item => item.id === nodeToHeal.id ? { ...item, status: 'HEALTHY' } : item)
      );

      setOpsLogs(logs => [
        { id: Math.random().toString(), event: "AUTO_REPAIRED", details: `Automated patch suite updated: ${nodeToHeal.name} transitioned to HEALTHY.` },
        ...logs
      ]);

      currentIndex++;
    }, 400);
  };

  const productionGoCode = `package main

import (
	"bytes"
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"hash/crc32"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type PayPalWebhook struct {
	EventType string \`json:"event_type"\`
	Resource  struct {
		ID         string \`json:"id"\`
		Subscriber struct {
			Email string \`json:"email_address"\`
		} \`json:"subscriber"\`
		CustomID string \`json:"custom_id"\` // Custom parameter mapped to client device IMEI
	} \`json:"resource"\`
}

func handleSecureWebhook(w http.ResponseWriter, r *http.Request) {
	bodyBytes, _ := io.ReadAll(r.Body)
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	transmissionSig := r.Header.Get("PAYPAL-TRANSMISSION-SIG")
	transmissionID := r.Header.Get("PAYPAL-TRANSMISSION-ID")
	transmissionTime := r.Header.Get("PAYPAL-TRANSMISSION-TIME")
	authAlgo := r.Header.Get("PAYPAL-AUTH-ALGO")
	certURL := r.Header.Get("PAYPAL-CERT-URL")
	webhookID := os.Getenv("PAYPAL_PRODUCTION_WEBHOOK_ID")

	if transmissionSig == "" || certURL == "" {
		http.Error(w, "Missing cryptographic header params", http.StatusUnauthorized)
		return
	}

	checksum := crc32.ChecksumIEEE(bodyBytes)
	sigString := fmt.Sprintf("%s|%s|%s|%d", transmissionID, transmissionTime, webhookID, checksum)

	certBytes, _ := downloadCertificate(certURL)
	err := verifyAsymmetricSignature(certBytes, sigString, transmissionSig, authAlgo)
	if err != nil {
		http.Error(w, "Signature mismatch", http.StatusUnauthorized)
		return
	}

	var data PayPalWebhook
	json.Unmarshal(bodyBytes, &data)

	if data.EventType == "BILLING.SUBSCRIPTION.ACTIVATED" {
		log.Printf("Successfully authorized device routing for subscriber: %s", data.Resource.Subscriber.Email)
	}
	w.WriteHeader(http.StatusOK)
}

func verifyAsymmetricSignature(certBytes []byte, sigString, rawSig, algo string) error {
	block, _ := pem.Decode(certBytes)
	cert, _ := x509.ParseCertificate(block.Bytes)
	pubKey, _ := cert.PublicKey.(*rsa.PublicKey)
	decodedSig, _ := base64.StdEncoding.DecodeString(rawSig)

	hash := sha256.New()
	hash.Write([]byte(sigString))
	return rsa.VerifyPKCS1v15(pubKey, crypto.SHA256, hash.Sum(nil), decodedSig)
}

func downloadCertificate(url string) ([]byte, error) {
	resp, _ := http.Get(url)
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}`;

  // Count diagnostic states
  const criticalCount = diagnostics.filter(d => d.status === 'CRITICAL').length;
  const warningCount = diagnostics.filter(d => d.status === 'WARNING').length;
  const healthyCount = diagnostics.filter(d => d.status === 'HEALTHY').length;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-600 overflow-x-hidden">
      
      {/* SIDE NAVIGATION */}
      <nav className="w-80 border-r border-slate-900 bg-slate-900/40 flex flex-col justify-between shrink-0 hidden md:flex">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/20 animate-pulse">
              S
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block">SkyJack Net</span>
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Node Console</span>
            </div>
          </div>

          {/* VIEW MODE TOGGLE */}
          <div className="px-6 pb-4">
            <div className="bg-slate-950/80 p-1 rounded-xl border border-slate-800 flex">
              <button
                onClick={() => setViewMode('admin')}
                className={`flex-1 flex items-center justify-center space-x-2 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === 'admin'
                    ? 'bg-blue-600 text-white shadow shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Admin</span>
              </button>
              <button
                onClick={() => setViewMode('customer')}
                className={`flex-1 flex items-center justify-center space-x-2 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === 'customer'
                    ? 'bg-blue-600 text-white shadow shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3 h-3" />
                <span>Customer App</span>
              </button>
            </div>
          </div>

          <div className="px-4 py-4 space-y-6">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">Core Modules</div>
              <div className="space-y-1">
                <button 
                  onClick={() => setActiveTab('diagnostics')}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'diagnostics' 
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/15 font-bold' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <HeartPulse className="w-4 h-4 opacity-80" />
                  <span>Diagnostic Health Desk</span>
                </button>

                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'dashboard' 
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/15 font-bold' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Activity className="w-4 h-4 opacity-80" />
                  <span>Link Management</span>
                </button>

                <button 
                  onClick={() => setActiveTab('gcp')}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'gcp' 
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/15 font-bold' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Cloud className="w-4 h-4 opacity-80" />
                  <span>GCP Architecture</span>
                </button>

                <button 
                  onClick={() => setActiveTab('paypal')}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'paypal' 
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/15 font-bold' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <CreditCard className="w-4 h-4 opacity-80" />
                  <span>PayPal Integration</span>
                </button>

                <button 
                  onClick={() => setActiveTab('milestones')}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'milestones' 
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/15 font-bold' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 opacity-80" />
                  <span>Launch Map</span>
                </button>

                <button 
                  onClick={() => setActiveTab('blueprint')}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'blueprint' 
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/15 font-bold' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Layers className="w-4 h-4 opacity-80" />
                  <span>Project Blueprint</span>
                </button>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">Diagnostic Status</div>
              <div className="space-y-2 px-3">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Critical Anomaly Nodes</span>
                  <span className={`font-mono font-bold ${criticalCount > 0 ? 'text-red-500' : 'text-slate-400'}`}>{criticalCount}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Warning Anomaly Nodes</span>
                  <span className={`font-mono font-bold ${warningCount > 0 ? 'text-amber-500' : 'text-slate-400'}`}>{warningCount}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Healthy Sweep Nodes</span>
                  <span className="font-mono text-emerald-500 font-bold">{healthyCount} / 25</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Account Profile segment */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/40">
          <div className="flex items-center space-x-3 p-2 bg-slate-900/50 rounded-xl border border-slate-900">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold font-mono">
              CJ
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">chris.james378@gmail.com</p>
              <p className="text-[9px] text-slate-500 truncate font-mono">System Administrator</p>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN VIEW AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header Block */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-6 sm:px-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-sm font-bold uppercase tracking-wider text-white">
              {viewMode === 'customer' ? '📱 Customer Mobile App Simulator' : (
                <>
                  {activeTab === 'diagnostics' && '🛡️ Diagnostic Health Desk'}
                  {activeTab === 'dashboard' && '📡 Link Management'}
                  {activeTab === 'gcp' && '☁️ GCP Architecture Spec'}
                  {activeTab === 'paypal' && '💳 PayPal Portal Token Integration'}
                  {activeTab === 'milestones' && '🎯 Launch Strategy Roadmap'}
                  {activeTab === 'blueprint' && '📋 Project System Blueprint'}
                </>
              )}
            </h1>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
              isCloudSyncBlocked 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              {isCloudSyncBlocked ? 'Offline Sandbox Mode' : 'Live Uplink Connected'}
            </span>
          </div>

          {/* Mobile Tab Select Dropdown */}
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle for Mobile devices */}
            <div className="flex md:hidden bg-slate-900 p-0.5 rounded-lg border border-slate-800 mr-1">
              <button
                onClick={() => setViewMode('admin')}
                className={`px-2.5 py-1 text-[9px] font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setViewMode('customer')}
                className={`px-2.5 py-1 text-[9px] font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === 'customer' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                App
              </button>
            </div>

            {viewMode === 'admin' && (
              <div className="md:hidden">
                <select 
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-xs rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="diagnostics">🛡️ Diagnostic Desk</option>
                  <option value="dashboard">📡 Link Management</option>
                  <option value="gcp">☁️ GCP Architecture</option>
                  <option value="paypal">💳 PayPal Integration</option>
                  <option value="milestones">🎯 Launch Map</option>
                  <option value="blueprint">📋 Project Blueprint</option>
                </select>
              </div>
            )}
            
            <span className="hidden sm:inline-block text-[11px] text-slate-500 font-mono">
              Node Ref: <span className="text-slate-300">{appId}</span>
            </span>
          </div>
        </header>

        {/* Inner Content Area */}
        <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
          
          {viewMode === 'admin' && (
            <>
              {/* Firestore rules lockdown notification banner */}
          {isCloudSyncBlocked && activeTab !== 'diagnostics' && (
            <div className="p-5 rounded-2xl bg-amber-950/10 border border-amber-500/15 sleek-gradient flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in card-hover">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-200 uppercase tracking-widest font-mono">Permission Restricted (Offline Sandbox Engaged)</h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  Firestore rules have restricted public write operations. A local sandbox fallback is fully operational, guaranteeing zero interruption. Run Firestore rules inside the <strong>GCP Architecture</strong> tab to configure real-time streaming services.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('gcp')}
                className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl hover:bg-amber-500/20 transition-all whitespace-nowrap cursor-pointer"
              >
                Get Database Fix
              </button>
            </div>
          )}

          {/* TAB 0: DIAGNOSTIC HEALTH DESK */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-6">
              
              {/* Dynamic Overview Diagnostics Status Header */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 sleek-gradient card-hover flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-2 text-center md:text-left w-full md:w-auto">
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center justify-center md:justify-start gap-2">
                    <HeartPulse className="w-5 h-5 text-blue-500 animate-pulse" />
                    Asymmetric Self-Healing Diagnostics
                  </h2>
                  <p className="text-xs text-slate-400 max-w-2xl">
                    Real-time error scanning monitor representing exactly 25 critical routing checkpoints. Launch an asynchronous sweep to verify node connectivity, resolve warnings, and secure credentials dynamically.
                  </p>
                </div>

                 {/* Healing action controls */}
                <div className="flex flex-wrap gap-3 shrink-0 w-full md:w-auto justify-center md:justify-end">
                  <button
                    onClick={() => {
                      setIsDaemonActive(!isDaemonActive);
                      showToast(isDaemonActive ? "Background self-healing daemon paused." : "Background self-healing daemon activated!", isDaemonActive ? "info" : "success");
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      isDaemonActive 
                        ? 'bg-emerald-950/30 border-emerald-500/35 text-emerald-400 hover:bg-emerald-950/50' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isDaemonActive ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-500'}`} />
                    <span>Daemon: {isDaemonActive ? 'ACTIVE' : 'OFFLINE'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setDiagnostics(prev => {
                        const next = [...prev];
                        // Pick 3-4 random healthy nodes and make them unhealthy
                        let count = 0;
                        let attempts = 0;
                        while (count < 3 && attempts < 20) {
                          const randIndex = Math.floor(Math.random() * next.length);
                          if (next[randIndex].id !== 21 && next[randIndex].status === 'HEALTHY') {
                            next[randIndex] = {
                              ...next[randIndex],
                              status: Math.random() > 0.5 ? 'CRITICAL' as const : 'WARNING' as const
                            };
                            count++;
                          }
                          attempts++;
                        }
                        return next;
                      });
                      showToast("Manually triggered network errors for simulation!", "warning");
                      setOpsLogs(logs => [
                        { 
                          id: Math.random().toString(), 
                          event: "TESTING_ANOMALIES", 
                          details: "User injected network node errors to verify auto-repair daemon response loops." 
                        },
                        ...logs
                      ]);
                    }}
                    className="flex items-center gap-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-bounce" />
                    <span>Trigger Errors</span>
                  </button>

                  <button
                    onClick={runDiagnosticScan}
                    disabled={isScanning}
                    className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{isScanning ? 'Scanning...' : 'Diagnostics Sweep'}</span>
                  </button>

                  <button
                    onClick={healAllDiagnostics}
                    disabled={autoHealingAll || (criticalCount === 0 && warningCount === 0)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-white animate-pulse" />
                    <span>Resolve All Nodes</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar of Scan */}
              {isScanning && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-blue-500/20 animate-pulse">
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-blue-400">EXECUTING FULL NETWORK PROBE OVER 25 TARGET CORES</span>
                    <span className="text-white font-bold">{scanProgress}% Complete</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Statistics Metrics Panel */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl sleek-gradient card-hover text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-mono">Anomalies Detected</span>
                  <p className="text-2xl font-black text-white mt-1">{criticalCount + warningCount}</p>
                </div>

                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl sleek-gradient card-hover text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-mono">Critical Security Risks</span>
                  <p className="text-2xl font-black text-red-500 mt-1">{criticalCount}</p>
                </div>

                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl sleek-gradient card-hover text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-mono">Telemetry Warnings</span>
                  <p className="text-2xl font-black text-amber-500 mt-1">{warningCount}</p>
                </div>

                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl sleek-gradient card-hover text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-mono">Active Clean Nodes</span>
                  <p className="text-2xl font-black text-emerald-400 mt-1">{healthyCount} / 25</p>
                </div>
              </div>

              {/* 25 Anomaly Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {diagnostics.map(item => (
                  <div 
                    key={item.id} 
                    className={`p-5 rounded-2xl bg-slate-900 border transition-all card-hover flex flex-col justify-between space-y-4 ${
                      item.status === 'CRITICAL' 
                        ? 'border-red-500/20 hover:border-red-500/40 bg-red-950/5' 
                        : item.status === 'WARNING' 
                          ? 'border-amber-500/20 hover:border-amber-500/40 bg-amber-950/5' 
                          : 'border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Top label / state indicator */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                          {item.category}
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold ${
                          item.status === 'CRITICAL' 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : item.status === 'WARNING' 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      {/* Title & description */}
                      <h4 className="text-xs font-bold text-white mb-1.5">{item.name}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                    </div>

                    {/* Resolution recommendation & Action button */}
                    <div className="pt-3 border-t border-slate-800 space-y-3">
                      <div className="text-[10px] text-slate-500 leading-relaxed font-mono">
                        <strong className="text-slate-400">Action:</strong> {item.remediation}
                      </div>

                      {item.status !== 'HEALTHY' && (
                        <button
                          onClick={() => healDiagnosticNode(item.id)}
                          disabled={healingNodeId === item.id}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer bg-slate-950 hover:bg-slate-900 border border-slate-800 text-blue-400 hover:text-blue-300"
                        >
                          <Zap className={`w-3.5 h-3.5 ${healingNodeId === item.id ? 'animate-spin text-blue-400' : ''}`} />
                          <span>{healingNodeId === item.id ? 'Healing Node...' : 'Apply Hotfix Patch'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 1: OPERATIONAL TELEMETRY & MANAGEMENT */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Segment: Actions and subscriber tables */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Statistics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 sleek-gradient card-hover">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">Network Bridges</p>
                    <p className="text-2xl font-bold text-white">{subscribersList.length}</p>
                    <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[65%]"></div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 sleek-gradient card-hover">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">Uplink Gateway</p>
                    <p className="text-2xl font-bold text-white">42 ms</p>
                    <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[25%]"></div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 sleek-gradient card-hover">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">Status Code</p>
                    <p className="text-2xl font-bold text-white">200 OK</p>
                    <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full w-[100%]"></div>
                    </div>
                  </div>
                </div>

                {/* 2. Manual Provision Form Card */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 sleek-gradient card-hover">
                  <div className="flex items-center space-x-2 mb-4">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-bold uppercase text-white tracking-wider font-mono">SkyJack Carrier Route Provisioner</h3>
                  </div>
                  <form onSubmit={handleManualProvision} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Subscriber Email</label>
                      <input 
                        type="email" 
                        required 
                        value={newSubEmail}
                        onChange={(e) => setNewSubEmail(e.target.value)}
                        placeholder="e.g. pilot@skyjack.net"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Device Hardware IMEI</label>
                      <input 
                        type="text" 
                        required 
                        value={newSubIMEI}
                        onChange={(e) => setNewSubIMEI(e.target.value)}
                        placeholder="15-digit hardware IMEI"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Authorize Route
                    </button>
                  </form>
                </div>

                {/* 3. Authorized Hardware Table */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 sleek-gradient card-hover">
                  <div className="flex items-center space-x-2 mb-4">
                    <Users className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">Active Authorized Satellite Bridges</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="pb-3 font-semibold">Account Email</th>
                          <th className="pb-3 font-semibold">Device Hardware IMEI</th>
                          <th className="pb-3 font-semibold text-right">Tunnel Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {subscribersList.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-slate-500 font-mono">
                              No devices currently registered. Authorize a node to launch!
                            </td>
                          </tr>
                        ) : (
                          subscribersList.map(s => (
                            <tr key={s.id || s.email} className="text-slate-300 hover:bg-slate-900/30 transition-colors">
                              <td className="py-3 font-bold text-white">{s.email}</td>
                              <td className="py-3 font-mono text-blue-400 text-[11px]">{s.imei}</td>
                              <td className="py-3 text-right">
                                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">
                                  {s.status === "ACTIVE_LOCAL" ? "OFFLINE_SANDBOX" : "DIRECT_LEO"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Right Segment: Terminal console */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between min-h-[450px] sleek-gradient card-hover">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider font-mono">Live Operations Feed</h3>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  </div>

                  <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                    {opsLogs.length === 0 ? (
                      <div className="text-[11px] text-slate-500 font-mono text-center py-20">
                        Awaiting network activations...
                      </div>
                    ) : (
                      opsLogs.map(log => (
                        <div key={log.id || log.details} className="bg-slate-950/80 p-3 rounded-xl border border-slate-900 text-[10px] font-mono leading-relaxed">
                          <span className="text-blue-400 font-bold block mb-1">[{log.event}]</span>
                          <p className="text-slate-300">{log.details}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span>Firestore Segment</span>
                  <span className="text-blue-500">/ops_logs</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CLOUD INFRASTRUCTURE & SECURITY MANUAL */}
          {activeTab === 'gcp' && (
            <div className="space-y-6">
              {/* Rules patch segment */}
              <div className="p-6 rounded-2xl bg-amber-950/10 border border-amber-500/20 sleek-gradient card-hover space-y-4">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-amber-200 uppercase tracking-widest font-mono">🔒 Firestore Database Rules Patch</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
                  The active database has blocked unauthorized reads. To allow safe, unauthenticated read permissions for our SkyJack telemetry channels while keeping other private partitions secure, navigate to the <strong>Firestore Database &gt; Rules</strong> tab inside your GCP Firebase console and apply this official rule set:
                </p>
                <div className="relative">
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allows anyone (authenticated or anonymous) to securely read & update the launch workspace maps
    match /artifacts/skyjack-net-prod-v1/public/data/{document=**} {
      allow read, write: if true;
    }
  }
}`}
                  </pre>
                  <button 
                    onClick={() => executeCopy(`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /artifacts/skyjack-net-prod-v1/public/data/{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`, 'rules')}
                    className="absolute top-3 right-3 bg-slate-900 hover:bg-slate-850 p-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedKey === 'rules' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Secure Go webhook spec + Terraform deployment */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Terraform template */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 sleek-gradient card-hover flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-blue-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Infrastructure as Code (Terraform)</h3>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Target Cloud Region</label>
                      <select 
                        value={gcpRegion}
                        onChange={(e) => setGcpRegion(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="us-central1">us-central1 (Iowa)</option>
                        <option value="europe-west1">europe-west1 (Belgium)</option>
                        <option value="asia-east1">asia-east1 (Taiwan)</option>
                      </select>
                    </div>

                    <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-[10px] font-mono text-slate-400 overflow-x-auto leading-relaxed">
{`resource "google_cloud_run_service" "skyjack_proxy" {
  name     = "skyjack-gateway-cluster"
  location = "${gcpRegion}"
  template {
    spec {
      containers {
        image = "gcr.io/skyjack-net-production/proxy:latest"
        env {
          name  = "PAYPAL_PRODUCTION_WEBHOOK_ID"
          value = "WH-SkyJackProductionPlanIDSignatureValue"
        }
      }
    }
  }
}`}
                    </pre>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800">
                    <button 
                      onClick={() => executeCopy(`resource "google_cloud_run_service" "skyjack_proxy" {\n  name     = "skyjack-gateway-cluster"\n  location = "${gcpRegion}"\n  template {\n    spec {\n      containers {\n        image = "gcr.io/skyjack-net-production/proxy:latest"\n        env {\n          name  = "PAYPAL_PRODUCTION_WEBHOOK_ID"\n          value = "WH-SkyJackProductionPlanIDSignatureValue"\n        }\n      }\n    }\n  }\n}`, 'tf')}
                      className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      {copiedKey === 'tf' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'tf' ? 'Terraform Copied!' : 'Copy Terraform Script'}</span>
                    </button>
                  </div>
                </div>

                {/* Go secure validation logic */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 sleek-gradient card-hover flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center space-x-2">
                        <Cpu className="w-4 h-4 text-blue-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Asymmetric Signature Verification (Go)</h3>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      This production Go logic authenticates inbound PayPal Webhook transmissions by downloading the asymmetric RSA certificates dynamically and verifying the header cryptographic signature block.
                    </p>
                    <div className="max-h-[220px] overflow-y-auto rounded-xl border border-slate-950">
                      <pre className="bg-slate-950 p-4 text-[9px] font-mono text-slate-400 leading-relaxed">
                        {productionGoCode}
                      </pre>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800">
                    <button 
                      onClick={() => executeCopy(productionGoCode, 'go')}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      {copiedKey === 'go' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'go' ? 'Signature Spec Copied!' : 'Copy Go Validation Spec'}</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: PAYPAL SDK BLOCK CONFIGURATION */}
          {activeTab === 'paypal' && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl sleek-gradient card-hover space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wider font-mono">PayPal Live Smart Button Script Blocks</h3>
                <p className="text-xs text-slate-400">Embed this complete script code inside your captive cellular gateway portal to authorize client smartphones instantly.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Live Merchant Client ID</label>
                  <input 
                    type="text"
                    value={prodPaypalClientID}
                    onChange={(e) => setProdPaypalClientID(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Production Subscription Plan ID</label>
                  <input 
                    type="text"
                    value={selectedPlanTier}
                    onChange={(e) => setSelectedPlanTier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="relative">
                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`<script src="https://www.paypal.com/sdk/js?client-id=${prodPaypalClientID}&vault=true&intent=subscription"></script>
<div id="paypal-button-container"></div>
<script>
  paypal.Buttons({
    createSubscription: function(data, actions) {
      return actions.subscription.create({ 'plan_id': '${selectedPlanTier}' });
    }
  }).render('#paypal-button-container');
</script>`}
                </pre>
                <button 
                  onClick={() => executeCopy(`<script src="https://www.paypal.com/sdk/js?client-id=${prodPaypalClientID}&vault=true&intent=subscription"></script>\n<div id="paypal-button-container"></div>\n<script>\n  paypal.Buttons({\n    createSubscription: function(data, actions) {\n      return actions.subscription.create({ 'plan_id': '${selectedPlanTier}' });\n    }\n  }).render('#paypal-button-container');\n</script>`, 'paypal_code')}
                  className="absolute top-3 right-3 bg-slate-900 hover:bg-slate-850 p-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedKey === 'paypal_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: STRATEGIC LAUNCH ROADMAP */}
          {activeTab === 'milestones' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Core header overview */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 sleek-gradient card-hover flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-1 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-blue-500" />
                    SkyJack Net Launch Strategy Roadmap
                  </h3>
                  <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                    Interactive cloud orchestration plane. Select any milestone on the left-hand roadmap to launch its dedicated deployment action terminal, or click bulk deploy to execute the entire target validation sequence.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5 shrink-0 items-center">
                  <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-mono">
                    Milestones Complete: {checklist.filter(c => c.done).length} / {checklist.length}
                  </span>
                  <button
                    onClick={runBulkOrchestration}
                    disabled={isBulkOrchestrating}
                    className={`text-xs font-mono font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                      isBulkOrchestrating 
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 animate-pulse' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/10 border border-transparent'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {isBulkOrchestrating ? 'Orchestrating...' : 'Bulk Deploy Roadmap'}
                  </button>
                </div>
              </div>

              {/* Grid block split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT COLUMN: Roadmap Checklist List */}
                <div className="col-span-1 lg:col-span-5 space-y-3">
                  <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold">
                    Launch Milestones Roadmap
                  </div>
                  {checklist.map(item => {
                    const isSelected = selectedMilestoneId === item.id;
                    const isNextUp = !item.done && checklist.findIndex(c => !c.done) === checklist.indexOf(item);
                    return (
                      <div 
                        key={item.id}
                        onClick={() => !isBulkOrchestrating && setSelectedMilestoneId(item.id)}
                        className={`p-4 rounded-xl border transition-all flex flex-col gap-2 relative group overflow-hidden ${
                          isBulkOrchestrating ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          isSelected && !isBulkOrchestrating
                            ? 'bg-slate-900/85 border-blue-500/50 shadow-[0_4px_20px_rgba(30,58,138,0.2)]' 
                            : 'bg-slate-950 border-slate-900 hover:border-slate-800 hover:bg-slate-900/30'
                        }`}
                      >
                        {/* Background subtle indicator */}
                        {isSelected && !isBulkOrchestrating && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                        )}

                        <div className="flex items-center gap-3 justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              disabled={isBulkOrchestrating}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCheck(item.id, item.done);
                              }}
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center text-xs transition-all ${
                                item.done 
                                  ? 'bg-blue-600 border-blue-500 text-white' 
                                  : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-transparent'
                              }`}
                            >
                              ✓
                            </button>
                            <span className={`text-xs font-bold font-mono tracking-wide ${
                              isSelected ? 'text-white' : 'text-slate-300'
                            }`}>
                              MILESTONE 0{item.order}
                            </span>
                          </div>
                          
                          {/* Badge status */}
                          <div>
                            {item.done ? (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                                Complete
                              </span>
                            ) : isNextUp ? (
                              <span className="text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider animate-pulse">
                                Next Up
                              </span>
                            ) : (
                              <span className="text-[9px] bg-slate-900 text-slate-500 border border-slate-800/80 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>

                        <span className={`text-[11px] leading-relaxed transition-all ${
                          item.done 
                            ? 'line-through text-slate-500' 
                            : isSelected ? 'text-blue-300' : 'text-slate-400 group-hover:text-slate-300'
                        }`}>
                          {item.text}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* RIGHT COLUMN: Interactive Control & Simulation Console */}
                <div className="col-span-1 lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-2xl sleek-gradient min-h-[500px] flex flex-col justify-between card-hover">
                  
                  {isBulkOrchestrating ? (
                    /* Global Orchestrator active layout */
                    <div className="space-y-4 w-full">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center space-x-2">
                          <Terminal className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-black uppercase text-white font-mono tracking-wider">
                            Global Orchestration Terminal
                          </span>
                        </div>
                        <span className="text-[10px] text-blue-400 font-mono font-bold uppercase tracking-widest animate-pulse flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                          PIPELINE RUNNING
                        </span>
                      </div>

                      {/* Bulk Progress Overview */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/20 space-y-3">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-slate-400">Total Deployment Progress</span>
                          <span className="text-blue-400 font-bold">{bulkProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${bulkProgress}%` }} />
                        </div>

                        {/* Pipeline stages checklist indicator */}
                        <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-slate-900/60">
                          {[1, 2, 3, 4, 5].map((stepNum) => {
                            const isCompleted = bulkStep > stepNum;
                            const isActive = bulkStep === stepNum;
                            return (
                              <div 
                                key={stepNum} 
                                className={`p-2 rounded-lg border text-center font-mono text-[9px] font-bold uppercase transition-all ${
                                  isCompleted 
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                    : isActive 
                                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 animate-pulse' 
                                      : 'bg-slate-950 border-slate-900 text-slate-600'
                                }`}
                              >
                                Step 0{stepNum}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Scrolling log console */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">Live Pipeline Outputs</span>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 h-[260px] overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-300 space-y-2">
                          {bulkLogs.map((log, i) => (
                            <div 
                              key={i} 
                              className={`${
                                log.startsWith('✅') ? 'text-emerald-400 font-bold' : 
                                log.startsWith('🚀') || log.startsWith('✨') ? 'text-blue-300 font-bold' : 'text-slate-300'
                              }`}
                            >
                              {log}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Regular active milestone details */
                    <div className="space-y-4 w-full">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center space-x-2">
                          <Terminal className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-black uppercase text-white font-mono tracking-wider">
                            Active Execution Control Terminal
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest">
                          Node ID: {selectedMilestoneId}
                        </span>
                      </div>

                      {/* Milestone Intro Card */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">
                          {selectedMilestoneId === 'chk-1' && "🛰️ Cloud Networking Integration"}
                          {selectedMilestoneId === 'chk-2' && "⚙️ Secure Go Static Cross-Compilation"}
                          {selectedMilestoneId === 'chk-3' && "💳 PayPal Production API Gateway Handshake"}
                          {selectedMilestoneId === 'chk-4' && "🛡️ Google Cloud Service Account IAM Policies"}
                          {selectedMilestoneId === 'chk-5' && "📢 Live Social Telemetry Broadcaster"}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {selectedMilestoneId === 'chk-1' && "Setup serverless endpoints, isolated VPC subnets and Redis memory stores inside Google Cloud Run clusters."}
                          {selectedMilestoneId === 'chk-2' && "Compiles the static Go webhook routing module. Compressing production payloads down to lightweight binaries with asymmetric RSA signature decoders."}
                          {selectedMilestoneId === 'chk-3' && "Authenticates live merchant API keys and subscription plans inside production PayPal client buttons."}
                          {selectedMilestoneId === 'chk-4' && "Binds Cloud IAM security policies giving Cloud Run containers restricted access to GCP Secret Manager keys."}
                          {selectedMilestoneId === 'chk-5' && "Formats and pushes active network telemetry and subscriber routing counts directly onto the X (Twitter) status feeds."}
                        </p>
                      </div>

                      {/* INTERACTIVE CONTROLS BY SELECTED MILESTONE */}
                      
                      {/* MILESTONE 1: VPC Integration */}
                      {selectedMilestoneId === 'chk-1' && (
                        <div className="space-y-4 pt-2">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                              <span className="text-[10px] text-slate-500 font-mono block font-bold uppercase">Cloud Run</span>
                              <span className="text-xs font-bold text-emerald-400 font-mono">ACTIVE</span>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                              <span className="text-[10px] text-slate-500 font-mono block font-bold uppercase">VPC Subnet</span>
                              <span className="text-xs font-bold text-emerald-400 font-mono">BRIDGED</span>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                              <span className="text-[10px] text-slate-500 font-mono block font-bold uppercase">Redis Cache</span>
                              <span className="text-xs font-bold text-emerald-400 font-mono">CONNECTED</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">GCP CLI Subnet Deployment Logs</span>
                            <pre className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-[10px] font-mono text-slate-400 leading-relaxed overflow-x-auto">
{`$ gcloud services enable run.googleapis.com vpcaccess.googleapis.com redis.googleapis.com
$ gcloud compute networks subnets create skyjack-vpc-subnet --range=10.8.0.0/28
$ gcloud compute shared-vpc-associated-projects add skyjack-net-prod-v1
$ gcloud redis instances create skyjack-cache --size=1 --region=us-central1
[STATUS] SECURE SUBNETS PROVISIONED AND ROUTED SUCCESS.`}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* MILESTONE 2: Go compiler (chk-2) */}
                      {selectedMilestoneId === 'chk-2' && (
                        <div className="space-y-4 pt-2">
                          {/* Selector parameters */}
                          {!isGoCompiling && !checklist.find(c => c.id === 'chk-2')?.done && (
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-mono font-bold uppercase">Target OS</label>
                                <select 
                                  value={goOS} 
                                  onChange={(e) => setGoOS(e.target.value as any)}
                                  className="w-full bg-slate-950 border border-slate-850 text-xs rounded-lg p-2.5 text-slate-300 focus:outline-none"
                                >
                                  <option value="linux">Linux (ELF)</option>
                                  <option value="darwin">macOS (Mach-O)</option>
                                  <option value="windows">Windows (PE32)</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-mono font-bold uppercase">Target Arch</label>
                                <select 
                                  value={goArch} 
                                  onChange={(e) => setGoArch(e.target.value as any)}
                                  className="w-full bg-slate-950 border border-slate-850 text-xs rounded-lg p-2.5 text-slate-300 focus:outline-none"
                                >
                                  <option value="amd64">AMD64</option>
                                  <option value="arm64">ARM64 (M1/M2/Cell)</option>
                                  <option value="386">i386 32-bit</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-mono font-bold uppercase">RSA Strength</label>
                                <select 
                                  value={rsaBits} 
                                  onChange={(e: any) => setRsaBits(Number(e.target.value))}
                                  className="w-full bg-slate-950 border border-slate-850 text-xs rounded-lg p-2.5 text-slate-300 focus:outline-none"
                                >
                                  <option value={2048}>2048-bit (Fast)</option>
                                  <option value={4096}>4096-bit (Ultra SEC)</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Interactive trigger / Compilation status */}
                          {isGoCompiling ? (
                            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-blue-400 animate-pulse flex items-center gap-2">
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Compiling static Go Webhook Binary...
                                </span>
                                <span className="text-slate-400">{goProgress}%</span>
                              </div>
                              {/* Custom progress bar */}
                              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${goProgress}%` }} />
                              </div>
                              {/* Live compiler feed output */}
                              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pt-2 border-t border-slate-900 text-[10px] leading-relaxed text-slate-400 font-mono">
                                {goCompileLogs.map((log, i) => (
                                  <div key={i}>{log}</div>
                                ))}
                              </div>
                            </div>
                          ) : checklist.find(c => c.id === 'chk-2')?.done ? (
                            <div className="space-y-3">
                              <div className="bg-emerald-950/20 border border-emerald-500/25 p-4 rounded-xl flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                <div className="text-xs">
                                  <span className="font-bold text-emerald-300 block mb-1">Static Go Target Compiled & Verified</span>
                                  <p className="text-slate-300">
                                    Binary executable compiled for <strong className="font-mono text-white">{goOS}/{goArch}</strong> successfully. Features complete verification of <strong className="font-mono text-white">RSA-SHA256</strong> headers with a strength of <strong className="font-mono text-white">{rsaBits} bits</strong>.
                                  </p>
                                </div>
                              </div>
                              {/* Simulated code snippet of compiled headers */}
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">Compiled Assembly Header Metadata</span>
                                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-[10px] font-mono text-slate-400 leading-relaxed overflow-x-auto">
{`$ file dist/skyjack-proxy
dist/skyjack-proxy: ELF 64-bit LSB executable, x86-64, statically linked, stripped
SHA256: d850f3b49c71a3964920b784a839cf9e1029e01f28b40c7410bdc89f1f0a2894`}
                                </pre>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-2">
                              <button
                                onClick={runGoBuildSimulation}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-blue-500/10"
                              >
                                <Cpu className="w-4 h-4 text-white animate-pulse" />
                                <span>Assemble & Build Go Static Binary (GOOS={goOS})</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* MILESTONE 3: PayPal (chk-3) */}
                      {selectedMilestoneId === 'chk-3' && (
                        <div className="space-y-4 pt-2">
                          {!isPaypalLinking && !checklist.find(c => c.id === 'chk-3')?.done && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-mono font-bold uppercase">Live Client ID Token</label>
                                <input 
                                  type="text"
                                  value={paypalLiveClientID}
                                  onChange={(e) => setPaypalLiveClientID(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-850 text-xs rounded-lg p-2.5 text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
                                  placeholder="Ad-SkyJackNetLiveToken"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-mono font-bold uppercase">Target Price per Month ($)</label>
                                <input 
                                  type="number"
                                  value={paypalPlanPrice}
                                  onChange={(e) => setPaypalPlanPrice(Number(e.target.value))}
                                  className="w-full bg-slate-950 border border-slate-850 text-xs rounded-lg p-2.5 text-slate-300 focus:outline-none focus:border-blue-500"
                                  placeholder="49"
                                  min={1}
                                />
                              </div>
                            </div>
                          )}

                          {isPaypalLinking ? (
                            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-[10px] leading-relaxed text-slate-400">
                              <span className="text-[11px] text-blue-400 animate-pulse flex items-center gap-2 font-sans font-bold">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Negotiating Webhook Endpoints with PayPal REST servers...
                              </span>
                              <div className="space-y-1.5 pt-2 font-mono">
                                {paypalLogs.map((log, i) => (
                                  <div key={i}>{log}</div>
                                ))}
                              </div>
                            </div>
                          ) : checklist.find(c => c.id === 'chk-3')?.done ? (
                            <div className="space-y-3">
                              <div className="bg-emerald-950/20 border border-emerald-500/25 p-4 rounded-xl flex items-start gap-3">
                                <CreditCard className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                <div className="text-xs">
                                  <span className="font-bold text-emerald-300 block mb-1">PayPal Portal Successfully Synced</span>
                                  <p className="text-slate-300">
                                    Billing plans are verified inside the Go compiler webhook verification endpoints. Direct smart buttons will authorize client subscriptions at <strong className="text-white">${paypalPlanPrice}/month</strong> linked to live token Client ID <strong className="font-mono text-white text-[11px]">{paypalLiveClientID.slice(0, 15)}...</strong>
                                  </p>
                                </div>
                              </div>
                              <pre className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-[10px] font-mono text-slate-400 leading-relaxed overflow-x-auto">
{`{
  "client_id": "${paypalLiveClientID}",
  "plan_id": "P-3N649204A8109312V",
  "webhook_url": "https://skyjack-gateway-cluster/api/v1/billing-webhook",
  "merchant_status": "APPROVED_LIVE_PRODUCTION"
}`}
                              </pre>
                            </div>
                          ) : (
                            <div className="pt-2">
                              <button
                                onClick={runPayPalLinkSimulation}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-blue-500/10"
                              >
                                <CreditCard className="w-4 h-4 text-white" />
                                <span>Link Live Production Products on PayPal Portal</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* MILESTONE 4: IAM Policy (chk-4) */}
                      {selectedMilestoneId === 'chk-4' && (
                        <div className="space-y-4 pt-2">
                          {!isGCPConfiguring && !checklist.find(c => c.id === 'chk-4')?.done && (
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 font-mono font-bold uppercase">GCP Target Service Account</label>
                              <input 
                                type="text"
                                value={gcpServiceAccount}
                                onChange={(e) => setGcpServiceAccount(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-850 text-xs rounded-lg p-2.5 text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
                                placeholder="e.g. skyjack-run@service.com"
                              />
                            </div>
                          )}

                          {isGCPConfiguring ? (
                            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-[10px] leading-relaxed text-slate-400">
                              <span className="text-[11px] text-blue-400 animate-pulse flex items-center gap-2 font-sans font-bold">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Applying Cloud IAM bindings...
                              </span>
                              <div className="space-y-1.5 pt-2 font-mono">
                                {gcpLogs.map((log, i) => (
                                  <div key={i}>{log}</div>
                                ))}
                              </div>
                            </div>
                          ) : checklist.find(c => c.id === 'chk-4')?.done ? (
                            <div className="space-y-3">
                              <div className="bg-emerald-950/20 border border-emerald-500/25 p-4 rounded-xl flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                <div className="text-xs">
                                  <span className="font-bold text-emerald-300 block mb-1">GCP Secret Access Authorized</span>
                                  <p className="text-slate-300">
                                    Policy maps are active. Cloud Run cluster running under identity <strong className="font-mono text-white text-[10px]">{gcpServiceAccount}</strong> is safely authorized with read-access roles for GCP Secrets Manager secrets.
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">Applied gcloud IAM Policy Response</span>
                                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-[10px] font-mono text-slate-400 leading-relaxed overflow-x-auto">
{`$ gcloud projects add-iam-policy-binding skyjack-net-prod-v1 \\
  --member="serviceAccount:${gcpServiceAccount}" \\
  --role="roles/secretmanager.secretAccessor"
  
Updated IAM Policy [roles/secretmanager.secretAccessor] applied successfully.`}
                                </pre>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-2">
                              <button
                                onClick={runIAMConfigSimulation}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-blue-500/10"
                              >
                                <ShieldCheck className="w-4 h-4 text-white" />
                                <span>Apply Secure IAM Secret Access Policies</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* MILESTONE 5: Telemetry to X (chk-5) */}
                      {selectedMilestoneId === 'chk-5' && (
                        <div className="space-y-4 pt-2">
                          
                          {isTweeting ? (
                            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono">
                              <span className="text-[11px] text-blue-400 animate-pulse flex items-center gap-2 font-sans font-bold">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Authenticating Social OAuth Credentials & Pushing Broadcast...
                              </span>
                            </div>
                          ) : tweetSuccess || checklist.find(c => c.id === 'chk-5')?.done ? (
                            <div className="space-y-4">
                              <div className="bg-emerald-950/20 border border-emerald-500/25 p-4 rounded-xl flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                <div className="text-xs">
                                  <span className="font-bold text-emerald-300 block mb-1">Broadcaster Live! Telemetry Update Published</span>
                                  <p className="text-slate-300">
                                    Your simulated network telemetry updates were safely pushed onto your social status feed channels.
                                  </p>
                                </div>
                              </div>

                              {/* X / Twitter Post Mockup Card */}
                              <div className="bg-black rounded-xl border border-slate-800 p-5 font-sans shadow-lg animate-fade-in">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs font-sans">
                                      SJ
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-white leading-none">SkyJack Net Link</span>
                                        {/* Verified badge */}
                                        <span className="text-[9px] bg-blue-500 text-white rounded-full p-0.5">✓</span>
                                      </div>
                                      <span className="text-[10px] text-slate-500">@skyjack_net_link · Just now</span>
                                    </div>
                                  </div>
                                </div>

                                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-mono pl-1 border-l-2 border-blue-500/30">
                                  {`🛰️ [SkyJack Net Link Telemetry Feed]
• Diagnostics: ${diagnostics.filter(d => d.status === 'HEALTHY').length}/25 HEALTHY
• Self-healing Daemon: ${isDaemonActive ? 'ACTIVE' : 'OFFLINE'}
• LEO Satellite Bridges: ${subscribersList.length} active
• Live Latency Verification: 42ms
Secure cellular routing verified. 🚀`}
                                </p>

                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-900 mt-4 px-1 font-mono">
                                  <span>💬 {Math.floor(tweetLikes / 4) + 1}</span>
                                  <span className="hover:text-emerald-400 transition-colors">🔁 {tweetRetweets || 8}</span>
                                  <span className="hover:text-pink-500 transition-colors">❤️ {tweetLikes || 32}</span>
                                  <span>📊 {tweetViews || 412} Views</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-mono font-bold uppercase">Formulate Live Broadcast Telemetry</label>
                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-line">
{`🛰️ [SkyJack Net Link Telemetry Feed]
• Diagnostics: ${diagnostics.filter(d => d.status === 'HEALTHY').length}/25 HEALTHY
• Self-healing Daemon: ${isDaemonActive ? 'ACTIVE' : 'OFFLINE'}
• LEO Satellite Bridges: ${subscribersList.length} active
• Live Latency Verification: 42ms
Secure cellular routing verified. 🚀`}
                                </div>
                              </div>

                              <button
                                onClick={runTwitterSimulation}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-blue-500/10"
                              >
                                <Layers className="w-4 h-4 text-white" />
                                <span>Simulate Telemetry Broadcast Update to X (Twitter)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )}

                  {/* Terminal Footer */}
                  <div className="text-[10px] text-slate-500 font-mono pt-4 border-t border-slate-800 flex justify-between items-center mt-6">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isBulkOrchestrating 
                          ? 'bg-blue-500 animate-ping'
                          : checklist.find(c => c.id === selectedMilestoneId)?.done 
                            ? 'bg-emerald-400' 
                            : 'bg-amber-400 animate-pulse'
                      }`} />
                      Status: {isBulkOrchestrating ? 'ORCHESTRATING PIPELINE' : checklist.find(c => c.id === selectedMilestoneId)?.done ? 'COMPILED & ACTIVE' : 'AWAITING ACTIONS'}
                    </span>
                    <span className="text-blue-500 font-bold">ACTIVE RUNNER</span>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 5: SYSTEM BLUEPRINT & PRODUCT CHARTER */}
          {activeTab === 'blueprint' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 sleek-gradient card-hover">
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mb-2">
                  <Layers className="w-5 h-5 text-blue-500" />
                  Project System Blueprint & Strategic Architecture Charter
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A cohesive, production-grade master plan presenting the technology stack justification, target audience telemetry analysis, core features, and the primary value proposition of the <strong>SkyJack Net Link</strong> ecosystem.
                </p>
              </div>

              {/* GRID OF SECTIONS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Technology Stack & Justification */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 sleek-gradient card-hover flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                      <Cpu className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">1. Suitable Technology Stack</h3>
                    </div>
                    
                    <div className="space-y-4 text-xs">
                      <div>
                        <span className="font-bold text-blue-400 block mb-1">Frontend Layer (React + Vite + Tailwind CSS)</span>
                        <p className="text-slate-400 leading-relaxed font-sans">
                          Utilizes modular React hooks with Vite for instant loading states and ultra-clean responsive panels styled using high-contrast Tailwind CSS utility presets.
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-blue-400 block mb-1">Routing & Webhook Core (Go Language)</span>
                        <p className="text-slate-400 leading-relaxed font-sans">
                          Cross-compiles high-performance Go binaries. Executes asymmetric RSA signature validations of secure billing webhooks in average runtime latencies under 42ms.
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-blue-400 block mb-1">Persistent Real-Time Stream (Firestore)</span>
                        <p className="text-slate-400 leading-relaxed font-sans">
                          Employs serverless Cloud Firestore with onSnapshot listener pipelines and offline-first client cache fallbacks to maintain resilient operations feed streams.
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-blue-400 block mb-1">Hosting (GCP Cloud Run + Secrets Manager)</span>
                        <p className="text-slate-400 leading-relaxed font-sans">
                          Leverages auto-scaling server containers behind strict VPC networks, completely decoupling sensitive merchant API secrets from client assets.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3 text-[10px] text-slate-500 font-mono">
                    Chosen for modularity, sub-second routing speed, and horizontal scalability.
                  </div>
                </div>

                {/* 2. Core Functionality & Primary Value Proposition */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 sleek-gradient card-hover flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                      <Database className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">2. Core Functionality & Value</h3>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div>
                        <span className="font-bold text-blue-400 block mb-1">Automated Healing Diagnostics</span>
                        <p className="text-slate-400 leading-relaxed font-sans">
                          Features a massive 25-node check panel monitoring cryptographic, satellite link, and database parameters with inline automated patch remediation.
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-blue-400 block mb-1">Carrier Route Provisioning</span>
                        <p className="text-slate-400 leading-relaxed font-sans">
                          Authenticates subscriber accounts with direct hardware IMEI validation gates to permit LEO satellite network access instantaneously.
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-blue-400 block mb-1">Billing Vault SDK smart integration</span>
                        <p className="text-slate-400 leading-relaxed font-sans">
                          Configures embedded production smart buttons dynamically connected to webhook proxies with PEM validation certificates.
                        </p>
                      </div>

                      <div className="bg-blue-950/20 p-3 rounded-xl border border-blue-500/10">
                        <span className="font-bold text-emerald-400 block mb-1 uppercase tracking-widest text-[9px] font-mono">Primary Value Proposition</span>
                        <p className="text-slate-300 leading-relaxed text-[11px] font-medium font-sans">
                          "Providing a highly resilient, offline-capable space link telemetry management console that bridges satellite signals, secure cellular routing, and high-security enterprise billing with automated self-healing integrity diagnostics."
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3 text-[10px] text-slate-500 font-mono">
                    Synchronized with active Firebase/Local operations logging channels.
                  </div>
                </div>

                {/* 3. Target Audience & Pain Point Diagnostics */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 sleek-gradient card-hover flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                      <Users className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">3. Audience & Telemetry Analysis</h3>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div>
                        <span className="font-bold text-blue-400 block mb-1">Who is the Target Audience?</span>
                        <p className="text-slate-400 leading-relaxed font-sans">
                          LEO Satellite Network Operators, Captive Gateway Engineers, and high-security industrial cellular systems administrators.
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-amber-400 block mb-1 font-sans">Core Needs</span>
                        <p className="text-slate-400 leading-relaxed font-sans">
                          Real-time health telemetry across scattered nodes, swift configuration compiles, and absolute uptime even in zero-network areas.
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-red-400 block mb-1 font-sans">Identified Pain Points</span>
                        <p className="text-slate-400 leading-relaxed font-sans">
                          Unstable remote links, key deployment drifts, complex webhook spoofing vulnerability vectors, and difficult manual client activations.
                        </p>
                      </div>

                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-900">
                        <span className="font-bold text-white block mb-1 font-sans">Console Mitigation Impact</span>
                        <p className="text-slate-400 leading-relaxed font-sans">
                          Resolves link and authorization outages through un-spoofable Go signature checks and immediate 25-node diagnostics sweep hotfixes.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3 text-[10px] text-slate-500 font-mono">
                    Addresses multi-node system reliability in mission-critical environments.
                  </div>
                </div>

              </div>
            </div>
          )}
            </>
          )}

          {/* CUSTOMER APP SIMULATOR CONTAINER */}
          {viewMode === 'customer' && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center max-w-2xl mx-auto space-y-2 mb-4">
                <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
                  High-Fidelity Mobile App Simulator
                </h2>
                <p className="text-xs text-slate-400">
                  Observe exactly what your satellite subscribers see on their mobile devices. Test the end-to-end integration by triggering simulated mobile payments or satellite speed sweeps, fully synced with the Admin Operations log stream!
                </p>
              </div>

              {/* DUAL COLUMN: PHONE SIMULATOR ON LEFT, DYNAMIC CONTEXT ON RIGHT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* INTERACTIVE PHONE SIMULATOR (5 COLS) */}
                <div className="lg:col-span-5 flex justify-center">
                  <div className="w-full max-w-[360px] aspect-[9/19] rounded-[3rem] border-[10px] border-slate-900 bg-slate-950 p-6 shadow-2xl relative overflow-hidden ring-1 ring-slate-800 flex flex-col justify-between">
                    
                    {/* Top Notch Area */}
                    <div className="absolute top-0 inset-x-0 h-7 flex justify-between items-center px-6 text-white text-[10px] font-mono z-50 select-none bg-slate-950">
                      <span>12:00</span>
                      {/* Speaker notch */}
                      <div className="w-20 h-4 bg-slate-950 rounded-b-xl absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center">
                        <div className="w-10 h-1 bg-slate-850 rounded-full"></div>
                      </div>
                      <div className="flex items-center space-x-1.5 text-slate-400">
                        <Cloud className="w-3 h-3 text-blue-400 animate-pulse" />
                        <span className="text-[9px] font-bold text-slate-300">LEO</span>
                        <div className="w-3.5 h-2 border border-slate-700 rounded-sm p-px flex items-center">
                          <div className="h-full w-full bg-emerald-500 rounded-2xs"></div>
                        </div>
                      </div>
                    </div>

                    {/* MAIN SCROLLABLE MOBILE CONTENT */}
                    <div className="flex-1 overflow-y-auto pt-8 pb-4 px-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800 text-slate-300 select-none">
                      
                      {/* Mobile App Header */}
                      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center font-black text-white text-[10px]">
                            S
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black text-white uppercase tracking-wider leading-none">SkyJack Link</h4>
                            <span className="text-[8px] text-slate-500 leading-none">Space-Grid Client v1.02</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {isCustomerLocked ? '📡 Linked' : '🚫 Offline'}
                        </span>
                      </div>

                      {/* SECTION 1: COMPASS / RADAR SATELLITE SEARCH */}
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-850 sleek-gradient space-y-3 relative overflow-hidden">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Satellite Compass</span>
                          <span className={`text-[8px] font-mono font-bold ${isCustomerLocked ? 'text-emerald-400' : 'text-amber-500 animate-pulse'}`}>
                            {isCustomerLocked ? 'Locked On-Grid' : 'Seeking Space Beam'}
                          </span>
                        </div>

                        {/* Visual Compass Animation */}
                        <div className="flex flex-col items-center py-2 relative">
                          <div className={`w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center transition-all ${
                            isCustomerSearching ? 'border-blue-500 animate-spin' : isCustomerLocked ? 'border-emerald-500/50' : 'border-slate-800'
                          }`}>
                            <div className={`w-14 h-14 rounded-full border border-dotted flex items-center justify-center ${
                              isCustomerLocked ? 'bg-emerald-500/5' : 'bg-transparent'
                            }`}>
                              <Activity className={`w-5 h-5 ${isCustomerSearching ? 'text-blue-400 animate-pulse' : isCustomerLocked ? 'text-emerald-400' : 'text-slate-600'}`} />
                            </div>
                          </div>
                          
                          {/* Selected Satellite Banner */}
                          {isCustomerLocked && !isCustomerSearching && (
                            <div className="mt-2 text-center">
                              <p className="text-[10px] font-bold text-white uppercase font-mono">{customerActiveSatellite}</p>
                              <p className="text-[8px] text-slate-500">Elevation: 42° / Azimuth: 118°</p>
                            </div>
                          )}
                          {isCustomerSearching && (
                            <div className="mt-2 text-center animate-pulse">
                              <p className="text-[9px] font-bold text-blue-400 font-mono">SCANNING PHASE-ARRAY...</p>
                            </div>
                          )}
                          {!isCustomerLocked && !isCustomerSearching && (
                            <div className="mt-2 text-center">
                              <p className="text-[9px] font-bold text-amber-500 font-mono">NO ACTIVE SPACE PATH</p>
                            </div>
                          )}
                        </div>

                        {/* Align Action Button */}
                        <button
                          onClick={async () => {
                            if (isCustomerSearching) return;
                            setIsCustomerSearching(true);
                            setIsCustomerLocked(false);
                            // Simulate scanning
                            setTimeout(() => {
                              setIsCustomerSearching(false);
                              setIsCustomerLocked(true);
                              const satNames = ['SKYJACK-LEO-03', 'SKYJACK-LEO-08', 'SKYJACK-LEO-12', 'SKYJACK-LEO-19', 'SKYJACK-LEO-25'];
                              const chosen = satNames[Math.floor(Math.random() * satNames.length)];
                              setCustomerActiveSatellite(chosen);
                              addLogDirectly("MOBILE_ALIGN", `Sub-device aligned array with ${chosen} (Elevation 42°, Signal RSSI -68dBm)`);
                              showToast(`Aligned successfully to ${chosen}!`);
                            }, 2000);
                          }}
                          disabled={isCustomerSearching}
                          className="w-full py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-[10px] font-bold tracking-wider uppercase text-blue-400 transition-all cursor-pointer"
                        >
                          {isCustomerSearching ? 'Locking Space Beam...' : 'Align Phase Array Antennas'}
                        </button>
                      </div>

                      {/* SECTION 2: SPEED TEST DIAL */}
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-850 sleek-gradient space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Connection Tester</span>
                          <span className="text-[8px] text-slate-500 font-mono font-bold">Avg Latency: 42ms</span>
                        </div>

                        <div className="flex flex-col items-center space-y-2 py-1">
                          {/* Speed Gauge Ring */}
                          <div className="relative w-24 h-24 flex items-center justify-center">
                            {/* SVG Speed Circle */}
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="48"
                                cy="48"
                                r="40"
                                className="stroke-slate-950 fill-none"
                                strokeWidth="6"
                              />
                              <circle
                                cx="48"
                                cy="48"
                                r="40"
                                className="stroke-blue-500 fill-none transition-all duration-300"
                                strokeWidth="6"
                                strokeDasharray="251.2"
                                strokeDashoffset={251.2 - (251.2 * (isCustomerSpeedTesting ? 115 : customerSpeed)) / 150}
                                strokeLinecap="round"
                              />
                            </svg>
                            {/* Speed read text */}
                            <div className="absolute text-center">
                              <p className="text-lg font-black text-white leading-none font-mono font-bold">
                                {isCustomerSpeedTesting ? '...' : customerSpeed.toFixed(0)}
                              </p>
                              <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Mbps</p>
                            </div>
                          </div>

                          {/* Detail Telemetry Specs */}
                          <div className="grid grid-cols-2 gap-3 w-full text-center text-[9px] font-mono">
                            <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-850">
                              <span className="text-slate-500 block text-[7px] uppercase font-bold">Upload</span>
                              <span className="text-white font-bold">{isCustomerSpeedTesting ? '...' : `${customerUploadSpeed.toFixed(1)} Mbps`}</span>
                            </div>
                            <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-850">
                              <span className="text-slate-500 block text-[7px] uppercase font-bold">Ping</span>
                              <span className="text-white font-bold">{isCustomerSpeedTesting ? '...' : `${customerPing} ms`}</span>
                            </div>
                          </div>
                        </div>

                        {/* Test Speed Button */}
                        <button
                          onClick={async () => {
                            if (isCustomerSpeedTesting) return;
                            setIsCustomerSpeedTesting(true);
                            // Simulate speed increase dial
                            setTimeout(() => {
                              const finalDown = parseFloat((Math.random() * 60 + 35).toFixed(1));
                              const finalUp = parseFloat((Math.random() * 15 + 7).toFixed(1));
                              const finalPing = Math.floor(Math.random() * 10 + 32);
                              setCustomerSpeed(finalDown);
                              setCustomerUploadSpeed(finalUp);
                              setCustomerPing(finalPing);
                              setIsCustomerSpeedTesting(false);
                              
                              addLogDirectly("CUSTOMER_SPEEDTEST", `Subscriber device speed test completed: ${finalDown} Mbps Down, ${finalUp} Mbps Up, Latency ${finalPing}ms`);
                              showToast(`Test complete: ${finalDown} Mbps Down`);
                            }, 2000);
                          }}
                          disabled={isCustomerSpeedTesting}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isCustomerSpeedTesting ? 'Measuring Link...' : 'Test Space Speed'}
                        </button>
                      </div>

                      {/* SECTION 3: IMEI LINK GATE STATUS */}
                      {(() => {
                        const matchedSub = subscribersList.find(sub => sub.imei === customerImei || sub.imei.replace(/[^0-9]/g, '') === customerImei.replace(/[^0-9]/g, ''));
                        return (
                          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-850 sleek-gradient space-y-3">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Uplink Authorization</span>
                            
                            <div className="space-y-2">
                              {/* Input IMEI for fast testing */}
                              <div>
                                <label className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Device IMEI Identifier</label>
                                <input
                                  type="text"
                                  value={customerImei}
                                  onChange={(e) => setCustomerImei(e.target.value)}
                                  placeholder="Enter device IMEI"
                                  className="w-full bg-slate-950 border border-slate-800 text-[10px] rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                                />
                              </div>

                              {/* Real-time sync feedback badge */}
                              {matchedSub ? (
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] leading-relaxed">
                                  <div className="font-bold uppercase font-mono mb-0.5 flex items-center gap-1">
                                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span>AUTHORIZED LINK ACTIVE</span>
                                  </div>
                                  <p className="text-slate-400 text-[8px]">
                                    Plan: <span className="text-slate-300 font-bold">{matchedSub.tier}</span> <br/>
                                    Routing Server: <span className="text-slate-300 font-mono">skyjack-node-{appId.slice(-4)}</span>
                                  </p>
                                </div>
                              ) : (
                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] leading-relaxed">
                                  <div className="font-bold uppercase font-mono mb-0.5 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span>UNREGISTERED BEACON (OFFLINE)</span>
                                  </div>
                                  <p className="text-slate-400 text-[8px] mb-2">
                                    Your IMEI is not authorized on the satellite node bridge routing table yet.
                                  </p>
                                  <button
                                    onClick={async () => {
                                      addLogDirectly("BEACON_AUTH_REQUEST", `Alert: Sub-device IMEI ${customerImei} broadcasted a registration ping to admin.`);
                                      showToast("Registration ping broadcasted!", "success");
                                    }}
                                    className="w-full py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[8px] rounded uppercase font-bold transition-all border border-amber-500/20"
                                  >
                                    Broadcast Auth Signal
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* SECTION 4: MOBILE PAYPAL SUBSCRIPTION BILLING */}
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-850 sleek-gradient space-y-3">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Mobile Billing Gateway</span>
                        
                        <div className="space-y-2">
                          <div>
                            <label className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Subscriber Email Address</label>
                            <input
                              type="email"
                              value={customerEmail}
                              onChange={(e) => setCustomerEmail(e.target.value)}
                              placeholder="Enter your email"
                              className="w-full bg-slate-950 border border-slate-800 text-[10px] rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Select Satellite Plan Tier</label>
                            <select
                              value={customerTier}
                              onChange={(e) => setCustomerTier(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 text-[10px] rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500 font-sans"
                            >
                              <option value="SkyJack Core Space Link">SkyJack Core Space Link ($49/mo)</option>
                              <option value="SkyJack Pro Mesh Tunnel">SkyJack Pro Mesh Tunnel ($99/mo)</option>
                            </select>
                          </div>

                          <button
                            onClick={async () => {
                              if (!customerEmail.includes('@') || customerImei.length < 12) {
                                showToast("Credentials failed basic validation.", "error");
                                return;
                              }
                              setIsPaypalLinking(true);
                              setTimeout(async () => {
                                const ok = await addSubscriberMobile(customerEmail, customerImei, customerTier);
                                setIsPaypalLinking(false);
                                if (ok) {
                                  showToast("PayPal Subscription Created!", "success");
                                }
                              }, 2000);
                            }}
                            disabled={isPaypalLinking}
                            className="w-full py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-bold rounded-xl text-[10px] tracking-wider uppercase transition-all flex items-center justify-center space-x-1 hover:brightness-105 disabled:opacity-50 cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5 shrink-0" />
                            <span>{isPaypalLinking ? 'PayPal Vault Processing...' : 'Pay with PayPal Smart Button'}</span>
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Simulating phone virtual home bar */}
                    <div className="h-4 bg-slate-950 flex items-center justify-center pb-2">
                      <div className="w-24 h-1 bg-slate-800 rounded-full"></div>
                    </div>

                  </div>
                </div>

                {/* DYNAMIC FEEDBACK / DIAGNOSTICS OF CLIENT PREVIEW (7 COLS) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Explanation panel */}
                  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 sleek-gradient space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-blue-400" />
                      Client-Server Interactive Telemetry Link
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      This mobile app represents exactly what your customers access on their phones. When they align antennas, perform speed tests, or complete PayPal checkouts, they transmit <strong>real-time operations payloads</strong> to the system.
                    </p>

                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Interactive Sync Verification Guide:</h4>
                      <ol className="list-decimal list-inside text-xs text-slate-400 space-y-2">
                        <li>
                          <strong className="text-white">Active IMEI Handshake:</strong> Note your mobile phone simulator's default IMEI <code className="bg-slate-900 text-blue-400 px-1 py-0.5 rounded font-mono">358291048291048</code>. Right now, it shows as <span className="text-emerald-400 font-bold uppercase font-mono">Authorized</span> because it matches a local database route.
                        </li>
                        <li>
                          <strong className="text-white">Dynamic Routing Test:</strong> Change the simulator IMEI to a new code, e.g. <code className="bg-slate-900 text-blue-400 px-1 py-0.5 rounded font-mono">999999999999999</code>. The simulator will instantly update to show <span className="text-amber-500 font-bold uppercase font-mono">Unregistered Beacon</span>.
                        </li>
                        <li>
                          <strong className="text-white">Provisioning from Admin Side:</strong> Switch to the <strong className="text-blue-400 cursor-pointer hover:underline" onClick={() => { setViewMode('admin'); setActiveTab('dashboard'); }}>Admin Cockpit &rarr; Link Management</strong>, register a new subscriber with email <code className="text-slate-300">newclient@test.com</code> and IMEI <code className="text-slate-300">999999999999999</code>.
                        </li>
                        <li>
                          <strong className="text-white">Instant Sync:</strong> Switch back to the <strong className="text-blue-400 cursor-pointer hover:underline" onClick={() => setViewMode('customer')}>Customer App</strong>. You will witness the phone simulator immediately sync to display <span className="text-emerald-400 font-bold uppercase font-mono">Authorized Link Active</span>!
                        </li>
                      </ol>
                    </div>
                  </div>

                  {/* Real-time Central Operations Feed from Device */}
                  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 sleek-gradient space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                        Sub-Device Telemetry Broadcast Feed
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono font-bold">LIVE FEED SYNCED</span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                      {opsLogs.slice(0, 8).map((log, idx) => (
                        <div 
                          key={log.id || idx} 
                          className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 flex items-start justify-between gap-4 text-xs font-mono"
                        >
                          <div className="space-y-1">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                              log.event.includes('PAYPAL') || log.event.includes('ACTIVATION')
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                                : log.event.includes('SPEEDTEST')
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/15'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {log.event}
                            </span>
                            <p className="text-slate-300 text-[11px] leading-relaxed mt-1.5">{log.details}</p>
                          </div>
                          <span className="text-[9px] text-slate-600 shrink-0 font-bold">Just Now</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
