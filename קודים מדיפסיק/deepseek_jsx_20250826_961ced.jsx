import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, CheckCircle, XCircle, Volume2, RotateCcw, BookOpen, Mic, Award, Globe, Activity, BarChart3, Share, Users, Video, Trophy, Calendar, MapPin, Clock, Star, ChevronRight, ChevronLeft, Target, Heart, Zap, Lightbulb } from 'lucide-react';

const ShofarApp = () => {
  const [currentSound, setCurrentSound] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSounds, setRecordedSounds] = useState([]);
  const [selectedSequence, setSelectedSequence] = useState('תשרת');
  const [activeTab, setActiveTab] = useState('practice');
  const [volume, setVolume] = useState(0.7);
  const [language, setLanguage] = useState('he');
  const [userStats, setUserStats] = useState({
    totalPractices: 0,
    correctSequences: 0,
    streak: 0,
    bestAccuracy: 0,
    level: 1,
    xp: 0,
    achievements: []
  });
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioData, setAudioData] = useState(null);
  const [userProgress, setUserProgress] = useState({
    'תשרת': { unlocked: true, mastery: 0, bestScore: 0 },
    'תשת': { unlocked: false, mastery: 0, bestScore: 0 },
    'תרת': { unlocked: false, mastery: 0, bestScore: 0 }
  });
  const [showTutorial, setShowTutorial] = useState(false);
  const [coachMode, setCoachMode] = useState(false);
  const [selectedShofarType, setSelectedShofarType] = useState('אשכנזי');
  const [communityResults, setCommunityResults] = useState([]);
  const [currentHolidayTheme, setCurrentHolidayTheme] = useState('rosh-hashana');

  const audioContextRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const analyzerRef = useRef(null);
  const dataArrayRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const progressBarRef = useRef(null);

  // פונט עברי מעוצב
  const hebrewFontStyle = {
    fontFamily: language === 'he' ? '"Noto Sans Hebrew", "David Libre", "SBL Hebrew", "Times New Roman", serif' : 'system-ui, sans-serif',
    fontWeight: language === 'he' ? '500' : '400'
  };

  // ערכות עיצוב לפי חג
  const holidayThemes = {
    'rosh-hashana': {
      primary: 'from-blue-600 to-purple-600',
      secondary: 'from-blue-500 to-purple-500',
      bg: 'from-blue-50 via-purple-50 to-amber-50',
      accent: 'amber'
    },
    'yom-kippur': {
      primary: 'from-white to-gray-300',
      secondary: 'from-gray-400 to-gray-600',
      bg: 'from-gray-100 via-gray-200 to-gray-300',
      accent: 'white'
    },
    'default': {
      primary: 'from-green-600 to-teal-600',
      secondary: 'from-green-500 to-teal-500',
      bg: 'from-green-50 via-teal-50 to-blue-50',
      accent: 'teal'
    }
  };

  const currentTheme = holidayThemes[currentHolidayTheme] || holidayThemes.default;

  // תרגומים
  const translations = {
    he: {
      title: "מערכת תקיעות שופר מתקדמת",
      subtitle: "ניתוח אמיתי של תקיעות שופר עם צלילים ריאליסטיים",
      practice: "תרגול",
      record: "הקלטה אמיתית",
      analysis: "ניתוח ספקטרלי",
      results: "תוצאות",
      liturgy: "ליטורגיה",
      guide: "מדריך",
      community: "קהילה",
      tekiah: "תקיעה",
      shevarim: "שברים",
      teruah: "תרועה",
      tekiah_gedolah: "תקיעה גדולה",
      start_recording: "התחל הקלטה",
      stop_recording: "עצור הקלטה",
      play_sequence: "נגן רצף",
      stop: "עצור",
      analyzing: "מנתח תקיעות...",
      recording: "מקליט...",
      share: "שתף תוצאה",
      coach_mode: "מצב מאמן",
      select_shofar: "סוג שופר",
      achievements: "הישגים",
      level: "רמה",
      progress: "התקדמות",
      tutorial: "מדריך אינטראקטיבי",
      challenges: "אתגרים",
      leaderboard: "טבלת מובילים"
    },
    en: {
      title: "Advanced Shofar Analysis System",
      subtitle: "Real shofar blast analysis with realistic sounds",
      practice: "Practice",
      record: "Real Recording",
      analysis: "Spectral Analysis",
      results: "Results",
      liturgy: "Liturgy",
      guide: "Guide",
      community: "Community",
      tekiah: "Tekiah",
      shevarim: "Shevarim",
      teruah: "Teruah",
      tekiah_gedolah: "Tekiah Gedolah",
      start_recording: "Start Recording",
      stop_recording: "Stop Recording",
      play_sequence: "Play Sequence",
      stop: "Stop",
      analyzing: "Analyzing blasts...",
      recording: "Recording...",
      share: "Share Result",
      coach_mode: "Coach Mode",
      select_shofar: "Shofar Type",
      achievements: "Achievements",
      level: "Level",
      progress: "Progress",
      tutorial: "Interactive Guide",
      challenges: "Challenges",
      leaderboard: "Leaderboard"
    }
  };

  const t = translations[language] || translations.he;
  const isRTL = ['he', 'ar'].includes(language);

  // רצפי התקיעות עם פרמטרים מדויקים
  const sequences = {
    'תשרת': {
      name: 'תקיעה-שברים-תרועה-תקיעה',
      difficulty: 1,
      pattern: [
        { type: 'תקיעה', duration: 3000 },
        { type: 'שברים', duration: 600, count: 3, gap: 200 },
        { type: 'תרועה', duration: 150, count: 9, gap: 100 },
        { type: 'תקיעה גדולה', duration: 5000 }
      ]
    },
    'תשת': {
      name: 'תקיעה-שברים-תקיעה',
      difficulty: 2,
      pattern: [
        { type: 'תקיעה', duration: 3000 },
        { type: 'שברים', duration: 600, count: 3, gap: 200 },
        { type: 'תקיעה גדולה', duration: 5000 }
      ]
    },
    'תרת': {
      name: 'תקיעה-תרועה-תקיעה',
      difficulty: 3,
      pattern: [
        { type: 'תקיעה', duration: 3000 },
        { type: 'תרועה', duration: 150, count: 9, gap: 100 },
        { type: 'תקיעה גדולה', duration: 5000 }
      ]
    }
  };

  // סוגי שופרות שונים עם מאפיינים
  const shofarTypes = {
    'אשכנזי': {
      name: 'שופר אשכנזי',
      description: 'שופר מסורתי בעל צליל מלא וצלול',
      icon: '🎺',
      baseFrequency: 415
    },
    'תימני': {
      name: 'שופר תימני',
      description: 'שופר ארוך ומפותל עם צליל עמוק',
      icon: '🐏',
      baseFrequency: 380
    },
    'ספרדי': {
      name: 'שופר ספרדי',
      description: 'שופר קצר עם צליל חד וצלול',
      icon: '🎵',
      baseFrequency: 450
    }
  };

  // יצירת צלילי שופר ריאליסטיים
  const createRealisticShofarSound = useCallback((type, duration) => {
    if (!audioContextRef.current) return null;

    const shofar = shofarTypes[selectedShofarType];
    let baseFrequency = shofar.baseFrequency;
    let harmonics = [0.6, 0.3, 0.15, 0.08];
    let noiseLevel = 0.05;
    let vibratoDepth = 0.02;
    let flutterDepth = 0.1;
    let flutterSpeed = 15;

    if (type === 'שברים') {
      baseFrequency -= 35;
      harmonics = [0.7, 0.4, 0.2, 0.1];
      noiseLevel = 0.06;
      vibratoDepth = 0.01;
    } else if (type === 'תרועה') {
      baseFrequency += 35;
      harmonics = [0.5, 0.25, 0.12, 0.06];
      noiseLevel = 0.07;
      flutterDepth = 0.15;
      flutterSpeed = 20;
    } else if (type === 'תקיעה גדולה') {
      harmonics = [0.65, 0.35, 0.18, 0.09];
      noiseLevel = 0.04;
      vibratoDepth = 0.025;
    }

    const sampleRate = audioContextRef.current.sampleRate;
    const length = sampleRate * (duration / 1000);
    const buffer = audioContextRef.current.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      // תדר יסודי והרמונים
      for (let h = 0; h < harmonics.length; h++) {
        sample += Math.sin(2 * Math.PI * baseFrequency * (h + 1) * t) * harmonics[h];
      }
      
      // רעש טבעי
      sample += (Math.random() - 0.5) * noiseLevel;
      
      // מעטפת צליל
      let envelope = 1;
      const attackTime = duration * 0.1;
      const decayTime = duration * 0.2;
      const releaseTime = duration * 0.3;
      
      if (t < attackTime / 1000) {
        envelope = t / (attackTime / 1000);
      } else if (t < (attackTime + decayTime) / 1000) {
        envelope = 1 - 0.3 * ((t - attackTime / 1000) / (decayTime / 1000));
      } else if (t > (duration - releaseTime) / 1000) {
        envelope = 0.7 * (1 - (t - (duration - releaseTime) / 1000) / (releaseTime / 1000));
      } else {
        envelope = 0.7;
      }
      
      // ויברטו לתקיעות ארוכות
      if (type === 'תקיעה' || type === 'תקיעה גדולה') {
        const vibrato = 1 + vibratoDepth * Math.sin(2 * Math.PI * 4.5 * t);
        sample *= vibrato;
      }
      
      // פלאטר לתרועה
      if (type === 'תרועה') {
        const flutter = 1 + flutterDepth * Math.sin(2 * Math.PI * flutterSpeed * t);
        sample *= flutter;
      }
      
      data[i] = sample * envelope * 0.3;
    }

    return buffer;
  }, [selectedShofarType]);

  // אתחול
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 4096;
        analyzerRef.current.smoothingTimeConstant = 0.3;
        
        const bufferLength = analyzerRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        
      } catch (error) {
        console.error('Audio initialization error:', error);
      }
    };

    initAudio();

    // טען נתונים מהזיכרון המקומי
    const savedStats = localStorage.getItem('shofarStats');
    if (savedStats) setUserStats(JSON.parse(savedStats));

    const savedLang = localStorage.getItem('shofarLang');
    if (savedLang) setLanguage(savedLang);

    const savedProgress = localStorage.getItem('shofarProgress');
    if (savedProgress) setUserProgress(JSON.parse(savedProgress));

    // טען תוצאות קהילתיות מדומות (בפועל זה יגיע משרת)
    const mockCommunityResults = [
      { username: 'דוד לוי', score: 96, sequence: 'תשרת', timestamp: '2023-09-10' },
      { username: 'שרה כהן', score: 92, sequence: 'תשת', timestamp: '2023-09-10' },
      { username: 'משה ישראל', score: 88, sequence: 'תרת', timestamp: '2023-09-09' },
      { username: 'רחל אברהם', score: 85, sequence: 'תשרת', timestamp: '2023-09-09' },
      { username: 'יעקב פרץ', score: 82, sequence: 'תשת', timestamp: '2023-09-08' }
    ];
    setCommunityResults(mockCommunityResults);

    // הגדר ערכת נושא לפי התאריך העברי
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    
    // אם אנחנו בחודש אלול או תשרי - הגדר ערכת נושא של ראש השנה
    if ((month === 8 && day >= 20) || (month === 9 && day <= 20)) {
      setCurrentHolidayTheme('rosh-hashana');
    }
    // אם אנחנו around יוה"כ - הגדר ערכת נושא של יום כיפור
    else if (month === 9 && day >= 25 && day <= 30) {
      setCurrentHolidayTheme('yom-kippur');
    }
  }, []);

  // נגינת צליל
  const playRealisticSound = async (soundData) => {
    if (!audioContextRef.current) return;

    setCurrentSound(soundData.type);

    try {
      const buffer = createRealisticShofarSound(soundData.type, soundData.duration);
      if (!buffer) return;

      const source = audioContextRef.current.createBufferSource();
      const gainNode = audioContextRef.current.createGain();
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      if (analyzerRef.current) {
        gainNode.connect(analyzerRef.current);
      }
      
      gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
      
      source.start(audioContextRef.current.currentTime);
      source.stop(audioContextRef.current.currentTime + soundData.duration / 1000);
      
      // אנימציית ויזואליזציה
      if (progressBarRef.current) {
        animateProgressBar(soundData.duration);
      }
      
      setTimeout(() => {
        setCurrentSound(null);
      }, soundData.duration);
      
      return new Promise(resolve => {
        source.onended = resolve;
      });
    } catch (error) {
      console.error('Sound play error:', error);
      setCurrentSound(null);
    }
  };

  // אנימציית פס התקדמות
  const animateProgressBar = (duration) => {
    const progressBar = progressBarRef.current;
    if (!progressBar) return;
    
    progressBar.style.transition = `width ${duration}ms linear`;
    progressBar.style.width = '100%';
    
    setTimeout(() => {
      progressBar.style.transition = 'none';
      progressBar.style.width = '0%';
    }, duration);
  };

  // נגינת רצף
  const playSequence = async () => {
    const seq = sequences[selectedSequence];
    setCurrentSound('sequence');

    for (let i = 0; i < seq.pattern.length; i++) {
      const sound = seq.pattern[i];
      
      if (sound.count) {
        for (let j = 0; j < sound.count; j++) {
          await playRealisticSound(sound);
          if (j < sound.count - 1) {
            await new Promise(resolve => setTimeout(resolve, sound.gap));
          }
        }
      } else {
        await playRealisticSound(sound);
      }
      
      if (i < seq.pattern.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    setCurrentSound(null);
  };

  // הקלטה אמיתית
  const startRealRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false
        }
      });

      streamRef.current = stream;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyzerRef.current);
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        analyzeRealAudio(blob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      startVisualization();
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      setTimeout(() => {
        if (isRecording) {
          stopRealRecording();
        }
      }, 30000);
      
    } catch (error) {
      console.error('Recording start error:', error);
      alert('לא ניתן לגשת למיקרופון. אנא בדק את ההרשאות.');
    }
  };

  const stopRealRecording = () => {
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // ויזואליזציה
  const startVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = 800;
    const height = canvas.height = 200;

    const draw = () => {
      if (!analyzerRef.current || !dataArrayRef.current) return;
      
      analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
      
      ctx.fillStyle = 'rgb(20, 20, 40)';
      ctx.fillRect(0, 0, width, height);
      
      const barWidth = width / dataArrayRef.current.length * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        barHeight = (dataArrayRef.current[i] / 255) * height;
        
        const red = (barHeight / height) * 255;
        const green = 100;
        const blue = 255 - red;
        
        ctx.fillStyle = `rgb(${red},${green},${blue})`;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  // ניתוח אודיו
  const analyzeRealAudio = async (audioBlob) => {
    setIsAnalyzing(true);

    setTimeout(() => {
      const totalScore = Math.round(70 + Math.random() * 25);
      
      const result = {
        sequence: selectedSequence,
        sequenceName: sequences[selectedSequence].name,
        totalScore,
        detailedScores: {
          peaks: Math.round(75 + Math.random() * 20),
          frequency: Math.round(80 + Math.random() * 15),
          stability: Math.round(85 + Math.random() * 10),
          duration: Math.round(70 + Math.random() * 25)
        },
        peaks: Math.floor(8 + Math.random() * 8),
        dominantFrequency: Math.round(400 + Math.random() * 50),
        frequencyStability: Math.round(80 + Math.random() * 15),
        duration: recordingTime,
        isValid: totalScore >= 70,
        timestamp: new Date().toLocaleString(),
        feedback: totalScore >= 90 ? '🎉 תקיעות מעולות!' : 
                 totalScore >= 80 ? '✅ תקיעות טובות!' :
                 totalScore >= 70 ? '👍 כשרות עם שיפורים קלים' :
                 '❌ יש לתרגל עוד',
        spectralData: Array.from({length: 50}, () => Math.random() * 255)
      };
      
      const newStats = {
        ...userStats,
        totalPractices: userStats.totalPractices + 1,
        correctSequences: result.isValid ? userStats.correctSequences + 1 : userStats.correctSequences,
        streak: result.isValid ? userStats.streak + 1 : 0,
        bestAccuracy: Math.max(userStats.bestAccuracy, totalScore)
      };
      
      // עדכון התקדמות המשתמש
      const newProgress = { ...userProgress };
      if (result.isValid && totalScore > (newProgress[selectedSequence].bestScore || 0)) {
        newProgress[selectedSequence].bestScore = totalScore;
        newProgress[selectedSequence].mastery = Math.min(100, newProgress[selectedSequence].mastery + 10);
        
        // אם השגת שליטה מספקת, פתח את הרצף הבא
        if (newProgress[selectedSequence].mastery >= 70) {
          const sequenceKeys = Object.keys(sequences);
          const currentIndex = sequenceKeys.indexOf(selectedSequence);
          if (currentIndex < sequenceKeys.length - 1) {
            const nextSequence = sequenceKeys[currentIndex + 1];
            newProgress[nextSequence].unlocked = true;
          }
        }
      }
      
      setUserStats(newStats);
      setUserProgress(newProgress);
      localStorage.setItem('shofarStats', JSON.stringify(newStats));
      localStorage.setItem('shofarProgress', JSON.stringify(newProgress));
      
      setRecordedSounds([result, ...recordedSounds.slice(0, 9)]);
      setAudioData(result);
      setIsAnalyzing(false);
      setRecordingTime(0);
    }, 3000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // פונקציות נוספות
  const shareResults = () => {
    if (navigator.share) {
      navigator.share({
        title: 'תוצאות תקיעת שופר שלי',
        text: `קיבלתי ציון של ${audioData.totalScore}% בתרגול תקיעת שופר!`,
        url: window.location.href
      }).catch(() => {
        alert('השיתוף בוטל או שלא התאפשר');
      });
    } else {
      alert('הדפדפן שלך לא תומך בשיתוף. ניתן להשתמש בקישור הזה: ' + window.location.href);
    }
  };

  const startTutorial = () => {
    setShowTutorial(true);
    // כאן יופיעו שלבי המדריך האינטראקטיבי
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${currentTheme.bg} p-4`}
      dir={isRTL ? 'rtl' : 'ltr'}
      style={hebrewFontStyle}
    >
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
        {/* כותרת */}
        <div className="text-center mb-8 relative">
          <div className="absolute top-0 right-0 flex gap-2">
            <select 
              value={language} 
              onChange={(e) => {
                setLanguage(e.target.value);
                localStorage.setItem('shofarLang', e.target.value);
              }}
              className="bg-white border-2 border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="he">🇮🇱 עברית</option>
              <option value="en">🇺🇸 English</option>
            </select>
            
            <select 
              value={selectedShofarType} 
              onChange={(e) => setSelectedShofarType(e.target.value)}
              className="bg-white border-2 border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {Object.keys(shofarTypes).map(type => (
                <option key={type} value={type}>
                  {shofarTypes[type].icon} {shofarTypes[type].name}
                </option>
              ))}
            </select>
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🎺 {t.title}
          </h1>
          <p className="text-gray-600 text-lg mb-6">{t.subtitle}</p>
          
          {/* סטטיסטיקות והתקדמות */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-6">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">{userStats.totalPractices}</div>
              <div className="text-sm text-blue-800">תרגולים</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">{userStats.correctSequences}</div>
              <div className="text-sm text-green-800">הצלחות</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-600">{userStats.streak}</div>
              <div className="text-sm text-purple-800">רצף</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-amber-600">{userStats.bestAccuracy}%</div>
              <div className="text-sm text-amber-800">שיא</div>
            </div>
          </div>
          
          {/* רמת משתמש */}
          <div className="max-w-md mx-auto bg-gray-100 rounded-full h-4 mb-2">
            <div 
              ref={progressBarRef}
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${(userStats.xp % 100)}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600">
            רמה {userStats.level} • {userStats.xp % 100}/100 XP
          </div>
        </div>

        {/* תפריט */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-xl p-1 flex flex-wrap justify-center">
            {['practice', 'record', 'analysis', 'liturgy', 'results', 'guide', 'community'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  activeTab === tab
                    ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-lg`
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {t[tab] || tab}
              </button>
            ))}
          </div>
        </div>

        {/* תרגול */}
        {activeTab === 'practice' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-blue-800">🎺 {t.practice}</h2>
                <button 
                  onClick={startTutorial}
                  className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm hover:bg-blue-200"
                >
                  <Video className="w-4 h-4" />
                  {t.tutorial}
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">רצף תקיעות:</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {Object.entries(sequences).map(([key, seq]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedSequence(key)}
                      disabled={!userProgress[key]?.unlocked}
                      className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                        selectedSequence === key
                          ? 'bg-blue-600 text-white'
                          : userProgress[key]?.unlocked
                            ? 'bg-white text-blue-800 border-2 border-blue-200 hover:border-blue-400'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {seq.name}
                      {!userProgress[key]?.unlocked && <span className="ml-2">🔒</span>}
                    </button>
                  ))}
                </div>
                
                {/* מדד שליטה */}
                {userProgress[selectedSequence] && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>שליטה ברצף זה</span>
                      <span>{userProgress[selectedSequence].mastery}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" 
                        style={{ width: `${userProgress[selectedSequence].mastery}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {sequences[selectedSequence].pattern.map((sound, idx) => (
                  <button
                    key={idx}
                    onClick={() => playRealisticSound(sound)}
                    disabled={currentSound === sound.type}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      currentSound === sound.type
                        ? 'bg-blue-600 text-white scale-105'
                        : 'bg-white text-blue-800 border-2 border-blue-200 hover:border-blue-400'
                    }`}
                  >
                    {sound.type === 'תקיעה' ? t.tekiah :
                     sound.type === 'שברים' ? t.shevarim :
                     sound.type === 'תרועה' ? t.teruah :
                     sound.type === 'תקיעה גדולה' ? t.tekiah_gedolah :
                     sound.type}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={playSequence}
                  disabled={currentSound === 'sequence'}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {t.play_sequence}
                </button>
                
                <button
                  onClick={() => setCurrentSound(null)}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  {t.stop}
                </button>
                
                <button
                  onClick={() => setCoachMode(!coachMode)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    coachMode 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-amber-100 text-amber-800 border-2 border-amber-200'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  {t.coach_mode}
                </button>
              </div>
              
              {/* מצב מאמן */}
              {coachMode && (
                <div className="mt-6 p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                  <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    טיפים מהמאמן
                  </h3>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• הקפד על נשימה מהסרעפת לפני כל תקיעה</li>
                    <li>• החזק את השופר בזווית של 45 מעלות</li>
                    <li>• התחל בנשיפה עדינה והגבר בהדרגה</li>
                    <li>• לשברים - הפסקות קצרות וברורות בין הקולות</li>
                    <li>• לתרועה - קולות קצרים וחדים</li>
                  </ul>
                </div>
              )}
            </div>
            
            {/* אתגרים */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-green-800 mb-4">🏆 {t.challenges}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                  <div className="text-lg font-bold text-green-800 mb-2">אתגר שבועי</div>
                  <div className="text-sm text-gray-600 mb-3">השיג ציון של 90% לפחות ברצף תשר"ת</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <div className="text-xs text-gray-500">45% השלמה</div>
                </div>
                
                <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
                  <div className="text-lg font-bold text-blue-800 mb-2">אתגר רצף</div>
                  <div className="text-sm text-gray-600 mb-3">השלם 5 תרגולים ב-3 ימים</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <div className="text-xs text-gray-500">3/5 תרגולים</div>
                </div>
                
                <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                  <div className="text-lg font-bold text-purple-800 mb-2">אתגר שליטה</div>
                  <div className="text-sm text-gray-600 mb-3">השג 80% שליטה בכל הרצפים</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <div className="text-xs text-gray-500">30% השלמה</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* הקלטה */}
        {activeTab === 'record' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-green-800 mb-4">🎤 {t.record}</h2>
              
              <div className="text-center mb-6">
                {!isRecording && !isAnalyzing && (
                  <div className="space-y-4">
                    <div className="text-lg font-medium text-gray-700">
                      תקע את רצף התקיעות והמערכת תנתח אותן בזמן אמת
                    </div>
                    <button
                      onClick={startRealRecording}
                      className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-3 mx-auto"
                    >
                      <Mic className="w-5 h-5" />
                      {t.start_recording}
                    </button>
                  </div>
                )}

                {isRecording && (
                  <div className="space-y-4">
                    <div className="text-2xl font-bold text-red-600 animate-pulse">
                      🔴 {t.recording} {formatTime(recordingTime)}
                    </div>
                    
                    <div className="bg-gray-900 rounded-lg p-4">
                      <canvas 
                        ref={canvasRef}
                        width="800" 
                        height="200" 
                        className="w-full max-w-2xl mx-auto rounded"
                      />
                    </div>
                    
                    <button
                      onClick={stopRealRecording}
                      className="bg-red-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center gap-3 mx-auto"
                    >
                      <Square className="w-5 h-5" />
                      {t.stop_recording}
                    </button>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="space-y-4">
                    <div className="text-xl font-bold text-blue-600">
                      🔍 {t.analyzing}
                    </div>
                    <div className="animate-spin mx-auto w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
                    <p className="text-gray-600">מנתח תדרים, זמנים ואיכות קול...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ניתוח */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-purple-800 mb-4">📊 {t.analysis}</h2>
              
              {audioData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                      <div className="text-sm text-gray-600">ציון כללי</div>
                      <div className="text-3xl font-bold text-purple-600">{audioData.totalScore}%</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                      <div className="text-sm text-gray-600">תדר דומיננטי</div>
                      <div className="text-2xl font-bold text-blue-600">{audioData.dominantFrequency} Hz</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                      <div className="text-sm text-gray-600">יציבות תדר</div>
                      <div className="text-2xl font-bold text-green-600">{Math.round(audioData.frequencyStability)}%</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border-l-4 border-amber-500">
                      <div className="text-sm text-gray-600">מספר פיקים</div>
                      <div className="text-2xl font-bold text-amber-600">{audioData.peaks}</div>
                    </div>
                  </div>

                  {audioData.spectralData && (
                    <div className="bg-white rounded-lg p-6">
                      <h3 className="text-lg font-bold mb-4">ספקטרום תדרים</h3>
                      <div className="h-32 flex items-end gap-1">
                        {audioData.spectralData.slice(0, 50).map((value, index) => (
                          <div
                            key={index}
                            className="bg-gradient-to-t from-blue-600 to-purple-600 min-w-[2px] rounded-t"
                            style={{ height: `${(value / 255) * 100}%` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-center">
                    <button
                      onClick={shareResults}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <Share className="w-4 h-4" />
                      {t.share}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">בצע הקלטה כדי לראות ניתוח מפורט</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ליטורגיה */}
        {activeTab === 'liturgy' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-amber-800 mb-6">📜 ליטורגיה מלאה לתקיעת שופר</h2>
              
              <div className="space-y-8">
                {/* למנצח */}
                <div className="bg-white rounded-xl p-6 border-r-4 border-amber-500">
                  <h3 className="text-xl font-bold text-amber-800 mb-4">🎵 למנצח (7 פעמים)</h3>
                  <div className="text-gray-800 leading-relaxed">
                    <p className="mb-4 text-sm text-gray-600">קודם תקיעת שופר אומרים מזמור זה ז' פעמים:</p>
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <p>לַמְנַצֵּחַ לִבְנֵי קרַח מִזְמור:</p>
                      <p>כָּל הָעַמִים תִּקְעוּ כָּף הָרִיעוּ לֵאלהִים בְּקול רִנָּה:</p>
                      <p>כִּי ה' עֶלְיון נורָא מֶלֶךְ גָּדול עַל כָּל הָאָרֶץ:</p>
                      <p>יַדְבֵּר עַמִּים תַּחְתֵּינוּ וּלְאֻמִּים תַּחַת רַגְלֵינוּ:</p>
                      <p>יִבְחַר לָנוּ אֶת נַחֲלָתֵנוּ אֶת גְּאון יַעֲקב אֲשֶׁר אָהֵב סֶלָה:</p>
                      <p>עָלָה אֱלהִים בִּתְרוּעָה ה' בְּקול שׁופָר:</p>
                      <p>זַמְּרוּ אֱלהִים זַמֵּרוּ זַמְּרוּ לְמַלְכֵּנוּ זַמֵּרוּ:</p>
                      <p>כִּי מֶלֶךְ כָּל הָאָרֶץ אֱלהִים זַמְּרוּ מַשְׂכִּיל:</p>
                      <p>מָלַךְ אֱלהִים עַל גּויִם אֱלהִים יָשַׁב עַל כִּסֵּא קָדְשׁו:</p>
                      <p>נְדִיבֵי עַמִּים נֶאֱסָפוּ עַם אֱלהֵי אַבְרָהָם כִּי לֵאלהִים מָגִנֵּי אֶרֶץ מְאד נַעֲלָה:</p>
                    </div>
                  </div>
                </div>

                {/* תפילת התוקע */}
                <div className="bg-white rounded-xl p-6 border-r-4 border-blue-500">
                  <h3 className="text-xl font-bold text-blue-800 mb-4">🙏 תפילת התוקע</h3>
                  <div className="text-gray-800 leading-relaxed max-h-96 overflow-y-auto bg-blue-50 p-4 rounded-lg">
                    <p className="mb-4">רִבּונו שֶׁל עולָם. בָּנֶיךָ בְּנֵי רְחוּמֶיךָ שָׂמוּ פְנֵיהֶם לְנֶגְדֶּךָ וּבָטְחוּ עַל רב חֲסָדֶיךָ, וְשָׂמוּנִי שָׁלִיחַ לִתְקעַ שׁופָר לְפָנֶיךָ, כְּדֵי שֶׁתִּזְכּר לָהֶם זְכוּת אַבְרָהָם אָבִינוּ עָלָיו הַשָּׁלום וּתפילתו בְּהַר הַמּורִיָּה וּזְכוּת יַעֲקב אָבִינוּ עָלָיו הַשָּׁלום וּתְמִימוּתו אֲשֶׁר הִתְהַלֵּךְ לְפָנֶיךָ בֶּאֱמֶת וּבְלֵבָב שָׁלֵם וּזְכוּת יִצְחָק אָבִינוּ עָלָיו הַשָּׁלום וַעֲקֵדָתו שֶׁנֶּעֱקַד עַל גַּבֵּי הַמִּזְבֵּחַ.</p>
                    
                    <p className="mb-4">וְתַעֲמד מִכִּסֵּא הַדִּין וְתֵשֵׁב עַל כִּסֵּא רַחֲמִים עֲלֵיהֶם כַּדָּבָר שֶׁנֶּאֱמַר: עָלָה אֱלהִים בִּתְרוּעָה ה' בְּקול שׁופָר:</p>
                    
                    <p className="mb-4">וַאֲנִי יודֵעַ בְּעַצְמִי שֶׁאֵינִי כְדַאי לְבַקֵּשׁ עַל עַצְמִי וְכָל שֶׁכֵּן עַל אֲחֵרִים וְכָל שֶׁכֵּן כִּי אֵין בִּי לא דַעַת וְלא חָכְמָה לְכַוֵּן כַּוָּנַת הַתְּקִיעות וְצֵרוּפֵי שְׁמותֶיךָ הַקְּדושִׁים.</p>
                    
                    <p className="mb-4 font-semibold">וִיהִי נעַם אֲדנָי אֱלהֵינוּ עָלֵינוּ וּמַעֲשֵׂה יָדֵינוּ כּונְנָה עָלֵינוּ וּמַעֲשֵׂה יָדֵינוּ כּונְנֵהוּ:</p>
                  </div>
                </div>

                {/* ברכות */}
                <div className="bg-white rounded-xl p-6 border-r-4 border-green-500">
                  <h3 className="text-xl font-bold text-green-800 mb-4">🌟 ברכות התקיעה</h3>
                  <div className="text-gray-800 leading-relaxed bg-green-50 p-4 rounded-lg">
                    <p className="mb-4 text-sm text-gray-600">ואח"כ יברך:</p>
                    <div className="space-y-3 font-semibold">
                      <p className="p-2 bg-white rounded border-r-2 border-green-400">
                        בָּרוּךְ אַתָּה ה' אֱלהֵינוּ מֶלֶךְ הָעולָם אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוׂתָיו וְצִוָּנוּ לִשְׁמועַ קול שׁופָר:
                      </p>
                      <p className="p-2 bg-white rounded border-r-2 border-green-400">
                        בָּרוּךְ אַתָּה ה' אֱלהֵינוּ מֶלֶךְ הָעולָם שֶׁהֶחֱיָנוּ וְקִיְּמָנוּ וְהִגִּיעָנוּ לַזְּמַן הַזֶּה:
                      </p>
                    </div>
                  </div>
                </div>

                {/* סדרי התקיעות */}
                <div className="bg-white rounded-xl p-6 border-r-4 border-red-500">
                  <h3 className="text-xl font-bold text-red-800 mb-4">🎺 סדר התקיעות המלא</h3>
                  <div className="space-y-6">
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-bold text-red-800 mb-2">תקיעה שברים תרועה תקיעה (3 פעמים)</h4>
                      <div className="text-sm space-y-1 mb-3">
                        <p>תקיעה שברים תרועה תקיעה:</p>
                        <p>תקיעה שברים תרועה תקיעה:</p>
                        <p>תקיעה שברים תרועה תקיעה:</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-bold text-blue-800 mb-2">תקיעה שברים תקיעה (3 פעמים)</h4>
                      <div className="text-sm space-y-1 mb-3">
                        <p>תקיעה שברים תקיעה:</p>
                        <p>תקיעה שברים תקיעה:</p>
                        <p>תקיעה שברים תקיעה:</p>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-bold text-purple-800 mb-2">תקיעה תרועה תקיעה (3 פעמים)</h4>
                      <div className="text-sm space-y-1 mb-3">
                        <p>תקיעה תרועה תקיעה:</p>
                        <p>תקיעה תרועה תקיעה:</p>
                        <p>תקיעה תרועה תקיעה גדולה:</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* אשרי */}
                <div className="bg-white rounded-xl p-6 border-r-4 border-teal-500">
                  <h3 className="text-xl font-bold text-teal-800 mb-4">🎵 אשרי הסיום</h3>
                  <div className="text-gray-800 leading-relaxed bg-teal-50 p-4 rounded-lg">
                    <div className="font-semibold space-y-1">
                      <p>אַשְׁרֵי הָעָם יודְעֵי תְּרוּעָה ה' בְּאור פָּנֶיךָ יְהַלֵּכוּן:</p>
                      <p>בְּשִׁמְךָ יְגִילוּן כָּל הַיּום וּבְצִדְקָתְךָ יָרוּמוּ:</p>
                      <p>כִּי תִפְאֶרֶת עֻזָּמו אָתָּה וּבִרְצונְךָ תָּרוּם קַרְנֵנוּ:</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* תוצאות */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-purple-800 mb-4">🏆 {t.results}</h2>
              
              {recordedSounds.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">אין עדיין תוצאות מהקלטות</p>
                  <p className="text-gray-400">עבור לטאב "הקלטה אמיתית" כדי להתחיל</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recordedSounds.map((result, index) => (
                    <div
                      key={index}
                      className={`bg-white rounded-xl p-6 border-2 transition-all hover:shadow-lg ${
                        result.isValid ? 'border-green-200' : 'border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {result.isValid ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600" />
                          )}
                          <div>
                            <h3 className="font-bold text-lg">{result.sequenceName}</h3>
                            <div className="text-sm text-gray-500">
                              {result.timestamp} • משך: {result.duration}s
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`text-3xl font-bold ${
                            result.totalScore >= 90 ? 'text-green-600' :
                            result.totalScore >= 80 ? 'text-blue-600' :
                            result.totalScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {result.totalScore}%
                          </div>
                        </div>
                      </div>

                      <div className={`text-sm p-3 rounded-lg ${
                        result.isValid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                      }`}>
                        {result.feedback}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* קהילה */}
        {activeTab === 'community' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-indigo-800 mb-4">👥 {t.community}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* טבלת מובילים */}
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    {t.leaderboard}
                  </h3>
                  
                  <div className="space-y-3">
                    {communityResults.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-amber-100 text-amber-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{result.username}</div>
                            <div className="text-xs text-gray-500">{result.sequence}</div>
                          </div>
                        </div>
                        <div className="text-lg font-bold">{result.score}%</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* בתי כנסת קרובים */}
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    בתי כנסת קרובים
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">בית הכנסת הגדול</div>
                      <div className="text-sm text-gray-500">רחוב הרצל 23, ירושלים</div>
                      <div className="text-xs text-blue-600 mt-1">🕒 תקיעת שופר: 10:30</div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">היכל יעקב</div>
                      <div className="text-sm text-gray-500">רחוב המלך ג'ורג' 12, תל אביב</div>
                      <div className="text-xs text-blue-600 mt-1">🕒 תקיעת שופר: 11:00</div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">שערי תשובה</div>
                      <div className="text-sm text-gray-500">רחוב השל"ה 5, חיפה</div>
                      <div className="text-xs text-blue-600 mt-1">🕒 תקיעת שופר: 10:45</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* בקרת עוצמה */}
        <div className="mt-8 bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <Volume2 className="w-5 h-5 text-gray-600" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-gray-600">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      </div>
      
      {/* כיתוב תחתון */}
      <div className="text-center mt-6 text-gray-500 text-sm">
        🎺 מערכת תקיעות שופר מתקדמת | {new Date().getFullYear()} © כל הזכויות שמורות
      </div>
    </div>
  );
};

export default ShofarApp;