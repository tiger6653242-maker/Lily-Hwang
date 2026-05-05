/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  RotateCcw, 
  Copy, 
  Check, 
  Share2, 
  Trash2, 
  Settings2,
  Trophy,
  Download,
  History as HistoryIcon,
  ChevronRight
} from 'lucide-react';

interface Group {
  id: number;
  members: string[];
  name?: string;
}

interface HistoryItem {
  id: string;
  timestamp: number;
  groups: Group[];
  originalNames: string[];
  mode: 'count' | 'size';
  targetValue: number;
  createdBy: string;
}

type UserRole = '老師' | '主辦人' | '小隊長' | '一般使用者' | null;

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<'count' | 'size'>('count');
  const [targetValue, setTargetValue] = useState(2);
  const [results, setResults] = useState<Group[]>([]);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load history and role on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('grouping_history');
    const savedRole = localStorage.getItem('user_role') as UserRole;
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load history', e);
      }
    }
    if (savedRole) {
      setUserRole(savedRole);
    }
  }, []);

  // Save history when it changes
  useEffect(() => {
    localStorage.setItem('grouping_history', JSON.stringify(history));
  }, [history]);

  // Save role when it changes
  useEffect(() => {
    if (userRole) {
      localStorage.setItem('user_role', userRole);
    }
  }, [userRole]);

  const names = useMemo(() => {
    return inputText
      .split(/[\n,，、\s]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0);
  }, [inputText]);

  const shuffle = (array: string[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleGenerate = () => {
    if (names.length === 0) return;

    const shuffled = shuffle(names);
    let newGroups: Group[] = [];

    if (mode === 'count') {
      const groupCount = Math.min(targetValue, shuffled.length);
      newGroups = Array.from({ length: groupCount }, (_, i) => ({
        id: i + 1,
        members: []
      }));

      shuffled.forEach((name, index) => {
        newGroups[index % groupCount].members.push(name);
      });
    } else {
      const size = Math.min(targetValue, shuffled.length);
      const groupCount = Math.ceil(shuffled.length / size);
      
      for (let i = 0; i < groupCount; i++) {
        newGroups.push({
          id: i + 1,
          members: shuffled.slice(i * size, (i + 1) * size)
        });
      }
    }

    setResults(newGroups);
    
    // Add to history with full context
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      groups: newGroups,
      originalNames: names,
      mode: mode,
      targetValue: targetValue,
      createdBy: userRole || '未知身分'
    };
    setHistory(prev => [newItem, ...prev].slice(0, 5));
  };

  const handleCopy = () => {
    if (results.length === 0) return;
    
    const text = results.map(g => 
      `【第 ${g.id} 組】\n${g.members.join('、')}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (results.length === 0) return;
    
    const timestamp = new Date().toLocaleString();
    const text = `隨機分組結果\n產生時間：${timestamp}\n${'='.repeat(30)}\n\n` + 
      results.map(g => 
        `【第 ${g.id} 組】(${g.members.length} 人)\n${g.members.map(m => `• ${m}`).join('\n')}`
      ).join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `分組結果_${new Date().toISOString().split('T')[0]}_${new Date().getTime()}.txt`;
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGenerateSample = () => {
    const samples = [
      '陳大文', '林小明', '王美麗', '張家輝', '李小龍', 
      '黃心怡', '周杰倫', '蔡依林', '林俊傑', '鄧紫棋',
      '陳奕迅', '容祖兒', '謝霆鋒', '古天樂', '劉德華',
      '郭富城', '黎明', '張學友'
    ];
    setInputText(samples.join('\n'));
    return samples; // Return the samples for quick generate
  };

  const handleQuickGenerate = () => {
    const samples = handleGenerateSample();
    // Use a small delay to ensure names useMemo updates, OR just use the samples directly
    // Since handleGenerate uses names (state-dependent), we should perform the logic here or wrap grouping in a function
    const shuffled = [...samples].sort(() => Math.random() - 0.5);
    const groupCount = 3; // Default for quick demo
    const newGroups = Array.from({ length: groupCount }, (_, i) => ({
      id: i + 1,
      members: []
    }));

    shuffled.forEach((name, index) => {
      newGroups[index % groupCount].members.push(name);
    });

    setResults(newGroups);
    setTargetValue(6); // 18 / 3
    setMode('size');

    // Add to history with full context
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      groups: newGroups,
      originalNames: samples,
      mode: 'size',
      targetValue: 6,
      createdBy: userRole || '快速生成使用者'
    };
    setHistory(prev => [newItem, ...prev].slice(0, 5));
  };

  const restoreFromHistory = (item: HistoryItem) => {
    setResults(item.groups);
    setInputText(item.originalNames.join('\n'));
    setMode(item.mode);
    setTargetValue(item.targetValue);
    setShowHistory(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('grouping_history');
  };

  return (
    <div className="min-h-screen bg-[#07080D] pb-20 text-slate-200">
      {/* Identity Selection Overlay */}
      <AnimatePresence>
        {!userRole && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950"
          >
            <div className="absolute inset-0 overflow-hidden -z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/10 blur-[120px] rounded-full" />
              <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full" />
            </div>

            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card max-w-xl w-full p-10 text-center relative overflow-hidden"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <Users className="text-white w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">選擇您的身分</h2>
              <p className="text-slate-400 mb-10 font-medium">讓我們知道誰在進行分組，這也會記錄在操作紀錄中。</p>

              <div className="grid grid-cols-2 gap-4">
                {(['老師', '主辦人', '小隊長', '一般使用者'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setUserRole(role)}
                    className="p-5 bg-slate-900 border border-white/5 rounded-2xl hover:bg-slate-800 hover:border-violet-500/50 transition-all font-bold text-lg text-slate-300 hover:text-white"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <header className="bg-slate-900/40 backdrop-blur-md border-b border-white/5 py-8 px-6 mb-12">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setUserRole(null)}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-[10px] font-black uppercase tracking-widest text-violet-400 hover:text-white"
              >
                身分: {userRole} (切換)
              </button>
              <button
                onClick={handleGenerateSample}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
              >
                載入範例
              </button>
              <button
                onClick={handleQuickGenerate}
                className="px-4 py-2 bg-gradient-to-r from-violet-600/20 to-emerald-500/20 border border-violet-500/30 rounded-xl hover:from-violet-600/40 hover:to-emerald-500/40 transition-all text-xs font-bold text-white shadow-[0_0_15px_rgba(124,58,237,0.1)] flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
                快速分組 (範例)
              </button>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.3)]">
              <Users className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white leading-none mb-1 tracking-tight">莉莉分組小工具</h1>
              <p className="text-slate-400 text-sm font-medium">快速、公正、簡單的名單分配系統</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="p-3 bg-slate-800 border border-white/5 rounded-2xl hover:bg-slate-700 transition-colors relative group"
            >
            <HistoryIcon className="w-5 h-5 text-slate-300 group-hover:text-white" />
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center rounded-full ring-4 ring-[#07080D]">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>

      <main className="max-w-4xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left: Configuration */}
        <div className="lg:col-span-5 space-y-8">
          <section className="glass-card p-6 neon-border">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-violet-500/10 rounded-lg">
                <UserPlus className="w-5 h-5 text-violet-400" />
              </div>
              <h2 className="font-bold text-lg text-white">輸入參與名單</h2>
            </div>
            <textarea
              className="input-field min-h-[300px] resize-none text-base leading-relaxed"
              placeholder="請輸入姓名，可用換行、逗號或空白分隔..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              id="names-input"
            />
            <div className="mt-4 flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-widest">
              <span>已識別: {names.length} 人</span>
              <button 
                onClick={() => setInputText('')}
                className="text-slate-500 hover:text-rose-400 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> 清空全部
              </button>
            </div>
          </section>

          <section className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Settings2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="font-bold text-lg text-white">分組模式設定</h2>
            </div>
            
            <div className="flex bg-slate-950/80 p-1.5 rounded-2xl mb-8 border border-white/5">
              <button
                onClick={() => setMode('count')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  mode === 'count' ? 'bg-slate-800 shadow-xl text-emerald-400 border border-white/5' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                分組數量
              </button>
              <button
                onClick={() => setMode('size')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  mode === 'size' ? 'bg-slate-800 shadow-xl text-emerald-400 border border-white/5' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                每組人數
              </button>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="2"
                  max={names.length || 100}
                  value={targetValue}
                  onChange={(e) => setTargetValue(parseInt(e.target.value) || 2)}
                  className="input-field text-center font-black text-3xl py-6"
                />
              </div>
              <span className="text-slate-400 font-bold text-lg uppercase tracking-tighter w-16">
                {mode === 'count' ? '組' : '位/組'}
              </span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={names.length === 0}
              className="btn-primary w-full mt-8 py-5 text-lg flex items-center justify-center gap-3"
              id="generate-button"
            >
              <RotateCcw className="w-6 h-6" />
              執行隨機分組
            </button>
          </section>
        </div>

        {/* Right: Results or empty state */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {results.length > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-2xl text-white flex items-center gap-3 tracking-tight">
                    <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                    分組結果
                  </h2>
                  <div className="flex gap-3">
                    <button
                      onClick={handleExport}
                      className="px-4 py-2 bg-slate-800 border border-white/5 rounded-xl hover:bg-slate-700 hover:text-blue-400 transition-all flex items-center gap-2 text-sm font-bold text-slate-300 shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      匯出 .txt
                    </button>
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2 bg-slate-800 border border-white/5 rounded-xl hover:bg-slate-700 hover:text-emerald-400 transition-all flex items-center gap-2 text-sm font-bold text-slate-300 shadow-lg"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {copied ? '已複製名單' : '複製文字'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {results.map((group, idx) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="glass-card overflow-hidden group hover:bg-slate-800/80 transition-all duration-300 border-white/5 hover:border-violet-500/30"
                    >
                      <div className="bg-white/5 px-5 py-4 flex items-center justify-between border-b border-white/5">
                        <span className="font-black text-white text-lg tracking-tighter">第 {group.id} 組</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-emerald-500/20">
                          {group.members.length} MEMBERS
                        </span>
                      </div>
                      <div className="p-5 space-y-3">
                        {group.members.map((member, mIdx) => (
                          <div 
                            key={mIdx} 
                            className="flex items-center gap-3 text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-white/5 group-hover:bg-slate-950/60 transition-colors"
                          >
                            <span className="w-2 h-2 bg-gradient-to-br from-violet-500 to-emerald-400 rounded-full shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
                            <span className="text-base font-semibold">{member}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-16 glass-card border-dashed border-2 border-white/5 bg-slate-900/20"
              >
                <div className="w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center mb-8 text-slate-500 shadow-inner">
                  <Users className="w-12 h-12 opacity-50" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3 tracking-tight">準備好開始了嗎？</h3>
                <p className="text-slate-500 max-w-xs mx-auto leading-relaxed font-medium">
                  在左側輸入名單並選擇規則，系統將自動為您生成最公正的分配結果。
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* History Side Panel */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#0F111A] border-l border-white/5 shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="p-8 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-3xl font-black tracking-tighter text-white">歷史紀錄</h2>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="p-3 hover:bg-slate-800 rounded-2xl transition-colors text-slate-400 hover:text-white"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                {history.length > 0 ? (
                  <div className="space-y-6">
                    <button 
                      onClick={clearHistory}
                      className="text-xs text-rose-400 font-black uppercase tracking-widest hover:text-rose-300 flex items-center gap-2 mb-4"
                    >
                      <Trash2 className="w-4 h-4" /> 清除所有紀錄
                    </button>
                    {history.map((item) => (
                      <div key={item.id} className="p-5 border border-white/5 rounded-3xl bg-slate-900/50 hover:bg-slate-800/80 transition-all group overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-violet-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5 opacity-60 flex items-center gap-2">
                              <span>{new Date(item.timestamp).toLocaleString()}</span>
                              <span className="w-1 h-1 bg-slate-700 rounded-full" />
                              <span className="text-violet-400">{item.createdBy}</span>
                            </div>
                            <div className="font-bold text-white text-lg tracking-tight">
                              {item.originalNames.length} 人 <span className="text-emerald-400 mx-1">/</span> {item.groups.length} 組
                            </div>
                            <div className="text-[10px] text-slate-600 mt-1 font-bold">
                              模式：{item.mode === 'count' ? '固定組數' : '每組定員'} ({item.targetValue})
                            </div>
                          </div>
                          <button 
                            onClick={() => restoreFromHistory(item)}
                            className="p-3 bg-slate-800 border border-white/5 rounded-xl text-slate-400 hover:bg-emerald-500 hover:text-slate-950 transition-all transform hover:scale-110"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.originalNames.slice(0, 10).map((m, i) => (
                            <span key={i} className="text-[9px] bg-slate-950/20 text-slate-500 px-1.5 py-0.5 rounded-md border border-white/5">
                              {m}
                            </span>
                          ))}
                          {item.originalNames.length > 10 && <span className="text-[9px] text-slate-700">...</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.groups[0].members.slice(0, 3).map((m, i) => (
                            <span key={i} className="text-[10px] bg-slate-950 text-slate-400 px-3 py-1 rounded-full font-bold border border-white/5">
                              {m}
                            </span>
                          ))}
                          {item.groups[0].members.length > 3 && (
                            <span className="text-[10px] text-slate-600 flex items-center font-bold italic">+ {item.groups[0].members.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <RotateCcw className="w-10 h-10 text-slate-700" />
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">目前尚無任何紀錄</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
