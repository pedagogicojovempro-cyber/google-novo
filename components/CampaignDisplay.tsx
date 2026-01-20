import React, { useState, useEffect } from 'react';
import { CampaignStrategy } from '../types';
import { generateCampaignImage } from '../services/geminiService';
import jsPDF from 'jspdf';
import { Download, Image as ImageIcon, Loader2, CheckCircle, Target, Users, MapPin, PenTool, AlertCircle, DollarSign, FlaskConical, ArrowRight, TrendingUp } from 'lucide-react';

interface CampaignDisplayProps {
  strategy: CampaignStrategy;
}

const CampaignDisplay: React.FC<CampaignDisplayProps> = ({ strategy }) => {
  const [loadingImage, setLoadingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setGeneratedImage(null);
  }, [strategy.creativePrompt]);

  const handleGenerateImage = async () => {
    setLoadingImage(true);
    setError(null);
    try {
      const base64Image = await generateCampaignImage(String(strategy.creativePrompt));
      setGeneratedImage(base64Image);
    } catch (err: any) {
      setError(err.message || "Falha ao gerar imagem.");
    } finally {
      setLoadingImage(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    const stripEmojis = (val: any) => {
      const str = String(val);
      return str.replace(/[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu, '');
    };

    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text("Plano de Campanha", margin, 20);
    doc.setFontSize(12);
    doc.text(`Objetivo: ${stripEmojis(strategy.objective)}`, margin, 30);

    let yPos = 55;
    const addSection = (title: string, content: any) => {
      const text = stripEmojis(content);
      if (yPos > 250) { doc.addPage(); yPos = 30; }
      doc.setTextColor(33, 33, 33);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title.toUpperCase(), margin, yPos);
      yPos += 8;
      doc.setTextColor(66, 66, 66);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const splitText = doc.splitTextToSize(text, contentWidth);
      doc.text(splitText, margin, yPos);
      yPos += (splitText.length * 5) + 15;
    };

    addSection("Headline", strategy.headline);
    addSection("Copy", strategy.copy);
    addSection("Público-Alvo", strategy.audience);
    addSection("Segmentação", strategy.segmentation);
    addSection("Orçamento", strategy.budget);
    if (strategy.estimatedResults) addSection("Estimativa", strategy.estimatedResults);

    doc.save('campanha.pdf');
  };

  return (
    <div className="w-full bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl mt-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CheckCircle className="h-6 w-6" />
          Estratégia Finalizada
        </h2>
        <button onClick={handleDownloadPDF} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-2">
          <Download size={16} /> Baixar PDF
        </button>
      </div>

      <div className="p-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <h3 className="text-indigo-400 font-semibold text-sm uppercase mb-2 flex items-center gap-2">
              <PenTool size={16}/> Headline
            </h3>
            <p className="text-white text-lg font-bold leading-tight">{String(strategy.headline)}</p>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <h3 className="text-indigo-400 font-semibold text-sm uppercase mb-2">Copy Sugerida</h3>
            <p className="text-slate-300 whitespace-pre-wrap text-sm">{String(strategy.copy)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <h3 className="text-indigo-400 font-semibold text-xs uppercase mb-1 flex items-center gap-1"><Users size={14}/> Público</h3>
                <p className="text-slate-300 text-xs">{String(strategy.audience)}</p>
             </div>
             <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <h3 className="text-indigo-400 font-semibold text-xs uppercase mb-1 flex items-center gap-1"><MapPin size={14}/> Local</h3>
                <p className="text-slate-300 text-xs">{String(strategy.segmentation)}</p>
             </div>
             <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 col-span-2">
                <h3 className="text-indigo-400 font-semibold text-xs uppercase mb-1 flex items-center gap-1"><DollarSign size={14}/> Investimento</h3>
                <p className="text-emerald-400 text-xs font-medium">{String(strategy.budget)}</p>
             </div>
             {strategy.estimatedResults && (
                <div className="bg-emerald-900/30 p-3 rounded-lg border border-emerald-500/30 col-span-2">
                    <h3 className="text-emerald-400 font-semibold text-xs uppercase mb-1 flex items-center gap-1"><TrendingUp size={14}/> Resultados Estimados</h3>
                    <p className="text-emerald-100 text-xs font-medium">{String(strategy.estimatedResults)}</p>
                </div>
             )}
          </div>
        </div>

        <div className="flex flex-col space-y-4">
           {strategy.abTestSuggestion && (
            <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-lg">
              <h3 className="text-purple-400 font-semibold text-sm uppercase mb-3 flex items-center gap-2"><FlaskConical size={16}/> Teste A/B</h3>
              <div className="space-y-2">
                <p className="text-white font-medium italic">"{String(strategy.abTestSuggestion.variation)}"</p>
                <p className="text-slate-400 text-xs pt-2 border-t border-purple-500/20">
                  <span className="text-purple-400 font-bold">Por quê: </span>
                  {String(strategy.abTestSuggestion.rationale)}
                </p>
              </div>
            </div>
           )}

           <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex-grow flex flex-col">
            <h3 className="text-indigo-400 font-semibold text-sm uppercase mb-2 flex items-center gap-2"><Target size={16}/> Imagem do Anúncio</h3>
            <p className="text-slate-400 text-sm italic mb-4">"{String(strategy.creativePrompt)}"</p>
            <div className="mt-auto pt-4 border-t border-slate-700">
              {!generatedImage ? (
                <div className="flex flex-col items-center justify-center h-48 bg-slate-800 rounded-lg border border-dashed border-slate-600">
                  {loadingImage ? (
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">Criando imagem...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-10 w-10 text-slate-500 mx-auto mb-2" />
                      <button onClick={handleGenerateImage} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition shadow-lg shadow-indigo-500/20">
                        Gerar Criativo
                      </button>
                    </div>
                  )}
                  {error && <p className="text-red-400 text-xs mt-3 px-2">{error}</p>}
                </div>
              ) : (
                <div className="relative group">
                   <img src={generatedImage} alt="Criativo" className="w-full rounded-lg shadow-md" />
                   <a href={generatedImage} download="anuncio.png" className="absolute bottom-2 right-2 bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"><Download size={16} /></a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDisplay;