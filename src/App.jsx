import React, { useState, useEffect } from 'react';
import { 
  Settings, Zap, BookOpen, Check, ShieldAlert, ChevronRight, 
  Flame, TrendingUp, Sparkles, Bot, Loader, Info, X, AlertTriangle, Brain, Flower, Bell 
} from 'lucide-react';

// Dữ liệu mẫu ban đầu nếu localStorage chưa có
const defaultLogs = [
  { id: "1", createdAt: "2026-06-21 15:30:22", moodRating: 4, contextTag: "Bạn bè", lessonNote: "Lần trước gặp A nói năng vừa phải, năng lượng thoải mái.", storyDetail: "Hôm nay đi cà phê nói chuyện thoải mái với A, không bị cướp lời." },
  { id: "2", createdAt: "2026-06-22 20:00:15", moodRating: 5, contextTag: "Đám đông", lessonNote: "Lên đỉnh phấn khích ở tiệc sinh nhật B, nói nhiều quá nên sau đó bị sượng.", storyDetail: "Ở bữa tiệc vui quá làm mình phấn khích kể trọn drama nhà B làm mọi người im lặng." },
  { id: "3", createdAt: "2026-06-24 10:15:00", moodRating: 2, contextTag: "Công việc", lessonNote: "Bị sếp phê bình nhỏ nên sập nguồn đóng băng mất cả buổi chiều.", storyDetail: "Sếp nhắc nhẹ về báo cáo, mình bị Amygdala Hijack tự trách móc và không làm được gì tiếp." },
  { id: "4", createdAt: "2026-06-25 18:30:00", moodRating: 3, contextTag: "Công việc", lessonNote: "Họp nhóm bình tĩnh, chỉ phát biểu ý kiến khi được hỏi.", storyDetail: "Buỏi họp diễn ra tốt đẹp, mình lắng nghe là chủ yếu." },
  { id: "5", createdAt: "2026-06-26 21:00:00", moodRating: 1, contextTag: "Xả não", lessonNote: "Xả não: [Công việc] - Độ dài 95 từ", storyDetail: "Đúc kết cảm xúc: [Kiệt sức]" },
  { id: "6", createdAt: "2026-06-26 14:00:00", moodRating: 3, contextTag: "Trước giờ G", lessonNote: "Cam kết phanh khẩn cấp trước khi gặp mặt", storyDetail: "Cam kết thành công" }
];

function formatMarkdownToHtml(text) {
  if (!text) return '';
  
  // Escape HTML entities to prevent XSS
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // Bold: **text** -> <strong class="text-brandviolet font-bold">text</strong>
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="text-brandviolet font-bold">$1</strong>');
  
  const lines = escaped.split('\n');
  let result = [];
  let inList = false;
  
  for (let line of lines) {
    let trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      continue;
    }
    
    // Check if it is a list item starting with * or -
    if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
      let content = trimmed.replace(/^[\*\-]\s*/, '');
      if (!inList) {
        result.push('<ul class="list-disc list-inside space-y-1.5 mt-2 mb-3 pl-2 text-gray-300">');
        inList = true;
      }
      result.push(`<li class="leading-relaxed text-[11px]">${content}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      
      // Check if it is a numbered list item like "1. Title"
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        result.push(`<div class="mt-4 text-xs font-semibold text-gray-200 border-l-2 border-brandviolet pl-3 py-0.5"><span class="text-brandviolet font-bold">${numMatch[1]}.</span> ${numMatch[2]}</div>`);
      } else {
        result.push(`<p class="mt-2 leading-relaxed text-gray-300 font-light text-xs">${trimmed}</p>`);
      }
    }
  }
  
  if (inList) {
    result.push('</ul>');
  }
  
  return result.join('\n');
}

export default function App() {
  // Tab & API State
  const [activeTab, setActiveTab] = useState('buffer');
  const [logs, setLogs] = useState([]);
  const [apiUrl, setApiUrl] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // Tab 1 (Check-in Form) State
  const [moodRating, setMoodRating] = useState(3);
  const [selectedContext, setSelectedContext] = useState('');
  const [lessonNote, setLessonNote] = useState('');
  const [storyDetail, setStoryDetail] = useState('');
  const [isStoryOpen, setIsStoryOpen] = useState(false);

  // Tab 1 Popup Buffer State
  const [showBufferPopup, setShowBufferPopup] = useState(false);
  const [bufferLogs, setBufferLogs] = useState([]);
  const [commitVal, setCommitVal] = useState(0);

  // Tab 2 (Brain Dump) State
  const [dumpTag, setDumpTag] = useState('');
  const [dumpText, setDumpText] = useState('');
  const [isWiping, setIsWiping] = useState(false);
  const [showInstantAdviceModal, setShowInstantAdviceModal] = useState(false);
  const [instantAdviceData, setInstantAdviceData] = useState(null);
  const [instantAdviceTone, setInstantAdviceTone] = useState('serious');

  // Tab 3 (AI Oracle) State
  const [oracleSubTab, setOracleSubTab] = useState('overview'); // 'overview' | 'event'
  const [oracleAdvice, setOracleAdvice] = useState(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  
  // Tab 3 Event Analysis State
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventAnalysisData, setEventAnalysisData] = useState(null);
  const [isLoadingEventAnalysis, setIsLoadingEventAnalysis] = useState(false);

  // Load ban đầu
  useEffect(() => {
    const savedUrl = localStorage.getItem('api_url') || '';
    setApiUrl(savedUrl);

    if (!localStorage.getItem('logs')) {
      localStorage.setItem('logs', JSON.stringify(defaultLogs));
      setLogs(defaultLogs);
    } else {
      const stored = JSON.parse(localStorage.getItem('logs')) || [];
      setLogs(stored);
    }
  }, []);

  // Zen Chánh niệm State
  const [showZen, setShowZen] = useState(false);
  const [zenStep, setZenStep] = useState(1); // 1, 2, 3
  const [zenEmotion, setZenEmotion] = useState('');
  const [zenCycle, setZenCycle] = useState(1);
  const [isZenInhale, setIsZenInhale] = useState(true);

  // Hiệu ứng thở Chánh niệm tự động chuyển nhịp
  useEffect(() => {
    let t;
    if (zenStep === 2) {
      if (isZenInhale) {
        t = setTimeout(() => {
          setIsZenInhale(false);
        }, 4000);
      } else {
        t = setTimeout(() => {
          if (zenCycle < 5) {
            setZenCycle(c => c + 1);
            setIsZenInhale(true);
          } else {
            // Hoàn thành 5 chu kỳ thở -> Sang Bước 3
            setZenStep(3);
            playSingingBowl();
          }
        }, 4000);
      }
    }
    return () => clearTimeout(t);
  }, [zenStep, zenCycle, isZenInhale]);

  const playSingingBowl = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      const frequencies = [180, 270, 360, 450];
      frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 2 + index;
        lfoGain.gain.value = 1.2;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        const initialVolume = index === 0 ? 0.35 : 0.15 / index;
        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.linearRampToValueAtTime(initialVolume, now + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 6.0);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        lfo.start();
        osc.start();
        
        lfo.stop(now + 6.1);
        osc.stop(now + 6.1);
      });
    } catch (err) {
      console.error(err);
    }
  };

  const startZenBreathing = () => {
    if (!zenEmotion.trim()) {
      showToast('Vui lòng nhập 1 cảm xúc để bắt đầu ôm ấp!', 'error');
      return;
    }
    setZenStep(2);
    setZenCycle(1);
    setIsZenInhale(true);
  };

  const handleFinishZenSession = () => {
    const newLog = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      moodRating: 3,
      contextTag: "Chánh niệm",
      lessonNote: `Gọi tên cảm xúc: ${zenEmotion}`,
      storyDetail: `Thực hành chánh niệm ôm ấp cảm xúc trong 1 phút thành công.`
    };

    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    localStorage.setItem('logs', JSON.stringify(updatedLogs));

    if (apiUrl) {
      fetch(apiUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(newLog)
      }).catch(err => console.error(err));
    }

    setShowZen(false);
    showToast('Đã lưu phiên thực hành chánh niệm vào nhật ký!');
  };

  // Fetch từ Google Sheet nếu có URL cấu hình
  const syncFromSheets = async (url) => {
    if (!url) return;
    try {
      const res = await fetch(`${url}?action=getLogs`);
      const data = await res.json();
      if (Array.isArray(data)) {
        localStorage.setItem('logs', JSON.stringify(data));
        setLogs(data);
        showToast('Đồng bộ dữ liệu Sheets thành công!');
      }
    } catch (err) {
      console.error(err);
      showToast('Đồng bộ Sheets thất bại, sử dụng offline.', 'error');
    }
  };

  useEffect(() => {
    if (apiUrl) {
      syncFromSheets(apiUrl);
    }
  }, [apiUrl]);

  // Toast System
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 2500);
  };

  // --- LOGIC TAB 1: FORM CHECK-IN ---
  const handleSaveLog = async () => {
    if (!selectedContext) {
      showToast('Vui lòng chọn bối cảnh!', 'error');
      return;
    }
    if (!lessonNote.trim()) {
      showToast('Vui lòng ghi lại bài học 1 dòng!', 'error');
      return;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog = {
      id: Date.now().toString(),
      createdAt: timestamp,
      moodRating: parseInt(moodRating),
      contextTag: selectedContext,
      lessonNote: lessonNote.trim(),
      storyDetail: storyDetail.trim()
    };

    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    localStorage.setItem('logs', JSON.stringify(updatedLogs));

    // Reset Form
    setLessonNote('');
    setStoryDetail('');
    setMoodRating(3);
    setSelectedContext('');
    if (isStoryOpen) setIsStoryOpen(false);

    if (apiUrl) {
      showToast('Đang gửi lên Sheets...');
      try {
        await fetch(apiUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLog)
        });
        showToast('Đã lưu bài học lên Google Sheets!');
      } catch (err) {
        showToast('Đồng bộ lỗi, đã lưu tạm cục bộ!', 'error');
      }
    } else {
      showToast('Đã lưu bài học cục bộ (Chưa cấu hình Sheets)');
    }
  };

  const getMoodLabelText = (val) => {
    const labels = {
      1: "1/5 - Sập nguồn / Đóng băng ❄️",
      2: "2/5 - Mệt mỏi / Đi xuống 😟",
      3: "3/5 - Bình thường / Cân bằng 😐",
      4: "4/5 - Vui vẻ / Hăng hái 😊",
      5: "5/5 - Quá hưng phấn / High năng lượng 🔥"
    };
    return labels[val] || '';
  };

  // --- LOGIC TAB 1: POPUP PHANH GẤP ---
  const handleTriggerBuffer = () => {
    const checkinLogs = logs.filter(l => l.contextTag !== 'Xả não' && l.contextTag !== 'Trước giờ G');
    if (checkinLogs.length === 0) {
      setBufferLogs([]);
    } else {
      const shuffled = [...checkinLogs].sort(() => 0.5 - Math.random());
      setBufferLogs(shuffled.slice(0, 3));
    }
    setCommitVal(0);
    setShowBufferPopup(true);
  };

  const handleCommitSliderChange = async (val) => {
    setCommitVal(val);
    if (val >= 95) {
      setShowBufferPopup(false);
      showToast('Bản năng đã được kiểm soát! Hãy tự tin vào trận.');

      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newLog = {
        id: Date.now().toString(),
        createdAt: timestamp,
        moodRating: 3,
        contextTag: 'Trước giờ G',
        lessonNote: 'Đã tự phanh và cam kết kiểm soát trước cuộc gặp',
        storyDetail: 'Cam kết thành công'
      };

      const updatedLogs = [...logs, newLog];
      setLogs(updatedLogs);
      localStorage.setItem('logs', JSON.stringify(updatedLogs));

      if (apiUrl) {
        try {
          await fetch(apiUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newLog)
          });
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  // --- LOGIC TAB 2: XẢ NÃO & AI CỨU TRỢ ---
  const handleNuclearWipe = async () => {
    if (!dumpTag) {
      showToast('Vui lòng chọn 1 chủ đề xả não!', 'error');
      return;
    }
    if (!dumpText.trim()) {
      showToast('Vui lòng viết uất ức trước khi xả!', 'error');
      return;
    }

    setIsWiping(true);

    const text = dumpText.trim();
    const tag = dumpTag;
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    // Phân tích trạng thái tiêu cực
    const negativeWords = ['tức', 'giận', 'điên', 'ghét', 'bực', 'nản', 'áp lực', 'mệt', 'tệ', 'khóc', 'hận', 'chán'];
    let emotion = 'Mệt mỏi';
    let score = 0;
    negativeWords.forEach(word => {
      if (text.toLowerCase().includes(word)) score++;
    });

    if (score >= 4) emotion = 'Phẫn nộ dữ dội 🌋';
    else if (score >= 2) emotion = 'Ấm ức / Uất nghẹn 🌋';
    else if (wordCount > 100) emotion = 'Quá tải cảm xúc 🧠';

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog = {
      id: Date.now().toString(),
      createdAt: timestamp,
      moodRating: 1, // Sập nguồn
      contextTag: 'Xả não',
      lessonNote: `Xả não: [${dumpTag}] - Độ dài ${wordCount} từ`,
      storyDetail: `Đúc kết cảm xúc: [${emotion}]`
    };

    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    localStorage.setItem('logs', JSON.stringify(updatedLogs));

    // Mở modal cứu trợ tức thời
    setInstantAdviceData(null);
    setShowInstantAdviceModal(true);
    setInstantAdviceTone('serious');

    if (apiUrl) {
      // Gửi metadata log lên sheets ẩn danh
      fetch(apiUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      }).catch(err => console.error(err));

      // Gọi API lấy lời khuyên tức thời
      try {
        const res = await fetch(`${apiUrl}?action=getInstantAdvice&text=${encodeURIComponent(text)}&tag=${encodeURIComponent(tag)}`);
        const data = await res.json();
        if (data && !data.error) {
          setInstantAdviceData(data);
        } else {
          showToast('Lỗi lấy AI cứu trợ!', 'error');
          runInstantAdviceFallback(tag);
        }
      } catch (err) {
        console.error(err);
        showToast('Lỗi kết nối AI online!', 'error');
        runInstantAdviceFallback(tag);
      }
    } else {
      setTimeout(() => {
        runInstantAdviceFallback(tag);
      }, 1200);
    }

    setTimeout(() => {
      setDumpText('');
      setDumpTag('');
      setIsWiping(false);
    }, 600);
  };

  const runInstantAdviceFallback = (tag) => {
    setInstantAdviceData({
      seriousAdvice: `Bạn vừa xả uất ức về chủ đề [${tag}]. Để giải phóng sự quá tải hệ thần kinh ngay lúc này, hãy Shock giác quan bằng cách rửa mặt nước đá lạnh, uống một ly nước mát ấm, hoặc ngửi một chút tinh dầu hương thảo để định thần lại ngay lập tức.`,
      funnyAdvice: `Xả ra xong bớt bực mình chưa cưng? Gớm bực dọc chi cho mau già xấu xí má ơi, đi rửa mặt rồi ngủ một giấc hoặc làm cốc trà sữa giải sầu đi cho khoẻ xác!`
    });
  };

  // --- LOGIC TAB 3: STATISTICS & AI ORACLE ---
  
  const computeStats = () => {
    let brakesCount = 0;
    let dumpsCount = 0;
    let highEnergyCount = 0;
    let lowEnergyCount = 0;
    let dumpTriggers = {};
    let zenMinutes = 0;
    let zenEmotions = {};

    logs.forEach(l => {
      if (l.contextTag === 'Trước giờ G') {
        brakesCount++;
      } else if (l.contextTag === 'Xả não') {
        dumpsCount++;
        const match = l.lessonNote.match(/\[(.*?)\]/);
        if (match && match[1]) {
          const tag = match[1];
          dumpTriggers[tag] = (dumpTriggers[tag] || 0) + 1;
        }
      } else if (l.contextTag === 'Chánh niệm') {
        zenMinutes++;
        const emotion = l.lessonNote.replace('Gọi tên cảm xúc: ', '').trim();
        if (emotion) {
          zenEmotions[emotion] = (zenEmotions[emotion] || 0) + 1;
        }
      } else {
        if (l.moodRating >= 4) highEnergyCount++;
        if (l.moodRating <= 2) lowEnergyCount++;
      }
    });

    let maxTrigger = 'Chưa có';
    let maxCount = 0;
    for (const [tag, count] of Object.entries(dumpTriggers)) {
      if (count > maxCount) {
        maxCount = count;
        maxTrigger = tag;
      }
    }

    const emojiMap = { 'Công việc': '💼', 'Bạn bè': '🤝', 'Gia đình': '🏠', 'Bản thân': '🧘' };
    const triggerText = maxCount > 0 ? `${emojiMap[maxTrigger] || ''} ${maxTrigger} (${maxCount} lần)` : 'Chưa có dữ liệu';

    let topEmotionsStr = 'Chưa có';
    const sortedEmotions = Object.entries(zenEmotions).sort((a, b) => b[1] - a[1]);
    if (sortedEmotions.length > 0) {
      topEmotionsStr = sortedEmotions.slice(0, 2).map(([name, count]) => `${name} (${count}l)`).join(', ');
    }

    return {
      brakesCount,
      dumpsCount,
      highEnergyCount,
      lowEnergyCount,
      triggerText,
      zenMinutes,
      zenEmotionsStr: topEmotionsStr
    };
  };

  const { brakesCount, dumpsCount, highEnergyCount, lowEnergyCount, triggerText, zenMinutes, zenEmotionsStr } = computeStats();

  let lessonLabel = "Ghi chú 1 dòng (Bài học xương máu):";
  let lessonPlaceholder = "Ví dụ: Nói quá đà với hội A, bớt kỳ vọng...";
  if (moodRating <= 2) {
    lessonLabel = "Ghi chú 1 dòng (Bài học xương máu):";
    lessonPlaceholder = "Ví dụ: Không đôi co lúc nóng giận, bớt kỳ vọng...";
  } else if (Number(moodRating) === 3) {
    lessonLabel = "Ghi chú 1 dòng (Trạng thái cân bằng):";
    lessonPlaceholder = "Ví dụ: Đầu óc thảnh thơi, không bận tâm chuyện vặt...";
  } else {
    lessonLabel = "Ghi chú 1 dòng (Neo hạnh phúc / Biết ơn):";
    lessonPlaceholder = "Ví dụ: Trò chuyện rất kết nối với A, biết ơn vì ngày hôm nay...";
  }

  const renderSvgChart = () => {
    const chartLogs = logs.filter(l => l.contextTag !== 'Trước giờ G' && l.contextTag !== 'Xả não' && l.contextTag !== 'Chánh niệm');
    if (chartLogs.length === 0) return { path: '', points: [] };

    const last7 = chartLogs.slice(-7).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const width = 100;
    const height = 30;
    const paddingX = 10;
    const paddingY = 5;

    const usableWidth = width - 2 * paddingX;
    const usableHeight = height - 2 * paddingY;
    const stepX = last7.length > 1 ? usableWidth / (last7.length - 1) : usableWidth;

    const points = last7.map((l, index) => {
      const x = paddingX + index * stepX;
      const normY = (l.moodRating - 1) / 4;
      const y = height - paddingY - normY * usableHeight;
      return { x, y, rating: l.moodRating, date: l.createdAt.substring(5, 10) };
    });

    let pathD = '';
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        pathD += ` L ${points[i].x} ${points[i].y}`;
      }
    }

    return { pathD, points };
  };

  const { pathD, points: chartPoints } = renderSvgChart();

  // Gọi AI Oracle báo cáo tổng quan 7 ngày
  const handleRequestAIOverview = async () => {
    setIsLoadingAdvice(true);
    setOracleAdvice(null);

    if (apiUrl) {
      try {
        const res = await fetch(`${apiUrl}?action=getAdvice`);
        const data = await res.json();
        if (data && !data.error) {
          setOracleAdvice(data);
          setIsLoadingAdvice(false);
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Giả lập AI chạy local nếu offline hoặc API lỗi
    setTimeout(() => {
      const last7 = logs.slice(-7);
      let sumMood = 0;
      let count = 0;
      let xanaoCount = 0;
      let localBrakes = 0;

      last7.forEach(l => {
        if (l.contextTag === 'Xả não') xanaoCount++;
        else if (l.contextTag === 'Trước giờ G') localBrakes++;
        else {
          sumMood += l.moodRating;
          count++;
        }
      });

      const avgMood = count > 0 ? sumMood / count : 3;

      const simulated = {
        patternTitle: `Cân bằng lý trí (Phanh ${localBrakes} lần, xả ${xanaoCount} lần)`,
        patternDesc: `Năng lượng trung bình đạt ${avgMood.toFixed(1)}/5. Trạng thái tâm lý tổng quát tuần qua ổn định. Bạn đang phối hợp tốt giữa phanh gấp trước cuộc gặp và xả áp kịp thời để duy trì sự cân bằng.`,
        seriousAdvice: "Tiếp tục thực hành bộ lọc 3 giây trong giao tiếp. Hãy làm một người lắng nghe chân thành, gật đầu mỉm cười thay vì cố gắng điều khiển cuộc trò chuyện.",
        microAction: "Duy trì uống 1 cốc nước ấm trước khi phát biểu ý kiến trong các bối cảnh nhạy cảm hôm nay."
      };

      setOracleAdvice(simulated);
      setIsLoadingAdvice(false);
    }, 1200);
  };

  // Gọi AI Phân tích sự kiện chọn lọc
  const handleRequestEventAnalysis = async () => {
    if (!selectedEventId) {
      showToast('Chưa chọn sự kiện để phân tích!', 'error');
      return;
    }
    const log = logs.find(l => String(l.id) === String(selectedEventId));
    if (!log) return;

    // Nếu đã có phân tích được lưu, hiển thị ngay lập tức không gọi API nữa
    if (log.aiExplanation && log.aiRecommendation) {
      setEventAnalysisData({
        explanation: log.aiExplanation,
        recommendation: log.aiRecommendation
      });
      return;
    }

    setIsLoadingEventAnalysis(true);
    setEventAnalysisData(null);

    if (apiUrl) {
      try {
        const res = await fetch(`${apiUrl}?action=analyzeEvent&id=${log.id}`);
        const data = await res.json();
        if (data && !data.error) {
          setEventAnalysisData(data);
          setIsLoadingEventAnalysis(false);
          
          // Cập nhật và lưu vào Local Logs state
          const updated = logs.map(l => {
            if (String(l.id) === String(selectedEventId)) {
              return { ...l, aiExplanation: data.explanation, aiRecommendation: data.recommendation };
            }
            return l;
          });
          setLogs(updated);
          localStorage.setItem('logs', JSON.stringify(updated));
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Giả lập phân tích sự kiện cục bộ
    setTimeout(() => {
      const simulated = {
        explanation: `Sự kiện check-in bối cảnh [${log.contextTag}] có bài học: "${log.lessonNote}". Cảm xúc Mood ${log.moodRating}/5 chỉ ra rằng phản ứng của bạn xuất phát từ sự kích hoạt đột ngột của Amygdala (cơ chế chiến-hoặc-biến) làm mất đi 3 giây lọc thông tin lý tính.`,
        recommendation: "Kích hoạt bộ lọc 3 giây: Mỗi khi gặp tình huống tương tự, hãy im lặng, hít thở và uống 1 ngụm nước để hạ nhiệt hệ thần kinh giao cảm trước khi phản hồi."
      };
      setEventAnalysisData(simulated);
      setIsLoadingEventAnalysis(false);
    }, 1200);
  };

  const handleEventSelectionChange = (id) => {
    setSelectedEventId(id);
    if (!id) {
      setEventAnalysisData(null);
      return;
    }
    const log = logs.find(l => String(l.id) === String(id));
    if (log && log.aiExplanation && log.aiRecommendation) {
      setEventAnalysisData({
        explanation: log.aiExplanation,
        recommendation: log.aiRecommendation
      });
    } else {
      setEventAnalysisData(null);
    }
  };

  const getFilterCheckinLogs = () => {
    return logs.filter(l => l.contextTag !== 'Xả não' && l.contextTag !== 'Trước giờ G');
  };

  return (
    <div className="w-full max-w-md bg-darkbg border-x border-darkborder flex flex-col relative overflow-hidden shadow-2xl min-h-screen">
      
      {/* Top Header */}
      <header className="bg-darkcard/50 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-darkborder sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-brandred rounded-full animate-pulse"></div>
          <span className="font-bold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500">MindFlow</span>
        </div>
        <button onClick={() => setShowSettings(true)} className="text-gray-400 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Main content viewport */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24 px-6 pt-4">

        {/* ================== TAB 1: PRE-MEETING BUFFER ================== */}
        {activeTab === 'buffer' && (
          <div className="space-y-6">
            {/* Nút Sắp Vào Trận */}
            <div className="bg-gradient-to-b from-rose-950/20 to-transparent p-5 rounded-2xl border border-rose-900/30 text-center space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-rose-400">Tiện ích "Trước Giờ G"</h2>
              <p class="text-sm text-gray-400">Bấm nút phanh này để kích hoạt lại bộ nhớ, đối diện với bài học xương máu trước khi bắt đầu giao tiếp.</p>
              <button 
                onClick={handleTriggerBuffer}
                className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-95 text-white font-semibold rounded-xl shadow-lg shadow-rose-950/50 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Zap className="w-5 h-5 fill-current" />
                <span>SẮP VÀO TRẬN / GẶP MẶT</span>
              </button>
            </div>

            {/* Form Check-in */}
            <div className="bg-darkcard p-5 rounded-2xl border border-darkborder space-y-5">
              <h3 className="font-medium text-gray-200 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-brandblue" />
                <span>Khóa Bài Học Mới (Check-in)</span>
              </h3>

              {/* Mood Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <label className="text-gray-400">Tâm trạng hiện tại:</label>
                  <span className="font-semibold text-brandblue">{getMoodLabelText(moodRating)}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  value={moodRating} 
                  onChange={(e) => setMoodRating(e.target.value)}
                  className="w-full h-2 bg-darkborder rounded-lg appearance-none cursor-pointer accent-brandblue"
                />
                <div className="flex justify-between text-xs text-gray-500 px-1">
                  <span>❄️ Sập nguồn</span>
                  <span>😐 Cân bằng</span>
                  <span>🔥 Phấn khích</span>
                </div>
              </div>

              {/* Context Badges */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400 block">Bối cảnh giao tiếp:</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Bạn bè', 'Gia đình', 'Công việc', 'Đám đông', 'Một mình', 'Người khác'].map((ctx) => {
                    const iconMap = { 'Bạn bè': '🤝', 'Gia đình': '🏠', 'Công việc': '💼', 'Đám đông': '🗣️', 'Một mình': '🧘', 'Người khác': '👥' };
                    const isSelected = selectedContext === ctx;
                    return (
                      <button
                        key={ctx}
                        onClick={() => setSelectedContext(ctx)}
                        className={`py-2.5 px-1 text-xs font-medium rounded-lg border transition-all duration-200 ${
                          isSelected 
                            ? 'bg-brandblue/20 text-brandblue border-brandblue/50' 
                            : 'bg-darkbg text-gray-400 border-darkborder'
                        }`}
                      >
                        {iconMap[ctx]} {ctx}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lesson Input */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400 block">{lessonLabel}</label>
                <input 
                  type="text" 
                  value={lessonNote}
                  onChange={(e) => setLessonNote(e.target.value)}
                  placeholder={lessonPlaceholder} 
                  className="w-full py-2.5 px-4 bg-darkbg border border-darkborder rounded-xl focus:border-brandblue focus:outline-none text-sm text-gray-200 transition-colors"
                />
              </div>

              {/* Story Note Toggle */}
              <div className="space-y-2">
                <button 
                  onClick={() => setIsStoryOpen(!isStoryOpen)}
                  className="text-xs text-brandblue hover:underline flex items-center space-x-1"
                >
                  <span>{isStoryOpen ? '- Thu gọn nhật ký chi tiết' : '+ Viết thêm nhật ký chi tiết câu chuyện'}</span>
                </button>
                {isStoryOpen && (
                  <textarea 
                    value={storyDetail}
                    onChange={(e) => setStoryDetail(e.target.value)}
                    rows={3} 
                    placeholder="Kể chi tiết chuyện gì đã xảy ra... Điều này sẽ giúp bạn dễ hình dung lại bối cảnh cụ thể khi được nhắc nhở lần sau." 
                    className="w-full p-4 bg-darkbg border border-darkborder rounded-xl focus:border-brandblue focus:outline-none text-sm text-gray-200 transition-colors"
                  />
                )}
              </div>

              {/* Save Button */}
              <button 
                onClick={handleSaveLog}
                className="w-full py-3 bg-brandblue hover:bg-blue-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Khóa Bài Học</span>
              </button>
            </div>
          </div>
        )}

        {/* ================== TAB 2: BRAIN DUMP ZONE ================== */}
        {activeTab === 'dump' && (
          <div className="space-y-4 flex flex-col h-full">
            <div className="flex-1 flex flex-col bg-darkcard border border-darkborder rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-200 flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-brandred" />
                  <span>Vùng Xả Não (Brain Dump)</span>
                </h3>
                <span className="text-xs text-rose-500 bg-rose-950/20 px-2.5 py-1 rounded-full border border-rose-900/30">Mật 100%</span>
              </div>
              
              <p className="text-xs text-gray-400 leading-relaxed">Hãy gõ điên cuồng tất cả những uất ức, drama, tức giận ở đây để xả giận. Nội dung chữ viết của bạn sẽ bị hủy diệt vĩnh viễn, chúng tôi chỉ lưu lại <b>mức độ uất ức</b> và <b>tâm trạng đúc kết</b> để thống kê tần suất cảm xúc tiêu cực.</p>
              
              {/* Dump Tag Selection */}
              <div className="space-y-2">
                <label className="text-xs text-gray-400 block">Chủ đề gây ức chế:</label>
                <div className="flex flex-wrap gap-2">
                  {['Công việc', 'Bạn bè', 'Gia đình', 'Bản thân'].map(tag => {
                    const iconMap = { 'Công việc': '💼', 'Bạn bè': '🤝', 'Gia đình': '🏠', 'Bản thân': '🧘' };
                    const isSelected = dumpTag === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => setDumpTag(tag)}
                        className={`py-1.5 px-3 text-xs font-medium rounded-lg border transition-all duration-200 ${
                          isSelected 
                            ? 'bg-brandred/20 text-brandred border-brandred/50' 
                            : 'bg-darkbg text-gray-400 border-darkborder'
                        }`}
                      >
                        {iconMap[tag]} {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Textarea */}
              <div className="flex-1 relative">
                <textarea 
                  value={dumpText}
                  onChange={(e) => setDumpText(e.target.value)}
                  placeholder="Gõ mọi bực dọc vào đây... Đừng ngại ngần gì..." 
                  className={`w-full h-64 p-4 bg-darkbg border border-darkborder rounded-xl focus:border-brandred focus:outline-none text-sm text-gray-200 resize-none font-light leading-relaxed ${
                    isWiping ? 'nuclear-wipe-animation' : ''
                  }`}
                />
              </div>

              {/* Nuclear Wipe Button */}
              <button 
                onClick={handleNuclearWipe}
                className="w-full py-4 bg-gradient-to-r from-brandred to-rose-700 hover:from-rose-600 hover:to-rose-800 text-white font-semibold rounded-xl shadow-lg shadow-rose-950/20 active:scale-95 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Flame className="w-5 h-5" />
                <span>HỦY DIỆT VĨNH VIỄN (Nuclear Wipe)</span>
              </button>
            </div>
          </div>
        )}

        {/* ================== TAB 3: AI ORACLE ================== */}
        {activeTab === 'oracle' && (
          <div className="space-y-6">
            {/* Biểu đồ Mood Trend */}
            <div className="bg-darkcard p-5 rounded-2xl border border-darkborder space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-200 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-brandviolet" />
                  <span>Xu Hướng Cảm Xúc (7 Ngày)</span>
                </h3>
                <span className="text-xs text-gray-500 font-light font-sans">Dao động: 1 - 5</span>
              </div>

              {/* SVG Chart */}
              <div className="w-full h-32 flex items-center justify-center relative bg-darkbg/50 rounded-xl overflow-hidden border border-darkborder/50">
                {chartPoints.length === 0 ? (
                  <div className="text-xs text-gray-500">Chưa có dữ liệu cảm xúc nào được lưu.</div>
                ) : (
                  <svg className="w-full h-full p-2" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <line x1="0" y1="5" x2="100" y2="5" stroke="#24242B" strokeWidth="0.2" strokeDasharray="1 1"/>
                    <line x1="0" y1="15" x2="100" y2="15" stroke="#24242B" strokeWidth="0.2" stroke-dasharray="1 1"/>
                    <line x1="0" y1="25" x2="100" y2="25" stroke="#24242B" strokeWidth="0.2" stroke-dasharray="1 1"/>
                    
                    <path d={pathD} fill="none" stroke="url(#gradient-violet-react)" strokeWidth="1.2" strokeLinecap="round"/>
                    
                    {chartPoints.map((pt, i) => (
                      <circle 
                        key={i}
                        cx={pt.x} 
                        cy={pt.y} 
                        r="1.2" 
                        fill="#1F1F27" 
                        stroke="#8B5CF6" 
                        strokeWidth="0.6"
                      >
                        <title>Ngày {pt.date}: Mood {pt.rating}/5</title>
                      </circle>
                    ))}
                    <defs>
                      <linearGradient id="gradient-violet-react" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="50%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#E11D48" />
                      </linearGradient>
                    </defs>
                  </svg>
                )}
              </div>
            </div>

            {/* Bảng chỉ số Tự soi chiếu */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-darkcard p-4 rounded-xl border border-darkborder flex flex-col justify-between">
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>Đã phanh gấp</span>
                </div>
                <div className="mt-2 flex items-baseline space-x-1">
                  <span className="text-2xl font-bold text-rose-500">{brakesCount}</span>
                  <span className="text-[10px] text-gray-500 font-sans">lần trước giờ G</span>
                </div>
              </div>

              <div className="bg-darkcard p-4 rounded-xl border border-darkborder flex flex-col justify-between">
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <Flame className="w-4 h-4 text-brandred" />
                  <span>Đã xả áp</span>
                </div>
                <div className="mt-2 flex items-baseline space-x-1">
                  <span className="text-2xl font-bold text-brandred">{dumpsCount}</span>
                  <span className="text-[10px] text-gray-500 font-sans">lần xả não</span>
                </div>
              </div>
            </div>

            {/* Phân tích chi tiết tuần */}
            <div className="bg-darkcard p-5 rounded-2xl border border-darkborder space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Phân Tích Chi Tiết Tuần</h4>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-2 bg-darkbg/40 p-3 rounded-xl border border-darkborder/50">
                  <span className="text-gray-400 block font-light">Trồi sụt năng lượng:</span>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>🚀 Hưng phấn (4-5):</span>
                      <span className="font-bold text-brandblue">{highEnergyCount} lần</span>
                    </div>
                    <div className="flex justify-between">
                      <span>❄️ Sập nguồn (1-2):</span>
                      <span className="font-bold text-rose-400">{lowEnergyCount} lần</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Thống kê Chánh niệm */}
              <div className="bg-darkbg/40 p-3 rounded-xl border border-darkborder/50 text-xs flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-lg select-none">🧘</span>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-light">Đã chánh niệm:</span>
                    <span className="font-bold text-brandviolet text-sm">{zenMinutes} phút</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 block text-[10px] font-light">Cảm xúc hay đối mặt nhất:</span>
                  <span className="font-semibold text-gray-300 text-xs">{zenEmotionsStr}</span>
                </div>
              </div>
            </div>

            {/* Sub-tabs cho AI Oracle */}
            <div className="flex bg-darkcard border border-darkborder p-1 rounded-xl">
              <button 
                onClick={() => setOracleSubTab('overview')} 
                className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                  oracleSubTab === 'overview' 
                    ? 'bg-darkborder text-brandviolet font-bold' 
                    : 'text-gray-400'
                }`}
              >
                📊 Tổng Quan 7 Ngày
              </button>
              <button 
                onClick={() => setOracleSubTab('event')} 
                className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                  oracleSubTab === 'event' 
                    ? 'bg-darkborder text-brandviolet font-bold' 
                    : 'text-gray-400'
                }`}
              >
                🎯 Phân Tích Sự Kiện
              </button>
            </div>

            {/* SUB-TAB 1: OVERVIEW */}
            {oracleSubTab === 'overview' && (
              <div className="space-y-4">
                <button 
                  onClick={handleRequestAIOverview}
                  disabled={isLoadingAdvice}
                  className="w-full py-4 bg-gradient-to-r from-brandviolet to-indigo-700 hover:from-purple-600 hover:to-indigo-800 text-white font-semibold rounded-xl shadow-lg shadow-purple-950/20 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5 fill-current text-purple-200" />
                  <span>Nhận Lời Khuyên Tổng Quan</span>
                </button>

                {/* Khung Kết Quả Oracle Overview */}
                {(isLoadingAdvice || oracleAdvice) && (
                  <div className="bg-darkcard border border-darkborder rounded-2xl p-5 space-y-4">
                    <div className="flex items-center space-x-3 border-b border-darkborder pb-3">
                      <div className="w-8 h-8 rounded-full bg-brandviolet/20 flex items-center justify-center border border-brandviolet/40">
                        <Bot className="w-4.5 h-4.5 text-brandviolet" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-200">AI Oracle (Đúc kết 7 Ngày)</h4>
                        <p className="text-[10px] text-gray-500 font-sans">Đối chiếu Master Advice & Logs</p>
                      </div>
                    </div>

                    {isLoadingAdvice ? (
                      <div className="flex items-center space-x-2 text-brandviolet animate-pulse justify-center py-4">
                        <Loader className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-sans">AI đang phân tích xu hướng cảm xúc...</span>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-300 space-y-3 leading-relaxed font-light font-sans">
                        <p className="font-medium text-rose-400">
                          ⚠️ [Chu kỳ tâm lý 7 ngày qua]:
                        </p>
                        <p className="text-xs leading-relaxed text-gray-200 font-bold" dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(oracleAdvice.patternTitle) }} />
                        <div className="text-xs leading-relaxed mt-1 text-gray-300" dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(oracleAdvice.patternDesc) }} />
                        
                        <p className="font-medium text-amber-400 mt-3">
                          👔 [Lời khuyên dài hạn (Master Advice)]:
                        </p>
                        <div className="text-xs leading-relaxed text-gray-300" dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(oracleAdvice.seriousAdvice) }} />

                        <p className="font-medium text-emerald-400 mt-3">
                          🎯 [Hành động nhỏ hôm nay]:
                        </p>
                        <div className="text-xs bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-900/30 font-semibold text-emerald-300" dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(oracleAdvice.microAction) }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: EVENT ANALYSIS */}
            {oracleSubTab === 'event' && (
              <div className="space-y-4">
                <div className="bg-darkcard p-5 rounded-2xl border border-darkborder space-y-4">
                  <label className="text-xs text-gray-400 block font-light">Chọn sự kiện giao tiếp/check-in của tuần qua:</label>
                  <select 
                    value={selectedEventId}
                    onChange={(e) => handleEventSelectionChange(e.target.value)}
                    className="w-full py-3 px-4 bg-darkbg border border-darkborder rounded-xl text-xs focus:outline-none focus:border-brandviolet text-gray-200 font-sans"
                  >
                    <option value="">-- Chọn sự kiện trong danh sách --</option>
                    {getFilterCheckinLogs().map(log => {
                      const dateStr = log.createdAt.substring(5, 16);
                      const snippet = log.lessonNote.length > 45 ? log.lessonNote.substring(0, 45) + '...' : log.lessonNote;
                      return (
                        <option key={log.id} value={log.id}>
                          [{dateStr}] [{log.contextTag}] Mood {log.moodRating}: {snippet}
                        </option>
                      );
                    })}
                  </select>
                  <button 
                    onClick={handleRequestEventAnalysis}
                    disabled={isLoadingEventAnalysis || !selectedEventId}
                    className="w-full py-3.5 bg-gradient-to-r from-brandviolet to-indigo-700 hover:from-purple-600 hover:to-indigo-800 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Brain className="w-4 h-4" />
                    <span>AI PHÂN TÍCH SỰ KIỆN NÀY</span>
                  </button>
                </div>

                {/* Khung kết quả Event Analysis */}
                {(isLoadingEventAnalysis || eventAnalysisData) && (
                  <div className="bg-darkcard border border-darkborder rounded-2xl p-5 space-y-4">
                    <div className="flex items-center space-x-3 border-b border-darkborder pb-3">
                      <div className="w-8 h-8 rounded-full bg-brandviolet/20 flex items-center justify-center border border-brandviolet/40">
                        <Bot className="w-4.5 h-4.5 text-brandviolet" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-200">AI Oracle (Giải mã sự kiện)</h4>
                        <p className="text-[10px] text-gray-500 font-sans font-light">Phân tích cơ chế sinh học & tâm lý học</p>
                      </div>
                    </div>

                    {isLoadingEventAnalysis ? (
                      <div className="flex items-center space-x-2 text-brandviolet animate-pulse justify-center py-4">
                        <Loader className="w-5 h-5 animate-spin" />
                        <span className="text-sm">AI đang giải mã phản ứng tâm lý...</span>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-300 space-y-3 leading-relaxed font-light font-sans">
                        <p className="font-medium text-rose-400 mb-1">
                          🧠 [Giải mã cơ chế tâm lý]:
                        </p>
                        <div className="text-xs space-y-2 mb-4" dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(eventAnalysisData.explanation) }} />
                        
                        <p className="font-medium text-emerald-400 mt-4 mb-1">
                          🎯 [Khuyến nghị hướng giải quyết]:
                        </p>
                        <div className="text-xs bg-emerald-950/20 p-4 rounded-xl border border-emerald-900/30 text-emerald-300" dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(eventAnalysisData.recommendation) }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Bottom Navigation Bar */}
      <nav className="absolute bottom-0 inset-x-0 bg-darkcard/80 backdrop-blur-lg border-t border-darkborder flex justify-around items-center py-3 px-2 z-40">
        <button 
          onClick={() => switchTab('buffer')}
          className={`flex flex-col items-center space-y-1 transition-all duration-200 ${
            activeTab === 'buffer' ? 'text-brandblue scale-105' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <ShieldAlert className="w-5 h-5" />
          <span className="text-[10px] font-medium uppercase tracking-wider font-sans">Phanh Gấp</span>
        </button>
        <button 
          onClick={() => switchTab('dump')}
          className={`flex flex-col items-center space-y-1 transition-all duration-200 ${
            activeTab === 'dump' ? 'text-brandred scale-105' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Flame className="w-5 h-5" />
          <span className="text-[10px] font-medium uppercase tracking-wider font-sans">Xả Não</span>
        </button>
        <button 
          onClick={() => switchTab('oracle')}
          className={`flex flex-col items-center space-y-1 transition-all duration-200 ${
            activeTab === 'oracle' ? 'text-brandviolet scale-105' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-medium uppercase tracking-wider font-sans">AI Oracle</span>
        </button>
      </nav>

      {/* ================== MODAL: SETTINGS ================== */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-darkcard border border-darkborder rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-darkborder pb-3">
              <h3 className="font-semibold text-gray-200">Cấu hình API Kết Nối</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-gray-400">Google Apps Script Web App URL:</label>
                <input 
                  type="text" 
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec" 
                  className="w-full py-2 px-3 bg-darkbg border border-darkborder rounded-lg text-xs focus:outline-none focus:border-brandblue text-gray-200"
                />
              </div>
              <div className="bg-darkbg/50 p-3 rounded-lg border border-darkborder/50 text-[11px] text-gray-500 leading-relaxed font-sans">
                * Nhập URL Apps Script Web App của bạn để đồng bộ dữ liệu trực tiếp lên Google Sheets. Tạm thời app sẽ lưu cục bộ trong trình duyệt (Local Storage) để chạy thử nghiệm.
              </div>
            </div>
            <button 
              onClick={() => {
                localStorage.setItem('api_url', apiUrl);
                setShowSettings(false);
                syncFromSheets(apiUrl);
              }}
              className="w-full py-2.5 bg-brandblue hover:bg-blue-600 text-white font-medium rounded-lg text-sm transition-colors"
            >
              Lưu Cấu Hình
            </button>
          </div>
        </div>
      )}

      {/* ================== POPUP MODAL: PRE-MEETING BUFFER ================== */}
      {showBufferPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-darkcard border border-rose-900/30 rounded-2xl p-6 space-y-5 flex flex-col max-h-[85vh]">
            
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/20 mb-1">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="font-bold text-lg text-rose-500">THƯ GỬI BẢN THÂN</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-sans">Góc tự soi chiếu - phanh trước giờ G</p>
            </div>

            {/* Reminders List */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 py-2">
              {bufferLogs.length === 0 ? (
                <div className="p-4 bg-darkbg rounded-xl border border-darkborder text-center text-gray-500 text-sm">
                  Bạn chưa có vết thương xương máu nào được ghi lại.
                </div>
              ) : (
                bufferLogs.map((log, index) => (
                  <div key={log.id} className="p-4 bg-darkbg rounded-xl border border-darkborder space-y-2">
                    <div className="flex justify-between items-center text-xs font-sans">
                      <span className="text-brandblue font-semibold uppercase tracking-wider">{log.contextTag}</span>
                      <span className="text-gray-500">{log.createdAt.substring(5, 10)}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-200">
                      Thư nhắc nhở {index + 1}: <span className="font-normal text-rose-300">"{log.lessonNote}"</span>
                    </p>
                    {log.storyDetail && (
                      <div className="text-[11px] text-gray-500 bg-darkcard/50 p-2.5 rounded-lg border border-darkborder/50 font-light">
                        <span className="font-semibold text-gray-400">Chi tiết bối cảnh:</span> {log.storyDetail}
                      </div>
                    )}
                    {log.aiRecommendation && (
                      <div className="text-[11px] bg-brandviolet/10 p-2.5 rounded-lg border border-brandviolet/20 mt-2 text-brandviolet font-sans leading-relaxed">
                        <span className="font-bold">🧠 AI Khuyên:</span> {log.aiRecommendation}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Commitment Slider */}
            <div className="space-y-3 pt-3 border-t border-darkborder">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Trạng thái cam kết:</span>
                <span className={`font-semibold ${commitVal >= 95 ? 'text-emerald-400 animate-pulse font-bold' : 'text-rose-500'}`}>
                  {commitVal >= 95 ? 'ĐÃ CAM KẾT! 👍' : 'Chưa cam kết'}
                </span>
              </div>
              
              <div className="relative w-full h-12 bg-darkbg border border-darkborder rounded-full overflow-hidden flex items-center">
                <div className="absolute left-0 top-0 bottom-0 bg-rose-950/40 transition-all duration-100" style={{ width: `${commitVal}%` }}></div>
                <span className={`absolute inset-0 flex items-center justify-center text-xs font-light pointer-events-none select-none ${
                  commitVal >= 95 ? 'text-emerald-400 font-bold' : 'text-gray-500'
                }`}>
                  {commitVal >= 95 ? 'Thả tay để hoàn tất' : 'Kéo thanh trượt để cam kết'}
                </span>
                
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={commitVal} 
                  onChange={(e) => handleCommitSliderChange(parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div 
                  className="absolute w-10 h-10 bg-brandred rounded-full flex items-center justify-center shadow-lg transition-all pointer-events-none"
                  style={{ left: `calc(${commitVal}% - ${(commitVal / 100) * 40}px + 4px)` }}
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================== POPUP MODAL: AI INSTANT ADVICE (TAB 2) ================== */}
      {showInstantAdviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-darkcard border border-rose-900/30 rounded-2xl p-6 space-y-4 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-darkborder pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-brandred rounded-full animate-ping"></div>
                <h3 className="font-bold text-gray-200 text-sm">AI Cứu Trợ Tức Thời</h3>
              </div>
              <button onClick={() => setShowInstantAdviceModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex bg-darkbg border border-darkborder p-0.5 rounded-lg text-xs font-medium self-center">
              <button 
                onClick={() => setInstantAdviceTone('serious')} 
                className={`py-1.5 px-4 rounded-md transition-all ${
                  instantAdviceTone === 'serious' 
                    ? 'text-brandred bg-darkborder font-semibold' 
                    : 'text-gray-400'
                }`}
              >
                👔 Nghiêm túc
              </button>
              <button 
                onClick={() => setInstantAdviceTone('funny')} 
                className={`py-1.5 px-4 rounded-md transition-all ${
                  instantAdviceTone === 'funny' 
                    ? 'text-brandred bg-darkborder font-semibold' 
                    : 'text-gray-400'
                }`}
              >
                🎭 Cợt nhả
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-2 text-sm text-gray-300 space-y-3 leading-relaxed font-light font-sans">
              {!instantAdviceData ? (
                <div className="flex items-center space-x-2 text-brandred animate-pulse justify-center py-4">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span className="text-sm">AI cứu trợ đang phân tích uất ức tức thời...</span>
                </div>
              ) : (
                instantAdviceTone === 'serious' ? (
                  <>
                    <p className="font-semibold text-rose-400">👔 [Lời khuyên nghiêm túc]:</p>
                    <p className="text-xs leading-relaxed text-gray-200">{instantAdviceData.seriousAdvice}</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-purple-400">🎭 [Lời khuyên cợt nhả từ bạn thân]:</p>
                    <p className="text-xs italic text-purple-200 leading-relaxed">"{instantAdviceData.funnyAdvice}"</p>
                  </>
                )
              )}
            </div>

            <button 
              onClick={() => setShowInstantAdviceModal(false)}
              className="w-full py-3 bg-brandred hover:bg-rose-600 text-white font-medium rounded-xl text-sm transition-all duration-200"
            >
              Tôi đã thông não!
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification Popup */}
      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 border border-darkborder px-4 py-3 rounded-full text-xs font-light text-gray-300 shadow-2xl transition-all duration-300 flex items-center space-x-2 z-50 ${
        toast.show ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'
      }`}>
        {toast.type === 'error' ? (
          <AlertTriangle className="w-4 h-4 text-brandred" />
        ) : (
          <Info className="w-4 h-4 text-brandblue" />
        )}
        <span>{toast.message}</span>
      </div>

      {/* ================== FLOATING ACTION BUTTON (ZEN SHORTCUT) ================== */}
      <button 
        onClick={() => {
          setShowZen(true);
          setZenStep(1);
          setZenEmotion('');
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-brandviolet hover:bg-violet-600 text-white rounded-full flex items-center justify-center shadow-2xl z-40 transition-all duration-300 hover:scale-110 active:scale-95 group animate-pulse-subtle" 
        title="Vùng Chánh Niệm"
      >
        <span className="text-2xl transition-transform group-hover:rotate-12 select-none">🪷</span>
      </button>

      {/* ================== ZEN OVERLAY (CHÁNH NIỆM TỈNH THỨC) ================== */}
      {showZen && (
        <div className="fixed inset-0 z-50 bg-darkbg/95 backdrop-blur-xl flex flex-col justify-between p-6 transition-all duration-500 opacity-100">
          
          {/* Top header */}
          <div className="flex justify-between items-center w-full max-w-md mx-auto pt-4">
            <div className="flex items-center space-x-2 text-brandviolet">
              <Flower className="w-5 h-5 animate-spin-slow" />
              <span className="text-xs uppercase tracking-widest font-sans font-semibold">Vùng Chánh Niệm</span>
            </div>
            {zenStep !== 2 && (
              <button 
                onClick={() => setShowZen(false)} 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Main Central Workspace */}
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto relative">
            
            {/* STEP 1: Gọi tên cảm xúc */}
            {zenStep === 1 && (
              <div className="w-full space-y-6 text-center">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-gray-200">Bạn đang cảm thấy thế nào ngay lúc này?</h2>
                  <p className="text-xs text-gray-400 font-light">Hãy viết 1-2 từ để gọi tên cảm giác thực tại trong bạn.</p>
                </div>
                <div className="max-w-xs mx-auto">
                  <input 
                    type="text" 
                    value={zenEmotion}
                    onChange={(e) => setZenEmotion(e.target.value)}
                    placeholder="Ví dụ: Ấm ức, Bực tức, Lo sợ..." 
                    className="w-full p-4 rounded-2xl bg-darkcard border border-darkborder text-center text-lg font-semibold text-gray-200 shadow-inner focus:outline-none focus:border-brandviolet transition-colors"
                  />
                </div>
                <button 
                  onClick={startZenBreathing}
                  className="py-3 px-8 bg-brandviolet hover:bg-violet-600 text-white font-medium rounded-xl text-sm transition-all duration-200 shadow-lg"
                >
                  Bắt đầu ôm ấp cảm xúc
                </button>
              </div>
            )}

            {/* STEP 2: Hơi thở chánh niệm */}
            {zenStep === 2 && (
              <div className="w-full space-y-10 text-center">
                <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                  <div className={`absolute inset-0 bg-brandviolet/10 rounded-full blur-xl transition-all duration-[4000ms] ease-in-out ${
                    isZenInhale ? 'zen-breathing-glow-inhale' : 'zen-breathing-glow-exhale'
                  }`} />
                  
                  <div className={`w-48 h-48 bg-gradient-to-br from-brandviolet/20 to-purple-950/40 border border-brandviolet/30 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-[4000ms] ease-in-out ${
                    isZenInhale ? 'zen-breathing-inhale' : 'zen-breathing-exhale'
                  }`}>
                    <span className="text-xs text-brandviolet font-semibold tracking-wider mb-1 uppercase">
                      {isZenInhale ? 'HÍT VÀO' : 'THỞ RA'}
                    </span>
                    <span className="text-xl font-bold text-white capitalize">{zenEmotion}</span>
                  </div>
                </div>
                
                <div className="space-y-2 max-w-sm mx-auto h-20 flex flex-col justify-center">
                  <p className="text-base text-gray-200 font-light leading-relaxed">
                    {isZenInhale 
                      ? `Hít vào, tôi nhận diện sự [${zenEmotion}] đang có mặt trong tôi...`
                      : `Thở ra, tôi mỉm cười và ôm ấp lấy sự [${zenEmotion}] của tôi.`
                    }
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-sans">
                    Chu kỳ: {zenCycle}/5
                  </p>
                </div>
              </div>
            )}

            {/* STEP 3: Buông bỏ & Chuông Thiền */}
            {zenStep === 3 && (
              <div className="w-full space-y-8 text-center">
                <div className="w-20 h-20 rounded-full bg-brandviolet/10 flex items-center justify-center mx-auto border border-brandviolet/20 mb-1 animate-pulse">
                  <Bell className="w-10 h-10 text-brandviolet" />
                </div>
                <div className="space-y-3 max-w-sm mx-auto">
                  <h2 className="text-lg font-bold text-gray-200">Hãy cảm nhận tiếng ngân của chuông xoay...</h2>
                  <p className="text-xs text-gray-400 font-light leading-relaxed">
                    Cảm xúc của bạn đã được nhận biết và ôm ấp. Giờ hãy thả lỏng và nhìn nó tan biến vào hư không.
                  </p>
                  <div className="h-10 flex items-center justify-center mt-4">
                    <span className="text-xl font-bold text-brandviolet/80 uppercase tracking-widest dissolve-fade-out animate-pulse">
                      {zenEmotion}
                    </span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button 
                    onClick={handleFinishZenSession}
                    className="py-3 px-8 bg-brandviolet hover:bg-violet-600 text-white font-medium rounded-xl text-sm transition-all duration-200 shadow-lg"
                  >
                    Buông bỏ thành công
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Outro message */}
          <div className="w-full text-center pb-4 max-w-md mx-auto">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-sans font-light">Thở vào tâm tĩnh lặng • Thở ra miệng mỉm cười</p>
          </div>

        </div>
      )}

    </div>
  );
}
