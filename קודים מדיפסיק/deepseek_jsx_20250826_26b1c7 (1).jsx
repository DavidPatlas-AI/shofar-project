import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, CheckCircle, XCircle, Volume2, RotateCcw, BookOpen, Mic, Award, Globe, Activity, BarChart3 } from 'lucide-react';

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
    bestAccuracy: 0
  });
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioData, setAudioData] = useState(null);
  const [audioBuffers, setAudioBuffers] = useState({});

  const audioContextRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const analyzerRef = useRef(null);
  const dataArrayRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // פונט עברי מעוצב
  const hebrewFontStyle = {
    fontFamily: language === 'he' ? '"Noto Sans Hebrew", "David Libre", "SBL Hebrew", "Times New Roman", serif' : 'system-ui, sans-serif',
    fontWeight: language === 'he' ? '500' : '400'
  };

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
      tekiah: "תקיעה",
      shevarim: "שברים",
      teruah: "תרועה",
      tekiah_gedolah: "תקיעה גדולה",
      start_recording: "התחל הקלטה",
      stop_recording: "עצור הקלטה",
      play_sequence: "נגן רצף",
      stop: "עצור",
      analyzing: "מנתח תקיעות...",
      recording: "מקליט..."
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
      tekiah: "Tekiah",
      shevarim: "Shevarim",
      teruah: "Teruah",
      tekiah_gedolah: "Tekiah Gedolah",
      start_recording: "Start Recording",
      stop_recording: "Stop Recording",
      play_sequence: "Play Sequence",
      stop: "Stop",
      analyzing: "Analyzing blasts...",
      recording: "Recording..."
    }
  };

  const t = translations[language] || translations.he;
  const isRTL = ['he', 'ar'].includes(language);

  // רצפי התקיעות עם פרמטרים מדויקים
  const sequences = {
    'תשרת': {
      name: 'תקיעה-שברים-תרועה-תקיעה',
      pattern: [
        { type: 'תקיעה', duration: 3000 },
        { type: 'שברים', duration: 600, count: 3, gap: 200 },
        { type: 'תרועה', duration: 150, count: 9, gap: 100 },
        { type: 'תקיעה גדולה', duration: 5000 }
      ]
    },
    'תשת': {
      name: 'תקיעה-שברים-תקיעה',
      pattern: [
        { type: 'תקיעה', duration: 3000 },
        { type: 'שברים', duration: 600, count: 3, gap: 200 },
        { type: 'תקיעה גדולה', duration: 5000 }
      ]
    },
    'תרת': {
      name: 'תקיעה-תרועה-תקיעה',
      pattern: [
        { type: 'תקיעה', duration: 3000 },
        { type: 'תרועה', duration: 150, count: 9, gap: 100 },
        { type: 'תקיעה גדולה', duration: 5000 }
      ]
    }
  };

  // טעינת דגימות אודיו אמיתיות של שופר
  useEffect(() => {
    const loadAudioSamples = async () => {
      try {
        // נתיבים לדגימות האודיו (צריך להחליף בנתיבים האמיתיים שלך)
        const audioFiles = {
          'תקיעה': '/sounds/tekiah-real.wav',
          'שברים': '/sounds/shevarim-real.wav',
          'תרועה': '/sounds/teruah-real.wav',
          'תקיעה גדולה': '/sounds/tekiah-gedolah-real.wav'
        };

        const context = audioContextRef.current;
        if (!context) return;

        const buffers = {};
        
        for (const [type, url] of Object.entries(audioFiles)) {
          try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await context.decodeAudioData(arrayBuffer);
            buffers[type] = audioBuffer;
          } catch (error) {
            console.error(`Error loading ${type} sound:`, error);
          }
        }
        
        setAudioBuffers(buffers);
      } catch (error) {
        console.error('Error loading audio samples:', error);
      }
    };

    if (audioContextRef.current) {
      loadAudioSamples();
    }
  }, []);

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

    const saved = localStorage.getItem('shofarStats');
    if (saved) setUserStats(JSON.parse(saved));

    const savedLang = localStorage.getItem('shofarLang');
    if (savedLang) setLanguage(savedLang);
  }, []);

  // נגינת צליל ריאליסטי משופר
  const playRealisticSound = async (soundData) => {
    if (!audioContextRef.current) return;

    setCurrentSound(soundData.type);

    try {
      // בדיקה אם יש דגימה מוקלטת
      if (audioBuffers[soundData.type]) {
        const source = audioContextRef.current.createBufferSource();
        const gainNode = audioContextRef.current.createGain();
        
        source.buffer = audioBuffers[soundData.type];
        source.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        
        if (analyzerRef.current) {
          gainNode.connect(analyzerRef.current);
        }
        
        gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
        
        source.start(audioContextRef.current.currentTime);
        
        setTimeout(() => {
          setCurrentSound(null);
        }, soundData.duration);
        
        return new Promise(resolve => {
          source.onended = resolve;
        });
      } else {
        // נגן צליל סינתטי כגיבוי
        console.warn('No pre-recorded sound available, using synthetic sound');
        
        const sampleRate = audioContextRef.current.sampleRate;
        const length = sampleRate * (soundData.duration / 1000);
        const buffer = audioContextRef.current.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        // פרמטרים ספציפיים לסוגי התקיעות
        let baseFrequency = 415;
        let harmonics = [0.6, 0.3, 0.15, 0.08];
        let noiseLevel = 0.05;
        let vibratoDepth = 0.02;
        let flutterDepth = 0.1;
        let flutterSpeed = 15;

        if (soundData.type === 'שברים') {
          baseFrequency = 380;
          harmonics = [0.7, 0.4, 0.2, 0.1];
          noiseLevel = 0.06;
          vibratoDepth = 0.01;
        } else if (soundData.type === 'תרועה') {
          baseFrequency = 450;
          harmonics = [0.5, 0.25, 0.12, 0.06];
          noiseLevel = 0.07;
          flutterDepth = 0.15;
          flutterSpeed = 20;
        } else if (soundData.type === 'תקיעה גדולה') {
          baseFrequency = 415;
          harmonics = [0.65, 0.35, 0.18, 0.09];
          noiseLevel = 0.04;
          vibratoDepth = 0.025;
        }

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
          const attackTime = soundData.duration * 0.1;
          const decayTime = soundData.duration * 0.2;
          const releaseTime = soundData.duration * 0.3;
          
          if (t < attackTime / 1000) {
            envelope = t / (attackTime / 1000);
          } else if (t < (attackTime + decayTime) / 1000) {
            envelope = 1 - 0.3 * ((t - attackTime / 1000) / (decayTime / 1000));
          } else if (t > (soundData.duration - releaseTime) / 1000) {
            envelope = 0.7 * (1 - (t - (soundData.duration - releaseTime) / 1000) / (releaseTime / 1000));
          } else {
            envelope = 0.7;
          }
          
          // ויברטו לתקיעות ארוכות
          if (soundData.type === 'תקיעה' || soundData.type === 'תקיעה גדולה') {
            const vibrato = 1 + vibratoDepth * Math.sin(2 * Math.PI * 4.5 * t);
            sample *= vibrato;
          }
          
          // פלאטר לתרועה
          if (soundData.type === 'תרועה') {
            const flutter = 1 + flutterDepth * Math.sin(2 * Math.PI * flutterSpeed * t);
            sample *= flutter;
          }
          
          data[i] = sample * envelope * 0.3;
        }

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
        
        setTimeout(() => {
          setCurrentSound(null);
        }, soundData.duration);
        
        return new Promise(resolve => {
          source.onended = resolve;
        });
      }
    } catch (error) {
      console.error('Sound play error:', error);
      setCurrentSound(null);
    }
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

  // שאר הפונקציות (הקלטה, ניתוח וכו') נשארות ללא שינוי
  // ... (הקוד המקורי שלך להקלטה וניתוח)

  // פונקציות נוספות שנשארות ללא שינוי
  const startRealRecording = async () => {
    // ... (קוד ההקלטה המקורי)
  };

  const stopRealRecording = () => {
    // ... (קוד ההקלטה המקורי)
  };

  const startVisualization = () => {
    // ... (קוד הוויזואליזציה המקורי)
  };

  const analyzeRealAudio = async (audioBlob) => {
    // ... (קוד הניתוח המקורי)
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-amber-50 p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={hebrewFontStyle}
    >
      {/* ... (JSX המקורי שלך) */}
    </div>
  );
};

export default ShofarApp;