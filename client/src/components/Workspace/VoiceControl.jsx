import React, { useEffect, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import toast from 'react-hot-toast';

const VoiceControl = ({ onCommand }) => {
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const [transcript, setTranscript] = useState('');

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognitionInstance = new window.webkitSpeechRecognition();
            recognitionInstance.continuous = true;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'en-US';

            recognitionInstance.onstart = () => {
                setIsListening(true);
                toast.success("Voice Control Active: Say 'Stop Camera'", { id: 'voice-active' });
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
            };

            recognitionInstance.onresult = (event) => {
                const lastResult = event.results[event.results.length - 1];
                const commandText = lastResult[0].transcript.trim().toLowerCase();
                setTranscript(commandText);

                console.log("Voice Command Received:", commandText);

                if (commandText.includes('stop camera') || commandText.includes('pause camera')) {
                    onCommand('STOP_CAMERA');
                    toast.success("Executing: Stop Camera");
                } else if (commandText.includes('start camera') || commandText.includes('resume')) {
                    onCommand('START_CAMERA');
                    toast.success("Executing: Start Camera");
                } else if (commandText.includes('clock out')) {
                    onCommand('CLOCK_OUT');
                    toast.success("Executing: Clock Out");
                } else if (commandText.includes('status') || commandText.includes('check status')) {
                    onCommand('CHECK_STATUS');
                }
            };

            setRecognition(recognitionInstance);
        } else {
            console.warn("Browser does not support Speech Recognition");
        }
    }, [onCommand]);

    const toggleListening = () => {
        if (!recognition) return;

        if (isListening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch (e) {
                console.error("Mic Error:", e);
            }
        }
    };

    if (!recognition) return null; // Don't render if not supported

    return (
        <button
            onClick={toggleListening}
            className={`fixed bottom-4 left-4 p-3 rounded-full shadow-xl transition-all z-50 flex items-center gap-2 ${isListening ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/40' : 'bg-white text-indigo-600 border border-slate-200 hover:bg-slate-50 hover:text-indigo-700 shadow-slate-200'}`}
        >
            {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            {isListening && <span className="text-xs font-mono max-w-[100px] truncate">{transcript || "Listening..."}</span>}
        </button>
    );
};

export default VoiceControl;
