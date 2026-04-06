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
  const [selectedMonth, setSelectedMonth] = useState('4'); // Default to 4
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('comment'); // 'comment' or 'script'
  
  const itemsPerPage = 10;

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
              const monthVal = row['월'] || Object.values(row)[COLS.MONTH];
              const dayVal = row['일'] || Object.values(row)[COLS.DAY];
              const linkVal = row['링크'] || Object.values(row)[COLS.LINK];
              const commentVal = row['코멘트'] || Object.values(row)[COLS.COMMENT];
              const scriptVal = row['제작 스크립트 예시'] || Object.values(row)[COLS.SCRIPT];

              const m = (monthVal || '').toString().trim();
              const d = (dayVal || '').toString().trim();

              return {
                id: `item-${i}`,
                month: m,
                day: d,
                displayDate: `${m}월 ${d}일`,
                link: linkVal?.trim() || '',
                comment: commentVal?.trim() || '',
                script: scriptVal?.trim() || ''
              };
            }).filter(item => item.month && (item.comment || item.script))
              .sort((a, b) => {
                // 월 -> 일 순으로 내림차순 정렬 (최신순)
                if (a.month !== b.month) return parseInt(b.month) - parseInt(a.month);
                return parseInt(b.day) - parseInt(a.day);
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

  // Filter items by selected month
  const filteredItems = useMemo(() => {
    return items.filter(item => item.month === selectedMonth);
  }, [items, selectedMonth]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    setCurrentPage(1); // Reset to page 1
  };

  // Available months for navigation
  const availableMonths = [4, 5, 6, 7, 8, 9, 10, 11, 12];

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
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
            불막열삼 점주님용<br className="sm:hidden" /> 컨텐츠 레퍼런스
          </h1>
          <p className="text-slate-400 text-lg">촬영 기획안과 실시간 레퍼런스 리스트입니다.</p>
        </div>

        {/* Month Filter Bar */}
        <div className="sticky top-[70px] z-[50] bg-slate-950/80 backdrop-blur-xl py-6 mb-8 rounded-[2rem] px-4 border border-white/5 shadow-2xl">
          <div className="flex items-center gap-4 overflow-x-auto custom-scrollbar-hidden pb-1 px-2">
            <div className="flex items-center gap-1 text-slate-500 mr-2 flex-shrink-0">
              <Calendar size={18} />
              <span className="text-sm font-bold uppercase tracking-widest ml-1">월별 필터</span>
            </div>
            {availableMonths.map(m => (
              <button 
                key={m}
                onClick={() => handleMonthChange(m.toString())}
                className={`px-8 py-3 rounded-2xl text-base font-bold whitespace-nowrap transition-all flex-shrink-0 active:scale-95 ${
                  selectedMonth === m.toString() 
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 translate-y-[-2px]' 
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                {m}월
              </button>
            ))}
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
        ) : (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8 opacity-60 px-4">
              <h2 className="text-2xl font-bold text-indigo-400">{selectedMonth}월 리스트</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/20 to-transparent" />
            </div>
            
            <div className="flex flex-col gap-8">
              {paginatedItems.length > 0 ? (
                <>
                  {paginatedItems.map((item, i) => (
                    <div 
                      key={item.id} 
                      className="glass p-10 rounded-[2.5rem] flex flex-col items-center text-center gap-6 animate-up group hover:border-white/20 transition-all border border-white/5 shadow-2xl"
                    >
                      {/* Date Row */}
                      <div className="flex items-center justify-center gap-2 mb-1 px-5 py-2 bg-white/5 rounded-full">
                        <Calendar size={14} className="text-indigo-400" />
                        <span className="text-xs font-black text-slate-400 tracking-wider">DATE: {item.displayDate}</span>
                      </div>

                      {/* Content Area */}
                      <div className="w-full text-center">
                        <div className="flex flex-col gap-4 items-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                            <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">추천사유</span>
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                          </div>
                          <p className="text-2xl font-bold leading-relaxed group-hover:text-white transition-colors text-balance px-4">
                            {item.comment || "작성된 사유가 없습니다."}
                          </p>
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className="grid grid-cols-2 gap-4 w-full pt-[30px] mt-2 border-t border-white/5">
                        {item.link ? (
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn-responsive btn-primary h-[64px] !text-[14px] sm:!text-[16px] !px-2"
                          >
                            <ExternalLink size={18} />
                            레퍼런스 컨텐츠보기
                          </a>
                        ) : (
                          <button className="btn-responsive btn-disabled h-[64px] !text-[14px] sm:!text-[16px] !px-2" disabled>
                            <AlertCircle size={18} />
                            레퍼런스 링크없음
                          </button>
                        )}
                        
                        <button 
                          onClick={() => { setSelectedItem(item); setActiveModalTab('script'); }}
                          className={`btn-responsive h-[64px] !text-[14px] sm:!text-[16px] !px-2 ${item.script ? 'btn-has-content' : 'btn-secondary'}`}
                        >
                          <FileText size={18} />
                          스크립트 예시보기
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="pagination-container">
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`page-btn ${currentPage === 1 ? 'disabled' : ''}`}
                      >
                        <ChevronRight className="rotate-180" size={20} />
                      </button>
                      
                      {[...Array(totalPages)].map((_, i) => (
                        <button 
                          key={i} 
                          onClick={() => setCurrentPage(i + 1)}
                          className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                        >
                          {i + 1}
                        </button>
                      ))}

                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={`page-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-32 text-center text-slate-500 border-2 border-dashed border-white/5 rounded-[3rem] animate-up shadow-inner">
                  <Camera className="mx-auto mb-6 opacity-10" size={64} />
                  <p className="text-xl font-medium">{selectedMonth}월에 등록된 레퍼런스가 현재 없습니다.</p>
                  <p className="text-sm mt-2 opacity-60 text-indigo-400/60">다른 월을 선택해 보세요!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Unified Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass max-w-2xl w-full p-8 rounded-[3rem] relative shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-up overflow-hidden flex flex-col max-h-[90vh] border border-white/10">
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-8 right-8 text-slate-400 hover:text-white z-[210] p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <LogOut size={24} className="rotate-90" />
            </button>

            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                  <Calendar className="text-indigo-400" size={24} />
                </div>
                <h2 className="text-2xl font-black">{selectedItem.displayDate} 상세 정보</h2>
              </div>
              <div className="flex gap-3 mt-6 p-1.5 bg-black/30 rounded-[1.8rem] border border-white/5">
                <button 
                  onClick={() => setActiveModalTab('comment')}
                  className={`flex-1 py-4 rounded-[1.5rem] text-sm font-black transition-all ${activeModalTab === 'comment' ? 'bg-white text-black shadow-xl shadow-white/10' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  기획 의도 및 추천사유
                </button>
                <button 
                  onClick={() => setActiveModalTab('script')}
                  className={`flex-1 py-4 rounded-[1.5rem] text-sm font-black transition-all ${activeModalTab === 'script' ? 'bg-white text-black shadow-xl shadow-white/10' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  제작 스크립트 예시
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 mb-10 bg-black/40 rounded-[2rem] p-10 leading-[1.8] border border-white/5">
              {activeModalTab === 'comment' ? (
                <div>
                  <h3 className="text-indigo-400 text-xs font-black mb-6 uppercase tracking-[0.3em] flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                    추천사유 & 기획 방향
                  </h3>
                  <p className="text-xl font-medium whitespace-pre-wrap text-slate-200">
                    {selectedItem.comment || "작성된 내용이 없습니다."}
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-indigo-400 text-xs font-black mb-6 uppercase tracking-[0.3em] flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                    스크립트 가이드
                  </h3>
                  <p className="text-xl font-medium whitespace-pre-wrap text-slate-200">
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
                  className="btn btn-primary flex-[2] py-6 text-xl"
                >
                  <ExternalLink size={24} />
                  레퍼런스 바로가기
                </a>
              )}
              <button 
                onClick={() => setSelectedItem(null)}
                className="btn btn-secondary flex-1 py-6 text-xl"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-12 mt-auto text-center border-t border-white/5">
        <p className="text-slate-500 text-xs tracking-[0.3em] font-black uppercase">
          &copy; 2026 스스로마케팅연구소 &bull; ALL RIGHTS RESERVED
        </p>
      </footer>
    </div>
  );
}

export default App;
