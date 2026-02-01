import React, { useState, useRef } from 'react';
import { processAIRequest, ImageAttachment } from '../services/geminiService';
import { PowerPlan, UsageProfile } from '../types';

interface AISidebarProps {
  onImportPlan: (plan: PowerPlan) => void;
  onUpdateUsage: (usage: UsageProfile | ((prev: UsageProfile) => UsageProfile)) => void;
}

const AISidebar: React.FC<AISidebarProps> = ({ onImportPlan, onUpdateUsage }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
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
      setAttachedImage({ base64Data, mimeType: file.type, previewUrl: dataUrl });
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
          setAttachedImage({ base64Data, mimeType: blob.type, previewUrl: dataUrl });
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
      setFeedback({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleMockImagePrompt = async () => {
    try {
      const response = await fetch('/mock-aurora-flyer.jpg');
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64Data = dataUrl.split(',')[1];
        setAttachedImage({ base64Data, mimeType: 'image/jpeg', previewUrl: dataUrl });
        setInput('Please analyze this Aurora Energy flyer and extract the power plan details.');
      };
      reader.readAsDataURL(blob);
    } catch {
      // If mock image fails, just set the text prompt
      setInput('Aurora Energy Standard Rate Power Plan: 26.5c per kWh standard rate, $150 joining credit applied to first bill, Weekend usage is FREE after 5pm Friday to 7am Monday.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h3 className="font-bold text-slate-200 flex items-center gap-2">
          <span className="text-blue-400 text-lg">&#10024;</span>
          AI Energy Assistant
        </h3>
        <p className="text-[11px] text-slate-500 mt-1">Import plans, analyze images, set usage patterns</p>
      </div>

      {/* Categorized Example Prompts */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Category 1: Usage Profile */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2">
            <svg className="w-3.5 h-3.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Set Usage Profile
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setInput('I use 30 kWh a day, mostly in the evening')}
              className="text-left text-[11px] bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-blue-300 px-2.5 py-1.5 rounded border border-slate-700/50 transition-colors truncate"
            >
              I use 30 kWh a day, mostly in the evening
            </button>
            <button
              onClick={() => setInput('I have an EV that charges from 1am to 5am')}
              className="text-left text-[11px] bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-blue-300 px-2.5 py-1.5 rounded border border-slate-700/50 transition-colors truncate"
            >
              I have an EV that charges from 1am to 5am
            </button>
          </div>
        </div>

        {/* Category 2: Add Plan via Text */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2">
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Add Plan via Text
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setInput('Add Electric Kiwi MoveMaster plan with peak hours 7am-9am and 5pm-9pm at 53c, off-peak at 26.5c, and free hour daily')}
              className="text-left text-[11px] bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-blue-300 px-2.5 py-1.5 rounded border border-slate-700/50 transition-colors line-clamp-2"
            >
              Add Electric Kiwi MoveMaster plan...
            </button>
            <button
              onClick={() => setInput('Create a flat rate plan at 24 cents per kWh with $2.50 daily charge from Test Energy')}
              className="text-left text-[11px] bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-blue-300 px-2.5 py-1.5 rounded border border-slate-700/50 transition-colors line-clamp-2"
            >
              Create a flat rate plan at 24 cents...
            </button>
          </div>
        </div>

        {/* Category 3: Add Plan from Image */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2">
            <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Add Plan from Image
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={handleMockImagePrompt}
              className="text-left text-[11px] bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-purple-300 px-2.5 py-1.5 rounded border border-slate-700/50 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Try with Aurora Energy flyer
            </button>
            <p className="text-[10px] text-slate-600 px-1">
              Upload or paste any power plan image, or click above to test with a sample.
            </p>
          </div>
        </div>
      </div>

      {/* Input area - pinned to bottom */}
      <div className="p-4 border-t border-slate-700 space-y-3 mt-auto">
        {/* Image Preview */}
        {attachedImage && (
          <div className="relative inline-block">
            <img
              src={attachedImage.previewUrl}
              alt="Attached plan image"
              className="h-16 rounded-lg border border-slate-600 object-cover"
            />
            <button
              onClick={() => setAttachedImage(null)}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-500 transition-colors"
            >
              &#10005;
            </button>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className={`text-[11px] flex items-center gap-1.5 ${feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {feedback.type === 'success' ? '&#10003;' : '&#9888;'} {feedback.message}
          </div>
        )}

        {/* Textarea */}
        <textarea
          className="w-full h-20 p-2.5 bg-slate-900 text-slate-200 rounded-lg border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-[12px] shadow-inner"
          placeholder={attachedImage ? 'Add a note about the image, or just hit submit...' : 'Describe a plan, paste an image, or describe your usage...'}
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

        {/* Action bar */}
        <div className="flex items-center gap-2">
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || (!input && !attachedImage)}
            className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
              loading
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>Submit &#8594;</>
            )}
          </button>
        </div>

        <p className="text-[10px] text-slate-600 text-center">
          Powered by Gemini. Paste images directly (Ctrl+V).
        </p>
      </div>
    </div>
  );
};

export default AISidebar;
