import React, { useEffect, useState } from "react";
import { 
  ArrowLeft, Calendar, Clock, GraduationCap, Award, Shield, UserX, 
  UserCheck, AlertTriangle, Medal, Timer, Target, CheckCircle2,
  RefreshCw
} from "lucide-react";
import { motion } from "motion/react";
import { api } from "../lib/api.js";
import { User, Promotion, Training, PontoLog, LIST_OF_MEDALS, RecruitLesson } from "../types.js";

interface UserProfileProps {
  militarId: string;
  onClose: () => void;
  viewer: User;
}

export default function UserProfile({ militarId, onClose, viewer }: UserProfileProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<User | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [pontes, setPontes] = useState<PontoLog[]>([]);
  const [recruitLessons, setRecruitLessons] = useState<RecruitLesson[]>([]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getUserById(militarId);
      setProfile(data.user);
      setPromotions(data.promotions || []);
      setTrainings(data.trainings || []);
      setPontes(data.pontes || []);
      setRecruitLessons(data.recruitLessons || []);
    } catch (err: any) {
      setError(err.message || "Erro ao obter ficha militar.");
    } finally {
      setLoading(false);
    }
  };

  const [syncing, setSyncing] = useState(false);

  const handleSyncHabbo = async () => {
    if (!profile) return;
    setSyncing(true);
    try {
      const updatedUser = await api.syncUserHabboProfile(profile.id);
      setProfile(updatedUser);
    } catch (err: any) {
      alert("Erro ao sincronizar dados da farda FMB: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [militarId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <span className="inline-block animate-spin border-4 border-fmb-gold border-t-transparent w-8 h-8 rounded-full" />
        <p className="text-xs font-mono text-gray-400">CARREGANDO ARQUIVO DE IDENTIFICAÇÃO CONFIDENCIAL...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-4 border border-red-500/20 bg-red-950/20 rounded text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm font-mono text-red-200">{error || "Não foi possível resgatar o arquivo militar."}</p>
        <button onClick={onClose} className="mt-4 text-xs font-mono text-fmb-gold hover:underline">Voltar ao QG</button>
      </div>
    );
  }

  // Calculate worked hours
  const hoursWorked = (profile.totalServiceSeconds / 3600).toFixed(1);

  // Compute daily, weekly, and monthly hours worked from pontes logs
  const getHoursInPeriod = (daysCount: number) => {
    const cutOff = Date.now() - daysCount * 24 * 60 * 60 * 1000;
    const totalSeconds = pontes
      .filter(p => {
        const time = new Date(p.checkInTime).getTime();
        return time >= cutOff;
      })
      .reduce((sum, p) => {
        let sec = p.durationSeconds;
        if (!p.checkOutTime) {
          // If checkOutTime is null (meaning user is currently clocked in right now),
          // dynamically compute elapsed time from checkInTime to NOW so hours update live!
          sec = Math.max(0, Math.floor((Date.now() - new Date(p.checkInTime).getTime()) / 1000));
        }
        return sum + sec;
      }, 0);
    return (totalSeconds / 3600).toFixed(1);
  };

  const dailyHours = getHoursInPeriod(1);
  const weeklyHours = getHoursInPeriod(7);
  const monthlyHours = getHoursInPeriod(30);

  return (
    <div className="space-y-6">
      {/* Return Header */}
      <div className="flex items-center justify-between pb-3 border-b border-fmb-army/20">
        <button 
          onClick={onClose}
          className="flex items-center text-xs font-mono uppercase text-gray-400 hover:text-fmb-gold transition-colors space-x-1.5"
          id="profile-back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Efetivo militar</span>
        </button>
        <span className="text-[9px] font-mono text-fmb-gold uppercase tracking-widest bg-fmb-slate px-2 py-0.5 border border-fmb-army/20">
          DOC militar Nº {profile.id.toUpperCase()}
        </span>
      </div>

      {/* Profile Header Details card */}
      <div className="bg-fmb-slate/40 border border-fmb-army/30 rounded-lg p-6 relative overflow-hidden">
        {/* Overhead tactical scanline container */}
        <div className="absolute top-0 right-0 p-4 bg-fmb-army/5 rounded">
          <Shield className="w-16 h-16 text-fmb-army/10 shrink-0 select-none" />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 relative">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full bg-fmb-black border border-fmb-army/45 overflow-hidden flex items-center justify-center shadow-lg">
              <img 
                src={`https://www.habbo.com/habbo-imaging/avatarimage?figure=${profile.habboAvatar}&size=l&direction=3&head_direction=3&gesture=sml&action=std`} 
                alt={profile.habboNick}
                className="scale-125 translate-y-3"
                referrerPolicy="no-referrer"
              />
            </div>
            {profile.activeState === "Em Serviço" && (
              <span className="absolute bottom-0 right-1 px-2 py-0.5 bg-amber-500 text-fmb-black text-[8px] font-mono font-black uppercase rounded border border-fmb-black animate-pulse">
                SERVIÇO
              </span>
            )}
          </div>

          <div className="text-center sm:text-left leading-tight space-y-2">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h3 className="font-display font-black text-2xl text-white">@{profile.habboNick}</h3>
                <button
                  onClick={handleSyncHabbo}
                  disabled={syncing}
                  className={`px-2 py-1 rounded bg-fmb-slate/80 text-[9px] uppercase font-mono tracking-widest border border-fmb-army/30 hover:bg-fmb-army hover:text-white transition-all flex items-center gap-1.5 ${
                    syncing ? "opacity-50 pointer-events-none" : ""
                  }`}
                  id="militar-sync-habbo-btn"
                  title="Puxar visual farda, farda do exército e missão atualizado do habbo.com.br"
                >
                  <RefreshCw className={`w-3 h-3 text-fmb-gold ${syncing ? "animate-spin" : ""}`} />
                  <span>{syncing ? "Sincronizando..." : "Sincronizar Habbo BR"}</span>
                </button>
              </div>
              <p className="text-xs text-fmb-gold font-mono uppercase tracking-widest font-bold mt-1">{profile.role}</p>
            </div>
            
            <p className="text-xs text-gray-400 italic">"{profile.habboMotto}"</p>

            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-[10px] font-mono text-gray-500 pt-1">
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-fmb-gold" />
                INGRESSO: {new Date(profile.joinedAt).toLocaleDateString("pt-BR")}
              </span>
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-fmb-gold" />
                HABBO DE: {profile.habboCreated}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CORE HISTORIC STATISTICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-fmb-black border border-fmb-army/20 p-4 rounded text-center">
          <span className="text-[10px] font-mono text-gray-500 block uppercase tracking-wider">Patrulha Acumulada</span>
          <span className="font-mono text-xl font-bold text-white block mt-1">{hoursWorked} hs</span>
          <span className="text-[9px] font-mono text-fmb-gold mt-0.5 block">TEMPO DE FOLHA</span>
        </div>

        <div className="bg-fmb-black border border-fmb-army/20 p-4 rounded text-center">
          <span className="text-[10px] font-mono text-gray-500 block uppercase tracking-wider">Treinos Ministrados</span>
          <span className="font-mono text-xl font-bold text-white block mt-1">{profile.trainingsCreated} ts</span>
          <span className="text-[9px] font-mono text-fmb-gold mt-0.5 block">ATAS CONCLUÍDAS</span>
        </div>

        <div className="bg-fmb-black border border-fmb-army/20 p-4 rounded text-center">
          <span className="text-[10px] font-mono text-gray-500 block uppercase tracking-wider">Promotores Crachá</span>
          <span className="font-mono text-xl font-bold text-white block mt-1">{profile.promotionsGiven}</span>
          <span className="text-[9px] font-mono text-fmb-gold mt-0.5 block">PROMOCÕES DADAS</span>
        </div>

        <div className="bg-fmb-black border border-fmb-army/20 p-4 rounded text-center">
          <span className="text-[10px] font-mono text-gray-500 block uppercase tracking-wider">Conquistas Medalhas</span>
          <span className="font-mono text-xl font-bold text-white block mt-1">{profile.medals.length} / {LIST_OF_MEDALS.length}</span>
          <span className="text-[9px] font-mono text-fmb-gold mt-0.5 block">LAUREADOS ATIVOS</span>
        </div>
      </div>

      {/* DETAILED TIME CLOCK SHEETS STATS */}
      <div className="bg-fmb-black/40 border border-fmb-army/30 rounded-lg p-5 leading-tight">
        <h4 className="font-display font-extrabold text-sm text-white uppercase tracking-wider mb-4 pb-2 border-b border-fmb-army/20 flex items-center space-x-1.5">
          <Clock className="w-4 h-4 text-fmb-gold" />
          <span>Frequência e Rendimento de Patrulhas Ativas</span>
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-fmb-slate/20 border border-fmb-army/10 p-3.5 rounded text-center">
            <span className="text-[9px] font-mono text-gray-400 block uppercase tracking-widest">Diário (24h)</span>
            <span className="font-mono text-xl font-black text-fmb-gold block mt-1.5">{dailyHours} hs</span>
            <span className="text-[8px] font-mono text-gray-500 block mt-0.5 uppercase">HOJE EM SERVIÇO</span>
          </div>
          <div className="bg-fmb-slate/20 border border-fmb-army/10 p-3.5 rounded text-center">
            <span className="text-[9px] font-mono text-gray-400 block uppercase tracking-widest">Semanal (7d)</span>
            <span className="font-mono text-xl font-black text-fmb-gold block mt-1.5">{weeklyHours} hs</span>
            <span className="text-[8px] font-mono text-gray-500 block mt-0.5 uppercase">SEMANA ATIVA</span>
          </div>
          <div className="bg-fmb-slate/20 border border-fmb-army/10 p-3.5 rounded text-center">
            <span className="text-[9px] font-mono text-gray-400 block uppercase tracking-widest">Mensal (30d)</span>
            <span className="font-mono text-xl font-black text-fmb-gold block mt-1.5">{monthlyHours} hs</span>
            <span className="text-[8px] font-mono text-gray-500 block mt-0.5 uppercase">DESEMPENHO MENSAL</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MEDAL CABINET */}
        <div className="lg:col-span-2 bg-fmb-black/40 border border-fmb-army/30 p-5 rounded-lg">
          <h4 className="font-display font-extrabold text-sm text-white uppercase tracking-wider mb-4 border-b border-fmb-army/20 pb-2 flex items-center space-x-1.5">
            <Medal className="w-4 h-4 text-fmb-gold" />
            <span>Gabinete de Láureas e Medalhas</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LIST_OF_MEDALS.map(medal => {
              const hasMedal = profile.medals.includes(medal.id);
              return (
                <div 
                  key={medal.id}
                  className={`p-3 border rounded-lg flex items-start space-x-3 transition-colors ${
                    hasMedal 
                      ? "bg-fmb-gold/5 border-fmb-gold/45" 
                      : "bg-fmb-black/40 border-fmb-army/20 opacity-40 select-none"
                  }`}
                >
                  <div className={`p-2 rounded-full shrink-0 ${
                    hasMedal ? "bg-fmb-gold text-fmb-black font-extrabold" : "bg-gray-800 text-gray-500"
                  }`}>
                    {/* Dynamic award icon simulation */}
                    {medal.id.includes("treinos") && <GraduationCap className="w-5 h-5" />}
                    {medal.id.includes("servico") && <Timer className="w-5 h-5" />}
                    {medal.id.includes("mes") && <Medal className="w-5 h-5" />}
                    {medal.id.includes("operacional") && <Award className="w-5 h-5" />}
                  </div>

                  <div className="text-left font-mono leading-tight">
                    <span className={`text-xs block font-bold ${hasMedal ? "text-fmb-gold" : "text-gray-400"}`}>
                      {medal.title}
                    </span>
                    <span className="text-[9px] text-gray-400 block mt-1 leading-normal">
                      {medal.description}
                    </span>
                    {hasMedal ? (
                      <span className="text-[8px] text-green-400 block uppercase mt-1.5 font-bold flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Conquistada
                      </span>
                    ) : (
                      <span className="text-[8px] text-gray-500 block uppercase mt-1.5 font-bold">
                        🔒 Bloqueada
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LOG OF CHANGES / SERVICE HISTORICAL */}
        <div className="bg-fmb-black/40 border border-fmb-army/30 p-5 rounded-lg space-y-4">
          <h4 className="font-display font-extrabold text-sm text-white uppercase tracking-wider border-b border-fmb-army/20 pb-2 flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-fmb-gold" />
            <span>Histórico de Patentes</span>
          </h4>

          {promotions.length === 0 ? (
            <p className="text-xs font-mono text-gray-500 py-6 text-center italic">
              Nenhuma alteração de patente documentada para este militar.
            </p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {promotions.map(p => (
                <div key={p.id} className="p-3 bg-fmb-black border border-fmb-army/20 rounded font-mono text-[10px]">
                  <div className="flex justify-between items-center text-gray-500 mb-1 border-b border-fmb-army/10 pb-1">
                    <span>{p.date} • {p.time}</span>
                    <span className="text-fmb-gold font-bold">DECRETO</span>
                  </div>
                  <p className="text-gray-300">
                    Alteração de <strong className="text-red-400">{p.oldRank}</strong> para <strong className="text-green-400">{p.newRank}</strong>.
                  </p>
                  <p className="text-gray-400 mt-1 leading-normal">
                    Justificativa: <span className="italic">"{p.reason}"</span>
                  </p>
                  <p className="text-right text-fmb-gold font-bold mt-2 text-[9px] uppercase">
                    Por: @{p.promoterName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* HISTÓRICO DE INSTRUÇÕES DE TREINO */}
      <div className="bg-fmb-black/40 border border-fmb-army/30 p-5 rounded-lg text-left shadow-md">
        <h4 className="font-display font-extrabold text-sm text-white uppercase tracking-wider mb-4 pb-2 border-b border-fmb-army/20 flex items-center space-x-1.5">
          <GraduationCap className="w-4 h-4 text-fmb-gold" />
          <span>Controle de Instruções e Doutrinas de Treinamentos</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Aulas de Recruta / Doutrinas Básicas */}
          <div className="space-y-3">
            <h5 className="font-mono text-xs text-fmb-gold uppercase tracking-wider font-bold border-b border-fmb-army/10 pb-1 flex items-center justify-between">
              <span>Instruções Recrutas / Básicas</span>
              <span className="text-[9px] text-gray-400 bg-fmb-black px-1.5 py-0.5 border border-fmb-army/25 rounded lowercase">{recruitLessons.length} aula(s)</span>
            </h5>

            {recruitLessons.length === 0 ? (
              <p className="text-xs font-mono text-gray-400 py-6 text-center italic bg-fmb-black/25 rounded border border-fmb-army/10">
                Nenhuma instrução básica ou doutrina de recrutas para este militar.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {recruitLessons.map(lesson => {
                  const isInstructor = lesson.instructorId === profile.id || lesson.instructorName.toLowerCase() === profile.habboNick.toLowerCase();
                  return (
                    <div key={lesson.id} className="p-3 bg-fmb-black/80 border border-fmb-army/20 rounded font-mono text-[10px] leading-tight space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] text-gray-500 border-b border-fmb-army/10 pb-1">
                        <span>{new Date(lesson.createdAt).toLocaleDateString("pt-BR")}</span>
                        <span className={`font-bold px-1 rounded ${
                          lesson.status === "Aprovado" ? "text-green-400 bg-green-950/20" : "text-red-400 bg-red-950/20"
                        }`}>
                          {lesson.status.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-bold text-xs uppercase">{lesson.category}</p>
                        <p className="text-gray-400 mt-1 pb-1">
                          {isInstructor ? (
                            <span>Papel: <strong className="text-fmb-gold">INSTRUTOR RESISTENTE</strong></span>
                          ) : (
                            <span>Papel: <strong className="text-green-400">PARTICIPANTE</strong></span>
                          )}
                        </p>
                        <p className="text-gray-400 mt-1">
                          {isInstructor ? (
                            <span>Ministrado para: <strong className="text-white">@{lesson.studentNick}</strong></span>
                          ) : (
                            <span>Recebido de: <strong className="text-white">@{lesson.instructorName}</strong></span>
                          )}
                        </p>
                      </div>
                      {lesson.notes && (
                        <p className="text-gray-500 italic bg-fmb-slate/20 p-2 rounded text-[9px] mt-1 border-l border-fmb-gold/30">
                          Obs: "{lesson.notes}"
                        </p>
                      )}
                      {lesson.screenshotUrl && (
                        <div className="mt-1 pt-1 border-t border-fmb-army/10">
                          <a 
                            href={lesson.screenshotUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-[9px] text-fmb-gold hover:underline"
                            referrerPolicy="no-referrer"
                          >
                            <span className="mr-1">📷</span> Ver Captura da Aula (Comprovante)
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Atas de Treinamentos Concluídos / Agendados */}
          <div className="space-y-3">
            <h5 className="font-mono text-xs text-fmb-gold uppercase tracking-wider font-bold border-b border-fmb-army/10 pb-1 flex items-center justify-between">
              <span>Atas de Treinamentos Oficial</span>
              <span className="text-[9px] text-gray-400 bg-fmb-black px-1.5 py-0.5 border border-fmb-army/25 rounded lowercase">{trainings.length} ata(s)</span>
            </h5>

            {trainings.length === 0 ? (
              <p className="text-xs font-mono text-gray-400 py-6 text-center italic bg-fmb-black/25 rounded border border-fmb-army/10">
                Nenhum treinamento oficial agendado ou concluído para este militar.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {trainings.map(t => {
                  const isInstructor = t.instructorId === profile.id || t.instructorName.toLowerCase() === profile.habboNick.toLowerCase();
                  return (
                    <div key={t.id} className="p-3 bg-fmb-black/80 border border-fmb-army/20 rounded font-mono text-[10px] leading-tight space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] text-gray-500 border-b border-fmb-army/10 pb-1">
                        <span>{t.date} • {t.time}</span>
                        <span className={`font-bold px-1 rounded ${
                          t.status === "Concluido" ? "text-green-400 bg-green-950/20" : t.status === "Agendado" ? "text-amber-400 bg-amber-950/20" : "text-gray-400 bg-gray-900"
                        }`}>
                          {t.status.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-bold text-xs uppercase">{t.name}</p>
                        <span className="text-[9px] text-gray-500 uppercase">{t.category}</span>
                      </div>
                      <p className="text-gray-400 mt-1">
                        {isInstructor ? (
                          <span>Papel: <strong className="text-fmb-gold">INSTRUTOR RESISTENTE</strong></span>
                        ) : (
                          <span>Papel: <strong className="text-green-400">PARTICIPANTE</strong></span>
                        )}
                      </p>
                      {t.participants && t.participants.length > 0 && (
                        <p className="text-[9px] text-gray-500 leading-normal">
                          Integrantes: {t.participants.map(p => `@${p}`).join(", ")}
                        </p>
                      )}
                      {t.description && (
                        <p className="text-gray-500 italic bg-fmb-slate/20 p-2 rounded text-[9px] mt-1 border-l border-fmb-gold/30">
                          "{t.description}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
