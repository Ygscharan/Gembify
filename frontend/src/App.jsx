import React, { useCallback, useEffect, useState } from 'react';
import { LogOut, Menu, PanelLeftOpen, Smartphone } from 'lucide-react';
import {
  api,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
  setUnauthorizedHandler,
} from './services/api.js';
import { useTheme } from './hooks/useTheme.js';
import Sidebar from './components/Sidebar.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import ProblemForm from './components/ProblemForm.jsx';
import AnalysisLoader from './components/AnalysisLoader.jsx';
import ReportView from './components/ReportView.jsx';
import NewConsultationModal from './components/NewConsultationModal.jsx';
import GembifyMark from './components/GembifyMark.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import CursorSpotlight from './components/CursorSpotlight.jsx';
import UpdateNotifier from './components/UpdateNotifier.jsx';

export default function App() {
  const { isAmoled, toggleTheme } = useTheme();

  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [sessionNotice, setSessionNotice] = useState(null);

  const [activeView, setActiveView] = useState('workspace'); // 'workspace' | 'admin'
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [draftSession, setDraftSession] = useState(null);

  const [health, setHealth] = useState(null);
  const [reports, setReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pendingProblem, setPendingProblem] = useState(null);
  const [analyzeError, setAnalyzeError] = useState(null);

  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstall = (event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event);
    };
    const handleAppInstalled = () => {
      setDeferredInstallPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredInstallPrompt(null);
    }
  };

  const handleLogout = useCallback((notice = null) => {
    clearStoredToken();
    setUser(null);
    setActiveView('workspace');
    setReports([]);
    setActiveReport(null);
    setAnalyzeError(null);
    setChatError(null);
    setNewModalOpen(false);
    setMobileSidebarOpen(false);
    setSessionNotice(typeof notice === 'string' && notice ? notice : null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler((notice) => handleLogout(notice));
    return () => setUnauthorizedHandler(null);
  }, [handleLogout]);

  const fetchAuthenticatedData = useCallback(async () => {
    try {
      const [healthRes, reportsRes] = await Promise.all([
        api.checkHealth().catch(() => null),
        api.listReports().catch(() => []),
      ]);
      setHealth(healthRes);
      setReports(Array.isArray(reportsRes) ? reportsRes : []);
    } catch {
      // Tratado pelos indicadores de status
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      const token = getStoredToken();
      if (!token) {
        if (active) setAuthChecking(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (active && res?.user) {
          setUser(res.user);
        }
      } catch {
        clearStoredToken();
        if (active) setUser(null);
      } finally {
        if (active) setAuthChecking(false);
      }
    }

    verifySession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchAuthenticatedData();
    }
  }, [user, fetchAuthenticatedData]);

  const handleLogin = async (identifier, password) => {
    setSessionNotice(null);
    const res = await api.login(identifier, password);
    setStoredToken(res.token);
    setUser(res.user);
    setActiveView('workspace');
  };

  const handleRegister = async (payload) => {
    setSessionNotice(null);
    const res = await api.register(payload);
    setStoredToken(res.token);
    setUser(res.user);
    setActiveView('workspace');
  };

  const handleSelectReport = async (reportId) => {
    setActiveView('workspace');
    if (activeReport?.id === reportId) return;
    setAnalyzeError(null);
    setChatError(null);
    setIsLoadingReport(true);
    try {
      const fullReport = await api.getReport(reportId);
      setActiveReport(fullReport);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setAnalyzeError(err.message);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleGoHome = () => {
    setActiveView('workspace');
    setActiveReport(null);
    setAnalyzeError(null);
    setChatError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdmin = () => {
    setActiveView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewAnalysis = () => {
    setNewModalOpen(true);
  };

  const handleConfirmNewConsultation = ({ empresa, segmento }) => {
    setNewModalOpen(false);
    setActiveView('workspace');
    setActiveReport(null);
    setAnalyzeError(null);
    setChatError(null);
    setDraftSession({
      sessionKey: Date.now(),
      empresa,
      segmento,
    });
  };

  const handleAnalyzeProblem = async (payload) => {
    setActiveView('workspace');
    setAnalyzeError(null);
    setChatError(null);
    setPendingProblem(payload);
    setIsAnalyzing(true);
    setActiveReport(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const createdReport = await api.analyzeProblem(payload);
      setActiveReport(createdReport);
      const updatedList = await api.listReports().catch(() => null);
      if (Array.isArray(updatedList)) {
        setReports(updatedList);
      }
    } catch (err) {
      setAnalyzeError(
        err.message || 'Erro ao gerar relatório Lean. Verifique o servidor backend e a chave de IA.'
      );
    } finally {
      setIsAnalyzing(false);
      setPendingProblem(null);
    }
  };

  const handleSendChatMessage = async (reportId, message) => {
    setChatError(null);
    setIsSendingChat(true);

    const tempUserId = `temp-${Date.now()}`;
    setActiveReport((prev) => {
      if (!prev || prev.id !== reportId) return prev;
      return {
        ...prev,
        chatHistory: [
          ...(prev.chatHistory || []),
          {
            id: tempUserId,
            role: 'user',
            content: message,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    });

    try {
      const response = await api.sendChatMessage(reportId, message);
      setActiveReport((prev) => {
        if (!prev || prev.id !== reportId) return prev;
        return {
          ...prev,
          chatHistory: response.chatHistory,
        };
      });
      const updatedList = await api.listReports().catch(() => null);
      if (Array.isArray(updatedList)) {
        setReports(updatedList);
      }
    } catch (err) {
      setChatError(err.message || 'Falha ao enviar mensagem para o consultor.');
      setActiveReport((prev) => {
        if (!prev || prev.id !== reportId) return prev;
        return {
          ...prev,
          chatHistory: (prev.chatHistory || []).filter((m) => m.id !== tempUserId),
        };
      });
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      await api.deleteReport(reportId);
      setReports((prev) => prev.filter((item) => item.id !== reportId));
      if (activeReport?.id === reportId) {
        setActiveReport(null);
      }
    } catch (err) {
      setAnalyzeError(err.message);
    }
  };

  if (authChecking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8FAFC] text-slate-900 dark:bg-[#000000] dark:text-zinc-100">
        <GembifyMark size="xl" />
        <p className="font-mono text-xs text-slate-500 dark:text-zinc-500">
          Verificando sessão Gembify...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginScreen
          isAmoled={isAmoled}
          onToggleTheme={toggleTheme}
          onLoginSuccess={handleLogin}
          onRegisterSuccess={handleRegister}
          sessionNotice={sessionNotice}
          canInstallApp={Boolean(deferredInstallPrompt)}
          onInstallApp={handleInstallApp}
        />
        <UpdateNotifier />
      </>
    );
  }

  return (
    <div className="relative flex min-h-screen bg-[#F8FAFC] text-slate-900 transition-colors duration-200 dark:bg-[#000000] dark:text-zinc-100">
      <CursorSpotlight isAmoled={isAmoled} />

      <Sidebar
        desktopOpen={desktopSidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onCollapseDesktop={() => setDesktopSidebarOpen(false)}
        reports={reports}
        selectedReportId={activeView === 'workspace' ? activeReport?.id : null}
        onSelectReport={handleSelectReport}
        onNewAnalysis={handleNewAnalysis}
        onGoHome={handleGoHome}
        onOpenAdmin={handleOpenAdmin}
        isAdminView={activeView === 'admin'}
        onDeleteReport={handleDeleteReport}
        health={health}
        user={user}
        onLogout={() => handleLogout(null)}
      />

      {/* Main Content Shell */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Sticky Topbar */}
        <header
          style={{ paddingTop: 'var(--app-safe-top, 0px)' }}
          className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-slate-200/80 bg-[#F8FAFC]/90 px-4 py-2 backdrop-blur-md sm:px-6 dark:border-[#1F1F1F] dark:bg-[#000000]/95"
        >
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Abrir histórico de consultorias"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 lg:hidden dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-zinc-300"
            >
              <Menu className="h-4 w-4" />
            </button>

            {!desktopSidebarOpen && (
              <button
                type="button"
                onClick={() => setDesktopSidebarOpen(true)}
                title="Expandir barra lateral"
                className="hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 lg:inline-flex dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-zinc-300"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleGoHome}
              className={`flex items-center gap-2 ${
                desktopSidebarOpen ? 'lg:hidden' : 'flex'
              }`}
            >
              <GembifyMark size="sm" />
              <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                Gembify{' '}
                <span className="font-mono text-[11px] font-semibold text-emerald-500">
                  LEAN IA
                </span>
              </span>
            </button>

            {activeView === 'admin' ? (
              <div className="hidden items-center gap-2 text-xs text-slate-400 md:flex dark:text-zinc-500">
                <span>/</span>
                <span className="font-medium text-violet-600 dark:text-violet-400">
                  Painel Administrativo
                </span>
              </div>
            ) : (
              activeReport && (
                <div className="hidden items-center gap-2 text-xs text-slate-400 md:flex dark:text-zinc-500">
                  <span>/</span>
                  <span className="max-w-[260px] truncate font-medium text-slate-700 dark:text-zinc-300">
                    {activeReport.input?.empresa || activeReport.input?.segmento} ·{' '}
                    {activeReport.input?.setor}
                  </span>
                </div>
              )
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {deferredInstallPrompt && (
              <button
                type="button"
                onClick={handleInstallApp}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-400"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Instalar App</span>
              </button>
            )}
            <ThemeToggle isAmoled={isAmoled} onToggle={toggleTheme} />
            <button
              type="button"
              onClick={() => handleLogout(null)}
              title={`Sair (${user.username})`}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-rose-300 hover:text-rose-600 lg:hidden dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-zinc-300 dark:hover:border-rose-500/40 dark:hover:text-rose-400"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <main
          style={{ paddingBottom: 'calc(var(--app-safe-bottom, 0px) + 1.5rem)' }}
          className="industrial-grid-bg flex-1 px-4 py-6 sm:px-6 lg:px-8"
        >
          {activeView === 'admin' && user.role === 'admin' ? (
            <AdminPanel
              currentUser={user}
              health={health}
              onBack={() => setActiveView('workspace')}
            />
          ) : isAnalyzing ? (
            <AnalysisLoader problemPreview={pendingProblem} />
          ) : isLoadingReport ? (
            <div className="mx-auto flex max-w-2xl items-center justify-center py-24">
              <div className="saas-card flex items-center gap-3 px-6 py-4 text-sm font-medium text-slate-600 dark:text-zinc-300">
                <span className="h-2.5 w-2.5 animate-ping rounded-full bg-emerald-500" />
                Carregando diagnóstico Lean...
              </div>
            </div>
          ) : activeReport ? (
            <ReportView
              report={activeReport}
              isAmoled={isAmoled}
              onNewAnalysis={handleNewAnalysis}
              onSendChatMessage={handleSendChatMessage}
              isSendingChat={isSendingChat}
              chatError={chatError}
            />
          ) : (
            <ProblemForm
              onSubmit={handleAnalyzeProblem}
              error={analyzeError}
              health={health}
              draftSession={draftSession}
            />
          )}
        </main>
      </div>

      <NewConsultationModal
        isOpen={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        onConfirm={handleConfirmNewConsultation}
      />

      <UpdateNotifier />
    </div>
  );
}
