import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, CheckCircle, XCircle, Volume2, RotateCcw, BookOpen, Mic, Award, Globe, Activity, Waveform } from 'lucide-react';

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
  const [frequencyData, setFrequencyData] = useState([]);
  
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

  // צלילי שופר אמיתיים - סימולציה של קבצי אודיו
  const createRealisticShofarSound = (type, duration, frequency) => {
    const sampleRate = audioContextRef.current.sampleRate;
    const length = sampleRate * (duration / 1000);
    const buffer = audioContextRef.current.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    // יצירת צליל שופר ריאליסטי עם הרמונים וטקסטורה
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      // תדר יסודי
      sample += Math.sin(2 * Math.PI * frequency * t) * 0.6;
      
      // הרמונים לריאליזם
      sample += Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3;
      sample += Math.sin(2 * Math.PI * frequency * 3 * t) * 0.15;
      sample += Math.sin(2 * Math.PI * frequency * 4 * t) * 0.08;
      
      // רעש טבעי לטקסטורה
      sample += (Math.random() - 0.5) * 0.05;
      
      // עיצוב אמפליטודה (ADSR)
      let envelope = 1;
      const attackTime = duration * 0.1;
      const decayTime = duration * 0.2;
      const releaseTime = duration * 0.3;
      
      if (t < attackTime / 1000) {
        // Attack
        envelope = t / (attackTime / 1000);
      } else if (t < (attackTime + decayTime) / 1000) {
        // Decay
        envelope = 1 - 0.3 * ((t - attackTime / 1000) / (decayTime / 1000));
      } else if (t > (duration - releaseTime) / 1000) {
        // Release
        envelope = 0.7 * (1 - (t - (duration - releaseTime) / 1000) / (releaseTime / 1000));
      } else {
        // Sustain
        envelope = 0.7;
      }
      
      // רטט טבעי לשופר
      if (type === 'תקיעה' || type === 'תקיעה גדולה') {
        const vibrato = 1 + 0.02 * Math.sin(2 * Math.PI * 4.5 * t);
        sample *= vibrato;
      }
      
      // טקסטורה מיוחדת לרועים
      if (type === 'רועים') {
        const flutter = 1 + 0.1 * Math.sin(2 * Math.PI * 15 * t);
        sample *= flutter;
      }
      
      data[i] = sample * envelope * 0.3;
    }
    
    return buffer;
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
      guide: "מדריך",
      tekiah: "תקיעה",
      shevarim: "שברים",
      teruah: "רועים",
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
      name: 'תקיעה-שברים-רועים-תקיעה',
      pattern: [
        { type: 'תקיעה', duration: 3000, frequency: 415 },
        { type: 'שברים', duration: 600, frequency: 380, count: 3, gap: 200 },
        { type: 'רועים', duration: 150, frequency: 450, count: 9, gap: 100 },
        { type: 'תקיעה גדולה', duration: 5000, frequency: 415 }
      ]
    },
    'תשת': {
      name: 'תקיעה-שברים-תקיעה',
      pattern: [
        { type: 'תקיעה', duration: 3000, frequency: 415 },
        { type: 'שברים', duration: 600, frequency: 380, count: 3, gap: 200 },
        { type: 'תקיעה גדולה', duration: 5000, frequency: 415 }
      ]
    },
    'תרת': {
      name: 'תקיעה-רועים-תקיעה',
      pattern: [
        { type: 'תקיעה', duration: 3000, frequency: 415 },
        { type: 'רועים', duration: 150, frequency: 450, count: 9, gap: 100 },
        { type: 'תקיעה גדולה', duration: 5000, frequency: 415 }
      ]
    }
  };

  // אתחול מערכת אודיו מתקדמת
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        // יצירת analyzer לניתוח תדרים
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

  // נגינת צליל שופר ריאליסטי
  const playRealisticSound = async (soundData) => {
    if (!audioContextRef.current) return;

    try {
      const buffer = createRealisticShofarSound(soundData.type, soundData.duration, soundData.frequency);
      const source = audioContextRef.current.createBufferSource();
      const gainNode = audioContextRef.current.createGain();
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // חיבור ל-analyzer
      if (analyzerRef.current) {
        gainNode.connect(analyzerRef.current);
      }
      
      gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
      
      source.start(audioContextRef.current.currentTime);
      source.stop(audioContextRef.current.currentTime + soundData.duration / 1000);
      
      return new Promise(resolve => {
        source.onended = resolve;
      });
    } catch (error) {
      console.error('Sound play error:', error);
    }
  };

  // נגינת רצף מלא
  const playSequence = async () => {
    const seq = sequences[selectedSequence];
    setCurrentSound('sequence');
    
    for (let i = 0; i < seq.pattern.length; i++) {
      const sound = seq.pattern[i];
      
      if (sound.count) {
        // שברים או רועים
        for (let j = 0; j < sound.count; j++) {
          await playRealisticSound(sound);
          if (j < sound.count - 1) {
            await new Promise(resolve => setTimeout(resolve, sound.gap));
          }
        }
      } else {
        // תקיעה יחידה
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
      
      // התחלת ויזואליזציה בזמן אמת
      startVisualization();
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // עצירה אוטומטית אחרי 30 שניות
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

  // ויזואליזציה בזמן אמת
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

  // ניתוח אמיתי של אודיו
  const analyzeRealAudio = async (audioBlob) => {
    setIsAnalyzing(true);
    
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      // ניתוח מתקדם של האודיו
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      
      // זיהוי פיקים (תקיעות)
      const peaks = detectPeaks(channelData, sampleRate);
      
      // ניתוח תדרים
      const frequencies = analyzeFrequencies(channelData, sampleRate);
      
      // חישוב ציון
      const analysis = calculateScore(peaks, frequencies, recordingTime);
      
      const result = {
        sequence: selectedSequence,
        sequenceName: sequences[selectedSequence].name,
        totalScore: analysis.totalScore,
        detailedScores: analysis.detailed,
        peaks: peaks.length,
        dominantFrequency: frequencies.dominant,
        frequencyStability: frequencies.stability,
        duration: recordingTime,
        isValid: analysis.totalScore >= 70,
        timestamp: new Date().toLocaleString(),
        feedback: generateFeedback(analysis),
        spectralData: frequencies.spectrum
      };
      
      const newStats = {
        ...userStats,
        totalPractices: userStats.totalPractices + 1,
        correctSequences: result.isValid ? userStats.correctSequences + 1 : userStats.correctSequences,
        streak: result.isValid ? userStats.streak + 1 : 0,
        bestAccuracy: Math.max(userStats.bestAccuracy, analysis.totalScore)
      };
      
      setUserStats(newStats);
      localStorage.setItem('shofarStats', JSON.stringify(newStats));
      setRecordedSounds([result, ...recordedSounds.slice(0, 9)]);
      setAudioData(result);
      
    } catch (error) {
      console.error('Audio analysis error:', error);
    }
    
    setIsAnalyzing(false);
    setRecordingTime(0);
  };

  // זיהוי פיקים באודיו
  const detectPeaks = (data, sampleRate) => {
    const peaks = [];
    const threshold = 0.1;
    const minDistance = sampleRate * 0.3; // מינימום 300ms בין פיקים
    
    let lastPeakIndex = -minDistance;
    
    for (let i = 1; i < data.length - 1; i++) {
      const current = Math.abs(data[i]);
      const prev = Math.abs(data[i - 1]);
      const next = Math.abs(data[i + 1]);
      
      if (current > threshold && 
          current > prev && 
          current > next && 
          i - lastPeakIndex > minDistance) {
        
        peaks.push({
          index: i,
          time: i / sampleRate,
          amplitude: current
        });
        lastPeakIndex = i;
      }
    }
    
    return peaks;
  };

  // ניתוח תדרים מתקדם
  const analyzeFrequencies = (data, sampleRate) => {
    // FFT פשוט לניתוח תדרים
    const windowSize = 2048;
    const frequencies = [];
    
    for (let i = 0; i < data.length - windowSize; i += windowSize / 2) {
      const window = data.slice(i, i + windowSize);
      const spectrum = simpleFFT(window);
      frequencies.push(spectrum);
    }
    
    // חישוב תדר דומיננטי
    const averageSpectrum = new Array(windowSize / 2).fill(0);
    frequencies.forEach(spectrum => {
      spectrum.forEach((value, index) => {
        averageSpectrum[index] += value;
      });
    });
    
    const dominantIndex = averageSpectrum.indexOf(Math.max(...averageSpectrum));
    const dominantFrequency = (dominantIndex * sampleRate) / windowSize;
    
    // חישוב יציבות תדר
    const stability = calculateFrequencyStability(frequencies);
    
    return {
      dominant: Math.round(dominantFrequency),
      stability: stability,
      spectrum: averageSpectrum.slice(0, 100) // רק 100 הראשונים לתצוגה
    };
  };

  // FFT פשוט
  const simpleFFT = (data) => {
    const N = data.length;
    const spectrum = new Array(N / 2);
    
    for (let k = 0; k < N / 2; k++) {
      let real = 0, imag = 0;
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += data[n] * Math.cos(angle);
        imag += data[n] * Math.sin(angle);
      }
      spectrum[k] = Math.sqrt(real * real + imag * imag);
    }
    
    return spectrum;
  };

  // חישוב יציבות תדר
  const calculateFrequencyStability = (spectrums) => {
    if (spectrums.length < 2) return 0;
    
    let totalVariation = 0;
    for (let i = 1; i < spectrums.length; i++) {
      let variation = 0;
      for (let j = 0; j < Math.min(spectrums[i].length, spectrums[i-1].length); j++) {
        variation += Math.abs(spectrums[i][j] - spectrums[i-1][j]);
      }
      totalVariation += variation;
    }
    
    const avgVariation = totalVariation / (spectrums.length - 1);
    return Math.max(0, 100 - avgVariation * 10);
  };

  // חישוב ציון מתקדם
  const calculateScore = (peaks, frequencies, duration) => {
    const expectedPeaks = getExpectedPeaks(selectedSequence);
    const expectedFreq = getExpectedFrequency(selectedSequence);
    
    // ציון מספר תקיעות
    const peakScore = Math.max(0, 100 - Math.abs(peaks.length - expectedPeaks) * 10);
    
    // ציון תדר
    const freqDiff = Math.abs(frequencies.dominant - expectedFreq);
    const freqScore = Math.max(0, 100 - freqDiff);
    
    // ציון יציבות
    const stabilityScore = frequencies.stability;
    
    // ציון משך זמן
    const expectedDuration = getExpectedDuration(selectedSequence);
    const durationDiff = Math.abs(duration - expectedDuration);
    const durationScore = Math.max(0, 100 - durationDiff * 2);
    
    const totalScore = Math.round((peakScore + freqScore + stabilityScore + durationScore) / 4);
    
    return {
      totalScore,
      detailed: {
        peaks: Math.round(peakScore),
        frequency: Math.round(freqScore),
        stability: Math.round(stabilityScore),
        duration: Math.round(durationScore)
      }
    };
  };

  // פונקציות עזר לחישוב הציון
  const getExpectedPeaks = (sequence) => {
    const counts = { 'תשרת': 13, 'תשת': 4, 'תרת': 11 };
    return counts[sequence] || 10;
  };

  const getExpectedFrequency = (sequence) => {
    return 415; // תדר טיפוסי לשופר
  };

  const getExpectedDuration = (sequence) => {
    const durations = { 'תשרת': 15, 'תשת': 10, 'תרת': 12 };
    return durations[sequence] || 12;
  };

  const generateFeedback = (analysis) => {
    if (analysis.totalScore >= 90) return '🎉 תקיעות מעולות! מושלם לפי ההלכה!';
    if (analysis.totalScore >= 80) return '✅ תקיעות טובות מאוד! כשרות לחלוטין!';
    if (analysis.totalScore >= 70) return '👍 תקיעות כשרות עם מקום קל לשיפור';
    return '❌ יש לתרגל עוד - בדוק את התזמון והתדרים';
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-amber-50 p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={hebrewFontStyle}
    >
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
        
        {/* כותרת */}
        <div className="text-center mb-8 relative">
          <div className="absolute top-0 right-0">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white border-2 border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="he">🇮🇱 עברית</option>
              <option value="en">🇺🇸 English</option>
            </select>
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🎺 {t.title}
          </h1>
          <p className="text-gray-600 text-lg mb-6">{t.subtitle}</p>
          
          {/* סטטיסטיקות */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
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
        </div>

        {/* תפריט */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-xl p-1">
            {['practice', 'record', 'analysis', 'results'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {t[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* תרגול עם צלילים ריאליסטיים */}
        {activeTab === 'practice' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-blue-800 mb-4">🎺 {t.practice}</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">רצף תקיעות:</label>
                <select
                  value={selectedSequence}
                  onChange={(e) => setSelectedSequence(e.target.value)}
                  className="w-full p-3 border-2 border-blue-200 rounded-lg"
                >
                  {Object.entries(sequences).map(([key, seq]) => (
                    <option key={key} value={key}>{seq.name}</option>
                  ))}
                </select>
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
                    {t[sound.type.replace(' ', '_')] || sound.type}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={playSequence}
                  disabled={currentSound === 'sequence'}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-