import React, { useState, useEffect } from 'react';
import { Lock, ArrowLeft, ExternalLink, Camera, Loader2, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { GLOBAL_PASSWORD, SHEETS_CSV_URL } from './data';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedDesigner, setSelectedDesigner] = useState(null);
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [followedRefs, setFollowedRefs] = useState({});

  useEffect(() => {
    // 만약 시트 URL이 기본 플레이스홀더라면 데이터를 가져오지 않음
    if (SHEETS_CSV_URL === 'PASTE_YOUR_SHEET_URL_HERE') {
      setLoading(false);
      setFetchError('구글 시트 URL이 설정되지 않았습니다. src/data.js 파일에 URL을 입력해 주세요.');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(SHEETS_CSV_URL);
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: false, // 헤더가 없는 시트 구조에 맞춤
          skipEmptyLines: true,
          complete: (results) => {
            const rawData = results.data;
            const designerMap = {};

            // 시트 데이터 가공 (디자이너별로 레퍼런스 그룹화)
            rawData.forEach((row, index) => {
              // 컬럼 인덱스로 접근 (A: 0, B: 1, C: 2)
              const designerName = row[0]?.trim();
              const url = row[1]?.trim();
              const reason = row[2]?.trim();

              if (designerName && url && url.startsWith('http')) {
                if (!designerMap[designerName]) {
                  designerMap[designerName] = {
                    id: designerName,
                    name: designerName,
                    references: []
                  };
                }
                designerMap[designerName].references.push({
                  id: `${designerName}-${index}`,
                  url,
                  reason: reason || '코멘트가 없습니다.'
                });
              }
            });

            const processedDesigners = Object.values(designerMap);
            setDesigners(processedDesigners);
            setLoading(false);
            setFetchError('');
          },
          error: (err) => {
            setFetchError('구글 시트 데이터 분석 중 오류가 발생했습니다.');
            setLoading(false);
          }
        });
      } catch (err) {
        setFetchError('데이터를 가져오는 데 실패했습니다. 시트가 "웹에 게시" 되었는지 확인 부탁드립니다.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === GLOBAL_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('비밀번호가 일치하지 않습니다.');
    }
  };

  const handleDesignerSelect = (designer) => {
    setSelectedDesigner(designer);
  };

  const handleBack = () => {
    setSelectedDesigner(null);
  };

  const handleFollow = (designerId, refId) => {
    const key = `${designerId}-${refId}`;
    setFollowedRefs(prev => ({ ...prev, [key]: true }));
  };

  // Login View
  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card glass animate-fade-in">
          <div className="text-center mb-6">
            <div className="inline-block p-4 rounded-full bg-blue-500/20 text-blue-400 mb-4">
              <Lock size={32} />
            </div>
            <h1>Reference Hub</h1>
            <p>교육생 전용 레퍼런스 공유 공간</p>
          </div>
          
          <form onSubmit={handleLogin} className="input-group">
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <span className="error-text">{error}</span>}
            <button type="submit" className="btn w-full mt-2">
              입장하기
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="auth-container">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-400 mx-auto mb-4" size={48} />
          <p className="text-gray-400">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (fetchError) {
    return (
      <div className="auth-container">
        <div className="auth-card glass border-red-500/50 p-8">
          <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold mb-2">연결 오류</h2>
          <p className="text-gray-400 mb-6">{fetchError}</p>
          <button onClick={() => window.location.reload()} className="btn w-full">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // Reference View
  if (selectedDesigner) {
    return (
      <div className="app-container">
        <header className="app-header glass">
          <div className="app-title">
            <Camera className="text-pink-500" />
            <span>디자이너 인사이트</span>
          </div>
          <div className="text-gray-400 text-sm">{selectedDesigner.name}님 환영합니다</div>
        </header>

        <main className="app-main animate-fade-in">
          <button onClick={handleBack} className="back-btn">
            <ArrowLeft size={20} />
            디자이너 목록으로 돌아가기
          </button>

          <div className="page-header">
            <h2 className="page-title">{selectedDesigner.name}님을 위한 레퍼런스</h2>
            <p className="page-subtitle">강사님이 시트에 작성한 맞춤형 코멘트입니다.</p>
          </div>

          <div className="reference-list">
            {selectedDesigner.references.length > 0 ? (
              selectedDesigner.references.map((ref, index) => (
                <div key={ref.id} className={`reference-card glass stagger-${(index % 5) + 1}`}>
                  <div className="reference-content">
                    <span className="reference-badge">Reference #{index + 1}</span>
                    <p className="reference-reason">"{ref.reason}"</p>
                    <a href={ref.url} target="_blank" rel="noopener noreferrer" className="reference-url hover:text-blue-400 transition-colors">
                      {ref.url}
                    </a>
                  </div>
                  <div className="mt-4 md:mt-0 flex-shrink-0 flex flex-col gap-2">
                    <button 
                      onClick={() => handleFollow(selectedDesigner.id, ref.id)}
                      className={`btn w-full ${followedRefs[`${selectedDesigner.id}-${ref.id}`] ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-pink-500 hover:bg-pink-600'}`}
                      disabled={followedRefs[`${selectedDesigner.id}-${ref.id}`]}
                    >
                      {followedRefs[`${selectedDesigner.id}-${ref.id}`] ? '도전하기로 했어요! 🎉' : '따라해볼게요! 💪'}
                    </button>
                    <a href={ref.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full justify-center">
                      <ExternalLink size={18} />
                      자세히 보기
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-12 glass rounded-2xl text-gray-400">
                <p>아직 배정된 레퍼런스가 없습니다.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Designer List View
  return (
    <div className="app-container">
      <header className="app-header glass">
        <div className="app-title">
          <Camera className="text-pink-500" />
          <span>디자이너 인사이트</span>
        </div>
        <button onClick={() => setIsAuthenticated(false)} className="text-gray-400 hover:text-white transition-colors text-sm">
          로그아웃
        </button>
      </header>

      <main className="app-main animate-fade-in">
        <div className="page-header">
          <h2 className="page-title">누구신가요?</h2>
          <p className="page-subtitle">구글 시트에서 관리된 디자이너 목록입니다.</p>
        </div>

        <div className="designer-grid">
          {designers.map((designer, index) => (
            <div 
              key={designer.id} 
              className={`designer-card glass stagger-${(index % 5) + 1}`}
              onClick={() => handleDesignerSelect(designer)}
            >
              <div className="designer-avatar">
                {designer.name.charAt(0)}
              </div>
              <h3 className="designer-name">{designer.name}</h3>
              <div className="designer-count">
                레퍼런스 {designer.references.length}개
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
