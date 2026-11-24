import React, { useCallback, useEffect, useState } from 'react';
import { Menu, PanelLeftOpen } from 'lucide-react';
import { api } from './services/api.js';
import { useTheme } from './hooks/useTheme.js';
import Sidebar from './components/Sidebar.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import ProblemForm from './components/ProblemForm.jsx';
import AnalysisLoader from './components/AnalysisLoader.jsx';
import ReportView from './components/ReportView.jsx';
import NewConsultationModal from './components/NewConsultationModal.jsx';
import GembifyMark from './components/GembifyMark.jsx';

export default function App() {
  const { isAmoled, toggleTheme } = useTheme();

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

  const fetchInitialData = useCallback(async () => {
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
    fetchInitialData();
  }, [fetchInitialData]);

  const handleSelectReport = async (reportId) => {
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
    setActiveReport(null);
    setAnalyzeError(null);
    setChatError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewAnalysis = () => {
    setNewModalOpen(true);
  };

  const handleConfirmNewConsultation = ({ empresa, segmento }) => {
    setNewModalOpen(false);
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

    // Atualização otimista da mensagem do usuário
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
      // Reverte mensagem otimista em caso de erro
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

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 transition-colors duration-200 dark:bg-[#000000] dark:text-zinc-100">
      <Sidebar
        desktopOpen={desktopSidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onCollapseDesktop={() => setDesktopSidebarOpen(false)}
        reports={reports}
        selectedReportId={activeReport?.id}
        onSelectReport={handleSelectReport}
        onNewAnalysis={handleNewAnalysis}
        onGoHome={handleGoHome}
        onDeleteReport={handleDeleteReport}
        health={health}
      />

      {/* Main Content Shell */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-[#F8FAFC]/85 px-4 backdrop-blur-md sm:px-6 dark:border-[#1F1F1F] dark:bg-[#000000]/85">
          <div className="flex items-center gap-2.5">
            {/* Mobile drawer toggle */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Abrir histórico de consultorias"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 lg:hidden dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-zinc-300"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Desktop reopen sidebar toggle */}
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

            {/* Compact brand indicator when sidebar is collapsed or on mobile */}
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

            {activeReport && (
              <div className="hidden items-center gap-2 text-xs text-slate-400 md:flex dark:text-zinc-500">
                <span>/</span>
                <span className="max-w-[260px] truncate font-medium text-slate-700 dark:text-zinc-300">
                  {activeReport.input?.segmento} · {activeReport.input?.setor}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle isAmoled={isAmoled} onToggle={toggleTheme} />
          </div>
        </header>

        {/* Scrollable Workspace */}
        <main className="industrial-grid-bg flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {isAnalyzing ? (
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
    </div>
  );
}
