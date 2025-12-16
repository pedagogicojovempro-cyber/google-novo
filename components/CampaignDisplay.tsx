import React, { useState } from 'react';
import { CampaignStrategy } from '../types';
import { generateCampaignImage } from '../services/geminiService';
import jsPDF from 'jspdf';
import { Download, Image as ImageIcon, Loader2, CheckCircle, Target, Users, MapPin, PenTool, AlertCircle } from 'lucide-react';

interface CampaignDisplayProps {
  strategy: CampaignStrategy;
}

const CampaignDisplay: React.FC<CampaignDisplayProps> = ({ strategy }) => {
  const [loadingImage, setLoadingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    setLoadingImage(true);
    setError(null);
    try {
      const base64Image = await generateCampaignImage(strategy.creativePrompt);
      setGeneratedImage(base64Image);
    } catch (err: any) {
      setError(err.message || "Falha ao gerar imagem. Tente novamente.");
    } finally {
      setLoadingImage(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Header
    doc.setFillColor(16, 185, 129); // Emerald 500
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text("Plano de Campanha", margin, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Objetivo: ${strategy.objective}`, margin, 30);

    let yPos = 55;

    const addSection = (title: string, content: string) => {
      // Check for page break
      if (yPos > 250) {
        doc.addPage();
        yPos = 30;
      }

      doc.setTextColor(33, 33, 33); // Dark Gray
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title.toUpperCase(), margin, yPos);
      yPos += 8;

      doc.setTextColor(66, 66, 66);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      const splitText = doc.splitTextToSize(content, contentWidth);
      doc.text(splitText, margin, yPos);
      
      yPos += (splitText.length * 5) + 15; // spacing
    };

    addSection("Headline (Frase de Impacto)", strategy.headline);
    addSection("Copy (Texto do Anúncio)", strategy.copy);
    addSection("Público-Alvo", strategy.audience);
    addSection("Segmentação", strategy.segmentation);
    addSection("Prompt Criativo (Imagem)", strategy.creativePrompt);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Gerado por TrafficAds AI - Seu Gestor de Tráfego Inteligente", margin, 280);

    // Add Image if exists
    if (generatedImage) {
      doc.addPage();
      doc.setFillColor(33, 33, 33);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("Criativo Gerado", margin, 25);
      
      // Calculate aspect ratio to fit (assuming square 1:1 roughly)
      const imgSize = 150;
      const xOffset = (pageWidth - imgSize) / 2;
      doc.addImage(generatedImage, 'PNG', xOffset, 60, imgSize, imgSize);
      doc.setTextColor(50,50,50);
      doc.setFontSize(10);
      doc.text("Nota: Esta imagem foi gerada por IA baseada no prompt sugerido.", margin, 220);
    }

    doc.save('campanha-facebook-ads.pdf');
  };

  return (
    <div className="w-full bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl mt-6 animate-fade-in-up">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CheckCircle className="h-6 w-6" />
          Estratégia Finalizada
        </h2>
        <button 
          onClick={handleDownloadPDF}
          className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          <Download size={16} />
          Baixar PDF
        </button>
      </div>

      <div className="p-6 grid gap-6 md:grid-cols-2">
        {/* Left Column: Text Content */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <h3 className="text-indigo-400 font-semibold text-sm uppercase mb-2 flex items-center gap-2">
              <PenTool size={16}/> Headline
            </h3>
            <p className="text-white text-lg font-bold leading-tight">{strategy.headline}</p>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <h3 className="text-indigo-400 font-semibold text-sm uppercase mb-2">Copy Sugerida</h3>
            <p className="text-slate-300 whitespace-pre-wrap text-sm">{strategy.copy}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <h3 className="text-indigo-400 font-semibold text-xs uppercase mb-1 flex items-center gap-1">
                  <Users size={14}/> Público
                </h3>
                <p className="text-slate-300 text-xs">{strategy.audience}</p>
             </div>
             <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <h3 className="text-indigo-400 font-semibold text-xs uppercase mb-1 flex items-center gap-1">
                  <MapPin size={14}/> Segmentação
                </h3>
                <p className="text-slate-300 text-xs">{strategy.segmentation}</p>
             </div>
          </div>
        </div>

        {/* Right Column: Creative & Image */}
        <div className="flex flex-col space-y-4">
           <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex-grow">
            <h3 className="text-indigo-400 font-semibold text-sm uppercase mb-2 flex items-center gap-2">
              <Target size={16}/> Prompt do Criativo
            </h3>
            <p className="text-slate-400 text-sm italic mb-4">"{strategy.creativePrompt}"</p>
            
            <div className="mt-auto border-t border-slate-700 pt-4">
              {!generatedImage ? (
                <div className="flex flex-col items-center justify-center h-48 bg-slate-800 rounded-lg border border-dashed border-slate-600">
                  {loadingImage ? (
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">Gerando criativo com IA...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-10 w-10 text-slate-500 mx-auto mb-2" />
                      <button 
                        onClick={handleGenerateImage}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition shadow-lg shadow-indigo-500/20"
                      >
                        Gerar Imagem do Anúncio
                      </button>
                      <p className="text-slate-500 text-xs mt-2 max-w-[200px]">
                        Cria uma imagem .png baseada no prompt acima
                      </p>
                    </div>
                  )}
                  {error && (
                    <div className="flex items-center justify-center gap-2 mt-3 text-red-400 text-xs text-center px-2">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative group">
                   <img src={generatedImage} alt="Ad Creative" className="w-full rounded-lg shadow-md" />
                   <a 
                    href={generatedImage} 
                    download="creative.png"
                    className="absolute bottom-2 right-2 bg-black/70 text-white p-2 rounded-full hover:bg-black transition opacity-0 group-hover:opacity-100"
                    title="Baixar PNG"
                   >
                     <Download size={16} />
                   </a>
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
