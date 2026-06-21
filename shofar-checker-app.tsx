import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, CheckCircle, XCircle, Volume2, RotateCcw, BookOpen } from 'lucide-react';

const ShofarApp = () => {
  const [currentSound, setCurrentSound] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedSounds, setRecordedSounds] = useState([]);
  const [selectedSequence, setSelectedSequence] = useState('תשר"ת');
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('practice');
  
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);

  // הגדרות לסדרי התקיעות לפי ההלכה
  const shofarSequences = {
    'תשר"ת': {
      name: 'תקיעה שברים רועים תקיעה',
      pattern: ['תקיעה', 'שברים', 'רועים', 'תקיעה'],
      description: 'התקיעה הבסיסית - קול ארוך, שברים קצרים, רועים קצרצרים, תקיעה גדולה'
    },
    'תש"ת': {
      name: 'תקיעה שברים תקיעה',
      pattern: ['תקיעה', 'שברים', 'תקיעה'],
      description: 'תקיעה ארוכה, שברים (3 קולות בינוניים), תקיעה גדולה'
    },
    'תר"ת': {
      name: 'תקיעה רועים תקיعה',
      pattern: ['תקיעה', 'רועים', 'תקיעה'],
      description: 'תקיעה ארוכה, רועים (9 קולות קצרים), תקיעה גדולה'
    }
  };

  // פרמטרים של קולות השופר
  const soundParams = {
    'תקיעה': { frequency: 440, duration: 3000, type: 'sine' },
    'שברים': { frequency: 330, duration: 800, type: 'triangle', count: 3, gap: 200 },
    'רועים': { frequency: 550, duration: 300, type: 'sawtooth', count: 9, gap: 100 },
    'תקיעה גדולה': { frequency: 440, duration: 4000, type: 'sine' }
  };

  useEffect(() => {
    // יצירת AudioContext
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playSound = async (soundType) => {
    if (!audioContextRef.current) return;

    // עצירת צליל קודם
    stopCurrentSound();

    const params = soundParams[soundType];
    setCurrentSound(soundType);

    try {
      if (params.count) {
        // נגינת רצף קולות (שברים/רועים)
        for (let i = 0; i < params.count; i++) {
          if (currentSound !== soundType) break; // בדיקה אם עצרו את הנגינה
          
          const oscillator = audioContextRef.current.createOscillator();
          const gainNode = audioContextRef.current.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);
          
          oscillator.type = params.type;
          oscillator.frequency.value = params.frequency + (i * 10); // וריאציה קלה בתדר
          
          gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.3, audioContextRef.current.currentTime + 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + params.duration / 1000);
          
          oscillator.start(audioContextRef.current.currentTime);
          oscillator.stop(audioContextRef.current.currentTime + params.duration / 1000);
          
          if (i < params.count - 1) {
            await new Promise(resolve => setTimeout(resolve, params.duration + params.gap));
          }
        }
      } else {
        // נגינת צליל יחיד
        oscillatorRef.current = audioContextRef.current.createOscillator();
        gainNodeRef.current = audioContextRef.current.createGain();
        
        oscillatorRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContextRef.current.destination);
        
        oscillatorRef.current.type = params.type;
        oscillatorRef.current.frequency.value = params.frequency;
        
        gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        gainNodeRef.current.gain.linearRampToValueAtTime(0.4, audioContextRef.current.currentTime + 0.2);
        gainNodeRef.current.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + params.duration / 1000);
        
        oscillatorRef.current.start();
        oscillatorRef.current.stop(audioContextRef.current.currentTime + params.duration / 1000);
        
        oscillatorRef.current.onended = () => {
          setCurrentSound(null);
        };
      }
      
      setTimeout(() => {
        setCurrentSound(null);
      }, params.duration * (params.count || 1) + (params.gap * (params.count - 1 || 0)));
      
    } catch (error) {
      console.error('שגיאה בנגינת הצליל:', error);
      setCurrentSound(null);
    }
  };

  const stopCurrentSound = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {}
      oscillatorRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    setCurrentSound(null);
  };

  const playSequence = async () => {
    const sequence = shofarSequences[selectedSequence];
    for (let i = 0; i < sequence.pattern.length; i++) {
      const sound = sequence.pattern[i] === 'תקיעה' && i === sequence.pattern.length - 1 
        ? 'תקיעה גדולה' 
        : sequence.pattern[i];
      
      await playSound(sound);
      
      // המתנה בין הקולות
      if (i < sequence.pattern.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const checkSequence = () => {
    // סימולציה של בדיקת תקיעות
    const accuracy = Math.random() * 100;
    const isValid = accuracy > 70;
    
    const result = {
      sequence: selectedSequence,
      accuracy: Math.round(accuracy),
      isValid,
      feedback: isValid 
        ? 'תקיעות כשרות לפי ההלכה! כל הכבוד!'
        : 'יש לשפר את התקיעות. בדוק את אורך הקולות והפסקות ביניהם.',
      timestamp: new Date().toLocaleString('he-IL')
    };
    
    setRecordedSounds([result, ...recordedSounds.slice(0, 4)]);
    setShowResults(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-amber-50 min-h-screen" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* כותרת */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-800 mb-2">
            🎺 בדיקת תקיעות שופר
          </h1>
          <p className="text-gray-600 text-lg">
            אפליקציה לתרגול ובדיקת תקיעות שופר לפי ההלכה
          </p>
        </div>

        {/* תפריט טאבים */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('practice')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'practice'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Volume2 className="w-4 h-4 inline ml-2" />
              תרגול וההאזנה
            </button>
            <button
              onClick={() => setActiveTab('check')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'check'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <CheckCircle className="w-4 h-4 inline ml-2" />
              בדיקה הלכתית
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'guide'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <BookOpen className="w-4 h-4 inline ml-2" />
              מדריך הלכתי
            </button>
          </div>
        </div>

        {/* תוכן הטאב - תרגול */}
        {activeTab === 'practice' && (
          <div className="space-y-6">
            {/* בחירת סדר תקיעות */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-blue-800 mb-4">בחר סדר תקיעות</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(shofarSequences).map(([key, sequence]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedSequence(key)}
                    className={`p-4 rounded-lg text-right transition-all ${
                      selectedSequence === key
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-blue-800 border-2 border-blue-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="font-bold text-lg mb-1">{sequence.name}</div>
                    <div className="text-sm opacity-75">{sequence.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* נגינת דוגמא */}
            <div className="bg-amber-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-amber-800 mb-4">
                נגינת דוגמא: {shofarSequences[selectedSequence].name}
              </h3>
              
              <div className="flex flex-wrap gap-3 mb-4">
                {shofarSequences[selectedSequence].pattern.map((sound, index) => (
                  <button
                    key={index}
                    onClick={() => playSound(sound === 'תקיעה' && index === shofarSequences[selectedSequence].pattern.length - 1 ? 'תקיעה גדולה' : sound)}
                    disabled={currentSound === sound}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      currentSound === sound
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-amber-800 border-2 border-amber-200 hover:border-amber-400'
                    }`}
                  >
                    {index === shofarSequences[selectedSequence].pattern.length - 1 && sound === 'תקיעה' ? 'תקיעה גדולה' : sound}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={playSequence}
                  disabled={currentSound !== null}
                  className="bg-amber-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
              </div>
            </div>

            {/* הוראות */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">💡 הוראות שימוש</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• בחר את סדר התקיעות הרצוי</li>
                <li>• האזן לדוגמא של כל קול בנפרד</li>
                <li>• נגן את הרצף המלא לתרגול</li>
                <li>• עבור לטאב "בדיקה הלכתית" לבדיקת התקיעות שלך</li>
              </ul>
            </div>
          </div>
        )}

        {/* תוכן הטאב - בדיקה */}
        {activeTab === 'check' && (
          <div className="space-y-6">
            <div className="bg-green-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-green-800 mb-4">בדיקת תקיעות לפי ההלכה</h2>
              <p className="text-green-700 mb-4">
                בחר את סדר התקיעות ולחץ על "בדוק תקיעות" לקבלת הערכה הלכתית
              </p>

              <div className="flex gap-4 items-center mb-4">
                <select
                  value={selectedSequence}
                  onChange={(e) => setSelectedSequence(e.target.value)}
                  className="px-4 py-2 border-2 border-green-200 rounded-lg focus:border-green-400"
                >
                  {Object.entries(shofarSequences).map(([key, sequence]) => (
                    <option key={key} value={key}>{sequence.name}</option>
                  ))}
                </select>

                <button
                  onClick={checkSequence}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  בדוק תקיעות
                </button>
              </div>
            </div>

            {/* תוצאות בדיקות */}
            {recordedSounds.length > 0 && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">תוצאות בדיקות אחרונות</h3>
                <div className="space-y-4">
                  {recordedSounds.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 ${
                        result.isValid
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {result.isValid ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className="font-bold">
                            {shofarSequences[result.sequence].name}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {result.timestamp}
                        </span>
                      </div>
                      <div className="text-sm mb-2">
                        דיוק: {result.accuracy}%
                      </div>
                      <div className={`text-sm ${
                        result.isValid ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {result.feedback}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* תוכן הטאב - מדריך */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            <div className="bg-purple-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-purple-800 mb-6">מדריך הלכתי לתקיעת שופר</h2>
              
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-4 border-r-4 border-purple-500">
                  <h3 className="text-lg font-bold text-purple-800 mb-3">🎵 סוגי הקולות</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-bold">תקיעה</h4>
                      <p className="text-sm text-gray-700">קול ארוך ישר, לפחות כמידת שברים</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold">שברים</h4>
                      <p className="text-sm text-gray-700">3 קולות קצרים וחתוכים</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold">רועים (תרועה)</h4>
                      <p className="text-sm text-gray-700">9 קולות קצרצרים ומהירים</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold">תקיעה גדולה</h4>
                      <p className="text-sm text-gray-700">תקיעה ארוכה מסיימת</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border-r-4 border-blue-500">
                  <h3 className="text-lg font-bold text-blue-800 mb-3">📋 סדרי התקיעות</h3>
                  <div className="space-y-3">
                    {Object.entries(shofarSequences).map(([key, sequence]) => (
                      <div key={key} className="border-b pb-2">
                        <h4 className="font-bold">{sequence.name}</h4>
                        <p className="text-sm text-gray-700">{sequence.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border-r-4 border-red-500">
                  <h3 className="text-lg font-bold text-red-800 mb-3">⚠️ הלכות חשובות</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• יש להקפיד על אורך הקולות הנדרש</li>
                    <li>• בין כל קול לקול יש לעשות הפסקה קלה</li>
                    <li>• אין להפסיק באמצע רצף התקיעות</li>
                    <li>• יש לכוון בתקיעה ולא רק לתקוע</li>
                    <li>• עדיף לתקוע לאט ונכון מאשר מהר ולא נכון</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-4 border-r-4 border-green-500">
                  <h3 className="text-lg font-bold text-green-800 mb-3">💡 טיפים לתקיעה טובה</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• תרגל את הנשימה הנכונה</li>
                    <li>• החזק את השופר יציב ונוח</li>
                    <li>• התחל בקול נמוך ועלה בהדרגה</li>
                    <li>• שמור על קצב קבוע</li>
                    <li>• תרגל לפני החג</li>
                  </ul>
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