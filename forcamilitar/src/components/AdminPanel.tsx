import React, { useEffect, useState } from "react";
import { 
  Settings, KeyRound, AlertTriangle, UserMinus, ShieldAlert, Logs, 
  Trash2, UserX, UserCheck, Star, RefreshCw, Terminal, CheckCircle2,
  Users, Shield, Trophy, LayoutGrid, Award, BookOpen, Clock, Lock
} from "lucide-react";
import { motion } from "motion/react";
import { api } from "../lib/api.js";
import { User, MilitaryRank, SystemLog } from "../types.js";
import ConfirmModal from "./ConfirmModal.js";

interface AdminPanelProps {
  viewer: User;
  militarsList: User[];
  onRefreshDashboard: () => void;
}

export default function AdminPanel({ viewer, militarsList, onRefreshDashboard }: AdminPanelProps) {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // States to authorize delegant administrators
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loadingAdminPerm, setLoadingAdminPerm] = useState(true);

  // States for search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Filtered military lists based on search
  const filteredMilitars = searchTerm.trim()
    ? militarsList.filter(m => 
        m.habboNick.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        m.role.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
    : militarsList;

  // States for password reset
  const [selectedMilitar, setSelectedMilitar] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // States for ban / suspension
  const [actionTarget, setActionTarget] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // States for Hall of Fame
  const [hallMilitar, setHallMilitar] = useState("");
  const [hallInstructor, setHallInstructor] = useState("");
  const [hallDestaque, setHallDestaque] = useState("");
  const [hallSuccess, setHallSuccess] = useState<string | null>(null);

  // States for dynamic training categories management
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categorySuccess, setCategorySuccess] = useState<string | null>(null);

  // States for hierarchy editor
  const [hierarchyList, setHierarchyList] = useState<any[]>([]);
  const [selectedRankToEdit, setSelectedRankToEdit] = useState<string>("");
  const [editRankLabel, setEditRankLabel] = useState("");
  const [editRankDesc, setEditRankDesc] = useState("");
  const [editRankPermissions, setEditRankPermissions] = useState<any>({
    canEnlist: false,
    canPromote: false,
    canTrain: false,
    canManageDocs: false,
    canManageMissions: false,
    canAdminSystem: false
  });
  const [hierarchySuccess, setHierarchySuccess] = useState<string | null>(null);

  // States for pending enlistments in Administration
  const [pendingEnlistments, setPendingEnlistments] = useState<any[]>([]);
  const [enlisting, setEnlisting] = useState(false);
  const [enlistSuccess, setEnlistSuccess] = useState<string | null>(null);
  const [enlistError, setEnlistError] = useState<string | null>(null);

  const fetchEnlistmentRequests = async () => {
    try {
      const data = await api.getEnlistmentRequests();
      setPendingEnlistments(data || []);
    } catch (e) {
      console.warn("Nenhum pedido de alistamento pendente.");
      setPendingEnlistments([]);
    }
  };

  const handleApproveEnlistment = async (id: string, nick: string) => {
    setEnlisting(true);
    setEnlistError(null);
    setEnlistSuccess(null);
    try {
      await api.approveEnlistmentRequest(id);
      setEnlistSuccess(`Alistamento de @${nick} aprovado com sucesso!`);
      fetchEnlistmentRequests();
      onRefreshDashboard();
    } catch (err: any) {
      setEnlistError(err.message || "Erro ao aprovar alistamento.");
    } finally {
      setEnlisting(false);
    }
  };

  const handleRejectEnlistment = async (id: string, nick: string) => {
    setEnlisting(true);
    setEnlistError(null);
    setEnlistSuccess(null);
    try {
      await api.rejectEnlistmentRequest(id);
      setEnlistSuccess(`Pedido de @${nick} recusado com sucesso.`);
      fetchEnlistmentRequests();
      onRefreshDashboard();
    } catch (err: any) {
      setEnlistError(err.message || "Erro ao recusar alistamento.");
    } finally {
      setEnlisting(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const audit = await api.getLogs();
      setLogs(audit || []);
    } catch (e) {
      console.warn("Sem acesso aos logs do Alto Comando.");
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadDestaqueSelections = async () => {
    try {
      const data = await api.getDestaques();
      if (data.militaryOfTheMonth) setHallMilitar(data.militaryOfTheMonth.id);
      if (data.instructorOfTheMonth) setHallInstructor(data.instructorOfTheMonth.id);
      if (data.destaqueOperacional) setHallDestaque(data.destaqueOperacional.id);
    } catch (e) {
      console.warn("Erro ao obter destaques iniciais.");
    }
  };

  const fetchHierarchy = async () => {
    try {
      const data = await api.getHierarchy();
      setHierarchyList(data || []);
      if (data.length > 0) {
        // Preset with the first element's attributes
        handleSelectRank(data[0]);
      }
    } catch (e) {
      console.warn("Erro ao obter a árvore de hierarquias.");
    }
  };

  const handleSelectRank = (config: any) => {
    setSelectedRankToEdit(config.rank);
    setEditRankLabel(config.label);
    setEditRankDesc(config.description);
    setEditRankPermissions(config.permissions || {
      canEnlist: false,
      canPromote: false,
      canTrain: false,
      canManageDocs: false,
      canManageMissions: false,
      canAdminSystem: false
    });
  };

  const handleSaveRankConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRankToEdit) return;
    setHierarchySuccess(null);
    try {
      await api.updateHierarchy(selectedRankToEdit, editRankLabel, editRankDesc, editRankPermissions);
      setHierarchySuccess(`Parâmetros de cargo ajustados e autorizados para "${editRankLabel}"!`);
      // Reload both hierarchy and logs
      const data = await api.getHierarchy();
      setHierarchyList(data || []);
      fetchAuditLogs();
    } catch (err: any) {
      alert(err.message || "Erro ao gravar recalibração de cargo.");
    }
  };

  const fetchCategories = async () => {
    try {
      const list = await api.getTrainingCategories();
      setCategoriesList(list || []);
    } catch (err) {
      console.warn("Erro ao obter categorias de treinamento no painel de controle.");
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCategorySuccess(null);
    try {
      const updated = await api.addTrainingCategory(newCategoryName.trim());
      setCategoriesList(updated || []);
      setNewCategoryName("");
      setCategorySuccess("Categoria militar registrada com sucesso!");
      setTimeout(() => setCategorySuccess(null), 4000);
      fetchAuditLogs();
    } catch (err: any) {
      alert(err.message || "Erro ao adicionar categoria militar.");
    }
  };

  const handleDeleteCategory = async (cat: string) => {
    if (!confirm(`Tem certeza que deseja descredenciar e remover a categoria de instrução "${cat}"?`)) return;
    setCategorySuccess(null);
    try {
      const updated = await api.deleteTrainingCategory(cat);
      setCategoriesList(updated || []);
      setCategorySuccess("Categoria militar removida e descredenciada.");
      setTimeout(() => setCategorySuccess(null), 4000);
      fetchAuditLogs();
    } catch (err: any) {
      alert(err.message || "Erro ao remover categoria.");
    }
  };

  const handlePermissionToggle = (key: string) => {
    setEditRankPermissions((prev: any) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  useEffect(() => {
    const checkAdminPermission = async () => {
      try {
        const hierarchy = await api.getHierarchy();
        const userConfig = hierarchy.find((rc: any) => rc.rank === viewer.role);
        const canAdmin = viewer.role === MilitaryRank.ADMSUPREMO || viewer.role === MilitaryRank.COMANDANTE_GERAL || !!userConfig?.permissions?.canAdminSystem;
        setIsAdminUser(canAdmin);
      } catch (err) {
        console.warn("Erro ao obter hierarquias de comandos:", err);
        setIsAdminUser(viewer.role === MilitaryRank.ADMSUPREMO);
      } finally {
        setLoadingAdminPerm(false);
      }
    };

    checkAdminPermission();
    fetchAuditLogs();
    loadDestaqueSelections();
    fetchHierarchy();
    fetchCategories();
    fetchEnlistmentRequests();
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilitar || !newPass) return;
    
    setPassSuccess(null);
    setPassError(null);
    try {
      await api.resetPassword(selectedMilitar, newPass);
      const targetUser = militarsList.find(m => m.id === selectedMilitar);
      setPassSuccess(`Acesso restaurado! Nova senha configurada para @${targetUser?.habboNick}.`);
      setNewPass("");
      setSelectedMilitar("");
      fetchAuditLogs();
    } catch (err: any) {
      setPassError(err.message || "Erro ao tentar trocar senha.");
    }
  };

  const handleBanSubmit = async () => {
    if (!actionTarget || !actionReason) return;
    setActionSuccess(null);
    setActionError(null);
    try {
      await api.banMilitar(actionTarget, actionReason);
      const target = militarsList.find(m => m.id === actionTarget);
      setActionSuccess(`Militar @${target?.habboNick} foi BANIDO sob os termos do Alto Comando.`);
      setActionReason("");
      setActionTarget("");
      fetchAuditLogs();
      onRefreshDashboard();
    } catch (err: any) {
      setActionError(err.message || "Ação inválida.");
    }
  };

  const handleSuspendSubmit = async () => {
    if (!actionTarget || !actionReason) return;
    setActionSuccess(null);
    setActionError(null);
    try {
      await api.suspendMilitar(actionTarget, actionReason);
      const target = militarsList.find(m => m.id === actionTarget);
      setActionSuccess(`Militar @${target?.habboNick} foi SUSPENSO.`);
      setActionReason("");
      setActionTarget("");
      fetchAuditLogs();
      onRefreshDashboard();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleReactivateSubmit = async () => {
    if (!actionTarget) return;
    setActionSuccess(null);
    setActionError(null);
    try {
      await api.reactivateMilitar(actionTarget);
      const target = militarsList.find(m => m.id === actionTarget);
      setActionSuccess(`Conta do militar @${target?.habboNick} foi REATIVADA.`);
      setActionTarget("");
      fetchAuditLogs();
      onRefreshDashboard();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleDeleteSubmit = () => {
    if (!actionTarget) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (!actionTarget) return;
    setActionSuccess(null);
    setActionError(null);
    try {
      await api.deleteMilitar(actionTarget);
      setActionSuccess(`Militar expulso e deletado eternamente do sistema.`);
      setActionTarget("");
      fetchAuditLogs();
      onRefreshDashboard();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleDestaquesSave = async () => {
    setHallSuccess(null);
    try {
      await api.updateDestaques(hallMilitar, hallInstructor, hallDestaque);
      setHallSuccess("Quadro de Destaques e Medalhas do Hall da Fama atualizados com sucesso!");
      fetchAuditLogs();
      onRefreshDashboard();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loadingAdminPerm) {
    return <div className="text-center py-10 font-mono text-gray-500 text-xs">Avaliando credenciais do militar...</div>;
  }

  if (!isAdminUser) {
    return (
      <div className="p-8 border border-red-500/20 bg-red-950/10 rounded-lg text-center font-mono space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
        <h4 className="text-white uppercase font-bold text-base">Acesso Negado: Célula de Comando Suprema</h4>
        <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
          Sua patente militar de <span className="text-fmb-gold font-bold">{viewer.role}</span> não confere credenciais para alterar configurações centrais do sistema, redefinir acessos, ou analisar as folhas secretas de log.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 pb-3 border-b border-fmb-army/20">
        <Settings className="w-5 h-5 text-fmb-gold" />
        <h3 className="font-display font-bold text-lg text-white uppercase tracking-tight">Administração & Controle Supremo</h3>
      </div>

      {/* PAINEL FLUTUANTE DE PESQUISA DE INTEGRANTES */}
      <div className="bg-fmb-black/95 border border-fmb-army/30 p-4 rounded-lg font-mono text-xs text-left relative flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg animate-fade-in">
        <div className="flex items-center space-x-3">
          <div className="bg-fmb-army/20 p-1.5 border border-fmb-gold/30 rounded">
            <Users className="w-4 h-4 text-fmb-gold" />
          </div>
          <div>
            <h4 className="text-white uppercase text-[11px] font-bold tracking-wider">Filtro Rápido de Integrantes</h4>
            <span className="text-[9px] text-gray-500 block leading-tight">Filtre nicks de militares para redefinir senhas, sanções ou destaques do Hall</span>
          </div>
        </div>
        <div className="relative w-full md:w-80">
          <span className="absolute left-3 top-2.5 text-fmb-gold font-bold">@</span>
          <input
            type="text"
            placeholder="Pesquisar por nick ou patente militar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-fmb-slate border border-fmb-army/45 focus:border-fmb-gold rounded py-2 pl-7 pr-8 text-white font-mono text-[11px] outline-none transition-all placeholder:text-gray-600 shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-white font-bold text-sm cursor-pointer transition-colors"
              title="Limpar pesquisa"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ACTION COLUMN 1: PASSWORD RESET, PENDING ENLISTMENTS & HALL CONFIG */}
        <div className="space-y-6">
          
          {/* ALISTAMENTO (PEDIDOS PENDENTES) CARD */}
          <div className="bg-fmb-black/95 border border-fmb-army/20 p-5 rounded-lg font-mono text-xs text-left relative">
            <Users className="absolute top-4 right-4 w-5 h-5 text-fmb-gold opacity-30" />
            <h4 className="text-white uppercase text-xs font-bold font-display border-b border-fmb-army/10 pb-2 mb-4 flex items-center space-x-1.5">
              <span>Aprovar Alistamentos de Recrutas</span>
              <span className="text-[9px] bg-fmb-gold/10 text-fmb-gold border border-fmb-gold/30 px-1.5 py-0.5 rounded font-mono ml-2 lowercase">
                {pendingEnlistments.length} fila de espera
              </span>
            </h4>

            {enlistSuccess && (
              <div className="mb-3 p-2 bg-green-950/20 border border-green-500/30 text-green-300 rounded text-[10px]">
                {enlistSuccess}
              </div>
            )}
            {enlistError && (
              <div className="mb-3 p-2 bg-red-950/20 border border-red-500/30 text-red-300 rounded text-[10px]">
                {enlistError}
              </div>
            )}

            <div className="space-y-3 font-mono text-xs max-h-[300px] overflow-y-auto pr-1">
              {pendingEnlistments.length === 0 ? (
                <div className="text-center py-6 text-gray-500 italic text-[11px]">
                  Nenhum pedido de alistamento no limbo militar.
                </div>
              ) : (
                pendingEnlistments.map((req) => (
                  <div key={req.id} className="p-3 bg-fmb-slate/40 border border-fmb-army/25 rounded flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-white text-[11.5px]">@{req.habboNick}</p>
                      <p className="text-[8px] text-gray-400 mt-1 uppercase">Solicitado em: {new Date(req.createdAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => handleApproveEnlistment(req.id, req.habboNick)}
                        disabled={enlisting}
                        className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-bold px-2.5 py-1 rounded text-[10px] uppercase transition-colors pointer-events-auto cursor-pointer"
                        title="Aproveitar com Farda de Recruta"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleRejectEnlistment(req.id, req.habboNick)}
                        disabled={enlisting}
                        className="bg-red-900 hover:bg-red-850 disabled:opacity-50 text-white font-bold px-2.5 py-1 rounded text-[10px] uppercase transition-colors pointer-events-auto cursor-pointer"
                        title="Recusar registro definitivamente"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RESET CREDENTIALS PANEL */}
          <div className="bg-fmb-black/95 border border-fmb-army/20 p-5 rounded-lg font-mono text-xs text-left relative">
            <KeyRound className="absolute top-4 right-4 w-5 h-5 text-fmb-gold opacity-30" />
            <h4 className="text-white uppercase text-xs font-bold font-display border-b border-fmb-army/10 pb-2 mb-4">
              Restaurar Senha Militar
            </h4>

            {passSuccess && <div className="mb-3 p-2 bg-green-950/20 border border-green-500/30 text-green-300 rounded text-[10px]">{passSuccess}</div>}
            {passError && <div className="mb-3 p-2 bg-red-950/20 border border-red-500/30 text-red-300 rounded text-[10px]">{passError}</div>}

            <form onSubmit={handlePasswordReset} className="space-y-3">
              <div>
                <label className="text-[9px] text-fmb-gold uppercase block mb-1">Selecione o Militar</label>
                <select 
                  value={selectedMilitar}
                  onChange={(e) => setSelectedMilitar(e.target.value)}
                  className="w-full bg-fmb-slate border border-fmb-army/30 rounded py-1 px-2 text-white outline-none cursor-pointer"
                  required
                >
                  <option value="">Selecione...</option>
                  {filteredMilitars.map(m => (
                    <option key={m.id} value={m.id}>@{m.habboNick} ({m.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] text-fmb-gold uppercase block mb-1">Nova Senha Provisória</label>
                <input 
                  type="password"
                  placeholder="NovaSenhaFMB1"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full bg-fmb-slate border border-fmb-army/30 rounded py-1 px-2 text-white outline-none"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-fmb-army hover:bg-fmb-olive border border-fmb-gold/40 text-white font-bold py-1.5 rounded uppercase tracking-wider text-[10px]"
              >
                Atualizar Senha
              </button>
            </form>
          </div>

          {/* HALL OF FAME HEROES CONFIGURATION */}
          <div className="bg-fmb-black/95 border border-fmb-army/20 p-5 rounded-lg font-mono text-xs text-left relative">
            <Star className="absolute top-4 right-4 w-5 h-5 text-fmb-gold opacity-30" />
            <h4 className="text-white uppercase text-xs font-bold font-display border-b border-fmb-army/10 pb-2 mb-4">
              Configurar Quadro do Hall da Fama
            </h4>

            {hallSuccess && <div className="mb-3 p-2 bg-green-950/20 border border-green-500/30 text-green-300 rounded text-[10px]">{hallSuccess}</div>}

            <div className="space-y-3">
              <div>
                <label className="text-[9px] text-fmb-gold uppercase block mb-1">🏆 Militar do Mês</label>
                <select 
                  value={hallMilitar}
                  onChange={(e) => setHallMilitar(e.target.value)}
                  className="w-full bg-fmb-slate border border-fmb-army/30 rounded py-1.5 px-2 text-white outline-none"
                >
                  <option value="">Desvinculado</option>
                  {filteredMilitars.map(m => (
                    <option key={m.id} value={m.id}>@{m.habboNick} ({m.role})</option>
                  ))}
                </select>
                <span className="text-[8px] text-gray-500 mt-0.5 block">Automático: Concede medalha de Militar do Mês.</span>
              </div>

              <div>
                <label className="text-[9px] text-fmb-gold uppercase block mb-1">🎓 Instrutor de Elite do Mês</label>
                <select 
                  value={hallInstructor}
                  onChange={(e) => setHallInstructor(e.target.value)}
                  className="w-full bg-fmb-slate border border-fmb-army/30 rounded py-1.5 px-2 text-white outline-none"
                >
                  <option value="">Desvinculado</option>
                  {filteredMilitars.map(m => (
                    <option key={m.id} value={m.id}>@{m.habboNick} ({m.role})</option>
                  ))}
                </select>
                <span className="text-[8px] text-gray-500 mt-0.5 block">Automático: Concede medalha de Instrutor do Mês.</span>
              </div>

              <div>
                <label className="text-[9px] text-fmb-gold uppercase block mb-1">⚡ Destaque Operacional</label>
                <select 
                  value={hallDestaque}
                  onChange={(e) => setHallDestaque(e.target.value)}
                  className="w-full bg-fmb-slate border border-fmb-army/30 rounded py-1.5 px-2 text-white outline-none"
                >
                  <option value="">Desvinculado</option>
                  {filteredMilitars.map(m => (
                    <option key={m.id} value={m.id}>@{m.habboNick} ({m.role})</option>
                  ))}
                </select>
                <span className="text-[8px] text-gray-500 mt-0.5 block">Automático: Concede medalha de Crachá de Bravura.</span>
              </div>

              <button 
                onClick={handleDestaquesSave}
                className="w-full bg-fmb-army hover:bg-fmb-olive border border-fmb-gold/45 text-white font-bold py-2 rounded uppercase tracking-wider text-[10px]"
              >
                Gravar Quadro Tático
              </button>
            </div>
          </div>

        </div>

        {/* ACTION COLUMN 2: SECURITY & AUDITING TERMS */}
        <div className="space-y-6">
          
          {/* USER MANAGEMENT (BAN/SUSPEND/PURGE) */}
          <div className="bg-fmb-black/95 border border-fmb-army/20 p-5 rounded-lg font-mono text-xs text-left relative">
            <ShieldAlert className="absolute top-4 right-4 w-5 h-5 text-red-500 opacity-35" />
            <h4 className="text-white uppercase text-xs font-bold font-display border-b border-fmb-army/10 pb-2 mb-4">
              Célula de Sanções & Punições Militars
            </h4>

            {actionSuccess && <div className="mb-3 p-2 bg-green-950/20 border border-green-500/30 text-green-300 rounded text-[10px]">{actionSuccess}</div>}
            {actionError && <div className="mb-3 p-2 bg-red-950/20 border border-red-500/30 text-red-300 rounded text-[10px]">{actionError}</div>}

            <div className="space-y-3">
              <div>
                <label className="text-[9px] text-fmb-gold uppercase block mb-1">Militar Alvo</label>
                <select 
                  value={actionTarget}
                  onChange={(e) => setActionTarget(e.target.value)}
                  className="w-full bg-fmb-slate border border-fmb-army/30 rounded py-1.5 px-2 text-white outline-none"
                >
                  <option value="">Selecione...</option>
                  {filteredMilitars
                    .filter(m => m.id !== viewer.id)
                    .map(m => (
                      <option key={m.id} value={m.id}>@{m.habboNick} ({m.role}) [{m.status}]</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] text-fmb-gold uppercase block mb-1">Justificativa da Punição (Bans/Suspensão)</label>
                <textarea 
                  placeholder="Insira as ordens ou termos infringidos de nossa disciplina..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={2}
                  className="w-full bg-fmb-slate border border-fmb-army/30 rounded py-1.5 px-2 text-white outline-none resize-none"
                />
              </div>

              {/* Sanction row button controllers */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button 
                  onClick={handleSuspendSubmit}
                  className="bg-amber-900/60 hover:bg-amber-800 text-white font-bold py-1.5 rounded uppercase tracking-wider text-[9px] border border-amber-600/30"
                >
                  Suspender
                </button>
                <button 
                  onClick={handleBanSubmit}
                  className="bg-red-900/60 hover:bg-red-800 text-white font-bold py-1.5 rounded uppercase tracking-wider text-[9px] border border-red-600/30"
                >
                  Banir Conta
                </button>
                <button 
                  onClick={handleReactivateSubmit}
                  className="bg-fmb-army hover:bg-fmb-olive text-white font-bold py-1.5 rounded uppercase tracking-wider text-[9px] border border-fmb-gold/20"
                >
                  Reativar
                </button>
                <button 
                  onClick={handleDeleteSubmit}
                  className="bg-red-950 hover:bg-red-900 text-red-200 font-bold py-1.5 rounded uppercase tracking-wider text-[9px] border border-red-800/40"
                >
                  Purgar B.D
                </button>
              </div>
            </div>
          </div>

          {/* CATEGORIES MANAGEMENT PANEL */}
          <div className="bg-fmb-black/95 border border-fmb-army/20 p-5 rounded-lg font-mono text-xs text-left relative">
            <BookOpen className="absolute top-4 right-4 w-5 text-fmb-gold opacity-30 animate-pulse" />
            <h4 className="text-white uppercase text-xs font-bold font-display border-b border-fmb-army/10 pb-2 mb-4">
              Gerenciar Categorias de Instruções
            </h4>

            {categorySuccess && (
              <div className="mb-3 p-2 bg-green-950/20 border border-green-500/30 text-green-300 rounded text-[10px] uppercase font-bold">
                {categorySuccess}
              </div>
            )}
            
            <div className="space-y-4">
              {/* List of current categories with Delete buttons */}
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto border border-fmb-army/15 rounded p-2.5 bg-fmb-black/40 scrollbar-thin">
                <span className="text-[9px] text-fmb-gold uppercase block font-bold border-b border-fmb-army/10 pb-1 mb-1">Categorias Ativas</span>
                {categoriesList.length === 0 ? (
                  <div className="text-gray-500 italic text-[10px] py-2 text-center">Nenhuma categoria cadastrada.</div>
                ) : (
                  categoriesList.map(cat => (
                    <div key={cat} className="flex items-center justify-between py-1 border-b border-fmb-army/10 last:border-b-0 text-[10px]">
                      <span className="text-gray-200 font-bold">{cat}</span>
                      <button 
                        onClick={() => handleDeleteCategory(cat)}
                        className="text-red-400 hover:text-red-200 p-0.5 transition-colors cursor-pointer"
                        title="Deletar categoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add form */}
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <div className="flex-1">
                  <input 
                    type="text"
                    placeholder="Ex: Tático Avançado"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full bg-fmb-slate border border-fmb-army/30 rounded py-1 px-2 text-white outline-none focus:border-fmb-gold mb-1 text-[11px]"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-fmb-army hover:bg-fmb-olive border border-fmb-gold/45 text-white font-bold px-3 rounded uppercase text-[9px] tracking-wider transition-all h-[26px]"
                >
                  Adicionar
                </button>
              </form>
            </div>
          </div>

          {/* MONOCHROME COMPILER AUDITING LOGS */}
          <div className="bg-fmb-black border border-fmb-army/30 rounded-lg p-4 font-mono text-[10px] text-left relative flex flex-col h-[270px]">
            <div className="flex items-center justify-between border-b border-fmb-army/20 pb-2 mb-2 text-gray-500 font-bold shrink-0">
              <span className="flex items-center">
                <Terminal className="w-3.5 h-3.5 mr-1.5 text-fmb-gold animate-pulse" />
                <span>INTEGRIDADE DOS LOGS DE AUDITORIA</span>
              </span>
              <button onClick={fetchAuditLogs} className="hover:text-white" title="Atualizar Logs">
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 h-full scrollbar-thin">
              {loadingLogs ? (
                <div className="text-gray-500 py-6 text-center italic">Descodificando canais operacionais...</div>
              ) : logs.length === 0 ? (
                <div className="text-gray-500 py-6 text-center italic">Nenhum evento registrado.</div>
              ) : (
                logs.map(lg => {
                  let alertText = "text-gray-400";
                  if (lg.action.includes("BAN") || lg.action.includes("ESTAURA") || lg.action.includes("SUSPEN")) alertText = "text-red-400 font-bold";
                  if (lg.action.includes("PROM")) alertText = "text-green-400 font-bold";
                  if (lg.action.includes("SERVIC")) alertText = "text-amber-400";

                  return (
                    <div key={lg.id} className="border-b border-fmb-slate/30 pb-1.5">
                      <div className="flex items-center justify-between text-gray-600 font-bold text-[8px] mb-1">
                        <span>{new Date(lg.timestamp).toLocaleString("pt-BR")}</span>
                        <span className={alertText}>{lg.action}</span>
                      </div>
                      <p className="text-gray-300 leading-normal">
                        <strong className="text-fmb-gold">@{lg.userNick}:</strong> {lg.details}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

      {/* FULL-WIDTH SECTION: POLICE HIERARCHY & PERMISSIONS ASSIGNMENT */}
      <div className="bg-fmb-black/95 border border-fmb-army/30 rounded-lg p-6 font-mono text-xs text-left relative space-y-4">
        <Users className="absolute top-5 right-6 w-5 h-5 text-fmb-gold opacity-30" />
        <h4 className="text-white uppercase text-xs font-bold font-display border-b border-fmb-army/15 pb-2 mb-4 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-fmb-gold" />
          <span>Configuração de Hierarquia e Atribuição de Funções Táticas</span>
        </h4>

        {hierarchySuccess && (
          <div className="p-2.5 bg-green-950/20 border border-green-500/30 text-green-300 rounded text-[10px] uppercase font-bold">
            {hierarchySuccess}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rank list column */}
          <div className="border border-fmb-army/20 rounded p-3 space-y-2 max-h-[380px] overflow-y-auto bg-fmb-black/40 scrollbar-thin">
            <span className="text-[9px] text-fmb-gold uppercase block font-bold border-b border-fmb-army/10 pb-1 mb-2">
              Selecione Patente / Cargo
            </span>
            {hierarchyList.map(rc => (
              <button
                key={rc.rank}
                onClick={() => handleSelectRank(rc)}
                className={`w-full text-left p-2 rounded transition-all font-mono text-[10px] flex items-center justify-between ${
                  selectedRankToEdit === rc.rank
                    ? "bg-fmb-army text-white font-bold border-l-4 border-fmb-gold shadow-md"
                    : "text-gray-300 hover:bg-fmb-slate/40"
                }`}
              >
                <span>{rc.label}</span>
                <span className="text-[8px] text-gray-500 font-semibold uppercase">{rc.rank}</span>
              </button>
            ))}
          </div>

          {/* Form and Toggles column */}
          <div className="lg:col-span-2 border border-fmb-army/20 rounded p-4 bg-fmb-slate/15 space-y-4">
            {selectedRankToEdit ? (
              <form onSubmit={handleSaveRankConfig} className="space-y-4">
                <div className="flex justify-between items-center border-b border-fmb-army/10 pb-2">
                  <span className="text-[10px] text-fmb-gold font-bold">AJUSTANDO CREDENCIAIS DE CARGO: {selectedRankToEdit}</span>
                  <span className="bg-fmb-black py-0.5 px-2 border border-fmb-army/30 rounded text-[9px] text-gray-400 font-bold">
                    ID: {selectedRankToEdit}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-fmb-gold block uppercase mb-1">Nome de Exibição / Sigla</label>
                    <input
                      type="text"
                      value={editRankLabel}
                      onChange={(e) => setEditRankLabel(e.target.value)}
                      className="w-full bg-fmb-black border border-fmb-army/30 py-1.5 px-2.5 rounded text-white outline-none focus:border-fmb-gold text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-fmb-gold block uppercase mb-1">Descrição do Cargo</label>
                    <input
                      type="text"
                      value={editRankDesc}
                      onChange={(e) => setEditRankDesc(e.target.value)}
                      className="w-full bg-fmb-black border border-fmb-army/30 py-1.5 px-2.5 rounded text-white outline-none focus:border-fmb-gold text-xs"
                      placeholder="Diretrizes do Cargo..."
                    />
                  </div>
                </div>

                {/* Permissions Toggles */}
                <div>
                  <label className="text-[10px] text-fmb-gold block uppercase mb-2.5 font-bold border-b border-fmb-army/10 pb-1">
                    Atribuir Atividades e Permissões Administrativas
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    
                    {/* canEnlist Toggle */}
                    <div 
                      onClick={() => handlePermissionToggle("canEnlist")}
                      className={`p-3 rounded border transition-all cursor-pointer flex flex-col justify-between h-[85px] leading-tight ${
                        editRankPermissions.canEnlist 
                          ? "border-green-500/35 bg-green-950/25 text-white" 
                          : "border-fmb-army/20 bg-fmb-black/40 text-gray-400 hover:border-fmb-army/45"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[9px]">ALISTAR RECRUTAS</span>
                        <input
                          type="checkbox"
                          checked={!!editRankPermissions.canEnlist}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 accent-green-500 cursor-pointer pointer-events-none"
                        />
                      </div>
                      <span className="text-[8px] text-gray-500 block mt-1 uppercase leading-normal">
                        Acesso ao portão para fardar novos integrantes.
                      </span>
                    </div>

                    {/* canPromote Toggle */}
                    <div 
                      onClick={() => handlePermissionToggle("canPromote")}
                      className={`p-3 rounded border transition-all cursor-pointer flex flex-col justify-between h-[85px] leading-tight ${
                        editRankPermissions.canPromote 
                          ? "border-green-500/35 bg-green-950/25 text-white" 
                          : "border-fmb-army/20 bg-fmb-black/40 text-gray-400 hover:border-fmb-army/45"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[9px]">EFETUAR PROMOÇÕES</span>
                        <input
                          type="checkbox"
                          checked={!!editRankPermissions.canPromote}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 accent-green-500 cursor-pointer pointer-events-none"
                        />
                      </div>
                      <span className="text-[8px] text-gray-500 block mt-1 uppercase leading-normal">
                        Pode conceder ascensões táticas oficiais a praças.
                      </span>
                    </div>

                    {/* canTrain Toggle */}
                    <div 
                      onClick={() => handlePermissionToggle("canTrain")}
                      className={`p-3 rounded border transition-all cursor-pointer flex flex-col justify-between h-[85px] leading-tight ${
                        editRankPermissions.canTrain 
                          ? "border-green-500/35 bg-green-950/25 text-white" 
                          : "border-fmb-army/20 bg-fmb-black/40 text-gray-400 hover:border-fmb-army/45"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[9px]">MINISTRAR TREINOS</span>
                        <input
                          type="checkbox"
                          checked={!!editRankPermissions.canTrain}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 accent-green-500 cursor-pointer pointer-events-none"
                        />
                      </div>
                      <span className="text-[8px] text-gray-500 block mt-1 uppercase leading-normal">
                        Ministrar instruções de tiro e doutrinas.
                      </span>
                    </div>

                    {/* canManageDocs Toggle */}
                    <div 
                      onClick={() => handlePermissionToggle("canManageDocs")}
                      className={`p-3 rounded border transition-all cursor-pointer flex flex-col justify-between h-[85px] leading-tight ${
                        editRankPermissions.canManageDocs 
                          ? "border-green-500/35 bg-green-950/25 text-white" 
                          : "border-fmb-army/20 bg-fmb-black/40 text-gray-400 hover:border-fmb-army/45"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[9px]">GERENCIAR MANUAIS</span>
                        <input
                          type="checkbox"
                          checked={!!editRankPermissions.canManageDocs}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 accent-green-500 cursor-pointer pointer-events-none"
                        />
                      </div>
                      <span className="text-[8px] text-gray-500 block mt-1 uppercase leading-normal">
                        Postar slides de aula, apostilas (PDF) e scripts.
                      </span>
                    </div>

                    {/* canManageMissions Toggle */}
                    <div 
                      onClick={() => handlePermissionToggle("canManageMissions")}
                      className={`p-3 rounded border transition-all cursor-pointer flex flex-col justify-between h-[85px] leading-tight ${
                        editRankPermissions.canManageMissions 
                          ? "border-green-500/35 bg-green-950/25 text-white" 
                          : "border-fmb-army/20 bg-fmb-black/40 text-gray-400 hover:border-fmb-army/45"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[9px]">ATIVAR OPERAÇÕES</span>
                        <input
                          type="checkbox"
                          checked={!!editRankPermissions.canManageMissions}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 accent-green-500 cursor-pointer pointer-events-none"
                        />
                      </div>
                      <span className="text-[8px] text-gray-500 block mt-1 uppercase leading-normal">
                        Criar e retificar metas do quadro de missões.
                      </span>
                    </div>

                    {/* canAdminSystem Toggle */}
                    <div 
                      onClick={() => handlePermissionToggle("canAdminSystem")}
                      className={`p-3 rounded border transition-all cursor-pointer flex flex-col justify-between h-[85px] leading-tight ${
                        editRankPermissions.canAdminSystem 
                          ? "border-red-500/35 bg-red-950/25 text-white" 
                          : "border-fmb-army/20 bg-fmb-black/40 text-gray-400 hover:border-fmb-army/45"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[9px] text-red-400">ADMIN SUPREMO</span>
                        <input
                          type="checkbox"
                          checked={!!editRankPermissions.canAdminSystem}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 accent-red-500 cursor-pointer pointer-events-none"
                        />
                      </div>
                      <span className="text-[8px] text-gray-500 block mt-1 uppercase leading-normal">
                        Controle irrestrito de senhas, sanções e exclusões.
                      </span>
                    </div>

                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-fmb-army hover:bg-fmb-olive border border-fmb-gold/45 text-white font-bold py-2 px-6 rounded uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
                  >
                    Publicar Alterações de Cargo
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-gray-500 italic text-center py-20">Selecione uma patente na árvore ao lado para editar.</p>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Expulsar e Excluir Militar"
        message="ATENÇÃO MÁXIMA: Deseja apagar essa conta militar para sempre do banco de dados FMB? Toda e qualquer pontuação, medalhas e registros desta conta serão excluídos de forma definitiva e irreversível."
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

    </div>
  );
}
