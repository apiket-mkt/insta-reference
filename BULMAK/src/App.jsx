import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, 
  ExternalLink, 
  Camera, 
  Loader2, 
  AlertCircle, 
  LogOut, 
  Search,
  Calendar,
  MessageSquare,
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import Papa from 'papaparse';
import { 
  GLOBAL_PASSWORD, 
  DATA_SHEET_URL,
  COLS
} from './data';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('comment'); // 'comment' or 'script'

  // Authentication check
  useEffect(() => {
    const savedAuth = localStorage.getItem('bulmak_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === GLOBAL_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('bulmak_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('비밀번호가 틀렸습니다.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('bulmak_auth');
  };

  // Helper to parse date or return a placeholder
  const parseDate = (dateStr) => {
    if (!dateStr) return { raw: '', year: '', month: '', display: '날짜 없음' };
    const clean = dateStr.toString().replace(/[.\-/]/g, '-').trim();
    const parts = clean.split('-');
    if (parts.length >= 2) {
      let year = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
      let month = parts[1].padStart(2, '0');
      return { raw: dateStr, year, month, display: `${year}년 ${month}월` };
    }
    return { raw: dateStr, year: '0000', month: '00', display: dateStr };
  };

  // Data fetching
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(DATA_SHEET_URL);
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data.map((row, i) => {
              const dateVal = row['날짜'] || Object.values(row)[COLS.DATE];
              const linkVal = row['링크'] || Object.values(row)[COLS.LINK];
              const commentVal = row['코멘트'] || Object.values(row)[COLS.COMMENT];
              const scriptVal = row['제작 스크립트 예시'] || Object.values(row)[COLS.SCRIPT];

              return {
                id: `item-${i}`,
                dateInfo: parseDate(dateVal),
                link: linkVal?.trim() || '',
                comment: commentVal?.trim() || '',
                script: scriptVal?.trim() || ''
              };
            }).filter(item => item.comment || item.script || item.dateInfo.raw)
              .sort((a, b) => {
                const dateA = `${a.dateInfo.year}${a.dateInfo.month}`;
                const dateB = `${b.dateInfo.year}${b.dateInfo.month}`;
                return dateB.localeCompare(dateA);
              });
            
            setItems(data);
            setFetchError('');
          },
          error: (err) => {
            setFetchError('시트 데이터를 파싱하는 도중 오류가 발생했습니다.');
          }
        });
      } catch (err) {
        setFetchError('데이터 로드 실패: 시트가 "웹에 게시" 되었는지 확인해주세요.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  // Group items by month
  const groupedItems = useMemo(() => {
    const filtered = items.filter(item => 
      item.comment.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.script.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dateInfo.raw.includes(searchQuery)
    );

    const groups = {};
    filtered.forEach(item => {
      const monthKey = item.dateInfo.display;
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(item);
    });
    return groups;
  }, [items, searchQuery]);

  // Auth View
  if (!isAuthenticated) {
    return (
      <div className="container min-h-screen flex items-center justify-center">
        <div className="glass card max-w-sm w-full p-10 animate-up text-center">
          <div className="inline-flex p-5 rounded-[2rem] bg-indigo-500/20 text-indigo-400 mb-6">
            <Lock size={40} />
          </div>
          <h1 className="text-3xl mb-2 font-bold tracking-tight">BULMAK HUB</h1>
          <p className="text-slate-400 mb-10 text-xs text-balance">불막열삼 점주님 전용<br/>마케팅 컨텐츠 허브</p>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="마스터 비밀번호 입력"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {authError && <p className="text-red-400 text-sm mt-[-0.5rem] mb-2">{authError}</p>}
            <button className="btn btn-primary w-full py-4 text-lg">열람하기</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="header glass">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Camera size={22} className="text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">BULMAK <span className="text-indigo-400">HUB</span></h2>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost hover:bg-white/5 transition-colors">
          <LogOut size={20} />
          <span className="hidden sm:inline ml-2">로그아웃</span>
        </button>
      </header>

      <main className="container flex-1 animate-up">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
              불막열삼 점주님용<br className="sm:hidden" /> 컨텐츠 레퍼런스
            </h1>
            <p className="text-slate-400 text-lg">촬영 기획안과 실시간 레퍼런스 리스트입니다.</p>
          </div>
          
          <div className="relative w-full md:w-[350px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="날짜나 내용으로 검색..." 
              className="input-field pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse text-slate-400">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p>데이터 로딩 중...</p>
          </div>
        ) : fetchError ? (
          <div className="glass border-red-500/20 p-10 text-center animate-up">
            <AlertCircle className="text-red-400 mb-4 mx-auto" size={48} />
            <h3 className="text-xl mb-2">연결 실패</h3>
            <p className="text-slate-400 mb-8">{fetchError}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">다시 시도</button>
          </div>
        ) : Object.keys(groupedItems).length > 0 ? (
          Object.entries(groupedItems).map(([month, monthItems]) => (
            <div key={month} className="mb-12">
              <div className="flex items-center gap-4 mb-4 sticky top-[70px] z-[40] bg-slate-950/80 backdrop-blur-md py-4 rounded-xl px-4">
                <ChevronDown className="text-indigo-400" />
                <h2 className="text-2xl font-bold">{month}</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/20 to-transparent" />
              </div>
              
              <div className="flex flex-col gap-4">
                {monthItems.map((item, i) => (
                  <div 
                    key={item.id} 
                    className="glass p-6 rounded-[1.5rem] flex flex-col md:flex-row items-start md:items-center gap-6 animate-up group hover:border-white/20 transition-all border border-white/5"
                  >
                    {/* Date Column */}
                    <div className="flex flex-row md:flex-col items-center md:items-start gap-2 min-w-[80px]">
                      <Calendar size={16} className="text-indigo-400" />
                      <span className="text-sm font-bold text-slate-300">{item.dateInfo.raw}</span>
                    </div>

                    {/* Content Preview */}
                    <div className="flex-1 cursor-pointer w-full" onClick={() => { setSelectedItem(item); setActiveModalTab('comment'); }}>
                      <p className="text-lg font-medium line-clamp-1 mb-1 group-hover:text-white transition-colors">
                        {item.comment || "코멘트 없음"}
                      </p>
                      <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <MessageSquare size={12} />
                        <span className="line-clamp-1">{item.script || "스크립트 정보 없음"}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 w-full md:w-auto mt-4 md:mt-0">
                      {item.link && (
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn-compact btn-primary"
                        >
                          <ExternalLink size={16} />
                          레퍼런스
                        </a>
                      )}
                      <button 
                        onClick={() => { setSelectedItem(item); setActiveModalTab('comment'); }}
                        className="btn-compact btn-secondary"
                      >
                        <FileText size={16} />
                        기획안
                      </button>
                      <button 
                        onClick={() => { setSelectedItem(item); setActiveModalTab('script'); }}
                        className="btn-compact btn-secondary"
                      >
                        <FileText size={16} />
                        스크립트
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center text-slate-500 border-2 border-dashed border-white/5 rounded-[2rem]">
            <p>찾으시는 데이터가 없습니다.</p>
          </div>
        )}
      </main>

      {/* Unified Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass max-w-2xl w-full p-8 rounded-[2rem] relative shadow-2xl animate-up overflow-hidden flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white z-[210] p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <LogOut size={24} className="rotate-90" />
            </button>

            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="text-indigo-400" size={20} />
                <h2 className="text-xl font-bold">{selectedItem.dateInfo.raw} 상세 기획안</h2>
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => setActiveModalTab('comment')}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeModalTab === 'comment' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                >
                  촬영 기획안
                </button>
                <button 
                  onClick={() => setActiveModalTab('script')}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeModalTab === 'script' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                >
                  제작 스크립트 예시
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-8 bg-black/20 rounded-2xl p-6">
              {activeModalTab === 'comment' ? (
                <div>
                  <h3 className="text-indigo-400 text-xs font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} />
                    기획 의도 및 가이드
                  </h3>
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">
                    {selectedItem.comment || "작성된 기획안이 없습니다."}
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-indigo-400 text-xs font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} />
                    스크립트 본문
                  </h3>
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">
                    {selectedItem.script || "작성된 스크립트가 없습니다."}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              {selectedItem.link && (
                <a 
                  href={selectedItem.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-primary flex-1 py-4 text-lg"
                >
                  <ExternalLink size={20} />
                  레퍼런스 바로가기
                </a>
              )}
              <button 
                onClick={() => setSelectedItem(null)}
                className="btn btn-secondary flex-1 py-4 text-lg"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-10 text-center text-slate-600 text-xs tracking-widest font-bold">
        &copy; 2026 스스로마케팅연구소 &bull; ALL RIGHTS RESERVED
      </footer>
    </div>
  );
}

export default App;
