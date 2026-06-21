import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, CheckCircle, XCircle, Volume2, RotateCcw, BookOpen, Mic, MicOff, Clock, Award, Settings, Download, Share2 } from 'lucide-react';

const ShofarApp = () => {
  const [currentSound, setCurrentSound] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedSounds, setRecordedSounds] = useState([]);
  const [selectedSequence, setSelectedSequence] = useState('תשר"ת');
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('practice');
  const [volume, setVolume] = useState(0.7);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [practiceMode, setPracticeMode] = useState('guided');
  const [userStats, setUserStats] = useState({
    totalPractices: 0,
    correctSequences: 0,
    streak: 0,
    bestAccuracy: 0
  });
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioChunksRef = useRef([]);

  // הגדרות מתקדמות לסדרי התקיעות
  const shofarSequences = {
    'תשר"ת': {
      name: 'תקיעה שברים רועים תקיעה',
      pattern: ['תקיעה', 'שברים', 'רועים', 'תקיעה גדולה'],
      description: 'הרצף הבסיסי - קול ארוך, 3 שברים, 9 רועים, תקיעה גדולה',
      difficulty: 'בינוני',
      minDuration: 15000,
      halachicNotes: 'חובה בכל בתי הכנסת. יש להקפיד על הפסקות ברורות בין השברים והרועים.'
    },
    'תש"ת': {
      name: 'תקיעה שברים תקיעה',
      pattern: ['תקיעה', 'שברים', 'תקיעה גדולה'],
      description: 'רצף קצר יותר - תקיעה, 3 שברים, תקיעה גדולה',
      difficulty: 'קל',
      minDuration: 10000,
      halachicNotes: 'מתאים למתחילים. חשוב לשמור על יחס נכון בין אורך התקיעה לשברים.'
    },
    'תר"ת': {
      name: 'תקיעה רועים תקיעה',
      pattern: ['תקיעה', 'רועים', 'תקיעה גדולה'],
      description: 'תקיעה, 9 רועים מהירים, תקיעה גדולה',
      difficulty: 'קשה',
      minDuration: 12000,
      halachicNotes: 'הקשה ביותר. הרועים צריכים להיות מהירים ובעצמה אחידה.'
    },
    'מלכויות': {
      name: 'מלכויות - 10 תקיעות',
      pattern: ['תשר"ת', 'תש"ת', 'תר"ת'],
      description: 'סדר מלא של מלכויות עם 10 תקיעות',
      difficulty: 'מתקדם',
      minDuration: 45000,
      halachicNotes: 'הסדר המלא כפי שנהוג במוסף ראש השנה.'
    }
  };

  // פרמטרים משופרים לקולות השופר
  const soundParams = {
    'תקיעה': { 
      frequency: 440, 
      duration: 3000, 
      type: 'sine',
      fadeIn: 200,
      fadeOut: 500,
      vibrato: { rate: 4, depth: 0.1 }
    },
    'שברים': { 
      frequency: 350, 
      duration: 600, 
      type: 'triangle', 
      count: 3, 
      gap: 150,
      fadeIn: 100,
      fadeOut: 200
    },
    'רועים': { 
      frequency: 520, 
      duration: 200, 
      type: 'sawtooth', 
      count: 9, 
      gap: 80,
      fadeIn: 50,
      fadeOut: 100
    },
    'תקיעה גדולה': { 
      frequency: 440, 
      duration: 4500, 
      type: 'sine',
      fadeIn: 300,
      fadeOut: 800,
      vibrato: { rate: 3, depth: 0.15 }
    }
  };

  // אתחול AudioContext
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        
        // הפעלת AudioContext אם הוא suspended
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      } catch (error) {
        console.error('שגיאה באתחול AudioContext:', error);
      }
    };
    
    initAudio();
    
    // טעינת סטטיסטיקות מ-localStorage
    const savedStats = localStorage.getItem('shofarStats');
    if (savedStats) {
      setUserStats(JSON.parse(savedStats));
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // שמירת סטטיסטיקות
  const saveStats = useCallback((newStats) => {
    setUserStats(newStats);
    localStorage.setItem('shofarStats', JSON.stringify(newStats));
  }, []);

  // נגינת צליל משופרת
  const playSound = useCallback(async (soundType, customParams = {}) => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      console.error('AudioContext לא זמין');
      return;
    }

    stopCurrentSound();
    
    const params = { ...soundParams[soundType], ...customParams };
    const adjustedDuration = params.duration / playbackSpeed;
    const adjustedGap = (params.gap || 0) / playbackSpeed;
    
    setCurrentSound(soundType);

    try {
      if (params.count) {
        // רצף קולות (שברים/רועים)
        for (let i = 0; i < params.count; i++) {
          if (currentSound !== soundType) break;
          
          await playTone({
            ...params,
            duration: adjustedDuration,
            frequency: params.frequency + (i * (soundType === 'רועים' ? 20 : 10))
          });
          
          if (i < params.count - 1) {
            await new Promise(resolve => setTimeout(resolve, adjustedDuration + adjustedGap));
          }
        }
      } else {
        // צליל יחיד
        await playTone({ ...params, duration: adjustedDuration });
      }
      
      setTimeout(() => {
        setCurrentSound(null);
      }, adjustedDuration * (params.count || 1) + (adjustedGap * (params.count - 1 || 0)));
      
    } catch (error) {
      console.error('שגיאה בנגינת הצליל:', error);
      setCurrentSound(null);
    }
  }, [currentSound, playbackSpeed]);

  // נגינת טון בודד עם אפקטים
  const playTone = async (params) => {
    return new Promise((resolve) => {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      const vibratoOsc = audioContextRef.current.createOscillator();
      const vibratoGain = audioContextRef.current.createGain();
      
      // הגדרת vibrato אם קיים
      if (params.vibrato) {
        vibratoOsc.frequency.value = params.vibrato.rate;
        vibratoGain.gain.value = params.frequency * params.vibrato.depth;
        
        vibratoOsc.connect(vibratoGain);
        vibratoGain.connect(oscillator.frequency);
        vibratoOsc.start();
      }
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.type = params.type;
      oscillator.frequency.value = params.frequency;
      
      // Envelope עם fade in/out
      const now = audioContextRef.current.currentTime;
      const fadeInTime = (params.fadeIn || 100) / 1000;
      const fadeOutTime = (params.fadeOut || 200) / 1000;
      const duration = params.duration / 1000;
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + fadeInTime);
      gainNode.gain.setValueAtTime(volume, now + duration - fadeOutTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      oscillator.start(now);
      oscillator.stop(now + duration);
      
      oscillator.onended = () => {
        if (params.vibrato) {
          vibratoOsc.stop();
          vibratoOsc.disconnect();
          vibratoGain.disconnect();
        }
        oscillator.disconnect();
        gainNode.disconnect();
        resolve();
      };
    });
  };

  const stopCurrentSound = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch (e) {}
    }
    setCurrentSound(null);
    setIsPlayingSequence(false);
    setCurrentStep(0);
  };

  // נגינת רצף עם ויזואליזציה
  const playSequence = useCallback(async () => {
    const sequence = shofarSequences[selectedSequence];
    setIsPlayingSequence(true);
    setCurrentStep(0);
    
    for (let i = 0; i < sequence.pattern.length; i++) {
      setCurrentStep(i + 1);
      
      let sound = sequence.pattern[i];
      if (sound === 'תקיעה' && i === sequence.pattern.length - 1) {
        sound = 'תקיעה גדולה';
      }
      
      await playSound(sound);
      
      // המתנה בין התקיעות
      if (i < sequence.pattern.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1200 / playbackSpeed));
      }
    }
    
    setIsPlayingSequence(false);
    setCurrentStep(0);
  }, [selectedSequence, playSound, playbackSpeed]);

  // הקלטה (סימולציה)
  const startRecording = async () => {
    try {
      setIsRecording(true);
      setRecordingTime(0);
      audioChunksRef.current = [];
      
      // הפעלת טיימר
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // סימולציה של הקלטה
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 30000); // הקלטה מקסימלית של 30 שניות
      
    } catch (error) {
      console.error('שגיאה בהתחלת הקלטה:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    // אוטומטית מתחיל בדיקה
    setTimeout(() => {
      checkRecordedSequence();
    }, 500);
  };

  // בדיקה מתקדמת של הקלטה
  const checkRecordedSequence = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const sequence = shofarSequences[selectedSequence];
      
      // חישוב ציון מבוסס על משך הקלטה ורצף
      const expectedDuration = sequence.minDuration / 1000;
      const durationScore = Math.max(0, 100 - Math.abs(recordingTime - expectedDuration) * 2);
      
      // ציון אקראי לדמו
      const timingScore = 70 + Math.random() * 25;
      const toneQualityScore = 65 + Math.random() * 30;
      const sequenceScore = 75 + Math.random() * 20;
      
      const totalScore = Math.round((durationScore + timingScore + toneQualityScore + sequenceScore) / 4);
      const isValid = totalScore >= 70;
      
      const detailedFeedback = {
        duration: Math.round(durationScore),
        timing: Math.round(timingScore),
        toneQuality: Math.round(toneQualityScore),
        sequence: Math.round(sequenceScore)
      };
      
      const result = {
        sequence: selectedSequence,
        sequenceName: sequence.name,
        totalScore,
        detailedFeedback,
        isValid,
        recordingDuration: recordingTime,
        expectedDuration: Math.round(expectedDuration),
        feedback: generateDetailedFeedback(totalScore, detailedFeedback),
        timestamp: new Date().toLocaleString('he-IL'),
        difficulty: sequence.difficulty
      };
      
      // עדכון סטטיסטיקות
      const newStats = {
        ...userStats,
        totalPractices: userStats.totalPractices + 1,
        correctSequences: isValid ? userStats.correctSequences + 1 : userStats.correctSequences,
        streak: isValid ? userStats.streak + 1 : 0,
        bestAccuracy: Math.max(userStats.bestAccuracy, totalScore)
      };
      saveStats(newStats);
      
      setRecordedSounds([result, ...recordedSounds.slice(0, 9)]);
      setShowResults(true);
      setIsAnalyzing(false);
      setRecordingTime(0);
    }, 2000);
  };

  const generateDetailedFeedback = (score, details) => {
    let feedback = [];
    
    if (score >= 90) {
      feedback.push('🎉 תקיעות מעולות! כשרות לחלוטין לפי ההלכה!');
    } else if (score >= 80) {
      feedback.push('✅ תקיעות טובות וכשרות!');
    } else if (score >= 70) {
      feedback.push('👍 תקיעות כשרות עם מקום לשיפור.');
    } else {
      feedback.push('❌ יש לשפר את התקיעות.');
    }
    
    if (details.duration < 60) {
      feedback.push('• האריכו את התקיעות - הן קצרות מדי.');
    }
    if (details.timing < 70) {
      feedback.push('• שמרו על קצב יציב יותר בין התקיעות.');
    }
    if (details.toneQuality < 70) {
      feedback.push('• עבדו על איכות הטון - נסו נשימה עמוקה יותר.');
    }
    if (details.sequence < 70) {
      feedback.push('• הקפידו על הרצף הנכון של התקיעות.');
    }
    
    return feedback.join('\n');
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'קל': return 'text-green-600';
      case 'בינוני': return 'text-yellow-600';
      case 'קשה': return 'text-red-600';
      case 'מתקדם': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-amber-50 min-h-screen" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl p-8">
        {/* כותרת עם סטטיסטיקות */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🎺 מערכת תקיעות שופר מתקדמת
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            אפליקציה חכמה לתרגול, הקלטה ובדיקת תקיעות שופר לפי ההלכה
          </p>
          
          {/* לוח סטטיסטיקות */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">{userStats.totalPractices}</div>
              <div className="text-sm text-blue-800">תרגולים</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">{userStats.correctSequences}</div>
              <div className="text-sm text-green-800">תקיעות כשרות</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-600">{userStats.streak}</div>
              <div className="text-sm text-purple-800">רצף נוכחי</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-amber-600">{userStats.bestAccuracy}%</div>
              <div className="text-sm text-amber-800">שיא דיוק</div>
            </div>
          </div>
        </div>

        {/* תפריט טאבים משופר */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-xl p-1 shadow-inner">
            {[
              { id: 'practice', icon: Volume2, label: 'תרגול מתקדם' },
              { id: 'record', icon: Mic, label: 'הקלטה ובדיקה' },
              { id: 'results', icon: Award, label: 'תוצאות ומעקב' },
              { id: 'guide', icon: BookOpen, label: 'מדריך הלכתי' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* תרגול מתקדם */}
        {activeTab === 'practice' && (
          <div className="space-y-6">
            {/* הגדרות תרגול */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-blue-800 mb-6">הגדרות תרגול</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">עוצמת קול</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600">{Math.round(volume * 100)}%</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">מהירות נגינה</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600">×{playbackSpeed}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">סוג תרגול</label>
                  <select
                    value={practiceMode}
                    onChange={(e) => setPracticeMode(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="guided">מודרך</option>
                    <option value="free">חופשי</option>
                    <option value="test">מבחן</option>
                  </select>
                </div>
              </div>
            </div>

            {/* בחירת רצף */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">בחר רצף תקיעות</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(shofarSequences).map(([key, sequence]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedSequence(key)}
                    className={`p-4 rounded-xl text-right transition-all border-2 ${
                      selectedSequence === key
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg border-transparent'
                        : 'bg-gray-50 text-gray-800 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        selectedSequence === key ? 'bg-white bg-opacity-20' : 'bg-gray-200'
                      } ${getDifficultyColor(sequence.difficulty)}`}>
                        {sequence.difficulty}
                      </span>
                      <div className="font-bold text-lg">{sequence.name}</div>
                    </div>
                    <div className="text-sm opacity-90 mb-2">{sequence.description}</div>
                    <div className="text-xs opacity-75">
                      משך מינימלי: {Math.round(sequence.minDuration / 1000)} שניות
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* נגינה עם ויזואליזציה */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-amber-800 mb-4">
                תרגול: {shofarSequences[selectedSequence].name}
              </h3>
              
              {/* בר התקדמות */}
              {isPlayingSequence && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-amber-700 mb-2">
                    <span>שלב {currentStep} מתוך {shofarSequences[selectedSequence].pattern.length}</span>
                    <span>{currentStep > 0 ? shofarSequences[selectedSequence].pattern[currentStep - 1] : ''}</span>
                  </div>
                  <div className="bg-amber-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-full h-3 transition-all duration-500"
                      style={{ width: `${(currentStep / shofarSequences[selectedSequence].pattern.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* כפתורי תקיעות */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {['תקיעה', 'שברים', 'רועים', 'תקיעה גדולה'].map((sound) => (
                  <button
                    key={sound}
                    onClick={() => playSound(sound)}
                    disabled={currentSound === sound}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      currentSound === sound
                        ? 'bg-amber-600 text-white scale-105'
                        : 'bg-white text-amber-800 border-2 border-amber-200 hover:border-amber-400 hover:shadow-md'
                    }`}
                  >
                    {sound}
                  </button>
                ))}
              </div>

              {/* כפתורי בקרה */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={playSequence}
                  disabled={isPlayingSequence}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  נגן רצף מלא
                </button>
                
                <button
                  onClick={stopCurrentSound}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  עצור
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  איפוס
                </button>
              </div>
            </div>
          </div>
        )}

        {/* הקלטה ובדיקה */}
        {activeTab === 'record' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-green-800 mb-4">הקלטה ובדיקה הלכתית</h2>
              <p className="text-green-700 mb-6">
                תקע את רצף התקיעות שלך והמערכת תבדוק אותן לפי ההלכה
              </p>

              {/* בחירת רצף להקלטה */}
              <div className="mb-6">
                <label className="block font-medium mb-2">רצף לבדיקה:</label>
                <select
                  value={selectedSequence}
                  onChange={(e) => setSelectedSequence(e.target.value)}
                  className="px-4 py-2 border-2 border-green-200 rounded-lg focus:border-green-400 bg-white"
                >
                  {Object.entries(shofarSequences).map(([key, sequence]) => (
                    <option key={key} value={key}>{sequence.name}</option>
                  ))}
                </select>
              </div>

              {/* סטטוס הקלטה */}
              <div className="text-center mb-6">
                {!isRecording && !isAnalyzing && (
                  <div className="space-y-4">
                    <div className="text-lg font-medium text-gray-700">
                      לחץ על כפתור ההקלטה ותתחיל לתקוע
                    </div>
                    <button
                      onClick={startRecording}
                      className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-3 mx-auto"
                    >
                      <Mic className="w-5 h-5" />
                      התחל הקלטה
                    </button>
                  </div>
                )}

                {isRecording && (
                  <div className="space-y-4">
                    <div className="text-2xl font-bold text-red-600 animate-pulse">
                      🔴 מקליט...
                    </div>
                    <div className="text-lg text-gray-700">
                      זמן הקלטה: {formatTime(recordingTime)}
                    </div>
                    <button
                      onClick={stopRecording}
                      className="bg-red-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center gap-3 mx-auto"
                    >
                      <Square className="w-5 h-5" />
                      עצור הקלטה
                    </button>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="space-y-4">
                    <div className="text-xl font-bold text-blue-600">
                      🔍 מנתח את התקיעות...
                    </div>
                    <div className="animate-spin mx-auto w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
                  </div>
                )}
              </div>

              {/* מידע על הרצף הנבחר */}
              <div className="bg-white rounded-lg p-4 border-r-4 border-green-500">
                <h4 className="font-bold text-green-800 mb-2">
                  {shofarSequences[selectedSequence].name}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {shofarSequences[selectedSequence].description}
                </p>
                <div className="text-xs text-gray-500">
                  <span className={getDifficultyColor(shofarSequences[selectedSequence].difficulty)}>
                    רמת קושי: {shofarSequences[selectedSequence].difficulty}
                  </span>
                  <br />
                  משך מומלץ: {Math.round(shofarSequences[selectedSequence].minDuration / 1000)} שניות
                </div>
                <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                  💡 {shofarSequences[selectedSequence].halachicNotes}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* תוצאות ומעקב */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-purple-800 mb-6">תוצאות ומעקב ביצועים</h2>
              
              {recordedSounds.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">עדיין לא ביצעת בדיקות</p>
                  <p className="text-gray-400">עבור לטאב "הקלטה ובדיקה" כדי להתחיל</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                      <div className="text-sm text-gray-600">ממוצע ציונים</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(recordedSounds.reduce((sum, r) => sum + r.totalScore, 0) / recordedSounds.length)}%
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                      <div className="text-sm text-gray-600">תקיעות כשרות</div>
                      <div className="text-2xl font-bold text-green-600">
                        {recordedSounds.filter(r => r.isValid).length}/{recordedSounds.length}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                      <div className="text-sm text-gray-600">שיפור אחרון</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {recordedSounds.length >= 2 
                          ? `${recordedSounds[0].totalScore - recordedSounds[1].totalScore > 0 ? '+' : ''}${recordedSounds[0].totalScore - recordedSounds[1].totalScore}%`
                          : 'N/A'
                        }
                      </div>
                    </div>
                  </div>

                  {recordedSounds.map((result, index) => (
                    <div
                      key={index}
                      className={`bg-white rounded-xl p-6 border-2 transition-all hover:shadow-lg ${
                        result.isValid
                          ? 'border-green-200 hover:border-green-300'
                          : 'border-red-200 hover:border-red-300'
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
                              {result.timestamp} • רמת קושי: {result.difficulty}
                            </div>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className={`text-3xl font-bold ${
                            result.totalScore >= 90 ? 'text-green-600' :
                            result.totalScore >= 80 ? 'text-blue-600' :
                            result.totalScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {result.totalScore}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {result.recordingDuration}s / {result.expectedDuration}s
                          </div>
                        </div>
                      </div>

                      {/* פירוט ציונים */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-600">משך זמן</div>
                          <div className={`font-bold ${result.detailedFeedback.duration >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                            {result.detailedFeedback.duration}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600">תזמון</div>
                          <div className={`font-bold ${result.detailedFeedback.timing >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                            {result.detailedFeedback.timing}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600">איכות טון</div>
                          <div className={`font-bold ${result.detailedFeedback.toneQuality >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                            {result.detailedFeedback.toneQuality}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600">רצף</div>
                          <div className={`font-bold ${result.detailedFeedback.sequence >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                            {result.detailedFeedback.sequence}%
                          </div>
                        </div>
                      </div>

                      {/* משוב מפורט */}
                      <div className={`text-sm p-3 rounded-lg ${
                        result.isValid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                      }`}>
                        <pre className="whitespace-pre-wrap font-sans">{result.feedback}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* מדריך הלכתי */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-indigo-800 mb-6">מדריך הלכתי מקיף לתקיעת שופר</h2>
              
              <div className="space-y-6">
                {/* הלכות בסיסיות */}
                <div className="bg-white rounded-xl p-6 border-r-4 border-indigo-500">
                  <h3 className="text-xl font-bold text-indigo-800 mb-4">🎺 הלכות יסוד</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-bold text-indigo-700">מצוות התקיעה</h4>
                      <ul className="text-sm text-gray-700 space-y-1 pr-4">
                        <li>• מצווה מן התורה בראש השנה</li>
                        <li>• צריך לכוון למצווה</li>
                        <li>• השומע כיוצא ידי חובה</li>
                        <li>• מברכים לפני התקיעות</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-bold text-indigo-700">זמני התקיעה</h4>
                      <ul className="text-sm text-gray-700 space-y-1 pr-4">
                        <li>• ביום - מהנץ החמה</li>
                        <li>• בלילה - אין תוקעין</li>
                        <li>• בשבת - אין תוקעין</li>
                        <li>• מוסף - זמן עיקרי</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* סוגי הקולות */}
                <div className="bg-white rounded-xl p-6 border-r-4 border-purple-500">
                  <h3 className="text-xl font-bold text-purple-800 mb-4">🎵 סוגי הקולות ומידותיהם</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(soundParams).map(([sound, params]) => (
                      <div key={sound} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-bold text-purple-700 mb-2">{sound}</h4>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>משך: {params.duration/1000}s</div>
                          <div>תדר: {params.frequency}Hz</div>
                          {params.count && <div>כמות: {params.count}</div>}
                          {params.gap && <div>הפסקה: {params.gap}ms</div>}
                        </div>
                        <button
                          onClick={() => playSound(sound)}
                          className="mt-2 w-full bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs hover:bg-purple-200 transition-colors"
                        >
                          השמע דוגמא
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* סדרי התקיעות */}
                <div className="bg-white rounded-xl p-6 border-r-4 border-blue-500">
                  <h3 className="text-xl font-bold text-blue-800 mb-4">📋 סדרי התקיעות לפי ההלכה</h3>
                  <div className="space-y-4">
                    {Object.entries(shofarSequences).map(([key, sequence]) => (
                      <div key={key} className="bg-blue-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-blue-800">{sequence.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(sequence.difficulty)} bg-white`}>
                            {sequence.difficulty}
                          </span>
                        </div>
                        <p className="text-sm text-blue-700 mb-2">{sequence.description}</p>
                        <div className="text-xs text-blue-600 bg-white p-2 rounded mb-2">
                          <strong>רצף:</strong> {sequence.pattern.join(' → ')}
                        </div>
                        <div className="text-xs text-gray-600">
                          💡 {sequence.halachicNotes}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* פסולי שופר */}
                <div className="bg-white rounded-xl p-6 border-r-4 border-red-500">
                  <h3 className="text-xl font-bold text-red-800 mb-4">❌ פסולי תקיעה</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-bold text-red-700 mb-2">פסולי קול</h4>
                      <ul className="text-sm text-gray-700 space-y-1 pr-4">
                        <li>• תקיעה קצרה מדי</li>
                        <li>• שברים מחוברים</li>
                        <li>• רועים איטיים מדי</li>
                        <li>• קול נשבר או חלק</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-red-700 mb-2">פסולי רצף</h4>
                      <ul className="text-sm text-gray-700 space-y-1 pr-4">
                        <li>• הפסקה ארוכה מדי</li>
                        <li>• שינוי סדר הקולות</li>
                        <li>• חזרה על קול</li>
                        <li>• חיבור בין רצפים</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* טיפים מתקדמים */}
                <div className="bg-white rounded-xl p-6 border-r-4 border-green-500">
                  <h3 className="text-xl font-bold text-green-800 mb-4">💡 טיפים מתקדמים לתקיעה מושלמת</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-bold text-green-700 mb-2">טכניקה</h4>
                      <ul className="text-sm text-gray-700 space-y-1 pr-4">
                        <li>• נשימה עמוקה מהבטן</li>
                        <li>• שפתיים רפויות</li>
                        <li>• לשון נמוכה</li>
                        <li>• זווית נכונה של השופר</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-green-700 mb-2">תרגול</h4>
                      <ul className="text-sm text-gray-700 space-y-1 pr-4">
                        <li>• תרגול יומי קבוע</li>
                        <li>• התחלה בקצב איטי</li>
                        <li>• הקלטה ושמיעה עצמית</li>
                        <li>• תרגול עם מומחה</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-green-700 mb-2">הכנה</h4>
                      <ul className="text-sm text-gray-700 space-y-1 pr-4">
                        <li>• בדיקת השופר מראש</li>
                        <li>• שמירה על השופר</li>
                        <li>• הכנה נפשית</li>
                        <li>• יידוע הציבור</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* מקורות */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">📚 מקורות עיקריים</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• משנה ראש השנה פרק ג-ד</p>
                    <p>• גמרא ראש השנה כו.-לד.</p>
                    <p>• רמב"ם הלכות שופר פרק א-ג</p>
                    <p>• שולחן עוך אורח חיים סימנים תקפו-תקצט</p>
                    <p>• משנה ברורה על אורח חיים</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShofarApp;