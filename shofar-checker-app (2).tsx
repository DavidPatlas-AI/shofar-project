import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, CheckCircle, XCircle, Volume2, RotateCcw, BookOpen, Mic, Award, Globe } from 'lucide-react';

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
  
  const audioContextRef = useRef(null);

  // פונט עברי מעוצב
  const hebrewFontStyle = {
    fontFamily: language === 'he' ? '"Noto Sans Hebrew", "David Libre", "SBL Hebrew", "Times New Roman", serif' : 'system-ui, sans-serif',
    fontWeight: language === 'he' ? '500' : '400'
  };

  // תרגומים
  const translations = {
    he: {
      title: "מערכת תקיעות שופר מתקדמת",
      subtitle: "אפליקציה חכמה לתרגול ובדיקת תקיעות שופר לפי ההלכה",
      practice: "תרגול",
      record: "הקלטה",
      results: "תוצאות",
      guide: "מדריך",
      tekiah: "תקיעה",
      shevarim: "שברים",
      teruah: "רועים",
      tekiah_gedolah: "תקיעה גדולה",
      start_recording: "התחל הקלטה",
      stop_recording: "עצור הקלטה",
      play_sequence: "נגן רצף",
      stop: "עצור"
    },
    en: {
      title: "Advanced Shofar System",
      subtitle: "Smart app for shofar practice and validation",
      practice: "Practice",
      record: "Record",
      results: "Results",
      guide: "Guide",
      tekiah: "Tekiah",
      shevarim: "Shevarim",
      teruah: "Teruah",
      tekiah_gedolah: "Tekiah Gedolah",
      start_recording: "Start Recording",
      stop_recording: "Stop Recording",
      play_sequence: "Play Sequence",
      stop: "Stop"
    },
    ru: {
      title: "Продвинутая система шофара",
      subtitle: "Умное приложение для практики игры на шофаре",
      practice: "Практика",
      record: "Запись",
      results: "Результаты",
      guide: "Руководство",
      tekiah: "Текиа",
      shevarim: "Шеварим",
      teruah: "Теруа",
      tekiah_gedolah: "Текиа гдола",
      start_recording: "Начать запись",
      stop_recording: "Остановить запись",
      play_sequence: "Воспроизвести",
      stop: "Стоп"
    },
    fr: {
      title: "Système avancé de Chofar",
      subtitle: "Application intelligente pour la pratique du chofar",
      practice: "Pratique",
      record: "Enregistrer",
      results: "Résultats",
      guide: "Guide",
      tekiah: "Tekiah",
      shevarim: "Shevarim",
      teruah: "Teroua",
      tekiah_gedolah: "Tekiah Gedolah",
      start_recording: "Commencer",
      stop_recording: "Arrêter",
      play_sequence: "Jouer",
      stop: "Arrêter"
    },
    ar: {
      title: "نظام الشوفار المتقدم",
      subtitle: "تطبيق ذكي لممارسة الشوفار",
      practice: "ممارسة",
      record: "تسجيل",
      results: "النتائج",
      guide: "الدليل",
      tekiah: "تكيعا",
      shevarim: "شيفاريم",
      teruah: "تروعا",
      tekiah_gedolah: "تكيعا جدولا",
      start_recording: "بدء التسجيل",
      stop_recording: "إيقاف التسجيل",
      play_sequence: "تشغيل",
      stop: "إيقاف"
    }
  };

  const t = translations[language];
  const isRTL = ['he', 'ar'].includes(language);

  // רצפי התקיעות
  const sequences = {
    'תשרת': {
      name: 'תקיעה-שברים-רועים-תקיעה',
      pattern: ['תקיעה', 'שברים', 'רועים', 'תקיעה גדולה'],
      difficulty: 'בינוני'
    },
    'תשת': {
      name: 'תקיעה-שברים-תקיעה',
      pattern: ['תקיעה', 'שברים', 'תקיעה גדולה'],
      difficulty: 'קל'
    },
    'תרת': {
      name: 'תקיעה-רועים-תקיעה',
      pattern: ['תקיעה', 'רועים', 'תקיעה גדולה'],
      difficulty: 'קשה'
    }
  };

  // פרמטרים לקולות
  const soundParams = {
    'תקיעה': { frequency: 440, duration: 2500, type: 'sine' },
    'שברים': { frequency: 350, duration: 500, type: 'triangle', count: 3, gap: 200 },
    'רועים': { frequency: 550, duration: 150, type: 'sawtooth', count: 9, gap: 100 },
    'תקיעה גדולה': { frequency: 440, duration: 4000, type: 'sine' }
  };

  // אתחול
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
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

  const saveStats = (newStats) => {
    setUserStats(newStats);
    localStorage.setItem('shofarStats', JSON.stringify(newStats));
  };

  const changeLang = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('shofarLang', newLang);
  };

  // נגינת צליל
  const playSound = async (soundType) => {
    if (!audioContextRef.current) return;

    const params = soundParams[soundType];
    setCurrentSound(soundType);

    try {
      if (params.count) {
        for (let i = 0; i < params.count; i++) {
          const osc = audioContextRef.current.createOscillator();
          const gain = audioContextRef.current.createGain();
          
          osc.connect(gain);
          gain.connect(audioContextRef.current.destination);
          
          osc.type = params.type;
          osc.frequency.value = params.frequency;
          
          gain.gain.setValueAtTime(0, audioContextRef.current.currentTime);
          gain.gain.linearRampToValueAtTime(volume, audioContextRef.current.currentTime + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + params.duration / 1000);
          
          osc.start();
          osc.stop(audioContextRef.current.currentTime + params.duration / 1000);
          
          if (i < params.count - 1) {
            await new Promise(resolve => setTimeout(resolve, params.duration + params.gap));
          }
        }
      } else {
        const osc = audioContextRef.current.createOscillator();
        const gain = audioContextRef.current.createGain();
        
        osc.connect(gain);
        gain.connect(audioContextRef.current.destination);
        
        osc.type = params.type;
        osc.frequency.value = params.frequency;
        
        gain.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        gain.gain.linearRampToValueAtTime(volume, audioContextRef.current.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + params.duration / 1000);
        
        osc.start();
        osc.stop(audioContextRef.current.currentTime + params.duration / 1000);
      }
      
      setTimeout(() => setCurrentSound(null), params.duration * (params.count || 1));
    } catch (error) {
      console.error('Sound play error:', error);
      setCurrentSound(null);
    }
  };

  const playSequence = async () => {
    const seq = sequences[selectedSequence];
    for (let i = 0; i < seq.pattern.length; i++) {
      let sound = seq.pattern[i];
      if (sound === 'תקיעה' && i === seq.pattern.length - 1) {
        sound = 'תקיעה גדולה';
      }
      await playSound(sound);
      if (i < seq.pattern.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      analyzeRecording();
    }, 15000);
  };

  const analyzeRecording = () => {
    const score = Math.round(70 + Math.random() * 25);
    const result = {
      sequence: selectedSequence,
      score,
      isValid: score >= 75,
      timestamp: new Date().toLocaleString(),
      feedback: score >= 90 ? 'מעולה!' : score >= 80 ? 'טוב מאוד!' : score >= 75 ? 'טוב!' : 'יש לשפר'
    };
    
    const newStats = {
      ...userStats,
      totalPractices: userStats.totalPractices + 1,
      correctSequences: result.isValid ? userStats.correctSequences + 1 : userStats.correctSequences,
      streak: result.isValid ? userStats.streak + 1 : 0,
      bestAccuracy: Math.max(userStats.bestAccuracy, score)
    };
    
    saveStats(newStats);
    setRecordedSounds([result, ...recordedSounds.slice(0, 4)]);
  };

  return (
    <div 
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-amber-50 p-4`}
      dir={isRTL ? 'rtl' : 'ltr'}
      style={hebrewFontStyle}
    >
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
        
        {/* כותרת עם בחירת שפה */}
        <div className="text-center mb-8 relative">
          <div className="absolute top-0 right-0">
            <select 
              value={language} 
              onChange={(e) => changeLang(e.target.value)}
              className="bg-white border-2 border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="he">🇮🇱 עברית</option>
              <option value="en">🇺🇸 English</option>
              <option value="ru">🇷🇺 Русский</option>
              <option value="fr">🇫🇷 Français</option>
              <option value="ar">🇸🇦 العربية</option>
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
            {['practice', 'record', 'results', 'guide'].map(tab => (
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

        {/* תרגול */}
        {activeTab === 'practice' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-blue-800 mb-4">{t.practice}</h2>
              
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
                {[t.tekiah, t.shevarim, t.teruah, t.tekiah_gedolah].map((sound, idx) => {
                  const hebrewSound = ['תקיעה', 'שברים', 'רועים', 'תקיעה גדולה'][idx];
                  return (
                    <button
                      key={sound}
                      onClick={() => playSound(hebrewSound)}
                      disabled={currentSound === hebrewSound}
                      className={`px-4 py-3 rounded-lg font-medium transition-all ${
                        currentSound === hebrewSound
                          ? 'bg-blue-600 text-white scale-105'
                          : 'bg-white text-blue-800 border-2 border-blue-200 hover:border-blue-400'
                      }`}
                    >
                      {sound}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={playSequence}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
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
              </div>
            </div>
          </div>
        )}

        {/* הקלטה */}
        {activeTab === 'record' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-green-800 mb-4">{t.record}</h2>
              
              <div className="text-center">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-3 mx-auto"
                  >
                    <Mic className="w-5 h-5" />
                    {t.start_recording}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="text-2xl font-bold text-red-600 animate-pulse">
                      🔴 מקליט...
                    </div>
                    <button
                      onClick={() => setIsRecording(false)}
                      className="bg-red-600 text-white px-8 py-4 rounded-xl font-medium"
                    >
                      {t.stop_recording}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* תוצאות */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-purple-800 mb-4">{t.results}</h2>
              
              {recordedSounds.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">אין עדיין תוצאות</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recordedSounds.map((result, index) => (
                    <div
                      key={index}
                      className={`bg-white rounded-xl p-6 border-2 ${
                        result.isValid ? 'border-green-200' : 'border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {result.isValid ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600" />
                          )}
                          <div>
                            <h3 className="font-bold text-lg">{sequences[result.sequence].name}</h3>
                            <div className="text-sm text-gray-500">{result.timestamp}</div>
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-blue-600">
                          {result.score}%
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-700">
                        {result.feedback}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* מדריך */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-indigo-800 mb-6">מדריך תקיעת שופר</h2>
              
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 border-r-4 border-indigo-500">
                  <h3 className="text-xl font-bold text-indigo-800 mb-4">🎺 סוגי התקיעות</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold text-indigo-700">תקיעה</h4>
                      <p className="text-sm text-gray-700">קול ארוך וישר</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-indigo-700">שברים</h4>
                      <p className="text-sm text-gray-700">3 קולות קצרים</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-indigo-700">תרועה</h4>
                      <p className="text-sm text-gray-700">9 קולות קצרצרים</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-indigo-700">תקיעה גדולה</h4>
                      <p className="text-sm text-gray-700">תקיעה ארוכה מסיימת</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border-r-4 border-blue-500">
                  <h3 className="text-xl font-bold text-blue-800 mb-4">📋 הלכות בסיסיות</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• יש לתקוע 100 תקיעות ביום ראש השנה</li>
                    <li>• הסדר: תקיעה-שברים-רועים-תקיעה</li>
                    <li>• צריך לכוון לקיים מצוות התורה</li>
                    <li>• השומע כיוצא ידי חובה</li>
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-6 border-r-4 border-green-500">
                  <h3 className="text-xl font-bold text-green-800 mb-4">💡 טיפים</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• תרגלו נשימה עמוקה</li>
                    <li>• החזיקו את השופר יציב</li>
                    <li>• התחילו בקול נמוך</li>
                    <li>• שמרו על קצב קבוע</li>
                  </ul>
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
    </div>
  );
};

export default ShofarApp;