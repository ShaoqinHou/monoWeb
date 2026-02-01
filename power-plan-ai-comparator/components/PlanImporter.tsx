import React, { useState, useRef } from 'react';
import { processAIRequest, ImageAttachment } from '../services/geminiService';
import { PowerPlan, UsageProfile } from '../types';

interface AIInputProps {
  onImportPlan: (plan: PowerPlan) => void;
  onUpdateUsage: (usage: UsageProfile | ((prev: UsageProfile) => UsageProfile)) => void;
  defaultOpen?: boolean;
  embedded?: boolean;
}

const AIAssistant: React.FC<AIInputProps> = ({ onImportPlan, onUpdateUsage, defaultOpen = false, embedded = false }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [attachedImage, setAttachedImage] = useState<{
    base64Data: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64Data = dataUrl.split(',')[1];
      setAttachedImage({
        base64Data,
        mimeType: file.type,
        previewUrl: dataUrl,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (!blob) continue;

        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const base64Data = dataUrl.split(',')[1];
          setAttachedImage({
            base64Data,
            mimeType: blob.type,
            previewUrl: dataUrl,
          });
        };
        reader.readAsDataURL(blob);
        break;
      }
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() && !attachedImage) return;
    setLoading(true);
    setFeedback(null);

    try {
      const imageData: ImageAttachment | undefined = attachedImage
        ? { base64Data: attachedImage.base64Data, mimeType: attachedImage.mimeType }
        : undefined;

      const promptText = input.trim() || 'Please analyze this image and extract the power plan details.';
      const result = await processAIRequest(promptText, imageData);

      if (result.type === 'PLAN') {
          onImportPlan(result.data);
          setFeedback({ type: 'success', message: `Added plan: ${result.data.name}` });
          setInput('');
          setAttachedImage(null);
      } else if (result.type === 'USAGE') {
          onUpdateUsage(result.data);
          setFeedback({ type: 'success', message: result.summary || 'Updated usage graph based on your description.' });
          setInput('');
          setAttachedImage(null);
      } else {
          setFeedback({ type: 'error', message: result.message });
      }

    } catch (e) {
      setFeedback({ type: 'error', message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
      "Add Electric Kiwi MoveMaster plan...",
      "I use 30 kWh a day, mostly in the evening",
      "I have an EV that charges from 1am to 5am",
      "Create a flat rate plan at 24 cents",
  ];

  const handleSuggestion = (text: string) => {
      setInput(text);
  };

  if (!isOpen && !embedded) {
      return (
          <button
            onClick={() => setIsOpen(true)}
            className="w-full py-4 px-4 border border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl text-slate-300 hover:border-blue-500 hover:text-white transition-all shadow-lg group flex items-center justify-between"
          >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    ✨
                </div>
                <div className="text-left">
                    <div className="font-semibold">AI Assistant</div>
                    <div className="text-xs text-slate-500 group-hover:text-slate-400">Import plans from text or images, describe usage habits</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-500 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
      )
  }

  return (
    <div className={embedded ? '' : 'bg-slate-800 p-5 rounded-xl border border-slate-700 animate-fade-in shadow-2xl relative overflow-hidden'}>
         {/* Background decoration */}
        {!embedded && <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>}

        {!embedded && (
        <div className="flex justify-between items-center mb-4 relative z-10">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <span className="text-blue-400 text-xl">✨</span>
                AI Energy Assistant
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white bg-slate-700/50 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
        </div>
        )}

        <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap gap-2 mb-2">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => handleSuggestion(s)}
                        className="text-[10px] bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-blue-300 px-2 py-1 rounded-full border border-slate-600 transition-colors"
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Image Preview */}
            {attachedImage && (
              <div className="relative inline-block">
                <img
                  src={attachedImage.previewUrl}
                  alt="Attached plan image"
                  className="h-24 rounded-lg border border-slate-600 object-cover"
                />
                <button
                  onClick={() => setAttachedImage(null)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}

            <textarea
                className="w-full h-24 p-3 bg-slate-900 text-slate-200 rounded-lg border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-sm shadow-inner"
                placeholder={attachedImage ? "Add a note about the image, or just hit submit..." : "How can I help? Paste a plan, upload an image, or describe your daily usage..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                    }
                }}
            />

            <div className="flex justify-between items-center">
                <div className="text-xs flex-1 min-w-0 mr-2">
                    {feedback && (
                        <span className={`flex items-center gap-1.5 ${feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {feedback.type === 'success' ? '✓' : '⚠'} {feedback.message}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Image Upload Button */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                      title="Attach image of a power plan"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading || (!input && !attachedImage)}
                        className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                            loading
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95'
                        }`}
                    >
                        {loading ? (
                            <>
                             <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                            </>
                        ) : (
                            <>Process Request <span className="text-blue-200">→</span></>
                        )}
                    </button>
                </div>
            </div>

            <p className="text-[10px] text-slate-500 text-center pt-2 border-t border-slate-700/50">
                Powered by Gemini. Paste text or images of plans, or describe usage habits. You can also paste images directly (Ctrl+V).
            </p>
        </div>
    </div>
  );
};

export default AIAssistant;
